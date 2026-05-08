export const getTodayDateInputValue = (): string => {
  const today = new Date();
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60_000);
  return localDate.toISOString().split('T')[0];
};

export const getCurrentYearValue = (): string => new Date().getFullYear().toString();

export const getDateFieldDefaultValue = ({
  currentValue,
  showYearOnly = false,
}: {
  currentValue?: unknown;
  showYearOnly?: boolean;
} = {}): string => {
  if (typeof currentValue === 'string' && currentValue.trim()) {
    return currentValue;
  }

  return '';
};
