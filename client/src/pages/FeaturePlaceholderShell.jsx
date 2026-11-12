import React from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Reusable feature placeholder shell for active navigation destinations
 * scheduled for subsequent milestones.
 *
 * @param {{ title: string, description: string, moduleName?: string, phase?: string }} props
 * @returns {JSX.Element}
 */
export function FeaturePlaceholderShell({
  title,
  description,
  moduleName = 'Feature Module',
  phase = 'Milestone 5.6',
}) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill bg-emerald-accent/15 text-emerald-accent text-xs font-semibold uppercase tracking-wider mb-1">
          {moduleName}
        </div>
        <h1 className="text-2xl font-bold font-display text-text-primary">{title}</h1>
        <p className="text-xs text-text-secondary mt-1">{description}</p>
      </div>

      <div className="gym-card space-y-4">
        <div className="p-8 text-center space-y-2 border border-dashed border-workspace-border rounded-xl">
          <div className="w-12 h-12 rounded-full bg-emerald-accent/10 text-emerald-accent flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-text-primary">{title} Module</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            This workspace is scheduled for implementation in {phase}. Full integration and interactive features will be connected in that milestone.
          </p>
        </div>
      </div>
    </div>
  );
}

export default FeaturePlaceholderShell;
