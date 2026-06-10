/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ArchiveSession } from '../types';
import { Archive, Calendar, Database, CheckCircle2, AlertTriangle, FastForward, Trash2, ChevronDown, ChevronUp, FileSpreadsheet, FileJson } from 'lucide-react';

interface HistoryLogsProps {
  sessions: ArchiveSession[];
  onClearHistory: () => void;
  onDeleteSession: (id: string) => void;
}

export default function HistoryLogs({ sessions, onClearHistory, onDeleteSession }: HistoryLogsProps) {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateSessionSpeed = (bytes: number, durationMs: number) => {
    if (durationMs === 0) return '0 MB/s';
    const secs = durationMs / 1000;
    const mbs = (bytes / (1024 * 1024)) / secs;
    return `${mbs.toFixed(1)} MB/s`;
  };

  const handleExportCSV = (session: ArchiveSession) => {
    const headers = ['File Path', 'Size (Bytes)', 'Backup Status', 'Source SHA-256', 'Destination SHA-256', 'Error'];
    const rows = session.filesLog.map(f => [
      f.path,
      f.size,
      f.status,
      f.sourceHash || '',
      f.destHash || '',
      f.error || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `archive_report_${session.projectName.replace(/\s+/g, '_')}_${session.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = (session: ArchiveSession) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `archive_report_${session.projectName.replace(/\s+/g, '_')}_${session.id}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (sessions.length === 0) {
    return (
      <div id="history-empty" className="bg-zinc-900/35 backdrop-blur-md rounded-lg border border-zinc-800 p-8 text-center space-y-4 font-mono">
        <div className="w-10 h-10 rounded bg-zinc-950 flex items-center justify-center text-zinc-500 mx-auto border border-zinc-805">
          <Archive className="w-5 h-5 text-zinc-505" />
        </div>
        <div className="max-w-xs mx-auto space-y-1">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">NO_BACKUP_SESSIONS_FOUND</h3>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Record verified checksum file sync operations across your NFS network to populate this diagnostic ledger.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="history-container" className="bg-zinc-900/35 backdrop-blur-md rounded-lg border border-zinc-800 p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
        <div>
          <h2 className="text-[14px] font-bold text-zinc-100 flex items-center gap-2 uppercase tracking-wide">
            <Database className="w-4 h-4 text-cyan-400" />
            NFS_ARCHIVE_TRANSACTION_LOGS
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Audit history, hash validation details, and downloaded manifests for local photo project archival runs.
          </p>
        </div>
        
        <button
          id="btn-clear-history"
          onClick={onClearHistory}
          className="text-[11px] font-bold text-rose-450 hover:text-rose-400 flex items-center gap-1.5 bg-rose-950/10 hover:bg-rose-955/20 border border-rose-900/30 px-3 py-1.5 rounded-sm transition-all focus:outline-none cursor-pointer uppercase"
        >
          <Trash2 className="w-3.5 h-3.5" /> PURGE_HISTORY
        </button>
      </div>

      <div className="space-y-3 font-mono">
        {sessions.map((session) => {
          const isOpen = selectedSession === session.id;
          const transferSpeed = calculateSessionSpeed(session.totalBytes, session.durationMs);
          
          return (
            <div key={session.id} className="bg-zinc-950/50 rounded border border-zinc-805 overflow-hidden">
              {/* Header */}
              <div 
                id={`session-header-${session.id}`}
                onClick={() => setSelectedSession(isOpen ? null : session.id)}
                className="p-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer hover:bg-zinc-900/35 transition-all select-none"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-zinc-200 text-xs uppercase tracking-wide">{session.projectName}</h3>
                    <span className="text-[9px] bg-zinc-900 text-cyan-400 border border-zinc-800 px-1.5 py-0.5 rounded font-mono font-bold">
                      ID_{session.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-650" />
                      {new Date(session.date).toLocaleString()}
                    </span>
                    <span className="text-zinc-600">|</span>
                    <span>SRC: <code className="text-zinc-400 bg-zinc-950 px-1 py-0.5 rounded border border-zinc-900">{session.sourceDirName}</code></span>
                    <span className="text-zinc-600">|</span>
                    <span>DEST: <code className="text-zinc-400 bg-zinc-950 px-1 py-0.5 rounded border border-zinc-900">{session.destDirName}</code></span>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto gap-4 border-t md:border-t-0 border-zinc-900 pt-3.5 md:pt-0">
                  <div className="grid grid-cols-4 gap-3 text-center md:text-right min-w-[240px]">
                    <div className="space-y-0.5">
                      <div className="text-[9px] text-zinc-505 uppercase">BYTES</div>
                      <div className="font-mono text-zinc-300 text-[11px] font-bold">{formatBytes(session.totalBytes)}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[9px] text-emerald-500 uppercase">COPIED</div>
                      <div className="font-mono text-emerald-400 text-[11px] font-bold">{session.successfulFiles}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[9px] text-zinc-505 uppercase">SKIPPED</div>
                      <div className="font-mono text-zinc-450 text-[11px] font-bold">{session.skippedFiles}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[9px] text-rose-500 uppercase">FAILED</div>
                      <div className="font-mono text-rose-400 text-[11px] font-bold">{session.failedFiles}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-2">
                    <button
                      id={`delete-session-${session.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="p-1 px-1.5 rounded bg-zinc-900 hover:bg-rose-950/25 text-zinc-500 hover:text-rose-400 border border-zinc-800 hover:border-rose-900/40 transition-all cursor-pointer"
                      title="Delete record from ledger"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-450" /> : <ChevronDown className="w-4 h-4 text-zinc-450" />}
                  </div>
                </div>
              </div>

              {/* Collapsible Details */}
              {isOpen && (
                <div className="border-t border-zinc-850 bg-zinc-950/80 p-4 space-y-4 animate-fadeIn font-mono text-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-900/30 p-3 rounded border border-zinc-850">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xxs font-mono">
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase">AVERAGE_SPEED</span>
                        <span className="text-zinc-350 font-bold">{transferSpeed}</span>
                      </div>
                      <div>
                        <span className="text-zinc-550 block text-[9px] uppercase">ELAPSED_TIME</span>
                        <span className="text-zinc-350 font-bold">{(session.durationMs / 1000).toFixed(1)}s</span>
                      </div>
                      <div>
                        <span className="text-zinc-550 block text-[9px] uppercase">FILES_PROCESSED</span>
                        <span className="text-zinc-350 font-bold">{session.totalFiles}</span>
                      </div>
                      <div>
                        <span className="text-zinc-550 block text-[9px] uppercase">LEDGER_STATE</span>
                        <span className="text-cyan-400 font-bold">VERIFIED_SECURE</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto text-[11px]">
                      <button
                        id="btn-export-csv"
                        onClick={() => handleExportCSV(session)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-cyan-400 border border-zinc-800 hover:border-zinc-700 px-3 py-1 rounded transition-all cursor-pointer font-bold"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> EXPORT CSV
                      </button>
                      <button
                        id="btn-export-json"
                        onClick={() => handleExportJSON(session)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-cyan-400 border border-zinc-800 hover:border-zinc-700 px-3 py-1 rounded transition-all cursor-pointer font-bold"
                      >
                        <FileJson className="w-3.5 h-3.5 text-cyan-400" /> EXPORT JSON
                      </button>
                    </div>
                  </div>

                  {/* Scan List */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <h4 className="text-zinc-300 text-xxs font-bold uppercase tracking-wider">Integrity Cross-Check Details ({session.filesLog.length} files)</h4>
                      <span className="text-[10px] text-zinc-500 font-mono">SHA-256_VERIFIED</span>
                    </div>

                    <div className="max-h-52 overflow-y-auto border border-zinc-900 rounded bg-zinc-950 font-mono text-[10.5px]">
                      <table className="min-w-full divide-y divide-zinc-900 text-xxs">
                        <thead className="bg-zinc-900/60 text-zinc-550 select-none">
                          <tr>
                            <th className="px-3 py-2 text-left font-bold uppercase">File Name</th>
                            <th className="px-3 py-2 text-right font-bold uppercase">Size</th>
                            <th className="px-3 py-2 text-center font-bold uppercase">Status Check</th>
                            <th className="px-3 py-2 text-left font-bold uppercase">Source Hash</th>
                            <th className="px-3 py-2 text-left font-bold uppercase">Destination Hash</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900 text-zinc-400">
                          {session.filesLog.map((file, idx) => (
                            <tr key={idx} className="hover:bg-zinc-900/15">
                              <td className="px-3 py-1.5 truncate max-w-xs text-zinc-300 font-medium" title={file.path}>
                                {file.path.split('/').pop()}
                              </td>
                              <td className="px-3 py-1.5 text-right text-zinc-400 font-mono">
                                {formatBytes(file.size)}
                              </td>
                              <td className="px-3 py-1.5">
                                <span className={`mx-auto flex items-center justify-center w-max gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  file.status === 'success' 
                                    ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/15' 
                                    : file.status === 'skipped'
                                    ? 'bg-zinc-900 text-zinc-450 border border-zinc-800'
                                    : 'bg-rose-950/30 text-rose-450 border border-rose-900/20'
                                }`}>
                                  {file.status === 'success' && <CheckCircle2 className="w-2.5 h-2.5" />}
                                  {file.status === 'skipped' && <FastForward className="w-2.5 h-2.5" />}
                                  {file.status === 'failed' && <AlertTriangle className="w-2.5 h-2.5" />}
                                  {file.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 text-zinc-500 font-mono text-[10px] max-w-[110px] truncate" title={file.sourceHash}>
                                {file.sourceHash ? file.sourceHash.slice(0, 12) + '...' : '-'}
                              </td>
                              <td className="px-3 py-1.5 text-zinc-500 font-mono text-[10px] max-w-[110px] truncate" title={file.destHash}>
                                {file.destHash ? file.destHash.slice(0, 12) + '...' : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
