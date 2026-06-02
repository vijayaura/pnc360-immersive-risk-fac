import * as z from "zod";
import { validatePhone } from "@/lib/phone/phone-validation";
import type {
  BrokerFacultativeTreatyConfig,
  BrokerFacilityIntelligence,
} from "@/features/reinsurance-brokers/api/reinsurance-brokers";

const teamContactSchema = z.object({
  name: z.string().optional().or(z.literal("")),
  email: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

const regionalConnectionSchema = z.object({
  id: z.string(),
  region: z.string(),
  regionLabel: z.string(),
  reinsurers: z.array(z.string()).default([]),
});

const facultativeTreatySchemaFields = {
  supportsFacultative: z.boolean().default(false),
  supportsTreaty: z.boolean().default(false),
  separateTeamsForBoth: z.boolean().default(false),
  facultativeTeam: teamContactSchema.default({ name: "", email: "", phone: "" }),
  treatyTeam: teamContactSchema.default({ name: "", email: "", phone: "" }),
};

const facilityIntelligenceSchemaFields = {
  brokerFacilities: z.array(z.string()).default([]),
  preferredMarkets: z.array(z.string()).default([]),
  regionalConnections: z.array(regionalConnectionSchema).default([]),
};

const baseBrokerFields = {
  name: z.string().min(2, "Name must be at least 2 characters"),
  licenseNumber: z.string().min(1, "License number is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().refine(
    (v) => validatePhone(v?.trim() || undefined, true) === null,
    (v) => ({ message: validatePhone(v?.trim() || undefined, true) ?? "Invalid phone number" }),
  ),
  address: z.string().min(1, "Address is required"),
  isDirect: z.boolean().optional().default(false),
  ...facultativeTreatySchemaFields,
  ...facilityIntelligenceSchemaFields,
};

function validateBrokerTeams(
  data: {
    supportsFacultative?: boolean;
    supportsTreaty?: boolean;
    separateTeamsForBoth?: boolean;
    facultativeTeam?: z.infer<typeof teamContactSchema>;
    treatyTeam?: z.infer<typeof teamContactSchema>;
  },
  ctx: z.RefinementCtx,
) {
  if (!data.separateTeamsForBoth || !data.supportsFacultative || !data.supportsTreaty) return;

  const emailCheck = z.string().email();
  const checkTeam = (
    team: z.infer<typeof teamContactSchema> | undefined,
    prefix: "facultativeTeam" | "treatyTeam",
    label: string,
  ) => {
    if (!team?.name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} team name is required`,
        path: [prefix, "name"],
      });
    }
    if (!team?.email?.trim() || !emailCheck.safeParse(team.email.trim()).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} team email is required`,
        path: [prefix, "email"],
      });
    }
  };

  checkTeam(data.facultativeTeam, "facultativeTeam", "Facultative");
  checkTeam(data.treatyTeam, "treatyTeam", "Treaty");
}

export const brokerSchemaCreate = z
  .object({
    ...baseBrokerFields,
    adminUserName: z.string().min(1, "Admin name is required"),
    adminUserEmail: z.string().email("Invalid admin email address"),
    adminUserPassword: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  })
  .superRefine(validateBrokerTeams);

export const brokerSchemaEdit = z
  .object({
    ...baseBrokerFields,
    adminUserName: z.string().min(1, "Admin name is required"),
    adminUserEmail: z.string().email("Invalid admin email address"),
    adminUserPassword: z.string().optional().or(z.literal("")),
  })
  .superRefine(validateBrokerTeams);

export type ReinsuranceBrokerFormData = z.infer<typeof brokerSchemaCreate>;

const emptyTeamContact = () => ({ name: "", email: "", phone: "" });

export function facultativeTreatyFormDefaults(
  initialData?: Partial<
    ReinsuranceBrokerFormData & { facultativeTreaty?: BrokerFacultativeTreatyConfig }
  >,
) {
  const ft = initialData?.facultativeTreaty;
  return {
    supportsFacultative: ft?.supportsFacultative ?? initialData?.supportsFacultative ?? false,
    supportsTreaty: ft?.supportsTreaty ?? initialData?.supportsTreaty ?? false,
    separateTeamsForBoth: ft?.separateTeamsForBoth ?? initialData?.separateTeamsForBoth ?? false,
    facultativeTeam: {
      name: ft?.facultativeTeam?.name ?? initialData?.facultativeTeam?.name ?? "",
      email: ft?.facultativeTeam?.email ?? initialData?.facultativeTeam?.email ?? "",
      phone: ft?.facultativeTeam?.phone ?? initialData?.facultativeTeam?.phone ?? "",
    },
    treatyTeam: {
      name: ft?.treatyTeam?.name ?? initialData?.treatyTeam?.name ?? "",
      email: ft?.treatyTeam?.email ?? initialData?.treatyTeam?.email ?? "",
      phone: ft?.treatyTeam?.phone ?? initialData?.treatyTeam?.phone ?? "",
    },
  };
}

export function facilityIntelligenceFormDefaults(
  initialData?: Partial<
    ReinsuranceBrokerFormData & { facilityIntelligence?: BrokerFacilityIntelligence }
  >,
) {
  const fi = initialData?.facilityIntelligence;
  return {
    brokerFacilities: fi?.brokerFacilities ?? initialData?.brokerFacilities ?? [],
    preferredMarkets: fi?.preferredMarkets ?? initialData?.preferredMarkets ?? [],
    regionalConnections: (fi?.regionalConnections ?? initialData?.regionalConnections ?? []).map(
      (rc) => ({
        id: rc.id,
        region: rc.region,
        regionLabel: rc.regionLabel,
        reinsurers: rc.reinsurers ?? [],
      }),
    ),
  };
}

export function buildFacultativeTreatyPayload(
  data: ReinsuranceBrokerFormData,
): BrokerFacultativeTreatyConfig | undefined {
  const hasContent =
    data.supportsFacultative ||
    data.supportsTreaty ||
    data.separateTeamsForBoth ||
    !!data.facultativeTeam?.name?.trim() ||
    !!data.treatyTeam?.name?.trim();

  if (!hasContent) return undefined;

  return {
    supportsFacultative: data.supportsFacultative,
    supportsTreaty: data.supportsTreaty,
    separateTeamsForBoth: data.separateTeamsForBoth,
    facultativeTeam: data.separateTeamsForBoth
      ? {
          name: data.facultativeTeam?.name?.trim() || undefined,
          email: data.facultativeTeam?.email?.trim() || undefined,
          phone: data.facultativeTeam?.phone?.trim() || undefined,
        }
      : undefined,
    treatyTeam: data.separateTeamsForBoth
      ? {
          name: data.treatyTeam?.name?.trim() || undefined,
          email: data.treatyTeam?.email?.trim() || undefined,
          phone: data.treatyTeam?.phone?.trim() || undefined,
        }
      : undefined,
  };
}

export function buildFacilityIntelligencePayload(
  data: ReinsuranceBrokerFormData,
): BrokerFacilityIntelligence | undefined {
  const connections = (data.regionalConnections ?? []).filter(
    (rc) => rc.reinsurers.length > 0 || rc.region,
  );

  const hasContent =
    (data.brokerFacilities?.length ?? 0) > 0 ||
    (data.preferredMarkets?.length ?? 0) > 0 ||
    connections.length > 0;

  if (!hasContent) return undefined;

  return {
    brokerFacilities: data.brokerFacilities,
    preferredMarkets: data.preferredMarkets,
    regionalConnections: connections.map((rc) => ({
      id: rc.id,
      region: rc.region,
      regionLabel: rc.regionLabel,
      reinsurers: rc.reinsurers,
    })),
  };
}

export { emptyTeamContact };
