import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Circle } from "lucide-react";
import type { ProposalBundleResponseV2 } from '@/features/quotes/api/quotes';
import { useSearchParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
export interface JourneyStep {
  label: string;
  completed: boolean;
  targetId?: string;
}

interface QuoteJourneyProps {
  v2Response: ProposalBundleResponseV2;
  currentStatus?: string;
  isPolicyCreated?: boolean;
}

export function QuoteJourney({ v2Response, currentStatus, isPolicyCreated }: QuoteJourneyProps) {
  const [isProposal, setIsProposal] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const isProposalParam = searchParams.get('isProposal');

    if (isProposalParam) {
      setIsProposal(isProposalParam);

      const newParams = new URLSearchParams(searchParams);
      newParams.delete('isProposal');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleStepClick = (targetId?: string) => {
    if (!targetId) return;
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const sortedPages = (v2Response?.template?.pages ?? []).sort(
    (a, b) => a.pageOrder - b.pageOrder
  );

  // Define the core 5-step workflow requested for V2
  const steps: JourneyStep[] = [
    { 
      label: 'Proposal Form', 
      completed: false, 
      targetId: 'section_proposal_form' 
    },
    { 
      label: 'Underwriting Documents', 
      completed: false, 
      targetId: 'section_underwriting_documents' 
    },
    { 
      label: 'Policy Issuance Documents', 
      completed: false, 
      targetId: 'section_policy_issuance_documents' 
    },
    { 
      label: 'Policy Details', 
      completed: false, 
      targetId: 'section_policy_details' 
    },
  ];

  // Logic to determine completion based on status
  const status = currentStatus?.toLowerCase() || '';

  // Step 1 (Proposal) is usually always "completed" if we are viewing details
  steps[0].completed = true;

  // Logic for subsequent steps
  if (status === 'policy_created' || status === 'active' || isPolicyCreated) {
    // Everything is done
    steps.forEach(s => s.completed = true);
  } else if (status === 'awaiting_payment' || status === 'draft' || status === 'quoted') {
    // Underwriting is likely done
    steps[1].completed = true;
  }
  // If we have required documents, Step 1 is definitely done.
  if ((v2Response?.requiredDocuments?.length ?? 0) > 0) steps[1].completed = true;
  if ((v2Response?.declarationDocuments?.length ?? 0) > 0) steps[2].completed = true;
  if (status === 'policy_created' || isPolicyCreated) steps[3].completed = true;

  let lastCompletedIndex = -1;
  steps.forEach((step, idx) => {
    if (step.completed || isPolicyCreated) {
      lastCompletedIndex = idx;
    }
  });
  const completedSegments = Math.max(0, lastCompletedIndex);
  const progressPercentage = steps.length > 1 
    ? (completedSegments / (steps.length - 1)) * 100 
    : 0;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftScroll(scrollLeft > 5);
      setShowRightScroll(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [steps.length]);

  return (
    <Card className="bg-white border border-blue-200 mb-8 w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">
          {isProposal ? "Proposal Progress Journey" : "Quote Progress Journey"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 relative">
        <div className="relative w-full">
          {/* Left Fade Overlay */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none z-20 transition-opacity duration-300 ${
              showLeftScroll ? "opacity-100" : "opacity-0"
            }`}
          />
          {/* Right Fade Overlay */}
          <div
            className={`absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-20 transition-opacity duration-300 ${
              showRightScroll ? "opacity-100" : "opacity-0"
            }`}
          />

          <div 
            ref={scrollRef}
            onScroll={checkScroll}
            className="relative overflow-x-auto overflow-y-hidden py-[2px] w-full scrollbar-hide"
          >
            <div className="relative w-full min-w-max">
            {/* Background Line */}
            <div className="absolute top-6 left-[3.5rem] right-[3.5rem] h-0.5 bg-gray-200"></div>
            
            {/* Active Progress Line */}
            <div 
              className="absolute top-6 left-[3.5rem] h-0.5 bg-green-500 transition-all duration-500 ease-in-out"
              style={{ width: `calc((100% - 7rem) * ${progressPercentage / 100})` }}
            ></div>

            {/* Steps */}
            <div className="flex items-start justify-between relative z-10 w-full px-[1rem]">
            {steps.map((step, index) => {
              const isCompleted = step.completed || isPolicyCreated;

              return (
                <div
                  key={index}
                  className="flex flex-col items-center text-center flex-shrink-0 w-[5rem] cursor-pointer"
                  onClick={() => handleStepClick(step.targetId)}
                >
                  {/* Step Circle */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all hover:scale-105 ${
                      isCompleted
                        ? "bg-green-500 text-white hover:bg-green-600 shadow-sm"
                        : "bg-gray-200 text-gray-400 hover:bg-gray-300"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </div>

                  {/* Step Label */}
                  <div
                    className={`text-xs font-medium leading-tight px-1 ${
                      isCompleted ? "text-gray-900 font-bold" : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
