import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { ComponentType, RefObject } from "react";

interface Step {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  index: number;
}

interface Props {
  steps: Step[];
  currentIndex: number;
  unlockedMaxIndex: number;
  onStepClick: (index: number) => void;
  isStepDisabled?: (index: number) => boolean;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
}

export function FormSteps({
  steps,
  currentIndex,
  unlockedMaxIndex,
  onStepClick,
  isStepDisabled,
  scrollContainerRef,
}: Props) {
  return (
    <div className="bg-primary/5 p-4 rounded-lg">
      <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-3 w-max mx-auto">
          {steps.map((step, idx) => {
            const defaultDisabled = idx !== currentIndex && idx > unlockedMaxIndex;
            const disabled = isStepDisabled ? isStepDisabled(idx) : defaultDisabled;
            const Icon = step.icon;

            return (
              <Tooltip key={step.id}>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <button
                      data-step-index={idx}
                      disabled={disabled}
                      onClick={() => !disabled && onStepClick(idx)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-smooth whitespace-nowrap ${idx === currentIndex
                        ? "bg-primary text-primary-foreground shadow-glow"
                        : idx < currentIndex
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : disabled
                            ? "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60"
                            : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        }`}
                    >
                      <span className="text-lg font-bold">{idx + 1}</span>
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm">{step.label}</span>
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {disabled
                    ? "Only reached and current steps are clickable"
                    : "Go to step"}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
}
