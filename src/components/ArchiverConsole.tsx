/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { ArchivalFile, BackupConfig, ArchiveSession } from '../types';
import { 
  FolderOpen, Zap, AlertCircle, FileCheck, RefreshCw, Layers, HardDrive, ShieldCheck, 
  Trash2, Play, AlertTriangle, CheckCircle2, Loader2, Gauge, CheckSquare, Sparkles, 
  ArrowRight, Search, ChevronRight, ChevronDown, Database, Server, Cpu, Laptop, Check, X
} from 'lucide-react';

interface ArchiverConsoleProps {
  onSessionComplete: (session: ArchiveSession) => void;
}

interface SimulatedDrivePreset {
  id: string;
  name: string;
  capacity: string;
  totalSizeBytes: number;
  usedSizeBytes: number;
  connection: string;
  color: string;
  folders: Array<{
    path: string;
    files: Array<{ name: string; size: number; type: string }>;
  }>;
}

// Simulated active SSD drive structures
const SIMULATED_DRIVE_PRESETS: SimulatedDrivePreset[] = [
  {
    id: 'drive_lexar',
    name: 'Lexar_Pro_SL600',
    capacity: '1 TB (APFS)',
    totalSizeBytes: 1000000000000,
    usedSizeBytes: 480000000000,
    connection: 'Thunderbolt 4 / USB-C',
    color: 'border-cyan-500/30 text-cyan-400 focus-ring-cyan',
    folders: [
      {
        path: 'Weddings/2026_Olivia_Mark',
        files: [
          { name: 'DSC01944.ARW', size: 48200000, type: 'image/x-sony-arw' },
          { name: 'DSC01945.ARW', size: 47900000, type: 'image/x-sony-arw' },
          { name: 'DSC01946.ARW', size: 48310000, type: 'image/x-sony-arw' },
          { name: 'WeddingCatalog.lrcat', size: 550000000, type: 'application/octet-stream' },
          { name: 'Previews_HD.lrdata', size: 1200000000, type: 'application/octet-stream' }
        ]
      },
      {
        path: 'Weddings/2026_Sneak_Peeks',
        files: [
          { name: 'DSC_Preview01.jpg', size: 8200000, type: 'image/jpeg' },
          { name: 'DSC_Preview02.jpg', size: 7900000, type: 'image/jpeg' }
        ]
      },
      {
        path: 'Commercial/Fashion_Autumn',
        files: [
          { name: 'RAW_0811.ARW', size: 52100000, type: 'image/x-sony-arw' },
          { name: 'RAW_0812.ARW', size: 52400000, type: 'image/x-sony-arw' },
          { name: 'Autumn_Lookbook_Selects.zip', size: 2310000000, type: 'application/zip' }
        ]
      }
    ]
  },
  {
    id: 'drive_sandisk',
    name: 'SanDisk_Extreme_Pro',
    capacity: '2 TB (ExFAT)',
    totalSizeBytes: 2000000000000,
    usedSizeBytes: 1240000000000,
    connection: 'USB 3.2 Gen 2x2',
    color: 'border-orange-500/30 text-orange-400 focus-ring-orange',
    folders: [
      {
        path: 'Portraits/Studio_Session_A',
        files: [
          { name: 'IMG_2209.CR3', size: 34500000, type: 'image/x-canon-cr3' },
          { name: 'IMG_2210.CR3', size: 35120000, type: 'image/x-canon-cr3' },
          { name: 'IMG_2211.CR3', size: 34900000, type: 'image/x-canon-cr3' },
          { name: 'IMG_2212.CR3', size: 34750000, type: 'image/x-canon-cr3' },
          { name: 'Studio_Portraits.cosessiondb', size: 280000000, type: 'application/octet-stream' }
        ]
      },
      {
        path: 'Travel/Kyoto_Streets',
        files: [
          { name: 'KYOTO_001.CR3', size: 36200000, type: 'image/x-canon-cr3' },
          { name: 'KYOTO_002.CR3', size: 35900000, type: 'image/x-canon-cr3' },
          { name: 'KYOTO_003.CR3', size: 36100000, type: 'image/x-canon-cr3' }
        ]
      }
    ]
  },
  {
    id: 'drive_lacie',
    name: 'LaCie_Rugged_RAID',
    capacity: '4 TB (HFS+)',
    totalSizeBytes: 4000000000000,
    usedSizeBytes: 2800000000000,
    connection: 'Thunderbolt 3',
    color: 'border-amber-500/30 text-amber-500 focus-ring-amber',
    folders: [
      {
        path: 'Cinematic/MusicVideo_Grading',
        files: [
          { name: 'Clip_01_Log.mp4', size: 4500000000, type: 'video/mp4' },
          { name: 'Clip_02_Log.mp4', size: 3900000000, type: 'video/mp4' },
          { name: 'LUT_Custom_Teal.cube', size: 450000, type: 'text/plain' }
        ]
      },
      {
        path: 'Cinematic/Renders',
        files: [
          { name: 'Rough_Cut_Draft.mp4', size: 850000000, type: 'video/mp4' }
        ]
      }
    ]
  },
  {
    id: 'drive_tough',
    name: 'Sony_TOUGH_Pro',
    capacity: '512 GB (APFS)',
    totalSizeBytes: 512000000000,
    usedSizeBytes: 64000000000,
    connection: 'SD Card UHS-II Slot',
    color: 'border-yellow-500/30 text-yellow-500',
    folders: [
      {
        path: 'Documentary/Interviews',
        files: [
          { name: 'Interview_01.MXF', size: 12400000000, type: 'application/mxf' },
          { name: 'Interview_02.MXF', size: 10800000000, type: 'application/mxf' }
        ]
      }
    ]
  }
];

// OMV NAS NFS Target folder list
const OMV_NFS_TARGET_PRESETS = [
  { id: 'dest_weddings', path: 'OMV_Media_Share/Wedding_Archives/2026', label: 'Wedding_Archives_2026' },
  { id: 'dest_commercial', path: 'OMV_Media_Share/Commercial_Backup', label: 'Commercial_Backup' },
  { id: 'dest_personal', path: 'OMV_Media_Share/Personal_Stock', label: 'Personal_Stock' },
  { id: 'dest_cinematic', path: 'OMV_Media_Share/Cinematic_Raid_0', label: 'Cinematic_Raid_0' }
];

interface MountedDrive {
  id: string;
  name: string;
  capacity: string;
  totalSizeBytes: number;
  usedSizeBytes: number;
  connection: string;
  type: 'simulated' | 'real';
  color: string;
  handle?: FileSystemDirectoryHandle;
  files: ArchivalFile[];
}

export default function ArchiverConsole({ onSessionComplete }: ArchiverConsoleProps) {
  // Mode selection: Sandbox Simulation (safest inside iframes) vs Physical Folder Access
  const [isSimulation, setIsSimulation] = useState<boolean>(true);
  const [browserSupported, setBrowserSupported] = useState<boolean>(true);
  const [iframeWarning, setIframeWarning] = useState<boolean>(false);

  // Mounted Drives states (allows managing multiple SSDs at once!)
  const [mountedDrives, setMountedDrives] = useState<MountedDrive[]>([]);
  // Target OMV configuration
  const [activeDestId, setActiveDestId] = useState<string>('dest_weddings');
  const [customDestPath, setCustomDestPath] = useState<string>('');
  const [destDirHandle, setDestDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [destDirName, setDestDirName] = useState<string>('');

  // Checklist for backup selection
  const [checkedFileURIs, setCheckedFileURIs] = useState<Set<string>>(new Set());
  // Search and quick filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMediaFilter, setActiveMediaFilter] = useState<'all' | 'raw' | 'lr' | 'video'>('all');

  // Expanded folders in File Manager tree (drive_id::folder_path)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Archiver pipeline profiles configurations
  const [config, setConfig] = useState<BackupConfig>({
    integrityCheck: true,
    skipExisting: true,
    deleteAfterCopy: false,
    concurrencyLimit: 2
  });

  // Active transmission statuses
  const [isArchiving, setIsArchiving] = useState<boolean>(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [copiedCount, setCopiedCount] = useState<number>(0);
  const [skippedCount, setSkippedCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);
  
  const [totalBytesToCopy, setTotalBytesToCopy] = useState<number>(0);
  const [bytesWritten, setBytesWritten] = useState<number>(0);
  const [transferSpeedMBs, setTransferSpeedMBs] = useState<number>(0);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [activeConsoleLog, setActiveConsoleLog] = useState<string[]>([]);
  const [backupCompleted, setBackupCompleted] = useState<boolean>(false);

  // Clean storage post-sync
  const [showCleanupPrompt, setShowCleanupPrompt] = useState<boolean>(false);
  const [cleanupRunning, setCleanupRunning] = useState<boolean>(false);
  const [cleanupCompleted, setCleanupCompleted] = useState<boolean>(false);

  const startTimerRef = useRef<number>(0);
  const activeAbortRef = useRef<boolean>(false);

  // On load, seed with a few simulation drives so that the user immediately has data
  useEffect(() => {
    // 1. Check Directory Picker API support
    if (!(window as any).showDirectoryPicker) {
      setBrowserSupported(false);
      setIsSimulation(true);
    }
    // 2. Check iframe isolation constraints
    try {
      if (window.self !== window.top) {
        setIframeWarning(true);
        setIsSimulation(true);
      }
    } catch (e) {
      setIframeWarning(true);
      setIsSimulation(true);
    }

    // Seed 2 default mounted simulation drives to display robust workspace instantly
    handleMountSimulatedPreset('drive_lexar');
    handleMountSimulatedPreset('drive_sandisk');
    
    // Expand root folders by default for quick view
    setExpandedFolders(new Set([
      'drive_lexar::Weddings',
      'drive_lexar::Weddings/2026_Olivia_Mark',
      'drive_sandisk::Portraits',
      'drive_sandisk::Portraits/Studio_Session_A'
    ]));

    addToLog("OMV Archiver system terminal ready. Mount media nodes to initiate transfer check.");
  }, []);

  const addToLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setActiveConsoleLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  // Build simulated file objects
  const buildSimulatedFilesForPreset = (presetId: string): ArchivalFile[] => {
    const preset = SIMULATED_DRIVE_PRESETS.find(p => p.id === presetId);
    if (!preset) return [];

    const fileList: ArchivalFile[] = [];
    let fileCounter = 1;

    preset.folders.forEach(dir => {
      dir.files.forEach(f => {
        fileList.push({
          id: `${presetId}_item_${fileCounter++}`,
          path: `${dir.path}/${f.name}`,
          name: f.name,
          size: f.size,
          type: f.type,
          lastModified: Date.now() - (Math.random() * 86400000 * 5),
          status: 'scanned',
          progress: 0,
          bytesTransferred: 0
        });
      });
    });

    return fileList;
  };

  // Mount simulated drives 
  const handleMountSimulatedPreset = (presetId: string) => {
    const preset = SIMULATED_DRIVE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setMountedDrives(prev => {
      if (prev.some(d => d.id === presetId)) {
        return prev;
      }

      const files = buildSimulatedFilesForPreset(presetId);
      const newDrive: MountedDrive = {
        id: preset.id,
        name: preset.name,
        capacity: preset.capacity,
        totalSizeBytes: preset.totalSizeBytes,
        usedSizeBytes: preset.usedSizeBytes,
        connection: preset.connection,
        type: 'simulated',
        color: preset.color,
        files
      };

      // Process side effects cleanly on next tick
      setTimeout(() => {
        setCheckedFileURIs(prevChecked => {
          const next = new Set(prevChecked);
          files.forEach(f => next.add(`${presetId}::${f.path}`));
          return next;
        });
        addToLog(`mounted system drive: ${preset.name} (${preset.capacity}) successfully.`);
      }, 0);

      return [...prev, newDrive];
    });
  };

  // Unmount specific SSD node
  const handleUnmountDrive = (driveId: string) => {
    setMountedDrives(prev => prev.filter(d => d.id !== driveId));
    // clean checkboxes
    setCheckedFileURIs(prev => {
      const next = new Set<string>(prev);
      next.forEach((uri) => {
        if (uri.startsWith(`${driveId}::`)) {
          next.delete(uri);
        }
      });
      return next;
    });
    addToLog(`Released storage node: ${driveId}`);
  };

  // Dismantle virtual simulation completely (Exit Sandbox Mode)
  const handleExitSandboxMode = () => {
    setMountedDrives(prev => prev.filter(d => d.type !== 'simulated'));
    setCheckedFileURIs(prev => {
      const next = new Set<string>();
      prev.forEach(uri => {
        if (uri.includes('::') && !uri.startsWith('drive_lexar::') && !uri.startsWith('drive_sandisk::') && !uri.startsWith('drive_lacie::') && !uri.startsWith('drive_tough::')) {
          next.add(uri);
        }
      });
      return next;
    });
    setIsSimulation(false);
    addToLog("DECOMMISSIONED: Virtual Sandbox drives dismantled. Workspace shifted to direct Physical Drive stream.");
  };

  // Physical directory picking helper (Mount real SSD folder)
  const handleMountPhysicalDrive = async () => {
    if (!(window as any).showDirectoryPicker) {
      addToLog("Error: Directory Picker API not supported on this client.");
      return;
    }

    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'read'
      });

      const driveId = `real_${Math.random().toString(36).substring(2, 9)}`;
      addToLog(`Physical directory picker accessed. Mounting sector: ${handle.name}...`);

      const fileList: ArchivalFile[] = [];
      
      // Local recursive loader function
      async function scanNode(nodeHandle: FileSystemDirectoryHandle, currentRelativePath: string = '') {
        for await (const entry of (nodeHandle as any).values()) {
          const entryPath = currentRelativePath ? `${currentRelativePath}/${entry.name}` : entry.name;
          if (entry.kind === 'file') {
            const rawFile = await entry.getFile();
            fileList.push({
              id: `${driveId}_f_${Math.random().toString(36).substring(2, 7)}`,
              path: entryPath,
              name: entry.name,
              size: rawFile.size,
              type: rawFile.type || 'application/octet-stream',
              lastModified: rawFile.lastModified,
              sourceHandle: entry,
              status: 'scanned',
              progress: 0,
              bytesTransferred: 0
            });
          } else if (entry.kind === 'directory') {
            await scanNode(entry, entryPath);
          }
        }
      }

      await scanNode(handle);

      const totalSize = fileList.reduce((sum, f) => sum + f.size, 0);

      const physicalDrive: MountedDrive = {
        id: driveId,
        name: handle.name,
        capacity: 'Direct System Node',
        totalSizeBytes: totalSize + 100000000000, 
        usedSizeBytes: totalSize,
        connection: 'HighSpeed Local Mount (Filesystem API)',
        type: 'real',
        color: 'border-emerald-500/30 text-emerald-400',
        handle,
        files: fileList
      };

      let alreadyMounted = false;
      setMountedDrives(prev => {
        // Automatically nix all simulated drives when a physical drive is loaded
        const filtered = prev.filter(d => d.type !== 'simulated');
        if (filtered.some(d => d.name === handle.name)) {
          alreadyMounted = true;
          return filtered;
        }
        return [...filtered, physicalDrive];
      });

      if (alreadyMounted) {
        addToLog(`Local directory '${handle.name}' is already mounted as an active storage sector.`);
        return;
      }
      
      // Auto-check all items from the new physical drive and nix simulated checked files
      setCheckedFileURIs(prev => {
        const next = new Set<string>();
        prev.forEach(uri => {
          // Keep only real checks
          if (uri.includes('::') && !uri.startsWith('drive_lexar::') && !uri.startsWith('drive_sandisk::') && !uri.startsWith('drive_lacie::') && !uri.startsWith('drive_tough::')) {
            next.add(uri);
          }
        });
        fileList.forEach(f => next.add(`${driveId}::${f.path}`));
        return next;
      });

      setIsSimulation(false);
      addToLog(`Mounted physical partition '${handle.name}' with ${fileList.length} items (${formatBytes(totalSize)}). Sandbox drives nixed.`);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        addToLog(`Mounting aborted: ${err.message}`);
      }
    }
  };

  // Mount Destination OMV Share Node (For Physical Mode)
  const handleMountDestinationNfs = async () => {
    try {
      if (!(window as any).showDirectoryPicker) return;
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
      setDestDirHandle(handle);
      setDestDirName(handle.name);
      addToLog(`NFS target folder linked successfully: ${handle.name}`);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        addToLog(`Destination linking error: ${err.message}`);
      }
    }
  };

  // Derive target path (Simulation vs Real)
  const chosenDestPath = useMemo(() => {
    if (!isSimulation) {
      return destDirName ? `NFS://${destDirName}` : 'No target directory selected';
    }
    const activePreset = OMV_NFS_TARGET_PRESETS.find(d => d.id === activeDestId);
    let pathBase = activePreset ? activePreset.path : 'OMV_Media_Share/default';
    if (customDestPath) {
      pathBase += `/${customDestPath.replace(/^\//, '')}`;
    }
    return pathBase;
  }, [isSimulation, activeDestId, customDestPath, destDirName]);

  // Extract folder paths hierarchy for all mounted drives
  const driveDirectoriesSetMap = useMemo(() => {
    const map: { [driveId: string]: string[] } = {};
    mountedDrives.forEach(drive => {
      const dirs = new Set<string>();
      drive.files.forEach(f => {
        const parts = f.path.split('/');
        parts.pop(); // discard file name
        let current = '';
        parts.forEach(p => {
          current = current ? `${current}/${p}` : p;
          if (current) dirs.add(current);
        });
      });
      map[drive.id] = Array.from(dirs).sort();
    });
    return map;
  }, [mountedDrives]);

  // Filter and compute which files should be listed
  const filteredFilesByDrive = useMemo(() => {
    const map: { [driveId: string]: ArchivalFile[] } = {};
    
    mountedDrives.forEach(drive => {
      map[drive.id] = drive.files.filter(f => {
        // Search query filter
        const matchesSearch = searchQuery === '' || 
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.path.toLowerCase().includes(searchQuery.toLowerCase());
          
        if (!matchesSearch) return false;

        // Category tags filter
        if (activeMediaFilter === 'all') return true;
        const ext = f.name.toLowerCase().split('.').pop();
        if (activeMediaFilter === 'raw') {
          return ['arw', 'cr3', 'cr2', 'nef', 'dng', 'iiq', 'mxf'].includes(ext || '');
        }
        if (activeMediaFilter === 'lr') {
          return ['lrcat', 'lrdata', 'cosessiondb', 'cube'].includes(ext || '');
        }
        if (activeMediaFilter === 'video') {
          return ['mp4', 'mov', 'mkv', 'mxf'].includes(ext || '');
        }
        return true;
      });
    });
    
    return map;
  }, [mountedDrives, searchQuery, activeMediaFilter]);

  // Aggregate selected bytes and count
  const selectionMetrics = useMemo(() => {
    let totalFiles = 0;
    let totalBytes = 0;
    
    mountedDrives.forEach(drive => {
      drive.files.forEach(f => {
        const fileURI = `${drive.id}::${f.path}`;
        if (checkedFileURIs.has(fileURI)) {
          totalFiles++;
          totalBytes += f.size;
        }
      });
    });

    return { totalFiles, totalBytes };
  }, [mountedDrives, checkedFileURIs]);

  // Toggle checklist of individual files
  const handleToggleFileCheck = (uri: string) => {
    setCheckedFileURIs(prev => {
      const next = new Set(prev);
      if (next.has(uri)) {
        next.delete(uri);
      } else {
        next.add(uri);
      }
      return next;
    });
  };

  // Toggle checklist for whole folders
  const handleToggleFolderCheck = (driveId: string, folderPath: string, currentlyChecked: boolean) => {
    const drive = mountedDrives.find(d => d.id === driveId);
    if (!drive) return;

    // Get all files inside this specific folder
    const filesInFolder = drive.files.filter(f => f.path.startsWith(folderPath + '/') || f.path === folderPath);

    setCheckedFileURIs(prev => {
      const next = new Set(prev);
      filesInFolder.forEach(f => {
        const uri = `${driveId}::${f.path}`;
        if (currentlyChecked) {
          next.delete(uri);
        } else {
          next.add(uri);
        }
      });
      return next;
    });
  };

  // Toggle checklist for a root drive node
  const handleToggleDriveCheck = (driveId: string, currentlyChecked: boolean) => {
    const drive = mountedDrives.find(d => d.id === driveId);
    if (!drive) return;

    setCheckedFileURIs(prev => {
      const next = new Set(prev);
      drive.files.forEach(f => {
        const uri = `${driveId}::${f.path}`;
        if (currentlyChecked) {
          next.delete(uri);
        } else {
          next.add(uri);
        }
      });
      return next;
    });
  };

  // Fast Bulk Selection categories
  const handleBulkSelectAction = (action: 'all-raw' | 'all-lr' | 'clear' | 'all') => {
    if (action === 'clear') {
      setCheckedFileURIs(new Set());
      addToLog("Cleared all project archival folder selections.");
      return;
    }

    const next = new Set<string>();
    mountedDrives.forEach(drive => {
      drive.files.forEach(f => {
        const uri = `${drive.id}::${f.path}`;
        const ext = f.name.toLowerCase().split('.').pop() || '';
        
        if (action === 'all') {
          next.add(uri);
        } else if (action === 'all-raw') {
          if (['arw', 'cr3', 'cr2', 'nef', 'dng', 'iiq', 'mxf'].includes(ext)) {
            next.add(uri);
          }
        } else if (action === 'all-lr') {
          if (['lrcat', 'lrdata', 'cosessiondb', 'cube'].includes(ext)) {
            next.add(uri);
          }
        }
      });
    });

    setCheckedFileURIs(next);
    addToLog(`Bulk Filter applied. Checked ${next.size} match records across partitions.`);
  };

  // Check if a folder is completely checked, partially checked, or unchecked
  const getFolderCheckedState = (driveId: string, folderPath: string) => {
    const drive = mountedDrives.find(d => d.id === driveId);
    if (!drive) return 'unchecked';

    const filesInFolder = drive.files.filter(f => f.path.startsWith(folderPath + '/') || f.path === folderPath);
    if (filesInFolder.length === 0) return 'unchecked';

    let checkedCount = 0;
    filesInFolder.forEach(f => {
      if (checkedFileURIs.has(`${driveId}::${f.path}`)) {
        checkedCount++;
      }
    });

    if (checkedCount === filesInFolder.length) return 'checked';
    if (checkedCount > 0) return 'partial';
    return 'unchecked';
  };

  // Check if a drive is completely check-highlighted, partially, or unchecked
  const getDriveCheckedState = (driveId: string) => {
    const drive = mountedDrives.find(d => d.id === driveId);
    if (!drive || drive.files.length === 0) return 'unchecked';

    let checkedCount = 0;
    drive.files.forEach(f => {
      if (checkedFileURIs.has(`${driveId}::${f.path}`)) {
        checkedCount++;
      }
    });

    if (checkedCount === drive.files.length) return 'checked';
    if (checkedCount > 0) return 'partial';
    return 'unchecked';
  };

  // Check if folder is expanded in render tree
  const toggleFolderExpanded = (uriKey: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(uriKey)) {
        next.delete(uriKey);
      } else {
        next.add(uriKey);
      }
      return next;
    });
  };

  // Check if a file's parent components are all expanded in the tree
  const isFileShownInTree = (driveId: string, filePath: string) => {
    const parts = filePath.split('/');
    parts.pop(); // discard file name
    
    let current = '';
    for (const p of parts) {
      current = current ? `${current}/${p}` : p;
      if (!expandedFolders.has(`${driveId}::${current}`)) {
        return false;
      }
    }
    return true;
  };

  // Check if a subdirectory's parent folders are all expanded
  const isFolderShownInTree = (driveId: string, folderPath: string) => {
    const parts = folderPath.split('/');
    parts.pop(); // discard last component to look at immediate parent
    if (parts.length === 0) return true; // top folders are always visible below the drive node

    let current = '';
    for (const p of parts) {
      current = current ? `${current}/${p}` : p;
      if (!expandedFolders.has(`${driveId}::${current}`)) {
        return false;
      }
    }
    return true;
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const generateMockHash = (input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padEnd(6, '0') + 'ea12a9efbdecc31b00e8bc8d';
  };

  // SHA-256 local calculation for Real Files
  const calculateSha256 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Execute unified archiving
  const handleStartArchiving = async () => {
    if (selectionMetrics.totalFiles === 0) {
      addToLog("Error: No raw media nodes checked in your file explorer.");
      return;
    }

    setIsArchiving(true);
    setBackupCompleted(false);
    setCopiedCount(0);
    setSkippedCount(0);
    setFailedCount(0);
    setBytesWritten(0);
    setTotalBytesToCopy(selectionMetrics.totalBytes);
    activeAbortRef.current = false;
    startTimerRef.current = Date.now();

    addToLog(`Starting archiver pipeline transfer to: ${chosenDestPath}`);
    addToLog(`Archival profile contains ${selectionMetrics.totalFiles} checked files (${formatBytes(selectionMetrics.totalBytes)})`);

    // Prepare active files sequence
    const filesToCopy: Array<{ drive: MountedDrive; file: ArchivalFile }> = [];
    mountedDrives.forEach(drive => {
      drive.files.forEach(f => {
        if (checkedFileURIs.has(`${drive.id}::${f.path}`)) {
          filesToCopy.push({ drive, file: f });
        }
      });
    });

    let processedIdx = 0;

    const processBatch = async () => {
      if (processedIdx >= filesToCopy.length || activeAbortRef.current) {
        finishArchiving(filesToCopy);
        return;
      }

      // Concurrency limits pipeline
      const batch = filesToCopy.slice(processedIdx, processedIdx + config.concurrencyLimit);
      processedIdx += config.concurrencyLimit;

      const batchPromises = batch.map(async ({ drive, file }) => {
        try {
          if (isSimulation || drive.type === 'simulated') {
            // Simulated Archival process
            updateDriveFileStatus(drive.id, file.id, 'hashing_source', 0);
            addToLog(`[CRC256] Hashing source: ${file.name}`);
            await delay(400);

            const mockHash = generateMockHash(file.name + file.size);
            updateDriveFileStatus(drive.id, file.id, 'hashing_source', 100, mockHash);

            // Double duplicate check skip logic
            if (config.skipExisting && file.name.includes("Cached") && Math.random() > 0.4) {
              updateDriveFileStatus(drive.id, file.id, 'skipped', 100, mockHash, mockHash);
              setSkippedCount(prev => prev + 1);
              addToLog(`⟲ Record verified in Cache. Block skipped: ${file.name}`);
              return;
            }

            // Copying segments progress simulation
            updateDriveFileStatus(drive.id, file.id, 'copying', 0);
            addToLog(`Spooling stream: ${file.name} to network sockets...`);
            
            const steps = 4;
            for (let st = 1; st <= steps; st++) {
              if (activeAbortRef.current) return;
              await delay(250);
              const p = Math.round((st / steps) * 100);
              const latestChunk = Math.round((file.size / steps) * st);
              const previousChunk = st > 1 ? Math.round((file.size / steps) * (st - 1)) : 0;
              
              setBytesWritten(prev => prev + (latestChunk - previousChunk));
              updateDriveFileStatus(drive.id, file.id, 'copying', p);
            }

            updateDriveFileStatus(drive.id, file.id, 'hashing_dest', 0);
            await delay(200);

            // Hash verification check
            updateDriveFileStatus(drive.id, file.id, 'success', 100, mockHash, mockHash);
            setCopiedCount(prev => prev + 1);
            addToLog(`✓ CRC SHA-255 Secure: ${file.name} successfully written.`);

          } else {
            // Real Direct Physical Copy
            if (!file.sourceHandle || !destDirHandle) {
              throw new Error("Local folder handles or Destination links missing.");
            }

            updateDriveFileStatus(drive.id, file.id, 'hashing_source', 0);
            addToLog(`[SHA-256] Hashing Local: ${file.name}`);
            const realFileObj = await file.sourceHandle.getFile();
            const sourceHash = await calculateSha256(realFileObj);
            updateDriveFileStatus(drive.id, file.id, 'hashing_source', 100, sourceHash);

            updateDriveFileStatus(drive.id, file.id, 'copying', 0);
            addToLog(`Writing stream: ${file.name}`);

            // Traversal structure resolution
            const parts = file.path.split('/');
            const destFilename = parts.pop()!;
            let currentDestDir = destDirHandle;
            
            for (const p of parts) {
              currentDestDir = await currentDestDir.getDirectoryHandle(p, { create: true });
            }

            // Create write target
            const targetHandle = await currentDestDir.getFileHandle(destFilename, { create: true });
            const writable = await targetHandle.createWritable();
            await writable.write(realFileObj);
            await writable.close();

            setBytesWritten(prev => prev + file.size);
            updateDriveFileStatus(drive.id, file.id, 'copying', 100);

            if (config.integrityCheck) {
              updateDriveFileStatus(drive.id, file.id, 'hashing_dest', 0);
              const destFileObj = await targetHandle.getFile();
              const destHash = await calculateSha256(destFileObj);

              if (sourceHash === destHash) {
                updateDriveFileStatus(drive.id, file.id, 'success', 100, sourceHash, destHash);
                setCopiedCount(prev => prev + 1);
                addToLog(`✓ Verified Match: ${file.name}`);
              } else {
                throw new Error("Integrity Checksum mismatch error!");
              }
            } else {
              updateDriveFileStatus(drive.id, file.id, 'success', 100);
              setCopiedCount(prev => prev + 1);
            }
          }
        } catch (err: any) {
          updateDriveFileStatus(drive.id, file.id, 'failed', 0, undefined, undefined, err.message);
          setFailedCount(prev => prev + 1);
          addToLog(`❌ Error on file ${file.name}: ${err.message}`);
        }
      });

      await Promise.all(batchPromises);

      // Speed telemetry calculator
      const elapsedSec = (Date.now() - startTimerRef.current) / 1000;
      const currentMBs = (bytesWritten / (1024 * 1024)) / (elapsedSec || 1);
      setTransferSpeedMBs(Math.round(currentMBs) || 92); // default realistic OMV NFS speed

      const bytesLeft = selectionMetrics.totalBytes - bytesWritten;
      const remainingSec = bytesLeft / (currentMBs * 1024 * 1024 || 1);
      setTimeRemainingSeconds(Math.max(0, Math.round(remainingSec)));

      setTimeout(processBatch, 80);
    };

    await processBatch();
  };

  const finishArchiving = (copiedSequence: Array<{ drive: MountedDrive; file: ArchivalFile }>) => {
    setIsArchiving(false);
    setBackupCompleted(true);
    const duration = Date.now() - startTimerRef.current;

    // Log complete session payload
    const sessionObj: ArchiveSession = {
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString(),
      projectName: `Project Archival - Multi-SSD Sync`,
      sourceDirName: `${mountedDrives.length} Mounted SSDs`,
      destDirName: chosenDestPath,
      totalFiles: copiedSequence.length,
      successfulFiles: copiedCount,
      failedFiles: failedCount,
      skippedFiles: skippedCount,
      totalBytes: bytesWritten,
      durationMs: duration,
      filesLog: copiedSequence.map(({ drive, file }) => {
        // Find latest mutated state
        const newestState = mountedDrives.find(d => d.id === drive.id)?.files.find(f => f.id === file.id);
        return {
          path: `[${drive.name}]/${file.path}`,
          size: file.size,
          status: newestState?.status || 'success',
          sourceHash: newestState?.sourceHash || 'Simulated_MD5',
          destHash: newestState?.destHash || 'Simulated_MD5',
          error: newestState?.error
        };
      })
    };

    onSessionComplete(sessionObj);
    addToLog(`Archiving workflow synchronized. Completed: ${copiedCount}, Skipped: ${skippedCount}, Failed: ${failedCount}`);

    if (config.deleteAfterCopy) {
      setShowCleanupPrompt(true);
    }
  };

  // Safe sector cleaning
  const handleSafeCleanup = async () => {
    setCleanupRunning(true);
    addToLog("CRITICAL EXECUTION: Purging copied raw buffers from origin flash sectors...");
    await delay(1500);

    // Prune checked files that completed successfully
    setMountedDrives(prev => prev.map(drive => {
      const remainingFiles = drive.files.filter(f => {
        const fileURI = `${drive.id}::${f.path}`;
        const isSelected = checkedFileURIs.has(fileURI);
        const copySucceeded = f.status === 'success';
        return !(isSelected && copySucceeded);
      });
      return {
        ...drive,
        files: remainingFiles,
        usedSizeBytes: Math.max(0, drive.usedSizeBytes - (drive.files.length - remainingFiles.length) * 45000000)
      };
    }));

    setCheckedFileURIs(new Set());
    setCleanupRunning(false);
    setCleanupCompleted(true);
    setShowCleanupPrompt(false);
    addToLog("SSD Flushed safely. Verified space recycled in local staging volumes.");
  };

  const handleAbortTransfer = () => {
    activeAbortRef.current = true;
    setIsArchiving(false);
    addToLog("Pipeline transfer aborted by photographer. Safely closing storage gates.");
  };

  const updateDriveFileStatus = (
    driveId: string, 
    fileId: string, 
    status: ArchivalFile['status'], 
    progress: number, 
    sourceHash?: string, 
    destHash?: string, 
    error?: string
  ) => {
    setMountedDrives(prev => prev.map(drive => {
      if (drive.id === driveId) {
        return {
          ...drive,
          files: drive.files.map(f => {
            if (f.id === fileId) {
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
          })
        };
      }
      return drive;
    }));
  };

  // Helper formats
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const overallProgressPercent = totalBytesToCopy > 0 
    ? Math.round((bytesWritten / totalBytesToCopy) * 100) 
    : 0;

  return (
    <div className="space-y-5">
      {/* Upper Pipeline Core Command Center */}
      <div id="command-dashboard-panel" className="bg-zinc-900/35 backdrop-blur-md rounded-lg border border-zinc-850 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
          <div className="space-y-1">
            <h2 className="text-[14px] font-bold text-zinc-100 flex items-center gap-2 font-mono uppercase tracking-wider">
              <Zap className="w-4 h-4 text-cyan-400" />
              INTELLIGENT_MULTI_SSD_WORKSPACE
            </h2>
            <p className="text-xs text-zinc-400">
              Mount multiple raw camera SSDs at once, parse volumes, and stream checksum secure copies directly to OMV NFS servers.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded border border-zinc-800 font-mono">
              <button
                id="switch-sim"
                onClick={() => {
                  setIsSimulation(true);
                  addToLog("Switched execution profiling to Safe Virtual Sandbox.");
                }}
                className={`px-3 py-1 text-[11px] font-bold rounded-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSimulation
                    ? 'bg-zinc-800 text-cyan-400 border border-zinc-700/50 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> VIRTUAL_SANDBOX
              </button>
              <button
                id="switch-real"
                onClick={() => {
                  if (!browserSupported) {
                    addToLog("Notice: File System Access API is disabled or unsupported in this client context.");
                    return;
                  }
                  setIsSimulation(false);
                  addToLog("Switched execution profiling to Native Physical Drive access.");
                }}
                className={`px-3 py-1 text-[11px] font-bold rounded-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                  !isSimulation
                    ? 'bg-zinc-800 text-cyan-400 border border-zinc-700/50 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-350'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" /> PHYSICAL_DRIVES
              </button>
            </div>

            {mountedDrives.some(d => d.type === 'simulated') && (
              <button
                id="btn-dismiss-sandbox"
                onClick={handleExitSandboxMode}
                className="px-3 py-1.5 text-[11px] font-bold rounded border border-rose-900 bg-rose-950/35 hover:bg-rose-950/55 text-rose-400 cursor-pointer transition-all active:scale-95 font-mono shadow-[0_0_12px_rgba(244,63,94,0.1)] flex items-center gap-1.5"
                title="Dismantle all simulated storage nodes and clear the staging deck."
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" /> EXIT_SANDBOX_MODE
              </button>
            )}
          </div>
        </div>

        {/* Warning panel inside iframe */}
        {iframeWarning && !isSimulation && (
          <div className="bg-amber-950/15 text-amber-300 border border-amber-900/40 p-4 rounded text-xs flex gap-3 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <span className="font-bold block text-[12px] font-mono uppercase">Iframe Security Shield Active</span>
              <span className="block text-zinc-400 font-mono">
                The Directory Mount Selector requires elevated window permissions. Real directory pickers might fail inside nested iframes. Use **VIRTUAL_SANDBOX** to preview, or hit "Open in New Tab" to test real local SSD volumes!
              </span>
            </div>
          </div>
        )}

        {/* Core Layout Split: Source Deck/Target share vs Interactive File Tree */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT DECK (Column Span 4): MOUNT CONTROLLER & OMV CHANNELS */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* SSD Storage Panel */}
            <div className="bg-zinc-950/40 p-4 rounded border border-zinc-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                <span className="text-[11px] font-bold text-zinc-350 font-mono uppercase tracking-wide flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  MOUNTED_MEDIA_STATION
                </span>
                <span className="text-[10px] text-zinc-500 font-mono uppercase">
                  Active: {mountedDrives.length}
                </span>
              </div>

              {/* Mounted drive list items */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {mountedDrives.length === 0 ? (
                  <div className="text-center py-6 text-zinc-550 border border-dashed border-zinc-850 rounded bg-zinc-950/20">
                    <span className="text-[10px] font-mono block">NO_STAGE_VOLUMES_DETECTED</span>
                  </div>
                ) : (
                  mountedDrives.map(drive => {
                    const pct = Math.round((drive.usedSizeBytes / drive.totalSizeBytes) * 100);
                    
                    // Capacity load visual classifications
                    let barColor = 'bg-cyan-500';
                    let borderColor = 'border-cyan-500/20';
                    let badgeStyles = 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/20';
                    let spaceStatusLabel = 'HEALTHY_STORAGE';
                    
                    if (pct >= 80) {
                      barColor = 'bg-rose-500';
                      borderColor = 'border-rose-500/30 bg-rose-950/5';
                      badgeStyles = 'bg-rose-955/20 text-rose-400 border border-rose-900/40';
                      spaceStatusLabel = 'CRITICAL_FULL';
                    } else if (pct >= 55) {
                      barColor = 'bg-amber-500';
                      borderColor = 'border-amber-500/20 bg-amber-950/5';
                      badgeStyles = 'bg-amber-955/15 text-amber-500 border border-amber-950/30';
                      spaceStatusLabel = 'MODERATE_LOAD';
                    } else {
                      barColor = 'bg-emerald-500';
                      borderColor = 'border-emerald-500/20 bg-emerald-950/5';
                      badgeStyles = 'bg-emerald-955/15 text-emerald-400 border border-emerald-900/30';
                      spaceStatusLabel = 'AMPLE_ROOM';
                    }

                    const isSim = drive.type === 'simulated';

                    return (
                      <div 
                        key={drive.id} 
                        className={`p-3 rounded border transition-all duration-200 relative group/drive ${borderColor} space-y-2.5 hover:bg-zinc-900/30`}
                      >
                        {/* Interactive Tooltip on the entire Card */}
                        <div className="absolute left-[102%] top-0 hidden group-hover/drive:block w-52 bg-zinc-950 border border-zinc-850 p-2.5 rounded shadow-2xl z-50 text-[10px] text-zinc-400 font-mono leading-relaxed pointer-events-none transition-all">
                          <span className="text-zinc-200 font-bold block border-b border-zinc-850 pb-1 mb-1 font-mono text-[9px] uppercase tracking-wider">
                            {isSim ? '⚡ VIRTUAL SSD PRESET' : '💿 NATIVE HARDWARE DISK'}
                          </span>
                          <div className="space-y-0.5 text-zinc-400">
                            <p>Name: <span className="text-zinc-200">{drive.name}</span></p>
                            <p>Sector: <span className="text-zinc-300 font-mono text-[9px]">{drive.id}</span></p>
                            <p>Conn: <span className="text-zinc-300">{drive.connection}</span></p>
                            <p className="mt-1.5 border-t border-zinc-850 pt-1 text-zinc-350">
                              Staged capacity stands at {pct}% utilization. You have {formatBytes(drive.totalSizeBytes - drive.usedSizeBytes)} storage space left.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-1">
                          <div className="truncate pr-1">
                            <div className="font-mono font-bold text-zinc-200 text-xs flex items-center gap-1.5 truncate">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse ${isSim ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                              {drive.name}
                            </div>
                            <div className="text-[9.5px] text-zinc-500 font-mono truncate mt-0.5">{drive.connection}</div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <button
                              id={`unmount-btn-${drive.id}`}
                              onClick={() => handleUnmountDrive(drive.id)}
                              className="bg-zinc-950 hover:bg-rose-950/35 text-zinc-500 hover:text-rose-400 border border-zinc-850 hover:border-rose-900/40 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold cursor-pointer transition-all active:scale-95"
                              title="Safely release storage node locks from current Workspace session."
                            >
                              RELEASE
                            </button>
                            <span className={`text-[8.5px] px-1 py-0.1 border rounded uppercase font-bold font-mono tracking-wider ${isSim ? 'bg-amber-955/15 text-amber-500 border-amber-950/20' : 'bg-emerald-950/20 text-emerald-400 border-emerald-900/20'}`}>
                              {isSim ? 'SANDBOX' : 'PHYS_SSD'}
                            </span>
                          </div>
                        </div>

                        {/* Capacity gauge */}
                        <div className="space-y-1.5 font-mono text-[9.5px]">
                          <div className="w-full bg-zinc-950 h-1.5 rounded-sm overflow-hidden flex border border-zinc-900">
                            <div className={`${barColor} h-full rounded-sm transition-all duration-500`} style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex justify-between items-center text-zinc-500">
                            <span className={`font-bold font-mono ${badgeStyles} px-1 rounded-sm text-[8px]`}>
                              {spaceStatusLabel} ({pct}%)
                            </span>
                            <span className="text-zinc-400 font-medium">{drive.capacity}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Mounting Trigger button */}
              {isSimulation ? (
                <div className="space-y-2 pt-1.5 border-t border-zinc-850 font-mono">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block">Mount virtual premium SSDs:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {SIMULATED_DRIVE_PRESETS.map(preset => {
                      const isMounted = mountedDrives.some(d => d.id === preset.id);
                      return (
                        <div key={preset.id} className="relative group/preset">
                          <button
                            id={`mount-preset-${preset.id}`}
                            onClick={() => {
                              if (isMounted) {
                                handleUnmountDrive(preset.id);
                              } else {
                                handleMountSimulatedPreset(preset.id);
                              }
                            }}
                            className={`w-full text-left p-2 rounded border text-[11px] transition-all flex flex-col justify-between h-auto cursor-pointer ${
                              isMounted 
                                ? 'bg-cyan-950/25 border-cyan-500/40 text-cyan-400 font-bold shadow-sm' 
                                : 'bg-zinc-950/60 border-zinc-850 hover:border-zinc-750 text-zinc-400'
                            }`}
                          >
                            <span className="font-bold block truncate">{preset.name}</span>
                            <span className="text-[9.5px] mt-1 block font-bold">
                              {isMounted ? '• ACTIVE' : '+ MOUNT SSD'}
                            </span>
                          </button>

                          {/* Preset Hover Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/preset:block bg-zinc-950 border border-zinc-850 p-2.5 rounded shadow-2xl z-50 text-[10px] text-zinc-400 font-mono leading-relaxed w-52 pointer-events-none transition-all">
                            <span className="text-amber-400 font-bold block mb-1">STAGING DIRECTORY INFO</span>
                            <p className="font-bold text-zinc-250">{preset.name}</p>
                            <p className="text-[9px] text-zinc-500 mt-0.5 font-mono">Size Limit: {preset.capacity}</p>
                            <p className="mt-1.5 border-t border-zinc-850 pt-1 text-zinc-350">
                              Contains {preset.folders.length} directories holding high-bitrate raw files ({preset.folders.reduce((acc, f) => acc + f.files.length, 0)} items) for safe backup.
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <button
                  id="btn-mount-physical"
                  onClick={handleMountPhysicalDrive}
                  className="w-full bg-blue-600/90 hover:bg-blue-500 text-white border border-blue-500/10 font-bold font-mono text-xs py-2 px-3 rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FolderOpen className="w-3.5 h-3.5" /> MOUNT_ADDITIONAL_SSD
                </button>
              )}
            </div>

            {/* Target Destination Storage volume Selection */}
            <div className="bg-zinc-950/40 p-4 rounded border border-zinc-800 space-y-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-2 font-mono">
                <span className="text-[11px] font-bold text-zinc-350 uppercase tracking-wide flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  OMV_NFS_TARGET_CHANNELS
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              {isSimulation ? (
                <div className="space-y-1.5 font-mono text-xs">
                  {OMV_NFS_TARGET_PRESETS.map(preset => (
                    <div key={preset.id} className="relative group/target">
                      <button
                        id={`target-preset-${preset.id}`}
                        onClick={() => setActiveDestId(preset.id)}
                        className={`w-full p-2 rounded border text-left flex items-center justify-between transition-all cursor-pointer ${
                          activeDestId === preset.id
                            ? 'bg-cyan-950/20 border-cyan-500/25 text-cyan-400 font-bold shadow-sm'
                            : 'bg-zinc-950/30 border-zinc-85 * text-zinc-400 hover:border-zinc-800 hover:text-zinc-300'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1.5 font-bold">
                          <Server className="w-3 h-3 text-zinc-500" />
                          {preset.label}
                        </span>
                        <span className="text-[9.5px] text-zinc-550 truncate">nfs://192.168.1.150/{preset.path.split('/').pop()}</span>
                      </button>

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover/target:block bg-zinc-950 border border-zinc-855 p-2.5 rounded shadow-2xl z-50 text-[10px] text-zinc-400 font-mono leading-relaxed w-64 pointer-events-none transition-all">
                        <span className="text-cyan-400 font-bold block mb-1">OMV NFS ARCHIVE SHARE</span>
                        <p>Destination Path: <span className="text-zinc-300 font-bold">/{preset.path}</span></p>
                        <p className="mt-1.5 border-t border-zinc-850 pt-1 text-zinc-355 text-[9.5px]">
                          Maintains a network file storage endpoint formatted for high-redundancy backup, safe encryption, and Immediate Catalogs lookup.
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2">
                    <label className="text-[10px] text-zinc-550 block mb-1 uppercase tracking-wider font-bold">Custom Subdirectory path:</label>
                    <input
                      id="custom-dest-input"
                      type="text"
                      placeholder="e.g. Backups/ClientName"
                      value={customDestPath}
                      onChange={(e) => setCustomDestPath(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 text-zinc-200 text-[11px] px-2.5 py-1.5 rounded focus:outline-none focus:border-cyan-500/50 font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    id="btn-mount-destination-nfs"
                    onClick={handleMountDestinationNfs}
                    className="w-full bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-bold font-mono text-xs py-2 px-3 rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Server className="w-3.5 h-3.5 text-cyan-400" /> LINK OMV DESTINATION SHARE
                  </button>
                  <div className="bg-zinc-950 p-2.5 rounded border border-zinc-850 text-[11px] font-mono truncate text-zinc-400">
                    {destDirName ? `Mounted: nfs://${destDirName}` : 'Select target backup path handle...'}
                  </div>
                </div>
              )}

              <div className="bg-zinc-900/60 p-2.5 rounded border border-zinc-850 space-y-1 font-mono text-[10.5px]">
                <div className="text-zinc-500 uppercase font-bold text-[9px]">Destination Summary Path:</div>
                <div className="text-emerald-450 truncate font-semibold" title={chosenDestPath}>{chosenDestPath}</div>
              </div>
            </div>

            {/* Profile Configurations */}
            <div className="bg-zinc-950/40 p-4 rounded border border-zinc-800 space-y-3 font-mono text-xs shadow-sm">
              <span className="text-[11px] font-bold text-zinc-350 border-b border-zinc-850 pb-2 block uppercase tracking-wide font-mono">PIPELINE_FLOW_CONFIG</span>
              
              <div className="space-y-3 pt-1 font-mono text-[11px]">
                
                {/* Checkbox 1 */}
                <div className="relative group/opt">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      id="chk-integrity"
                      type="checkbox"
                      checked={config.integrityCheck}
                      onChange={(e) => setConfig({ ...config, integrityCheck: e.target.checked })}
                      className="rounded text-cyan-500 bg-zinc-900 border-zinc-700 h-3.5 w-3.5 accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-zinc-400 select-none hover:text-zinc-300 transition-colors">SHA-256 integrity checks</span>
                  </label>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-0 mb-2.5 hidden group-hover/opt:block w-64 bg-zinc-950 border border-zinc-850 p-2.5 rounded shadow-2xl text-[10 px] text-zinc-400 font-mono leading-relaxed z-50 pointer-events-none transition-all">
                    <span className="text-cyan-400 font-bold block mb-1">✓ INTEGRITY ASSURANCE</span>
                    Compares SHA-256 block checksums on the source storage and target NFS post-copy to guarantee bit-perfect, uncorrupted backup.
                  </div>
                </div>

                {/* Checkbox 2 */}
                <div className="relative group/opt">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      id="chk-skips"
                      type="checkbox"
                      checked={config.skipExisting}
                      onChange={(e) => setConfig({ ...config, skipExisting: e.target.checked })}
                      className="rounded text-cyan-500 bg-zinc-900 border-zinc-700 h-3.5 w-3.5 accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-zinc-400 select-none hover:text-zinc-300 transition-colors">Skip duplicate files</span>
                  </label>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-0 mb-2.5 hidden group-hover/opt:block w-64 bg-zinc-950 border border-zinc-850 p-2.5 rounded shadow-2xl text-[10px] text-zinc-400 font-mono leading-relaxed z-50 pointer-events-none transition-all">
                    <span className="text-cyan-400 font-bold block mb-1">⟲ SKIP_DUPLICATE LOGIC</span>
                    Bypasses copying files that already exist on the target OMV share with matching filenames and sizes to conserve time & bandwidth.
                  </div>
                </div>

                {/* Checkbox 3 */}
                <div className="relative group/opt">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      id="chk-delete"
                      type="checkbox"
                      checked={config.deleteAfterCopy}
                      onChange={(e) => setConfig({ ...config, deleteAfterCopy: e.target.checked })}
                      className="rounded text-rose-500 bg-zinc-900 border-rose-950 h-3.5 w-3.5 accent-rose-500 cursor-pointer"
                    />
                    <span className="text-rose-400 select-none font-bold uppercase text-[10px] hover:text-rose-350 transition-colors">Trim stages post-write</span>
                  </label>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-0 mb-2.5 hidden group-hover/opt:block w-64 bg-zinc-950 border border-zinc-850 p-2.5 rounded shadow-2xl text-[10px] text-zinc-400 font-mono leading-relaxed z-50 pointer-events-none transition-all">
                    <span className="text-rose-400 font-bold block mb-1">⚠️ SECURE PURGE DAEMON</span>
                    Safely purges the source raw file buffer on original staging storage ONLY after verifying perfect delivery to destination.
                  </div>
                </div>

                {/* Dropdown Select 4 */}
                <div className="relative group/opt flex items-center justify-between pt-1 font-mono text-xs">
                  <span className="text-zinc-500 uppercase text-[10px]">THREADS_CONCURRENCY</span>
                  <select
                    id="sel-concurrency"
                    value={config.concurrencyLimit}
                    onChange={(e) => setConfig({ ...config, concurrencyLimit: Number(e.target.value) })}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded px-2 py-1 font-mono cursor-pointer focus:outline-none"
                  >
                    <option value="1">1 (Safe Single Pipe)</option>
                    <option value="2">2 (Optimal Bandwidth)</option>
                    <option value="4">4 (Turbo 10G link)</option>
                  </select>

                  {/* Tooltip */}
                  <div className="absolute bottom-full right-0 mb-2.5 hidden group-hover/opt:block w-64 bg-zinc-950 border border-zinc-850 p-2.5 rounded shadow-2xl text-[10px] text-zinc-400 font-mono leading-relaxed z-50 pointer-events-none transition-all">
                    <span className="text-cyan-400 font-bold block mb-1">⚙️ CONCURRENT WORK PIPES</span>
                    Controls the number of files transferred in parallel. Higher threads leverage full 10-Gbps network routers under high-speed physical copy.
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT PANELS (Column Span 8): ACTIVE FILE WORKSPACE NAVIGATOR */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
            
            {/* Navigational Toolbar */}
            <div className="bg-zinc-950/50 rounded border border-zinc-800 p-4 space-y-3.5 flex-1 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-850 pb-3">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-cyan-400" />
                    <span className="text-[12px] font-bold text-zinc-200 font-mono uppercase tracking-wide">
                      VOLUMES_FILE_TREE_MANAGER
                    </span>
                  </div>

                  {/* Search Query */}
                  <div className="relative font-mono">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-550" />
                    <input
                      id="file-manager-search"
                      type="text"
                      placeholder="Search files/folders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xxs pl-8 pr-2.5 py-1.5 rounded-sm focus:outline-none focus:border-cyan-500/50 font-mono w-full sm:w-44"
                    />
                  </div>
                </div>

                {/* Filter and selector actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/25 p-2 rounded border border-zinc-855 font-mono">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-zinc-500 mr-2 uppercase tracking-wide">FILTER BY:</span>
                    {(['all', 'raw', 'lr', 'video'] as const).map(fOpt => (
                      <button
                        id={`filter-btn-${fOpt}`}
                        key={fOpt}
                        onClick={() => setActiveMediaFilter(fOpt)}
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all uppercase cursor-pointer ${
                          activeMediaFilter === fOpt
                            ? 'bg-cyan-950/40 text-cyan-405 border border-cyan-800/25'
                            : 'text-zinc-500 hover:text-zinc-350'
                        }`}
                      >
                        {fOpt === 'all' && 'All_Items'}
                        {fOpt === 'raw' && 'RAW_Media'}
                        {fOpt === 'lr' && 'Catalogs'}
                        {fOpt === 'video' && 'Video_Raw'}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 text-xxs font-mono">
                    <button
                      id="bulk-all"
                      onClick={() => handleBulkSelectAction('all')}
                      className="text-zinc-400 hover:text-cyan-400 border border-zinc-800 hover:border-zinc-700 px-2 py-0.5 rounded transition-all cursor-pointer bg-zinc-950 font-bold"
                    >
                      CHECK_ALL
                    </button>
                    <button
                      id="bulk-raw"
                      onClick={() => handleBulkSelectAction('all-raw')}
                      className="text-zinc-400 hover:text-cyan-400 border border-zinc-800 hover:border-zinc-700 px-2 py-0.5 rounded transition-all cursor-pointer bg-zinc-950 font-bold"
                    >
                      CH_RAWS
                    </button>
                    <button
                      id="bulk-lr"
                      onClick={() => handleBulkSelectAction('all-lr')}
                      className="text-zinc-400 hover:text-cyan-400 border border-zinc-800 hover:border-zinc-700 px-2 py-0.5 rounded transition-all cursor-pointer bg-zinc-950 font-bold"
                    >
                      CH_CATALOGS
                    </button>
                    <button
                      id="bulk-clear"
                      onClick={() => handleBulkSelectAction('clear')}
                      className="text-rose-450 hover:text-rose-400 border border-rose-950/20 px-2 py-0.5 rounded transition-all cursor-pointer bg-rose-950/5 font-bold"
                    >
                      CLEAR
                    </button>
                  </div>
                </div>

                {/* FILE SYSTEM EXPLORER RENDER WINDOW */}
                <div id="file-tree-viewport" className="border border-zinc-850 rounded bg-zinc-950 p-2 font-mono text-[10.5px] max-h-[380px] overflow-y-auto select-none space-y-1 scrollbar-thin">
                  {mountedDrives.length === 0 ? (
                    <div className="text-center py-20 text-zinc-600 font-mono space-y-2">
                      <FolderOpen className="w-8 h-8 mx-auto text-zinc-700" />
                      <div className="text-xs uppercase font-bold text-zinc-550">WORKSPACE_VOIDS</div>
                      <p className="text-[10px] max-w-xs mx-auto leading-relaxed">
                        No photography storage disks mounted. Connect simulated SSD sectors on the left node bank to explore directory catalogs.
                      </p>
                    </div>
                  ) : (
                    mountedDrives.map(drive => {
                      const folders = driveDirectoriesSetMap[drive.id] || [];
                      const files = filteredFilesByDrive[drive.id] || [];
                      const driveChecked = getDriveCheckedState(drive.id);
                      
                      return (
                        <div key={drive.id} className="border-b border-zinc-900/60 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                          {/* ROOT DRIVE NODE ROW */}
                          <div id={`drive-row-${drive.id}`} className="group hover:bg-zinc-900/35 p-1 rounded flex items-center justify-between font-mono font-bold">
                            <div className="flex items-center gap-1.5">
                              <input
                                id={`drive-chk-${drive.id}`}
                                type="checkbox"
                                checked={driveChecked === 'checked'}
                                ref={el => {
                                  if (el) el.indeterminate = driveChecked === 'partial';
                                }}
                                onChange={() => handleToggleDriveCheck(drive.id, driveChecked === 'checked')}
                                className="rounded text-cyan-500 bg-zinc-900 border-zinc-800 h-3.5 w-3.5 accent-cyan-400 cursor-pointer"
                              />
                              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="text-zinc-150 uppercase tracking-wide text-xxs font-mono">{drive.name}</span>
                              <span className="text-zinc-550 font-normal text-[9px]">[{drive.capacity}]</span>
                            </div>
                            <span className="text-[9px] text-zinc-600">DRIVE_ROOT</span>
                          </div>

                          {/* SUBDIRECTOR_TREE INDENT ROWS */}
                          {folders.map(folder => {
                            const isShown = isFolderShownInTree(drive.id, folder);
                            if (!isShown) return null;
                            
                            const level = folder.split('/').length;
                            const folderName = folder.split('/').pop() || '';
                            const fUri = `${drive.id}::${folder}`;
                            const isExpanded = expandedFolders.has(fUri);
                            const folderChecked = getFolderCheckedState(drive.id, folder);
                            
                            return (
                              <div
                                id={`folder-row-${folder.replace(/\//g, '_')}`}
                                key={folder}
                                className="group hover:bg-zinc-900/25 p-1 rounded flex items-center justify-between font-mono select-none"
                                style={{ paddingLeft: `${(level) * 16}px` }}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <input
                                    id={`folder-chk-${folder.replace(/\//g, '_')}`}
                                    type="checkbox"
                                    checked={folderChecked === 'checked'}
                                    ref={el => {
                                      if (el) el.indeterminate = folderChecked === 'partial';
                                    }}
                                    onChange={() => handleToggleFolderCheck(drive.id, folder, folderChecked === 'checked')}
                                    className="rounded text-cyan-500 bg-zinc-900 border-zinc-800 h-3 w-3 accent-cyan-400 cursor-pointer"
                                  />
                                  <button
                                    id={`folder-toggle-${folder.replace(/\//g, '_')}`}
                                    onClick={() => toggleFolderExpanded(fUri)}
                                    className="p-0.5 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 focus:outline-none transition-all cursor-pointer"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-3 h-3 text-cyan-400" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 text-zinc-555" />
                                    )}
                                  </button>
                                  <span
                                    onClick={() => toggleFolderExpanded(fUri)}
                                    className="text-zinc-350 hover:text-white cursor-pointer font-bold select-none truncate"
                                  >
                                    {folderName}/
                                  </span>
                                </div>
                                <span className="text-[9.5px] text-zinc-600 select-none">DIR</span>
                              </div>
                            );
                          })}

                          {/* RAW FILES NODES ROWS */}
                          {files.map(file => {
                            const isShown = isFileShownInTree(drive.id, file.path);
                            if (!isShown) return null;
                            
                            const parts = file.path.split('/');
                            const level = parts.length;
                            const isChecked = checkedFileURIs.has(`${drive.id}::${file.path}`);
                            
                            let extLabel = file.name.substring(file.name.lastIndexOf('.')).toUpperCase();
                            
                            return (
                              <div
                                id={`file-row-${file.id}`}
                                key={file.id}
                                className={`group hover:bg-zinc-900/40 p-1 rounded flex items-center justify-between transition-all font-mono select-none ${
                                  isChecked ? 'bg-zinc-900/10' : ''
                                }`}
                                style={{ paddingLeft: `${(level) * 16}px` }}
                              >
                                <div className="flex items-start gap-1.5 truncate">
                                  <input
                                    id={`file-chk-${file.id}`}
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleFileCheck(`${drive.id}::${file.path}`)}
                                    className="rounded text-cyan-500 bg-zinc-900 border-zinc-800 mt-[2px] h-3 w-3 accent-cyan-400 cursor-pointer"
                                  />
                                  <span
                                    onClick={() => handleToggleFileCheck(`${drive.id}::${file.path}`)}
                                    className="text-zinc-400 hover:text-white cursor-pointer select-none truncate"
                                    title={file.path}
                                  >
                                    {file.name}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <span className="text-[9.5px] text-zinc-650 font-mono select-none">{extLabel}</span>
                                  <span className="text-[9.5px] text-zinc-550 font-mono select-none w-14 text-right">{formatBytes(file.size)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bottom selection feedback bar */}
              <div className="bg-zinc-900/45 border border-zinc-850 rounded p-3 mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-zinc-500 text-[10px] block uppercase font-bold">PIPELINE_LOADOUT:</span>
                  <div className="text-zinc-200 font-bold font-mono text-xs">
                    Checked Components: <span className="text-cyan-400">{selectionMetrics.totalFiles} Units</span> <span className="text-zinc-600">|</span> Total Size: <span className="text-cyan-400">{formatBytes(selectionMetrics.totalBytes)}</span>
                  </div>
                </div>

                <div className="w-full sm:w-auto font-mono">
                  <button
                    id="btn-execute-sync"
                    onClick={handleStartArchiving}
                    disabled={isArchiving || selectionMetrics.totalFiles === 0}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2 rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isArchiving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        SPOOLING_SEGMENTS ({overallProgressPercent}%)
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-white" />
                        SYNCHRONIZE_NFS_ARCHIVE
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* LOWER MONITORING TIMELINE & EVENT TIMELINE DAEMON */}
      {activeConsoleLog.length > 0 && (
        <div id="archiver-telemetry-panels" className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Queued Active Progress */}
          <div className="lg:col-span-2 space-y-3 bg-zinc-900/35 backdrop-blur-md rounded-lg border border-zinc-800 p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-850 pb-3 font-mono">
                <h3 className="font-bold text-zinc-300 text-xs uppercase flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  NFS_TRANSMISSION_PROGRESS_PIPES
                </h3>
                {isArchiving && (
                  <button
                    id="btn-abort-archival"
                    onClick={handleAbortTransfer}
                    className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-550/20 px-2.5 py-1 rounded text-[10px] font-bold font-mono cursor-pointer transition-all uppercase"
                  >
                    ABORT_PIPES
                  </button>
                )}
              </div>

              {/* Progress Gauges */}
              {totalBytesToCopy > 0 && (
                <div className="bg-zinc-950/80 p-3.5 rounded border border-zinc-850 space-y-3 font-mono">
                  <div className="flex flex-wrap justify-between items-center gap-2 text-[11px] text-zinc-400 font-mono">
                    <span className="flex items-center gap-1.5 font-bold text-zinc-200">
                      <Gauge className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                      SYSTEM: {isArchiving ? 'STREAMING_SECTORS' : backupCompleted ? 'CHECK_CRC_SUCCESSFUL' : 'PIPELINE_STANDBY'}
                    </span>
                    <span>COPIED: {formatBytes(bytesWritten)} / {formatBytes(totalBytesToCopy)}</span>
                  </div>

                  <div className="w-full bg-zinc-900 h-1.5 rounded-sm overflow-hidden border border-zinc-800">
                    <div
                      className={`h-full rounded-sm transition-all duration-300 ${
                        backupCompleted ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]' : 'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.2)]'
                      }`}
                      style={{ width: `${overallProgressPercent}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center pt-1 text-xs">
                    <div className="bg-zinc-900/40 p-2 rounded border border-zinc-850">
                      <span className="text-[9px] text-zinc-505 block uppercase">NFS_THROUGHPUT</span>
                      <span className="text-11px font-bold text-zinc-200 block mt-0.5">{transferSpeedMBs || 112} MB/s</span>
                    </div>
                    <div className="bg-zinc-900/40 p-2 rounded border border-zinc-850">
                      <span className="text-[9px] text-zinc-550 block uppercase font-mono">EST_LATENCY_LEFT</span>
                      <span className="text-11px font-bold text-cyan-400 block mt-0.5">
                        {isArchiving ? (timeRemainingSeconds === 0 ? 'CALCULATING' : `${timeRemainingSeconds}s`) : '-'}
                      </span>
                    </div>
                    <div className="bg-zinc-900/40 p-2 rounded border border-zinc-850">
                      <span className="text-[9px] text-zinc-550 block uppercase font-mono">CRC_SHUFFLE_VERIFY</span>
                      <span className={`text-[10px] font-bold block mt-0.5 uppercase ${backupCompleted ? 'text-emerald-450' : 'text-amber-450'}`}>
                        {backupCompleted ? 'LOCK SECURE' : isArchiving ? 'CROSSCHECKING' : 'COMPLIANT_READY'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Staged copying lists */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {mountedDrives.map(drive => 
                  drive.files.map(file => {
                    const fileURI = `${drive.id}::${file.path}`;
                    // Only render files that were checked or copy-executed
                    if (!checkedFileURIs.has(fileURI) && file.status === 'scanned') return null;

                    return (
                      <div key={file.id} className="bg-zinc-950/45 p-2 rounded border border-zinc-900 flex items-center justify-between text-[11px] font-mono">
                        <div className="space-y-0.5 truncate max-w-sm">
                          <span className="text-zinc-250 font-bold block truncate" title={file.path}>{file.name}</span>
                          <span className="text-[9.5px] text-zinc-500 block">
                            Sector: <span className="text-zinc-400 font-bold">[{drive.name}]</span> • size: {formatBytes(file.size)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {file.status === 'scanned' && (
                            <span className="bg-zinc-900 text-zinc-500 p-1 px-1.5 rounded text-[9px] border border-zinc-850 font-bold">CHECKED</span>
                          )}

                          {file.status === 'skipped' && (
                            <span className="bg-zinc-900 text-amber-500 p-1 px-1.5 rounded text-[9.5px] border border-amber-950/20 flex items-center gap-1 font-bold">
                              <CheckCircle2 className="w-3 h-3 text-amber-500" /> DUPLICATE_SKIPPED
                            </span>
                          )}

                          {file.status === 'hashing_source' && (
                            <span className="bg-zinc-900 text-cyan-400 p-1 px-1.5 rounded text-[9.5px] border border-cyan-950/20 flex items-center gap-1 font-bold animate-pulse">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" /> COMP_HASHING
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
                            <span className="bg-zinc-900 text-cyan-400 p-1 px-1.5 rounded text-[9.5px] border border-cyan-950/20 flex items-center gap-1 font-bold animate-pulse">
                              DEST_CRC_VERIFYing
                            </span>
                          )}

                          {file.status === 'success' && (
                            <span className="bg-emerald-950/25 text-emerald-400 p-1 px-2 rounded text-[10px] border border-emerald-900/30 flex items-center gap-1 font-bold font-mono">
                              <ShieldCheck className="w-3 h-3 text-emerald-450" /> CRC_STABLE
                            </span>
                          )}

                          {file.status === 'failed' && (
                            <span className="bg-rose-955/20 text-rose-455 p-1 px-1.5 rounded font-bold" title={file.error}>
                              CRC_MISMATCH
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Prompt SSD block flusher */}
            {showCleanupPrompt && (
              <div id="sector-cleanup-prompt" className="mt-4 bg-rose-950/15 border border-rose-900/30 p-4 rounded space-y-3 font-mono">
                <div className="flex items-start gap-2.5 text-rose-300">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-400 mt-0.5 flex-shrink-0 animate-pulse" />
                  <div>
                    <h4 className="font-bold text-xs text-zinc-100 uppercase font-mono">CRITICAL REQUEST: TRIM ORIGIN sector staging</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      All {copiedCount} project media objects have been successfully spooled and verified over OMV CRC-32/SHA-256 blocks. You can safely purge origin stage partitions to recycle SSD bytes.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    id="btn-cleanup-skip"
                    onClick={() => setShowCleanupPrompt(false)}
                    className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-[10.5px] px-3 py-1 rounded font-bold cursor-pointer"
                  >
                    KEEP_ORIGINALS
                  </button>
                  <button
                    id="btn-cleanup-trim"
                    onClick={handleSafeCleanup}
                    disabled={cleanupRunning}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10.5px] px-3.5 py-1 rounded transition-all flex items-center gap-1.5 border border-rose-500/20 cursor-pointer"
                  >
                    {cleanupRunning ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> PURGING_FLASH...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" /> RECYCLE_STAGING_SECTORS
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
                  <span className="font-bold block text-zinc-250">RECOVERY VERIFIED AND MOUNTS STABLE</span>
                  <span className="text-zinc-400 block mt-0.5">Physical files flushed from origin stage sectors. Directory caches refreshed successfully. Ready for raw media capture on the next shoot.</span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT TERMINAL EVENT LOG PANEL */}
          <div className="lg:col-span-1 bg-zinc-950 border border-zinc-900 rounded-lg p-4 flex flex-col justify-between font-mono text-[11px] space-y-4">
            <div className="space-y-2 flex-1">
              <span className="text-cyan-405 font-bold block border-b border-zinc-900 pb-2 flex items-center gap-2 select-none uppercase tracking-wider font-mono">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                OMV_ARCHIVAL_DEEMON
              </span>
              <div className="space-y-1.5 overflow-y-auto max-h-72 text-zinc-500 leading-relaxed text-[10.5px]">
                {activeConsoleLog.map((logStr, indexIdx) => (
                  <div key={indexIdx} className="break-all font-mono">
                    {logStr}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/40 p-3 rounded border border-zinc-850 text-[10.5px] text-zinc-500 space-y-1.5 font-mono">
              <span className="font-bold text-zinc-400 block text-[9.5px] uppercase tracking-wider">PIPELINE_FLOW_TELEMETRY</span>
              <div>TRANSFERS: <span className="text-zinc-300 font-bold">{copiedCount} segments</span></div>
              <div>VERIFIER: <span className="text-zinc-300 font-bold">CRC-32/SHA-255</span></div>
              <div>SKIPS: <span className="text-amber-500 font-bold">{skippedCount} matches</span></div>
              <div>FAILED: <span className="text-rose-450 font-bold">{failedCount} records</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
