/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Terminal, Lightbulb, HardDrive, Network, Settings, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function NfsSettingsGuide() {
  const [activeTab, setActiveTab] = useState<'macos' | 'omv' | 'apfs-exfat'>('macos');

  const macosMountCommand = `sudo mkdir -p /Volumes/PhotoArchive
sudo mount_nfs -o rw,async,noatime,rsize=65536,wsize=65536,intr,tcp,locallocks nas-ip-or-hostname:/export/Archive /Volumes/PhotoArchive`;

  return (
    <div id="nfs-guide-container" className="bg-zinc-900/35 backdrop-blur-md rounded-lg border border-zinc-800 p-5 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[14px] font-bold text-zinc-100 flex items-center gap-2 font-mono uppercase tracking-wider">
            <Network className="w-4 h-4 text-cyan-400" />
            OMV_NFS_TUNING_GUIDE
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Configure your OpenMediaVault NFS Share and macOS mount settings to achieve native gigabit transfer rates.
          </p>
        </div>
        
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded border border-zinc-850 font-mono">
          <button
            id="tab-macos"
            onClick={() => setActiveTab('macos')}
            className={`px-3 py-1 text-[11px] font-semibold rounded-sm transition-all ${
              activeTab === 'macos'
                ? 'bg-zinc-800 text-cyan-400 border border-zinc-700/50 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-350'
            }`}
          >
            MACOS_MOUNT_PARAMS
          </button>
          <button
            id="tab-omv"
            onClick={() => setActiveTab('omv')}
            className={`px-3 py-1 text-[11px] font-semibold rounded-sm transition-all ${
              activeTab === 'omv'
                ? 'bg-zinc-800 text-cyan-400 border border-zinc-700/50 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-350'
            }`}
          >
            OMV_NFS_DAEMON
          </button>
          <button
            id="tab-apfs-exfat"
            onClick={() => setActiveTab('apfs-exfat')}
            className={`px-3 py-1 text-[11px] font-semibold rounded-sm transition-all ${
              activeTab === 'apfs-exfat'
                ? 'bg-zinc-800 text-cyan-400 border border-zinc-700/50 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-350'
            }`}
          >
            APFS_AND_EXFAT_SPEC
          </button>
        </div>
      </div>

      {activeTab === 'macos' && (
        <div className="space-y-4 animate-fadeIn font-mono text-xs">
          <div className="bg-zinc-950/60 p-4 rounded border border-zinc-800 space-y-3">
            <div className="flex items-start gap-3">
              <Terminal className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-zinc-200 uppercase text-[12px]">Optimized Mount parameters for high throughput</h3>
                <p className="text-[11px] text-zinc-405 mt-1 leading-relaxed">
                  Default macOS NFS mounts perform strictly in sync mode. Use these parameters to force local directory locking and background caches:
                </p>
              </div>
            </div>

            <div className="relative font-mono">
              <pre className="text-xs bg-zinc-950 p-3 rounded border border-zinc-900 overflow-x-auto text-emerald-400 leading-relaxed font-mono">
                {macosMountCommand}
              </pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-2">
              <div className="flex items-start gap-2 bg-zinc-900/30 p-2.5 rounded border border-zinc-800/60">
                <span className="font-bold text-cyan-455 font-mono">async</span>
                <span className="text-zinc-400 text-xxs">Enables client-side write caching. Speeds up photo transfer batches significantly.</span>
              </div>
              <div className="flex items-start gap-2 bg-zinc-900/30 p-2.5 rounded border border-zinc-800/60">
                <span className="font-bold text-cyan-455 font-mono">locallocks</span>
                <span className="text-zinc-400 text-xxs">Allows macOS-local mutex locking to avoid corrupting active editing sessions.</span>
              </div>
              <div className="flex items-start gap-2 bg-zinc-900/30 p-2.5 rounded border border-zinc-800/60">
                <span className="font-bold text-cyan-455 font-mono">rsize/wsize</span>
                <span className="text-zinc-400 text-xxs">Sets read/write buffer segments to 64KB (65536) to saturate high bandwidth.</span>
              </div>
              <div className="flex items-start gap-2 bg-zinc-900/30 p-2.5 rounded border border-zinc-800/60">
                <span className="font-bold text-cyan-455 font-mono">noatime</span>
                <span className="text-zinc-400 text-xxs">Disables metadata access timestamps logging to reduce CPU overhead.</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950/40 p-3.5 rounded border border-zinc-800 flex items-start gap-3">
            <Lightbulb className="w-4.5 h-4.5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-amber-400 uppercase text-[11px]">SAFE MOUNT PERSISTENCE PRO-TIP</h4>
              <p className="text-[11px] text-zinc-450 mt-1 leading-relaxed">
                To prevent macOS directory hangs during startup when the NAS goes sleeping, execute this script dynamically via Automator or Terminal triggers instead of system static <code className="text-zinc-300">fstab</code> hooks.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'omv' && (
        <div className="space-y-4 animate-fadeIn font-mono text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-950/40 p-4 rounded border border-zinc-800 flex flex-col justify-between">
              <div>
                <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-850 flex items-center justify-center text-cyan-400 mb-2">
                  <span className="font-bold text-xs">01</span>
                </div>
                <h3 className="font-bold text-zinc-200 text-xxs uppercase">Enable NFS Daemon</h3>
                <p className="text-[11px] text-zinc-455 mt-1 leading-relaxed">
                  Log in to your <b>OpenMediaVault</b> GUI, navigate to <b>Services &gt; NFS</b>, enable the master daemon toggle, and apply changes.
                </p>
              </div>
            </div>

            <div className="bg-zinc-950/40 p-4 rounded border border-zinc-800 flex flex-col justify-between">
              <div>
                <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-850 flex items-center justify-center text-cyan-400 mb-2">
                  <span className="font-bold text-xs">02</span>
                </div>
                <h3 className="font-bold text-zinc-200 text-xxs uppercase">Map client subnets</h3>
                <p className="text-[11px] text-zinc-455 mt-1 leading-relaxed">
                  Create a new share client node. Specify your specific macOS wireless IP or home subnet mask (e.g. <code className="text-zinc-300">192.168.1.0/24</code>).
                </p>
              </div>
            </div>

            <div className="bg-zinc-950/40 p-4 rounded border border-zinc-800 flex flex-col justify-between">
              <div>
                <div className="w-7 h-7 rounded bg-zinc-900 border border-zinc-850 flex items-center justify-center text-cyan-400 mb-2">
                  <span className="font-bold text-xs">03</span>
                </div>
                <h3 className="font-bold text-zinc-200 text-xxs uppercase">Permissions squash</h3>
                <p className="text-[11px] text-zinc-455 mt-1 leading-relaxed">
                  Set options: <code className="text-zinc-300">no_subtree_check,insecure</code>. Select squash: <code className="text-amber-400">All Squash</code> to bypass root ownership conflict flags.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950/65 p-3.5 rounded border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Settings className="w-4.5 h-4.5 text-cyan-400" />
              <div>
                <h4 className="text-xxs font-bold text-zinc-455 uppercase">Recommended OMV Share Options string:</h4>
                <p className="font-mono text-[11px] text-emerald-400 mt-0.5">rw,subtree_check,secure,all_squash,anonuid=1000,anongid=100</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-cyan-950/10 text-cyan-400 text-xxs px-2 py-0.5 rounded border border-cyan-800/40 font-bold uppercase">
              <ShieldCheck className="w-3.5 h-3.5" /> Security Verified
            </div>
          </div>
        </div>
      )}

      {activeTab === 'apfs-exfat' && (
        <div className="space-y-4 animate-fadeIn font-mono text-xs">
          <div className="bg-zinc-950/60 p-4 rounded border border-zinc-800 space-y-4">
            <div className="flex items-center gap-2 text-zinc-200 font-bold uppercase border-b border-zinc-800 pb-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              File System Specifications (APFS vs ExFAT)
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed font-mono">
              Your SSD workspace is formatted as **APFS** and **ExFAT**. While APFS supports instant catalog metadata operations inside macOS, Linux based systems (like OMV) can't natively unpack APFS physical logs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-mono">
              <div className="bg-zinc-900/40 p-3 rounded border border-zinc-850 space-y-1">
                <h4 className="text-xxs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> APFS DIRECT OVER NFS
                </h4>
                <p className="text-[10px] text-zinc-455 leading-relaxed">
                  Streaming files from an APFS partition via macOS to an EXT4/ZFS NFS share provides the highest reliability. The macOS kernel manages the APFS sectors locally and transmits simple protocol streams.
                </p>
              </div>

              <div className="bg-zinc-900/40 p-3 rounded border border-zinc-850 space-y-1">
                <h4 className="text-xxs font-bold text-amber-500 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> EXFAT VOLATILITY LIMITS
                </h4>
                <p className="text-[10px] text-zinc-455 leading-relaxed">
                  ExFAT drives do not support filesystem journaling, meaning a single raw cord dislocation mid-transfer can corrupt raw catalogs. Always verify hashes before flushing ExFAT sectors!
                </p>
              </div>
            </div>

            <div className="bg-cyan-950/15 text-cyan-400 border border-cyan-500/20 p-3.5 rounded text-xs flex gap-3">
              <Lightbulb className="w-4.5 h-4.5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-[11px] uppercase">How our Web App Archiver Solves This:</span>
                <span className="text-[10.5px] text-zinc-455 block leading-relaxed font-mono">
                  Our software runs within your local user-space using modern browser API capabilities. Directories are read as native local paths, allowing macOS to do the direct disk translations perfectly before streaming safely to the tuned NFS mount directories you map locally.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
