/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ArchivalFile {
  id: string;
  path: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  sourceHandle?: FileSystemFileHandle;
  destHandle?: FileSystemFileHandle;
  status: 'scanned' | 'pending' | 'hashing_source' | 'copying' | 'hashing_dest' | 'verifying' | 'success' | 'skipped' | 'failed';
  error?: string;
  sourceHash?: string;
  destHash?: string;
  progress: number; // 0 to 100
  bytesTransferred: number;
}

export interface ArchiveSession {
  id: string;
  date: string;
  projectName: string;
  sourceDirName: string;
  destDirName: string;
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  skippedFiles: number;
  totalBytes: number;
  durationMs: number;
  filesLog: Array<{
    path: string;
    size: number;
    status: string;
    sourceHash?: string;
    destHash?: string;
    error?: string;
  }>;
}

export interface BackupConfig {
  integrityCheck: boolean;
  skipExisting: boolean;
  deleteAfterCopy: boolean;
  concurrencyLimit: number; // number of files to copy at once
}

export interface SpeedTestResult {
  writeSpeedMBs: number;
  readSpeedMBs: number;
  networkLatencyMs: number;
  connectionType: '1GbE' | '2.5GbE' | '10GbE' | 'Wi-Fi 5' | 'Wi-Fi 6/7' | 'Direct USB / Thunderbolt';
}
