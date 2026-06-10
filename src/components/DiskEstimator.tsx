/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState } from 'react';
import { Gauge, Clock, Wifi, HelpCircle } from 'lucide-react';

interface ConnectionPreset {
  name: string;
  realSpeedMBs: number; // MB/s real-world transfer average
  theoreticalGbps: number;
  type: string;
}

const PRESETS: ConnectionPreset[] = [
  { name: '100 Mbps Wi-Fi (Poor Link)', realSpeedMBs: 8, theoreticalGbps: 0.1, type: 'wifi' },
  { name: 'Wi-Fi 5 / Wi-Fi 6 (Standard)', realSpeedMBs: 45, theoreticalGbps: 0.8, type: 'wifi' },
  { name: 'Wi-Fi 6E / Wi-Fi 7 (Near Router)', realSpeedMBs: 110, theoreticalGbps: 1.8, type: 'wifi' },
  { name: '1 Gbps Ethernet (Standard NAS)', realSpeedMBs: 112, theoreticalGbps: 1.0, type: 'ethernet' },
  { name: '2.5 Gbps Ethernet (OMV Optimized)', realSpeedMBs: 275, theoreticalGbps: 2.5, type: 'ethernet' },
  { name: '5 Gbps / 10 Gbps Ethernet (Pro Speed)', realSpeedMBs: 850, theoreticalGbps: 10.0, type: 'ethernet' },
  { name: 'Direct USB 3.2 / Thunderbolt (Local SSD)', realSpeedMBs: 980, theoreticalGbps: 10.0, type: 'direct' },
];

export default function DiskEstimator() {
  const [photoSize, setPhotoSize] = useState<number>(45); // Average RAW photo size in MB (e.g. Sony A7Riv is ~60MB, Canon R5 is ~45MB)
  const [photoCount, setPhotoCount] = useState<number>(1500); // Typical wedding catalog counts 1500-3000 photos
  const [isNfsOptimized, setIsNfsOptimized] = useState<boolean>(true);

  const totalSizeMB = photoSize * photoCount;
  const totalSizeGB = totalSizeMB / 1024;

  const calculateDuration = (speedMBs: number) => {
    // If not optimized, we simulate a 60% speed penalty due to synchronous lockups on millions of photo files
    const efficiencyFactor = isNfsOptimized ? 1.0 : 0.35;
    const finalSpeed = speedMBs * efficiencyFactor;
    const seconds = totalSizeMB / finalSpeed;
    return seconds;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSecs = Math.round(seconds % 60);
    if (minutes < 60) return `${minutes}m ${remainingSecs}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  return (
    <div id="disk-estimator-container" className="bg-zinc-900/35 backdrop-blur-md rounded-lg border border-zinc-800 p-5 space-y-5">
      <div>
        <h2 className="text-[15px] font-bold text-zinc-100 flex items-center gap-2 font-mono uppercase tracking-wider">
          <Clock className="w-4 h-4 text-cyan-400" />
          NFS_FLOW_SPEED_ESTIMATOR
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Estimate transfer latency for raw photo shoot catalogs and preview OMV volume performance benefits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Controls */}
        <div className="md:col-span-1 space-y-4 bg-zinc-950/40 p-4 rounded border border-zinc-800">
          <h3 className="text-xs font-bold text-zinc-300 border-b border-zinc-800 pb-2 uppercase tracking-wide font-mono">FLOW_METRIC_CONFIG</h3>
          
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-zinc-400 flex items-center justify-between font-mono">
              <span>RAW FILE SIZE</span>
              <span className="text-cyan-450 font-mono font-bold">{photoSize} MB</span>
            </label>
            <input
              id="raw-size-range"
              type="range"
              min="10"
              max="120"
              step="5"
              value={photoSize}
              onChange={(e) => setPhotoSize(Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>10MB (JPEG)</span>
              <span>45MB (Sony/Canon)</span>
              <span>120MB (Medium Format)</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-semibold text-zinc-400 flex items-center justify-between font-mono">
              <span>PHOTO COUNT (WEDDING/SHOOT)</span>
              <span className="text-cyan-450 font-mono font-bold">{photoCount.toLocaleString()} RAWs</span>
            </label>
            <input
              id="photo-count-range"
              type="range"
              min="100"
              max="8000"
              step="100"
              value={photoCount}
              onChange={(e) => setPhotoCount(Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>100</span>
              <span>3,500 (Standard Catalog)</span>
              <span>8,000</span>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800">
            <label className="flex items-center justify-between cursor-pointer group select-none">
              <span className="text-[11px] font-bold text-zinc-400 group-hover:text-zinc-350 font-mono uppercase">
                TUNED MOUNT OPTIMIZED
              </span>
              <input
                id="nfs-optimized-toggle"
                type="checkbox"
                checked={isNfsOptimized}
                onChange={() => setIsNfsOptimized(!isNfsOptimized)}
                className="rounded text-cyan-500 bg-zinc-900 border-zinc-700 h-4 w-4 accent-cyan-400 cursor-pointer"
              />
            </label>
            <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed font-mono">
              Saves up to 65% of elapsed transfer time by bypassing synchronous macOS write locks over network mounts.
            </p>
          </div>

          <div className="bg-zinc-900/60 p-3 rounded border border-zinc-850 flex items-center justify-between font-mono">
            <span className="text-[11px] text-zinc-450 uppercase">EST CONTENT RECOVERY:</span>
            <span className="text-xs font-bold text-cyan-400">{totalSizeGB >= 1024 ? `${(totalSizeGB / 1024).toFixed(2)} TB` : `${totalSizeGB.toFixed(1)} GB`}</span>
          </div>
        </div>

        {/* Speed Chart / Grid */}
        <div className="md:col-span-2 space-y-3 font-mono">
          <h3 className="text-xs font-bold text-zinc-300 flex items-center justify-between uppercase tracking-wide">
            <span>SOCKET_SPEED_DURATIONS</span>
            <span className="text-[10px] text-zinc-500 flex items-center gap-1 font-normal font-mono uppercase">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Average NFS link speed
            </span>
          </h3>

          <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
            {PRESETS.map((preset) => {
              const durationSec = calculateDuration(preset.realSpeedMBs);
              const durationFormatted = formatDuration(durationSec);
              const speedEff = isNfsOptimized ? preset.realSpeedMBs : Math.round(preset.realSpeedMBs * 0.35);
              
              // Calculate width of bar
              const maxRealSpeed = PRESETS[PRESETS.length - 1].realSpeedMBs;
              const barWidth = `${(speedEff / maxRealSpeed) * 100}%`;

              return (
                <div key={preset.name} className="bg-zinc-950/60 p-2.5 rounded border border-zinc-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-zinc-300 flex items-center gap-1.5 font-mono">
                        <Wifi className={`w-3.5 h-3.5 ${preset.type === 'ethernet' ? 'text-blue-400' : preset.type === 'direct' ? 'text-emerald-400' : 'text-zinc-505'}`} />
                        {preset.name}
                      </span>
                      <span className="font-mono text-zinc-400 font-bold">
                        {speedEff} MB/s
                      </span>
                    </div>

                    <div className="w-full bg-zinc-900 rounded-sm h-1 my-0.5 overflow-hidden">
                      <div
                        className={`h-full rounded-sm transition-all duration-500 ${
                          preset.type === 'direct'
                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                            : preset.type === 'ethernet'
                            ? 'bg-blue-500'
                            : 'bg-cyan-500'
                        }`}
                        style={{ width: barWidth }}
                      />
                    </div>
                  </div>

                  <div className="sm:border-l sm:border-zinc-800 sm:pl-4 text-left sm:text-right flex sm:flex-col justify-between items-center sm:items-end min-w-[90px] font-mono">
                    <span className="text-[9px] text-zinc-550 uppercase">DURATION</span>
                    <span className="font-bold text-cyan-400 text-[13px]">{durationFormatted}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
