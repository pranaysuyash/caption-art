import { Check } from 'lucide-react';
import '../styles/components.css';

export interface WorkflowStep {
  id: string;
  label: string;
  description?: string;
  status: 'completed' | 'current' | 'upcoming';
}

interface WorkflowProgressProps {
  steps: WorkflowStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowNavigation?: boolean;
}

export function WorkflowProgress({ 
  steps, 
  currentStep, 
  onStepClick,
  allowNavigation = false 
}: WorkflowProgressProps) {
  const handleStepClick = (index: number, status: string) => {
    if (allowNavigation && onStepClick && (status === 'completed' || status === 'current')) {
      onStepClick(index);
    }
  };

  return (
    <div style={{
      padding: 'var(--space-xl) 0',
      marginBottom: 'var(--space-2xl)'
    }}>
      {/* Desktop horizontal stepper */}
      <div 
        className="hide-mobile"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative'
        }}
      >
        {/* Progress line background */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          right: '20px',
          height: '2px',
          backgroundColor: 'var(--color-border)',
          zIndex: 0
        }} />
        
        {/* Progress line foreground */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          width: `${(currentStep / (steps.length - 1)) * 100}%`,
          height: '2px',
          backgroundColor: 'var(--color-brand-primary)',
          zIndex: 0,
          transition: 'width var(--transition-timing-base)'
        }} />

        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const isClickable = allowNavigation && (isCompleted || isCurrent);

          return (
            <div
              key={step.id}
              onClick={() => handleStepClick(index, step.status)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                flex: 1,
                cursor: isClickable ? 'pointer' : 'default',
                zIndex: 1
              }}
            >
              {/* Step circle */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: isCompleted || isCurrent 
                  ? 'var(--color-brand-primary)' 
                  : 'var(--color-surface)',
                border: `2px solid ${
                  isCompleted || isCurrent 
                    ? 'var(--color-brand-primary)' 
                    : 'var(--color-border)'
                }`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'var(--font-weight-semibold)',
                color: isCompleted || isCurrent ? 'white' : 'var(--color-text-secondary)',
                transition: 'all var(--transition-timing-base)',
                marginBottom: 'var(--space-sm)'
              }}>
                {isCompleted ? <Check size={20} /> : index + 1}
              </div>

              {/* Step label */}
              <div style={{
                textAlign: 'center',
                maxWidth: '120px'
              }}>
                <div style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: isCurrent ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                  color: isCurrent ? 'var(--color-text)' : 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-xs)'
                }}>
                  {step.label}
                </div>
                {step.description && (
                  <div style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile vertical stepper */}
      <div 
        className="show-mobile"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-lg)'
        }}
      >
        {steps.map((step, index) => {
          const isCompleted = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const isClickable = allowNavigation && (isCompleted || isCurrent);

          return (
            <div
              key={step.id}
              onClick={() => handleStepClick(index, step.status)}
              style={{
                display: 'flex',
                gap: 'var(--space-md)',
                cursor: isClickable ? 'pointer' : 'default'
              }}
            >
              {/* Step indicator with line */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative'
              }}>
                {/* Step circle */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isCompleted || isCurrent 
                    ? 'var(--color-brand-primary)' 
                    : 'var(--color-surface)',
                  border: `2px solid ${
                    isCompleted || isCurrent 
                      ? 'var(--color-brand-primary)' 
                      : 'var(--color-border)'
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: isCompleted || isCurrent ? 'white' : 'var(--color-text-secondary)',
                  flexShrink: 0
                }}>
                  {isCompleted ? <Check size={16} /> : index + 1}
                </div>

                {/* Connecting line (not for last step) */}
                {index < steps.length - 1 && (
                  <div style={{
                    width: '2px',
                    flexGrow: 1,
                    minHeight: '24px',
                    backgroundColor: isCompleted 
                      ? 'var(--color-brand-primary)' 
                      : 'var(--color-border)',
                    marginTop: 'var(--space-xs)'
                  }} />
                )}
              </div>

              {/* Step content */}
              <div style={{ flex: 1, paddingBottom: 'var(--space-sm)' }}>
                <div style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: isCurrent ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                  color: isCurrent ? 'var(--color-text)' : 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-xs)'
                }}>
                  {step.label}
                </div>
                {step.description && (
                  <div style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                  }}>
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
