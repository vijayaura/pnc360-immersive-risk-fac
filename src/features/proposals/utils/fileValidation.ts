import type { FieldValidation } from '@/features/product-config/proposal-form/api/proposalFormDesign';

type FileValidationConfig = {
  allowedExtensions: string[];
  maxFileSizeInMb?: number;
};

function normalizeExtension(value: string): string {
  return value.trim().toLowerCase().replace(/^\./, '');
}

export function getFileValidationConfig(validations?: FieldValidation[]): FileValidationConfig {
  const allowedTypesValue = validations?.find((validation) => validation.type === 'allowedTypes')?.value;
  const maxFileSizeValue = validations?.find((validation) => validation.type === 'maxFileSize')?.value;

  const allowedExtensions =
    typeof allowedTypesValue === 'string'
      ? allowedTypesValue
          .split(',')
          .map(normalizeExtension)
          .filter(Boolean)
      : [];

  const parsedMaxFileSize =
    maxFileSizeValue === undefined || maxFileSizeValue === null ? undefined : Number(maxFileSizeValue);

  return {
    allowedExtensions,
    maxFileSizeInMb:
      parsedMaxFileSize !== undefined && Number.isFinite(parsedMaxFileSize) && parsedMaxFileSize > 0
        ? parsedMaxFileSize
        : undefined,
  };
}

export function buildFileAcceptAttr(validations?: FieldValidation[]): string | undefined {
  const { allowedExtensions } = getFileValidationConfig(validations);
  if (allowedExtensions.length === 0) return undefined;
  return allowedExtensions.map((extension) => `.${extension}`).join(',');
}

export function validateFileAgainstRules(
  file: File,
  fieldLabel: string,
  validations?: FieldValidation[],
): string | null {
  const { allowedExtensions, maxFileSizeInMb } = getFileValidationConfig(validations);

  if (allowedExtensions.length > 0) {
    const fileExtension = normalizeExtension(file.name.split('.').pop() || '');
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return `${fieldLabel} must be one of: ${allowedExtensions.join(', ')}`;
    }
  }

  if (maxFileSizeInMb !== undefined) {
    const maxFileSizeInBytes = maxFileSizeInMb * 1024 * 1024;
    if (file.size > maxFileSizeInBytes) {
      return `${fieldLabel} must be ${maxFileSizeInMb} MB or smaller`;
    }
  }

  return null;
}
