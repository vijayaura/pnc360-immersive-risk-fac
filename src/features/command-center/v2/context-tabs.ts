import type React from 'react';

import {
  Building2,
  Calculator,
  CloudSun,
  FileSearch,
  Globe2,
  History,
  Layers,
  Sparkles,
} from 'lucide-react';

import type { AssessPanelView } from '../pages/CommandCenterAssessExperience';

import type { ContextModeId } from './types';

export type ContextTabId = AssessPanelView | 'site-overview';

export type ContextTabDef = {
  id: ContextTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const MODE_TABS: Record<Exclude<ContextModeId, null>, ContextTabDef[]> = {
  ground: [
    { id: 'site-overview', label: 'Site overview', icon: Layers },
    { id: 'explorer', label: '3D Explorer', icon: Building2 },
  ],
  perils: [
    { id: 'weather', label: 'Weather trends', icon: CloudSun },
    { id: 'natcat', label: 'NatCat model', icon: Globe2 },
  ],
  experience: [
    { id: 'explorer', label: '3D Explorer', icon: Building2 },
    { id: 'survey', label: 'Survey report', icon: FileSearch },
  ],
  pricing: [
    { id: 'loss-history', label: 'Loss history', icon: History },
    { id: 'burning-cost', label: 'Burning cost', icon: Calculator },
    { id: 'survey', label: 'Survey report', icon: FileSearch },
  ],
  predictive: [
    { id: 'natcat', label: 'NatCat scenarios', icon: Globe2 },
    { id: 'ai-insights', label: 'AI insights', icon: Sparkles },
  ],
};

export const DEFAULT_TAB_BY_MODE: Record<Exclude<ContextModeId, null>, ContextTabId> = {
  ground: 'site-overview',
  perils: 'weather',
  experience: 'explorer',
  pricing: 'loss-history',
  predictive: 'ai-insights',
};
