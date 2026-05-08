import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Map, Brain, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CommandCenterDashboard from './CommandCenterDashboard';
import CommandCenterSubmissions from './CommandCenterSubmissions';
import CommandCenterRiskMap from './CommandCenterRiskMap';
import CommandCenterAICompare from './CommandCenterAICompare';

type Tab = 'dashboard' | 'submissions' | 'risk-map' | 'ai-compare';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'submissions', label: 'Submissions', icon: FileText },
  { id: 'risk-map', label: 'Risk Map', icon: Map },
  { id: 'ai-compare', label: 'AI Compare', icon: Brain },
];

interface CommandCenterProps {
  onClose?: () => void;
}

export default function CommandCenter({ onClose }: CommandCenterProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const navigate = useNavigate();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shrink-0 shadow-sm">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClose}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-bold text-gray-900">Immersive Risk Assessment</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 ml-4">
          {TABS.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="gap-1.5"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          ))}
        </div>

        <div className="flex-1" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' && <CommandCenterDashboard onNavigate={(tab) => setActiveTab(tab as any)} />}
        {activeTab === 'submissions' && <CommandCenterSubmissions />}
        {activeTab === 'risk-map' && <CommandCenterRiskMap />}
        {activeTab === 'ai-compare' && <CommandCenterAICompare />}
      </div>
    </div>
  );
}
