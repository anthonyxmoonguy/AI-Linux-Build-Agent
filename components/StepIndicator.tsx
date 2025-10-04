
import React from 'react';
import type { BuildStep, Status } from '../types';

const StatusIcon: React.FC<{ status: Status }> = ({ status }) => {
  switch (status) {
    case 'running':
      return <div className="w-4 h-4 rounded-full bg-blue-500 animate-spin"></div>;
    case 'fixing':
        return <div className="w-4 h-4 rounded-full bg-yellow-500 animate-pulse"></div>;
    case 'success':
      return (
        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'failed':
      return (
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'pending':
    default:
      return <div className="w-4 h-4 rounded-full bg-gray-600"></div>;
  }
};

const statusStyles: { [key in Status]: { text: string; bg: string } } = {
  pending: { text: "text-gray-400", bg: "bg-gray-700/50" },
  running: { text: "text-blue-300", bg: "bg-blue-900/50 animate-pulse" },
  fixing: { text: "text-yellow-300", bg: "bg-yellow-900/50 animate-pulse" },
  success: { text: "text-green-300", bg: "bg-green-900/50" },
  failed: { text: "text-red-300", bg: "bg-red-900/50" },
};

export const StepIndicator: React.FC<{ steps: BuildStep[] }> = ({ steps }) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <h2 className="text-xl font-bold text-white mb-4">Process Status</h2>
      <ul className="space-y-3">
        {steps.map((step, index) => (
          <li
            key={index}
            className={`flex items-center justify-between p-3 rounded-md transition-colors duration-300 ${statusStyles[step.status].bg}`}
          >
            <span className={`font-semibold ${statusStyles[step.status].text}`}>{step.name}</span>
            <StatusIcon status={step.status} />
          </li>
        ))}
      </ul>
    </div>
  );
};
