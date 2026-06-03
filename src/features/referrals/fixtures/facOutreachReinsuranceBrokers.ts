import type { ReinsuranceBroker } from '@/features/reinsurance-brokers/api/reinsurance-brokers';

/** Demo reinsurance brokers for FAC Out outreach when the directory API returns few rows. */
export const FAC_OUTREACH_DEMO_REINSURANCE_BROKERS: ReinsuranceBroker[] = [
  {
    id: 'demo-ri-broker-howden',
    name: 'Howden Re',
    isDirect: false,
    status: 'active',
    licenseNumber: 'RBK-HWD-UAE-2018',
    email: 'fac.placement@howdenre.demo',
    adminEmail: 'fac.placement@howdenre.demo',
    adminName: 'Howden Fac Placement',
    phone: '+971 4 390 9100',
    address: 'Dubai International Financial Centre, Gate Village 9',
    operatingCountries: ['United Arab Emirates', 'United Kingdom', 'Bahrain'],
    facilityIntelligence: {
      preferredMarkets: ['gcc', 'mena', 'uk'],
      brokerFacilities: ['facultative', 'open_market', 'binder'],
      regionalConnections: [
        {
          id: 'howden-rc-gcc',
          region: 'gcc',
          regionLabel: 'GCC',
          reinsurers: ['Swiss Re', 'Munich Re', 'Hannover Re'],
        },
        {
          id: 'howden-rc-uk',
          region: 'uk_lloyds',
          regionLabel: "UK & Lloyd's",
          reinsurers: ["Lloyd's syndicates", 'Beazley', 'Hiscox'],
        },
      ],
    },
    facultativeTreaty: {
      supportsFacultative: true,
      supportsTreaty: true,
      facultativeTeam: { name: 'GCC Fac Team', email: 'gcc.fac@howdenre.demo' },
    },
  },
  {
    id: 'demo-ri-broker-marsh',
    name: 'Marsh McLennan Re',
    isDirect: false,
    status: 'active',
    licenseNumber: 'RBK-MSH-UAE-2014',
    email: 'reinsurance.uae@marshre.demo',
    adminEmail: 'reinsurance.uae@marshre.demo',
    adminName: 'Marsh Re UAE Placement',
    phone: '+971 4 363 3300',
    address: 'EMAAR Square, Building 3, Downtown Dubai',
    operatingCountries: ['United Arab Emirates', 'Saudi Arabia', 'Qatar'],
    facilityIntelligence: {
      preferredMarkets: ['gcc', 'mena', 'global'],
      brokerFacilities: ['facultative', 'proportional_treaty', 'line_slip'],
      regionalConnections: [
        {
          id: 'marsh-rc-gcc',
          region: 'gcc',
          regionLabel: 'GCC',
          reinsurers: ['SCOR', 'Partner Re', 'QBE Re'],
        },
        {
          id: 'marsh-rc-mena',
          region: 'mena',
          regionLabel: 'MENA',
          reinsurers: ['Munich Re', 'Swiss Re'],
        },
      ],
    },
    facultativeTreaty: {
      supportsFacultative: true,
      supportsTreaty: true,
      facultativeTeam: { name: 'Property Fac Desk', email: 'property.fac@marshre.demo' },
    },
  },
  {
    id: 'demo-ri-broker-aon',
    name: 'Aon Reinsurance Solutions',
    isDirect: false,
    status: 'active',
    licenseNumber: 'RBK-AON-UAE-2016',
    email: 'middleeast.re@aonre.demo',
    adminEmail: 'middleeast.re@aonre.demo',
    adminName: 'Aon Re Middle East',
    phone: '+971 4 436 3600',
    address: 'Al Fattan Currency House, DIFC, Dubai',
    operatingCountries: ['United Arab Emirates', 'Kuwait', 'Oman'],
    facilityIntelligence: {
      preferredMarkets: ['gcc', 'asia_pacific', 'europe'],
      brokerFacilities: ['facultative', 'non_proportional_treaty', 'mga_program'],
      regionalConnections: [
        {
          id: 'aon-rc-gcc',
          region: 'gcc',
          regionLabel: 'GCC',
          reinsurers: ['Renaissance Re', 'Everest Re', 'Axis Re'],
        },
        {
          id: 'aon-rc-apac',
          region: 'asia_pacific',
          regionLabel: 'Asia-Pacific',
          reinsurers: ['Tokio Marine', 'Sompo'],
        },
      ],
    },
    facultativeTreaty: {
      supportsFacultative: true,
      supportsTreaty: true,
      facultativeTeam: { name: 'Energy & Property Fac', email: 'energy.fac@aonre.demo' },
    },
  },
];

export function mergeFacOutreachReinsuranceBrokers(apiBrokers: ReinsuranceBroker[]): ReinsuranceBroker[] {
  const fromApi = apiBrokers.filter((b) => !b.isDirect);
  const seenIds = new Set(fromApi.map((b) => b.id));
  const seenNames = new Set(fromApi.map((b) => b.name.trim().toLowerCase()));

  const demos = FAC_OUTREACH_DEMO_REINSURANCE_BROKERS.filter(
    (d) => !seenIds.has(d.id) && !seenNames.has(d.name.trim().toLowerCase()),
  );

  return [...demos, ...fromApi];
}
