import type { ReinsuranceBroker } from '@/features/reinsurance-brokers/api/reinsurance-brokers';
import { getRegionalConnectionLabel } from '@/features/reinsurance-brokers/constants/brokerConfigOptions';
import type { Reinsurer } from '@/features/reinsurers/api/reinsurers';

type OutreachPartyKind = 'reinsurer' | 'reinsurance_broker';

export interface OutreachConversionStats {
  sent: number;
  responses: number;
  placements: number;
}

export interface OutreachPartyInsights {
  conversions: OutreachConversionStats;
  marketTags: string[];
  marketNote?: string;
  overlapWarning?: string;
}

function stableInt(seed: string, min: number, max: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  const range = max - min + 1;
  return min + (Math.abs(h) % range);
}

/** Stable demo conversion funnel until outreach analytics API is available. */
export function getOutreachConversionStats(id: string, kind: OutreachPartyKind): OutreachConversionStats {
  const sent = stableInt(`${id}:${kind}:sent`, kind === 'reinsurance_broker' ? 12 : 8, kind === 'reinsurance_broker' ? 28 : 22);
  const maxResponses = Math.max(2, Math.floor(sent * 0.75));
  const responses = stableInt(`${id}:${kind}:resp`, 2, maxResponses);
  const maxPlacements = Math.max(1, Math.floor(responses * 0.6));
  const placements = stableInt(`${id}:${kind}:place`, 1, maxPlacements);
  return {
    sent,
    responses: Math.min(responses, sent),
    placements: Math.min(placements, responses),
  };
}

function preferredMarketLabel(value: string): string {
  return getRegionalConnectionLabel(value);
}

export function getReinsurerMarketTags(reinsurer: Reinsurer): string[] {
  const tags = new Set<string>();
  reinsurer.operatingCountries?.slice(0, 2).forEach((c) => tags.add(c));
  reinsurer.riskAppetite?.linesWritten?.slice(0, 2).forEach((line) => tags.add(line));
  reinsurer.riskAppetite?.acceptedRisks?.slice(0, 1).forEach((risk) => tags.add(risk));
  return [...tags].slice(0, 4);
}

export function getBrokerMarketTags(broker: ReinsuranceBroker): string[] {
  const tags = new Set<string>();
  broker.facilityIntelligence?.preferredMarkets?.forEach((m) => tags.add(preferredMarketLabel(m)));
  broker.facilityIntelligence?.regionalConnections?.forEach((rc) => tags.add(rc.regionLabel || preferredMarketLabel(rc.region)));
  broker.operatingCountries?.slice(0, 2).forEach((c) => tags.add(c));

  if (tags.size === 0) {
    const fallbackRegions = [
      'GCC',
      'MENA',
      'European Markets',
      "UK & Lloyd's",
      'US Markets',
      'Asia-Pacific',
    ];
    const primary = stableInt(`${broker.id}:market`, 0, fallbackRegions.length - 1);
    tags.add(fallbackRegions[primary]);
    const secondary = stableInt(`${broker.id}:market2`, 0, fallbackRegions.length - 1);
    if (secondary !== primary) {
      tags.add(fallbackRegions[secondary]);
    }
  }

  return [...tags].slice(0, 4);
}

export function buildBrokerOverlapWarnings(
  brokers: Array<{ id: string; name: string; marketTags: string[]; selected: boolean }>,
): Record<string, string> {
  const selected = brokers.filter((b) => b.selected);
  const warnings: Record<string, string> = {};

  for (const broker of selected) {
    const overlaps: string[] = [];
    for (const other of selected) {
      if (other.id === broker.id) continue;
      const shared = broker.marketTags.filter((tag) => other.marketTags.includes(tag));
      if (shared.length > 0) {
        overlaps.push(`${other.name} (${shared.join(', ')})`);
      }
    }
    if (overlaps.length > 0) {
      warnings[broker.id] = `Overlaps with ${overlaps.join('; ')} — consider one broker per market.`;
    }
  }

  return warnings;
}

export function buildReinsurerInsights(reinsurer: Reinsurer): OutreachPartyInsights {
  const conversions = getOutreachConversionStats(reinsurer.id, 'reinsurer');
  const marketTags = getReinsurerMarketTags(reinsurer);
  const responseRate = conversions.sent > 0 ? Math.round((conversions.responses / conversions.sent) * 100) : 0;
  const placementRate = conversions.sent > 0 ? Math.round((conversions.placements / conversions.sent) * 100) : 0;

  return {
    conversions,
    marketTags,
    marketNote: `${responseRate}% response · ${placementRate}% placement on recent facultative outreach`,
  };
}

export function buildBrokerInsights(
  broker: ReinsuranceBroker,
  overlapWarning?: string,
): OutreachPartyInsights {
  const conversions = getOutreachConversionStats(broker.id, 'reinsurance_broker');
  const marketTags = getBrokerMarketTags(broker);
  const responseRate = conversions.sent > 0 ? Math.round((conversions.responses / conversions.sent) * 100) : 0;

  return {
    conversions,
    marketTags,
    marketNote: `${responseRate}% response rate · covers ${marketTags.slice(0, 2).join(', ')}`,
    overlapWarning,
  };
}
