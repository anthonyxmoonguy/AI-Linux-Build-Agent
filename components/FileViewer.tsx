
import React from 'react';
import type { FileContent } from '../types';

interface FileViewerProps {
  files: FileContent[];
  activeFile: FileContent | null;
  onFileSelect: (file: FileContent) => void;
}

export const FileViewer: React.FC<FileViewerProps> = ({ files, activeFile, onFileSelect }) => {
  if (files.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex-grow flex items-center justify-center">
        <p className="text-gray-500">Project files will be displayed here once generated.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg flex flex-col flex-grow min-h-0">
      <div className="flex items-center border-b border-gray-700 bg-gray-800/60 rounded-t-lg">
        <div className="flex-1 overflow-x-auto whitespace-nowrap">
          {files.map((file) => (
            <button
              key={file.name}
              onClick={() => onFileSelect(file)}
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                activeFile?.name === file.name
                  ? 'bg-gray-900 text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-400 hover:bg-gray-700/50'
              }`}
            >
              {file.name}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 overflow-auto flex-grow bg-gray-900/70 rounded-b-lg">
        {activeFile ? (
          <pre className="text-sm text-gray-300 whitespace-pre-wrap">
            <code>{activeFile.content}</code>
          </pre>
        ) : null}
      </div>
    </div>
  );
};
