export const getHumanReadableStatus = (status: string): string => {
  const map: Record<string, string> = {
    project_details: "Project Details",
    insured_details: "Insured Details",
    contract_structure: "Contract Structure",
    site_risk: "Site Risks",
    cover_requirements: "Cover Requirements",
    required_documents: "UW Documents",
    plan_selected: "Plan Selected",
    declaration_documents: "Declaration Documents",
    policy_created: "Policy Created",
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
    expired: "Expired",
  };
  return map[status?.toLowerCase()] ?? status ?? "Unknown";
};

export const formatFieldName = (key: string): string =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase())
    .replace(/Id\b/g, "ID")
    .replace(/Tpl\b/g, "TPL")
    .replace(/Cew\b/g, "CEW");

export const formatFieldValue = (key: string, value: any): string => {
  if (value === null || value === undefined || value === "") {
    if (key.includes("date") || key.includes("_at") || key.includes("time"))
      return "Not set";
    if (
      key.includes("amount") ||
      key.includes("premium") ||
      key.includes("sum_insured") ||
      key.includes("value")
    )
      return "Not calculated";
    if (
      key.includes("count") ||
      key.includes("number") ||
      key.includes("period")
    )
      return "0";
    return "Not specified";
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object" && value !== null && "startDate" in value && "endDate" in value) {
    return formatDatePeriodValue(value);
  }
  if (typeof value === "object") return JSON.stringify(value);

  // Time-only check: only run when key is truly a time field (word-boundary match)
  const isTimeKey = /(?:^|_)time(?:_|$)/.test(key);
  if (isTimeKey && typeof value === "string") {
    const timeOnly = /^\d{1,2}:\d{2}(:\d{2})?$/;
    const trimmed = value.trim();
    if (timeOnly.test(trimmed)) {
      const parts = trimmed.split(":");
      const hour = parseInt(parts[0], 10);
      const minute = parts[1] ?? "00";
      const second = parts[2];
      if (!Number.isNaN(hour) && hour >= 0 && hour <= 23) {
        const suffix = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        const paddedHour = String(hour12).padStart(2, "0");
        return second
          ? `${paddedHour}:${minute}:${second} ${suffix}`
          : `${paddedHour}:${minute} ${suffix}`;
      }
    }
  }

  // Date/timestamp detection — use word-boundary regex so field names like
  // "university_attented" (which contains "_at" as a substring of "_att")
  // are NOT incorrectly matched. Only true semantic tokens count:
  //   created_at, updated_at → matched by /_at$/
  //   start_date, end_date  → matched by /date/
  //   appointment_time      → matched by /time/
  const isDateKey =
    /(?:^|_)date(?:_|$)/.test(key) ||
    /(?:^|_)at$/.test(key) ||
    /(?:^|_)time(?:_|$)/.test(key);

  if (isDateKey) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const yyyyMmDd = `${year}-${month}-${day}`;

        if (key.includes("date") && !key.includes("time") && !key.includes("_at")) {
          return yyyyMmDd;
        }
        
        const hour = String(date.getHours()).padStart(2, "0");
        const minute = String(date.getMinutes()).padStart(2, "0");
        return `${yyyyMmDd} ${hour}:${minute}`;
      }
    } catch { }
    return "Invalid date";
  }

  if (
    key.includes("amount") ||
    key.includes("premium") ||
    key.includes("sum_insured") ||
    key.includes("value")
  ) {
    const num = parseFloat(String(value));
    if (!isNaN(num)) {
      if (num === 0) return "AED 0.00";
      if (num > 0) {
        return `AED ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }
    return "Invalid amount";
  }

  const str = String(value);
  if (str.length > 0) {
    if (key.includes("contract_number") || key === "contract_number")
      return str;

    if (str.includes("-")) {
      const parts = str.split("-");
      // Only apply enum-slug formatting when ALL parts look like plain lowercase
      // word tokens (letters only, no digits, no uppercase).
      // Examples that should NOT be transformed:
      //   "UJDF-KJKDFNH-12343"  (contains uppercase / digits)
      //   "abc-123"             (contains digits)
      //   "550e8400-e29b-41d4"  (UUID-like)
      // Examples that SHOULD be transformed:
      //   "turnkey-contract"    → "Turnkey & Contract"
      //   "design-build"        → "Design & Build"
      const isEnumSlug = parts.every((p) => /^[a-z]+$/.test(p));
      if (isEnumSlug) {
        return parts
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" & ");
      }
      // Otherwise return the original string as-is (reference ID, code, UUID…)
      return str;
    }

    if (str.includes("_"))
      return str
        .split("_")
        // Only uppercase the first char if it's currently lowercase — preserve the rest as-is
        // e.g. "jack_martin" → "Jack Martin", "SAR_CODE" → "SAR CODE"
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

    // Only uppercase the very first character if it's lowercase — never touch the rest
    // e.g. "SAR" stays "SAR", "Jack Martin" stays "Jack Martin", "hello" → "Hello"
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  return "Not specified";
};

export const formatDateShort = (dateStr: string | undefined): string => {
  if (!dateStr) return "Not set";
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Invalid date format
  }
  return dateStr;
};

export const formatMultiselectValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "None selected";
  }

  let values: any[] = [];
  if (typeof value === "string") {
    try {
      values = JSON.parse(value);
    } catch {
      values = [value];
    }
  } else if (Array.isArray(value)) {
    values = value;
  }

  if (values.length === 0) return "None selected";

  return values
    .map((v) => {
      if (typeof v === "object" && v !== null) {
        return v.label || v.value || "Unknown";
      }
      return String(v);
    })
    .join(", ");
};

export const formatDatePeriodValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "Not specified";
  }

  if (typeof value === "string" && value === "[object Object]") {
    return "Not specified";
  }

  let periodValue: { startDate?: string; endDate?: string } = {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (typeof parsed === "object" && parsed !== null) {
        periodValue = parsed;
      } else {
        return "Not specified";
      }
    } catch {
      return "Not specified";
    }
  } else if (typeof value === "object" && value !== null) {
    periodValue = value as { startDate?: string; endDate?: string };
  }

  if (!periodValue.startDate && !periodValue.endDate) {
    return "Not specified";
  }

  const start = formatDateShort(periodValue.startDate);
  const end = formatDateShort(periodValue.endDate);
  return `${start} - ${end}`;
};
