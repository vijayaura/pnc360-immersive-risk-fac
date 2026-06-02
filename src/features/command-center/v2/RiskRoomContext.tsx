import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { useCommandCenterProperty } from '../context/CommandCenterContext';

import { getRiskRoomProperty, getDefaultUwNotepad } from './risk-room-data';
import { DEFAULT_TAB_BY_MODE } from './context-tabs';
import {
  DEFAULT_SCENARIO,
  type ContextModeId,
  type MapLayerId,
  type RiskLayerId,
  type ScenarioState,
  type SpatialCanvasMode,
  type UwAnnotation,
  type UwNotepadEntry,
} from './types';

import type { ContextTabId } from './context-tabs';

type RiskRoomContextValue = {
  property: ReturnType<typeof getRiskRoomProperty>;
  activeLayer: RiskLayerId;
  setActiveLayer: (id: RiskLayerId) => void;
  contextMode: ContextModeId;
  setContextMode: (mode: ContextModeId) => void;
  contextTab: ContextTabId;
  setContextTab: (tab: ContextTabId) => void;
  mapLayers: Set<MapLayerId>;
  toggleMapLayer: (id: MapLayerId) => void;
  timelineYear: number;
  setTimelineYear: (year: number) => void;
  scenario: ScenarioState;
  setScenario: React.Dispatch<React.SetStateAction<ScenarioState>>;
  annotations: UwAnnotation[];
  addAnnotation: (a: Omit<UwAnnotation, 'id' | 'createdAt' | 'author'>) => void;
  uwNotepad: UwNotepadEntry[];
  addNotepadEntry: (kind: UwNotepadEntry['kind'], text: string) => void;
  updateNotepadEntry: (id: string, text: string) => void;
  removeNotepadEntry: (id: string) => void;
  notepadOpen: boolean;
  setNotepadOpen: (open: boolean) => void;
  insightStatuses: Record<string, 'pending' | 'accepted' | 'dismissed'>;
  setInsightStatus: (id: string, status: 'pending' | 'accepted' | 'dismissed') => void;
  selectedClaimId: string | null;
  setSelectedClaimId: (id: string | null) => void;
  mapBasemap: 'dark' | 'satellite';
  setMapBasemap: (b: 'dark' | 'satellite') => void;
  spatialCanvasMode: SpatialCanvasMode;
  setSpatialCanvasMode: (mode: SpatialCanvasMode) => void;
  selectRiskLayer: (id: RiskLayerId) => void;
};

const RiskRoomContext = createContext<RiskRoomContextValue | null>(null);

const LAYER_TO_MODE: Record<RiskLayerId, ContextModeId> = {
  physical: 'ground',
  environmental: 'perils',
  operational: 'experience',
  financial: 'pricing',
  predictive: 'predictive',
};

export function RiskRoomProvider({ children }: { children: React.ReactNode }) {
  const { property: raw } = useCommandCenterProperty();
  const property = useMemo(() => getRiskRoomProperty(raw), [raw]);

  const [activeLayer, setActiveLayer] = useState<RiskLayerId>('physical');
  const [contextMode, setContextMode] = useState<ContextModeId>('ground');
  const [mapLayers, setMapLayers] = useState<Set<MapLayerId>>(
    () => new Set<MapLayerId>(['footprint', 'claims', 'firestations', 'water', 'flood', 'wind']),
  );
  const [timelineYear, setTimelineYear] = useState(2026);
  const [scenario, setScenario] = useState<ScenarioState>(DEFAULT_SCENARIO);
  const [annotations, setAnnotations] = useState<UwAnnotation[]>([]);
  const [uwNotepad, setUwNotepad] = useState<UwNotepadEntry[]>(() => getDefaultUwNotepad(raw));
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [insightStatuses, setInsightStatuses] = useState<Record<string, 'pending' | 'accepted' | 'dismissed'>>(
    () =>
      Object.fromEntries(property.enrichedInsights.map((i) => [i.id, i.status])) as Record<
        string,
        'pending' | 'accepted' | 'dismissed'
      >,
  );
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [mapBasemap, setMapBasemap] = useState<'dark' | 'satellite'>('dark');
  const [spatialCanvasMode, setSpatialCanvasMode] = useState<SpatialCanvasMode>('map');
  const [contextTab, setContextTab] = useState<ContextTabId>(DEFAULT_TAB_BY_MODE.ground);

  const toggleMapLayer = useCallback((id: MapLayerId) => {
    setMapLayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const addAnnotation = useCallback((a: Omit<UwAnnotation, 'id' | 'createdAt' | 'author'>) => {
    setAnnotations((prev) => [
      ...prev,
      {
        ...a,
        id: `ann-${Date.now()}`,
        author: 'You · Lead UW',
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);

  const addNotepadEntry = useCallback((kind: UwNotepadEntry['kind'], text: string) => {
    const now = new Date().toISOString();
    setUwNotepad((prev) => [
      {
        id: `note-${Date.now()}`,
        kind,
        text: text.trim(),
        createdAt: now,
        updatedAt: now,
      },
      ...prev,
    ]);
  }, []);

  const updateNotepadEntry = useCallback((id: string, text: string) => {
    setUwNotepad((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, text: text.trim(), updatedAt: new Date().toISOString() } : e,
      ),
    );
  }, []);

  const removeNotepadEntry = useCallback((id: string) => {
    setUwNotepad((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const setInsightStatus = useCallback((id: string, status: 'pending' | 'accepted' | 'dismissed') => {
    setInsightStatuses((prev) => ({ ...prev, [id]: status }));
  }, []);

  const selectRiskLayer = useCallback((id: RiskLayerId) => {
    const mode = LAYER_TO_MODE[id];
    setActiveLayer(id);
    setContextMode(mode);
    if (mode) setContextTab(DEFAULT_TAB_BY_MODE[mode]);
  }, []);

  const value = useMemo(
    () => ({
      property,
      activeLayer,
      setActiveLayer,
      contextMode,
      setContextMode,
      contextTab,
      setContextTab,
      mapLayers,
      toggleMapLayer,
      timelineYear,
      setTimelineYear,
      scenario,
      setScenario,
      annotations,
      addAnnotation,
      uwNotepad,
      addNotepadEntry,
      updateNotepadEntry,
      removeNotepadEntry,
      notepadOpen,
      setNotepadOpen,
      insightStatuses,
      setInsightStatus,
      selectedClaimId,
      setSelectedClaimId,
      mapBasemap,
      setMapBasemap,
      spatialCanvasMode,
      setSpatialCanvasMode,
      selectRiskLayer,
    }),
    [
      property,
      activeLayer,
      contextMode,
      contextTab,
      mapLayers,
      toggleMapLayer,
      timelineYear,
      scenario,
      annotations,
      addAnnotation,
      uwNotepad,
      addNotepadEntry,
      updateNotepadEntry,
      removeNotepadEntry,
      notepadOpen,
      insightStatuses,
      setInsightStatus,
      selectedClaimId,
      mapBasemap,
      spatialCanvasMode,
      selectRiskLayer,
    ],
  );

  return <RiskRoomContext.Provider value={value}>{children}</RiskRoomContext.Provider>;
}

export function useRiskRoom() {
  const ctx = useContext(RiskRoomContext);
  if (!ctx) throw new Error('useRiskRoom must be used within RiskRoomProvider');
  return ctx;
}
