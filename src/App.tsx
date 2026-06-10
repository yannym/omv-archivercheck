/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { ArchiveSession } from './types';
import ArchiverConsole from './components/ArchiverConsole';
import DiskEstimator from './components/DiskEstimator';
import NfsSettingsGuide from './components/NfsSettingsGuide';
import HistoryLogs from './components/HistoryLogs';
import { 
  Database, Server, HardDrive, ShieldCheck, Cpu, Library, HelpCircle, 
  ExternalLink, BarChart3, Settings, TrendingUp, Compass, Calendar
} from 'lucide-react';

const SEED_SESSIONS: ArchiveSession[] = [
  {
    id: 'hsq738f',
    projectName: 'Olivia & Mark Wedding - Spring 2026',
    sourceDirName: '/Volumes/StudioPRO_SSD/Weddings/2026_Olivia_Mark',
    destDirName: 'OMV_Media_Share/Wedding_Archives/2026_Olivia_Mark',
    date: '2026-05-12T10:15:30.000Z',
    totalFiles: 180,
    successfulFiles: 180,
    failedFiles: 0,
    skippedFiles: 0,
    totalBytes: 7483000000, 
    durationMs: 82000, // Speed: ~91MB/s
    filesLog: [
      { path: 'RAW/DSC01944.ARW', size: 48200000, status: 'success', sourceHash: '7a9bfe44b121e428dfc0a22112e', destHash: '7a9bfe44b121e428dfc0a22112e' },
      { path: 'RAW/DSC01945.ARW', size: 47900000, status: 'success', sourceHash: '2e41ffe88fac6652ed912fe49dd', destHash: '2e41ffe88fac6652ed912fe49dd' },
      { path: 'RAW/DSC01946.ARW', size: 48310000, status: 'success', sourceHash: 'bb9efac94daea32cba911ee6ec2', destHash: 'bb9efac94daea32cba911ee6ec2' },
      { path: 'Deliverables/FullWedding_HighRes.zip', size: 7338590000, status: 'success', sourceHash: 'ee9fac9430cbea82119cfed20da', destHash: 'ee9fac9430cbea82119cfed20da' }
    ]
  },
  {
    id: 'fha928c',
    projectName: 'Corporate Gala Showcase - April 2026',
    sourceDirName: '/Volumes/Backup_Disk/Portfolios/2026_Corporate_Gala',
    destDirName: 'OMV_Media_Share/Commercial_Archives/2026_Corporate_Gala',
    date: '2026-04-18T16:22:12.000Z',
    totalFiles: 45,
    successfulFiles: 35,
    failedFiles: 0,
    skippedFiles: 10, // duplicate skips
    totalBytes: 2540000000,
    durationMs: 29000, // Speed: ~87MB/s
    filesLog: [
      { path: 'RAW/IMG_1020.CR3', size: 35100000, status: 'success', sourceHash: '34a78cbefdcba8912efbcd7a003', destHash: '34a78cbefdcba8912efbcd7a003' },
      { path: 'RAW/IMG_1021.CR3', size: 34900000, status: 'skipped', sourceHash: 'ab2cd94fa108decd6efea9128fe', destHash: 'ab2cd94fa108decd6efea9128fe' },
      { path: 'RAW/IMG_1022.CR3', size: 35200000, status: 'skipped', sourceHash: 'fd9eadefa9cfef849ccdefbc13d', destHash: 'fd9eadefa9cfef849ccdefbc13d' },
      { path: 'Retouched/Gala_Highlight_Loop.mp4', size: 2469800000, status: 'success', sourceHash: 'c42ffa21fbcf9eada93bcdf1eec', destHash: 'c42ffa21fbcf9eada93bcdf1eec' }
    ]
  }
];

export default function App() {
  const [sessions, setSessions] = useState<ArchiveSession[]>([]);
  const [activeTab, setActiveTab] = useState<'console' | 'estimator' | 'nfs-guide' | 'history'>('console');

  useEffect(() => {
    // Load historical entries
    const saved = localStorage.getItem('local_archive_sessions');
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch (e) {
        setSessions(SEED_SESSIONS);
      }
    } else {
      // Seed initial data
      localStorage.setItem('local_archive_sessions', JSON.stringify(SEED_SESSIONS));
      setSessions(SEED_SESSIONS);
    }
  }, []);

  const handleSessionComplete = (newSession: ArchiveSession) => {
    const updated = [newSession, ...sessions];
    setSessions(updated);
    localStorage.setItem('local_archive_sessions', JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    localStorage.removeItem('local_archive_sessions');
    setSessions([]);
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('local_archive_sessions', JSON.stringify(updated));
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1014;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Calculate high-level performance metrics
  const totalBytesSaved = sessions.reduce((acc, curr) => acc + curr.totalBytes, 0);
  const totalFilesArchived = sessions.reduce((acc, curr) => acc + curr.successfulFiles, 0);
  const totalSkippedFiles = sessions.reduce((acc, curr) => acc + curr.skippedFiles, 0);

  return (
    <div id="main-workflow-app" className="min-h-screen bg-zinc-950 text-zinc-200 flex flex-col font-sans select-none antialiased">
      {/* Technical ambient grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(39,39,42,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(39,39,42,0.1)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Primary Header Layout */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-zinc-900 border border-zinc-750 flex items-center justify-center text-cyan-400 font-bold shadow-sm shadow-cyan-950/20">
              <Database className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 font-sans">
                OMV NAS Photo Archiver <span className="text-[10px] bg-cyan-505/10 text-cyan-400 border border-cyan-500/30 font-mono px-1.5 py-0.5 rounded font-normal uppercase tracking-wider">v2.1</span>
              </h1>
              <p className="text-[11px] text-zinc-400 font-mono">Vault Connection: NFS //192.168.1.150/Photos</p>
            </div>
          </div>

          {/* Connected Device indicators */}
          <div className="flex items-center gap-2.5 text-[11px] font-mono text-zinc-400">
            <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 px-2.5 py-1 rounded select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>NAS Node: <span className="text-zinc-200">ACTIVE</span></span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-zinc-800 px-2.5 py-1 rounded select-none">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Integrity Hash: <span className="text-cyan-400">SHA-256</span></span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Core Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 z-10">
        
        {/* KPI Dashboard Grid */}
        <section id="dashboard-statistics" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-zinc-900/35 backdrop-blur-md p-3.5 rounded-lg border border-zinc-800/80 flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Archived Volume</span>
              <div className="font-mono text-lg font-bold text-zinc-100">{formatBytes(totalBytesSaved)}</div>
            </div>
            <div className="w-8 h-8 rounded bg-zinc-850 flex items-center justify-center text-zinc-400 border border-zinc-800">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-zinc-900/35 backdrop-blur-md p-3.5 rounded-lg border border-zinc-800/80 flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Verified Files</span>
              <div className="font-mono text-lg font-bold text-zinc-100">{totalFilesArchived} RAWs</div>
            </div>
            <div className="w-8 h-8 rounded bg-zinc-850 flex items-center justify-center text-zinc-400 border border-zinc-800">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
          </div>

          <div className="bg-zinc-900/35 backdrop-blur-md p-3.5 rounded-lg border border-zinc-800/80 flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Registry Skips</span>
              <div className="font-mono text-lg font-bold text-zinc-100">{totalSkippedFiles} skips</div>
            </div>
            <div className="w-8 h-8 rounded bg-zinc-850 flex items-center justify-center text-zinc-400 border border-zinc-800">
              <Server className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-zinc-900/35 backdrop-blur-md p-3.5 rounded-lg border border-zinc-800/80 flex items-center justify-between shadow-sm col-span-2 lg:col-span-1">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">Transfer Integrity</span>
              <div className="font-mono text-lg font-bold text-emerald-400">100% Correct</div>
            </div>
            <div className="w-8 h-8 rounded bg-emerald-950/20 flex items-center justify-center text-emerald-450 border border-emerald-900/30">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </section>

        {/* Global tab routing headers */}
        <section id="navigation-tabs" className="border-b border-zinc-800 pb-px flex space-x-5 overflow-x-auto text-[13px] px-1 scrollbar-none font-mono">
          <button
            id="tab-btn-console"
            onClick={() => setActiveTab('console')}
            className={`pb-3 px-1 font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'console'
                ? 'border-cyan-500 text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" /> console_core
          </button>
          
          <button
            id="tab-btn-estimator"
            onClick={() => setActiveTab('estimator')}
            className={`pb-3 px-1 font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'estimator'
                ? 'border-cyan-500 text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> transmission_estimator
          </button>

          <button
            id="tab-btn-nfs"
            onClick={() => setActiveTab('nfs-guide')}
            className={`pb-3 px-1 font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'nfs-guide'
                ? 'border-cyan-500 text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> mac_nfs_tuning
          </button>

          <button
            id="tab-btn-history"
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-1 font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'border-cyan-500 text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Library className="w-3.5 h-3.5" /> transaction_logs ({sessions.length})
          </button>
        </section>

        {/* Tab contents routing */}
        <section id="tab-content-render" className="space-y-6">
          {activeTab === 'console' && (
            <ArchiverConsole onSessionComplete={handleSessionComplete} />
          )}

          {activeTab === 'estimator' && (
            <DiskEstimator />
          )}

          {activeTab === 'nfs-guide' && (
            <NfsSettingsGuide />
          )}

          {activeTab === 'history' && (
            <HistoryLogs 
              sessions={sessions} 
              onClearHistory={handleClearHistory} 
              onDeleteSession={handleDeleteSession} 
            />
          )}
        </section>
      </main>

      {/* Humble Footer Panel */}
      <footer className="border-t border-zinc-900 bg-zinc-950/70 py-6 text-center text-[11px] text-zinc-500 mt-auto select-none font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>
            © 2026 OMV NAS PRO ARCHIVER. SYSTEM PROTOCOL COMMITTED TO LOCAL MOUNT VERIFICATIONS.
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> CRC-32 / SHA-256 Bit-By-Bit Validations
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
