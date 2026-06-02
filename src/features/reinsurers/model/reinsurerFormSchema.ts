import * as z from "zod";
import { validatePhone } from "@/lib/phone/phone-validation";
import type {
  FacultativeContactManagement,
  RiskAppetiteConfig,
} from "@/features/reinsurers/api/reinsurers";

const facultativeContactPersonSchema = z.object({
  name: z.string().optional().or(z.literal("")),
  email: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  title: z.string().optional().or(z.literal("")),
});

const facultativeTeamContactSchema = z.object({
  id: z.string(),
  productLine: z.string(),
  productLabel: z.string(),
  isCustom: z.boolean().optional(),
  primaryContact: facultativeContactPersonSchema,
  ccRecipients: z.array(z.string()).default([]),
});

export const facultativeContactsSchema = z.object({
  teams: z.array(facultativeTeamContactSchema).default([]),
});

const riskAppetiteSchemaFields = {
  linesWritten: z.array(z.string()).default([]),
  riskAppetiteLevel: z.string().optional().or(z.literal("")),
  maximumRetention: z.number().min(0).nullable().optional(),
  maximumRetentionCurrency: z.string().default("AED"),
  acceptedRisks: z.array(z.string()).default([]),
  declinedRisks: z.array(z.string()).default([]),
  facilityTypes: z.array(z.string()).default([]),
};

const baseReinsurerFields = {
  name: z.string().min(2, "Name must be at least 2 characters"),
  licenseNumber: z.string().min(1, "License number is required"),
  gradeId: z.string().min(1, "Please select a reinsurer grade"),
  email: z.string().email("Invalid email address"),
  phone: z.string().refine(
    (v) => validatePhone(v?.trim() || undefined, true) === null,
    (v) => ({ message: validatePhone(v?.trim() || undefined, true) ?? "Invalid phone number" }),
  ),
  address: z.string().min(1, "Address is required"),
  adminUserName: z.string().min(2, "Admin name must be at least 2 characters"),
  ...riskAppetiteSchemaFields,
  facultativeContacts: facultativeContactsSchema.default({ teams: [] }),
};

function validateFacultativeTeams(
  data: { facultativeContacts?: { teams?: z.infer<typeof facultativeTeamContactSchema>[] } },
  ctx: z.RefinementCtx,
) {
  const teams = data.facultativeContacts?.teams ?? [];
  const emailCheck = z.string().email();

  teams.forEach((team, index) => {
    const pc = team.primaryContact;
    const hasPrimary = !!(pc.name?.trim() || pc.email?.trim() || pc.phone?.trim());
    const hasCc = (team.ccRecipients?.length ?? 0) > 0;
    if (!hasPrimary && !hasCc) return;

    if (!pc.name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Name is required",
        path: ["facultativeContacts", "teams", index, "primaryContact", "name"],
      });
    }
    if (!pc.email?.trim() || !emailCheck.safeParse(pc.email.trim()).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Valid email is required",
        path: ["facultativeContacts", "teams", index, "primaryContact", "email"],
      });
    }
    team.ccRecipients?.forEach((email, ci) => {
      if (!emailCheck.safeParse(email).success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Invalid email",
          path: ["facultativeContacts", "teams", index, "ccRecipients", ci],
        });
      }
    });
  });
}

export const reinsurerSchemaCreate = z
  .object({
    ...baseReinsurerFields,
    adminUserEmail: z.string().email("Invalid admin email address"),
    adminUserPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .superRefine(validateFacultativeTeams);

export const reinsurerSchemaEdit = z
  .object({
    ...baseReinsurerFields,
    adminUserEmail: z.string().email("Invalid admin email address").optional().or(z.literal("")),
    adminUserPassword: z.string().optional().or(z.literal("")).refine(
      (v) => !v || v.length >= 8,
      "Password must be at least 8 characters",
    ),
  })
  .superRefine(validateFacultativeTeams);

export type ReinsurerFormData = z.infer<typeof reinsurerSchemaCreate>;

export function normalizeFacilityTypes(ra?: RiskAppetiteConfig): string[] {
  if (ra?.facilityTypes?.length) return ra.facilityTypes;
  if (ra?.facilityType) return [ra.facilityType];
  return [];
}

export function riskAppetiteFormDefaults(
  initialData?: Partial<ReinsurerFormData & { riskAppetite?: RiskAppetiteConfig }>,
) {
  const ra = initialData?.riskAppetite;
  return {
    linesWritten: ra?.linesWritten ?? initialData?.linesWritten ?? [],
    riskAppetiteLevel: ra?.riskAppetiteLevel ?? initialData?.riskAppetiteLevel ?? "",
    maximumRetention: ra?.maximumRetention ?? initialData?.maximumRetention ?? null,
    maximumRetentionCurrency: ra?.maximumRetentionCurrency ?? initialData?.maximumRetentionCurrency ?? "AED",
    acceptedRisks: ra?.acceptedRisks ?? initialData?.acceptedRisks ?? [],
    declinedRisks: ra?.declinedRisks ?? initialData?.declinedRisks ?? [],
    facilityTypes: normalizeFacilityTypes(ra) ?? initialData?.facilityTypes ?? [],
  };
}

export function facultativeContactsFormDefaults(
  initialData?: Partial<ReinsurerFormData & { facultativeContacts?: FacultativeContactManagement }>,
): ReinsurerFormData["facultativeContacts"] {
  const fc = initialData?.facultativeContacts;
  return {
    teams: (fc?.teams ?? []).map((team) => ({
      id: team.id,
      productLine: team.productLine,
      productLabel: team.productLabel,
      isCustom: team.isCustom,
      primaryContact: {
        name: team.primaryContact?.name ?? "",
        email: team.primaryContact?.email ?? "",
        phone: team.primaryContact?.phone ?? "",
        title: team.primaryContact?.title ?? "Specialized Underwriter",
      },
      ccRecipients: team.ccRecipients ?? [],
    })),
  };
}

export function buildRiskAppetitePayload(data: ReinsurerFormData): RiskAppetiteConfig | undefined {
  const hasContent =
    (data.linesWritten?.length ?? 0) > 0 ||
    !!data.riskAppetiteLevel ||
    data.maximumRetention != null ||
    (data.acceptedRisks?.length ?? 0) > 0 ||
    (data.declinedRisks?.length ?? 0) > 0 ||
    (data.facilityTypes?.length ?? 0) > 0;

  if (!hasContent) return undefined;

  return {
    linesWritten: data.linesWritten,
    riskAppetiteLevel: data.riskAppetiteLevel || undefined,
    maximumRetention: data.maximumRetention ?? null,
    maximumRetentionCurrency: data.maximumRetentionCurrency || "AED",
    acceptedRisks: data.acceptedRisks,
    declinedRisks: data.declinedRisks,
    facilityTypes: data.facilityTypes,
  };
}

export function buildFacultativeContactsPayload(
  data: ReinsurerFormData,
): FacultativeContactManagement | undefined {
  const teams = (data.facultativeContacts?.teams ?? [])
    .filter((team) => {
      const pc = team.primaryContact;
      return !!(pc.name?.trim() || pc.email?.trim() || pc.phone?.trim() || team.ccRecipients.length);
    })
    .map((team) => ({
      id: team.id,
      productLine: team.productLine,
      productLabel: team.productLabel,
      isCustom: team.isCustom,
      primaryContact: {
        name: team.primaryContact.name?.trim() ?? "",
        email: team.primaryContact.email?.trim() ?? "",
        phone: team.primaryContact.phone?.trim() || undefined,
        title: team.primaryContact.title?.trim() || undefined,
      },
      ccRecipients: team.ccRecipients,
    }));

  if (!teams.length) return undefined;
  return { teams };
}
