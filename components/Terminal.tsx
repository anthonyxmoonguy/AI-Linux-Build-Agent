
import React, { useEffect, useRef } from 'react';

interface TerminalProps {
  logs: string[];
}

export const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const terminalBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-black/50 border border-gray-700 rounded-lg flex flex-col h-96 flex-grow min-h-0">
      <div className="flex items-center justify-between bg-gray-800 text-gray-300 px-4 py-2 rounded-t-lg border-b border-gray-700">
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <span className="text-sm">bash</span>
        <div className="w-16"></div>
      </div>
      <div ref={terminalBodyRef} className="p-4 overflow-y-auto flex-grow">
        {logs.map((log, index) => (
          <div key={index} className="flex">
            <span className="text-gray-500 mr-2 shrink-0">{`$>`}</span>
            <p className="text-sm text-gray-300 break-words whitespace-pre-wrap">{log}</p>
          </div>
        ))}
         <div className="flex items-center">
            <span className="text-gray-500 mr-2 shrink-0">{`$>`}</span>
            <div className="w-2 h-4 bg-cyan-400 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};
