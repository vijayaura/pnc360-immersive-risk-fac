const DEFAULT_VIDEO_COMPRESSION_THRESHOLD = 10 * 1024 * 1024;
const DEFAULT_MAX_WIDTH = 1280;
const DEFAULT_VIDEO_BITRATE = 1_500_000;

interface VideoCompressionOptions {
  thresholdBytes?: number;
  maxWidth?: number;
  videoBitsPerSecond?: number;
}

type RecorderEventTarget = HTMLVideoElement | MediaRecorder;

type CapturableVideoElement = HTMLVideoElement & {
  captureStream?: () => MediaStream;
};

export async function compressVideo(
  file: File,
  options: VideoCompressionOptions = {},
): Promise<File> {
  const thresholdBytes = options.thresholdBytes ?? DEFAULT_VIDEO_COMPRESSION_THRESHOLD;
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;
  const videoBitsPerSecond = options.videoBitsPerSecond ?? DEFAULT_VIDEO_BITRATE;

  if (!(file instanceof File) || !file.type?.startsWith('video/') || file.size <= thresholdBytes) {
    return file;
  }

  if (typeof document === 'undefined' || typeof MediaRecorder === 'undefined') {
    return file;
  }

  const sourceUrl = URL.createObjectURL(file);
  const video = document.createElement('video') as CapturableVideoElement;
  const canvas = document.createElement('canvas');

  try {
    video.src = sourceUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    await waitForEvent(video, 'loadedmetadata');

    const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));

    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }

    const stream = canvas.captureStream(24);
    const sourceStream = typeof video.captureStream === 'function' ? video.captureStream() : null;
    sourceStream?.getAudioTracks().forEach((track) => {
      stream.addTrack(track);
    });

    const mimeType = pickSupportedVideoMimeType(file.type);
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond,
    });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data?.size) {
        chunks.push(event.data);
      }
    };

    const stopPromise = waitForEvent(recorder, 'stop');

    await video.play();
    recorder.start(1000);

    await drawVideoToCanvas(video, context, canvas);

    if (recorder.state !== 'inactive') {
      recorder.stop();
    }

    await stopPromise;

    const compressedBlob = new Blob(chunks, { type: mimeType });
    if (!compressedBlob.size || compressedBlob.size >= file.size) {
      return file;
    }

    return new File([compressedBlob], withVideoExtension(file.name, mimeType), {
      type: mimeType,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn('Video compression failed; using original file.', error);
    return file;
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(sourceUrl);
  }
}

function waitForEvent(target: RecorderEventTarget, eventName: string): Promise<Event> {
  return new Promise((resolve, reject) => {
    const handleEvent = (event: Event) => {
      cleanup();
      resolve(event);
    };
    const handleError = (event: Event) => {
      cleanup();
      reject(event instanceof ErrorEvent ? event.error : new Error(`Failed while waiting for ${eventName}.`));
    };
    const cleanup = () => {
      target.removeEventListener(eventName, handleEvent);
      target.removeEventListener('error', handleError);
    };

    target.addEventListener(eventName, handleEvent, { once: true });
    target.addEventListener('error', handleError, { once: true });
  });
}

function drawVideoToCanvas(
  video: HTMLVideoElement,
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
): Promise<void> {
  return new Promise((resolve) => {
    const drawFrame = () => {
      if (video.ended || video.paused) {
        resolve();
        return;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(drawFrame);
    };

    video.addEventListener('ended', () => resolve(), { once: true });
    drawFrame();
  });
}

function pickSupportedVideoMimeType(sourceType: string): string {
  const candidates = [
    sourceType,
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ].filter(Boolean);

  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || 'video/webm';
}

function withVideoExtension(fileName: string, mimeType: string): string {
  const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const baseName = fileName.replace(/\.[^.]+$/, '') || 'compressed-video';
  return `${baseName}.${extension}`;
}
