import React from 'react';
import { CheckCircle } from 'lucide-react';

export type StepProgressItem = {
  id: number;
  title: string;
};

type Props = {
  steps: StepProgressItem[];
  activeStep: number;
  isStepCompleted: (stepId: number) => boolean;
  onStepClick: (stepId: number) => void;
};

export function StepProgress({ steps, activeStep, isStepCompleted, onStepClick }: Props) {
  return (
    <div className="border-b bg-background px-4 py-2.5">
      <div className="flex items-center justify-center overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {steps.map((step, index) => {
            const isCompleted = isStepCompleted(step.id);
            const isCurrent = activeStep === step.id;
            const isAccessible = true;

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => onStepClick(step.id)}
                  className="flex items-center gap-1.5 group px-2 py-1 rounded-md transition-all cursor-pointer hover:bg-muted/50"
                >
                  <div
                    className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-all flex-shrink-0 ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isCurrent
                          ? 'bg-primary border-primary text-primary-foreground'
                          : isAccessible
                            ? 'bg-background border-primary/30 text-muted-foreground group-hover:border-primary'
                            : 'bg-background border-muted-foreground/30 text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4.5 h-4.5" />
                    ) : (
                      <span className="text-xs font-semibold">{step.id}</span>
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col items-start min-w-0">
                    <span
                      className={`text-sm font-medium transition-colors whitespace-nowrap ${
                        isCurrent
                          ? 'text-primary'
                          : isCompleted
                            ? 'text-green-600'
                            : isAccessible
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 w-8 sm:w-12 md:w-16 transition-colors flex-shrink-0 ${
                      isCompleted || activeStep > step.id
                        ? 'bg-green-500'
                        : activeStep === step.id
                          ? 'bg-primary/30'
                          : 'bg-muted-foreground/20'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

