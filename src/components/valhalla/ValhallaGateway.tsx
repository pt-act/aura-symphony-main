import React, {useState, useEffect, useRef} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {X, Maximize2, Minimize2, MousePointer2, Terminal, Play, ShieldCheck, ShieldAlert, ShieldX} from 'lucide-react';
import {executeValhallaCommand, ValhallaResponse} from '../../api/valhalla';
import {analyzeScript, getSafetyBadge, SafetyReport} from '../../lib/valhalla-analyzer';
import {logValhallaTelemetry} from '../../lib/valhalla-telemetry';
import {useEscapeKey} from '../../lib/a11y';

interface ValhallaGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  toolName: string;
}

export default function ValhallaGateway({
  isOpen,
  onClose,
  toolName,
}: ValhallaGatewayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [cursorPos, setCursorPos] = useState({x: 50, y: 50});
  const [isHumanControl, setIsHumanControl] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ValhallaResponse | null>(null);
  const [safetyReport, setSafetyReport] = useState<SafetyReport | null>(null);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  useEscapeKey(onClose, isOpen);

  useEffect(() => {
    if (!isOpen) {
      setLogs([]);
      setResult(null);
      setIsExecuting(false);
      setSafetyReport(null);
      setOverrideConfirmed(false);
    }
  }, [isOpen]);

  const handleExecute = async () => {
    if (!commandInput.trim() || isExecuting) return;

    setIsExecuting(true);
    setLogs((prev) => [...prev, `[USER] ${commandInput}`]);
    setResult(null);
    setSafetyReport(null);

    try {
      // Simulate cursor movement while executing
      const interval = setInterval(() => {
        setCursorPos({
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 60,
        });
      }, 500);

      const response = await executeValhallaCommand(toolName, commandInput);
      clearInterval(interval);

      // ─── Safety analysis ───────────────────────────────────
      const report = analyzeScript(response.script);
      setSafetyReport(report);

      // Log telemetry
      logValhallaTelemetry({
        toolName,
        command: commandInput,
        scriptLength: response.script.length,
        safetyScore: report.score,
        safe: report.safe,
        findings: report.findings.length,
        timestamp: new Date().toISOString(),
      });

      if (!report.safe && !overrideConfirmed) {
        // Red — block execution
        setLogs((prev) => [
          ...prev,
          `[SAFETY] Script blocked: ${report.summary}`,
          ...report.findings.map(
            (f) => `[SAFETY] Line ${f.line}: ${f.severity.toUpperCase()} — ${f.message}`
          ),
          `[SAFETY] Review the script below. If safe, click "Override & Execute".`,
        ]);
        setResult(response);
        setIsExecuting(false);
        return;
      }

      if (report.safe && report.findings.length > 0 && !overrideConfirmed) {
        // Yellow — require confirmation
        setLogs((prev) => [
          ...prev,
          `[SAFETY] Warnings detected: ${report.summary}`,
          ...report.findings.map(
            (f) => `[SAFETY] Line ${f.line}: ${f.severity.toUpperCase()} — ${f.message}`
          ),
          `[SAFETY] Click "Confirm & Execute" to proceed with caution.`,
        ]);
        setResult(response);
        setIsExecuting(false);
        return;
      }

      // Green or override confirmed — execute
      setResult(response);
      setLogs((prev) => [...prev, ...response.logs]);
      setOverrideConfirmed(false);
    } catch (error: any) {
      setLogs((prev) => [...prev, `[ERROR] ${error.message}`]);
    } finally {
      setIsExecuting(false);
      setCommandInput('');
    }
  };

  if (!isOpen) return null;

  if (!isExpanded) {
    return (
      <motion.div
        className="valhalla-thumbnail"
        initial={{opacity: 0, scale: 0.8, y: 20}}
        animate={{opacity: 1, scale: 1, y: 0}}
        exit={{opacity: 0, scale: 0.8, y: 20}}
        onClick={() => setIsExpanded(true)}>
        <div className="thumbnail-header">
          <span className="tool-name">{toolName}</span>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }}>
            <X size={14} />
          </button>
        </div>
        <div className="thumbnail-content">
          <div className="mock-ui">
            <div className="mock-toolbar" />
            <div className="mock-canvas">
              {result?.imageUrl ? (
                <img src={result.imageUrl} alt="Render result" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              ) : (
                <motion.div
                  className="ai-cursor"
                  animate={{left: `${cursorPos.x}%`, top: `${cursorPos.y}%`}}
                  transition={{type: 'spring', stiffness: 50}}>
                  <MousePointer2 size={12} color="var(--color-teal-400)" />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="valhalla-modal-overlay"
        initial={{opacity: 0}}
        animate={{opacity: 1}}
        exit={{opacity: 0}}>
        <motion.div
          className="valhalla-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="valhalla-title"
          initial={{scale: 0.95, opacity: 0}}
          animate={{scale: 1, opacity: 1}}
          exit={{scale: 0.95, opacity: 0}}>
          <header className="valhalla-header">
            <div className="header-left">
              <h2 id="valhalla-title">Project Valhalla Gateway</h2>
              <span className="tool-badge">{toolName}</span>
            </div>
            <div className="header-right">
              <button
                className={`control-toggle ${isHumanControl ? 'active' : ''}`}
                onClick={() => setIsHumanControl(!isHumanControl)}>
                {isHumanControl ? 'Release Control' : 'Take Control'}
              </button>
              <button onClick={() => setIsExpanded(false)} aria-label="Minimize">
                <Minimize2 size={18} />
              </button>
              <button onClick={onClose} aria-label="Close Valhalla Gateway">
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="valhalla-content">
            <div className="valhalla-workspace">
              {/* Mock external tool UI */}
              <div className="mock-external-tool">
                <div className="tool-sidebar">
                  {result?.script && (
                    <div className="script-preview">
                      <div className="script-header">
                        <h4>Generated Script</h4>
                        {safetyReport && (
                          <span className={`safety-badge safety-${getSafetyBadge(safetyReport)}`}>
                            {getSafetyBadge(safetyReport) === 'green' && <ShieldCheck size={14} />}
                            {getSafetyBadge(safetyReport) === 'yellow' && <ShieldAlert size={14} />}
                            {getSafetyBadge(safetyReport) === 'red' && <ShieldX size={14} />}
                            {safetyReport.score}/100
                          </span>
                        )}
                      </div>
                      <pre>{result.script}</pre>
                      {safetyReport && safetyReport.findings.length > 0 && (
                        <div className="safety-findings">
                          {safetyReport.findings.map((f, i) => (
                            <div key={i} className={`finding finding-${f.severity}`}>
                              L{f.line}: {f.message}
                            </div>
                          ))}
                        </div>
                      )}
                      {safetyReport && !safetyReport.safe && (
                        <button
                          className="override-btn override-red"
                          onClick={() => {
                            setOverrideConfirmed(true);
                            handleExecute();
                          }}>
                          Override & Execute
                        </button>
                      )}
                      {safetyReport && safetyReport.safe && safetyReport.findings.length > 0 && (
                        <button
                          className="override-btn override-yellow"
                          onClick={() => {
                            setOverrideConfirmed(true);
                            handleExecute();
                          }}>
                          Confirm & Execute
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="tool-main">
                  <div className="tool-topbar" />
                  <div className="tool-canvas">
                    {result?.imageUrl ? (
                      <img src={result.imageUrl} alt="Render result" style={{width: '100%', height: '100%', objectFit: 'contain'}} />
                    ) : (
                      <>
                        {!isHumanControl && isExecuting && (
                          <motion.div
                            className="ai-cursor-large"
                            animate={{
                              left: `${cursorPos.x}%`,
                              top: `${cursorPos.y}%`,
                            }}
                            transition={{type: 'spring', stiffness: 50}}>
                            <MousePointer2 size={24} color="var(--color-teal-400)" />
                            <span className="cursor-label">Visual Virtuoso</span>
                          </motion.div>
                        )}
                        <div className="mock-3d-object" />
                      </>
                    )}
                  </div>
                </div>
                <div className="tool-properties" />
              </div>
            </div>

            <div className="valhalla-sidebar">
              <div className="sidebar-header">
                <Terminal size={16} />
                <h3>Action Log</h3>
              </div>
              <div className="log-container">
                {logs.map((log, i) => (
                  <div key={i} className="log-entry">
                    <span className="timestamp">
                      {new Date().toLocaleTimeString([], {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    <span className="message">{log}</span>
                  </div>
                ))}
                {isHumanControl && (
                  <div className="log-entry human">
                    <span className="message">Human control active. AI paused.</span>
                  </div>
                )}
              </div>
              <div className="command-input-container">
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
                  placeholder={`Command ${toolName}...`}
                  disabled={isExecuting || isHumanControl}
                />
                <button onClick={handleExecute} disabled={isExecuting || isHumanControl || !commandInput.trim()}>
                  <Play size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
