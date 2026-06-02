import React, { useEffect } from 'react';

import { cn } from '@/shared/utils/lib-utils';

import {
  CommandCenterAssessPanels,
  type AssessPanelView,
} from '../../pages/CommandCenterAssessExperience';
import { DEFAULT_TAB_BY_MODE, MODE_TABS, type ContextTabId } from '../context-tabs';
import { rr } from '../risk-room-theme';
import { useRiskRoom } from '../RiskRoomContext';

import { SiteOverviewPanel } from './SiteOverviewPanel';

export function ContextWorkspace() {
  const { contextMode, contextTab, setContextTab } = useRiskRoom();

  if (!contextMode) return null;

  const tabs = MODE_TABS[contextMode];

  useEffect(() => {
    const valid = tabs.some((t) => t.id === contextTab);
    if (!valid) {
      setContextTab(DEFAULT_TAB_BY_MODE[contextMode]);
    }
  }, [contextMode, contextTab, setContextTab, tabs]);

  const activeTab: ContextTabId = tabs.some((t) => t.id === contextTab)
    ? (contextTab as ContextTabId)
    : DEFAULT_TAB_BY_MODE[contextMode];

  const compactTabs: ContextTabId[] = ['site-overview', 'ai-insights'];
  const useTallPanel = !compactTabs.includes(activeTab);

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setContextTab(tab.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[11px] font-semibold transition-colors',
                isActive ? rr.tabActive : rr.tabIdle,
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        className={cn(
          'rounded-xl border border-border bg-muted/30 p-1 md:p-2',
          useTallPanel && 'min-h-[min(520px,70vh)]',
          rr.mutedPanel,
        )}
      >
        {activeTab === 'site-overview' ? (
          <SiteOverviewPanel />
        ) : (
          <div className={cn(!useTallPanel && 'p-1 md:p-2')}>
            <CommandCenterAssessPanels view={activeTab as AssessPanelView} immersive={false} />
          </div>
        )}
      </div>
    </div>
  );
}

export { DEFAULT_TAB_BY_MODE };
