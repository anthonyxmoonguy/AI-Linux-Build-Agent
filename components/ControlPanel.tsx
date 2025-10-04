
import React from 'react';
import type { BuildStep } from '../types';

interface ControlPanelProps {
  steps: BuildStep[];
  isBusy: boolean;
  onGenerate: () => void;
  onSetup: () => void;
  onBuild: () => void;
  onTest: () => void;
}

const Button: React.FC<{ onClick: () => void; disabled: boolean; children: React.ReactNode }> = ({ onClick, disabled, children }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left p-4 rounded-lg border-2 border-gray-700 bg-gray-800 hover:bg-gray-700 hover:border-cyan-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-800 disabled:hover:border-gray-700 flex items-center gap-4"
    >
      {children}
    </button>
  );
};


export const ControlPanel: React.FC<ControlPanelProps> = ({ steps, isBusy, onGenerate, onSetup, onBuild, onTest }) => {
  const isGenerateDisabled = steps[0].status !== 'pending';
  const isSetupDisabled = isBusy || steps[0].status !== 'success' || steps[1].status !== 'pending';
  const isBuildDisabled = isBusy || steps[1].status !== 'success' || steps[2].status !== 'pending';
  const isTestDisabled = isBusy || steps[2].status !== 'success' || steps[3].status !== 'pending';
  
  const getStepNumber = (step: number) => <div className="flex-shrink-0 bg-gray-700 text-cyan-400 rounded-full h-8 w-8 flex items-center justify-center font-bold">{step}</div>

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-3">
      <h2 className="text-xl font-bold text-white mb-2">Controls</h2>
      <Button onClick={onGenerate} disabled={isGenerateDisabled || isBusy}>
        {getStepNumber(1)}
        <div className="flex flex-col">
            <span className="font-semibold text-white">Generate Project Files</span>
            <span className="text-xs text-gray-400">Create all necessary scripts and configs.</span>
        </div>
      </Button>
      <Button onClick={onSetup} disabled={isSetupDisabled}>
        {getStepNumber(2)}
        <div className="flex flex-col">
            <span className="font-semibold text-white">Run setup.sh</span>
            <span className="text-xs text-gray-400">Clone Buildroot and prepare the workspace.</span>
        </div>
      </Button>
      <Button onClick={onBuild} disabled={isBuildDisabled}>
        {getStepNumber(3)}
        <div className="flex flex-col">
            <span className="font-semibold text-white">Run build.sh</span>
            <span className="text-xs text-gray-400">Compile the entire Linux system.</span>
        </div>
      </Button>
      <Button onClick={onTest} disabled={isTestDisabled}>
        {getStepNumber(4)}
        <div className="flex flex-col">
            <span className="font-semibold text-white">Run test.sh</span>
            <span className="text-xs text-gray-400">Boot the generated image in QEMU.</span>
        </div>
      </Button>
    </div>
  );
};
