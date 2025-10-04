import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { StepIndicator } from './components/StepIndicator';
import { FileViewer } from './components/FileViewer';
import { Terminal } from './components/Terminal';
import type { BuildStep, Status, FileContent } from './types';
import {
  FILE_GENERATION_PROMPTS,
  getExecuteScriptPrompt,
  getBuildScriptPrompt,
} from './constants';

const App: React.FC = () => {
  const [steps, setSteps] = useState<BuildStep[]>([
    { name: 'Generate Project Files', status: 'pending' },
    { name: 'Execute setup.sh', status: 'pending' },
    { name: 'Execute build.sh', status: 'pending' },
    { name: 'Execute test.sh', status: 'pending' },
  ]);
  const [logs, setLogs] = useState<string[]>(['Welcome to the AI Linux Build Agent. Click "Generate Project Files" to begin.']);
  const [files, setFiles] = useState<FileContent[]>([]);
  const [activeFile, setActiveFile] = useState<FileContent | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [ai, setAi] = useState<GoogleGenAI | null>(null);

  useEffect(() => {
    if (process.env.API_KEY) {
      setAi(new GoogleGenAI({ apiKey: process.env.API_KEY }));
    }
  }, []);

  const updateStepStatus = useCallback((stepName: string, status: Status) => {
    setSteps(prevSteps => prevSteps.map(step =>
      step.name === stepName ? { ...step, status } : step
    ));
  }, []);
  
  const addLog = useCallback((log: string) => {
    setLogs(prev => [...prev, log]);
  }, []);

  const streamAndParseResponse = useCallback(async (
    prompt: string,
    onLog: (text: string) => void,
    onFix: (fileName: string, content: string) => void,
    onStateChange: (state: 'error' | 'analysis' | 'success') => void
  ) => {
    if (!ai) return;

    let currentBuffer = '';
    let currentTag: 'LOG' | 'ERROR' | 'ANALYSIS' | null = null;
    let fixFileName: string | null = null;
    
    const response = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    for await (const chunk of response) {
      currentBuffer += chunk.text;
      
      let changed = true;
      while(changed) {
        changed = false;
        
        const fixMatch = currentBuffer.match(/\[FIX:([^\]]+)\]/);
        if (fixMatch) {
            fixFileName = fixMatch[1];
            currentBuffer = currentBuffer.substring(fixMatch[0].length + fixMatch.index);
            changed = true;
        }
        const fixEndMatch = currentBuffer.match(/\[\/FIX\]/);
        if (fixFileName && fixEndMatch) {
            const content = currentBuffer.substring(0, fixEndMatch.index);
            onFix(fixFileName, content.trim());
            fixFileName = null;
            currentBuffer = currentBuffer.substring(fixEndMatch[0].length + fixEndMatch.index);
            changed = true;
        }

        const tagMatch = currentBuffer.match(/\[(LOG|ERROR|ANALYSIS)\]/);
        if (tagMatch) {
            currentTag = tagMatch[1] as 'LOG' | 'ERROR' | 'ANALYSIS';
            if (currentTag === 'ERROR') onStateChange('error');
            if (currentTag === 'ANALYSIS') onStateChange('analysis');
            currentBuffer = currentBuffer.substring(tagMatch[0].length + tagMatch.index);
            changed = true;
        }

        const tagEndMatch = currentBuffer.match(/\[\/(LOG|ERROR|ANALYSIS)\]/);
        if (currentTag && tagEndMatch && tagEndMatch[1] === currentTag) {
            const content = currentBuffer.substring(0, tagEndMatch.index);
            onLog(content);
            currentTag = null;
            currentBuffer = currentBuffer.substring(tagEndMatch[0].length + tagEndMatch.index);
            changed = true;
        }
        
        const successMatch = currentBuffer.match(/\[SUCCESS\]/);
        if (successMatch) {
            onStateChange('success');
            currentBuffer = currentBuffer.substring(successMatch[0].length + successMatch.index);
            changed = true;
        }
      }
    }
    if (currentBuffer) onLog(currentBuffer); // Flush remaining buffer as log
  }, [ai]);
  
  const handleGenerateFiles = useCallback(async () => {
    if (isBusy || !ai) return;
    setIsBusy(true);
    setLogs(['[AGENT] Generating project skeleton...']);
    updateStepStatus('Generate Project Files', 'running');
    
    try {
        const filePromises = FILE_GENERATION_PROMPTS.map(async (p) => {
            const prompt = `Generate a file named '${p.name}' with the following purpose: ${p.description}. Output only the raw content of the file, with no explanation or code block formatting.`;
            const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
            return {
                name: p.name,
                language: p.language,
                content: response.text.trim(),
            };
        });
        
        const generatedFiles = await Promise.all(filePromises);
        setFiles(generatedFiles);
        setActiveFile(generatedFiles[0]);
        updateStepStatus('Generate Project Files', 'success');
        addLog('[SUCCESS] Project files generated. Please review them.');
    } catch (error) {
        console.error(error);
        addLog(`[ERROR] Failed to generate files: ${error.message}`);
        updateStepStatus('Generate Project Files', 'failed');
    } finally {
        setIsBusy(false);
    }

  }, [isBusy, updateStepStatus, addLog, ai]);

  const runScriptStream = useCallback(async (scriptName: string, stepName: string) => {
      const scriptFile = files.find(f => f.name === scriptName);
      if (!scriptFile) {
          addLog(`[ERROR] Script not found: ${scriptName}`);
          return;
      }
      addLog(`---`);
      updateStepStatus(stepName, 'running');

      try {
          const response = await ai.models.generateContentStream({ model: "gemini-2.5-flash", contents: getExecuteScriptPrompt(scriptFile) });
          for await (const chunk of response) {
              addLog(chunk.text);
          }
          updateStepStatus(stepName, 'success');
      } catch (error) {
          addLog(`[ERROR] Failed to execute script: ${error.message}`);
          updateStepStatus(stepName, 'failed');
      } finally {
          setIsBusy(false);
      }

  }, [ai, files, addLog, updateStepStatus]);

  const handleRunSetup = useCallback(async () => {
    if (isBusy || steps[0].status !== 'success') return;
    setIsBusy(true);
    await runScriptStream('scripts/setup.sh', 'Execute setup.sh');
  }, [isBusy, steps, runScriptStream]);

  const handleRunBuild = useCallback(async () => {
    if (isBusy || steps[1].status !== 'success' || !ai) return;
    setIsBusy(true);
    addLog('---');
    updateStepStatus('Execute build.sh', 'running');

    const buildScript = files.find(f => f.name === 'scripts/build.sh');
    const defconfig = files.find(f => f.name === 'configs/tiny_linux_defconfig');
    const kernelFragment = files.find(f => f.name === 'configs/kernel_fragment.config');

    if (!buildScript || !defconfig || !kernelFragment) {
        addLog('[ERROR] Build files not found.');
        updateStepStatus('Execute build.sh', 'failed');
        setIsBusy(false);
        return;
    }

    const prompt = getBuildScriptPrompt(buildScript, defconfig, kernelFragment);

    try {
        await streamAndParseResponse(
            prompt,
            (log) => addLog(log),
            (fileName, content) => {
                addLog(`[AGENT] Applying fix to ${fileName}...`);
                const newFiles = files.map(f => f.name === fileName ? { ...f, content } : f);
                setFiles(newFiles);
            },
            (state) => {
                if (state === 'error') updateStepStatus('Execute build.sh', 'failed');
                if (state === 'analysis') updateStepStatus('Execute build.sh', 'fixing');
                if (state === 'success') {
                  updateStepStatus('Execute build.sh', 'success');
                  addLog('[SUCCESS] Build complete!');
                }
            }
        );
    } catch (error) {
        addLog(`[ERROR] Build simulation failed: ${error.message}`);
        updateStepStatus('Execute build.sh', 'failed');
    } finally {
        setIsBusy(false);
    }
    
  }, [isBusy, steps, updateStepStatus, ai, files, addLog, streamAndParseResponse]);

  const handleRunTest = useCallback(async () => {
    if (isBusy || steps[2].status !== 'success') return;
    setIsBusy(true);
    await runScriptStream('scripts/test.sh', 'Execute test.sh');
  }, [isBusy, steps, runScriptStream]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-mono flex flex-col p-4 sm:p-6 lg:p-8">
      {!ai && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg text-center">
                <h2 className="text-xl font-bold text-yellow-400 mb-2">Configuration Needed</h2>
                <p>Please set the `API_KEY` environment variable to use this application.</p>
            </div>
        </div>
      )}
      <Header />
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <ControlPanel
            steps={steps}
            isBusy={isBusy}
            onGenerate={handleGenerateFiles}
            onSetup={handleRunSetup}
            onBuild={handleRunBuild}
            onTest={handleRunTest}
          />
          <StepIndicator steps={steps} />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-[60vh] lg:min-h-0">
          <FileViewer 
            files={files} 
            activeFile={activeFile} 
            onFileSelect={setActiveFile} 
          />
          <Terminal logs={logs} />
        </div>
      </div>
    </div>
  );
};

export default App;
