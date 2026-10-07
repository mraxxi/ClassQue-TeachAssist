import React from 'react';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  /** Primary call to action: an empty screen should always say what to do next. */
  action?: { label: string; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
  testId?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action, secondary, testId }) => (
  <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-8 sm:p-12 text-center space-y-4" data-testid={testId}>
    <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
      <Icon className="w-7 h-7" />
    </div>
    <div className="space-y-1.5 max-w-md mx-auto">
      <h3 className="text-base font-extrabold text-stone-900">{title}</h3>
      <p className="text-sm text-stone-600 leading-relaxed">{description}</p>
    </div>
    {(action || secondary) && (
      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
        {action && (
          <button onClick={action.onClick} className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-sm font-bold shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
            {action.label}
          </button>
        )}
        {secondary && (
          <button onClick={secondary.onClick} className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-sm font-bold cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
            {secondary.label}
          </button>
        )}
      </div>
    )}
  </div>
);
