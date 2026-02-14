'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface FormStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function FormStepper({ steps, currentStep, onStepClick }: FormStepperProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = index <= currentStep && onStepClick;

          return (
            <li key={step.id} className="relative flex-1">
              {/* Línea conectora */}
              {index > 0 && (
                <div
                  className={cn(
                    "absolute left-0 top-4 -translate-y-1/2 w-full h-0.5 -translate-x-1/2",
                    isCompleted || isCurrent ? "bg-primary" : "bg-gray-200"
                  )}
                  style={{ width: 'calc(100% - 2rem)', left: '-50%', marginLeft: '1rem' }}
                />
              )}

              {/* Paso */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={cn(
                  "relative flex flex-col items-center group",
                  isClickable && "cursor-pointer"
                )}
              >
                {/* Círculo */}
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary text-primary bg-primary/10",
                    !isCompleted && !isCurrent && "border-gray-300 text-gray-500 bg-white"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </span>

                {/* Texto */}
                <span
                  className={cn(
                    "mt-2 text-sm font-medium text-center",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
