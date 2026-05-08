import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import JSZip from "jszip";
import { extractText as extractPdfText } from "unpdf";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

const SUBMISSION_KEYWORDS = [
  "submission", "risk survey", "quote request", "insurance",
  "underwriting", "property risk", "survey report", "slip",
  "placement", "facultative", "reinsurance",
];

interface AttachmentInfo {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
}

interface EmailCandidate {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body: string;
  attachments: AttachmentInfo[];
}

function decodeBase64Url(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Buffer.from(padded, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

function extractBody(payload: any): string {
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        const html = decodeBase64Url(part.body.data);
        return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      }
    }
    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }
  return "";
}

function extractAttachments(payload: any): AttachmentInfo[] {
  const attachments: AttachmentInfo[] = [];

  function walk(part: any) {
    if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
      attachments.push({
        attachmentId: part.body.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType || "application/octet-stream",
        size: part.body.size || 0,
      });
    }
    if (part.parts) {
      for (const child of part.parts) {
        walk(child);
      }
    }
  }

  walk(payload);
  return attachments;
}

const MAX_TEXT_PER_ATTACHMENT = 60_000;

function cleanExtractedText(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]+/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Extract readable text using PDF.js first; fall back to lightweight stream parsing. */
async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const { text } = await extractPdfText(new Uint8Array(buffer), { mergePages: true });
    const cleaned = cleanExtractedText(text);
    if (cleaned.length > 500 && (cleaned.match(/[a-zA-Z]/g) || []).length > 150) {
      return cleaned.slice(0, MAX_TEXT_PER_ATTACHMENT);
    }
  } catch (error) {
    console.error("[EmailIngestion] PDF.js extraction failed", error);
  }

  const raw = buffer.toString("binary");
  const textChunks: string[] = [];
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match: RegExpExecArray | null;
  while ((match = btEtRegex.exec(raw)) !== null) {
    const block = match[1];
    const textParts = /\(([^)]*)\)/g;
    let partMatch: RegExpExecArray | null;
    while ((partMatch = textParts.exec(block)) !== null) textChunks.push(partMatch[1]);
  }

  return cleanExtractedText(textChunks.join(" ").replace(/\\n/g, "\n")).slice(0, MAX_TEXT_PER_ATTACHMENT);
}

function decodeXmlText(value: string): string {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const documentFiles = Object.keys(zip.files).filter((name) => /^word\/(document|header\d+|footer\d+|footnotes|endnotes)\.xml$/.test(name));
  const chunks: string[] = [];
  for (const file of documentFiles) {
    const xml = await zip.file(file)?.async("string");
    if (!xml) continue;
    const normalized = xml.replace(/<w:tab\/>/g, "\t").replace(/<w:br\/>/g, "\n").replace(/<\/w:p>/g, "\n");
    const textParts = [...normalized.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((match) => decodeXmlText(match[1]));
    chunks.push(textParts.join(" "));
  }
  return cleanExtractedText(chunks.join("\n")).slice(0, MAX_TEXT_PER_ATTACHMENT);
}

function extractLegacyOfficeText(buffer: Buffer): string {
  const candidates: string[] = [];
  for (const encoding of ["utf16le", "latin1"] as const) {
    const raw = buffer.toString(encoding);
    const runs = raw.match(/[A-Za-z0-9][A-Za-z0-9\s.,:;()/%&\-–—'"#@+]{5,}/g) || [];
    candidates.push(runs.map((part) => part.trim()).join("\n"));
  }
  let text = cleanExtractedText(candidates.join("\n"));
  const anchors = ["Policy Type", "Name of the Insured", "Business activity", "Location /Description of risks", "Total Sum Insured"];
  const start = Math.min(...anchors.map((anchor) => text.indexOf(anchor)).filter((idx) => idx >= 0));
  if (Number.isFinite(start) && start > 0) text = text.slice(start);
  return text.slice(0, MAX_TEXT_PER_ATTACHMENT);
}

async function extractXlsxText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const sharedXml = await zip.file("xl/sharedStrings.xml")?.async("string");
  const sharedStrings = sharedXml
    ? [...sharedXml.matchAll(/<si[\s\S]*?<\/si>/g)].map((match) =>
        cleanExtractedText([...match[0].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((part) => decodeXmlText(part[1])).join(" "))
      )
    : [];
  const rows: string[] = [];
  const sheetFiles = Object.keys(zip.files).filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
  for (const sheetName of sheetFiles) {
    const xml = await zip.file(sheetName)?.async("string");
    if (!xml) continue;
    rows.push(`Sheet: ${sheetName.split("/").pop()?.replace(".xml", "") || sheetName}`);
    for (const row of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      const values = [...row[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)].map((cell) => {
        const value = cell[2].match(/<v>([\s\S]*?)<\/v>/)?.[1] || "";
        if (!value) return "";
        return cell[1].includes('t="s"') ? sharedStrings[Number(value)] || value : value;
      }).filter(Boolean);
      if (values.length) rows.push(values.join(" | "));
    }
  }
  return cleanExtractedText(rows.join("\n")).slice(0, MAX_TEXT_PER_ATTACHMENT);
}

export const checkInboxForSubmissions = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      maxResults: z.number().min(1).max(50).optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    const gmailKey = process.env.GOOGLE_MAIL_API_KEY;
    if (!apiKey) return { emails: [], error: "LOVABLE_API_KEY not configured" };
    if (!gmailKey) return { emails: [], error: "Gmail not connected. Please connect your Gmail account." };

    try {
      const query = `is:unread (${SUBMISSION_KEYWORDS.map(k => `"${k}"`).join(" OR ")})`;
      const listRes = await fetch(
        `${GATEWAY_URL}/users/me/messages?maxResults=${data.maxResults || 20}&q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "X-Connection-Api-Key": gmailKey,
          },
        }
      );

      if (!listRes.ok) {
        const errBody = await listRes.text();
        return { emails: [], error: `Gmail API error [${listRes.status}]: ${errBody}` };
      }

      const listData = await listRes.json();
      const messageIds: string[] = (listData.messages || []).map((m: any) => m.id);

      if (messageIds.length === 0) {
        return { emails: [], error: null };
      }

      const emails: EmailCandidate[] = [];
      for (const msgId of messageIds.slice(0, 10)) {
        const msgRes = await fetch(
          `${GATEWAY_URL}/users/me/messages/${msgId}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "X-Connection-Api-Key": gmailKey,
            },
          }
        );
        if (!msgRes.ok) continue;

        const msg = await msgRes.json();
        const headers = msg.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

        const body = extractBody(msg.payload);
        const attachments = extractAttachments(msg.payload);

        emails.push({
          id: msg.id,
          threadId: msg.threadId,
          subject: getHeader("Subject"),
          from: getHeader("From"),
          date: getHeader("Date"),
          snippet: msg.snippet || "",
          body: body.slice(0, 15000),
          attachments,
        });
      }

      return { emails, error: null };
    } catch (e) {
      return { emails: [], error: e instanceof Error ? e.message : "Unknown error" };
    }
  });

async function downloadAttachmentText(
  messageId: string,
  attachment: AttachmentInfo,
  apiKey: string,
  gmailKey: string,
): Promise<{ filename: string; text: string; parsed: boolean; parseStatus: string }> {
  try {
    const res = await fetch(
      `${GATEWAY_URL}/users/me/messages/${messageId}/attachments/${attachment.attachmentId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "X-Connection-Api-Key": gmailKey,
        },
      }
    );
    if (!res.ok) {
      return { filename: attachment.filename, text: `[Failed to download: HTTP ${res.status}]`, parsed: false, parseStatus: `download failed: HTTP ${res.status}` };
    }

    const json = await res.json();
    const b64Data = (json.data || "").replace(/-/g, "+").replace(/_/g, "/");
    const buffer = Buffer.from(b64Data, "base64");

    const mime = attachment.mimeType.toLowerCase();
    const fname = attachment.filename.toLowerCase();

    // Text-based files
    if (
      mime.includes("text/") ||
      fname.endsWith(".txt") || fname.endsWith(".csv") || fname.endsWith(".json") ||
      fname.endsWith(".xml") || fname.endsWith(".html") || fname.endsWith(".htm")
    ) {
      let text = buffer.toString("utf-8");
      if (mime.includes("html")) {
        text = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      }
      return { filename: attachment.filename, text: cleanExtractedText(text).slice(0, MAX_TEXT_PER_ATTACHMENT), parsed: true, parseStatus: "text extracted" };
    }

    // PDF files - extract text from streams
    if (mime === "application/pdf" || fname.endsWith(".pdf")) {
      const pdfText = await extractTextFromPdfBuffer(buffer);
      if (pdfText.length > 20) {
        return { filename: attachment.filename, text: pdfText, parsed: true, parseStatus: `${pdfText.length} chars extracted from PDF` };
      }
      // If no text extracted (scanned PDF), return note
      return {
        filename: attachment.filename,
        text: `[PDF attachment: ${attachment.filename}, ${Math.round(attachment.size / 1024)}KB - appears to be scanned/image-based, text extraction limited]`,
        parsed: false,
        parseStatus: "PDF text extraction produced too little text; likely scanned/image-based",
      };
    }

    // Word documents - try to extract text from the XML content
    if (
      mime.includes("wordprocessingml") || mime.includes("msword") ||
      fname.endsWith(".docx") || fname.endsWith(".doc")
    ) {
      const text = fname.endsWith(".docx") || mime.includes("wordprocessingml")
        ? await extractDocxText(buffer)
        : extractLegacyOfficeText(buffer);
      if (text.length > 80) return { filename: attachment.filename, text, parsed: true, parseStatus: `${text.length} chars extracted from Word document` };
      return {
        filename: attachment.filename,
        text: `[Word document: ${attachment.filename}, ${Math.round(attachment.size / 1024)}KB - could not extract text]`,
        parsed: false,
        parseStatus: "Word extraction produced too little text",
      };
    }

    // Excel/spreadsheet
    if (
      mime.includes("spreadsheet") || mime.includes("excel") ||
      fname.endsWith(".xlsx") || fname.endsWith(".xls") || fname.endsWith(".csv")
    ) {
      const text = fname.endsWith(".xlsx") || mime.includes("spreadsheet")
        ? await extractXlsxText(buffer)
        : cleanExtractedText(buffer.toString("utf-8")).slice(0, MAX_TEXT_PER_ATTACHMENT);
      if (text.length > 20) return { filename: attachment.filename, text, parsed: true, parseStatus: `${text.length} chars extracted from spreadsheet` };
      return {
        filename: attachment.filename,
        text: `[Spreadsheet: ${attachment.filename}, ${Math.round(attachment.size / 1024)}KB]`,
        parsed: false,
        parseStatus: "spreadsheet extraction produced no readable text",
      };
    }

    // Unknown binary - just note it
    return {
      filename: attachment.filename,
      text: `[Attachment: ${attachment.filename}, ${mime}, ${Math.round(attachment.size / 1024)}KB - binary file, not parsed]`,
      parsed: false,
      parseStatus: "unsupported binary format",
    };
  } catch (e) {
    return {
      filename: attachment.filename,
      text: `[Error downloading ${attachment.filename}: ${e instanceof Error ? e.message : "unknown"}]`,
      parsed: false,
      parseStatus: e instanceof Error ? e.message : "unknown extraction error",
    };
  }
}

export const processEmailSubmission = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({
      emailId: z.string(),
      subject: z.string(),
      from: z.string(),
      body: z.string().max(15000),
      date: z.string(),
      attachments: z.array(z.object({
        attachmentId: z.string(),
        filename: z.string(),
        mimeType: z.string(),
        size: z.number(),
      })).optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    const gmailKey = process.env.GOOGLE_MAIL_API_KEY;
    if (!apiKey) return { submission: null, error: "LOVABLE_API_KEY not configured" };

    // Download and extract text from all attachments
    let attachmentContent = "";
    const attachmentSummaries: Array<{ filename: string; size: number; mimeType: string; parsed: boolean; parseStatus: string; textChars: number }> = [];
    if (data.attachments && data.attachments.length > 0 && gmailKey) {
      console.log(`[EmailIngestion] Processing ${data.attachments.length} attachment(s) for email ${data.emailId}`);
      const results = await Promise.all(
        data.attachments.map(att =>
          downloadAttachmentText(data.emailId, att, apiKey, gmailKey)
        )
      );
      for (const [index, r] of results.entries()) {
        const original = data.attachments[index];
        attachmentSummaries.push({
          filename: r.filename,
          size: original?.size || 0,
          mimeType: original?.mimeType || "application/octet-stream",
          parsed: r.parsed,
          parseStatus: r.parseStatus,
          textChars: r.text.length,
        });
        attachmentContent += `\n\n--- ATTACHMENT: ${r.filename} ---\n${r.text}\n--- END ATTACHMENT ---`;
      }
      console.log(`[EmailIngestion] Extracted text from attachments: ${results.map(r => `${r.filename} (${r.text.length} chars)`).join(", ")}`);
    }

    const prompt = `You are an expert P&C insurance underwriter in the Middle East/GCC market. You received a submission email with ${data.attachments?.length || 0} attachment(s). Extract ALL property and risk details to create a new submission entry.

CRITICAL INSTRUCTIONS:
- The MOST IMPORTANT data is usually in the ATTACHMENTS (PDF slips, survey reports, placement documents)
- Extract the EXACT property/building name as mentioned in the documents — do NOT use generic names like "Unnamed"
- Extract the EXACT address, coordinates, sum insured, construction details, fire protection info
- Parse broker names, insurer names, share percentages, dates from the documents
- If documents contain multiple properties, focus on the primary/first one
- Do not use default/mock values when a field is not present; infer only when clearly supported by the source text
- CRITICALLY IMPORTANT: Determine the correct COUNTRY from the address (e.g. Sohar = Oman, Dubai = UAE, Riyadh = Saudi Arabia). Do NOT default to UAE.
- CRITICALLY IMPORTANT: Provide ACCURATE latitude and longitude for the property location. Look up the actual city/area coordinates.
- CRITICALLY IMPORTANT: Extract ALL claims/loss history from any claims spreadsheet, loss register, or claims history document. Extract EVERY individual claim with exact dates, amounts in AED, peril types, and descriptions. Do NOT skip or summarize claims — list each one individually.
- Extract the correct number of floors, year built, and construction type from survey reports.

DOCUMENT INVENTORY:
${attachmentSummaries.length ? attachmentSummaries.map((a) => `- ${a.filename} (${Math.round(a.size / 1024)}KB, ${a.mimeType}): ${a.parseStatus}`).join("\n") : "- No attachments detected"}

EMAIL SUBJECT: ${data.subject}
FROM: ${data.from}
DATE: ${data.date}

EMAIL BODY:
${data.body || "(Empty body)"}
${attachmentContent ? `\nATTACHMENTS CONTENT:${attachmentContent}` : "\n(No attachments or attachment content could not be extracted)"}

Extract all property and risk information. Use EXACT values from the documents where available. Only use reasonable assumptions for fields not mentioned at all. Pay special attention to claims history spreadsheets — extract every claim row with date, peril, description, gross paid, net paid, reserves, and status.`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-5",
          messages: [{ role: "user", content: prompt }],
          tools: [{
            type: "function",
            function: {
              name: "create_submission",
              description: "Create a property submission from email content and attachments",
              parameters: {
                type: "object",
                properties: {
                  propertyName: { type: "string", description: "EXACT name of the property/building from documents — never use 'Unnamed'" },
                  address: { type: "string", description: "Full street address from documents" },
                  city: { type: "string", description: "City (e.g. Dubai, Abu Dhabi, Sohar, Muscat)" },
                  country: { type: "string", description: "Country name (e.g. UAE, Oman, Saudi Arabia, Bahrain). Determine from the address or location." },
                  type: { type: "string", enum: ["warehouse", "office", "retail", "industrial", "residential"] },
                  constructionMaterial: { type: "string" },
                  floors: { type: "number" },
                  yearBuilt: { type: "number" },
                  occupancy: { type: "string" },
                  occupancyCapacity: { type: "number" },
                  sumInsured: { type: "number", description: "Total sum insured in AED" },
                  riskScore: { type: "number", description: "Estimated risk score 0-100" },
                  broker: { type: "string", description: "Broker name from email or documents" },
                  insurerName: { type: "string", description: "Insurer/cedant name from documents" },
                  shareOffered: { type: "number", description: "Percentage share offered" },
                  reinsuranceBroker: { type: "string" },
                  sprinklers: { type: "boolean" },
                  alarms: { type: "boolean" },
                  extinguishers: { type: "boolean" },
                  hydrantNearby: { type: "boolean" },
                  electricalCondition: { type: "string", enum: ["good", "fair", "poor"] },
                  plumbingCondition: { type: "string", enum: ["good", "fair", "poor"] },
                  roofCondition: { type: "string", enum: ["good", "fair", "poor"] },
                  floodZone: { type: "boolean" },
                  nearCoast: { type: "boolean" },
                  nearIndustrial: { type: "boolean" },
                  lat: { type: "number", description: "Latitude of the property location. Use actual coordinates — e.g. Sohar Oman ~24.35, Dubai ~25.2, Abu Dhabi ~24.45" },
                  lng: { type: "number", description: "Longitude of the property location. Use actual coordinates — e.g. Sohar Oman ~56.73, Dubai ~55.27, Abu Dhabi ~54.65" },
                  riskStartDate: { type: "string", description: "Policy/risk inception date if stated, ISO yyyy-mm-dd when possible" },
                  dateApproached: { type: "string", description: "Submission/approach date if stated, ISO yyyy-mm-dd when possible" },
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        severity: { type: "string", enum: ["high", "medium", "low"] },
                        confidence: { type: "number" },
                        category: { type: "string", enum: ["fire", "flood", "structural", "environmental", "security"] },
                      },
                      required: ["text", "severity", "confidence", "category"],
                    },
                  },
                  claims: {
                    type: "array",
                    description: "Loss/claims history extracted from documents. Extract ALL claims with exact dates, amounts, perils, and descriptions.",
                    items: {
                      type: "object",
                      properties: {
                        date: { type: "string", description: "Claim date in YYYY-MM-DD format" },
                        peril: { type: "string", enum: ["fire", "flood", "windstorm", "earthquake", "theft", "liability", "water_damage", "electrical"] },
                        description: { type: "string", description: "Description of the loss event" },
                        grossPaid: { type: "number", description: "Gross paid amount in AED" },
                        netPaid: { type: "number", description: "Net paid amount in AED" },
                        reserves: { type: "number", description: "Outstanding reserves in AED, 0 if closed" },
                        status: { type: "string", enum: ["closed", "open", "reopened"] },
                      },
                      required: ["date", "peril", "description", "grossPaid", "netPaid", "reserves", "status"],
                    },
                  },
                  summary: { type: "string", description: "Brief summary of the submission" },
                },
                required: ["propertyName", "city", "country", "type", "sumInsured", "riskScore", "broker", "lat", "lng", "insights", "claims", "summary"],
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "create_submission" } },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const body = await response.text();
        return { submission: null, error: `AI error (${response.status}): ${body.slice(0, 300)}` };
      }

      const result = await response.json();
      const tc = result.choices?.[0]?.message?.tool_calls?.[0];
      if (!tc) return { submission: null, error: "No structured response from AI" };

      let parsed: any;
      try {
        parsed = JSON.parse(tc.function.arguments);
      } catch {
        return { submission: null, error: "Failed to parse AI response" };
      }

      // Mark email as read via Gmail API
      if (gmailKey) {
        try {
          await fetch(`${GATEWAY_URL}/users/me/messages/${data.emailId}/modify`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "X-Connection-Api-Key": gmailKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
          });
        } catch {
          // non-critical
        }
      }

      return {
        submission: parsed,
        error: null,
        attachmentsParsed: attachmentSummaries,
      };
    } catch (e) {
      return { submission: null, error: e instanceof Error ? e.message : "Unknown error" };
    }
  });
