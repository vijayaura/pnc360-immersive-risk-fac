// Utility functions for date formatting in dashboard tables
import { format as dfFormat } from 'date-fns';

// Core formatter — all display dates use dd-MM-yyyy
export const formatDateDDMMYYYY = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '—';
    return dfFormat(date, 'dd-MM-yyyy');
  } catch {
    return '—';
  }
};

// Date + time formatter — dd-MM-yyyy, hh:mm a
export const formatDateTimeDDMMYYYY = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return '—';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '—';
    return dfFormat(date, 'dd-MM-yyyy, hh:mm a');
  } catch {
    return '—';
  }
};

// Short date — dd-MM-yyyy (replaces "Jan 15, 2024" style)
export const formatDateShort = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return dfFormat(date, 'dd-MM-yyyy');
  } catch {
    return '-';
  }
};

// Short date + time — dd-MM-yyyy, hh:mm a
export const formatDateTimeShort = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return dfFormat(date, 'dd-MM-yyyy, hh:mm a');
  } catch {
    return '-';
  }
};

// Date only without year — dd-MM (replaces "Jan 15" style)
export const formatDateOnly = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return dfFormat(date, 'dd-MM-yyyy');
  } catch {
    return '-';
  }
};

// ISO input format yyyy-MM-dd (for form inputs, not display)
export const formatDateYYYYMMDD = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '-';
  }
};
