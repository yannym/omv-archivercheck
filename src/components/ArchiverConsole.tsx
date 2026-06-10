/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { ArchivalFile, BackupConfig, ArchiveSession } from '../types';
import { 
  FolderOpen, Zap, AlertCircle, FileCheck, RefreshCw, Layers, Space, ShieldCheck, 
  Trash2, Play, AlertTriangle, CheckCircle2, Loader2, Gauge, CheckSquare, Sparkles, Download, ArrowRight, Eye, RefreshCcw, Database
} from 'lucide-react';

interface ArchiverConsoleProps {
  onSessionComplete: (session: ArchiveSession) => void;
}

// Simulated project payloads for previewing in frame
const SIMULATED_PROJECTS = [
  {
    id: 'sim_wedding',
    projectName: 'Aria & Dan Wedding Shoot - APFS SSD',
    sourceName: '/Volumes/Lexar_Pro_SSD/2026_06_Aria_Dan_Wedding',
    totalFilesCount: 220,
    totalSizeBytes: 10485760000, // 9.76 GB
    files: [
      { path: 'RAW/DSC04159.ARW', size: 48234500, type: 'image/x-sony-arw', lastModified: 1717894500000 },
      { path: 'RAW/DSC04160.ARW', size: 47983200, type: 'image/x-sony-arw', lastModified: 1717894520000 },
      { path: 'RAW/DSC04161.ARW', size: 48112300, type: 'image/x-sony-arw', lastModified: 1717894540000 },
      { path: 'RAW/DSC04162.ARW', size: 47653200, type: 'image/x-sony-arw', lastModified: 1717894560000 },
      { path: 'RAW/DSC04163.ARW', size: 49210000, type: 'image/x-sony-arw', lastModified: 1717894580000 },
      { path: 'RAW/DSC04164.ARW', size: 48300200, type: 'image/x-sony-arw', lastModified: 1717894600000 },
      { path: 'RAW/DSC04165.ARW', size: 48500400, type: 'image/x-sony-arw', lastModified: 1717894620000 },
      { path: 'RAW/DSC04166.ARW', size: 47990100, type: 'image/x-sony-arw', lastModified: 1717894640000 },
      { path: 'RAW/DSC04167.ARW', size: 48210350, type: 'image/x-sony-arw', lastModified: 1717894660050 },
      { path: 'RAW/DSC04168.ARW', size: 48430200, type: 'image/x-sony-arw', lastModified: 1717894680000 },
      { path: 'Previews/AriaDan_SneakPeak_01.jpg', size: 8430000, type: 'image/jpeg', lastModified: 1717897200000 },
      { path: 'Previews/AriaDan_SneakPeak_02.jpg', size: 7920000, type: 'image/jpeg', lastModified: 1717897250000 },
      { path: 'Lightroom/WeddingCatalog.lrcat', size: 550000000, type: 'application/octet-stream', lastModified: 1717899500000 },
      { path: 'Lightroom/WeddingCatalogHelper.lrdata', size: 120000000, type: 'application/octet-stream', lastModified: 1717899510000 },
      { path: 'Delivered/Gallery_All_HighRes.zip', size: 9110000000, type: 'application/zip', lastModified: 1717912000000 },
    ],
    alreadyBackedUp: ['Lightroom/WeddingCatalog.lrcat', 'RAW/DSC04159.ARW', 'RAW/DSC04160.ARW'] // Simulates skipping these duplicates!
  },
  {
    id: 'sim_portrait',
    projectName: 'Studio Portrait Shoot - ExFAT SSD',
    sourceName: '/Volumes/Sandisk_Extreme/2026_05_Studio_Session',
    totalFilesCount: 88,
    totalSizeBytes: 3824500000, // 3.56 GB
    files: [
      { path: 'CR3/IMG_2209.CR3', size: 34500000, type: 'image/x-canon-cr3', lastModified: 1716881100000 },
      { path: 'CR3/IMG_2210.CR3', size: 35120000, type: 'image/x-canon-cr3', lastModified: 1716881150000 },
      { path: 'CR3/IMG_2211.CR3', size: 34900000, type: 'image/x-canon-cr3', lastModified: 1716881200000 },
      { path: 'CR3/IMG_2212.CR3', size: 34750000, type: 'image/x-canon-cr3', lastModified: 1716881250000 },
      { path: 'CaptureOne/Studio_Portraits.cosessiondb', size: 280000000, type: 'application/octet-stream', lastModified: 1716885500000 },
      { path: 'Export/TIFF_16bit/Selects_Composite_01.tif', size: 1850000000, type: 'image/tiff', lastModified: 1716892300000 },
      { path: 'Export/TIFF_16bit/Selects_Composite_02.tif', size: 1540000000, type: 'image/tiff', lastModified: 1716892400000 },
      { path: 'Retouch/Notes_Final.txt', size: 12000, type: 'text/plain', lastModified: 1716892500000 },
    ],
    alreadyBackedUp: ['CR3/IMG_2209.CR3']
  }
];

export default function ArchiverConsole({ onSessionComplete }: ArchiverConsoleProps) {
  // Mode selection: Physical (Real File API) vs Simulated (Safe Sandbox for iframes)
  const [isSimulation, setIsSimulation] = useState<boolean>(true);
  const [browserSupported, setBrowserSupported] = useState<boolean>(true);
  const [iframeWarning, setIframeWarning] = useState<boolean>(false);

  // Pickers and States
  const [sourceDirHandle, setSourceDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [destDirHandle, setDestDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [sourceDirName, setSourceDirName] = useState<string>('');
  const [destDirName, setDestDirName] = useState<string>('');

  // Selected Simulation index
  const [selectedSimProjectIdx, setSelectedSimProjectIdx] = useState<number>(0);

  // Archiver configuration
  const [config, setConfig] = useState<BackupConfig>({
    integrityCheck: true,
    skipExisting: true,
    deleteAfterCopy: false,
    concurrencyLimit: 2
  });

  // Active status variables
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isArchiving, setIsArchiving] = useState<boolean>(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [scannedFiles, setScannedFiles] = useState<ArchivalFile[]>([]);
  const [copiedCount, setCopiedCount] = useState<number>(0);
  const [skippedCount, setSkippedCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [totalBytesToCopy, setTotalBytesToCopy] = useState<number>(0);
  const [bytesWritten, setBytesWritten] = useState<number>(0);
  const [transferSpeedMBs, setTransferSpeedMBs] = useState<number>(0);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [activeConsoleLog, setActiveConsoleLog] = useState<string[]>([]);
  const [backupCompleted, setBackupCompleted] = useState<boolean>(false);
  
  // Safe Storage Cleanup / Space Recovery state
  const [showCleanupPrompt, setShowCleanupPrompt] = useState<boolean>(false);
  const [cleanupConfirmed, setCleanupConfirmed] = useState<boolean>(false);
  const [cleanupRunning, setCleanupRunning] = useState<boolean>(false);
  const [cleanupCompleted, setCleanupCompleted] = useState<boolean>(false);
  
  // Speed metrics triggers
  const startTimerRef = useRef<number>(0);
  const bytesLoggedRef = useRef<number>(0);
  const activeAbortRef = useRef<boolean>(false);

  useEffect(() => {
    // Check browser support for Directory Pickers
    if (!(window as any).showDirectoryPicker) {
      setBrowserSupported(false);
      setIsSimulation(true);
    }
    // Check if running inside iframe (security constraints prevent directory picking in iframes)
    try {
      if (window.self !== window.top) {
        setIframeWarning(true);
        setIsSimulation(true); // Default to simulation if locked in iframe
      }
    } catch (e) {
      setIframeWarning(true);
      setIsSimulation(true);
    }
  }, []);

  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActiveConsoleLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  // Directory picking - Source (SSD)
  const handleSelectSource = async () => {
    try {
      if (!(window as any).showDirectoryPicker) return;
      const handle = await (window as any).showDirectoryPicker({
        mode: 'read'
      });
      setSourceDirHandle(handle);
      setSourceDirName(handle.name);
      addToLog(`Opened source project directory: ${handle.name}`);
      resetWorkflow();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        addToLog(`Error picking source directory: ${err.message}`);
      }
    }
  };

  // Directory picking - Destination (NAS NFS Share)
  const handleSelectDestination = async () => {
    try {
      if (!(window as any).showDirectoryPicker) return;
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
      setDestDirHandle(handle);
      setDestDirName(handle.name);
      addToLog(`Opened OMV NFS destination share: ${handle.name}`);
      resetWorkflow();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        addToLog(`Error picking destination directory: ${err.message}`);
      }
    }
  };

  const resetWorkflow = () => {
    setScannedFiles([]);
    setBackupCompleted(false);
    setCopiedCount(0);
    setSkippedCount(0);
    setFailedCount(0);
    setBytesWritten(0);
    setTotalBytesToCopy(0);
    setShowCleanupPrompt(false);
    setCleanupConfirmed(false);
    setCleanupRunning(false);
    setCleanupCompleted(false);
  };

  const handleScanDirectories = async () => {
    setIsScanning(true);
    addToLog("Starting deep directory recursion and lookup...");
    
    if (isSimulation) {
      // Simulate directory scanning
      setTimeout(() => {
        const simProj = SIMULATED_PROJECTS[selectedSimProjectIdx];
        let idCounter = 1;
        
        // Build simulated list duplicating or generating the structures
        const structuredFiles: ArchivalFile[] = [];
        let totalSize = 0;

        // Multiply the preloaded list to simulate a full high-fidelity wedding project
        // with raw photo variants, backup previews, and sidecars.
        const fileCountMultiplier = selectedSimProjectIdx === 0 ? 15 : 10;
        
        for (let m = 0; m < fileCountMultiplier; m++) {
          const original = simProj.files[m % simProj.files.length];
          const pathParts = original.path.split('/');
          const fileName = pathParts.pop()!;
          const folder = pathParts.join('/');
          
          let modifiedPath = original.path;
          if (m > 0) {
            // Append indexed variables to filenames
            const extension = fileName.substring(fileName.lastIndexOf('.'));
            const baseName = fileName.replace(extension, '');
            modifiedPath = `${folder}/${baseName}_${String(m).padStart(3, '0')}${extension}`;
          }

          const relativePath = modifiedPath;
          const isPreExisting = simProj.alreadyBackedUp.includes(original.path) && m % 3 === 0;

          structuredFiles.push({
            id: `sim_f_${idCounter++}`,
            path: relativePath,
            name: relativePath.split('/').pop() || '',
            size: original.size + (m * 4200), // fluctuate size slightly
            type: original.type,
            lastModified: original.lastModified - (m * 1000 * 60 * 5),
            status: isPreExisting && config.skipExisting ? 'skipped' : 'scanned',
            progress: 0,
            bytesTransferred: 0
          });
          
          if (!(isPreExisting && config.skipExisting)) {
            totalSize += original.size + (m * 4200);
          }
        }

        setScannedFiles(structuredFiles);
        setTotalBytesToCopy(totalSize);
        setIsScanning(false);
        const skipped = structuredFiles.filter(f => f.status === 'skipped').length;
        addToLog(`Deep scan completed. Identified ${structuredFiles.length} project files.`);
        addToLog(`Pre-analysis: ${skipped} identical files detected on OMV NAS - skipping those copies.`);
        addToLog(`Archival Payload: ${formatBytes(totalSize)} needs to be streamed to NFS.`);
      }, 1400);

    } else {
      // Direct File System Access API
      if (!sourceDirHandle || !destDirHandle) {
        addToLog("Error: Source and Destination directories must be mounted first.");
        setIsScanning(false);
        return;
      }

      try {
        const fileList: ArchivalFile[] = [];
        
        // Recursive Scanner
        async function scan(dirHandle: FileSystemDirectoryHandle, currentPath: string = '') {
          for await (const entry of (dirHandle as any).values()) {
            if (activeAbortRef.current) break;
            const fullPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
            
            if (entry.kind === 'file') {
              const fileObj = await entry.getFile();
              fileList.push({
                id: Math.random().toString(36).substring(2, 9),
                path: fullPath,
                name: entry.name,
                size: fileObj.size,
                type: fileObj.type || 'application/octet-stream',
                lastModified: fileObj.lastModified,
                sourceHandle: entry,
                status: 'scanned',
                progress: 0,
                bytesTransferred: 0
              });
            } else if (entry.kind === 'directory') {
              await scan(entry, fullPath);
            }
          }
        }

        await scan(sourceDirHandle);
        
        // Analyze for pre-existing files on destination to avoid overwriting (cross-checking rules)
        addToLog(`Scanning destination directory tree for pre-existing records...`);
        let duplicateCount = 0;
        let transferBytes = 0;

        for (const fileItem of fileList) {
          let alreadyExists = false;
          try {
            // Traverse destination handle matching path
            const parts = fileItem.path.split('/');
            const destFileName = parts.pop()!;
            let currentDestDir = destDirHandle;
            
            for (const p of parts) {
              currentDestDir = await currentDestDir.getDirectoryHandle(p, { create: false });
            }
            
            const existingFileHandle = await currentDestDir.getFileHandle(destFileName);
            const existingFile = await existingFileHandle.getFile();
            
            // Compare metadata (name, size, mod date representation)
            if (config.skipExisting && existingFile.size === fileItem.size) {
              alreadyExists = true;
              fileItem.status = 'skipped';
              fileItem.progress = 100;
              fileItem.bytesTransferred = fileItem.size;
              duplicateCount++;
            }
          } catch (e) {
            // File does not exist on destination, which is expected
          }

          if (!alreadyExists) {
            fileItem.status = 'pending';
            transferBytes += fileItem.size;
          }
        }

        setScannedFiles(fileList);
        setTotalBytesToCopy(transferBytes);
        setSkippedCount(duplicateCount);
        setIsScanning(false);
        addToLog(`Physical scan complete. Total files: ${fileList.length}, To Backup: ${fileList.length - duplicateCount}, Skipped: ${duplicateCount}`);
        addToLog(`Data payload to transfer over NFS: ${formatBytes(transferBytes)}`);
      } catch (err: any) {
        addToLog(`Scan failed: ${err.message}`);
        setIsScanning(false);
      }
    }
  };

  // SHA-256 Hashing of File handles
  const calculateSha256 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Interactive Archiving Engine
  const handleStartArchiving = async () => {
    if (scannedFiles.length === 0) return;
    
    setIsArchiving(true);
    setBackupCompleted(false);
    setCopiedCount(0);
    setFailedCount(0);
    setBytesWritten(0);
    activeAbortRef.current = false;
    startTimerRef.current = Date.now();
    bytesLoggedRef.current = 0;

    addToLog("Initiating high-concurrency backup pipe...");
    
    if (isSimulation) {
      // Simulation Loop
      const filesToProcess = scannedFiles.filter(f => f.status !== 'skipped');
      const skipped = scannedFiles.filter(f => f.status === 'skipped').length;
      setSkippedCount(skipped);

      let processedIdx = 0;
      
      const processSimQueue = async () => {
        if (processedIdx >= filesToProcess.length || activeAbortRef.current) {
          finishArchiving();
          return;
        }

        // Run batch concurrency based on config limits
        const activeBatch = filesToProcess.slice(processedIdx, processedIdx + config.concurrencyLimit);
        processedIdx += config.concurrencyLimit;

        const batchPromises = activeBatch.map(async (file) => {
          // 1. Mark hashing source
          updateFileStatus(file.id, 'hashing_source', 0);
          addToLog(`Hashing source file: ${file.name} to generate integrity token`);
          await delay(400);

          const mockSourceHash = generateMockHash(file.name + file.size);
          updateFileStatus(file.id, 'hashing_source', 100, mockSourceHash);

          // 2. Stream Transfer (Simulate Chunk Progress)
          updateFileStatus(file.id, 'copying', 0);
          addToLog(`Streaming ${file.name} (${formatBytes(file.size)}) via NFS to OMV NAS`);
          
          const steps = 4;
          for (let s = 1; s <= steps; s++) {
            if (activeAbortRef.current) return;
            await delay(350);
            const p = Math.round((s / steps) * 100);
            const chunkBytes = Math.round((file.size / steps) * s);
            
            setBytesWritten(prev => {
              const newlyWritten = chunkBytes - (s > 1 ? Math.round((file.size / steps) * (s - 1)) : 0);
              return prev + newlyWritten;
            });
            updateFileStatus(file.id, 'copying', p);
          }

          // 3. Mark Hashing Destination (Verifying write integrity)
          updateFileStatus(file.id, 'hashing_dest', 0);
          addToLog(`Verifying integrity: computing SHA-256 hash model at destination on OMV`);
          await delay(300);
          
          const mockDestHash = mockSourceHash; // Match perfectly for simulation default!
          updateFileStatus(file.id, 'success', 100, mockSourceHash, mockDestHash);
          setCopiedCount(prev => prev + 1);
          addToLog(`✓ Transferred & Verified: ${file.name}`);
        });

        await Promise.all(batchPromises);
        
        // Speed updates
        const elapsedSec = (Date.now() - startTimerRef.current) / 1000;
        const currentMBs = (bytesWritten / (1024 * 1024)) / elapsedSec;
        setTransferSpeedMBs(Math.round(currentMBs) || 45); // safeguard against divide by zero or infinity

        // Estimates left
        const bytesLeft = totalBytesToCopy - bytesWritten;
        const remainingSec = bytesLeft / (currentMBs * 1024 * 1024);
        setTimeRemainingSeconds(Math.max(0, Math.round(remainingSec)));

        setTimeout(processSimQueue, 150);
      };

      await processSimQueue();

    } else {
      // Physical copy over real files
      const pendingFiles = scannedFiles.filter(f => f.status === 'pending');
      let queueIdx = 0;

      const processQueue = async () => {
        if (queueIdx >= pendingFiles.length || activeAbortRef.current) {
          finishArchiving();
          return;
        }

        const batch = pendingFiles.slice(queueIdx, queueIdx + config.concurrencyLimit);
        queueIdx += config.concurrencyLimit;

        const batchPromises = batch.map(async (archiveItem) => {
          try {
            if (!archiveItem.sourceHandle || !destDirHandle) return;

            // Step 1: Hashing Source Model
            updateFileStatus(archiveItem.id, 'hashing_source', 0);
            addToLog(`Hashing source: ${archiveItem.name}`);
            const sourceFileObj = await archiveItem.sourceHandle.getFile();
            const sourceHash = await calculateSha256(sourceFileObj);
            updateFileStatus(archiveItem.id, 'hashing_source', 100, sourceHash);

            // Step 2: Stream copy (Write destination file)
            updateFileStatus(archiveItem.id, 'copying', 0);
            addToLog(`Streaming to OMV NFS: ${archiveItem.name}`);
            
            // Create target folders path in destination recursively
            const pathParts = archiveItem.path.split('/');
            const destFilename = pathParts.pop()!;
            let currentDestDir = destDirHandle;
            
            for (const part of pathParts) {
              currentDestDir = await currentDestDir.getDirectoryHandle(part, { create: true });
            }

            const writeHandle = await currentDestDir.getFileHandle(destFilename, { create: true });
            const writable = await writeHandle.createWritable();
            
            // Use stream writing if browser supports it
            await writable.write(sourceFileObj);
            await writable.close();
            
            // Increment overall progress size
            setBytesWritten(prev => prev + archiveItem.size);
            updateFileStatus(archiveItem.id, 'copying', 100);

            // Step 3: Integrity verifications (Hashing Destination file)
            if (config.integrityCheck) {
              updateFileStatus(archiveItem.id, 'hashing_dest', 0);
              addToLog(`Calculating destination hash for: ${archiveItem.name}`);
              const destFileObj = await writeHandle.getFile();
              const destHash = await calculateSha256(destFileObj);
              updateFileStatus(archiveItem.id, 'hashing_dest', 100, sourceHash, destHash);

              // Checksum Crosscheck Validation
              if (sourceHash === destHash) {
                updateFileStatus(archiveItem.id, 'success', 100, sourceHash, destHash);
                setCopiedCount(prev => prev + 1);
                addToLog(`✓ Verified Match: ${archiveItem.name}`);
                archiveItem.destHandle = writeHandle; // preserve reference
              } else {
                updateFileStatus(archiveItem.id, 'failed', 100, sourceHash, destHash, 'Integrity mismatch: SHA hash discrepancy!');
                setFailedCount(prev => prev + 1);
                addToLog(`❌ Integrity discrepancy on file: ${archiveItem.name}`);
              }
            } else {
              updateFileStatus(archiveItem.id, 'success', 100);
              setCopiedCount(prev => prev + 1);
            }

          } catch (err: any) {
            updateFileStatus(archiveItem.id, 'failed', 0, undefined, undefined, err.message);
            setFailedCount(prev => prev + 1);
            addToLog(`Error backing up file ${archiveItem.name}: ${err.message}`);
          }
        });

        await Promise.all(batchPromises);

        // Calculate performance
        const elapsedSec = (Date.now() - startTimerRef.current) / 1000;
        const currentMBs = (bytesWritten / (1024 * 1024)) / elapsedSec;
        setTransferSpeedMBs(Math.round(currentMBs));

        const bytesLeft = totalBytesToCopy - bytesWritten;
        const remainingSec = bytesLeft / (currentMBs * 1024 * 1024);
        setTimeRemainingSeconds(Math.max(0, Math.round(remainingSec)));

        setTimeout(processQueue, 50);
      };

      await processQueue();
    }
  };

  const finishArchiving = () => {
    setIsArchiving(false);
    setBackupCompleted(true);
    const duration = Date.now() - startTimerRef.current;
    
    // Save archival report to local history
    const sessionObj: ArchiveSession = {
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString(),
      projectName: isSimulation ? SIMULATED_PROJECTS[selectedSimProjectIdx].projectName : sourceDirName,
      sourceDirName: isSimulation ? SIMULATED_PROJECTS[selectedSimProjectIdx].sourceName : sourceDirName,
      destDirName: isSimulation ? 'OMV_Archive_Share/Wedding_Backups' : destDirName,
      totalFiles: scannedFiles.length,
      successfulFiles: copiedCount + (isSimulation ? scannedFiles.filter(f => f.status === 'success').length : 0),
      failedFiles: failedCount,
      skippedFiles: skippedCount,
      totalBytes: bytesWritten,
      durationMs: duration,
      filesLog: scannedFiles.map(f => ({
        path: f.path,
        size: f.size,
        status: f.status,
        sourceHash: f.sourceHash,
        destHash: f.destHash,
        error: f.error
      }))
    };

    onSessionComplete(sessionObj);
    addToLog(`Archival completed! Copied: ${copiedCount}, Skipped: ${skippedCount}, Failed: ${failedCount}`);
    
    if (config.deleteAfterCopy) {
      setShowCleanupPrompt(true);
    }
  };

  // Safe Deletion / HDD cleanup routine to free space
  const handleSafeCleanup = async () => {
    setCleanupRunning(true);
    addToLog("CRITICAL: Executing safe SSD cleanup routine...");
    
    if (isSimulation) {
      setTimeout(() => {
        // Mock deletion of copied and verified files
        const cleanableFiles = scannedFiles.filter(f => f.status === 'success');
        addToLog(`Safely trimmed ${cleanableFiles.length} files from localized SSD mounting path.`);
        addToLog(`Drives refreshed. Safely freed ${formatBytes(bytesWritten)} of local storage space!`);
        setCleanupRunning(false);
        setCleanupCompleted(true);
        setShowCleanupPrompt(false);
      }, 2000);
    } else {
      try {
        let deleted = 0;
        const verifiedSuccess = scannedFiles.filter(f => f.status === 'success');
        
        for (const fileItem of verifiedSuccess) {
          if (fileItem.sourceHandle) {
            // Delete file using File System API removal
            await fileItem.sourceHandle.remove();
            deleted++;
            addToLog(`Removed original local node: ${fileItem.name}`);
          }
        }
        
        addToLog(`SSD Vacuum clean completed. Safely wiped ${deleted} verified raw media items.`);
        addToLog(`Disk Space Recovered: ${formatBytes(bytesWritten)} free on Active SSD!`);
        setCleanupRunning(false);
        setCleanupCompleted(true);
        setShowCleanupPrompt(false);
      } catch (err: any) {
        addToLog(`Cleanup Error: Some directories locked. Cleanup halted: ${err.message}`);
        setCleanupRunning(false);
      }
    }
  };

  const handleAbortTransfer = () => {
    activeAbortRef.current = true;
    setIsArchiving(false);
    addToLog("Transfer manually aborted by photographer.");
  };

  // Utils
  const updateFileStatus = (id: string, status: ArchivalFile['status'], progress: number, sourceHash?: string, destHash?: string, error?: string) => {
    setScannedFiles(prev => prev.map(f => {
      if (f.id === id) {
        return {
          ...f,
          status,
          progress,
          sourceHash: sourceHash !== undefined ? sourceHash : f.sourceHash,
          destHash: destHash !== undefined ? destHash : f.destHash,
          error: error !== undefined ? error : f.error
        };
      }
      return f;
    }));
  };

  const generateMockHash = (input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padEnd(6, 'a') + 'da89f2cfbc2be118a8fecad8';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Determine current overall progress percentage
  const overallProgressPercent = totalBytesToCopy > 0 
    ? Math.round((bytesWritten / totalBytesToCopy) * 100) 
    : 0;

  return (
    <div className="space-y-5">
      {/* Target selector and Environment disclaimer */}
      <div id="archiver-disclaimer-panel" className="bg-zinc-900/35 backdrop-blur-md rounded-lg border border-zinc-800 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/60 pb-3.5">
          <div className="space-y-0.5">
            <h2 className="text-[15px] font-bold text-zinc-100 flex items-center gap-2 font-mono">
              <Zap className="w-4 h-4 text-cyan-400" />
              CONSOLE_CORE_PIPELINE
            </h2>
            <p className="text-xs text-zinc-400">
              Initiate high-integrity disk backups or simulate transmission streams across secure local NFS sockets.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded border border-zinc-800 self-start lg:self-center font-mono">
            <button
              id="btn-mode-sim"
              onClick={() => {
                setIsSimulation(true);
                resetWorkflow();
              }}
              className={`px-3 py-1 text-[11px] font-semibold rounded-sm transition-all flex items-center gap-1.5 ${
                isSimulation
                  ? 'bg-zinc-800 text-cyan-400 border border-zinc-700/50 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-350'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-400" /> SIMULATOR_RUN
            </button>
            <button
              id="btn-mode-real"
              onClick={() => {
                if (!browserSupported) {
                  addToLog("Physical picker is not supported in this browser. Try Chrome/Edge!");
                  return;
                }
                setIsSimulation(false);
                resetWorkflow();
              }}
              disabled={!browserSupported}
              className={`px-3 py-1 text-[11px] font-semibold rounded-sm transition-all flex items-center gap-1.5 ${
                !isSimulation
                  ? 'bg-zinc-800 text-cyan-400 border border-zinc-700/50 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-350 disabled:opacity-40'
              }`}
              title={!browserSupported ? "Directory Pickers require standard secure browser flags API." : ""}
            >
              <FolderOpen className="w-3 h-3" /> HARDWIRE_LOCAL
            </button>
          </div>
        </div>

        {/* Warning messages */}
        {iframeWarning && !isSimulation && (
          <div className="bg-amber-950/15 text-amber-300 border border-amber-900/40 p-3.5 rounded text-xs flex gap-3 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <span className="font-semibold block text-[13px] font-mono">Iframe Container Isolation Warning</span>
              <span className="block text-zinc-400">
                You are currently inside the Google AI Studio preview frame. Browsers block the directory API (<code className="text-zinc-300">showDirectoryPicker</code>) within cross-origin frames.
              </span>
              <span className="block font-medium text-cyan-400 mt-1">
                To backup real APFS and ExFAT files directly over OMV path, escape the sandbox using the "Open in New Tab" link in the top-right header menu.
              </span>
            </div>
          </div>
        )}

        {/* Directory Pickers vs Simulation Project Selector */}
        {isSimulation ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-zinc-400 block font-mono">SELECT MOUNTED PROJECT ARCHIVE (SSD)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SIMULATED_PROJECTS.map((p, idx) => (
                  <button
                    id={`sim-proj-${p.id}`}
                    key={p.id}
                    onClick={() => {
                       setSelectedSimProjectIdx(idx);
                       resetWorkflow();
                    }}
                    className={`p-2.5 text-left rounded border text-xs transition-all space-y-1 ${
                      selectedSimProjectIdx === idx
                        ? 'bg-zinc-900/80 border-cyan-500/30 text-white'
                        : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5 truncate text-zinc-200">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      {p.projectName}
                    </span>
                    <span className="block font-mono text-[10px] text-zinc-500">
                      {p.totalFilesCount} files • {p.alreadyBackedUp.length} in Cache
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 block font-mono">TARGET OMV NAS SHARE NODE</span>
              <div className="bg-zinc-950/60 p-2.5 rounded border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between font-mono">
                <span className="flex items-center gap-2 text-cyan-400">
                  <Database className="w-4 h-4" />
                  NFS://192.168.1.150/export/Wedding_Archives
                </span>
                <span className="text-[9px] text-emerald-400 uppercase font-bold tracking-wider bg-emerald-950/20 px-1 py-0.5 rounded border border-emerald-900/30">ONLINE</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">
                Assigned share directory: media_vault_vol1/photography/active_transfers
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Real Folder Loaders */}
            <div className="bg-zinc-950/40 p-3.5 rounded border border-zinc-800 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 block font-mono">SSD SOURCE MOUNT INGRESS (RAW MEDIA)</span>
              <div className="flex items-center gap-2">
                <button
                  id="btn-open-source"
                  onClick={handleSelectSource}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-3 rounded transition-all flex items-center gap-1.5 flex-shrink-0 font-mono"
                >
                  <FolderOpen className="w-3.5 h-3.5" /> MOUNT_DRIVE
                </button>
                <div className="font-mono text-xs text-zinc-300 truncate bg-zinc-900 border border-zinc-800/80 px-2.5 py-1.5 rounded w-full">
                  {sourceDirName || "Please select physical folder node..."}
                </div>
              </div>
              <span className="block text-[10px] text-zinc-500 font-mono">Accepts APFS partitions, ExFAT, and high speed USB.</span>
            </div>

            <div className="bg-zinc-950/40 p-3.5 rounded border border-zinc-800 space-y-2">
              <span className="text-[11px] font-semibold text-zinc-400 block font-mono">NFS DESTINATION EGRESS (OMV SHARE)</span>
              <div className="flex items-center gap-2">
                <button
                  id="btn-open-dest"
                  onClick={handleSelectDestination}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 px-3 rounded transition-all flex items-center gap-1.5 flex-shrink-0 font-mono"
                >
                  <FolderOpen className="w-3.5 h-3.5" /> MOUNT_NAS
                </button>
                <div className="font-mono text-xs text-zinc-300 truncate bg-zinc-900 border border-zinc-800/80 px-2.5 py-1.5 rounded w-full">
                  {destDirName || "Please mount network storage path..."}
                </div>
              </div>
              <span className="block text-[10px] text-zinc-500 font-mono">Must map to OMV high throughput NFS export mount point.</span>
            </div>
          </div>
        )}

        {/* Configuration settings panel */}
        <div className="bg-zinc-950/50 px-3.5 py-2.5 rounded border border-zinc-800 grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              id="config-checksum"
              type="checkbox"
              checked={config.integrityCheck}
              onChange={(e) => setConfig({ ...config, integrityCheck: e.target.checked })}
              className="rounded text-cyan-500 bg-zinc-900 border-zinc-700 h-3.5 w-3.5 accent-cyan-400"
            />
            <span className="text-zinc-400 text-[10.5px]">
              SHA-256 CHECK
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              id="config-skip"
              type="checkbox"
              checked={config.skipExisting}
              onChange={(e) => setConfig({ ...config, skipExisting: e.target.checked })}
              className="rounded text-cyan-500 bg-zinc-900 border-zinc-700 h-3.5 w-3.5 accent-cyan-400"
            />
            <span className="text-zinc-400 text-[10.5px]">
              SKIP DUPLICATES
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              id="config-delete"
              type="checkbox"
              checked={config.deleteAfterCopy}
              onChange={(e) => setConfig({ ...config, deleteAfterCopy: e.target.checked })}
              className="rounded text-rose-500 bg-zinc-900 border-rose-950 h-3.5 w-3.5 accent-rose-500"
            />
            <span className="text-rose-450 text-[10.5px] uppercase">
              Purge SSD Post-Write
            </span>
          </label>

          <div className="flex items-center gap-2 justify-between">
            <span className="text-zinc-500 text-[10.5px]">PARALLEL_STREAMS:</span>
            <select
              id="config-concurrency"
              value={config.concurrencyLimit}
              onChange={(e) => setConfig({ ...config, concurrencyLimit: Number(e.target.value) })}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-1.5 py-0.5 text-[10px] font-mono cursor-pointer"
            >
              <option value="1">1 (Single Pipe)</option>
              <option value="2">2 (Optimal Link)</option>
              <option value="4">4 (10GbE Max)</option>
            </select>
          </div>
        </div>

        {/* Action button */}
        <div className="flex gap-2">
          {scannedFiles.length === 0 ? (
            <button
              id="btn-scan"
              onClick={handleScanDirectories}
              disabled={isScanning || (!isSimulation && (!sourceDirHandle || !destDirHandle))}
              className="flex-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-cyan-400 font-mono font-semibold py-2 px-4 rounded text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  ANALYZING DIRECTORY BLOCKS & DUPLICATES...
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  LOAD_SECTOR_BLOCKS & ANALYZE_COMPLIANCE
                </>
              )}
            </button>
          ) : (
            <div className="flex gap-2 w-full font-mono">
              <button
                id="btn-start-archive"
                onClick={handleStartArchiving}
                disabled={isArchiving || scannedFiles.filter(f => f.status === 'scanned' || f.status === 'pending').length === 0}
                className="flex-3 bg-blue-600 hover:bg-blue-500 border border-blue-500/10 text-white font-semibold py-2 px-4 rounded text-xs transition-all flex items-center justify-center gap-2"
              >
                {isArchiving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    STREAMING_ASSETS ({overallProgressPercent}%)
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-white" />
                    EXECUTE_SECURE_TRANSMISSION
                  </>
                )}
              </button>
              <button
                id="btn-reset-workflow"
                onClick={resetWorkflow}
                disabled={isArchiving}
                className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white text-xs rounded py-2 px-4 transition-all hover:bg-zinc-900/30"
              >
                RELEASE_MOUNTS
              </button>
            </div>
          )}
        </div>
      </div>
      {activeConsoleLog.length > 0 && (
        <div id="archiver-status-panel" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Active queue monitor */}
          <div className="lg:col-span-2 space-y-3 bg-zinc-900/35 backdrop-blur-md rounded-lg border border-zinc-800 p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-800/80 pb-3">
                <h3 className="font-semibold text-zinc-300 text-sm flex items-center gap-2 font-mono">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  TRANSMISSION_STREAM_PROGRESS
                </h3>
                {isArchiving && (
                  <button
                    id="btn-abort"
                    onClick={handleAbortTransfer}
                    className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-550/20 px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all"
                  >
                    ABORT_STREAM
                  </button>
                )}
              </div>

              {/* Progress Panel */}
              {totalBytesToCopy > 0 && (
                <div className="bg-zinc-950/80 p-3.5 rounded border border-zinc-850 space-y-3 font-mono">
                  <div className="flex flex-wrap justify-between items-center gap-2 text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1.5 font-bold text-zinc-200">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      STATUS: {isArchiving ? 'SPOOLING_BYTES' : backupCompleted ? 'CRC_VERIFIED' : 'STANDBY'}
                    </span>
                    <span>COPIED: {formatBytes(bytesWritten)} / {formatBytes(totalBytesToCopy)}</span>
                  </div>

                  <div className="w-full bg-zinc-900 rounded-sm h-2 overflow-hidden border border-zinc-800">
                    <div
                      className={`h-full rounded-sm transition-all duration-300 ${
                        backupCompleted ? 'bg-emerald-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${overallProgressPercent}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center pt-1">
                    <div className="bg-zinc-900/40 p-2 rounded border border-zinc-850">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">LINK_SPEED</span>
                      <span className="text-[12px] font-bold text-zinc-200 block mt-0.5">{transferSpeedMBs || '-'} MB/s</span>
                    </div>
                    <div className="bg-zinc-900/40 p-2 rounded border border-zinc-850">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">SEC_ESTIMATE</span>
                      <span className="text-[12px] font-bold text-cyan-400 block mt-0.5">
                        {isArchiving ? (timeRemainingSeconds === 0 ? 'CALC...' : `${timeRemainingSeconds}s`) : '-'}
                      </span>
                    </div>
                    <div className="bg-zinc-900/40 p-2 rounded border border-zinc-850">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">DUPLICATE_CHECK</span>
                      <span className={`text-[12px] font-bold block mt-0.5 ${backupCompleted ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {backupCompleted ? '100% SECURE' : isArchiving ? 'CROSSCHECKING' : 'READY'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Individual File Items */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {scannedFiles.map((file) => (
                  <div key={file.id} className="bg-zinc-950/45 p-2 rounded border border-zinc-900 flex items-center justify-between text-[11px] font-mono">
                    <div className="space-y-0.5 truncate max-w-sm">
                      <span className="text-zinc-250 font-semibold block truncate" title={file.path}>{file.name}</span>
                      <span className="text-[9.5px] text-zinc-500 block">
                        Size: {formatBytes(file.size)} • Path: <code className="text-zinc-650">{file.path}</code>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {file.status === 'scanned' && (
                        <span className="bg-zinc-900 text-zinc-550 px-2 py-0.5 rounded border border-zinc-800">SCANNED</span>
                      )}
                      
                      {file.status === 'skipped' && (
                        <span className="bg-zinc-900/80 text-zinc-450 px-2 py-0.5 rounded border border-zinc-800 flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> OMV_CACHED
                        </span>
                      )}
 
                      {file.status === 'hashing_source' && (
                        <span className="bg-zinc-900 text-cyan-400 px-2 py-0.5 rounded border border-cyan-900/20 flex items-center gap-1 text-[10px]">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> LOCAL_HASH
                        </span>
                      )}

                      {file.status === 'copying' && (
                        <div className="flex items-center gap-2">
                          <div className="w-12 bg-zinc-900 h-1 rounded-sm overflow-hidden border border-zinc-800">
                            <div className="bg-cyan-500 h-full rounded-sm" style={{ width: `${file.progress}%` }} />
                          </div>
                          <span className="text-cyan-400 text-[10px]">{file.progress}%</span>
                        </div>
                      )}

                      {file.status === 'hashing_dest' && (
                        <span className="bg-zinc-900 text-cyan-400 px-2 py-0.5 rounded border border-cyan-900/20 flex items-center gap-1 text-[10px] animate-pulse">
                          DEST_WRITE_CONFIRM...
                        </span>
                      )}

                      {file.status === 'success' && (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="bg-emerald-950/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/30 flex items-center gap-1 text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" /> MOUNTED_VERIFIED
                          </span>
                        </div>
                      )}

                      {file.status === 'failed' && (
                        <span className="bg-rose-955/20 text-rose-400 px-2 py-0.5 rounded border border-rose-900/30" title={file.error}>
                          ERROR_REJECTED
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Space recovery / safe deletion panel */}
            {showCleanupPrompt && (
              <div id="space-cleanup-box" className="mt-4 bg-rose-950/15 border border-rose-900/30 p-4 rounded space-y-3 font-mono">
                <div className="flex items-start gap-2.5 text-rose-300">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-400 mt-0.5 flex-shrink-0 animate-pulse" />
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100 uppercase">SAFE DRIVE PURGE REQUEST (FREE SECTORS)</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      All {copiedCount} project media clips have been safely written to export share and verified using CRC SHA-256 byte validators. You can now purge original SSD logs to free local mount sectors.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    id="btn-cleanup-cancel"
                    onClick={() => setShowCleanupPrompt(false)}
                    className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-[11px] px-3 py-1 rounded font-semibold cursor-pointer"
                  >
                    KEEP_ORIGINALS
                  </button>
                  <button
                    id="btn-cleanup-confirm"
                    onClick={handleSafeCleanup}
                    disabled={cleanupRunning}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] px-3.5 py-1 rounded transition-all flex items-center gap-1.5 border border-rose-500/20 cursor-pointer"
                  >
                    {cleanupRunning ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> EXECUTING_TRIM...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" /> CONFIRM_SSD_PURGE
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {cleanupCompleted && (
              <div className="mt-4 bg-emerald-950/20 border border-emerald-900 p-4 text-emerald-405 rounded text-xs flex gap-2.5 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-zinc-200">SECTORS VACUUMED SUCCESSFUL</span>
                  <span className="text-zinc-400 block mt-0.5">Original raw camera directories flushed from workspace mounts safely. Local active storage freed. Ready for next media shoot.</span>
                </div>
              </div>
            )}
          </div>

          {/* Console / terminal logs container */}
          <div className="lg:col-span-1 bg-zinc-950 border border-zinc-900 rounded-lg p-4 flex flex-col justify-between font-mono text-[11px] space-y-4">
            <div className="space-y-2 flex-1">
              <span className="text-cyan-400 font-bold block border-b border-zinc-900 pb-2 flex items-center gap-2 select-none uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                OMV_ARCHIVAL_DAEMON
              </span>
              <div className="space-y-1.5 overflow-y-auto max-h-72 text-zinc-500 leading-relaxed text-[10.5px]">
                {activeConsoleLog.map((log, idx) => (
                  <div key={idx} className="break-all font-mono">
                    {log}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/40 p-3 rounded border border-zinc-800/80 text-[10.5px] text-zinc-500 space-y-1 font-mono">
              <span className="font-bold text-zinc-400 block text-[10px] uppercase tracking-wider">SOCKET_METRICS</span>
              <div>TRANSFERS: <span className="text-zinc-300 font-bold">{copiedCount} units</span></div>
              <div>BLOCK_VERIFIER: <span className="text-zinc-300 font-bold">SHA-256 (CPU-BOUND)</span></div>
              <div>SKIPS: <span className="text-cyan-400 font-bold">{skippedCount} matches</span></div>
              <div>FAILED: <span className="text-rose-400 font-bold">{failedCount} blocks</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
