
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center border-b border-gray-700 pb-4">
      <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400">
        AI Linux Build Agent
      </h1>
      <p className="text-sm sm:text-base text-gray-400 mt-2">
        An interactive simulation of an AI building a custom Linux OS with Buildroot.
      </p>
    </header>
  );
};
