/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  getAllItems, 
  putItem, 
  deleteItem, 
  saveItemDirect, 
  getSystemStorageStats
} from './db';
import { 
  DBItem, 
  FileCategory, 
  StorageStats 
} from './types';
import Sidebar from './components/Sidebar';
import FileGrid from './components/FileGrid';
import PreviewModal from './components/PreviewModal';
import FolderSelectorModal from './components/FolderSelectorModal';
import OpenChoiceModal from './components/OpenChoiceModal';
import SimulatedWordModal from './components/SimulatedWordModal';
import SimulatedExcelModal from './components/SimulatedExcelModal';
import { UploadCloud, CheckCircle, FolderPlus, Edit, AlertTriangle, Loader2 } from 'lucide-react';
import { initAuth, googleSignIn, logout } from './firebase';
import { 
  getGoogleDriveItems, 
  createFolderInGoogleDrive, 
  uploadFileToGoogleDrive, 
  deleteFileFromGoogleDrive, 
  fetchGoogleDriveFileContent,
  getGoogleDriveFolderMetadata
} from './googleDriveApi';

export default function App() {
  const [items, setItems] = useState<DBItem[]>([]);
  const [serverDiskStats, setServerDiskStats] = useState<{ freeSpace: number; usedSpace: number; totalSpace: number } | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentCategory, setCurrentCategory] = useState<FileCategory>('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Modals / Visual Triggers
  const [previewItem, setPreviewItem] = useState<DBItem | null>(null);
  const [openChoiceItem, setOpenChoiceItem] = useState<DBItem | null>(null);
  const [simulatedWordItem, setSimulatedWordItem] = useState<DBItem | null>(null);
  const [simulatedExcelItem, setSimulatedExcelItem] = useState<DBItem | null>(null);
  const [itemToMove, setItemToMove] = useState<DBItem | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // Custom inline modals replacing standard window.prompt/alert
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [renameItem, setRenameItem] = useState<DBItem | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Hidden File input upload dialog
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Drive integration states
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [googleDriveItems, setGoogleDriveItems] = useState<DBItem[]>([]);
  const [googleDriveParentFolderId, setGoogleDriveParentFolderId] = useState<string | null>(null);
  const [googleDrivePath, setGoogleDrivePath] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: 'Google Drive (โฟลเดอร์เซฟหลัก)' }
  ]);
  const [googleDriveLoading, setGoogleDriveLoading] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  const fetchItemsAndStats = () => {
    getAllItems().then(loadedItems => {
      setItems(loadedItems);
    }).catch(err => {
      console.error('Failed to load items:', err);
    });
    getSystemStorageStats().then(stats => {
      setServerDiskStats(stats);
    }).catch(err => {
      console.error('Failed to fetch storage stats:', err);
    });
  };

  // Seed storage metrics on mount and initialize google auth listener
  useEffect(() => {
    fetchItemsAndStats();
    
    // Listen for Google Auth state
    initAuth(
      (user, token) => {
        setGoogleAccessToken(token);
        setIsGoogleConnected(true);
        setGoogleUserEmail(user.email);
        setAlertMessage(`🔑 เชื่อมต่อบัญชี Google (${user.email}) สำเร็จด้วย OAuth! พร้อมใช้งานคลาวด์ไดฟ์กูเกิ้ลแล้ว`);
      },
      () => {
        setGoogleAccessToken(null);
        setIsGoogleConnected(false);
        setGoogleUserEmail(null);
      }
    );
  }, []);

  const fetchGoogleDriveFiles = (token: string, folderId: string | null) => {
    setGoogleDriveLoading(true);
    getGoogleDriveItems(token, folderId)
      .then(driveItems => {
        setGoogleDriveItems(driveItems);
        setGoogleDriveLoading(false);
      })
      .catch(err => {
        console.error('Failed to load Google Drive items:', err);
        setGoogleDriveLoading(false);
        setAlertMessage('🚨 เกิดข้อผิดพลาดในการโหลดไฟล์จาก Google Drive กรุณาลองใหม่อีกครั้ง');
      });
  };

  useEffect(() => {
    if (currentCategory === 'google-drive' && googleAccessToken) {
      fetchGoogleDriveFiles(googleAccessToken, googleDriveParentFolderId);
    }
  }, [currentCategory, googleDriveParentFolderId, googleAccessToken]);

  const handleConnectGoogle = async () => {
    if (isConnectingGoogle) return;
    setIsConnectingGoogle(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleAccessToken(res.accessToken);
        setIsGoogleConnected(true);
        setGoogleUserEmail(res.user.email);
        setAlertMessage(`🔑 เชื่อมต่อบัญชี Google Drive ของคุณ (${res.user.email}) เรียบร้อย! สามารถซิงค์ ค้นหา และดูข้อมูลได้ตลอดเวลา`);
      }
    } catch (err: any) {
      console.error('Failed to login with Google:', err);
      const isCancelled = err.message?.includes('cancelled-popup-request') || err.code === 'auth/cancelled-popup-request';
      if (isCancelled) {
        setAlertMessage(`⚠️ การเชื่อมต่อถูกยกเลิก (เนื่องจากหน้าต่างล็อกอินถูกปิดไปก่อนหน้า หรือมีหน้าต่างเข้าสู่ระบบทำงานซ้อนกันอยู่) กรุณาลองใหม่อีกครั้ง`);
      } else {
        setAlertMessage(`🚨 เชื่อมต่อ Google Drive ล้มเหลว: ${err.message || err}`);
      }
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (confirm('⚠️ การยกเลิกการเชื่อมต่อบัญชี Google จะทำให้ระบบไม่สามารถแสดงไดรฟ์กูเกิ้ลในหน้ารายการได้ในตอนนี้ คุณแน่ใจหรือไม่?')) {
      await logout();
      setGoogleAccessToken(null);
      setIsGoogleConnected(false);
      setGoogleUserEmail(null);
      if (currentCategory === 'google-drive') {
        setCurrentCategory('all');
      }
      setAlertMessage('🔓 ยกเลิกการเชื่อมต่อบัญชี Google ของคุณเสร็จสิ้นแล้ว');
    }
  };

  const handleImportFromGoogle = async (item: DBItem) => {
    if (!googleAccessToken) return;
    setGoogleDriveLoading(true);
    try {
      const fetched = await fetchGoogleDriveFileContent(googleAccessToken, item.id, item.type);
      const newItem: DBItem = {
        id: 'file_imported_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
        name: item.name,
        isFolder: false,
        parentId: currentFolderId,
        size: item.size || fetched.content.length,
        type: item.type || 'application/octet-stream',
        content: fetched.content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isTrashed: false,
        tag: 'นำเข้า'
      };

      setItems(prev => [...prev, newItem]);
      await putItem(newItem);
      fetchItemsAndStats();
      setAlertMessage(`📥 นำเข้าไฟล์ "${item.name}" จาก Google Drive มาจัดเก็บถาวรยังระบบเครื่องสำเร็จแล้ว!`);
    } catch (err: any) {
      console.error('Import failed:', err);
      setAlertMessage(`🚨 นำเข้าจาก Google Drive ล้มเหลว: ${err.message || err}`);
    } finally {
      setGoogleDriveLoading(false);
    }
  };

  const handleExportToGoogle = async (item: DBItem) => {
    if (!googleAccessToken) {
      setAlertMessage('🚨 กรุณาเชื่อมต่อบัญชี Google Drive ก่อนทำการส่งออกไฟล์');
      return;
    }
    if (item.isFolder) return;
    setGoogleDriveLoading(true);
    try {
      await uploadFileToGoogleDrive(googleAccessToken, item.name, item.type, item.content || '', googleDriveParentFolderId);
      setAlertMessage(`📤 ส่งออกไฟล์ "${item.name}" ไปยังคลาวด์ Google Drive สำเร็จเป็นที่เรียบร้อยแล้ว!`);
    } catch (err: any) {
      console.error('Export failed:', err);
      setAlertMessage(`🚨 ส่งออกไฟล์ไปยัง Google Drive ล้มเหลว: ${err.message || err}`);
    } finally {
      setGoogleDriveLoading(false);
    }
  };

  const handleNavigate = async (folderId: string | null) => {
    if (currentCategory === 'google-drive') {
      if (folderId === null) {
        setGoogleDriveParentFolderId(null);
        setGoogleDrivePath([{ id: null, name: 'Google Drive (โฟลเดอร์เซฟหลัก)' }]);
      } else {
        const folder = googleDriveItems.find(x => x.id === folderId);
        if (folder) {
          const existIndex = googleDrivePath.findIndex(x => x.id === folderId);
          if (existIndex !== -1) {
            setGoogleDrivePath(prev => prev.slice(0, existIndex + 1));
          } else {
            setGoogleDrivePath(prev => [...prev, { id: folderId, name: folder.name }]);
          }
          setGoogleDriveParentFolderId(folderId);
        } else {
          if (googleAccessToken) {
            try {
              const meta = await getGoogleDriveFolderMetadata(googleAccessToken, folderId);
              setGoogleDriveParentFolderId(folderId);
              setGoogleDrivePath([{ id: null, name: 'Google Drive (โฟลเดอร์เซฟหลัก)' }, { id: meta.id, name: meta.name }]);
            } catch (err) {
              console.error(err);
            }
          }
        }
      }
    } else {
      setCurrentFolderId(folderId);
    }
  };

  // Compute storage space and item counts dynamically
  const stats = useMemo<StorageStats>(() => {
    let usedBytes = 0;
    let fileCount = 0;
    let folderCount = 0;
    let images = 0;
    let documents = 0;
    let media = 0;
    let archives = 0;
    let others = 0;

    items.forEach(item => {
      if (item.isTrashed) return;
      if (item.isFolder) {
        folderCount++;
      } else {
        fileCount++;
        usedBytes += item.size;
        const mime = item.type.toLowerCase();
        
        if (mime.startsWith('image/')) {
          images += item.size;
        } else if (mime.startsWith('text/') || mime.includes('pdf') || mime.includes('document')) {
          documents += item.size;
        } else if (mime.startsWith('audio/') || mime.startsWith('video/')) {
          media += item.size;
        } else if (mime.includes('zip') || mime.includes('tar') || mime.includes('rar') || mime.includes('archive')) {
          archives += item.size;
        } else {
          others += item.size;
        }
      }
    });

    return {
      usedBytes: serverDiskStats ? serverDiskStats.usedSpace : usedBytes,
      maxBytes: serverDiskStats ? serverDiskStats.totalSpace : 200 * 1024 * 1024, // 200MB limit for demo
      fileCount,
      folderCount,
      byType: { images, documents, media, archives, others }
    };
  }, [items, serverDiskStats]);

  // Read upload and convert to base64 or plainText
  const handleUploadFile = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setAlertMessage('ขนาดไฟล์ใหญ่เกินกว่า 20 MB ! ระบบจำกัดขนาดเพื่อประสิทธิภาพการอัปโหลดของเซิร์ฟเวอร์');
      return;
    }

    const reader = new FileReader();
    const isText = file.type.startsWith('text/') || 
                   file.name.endsWith('.txt') || 
                   file.name.endsWith('.md') || 
                   file.name.endsWith('.json') || 
                   file.name.endsWith('.js') || 
                   file.name.endsWith('.ts') || 
                   file.name.endsWith('.css');

    reader.onload = async (e) => {
      const content = e.target?.result as string;

      if (currentCategory === 'google-drive' && googleAccessToken) {
        setGoogleDriveLoading(true);
        try {
          await uploadFileToGoogleDrive(googleAccessToken, file.name, file.type, content, googleDriveParentFolderId);
          fetchGoogleDriveFiles(googleAccessToken, googleDriveParentFolderId);
          setAlertMessage(`📤 อัปโหลดไฟล์ "${file.name}" คลาวด์ไปเก็บที่ Google Drive ปลอดภัย เรียบร้อยแล้ว!`);
        } catch (err: any) {
          console.error(err);
          setAlertMessage(`🚨 อัปโหลดไป Google Drive ล้มเหลว: ${err.message || err}`);
        } finally {
          setGoogleDriveLoading(false);
        }
      } else {
        const newItem: DBItem = {
          id: 'file_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
          name: file.name,
          isFolder: false,
          parentId: currentCategory === 'trash' ? null : currentFolderId,
          size: file.size,
          type: file.type || 'application/octet-stream',
          content: content,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isTrashed: false,
        };

        setItems(prev => [...prev, newItem]);
        await putItem(newItem);
        fetchItemsAndStats();
      }
    };

    if (isText) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  const handleCreateFolder = () => {
    setFolderNameInput('');
    setIsCreateFolderOpen(true);
  };

  const confirmCreateFolder = async () => {
    if (!folderNameInput.trim()) {
      setIsCreateFolderOpen(false);
      return;
    }

    if (currentCategory === 'google-drive' && googleAccessToken) {
      setGoogleDriveLoading(true);
      try {
        await createFolderInGoogleDrive(googleAccessToken, folderNameInput.trim(), googleDriveParentFolderId);
        fetchGoogleDriveFiles(googleAccessToken, googleDriveParentFolderId);
        setAlertMessage(`📁 สร้างโฟลเดอร์ใหม่ "${folderNameInput.trim()}" ใน Google Drive เรียบร้อยแล้ว!`);
      } catch (err: any) {
        console.error(err);
        setAlertMessage(`🚨 สร้างโฟลเดอร์ใน Google Drive ล้มเหลว: ${err.message || err}`);
      } finally {
        setGoogleDriveLoading(false);
        setIsCreateFolderOpen(false);
      }
    } else {
      const newFolder: DBItem = {
        id: 'folder_' + Math.random().toString(36).substring(2) + Date.now().toString(),
        name: folderNameInput.trim(),
        isFolder: true,
        parentId: currentFolderId,
        size: 0,
        type: 'directory',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isTrashed: false,
      };

      setItems(prev => [...prev, newFolder]);
      setIsCreateFolderOpen(false);
      await putItem(newFolder);
      fetchItemsAndStats();
    }
  };

  const handleDownload = (item: DBItem) => {
    if (item.isFolder) return;
    
    const link = document.createElement('a');
    if (item.type.startsWith('text/') && !item.content?.startsWith('data:')) {
      const blob = new Blob([item.content || ''], { type: item.type });
      link.href = URL.createObjectURL(blob);
    } else {
      link.href = item.content || '';
    }
    
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRename = (item: DBItem) => {
    setRenameItem(item);
    setRenameInput(item.name);
  };

  const confirmRenameItem = async () => {
    if (!renameItem) return;
    const newName = renameInput.trim();
    const item = renameItem;
    setRenameItem(null);

    if (!newName || newName === item.name) return;

    setItems(prev => prev.map(x => {
      if (x.id === item.id) {
        return { ...x, name: newName, updatedAt: Date.now() };
      }
      return x;
    }));

    const updatedItem = { ...item, name: newName, updatedAt: Date.now() };
    await saveItemDirect(updatedItem);
    fetchItemsAndStats();
  };

  // Drag and Drop folder structure move helper
  const handleMoveFileOrFolder = async (item: DBItem) => {
    // If the item has a parentId change predefined (passed from Drag and Drop)
    if (item.parentId !== undefined) {
      setItems(prev => prev.map(x => {
        if (x.id === item.id) {
          return { ...x, parentId: item.parentId, updatedAt: Date.now() };
        }
        return x;
      }));
      await saveItemDirect({ ...item, updatedAt: Date.now() });
      fetchItemsAndStats();
    } else {
      // Trigger select folder modal
      setItemToMove(item);
    }
  };

  const handleConfirmMoveModal = async (itemId: string, destinationFolderId: string | null) => {
    setItems(prev => prev.map(x => {
      if (x.id === itemId) {
        return { ...x, parentId: destinationFolderId, updatedAt: Date.now() };
      }
      return x;
    }));

    const targetItem = items.find(x => x.id === itemId);
    if (targetItem) {
      const updated = { ...targetItem, parentId: destinationFolderId, updatedAt: Date.now() };
      await saveItemDirect(updated);
      fetchItemsAndStats();
    }
  };

  const handleDelete = async (item: DBItem) => {
    if (currentCategory === 'google-drive' && googleAccessToken) {
      if (confirm(`🚨 ยืนยันการลบไฟล์จาก Google Drive\nคุณแน่ใจหรือไม่ว่าต้องการลบ "${item.name}" จาก Google Drive ถาวร? ข้อมูลทั้งหมดจะสูญหาย`)) {
        setGoogleDriveLoading(true);
        try {
          await deleteFileFromGoogleDrive(googleAccessToken, item.id);
          fetchGoogleDriveFiles(googleAccessToken, googleDriveParentFolderId);
          setAlertMessage(`🗑️ ลบไฟล์ "${item.name}" จาก Google Drive สำเร็จเรียบร้อยแล้ว!`);
        } catch (err: any) {
          console.error(err);
          setAlertMessage(`🚨 ลบไฟล์บน Google Drive ล้มเหลว: ${err.message || err}`);
        } finally {
          setGoogleDriveLoading(false);
        }
      }
      return;
    }

    if (item.isTrashed) {
      if (confirm(`🚨 เลือกการลบอย่างถาวรกู้ไม่ได้\nคุณต้องการลบ "${item.name}" อย่างถาวรใช่หรือไม่?`)) {
        setItems(prev => prev.filter(x => x.id !== item.id));
        await deleteItem(item.id);
        
        if (previewItem?.id === item.id) {
          setPreviewItem(null);
        }
        fetchItemsAndStats();
      }
    } else {
      // safe delete to trash bin
      setItems(prev => prev.map(x => {
        if (x.id === item.id) {
          return { ...x, isTrashed: true, trashDate: Date.now() };
        }
        return x;
      }));

      const updated = { ...item, isTrashed: true, trashDate: Date.now() };
      await saveItemDirect(updated);
      fetchItemsAndStats();
    }
  };

  const handleRestore = async (item: DBItem) => {
    setItems(prev => prev.map(x => {
      if (x.id === item.id) {
        return { ...x, isTrashed: false, trashDate: undefined, parentId: null };
      }
      return x;
    }));

    const updated = { ...item, isTrashed: false, trashDate: undefined, parentId: null };
    await saveItemDirect(updated);
    fetchItemsAndStats();
  };

  const handleClearTrash = async () => {
    if (confirm('🚨 คุณต้องการล้างไฟล์ทั้งหมดในถังขยะอย่างถาวรใช่หรือไม่? ข้อมูลจะลบจากเซิร์ฟเวอร์ถาวร')) {
      const trashedItems = items.filter(x => x.isTrashed);
      const activeItems = items.filter(x => !x.isTrashed);
      
      setItems(activeItems);
      for (const item of trashedItems) {
        await deleteItem(item.id);
      }
      fetchItemsAndStats();
    }
  };

  const handleSaveTextContent = async (id: string, updatedContent: string) => {
    setItems(prev => prev.map(x => {
      if (x.id === id) {
        return { ...x, content: updatedContent, size: updatedContent.length, updatedAt: Date.now() };
      }
      return x;
    }));

    const original = items.find(x => x.id === id);
    if (original) {
      const updated = { ...original, content: updatedContent, size: updatedContent.length, updatedAt: Date.now() };
      await saveItemDirect(updated);
      fetchItemsAndStats();
    }
  };

  const handleOpenFile = async (item: DBItem) => {
    if (item.isFolder) {
      handleNavigate(item.id);
      return;
    }

    if (currentCategory === 'google-drive' && googleAccessToken) {
      const isGoogleApps = item.type.startsWith('application/vnd.google-apps.');
      if (isGoogleApps) {
        if (item.content) {
          window.open(item.content, '_blank');
          setAlertMessage(`🔗 กำลังเปิดเอกสาร Google ดั้งเดิมในแท็บใหม่...`);
          return;
        }
      }

      setGoogleDriveLoading(true);
      try {
        const fetched = await fetchGoogleDriveFileContent(googleAccessToken, item.id, item.type);
        const tempItem: DBItem = {
          ...item,
          content: fetched.content,
        };
        setGoogleDriveLoading(false);
        openLocalViewer(tempItem);
      } catch (err: any) {
        console.error(err);
        setGoogleDriveLoading(false);
        if (item.content) {
          window.open(item.content, '_blank');
        } else {
          setAlertMessage(`🚨 ไม่สามารถโหลดเนื้อหาไฟล์เพื่อแสดงตัวอย่างได้: ${err.message || err}`);
        }
      }
      return;
    }

    openLocalViewer(item);
  };

  const openLocalViewer = (item: DBItem) => {
    const parts = item.name.split('.');
    const fileExt = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    const mime = item.type.toLowerCase();

    if (['doc', 'docx'].includes(fileExt) || mime.includes('document') || mime.includes('msword')) {
      handleDownload(item);
      setAlertMessage(`📥 กำลังจัดเตรียมสตรีมดาวน์โหลดไฟล์ "${item.name}" เพื่อเรียกเปิดทำงานโดยโปรแกรม Microsoft Word บนเครื่องคอมพิวเตอร์ของคุณโดยรอบด้าน...`);
    } else if (['xls', 'xlsx', 'csv'].includes(fileExt) || mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')) {
      setSimulatedExcelItem(item);
    } else {
      setPreviewItem(item);
    }
  };

  // Drag over triggers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        handleUploadFile(e.dataTransfer.files[i]);
      }
    }
  };

  const triggerUploadDialog = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      for (let i = 0; i < e.target.files.length; i++) {
        handleUploadFile(e.target.files[i]);
      }
    }
  };

  const allFoldersList = useMemo(() => {
    return items.filter(x => x.isFolder && !x.isTrashed);
  }, [items]);

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex h-screen w-screen overflow-hidden bg-slate-50 antialiased"
    >
      {/* Hidden File Input handler */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Drag-and-drop overlay */}
      {isDragActive && (
        <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-xs flex flex-col items-center justify-center p-6 border-4 border-dashed border-indigo-600 z-50 pointer-events-none select-none animate-in fade-in duration-100">
          <div className="p-6 bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center gap-3">
            <UploadCloud className="w-12 h-12 text-indigo-600 animate-bounce" />
            <h3 className="font-bold text-slate-800 text-sm leading-none mt-2">ปล่อยไฟล์ของคุณลงที่นี่เพื่ออัปโหลดทันที</h3>
            <p className="text-[11px] text-slate-400 font-semibold">ไฟล์จะถูกบันทึกและกระจายลงไปเก็บไว้ในเซิร์ฟเวอร์แบบเรียลไทม์</p>
          </div>
        </div>
      )}

      {/* Sidebar Component with width transition */}
      <div 
        className="transition-all duration-300 ease-in-out overflow-hidden h-full flex flex-col shrink-0 bg-white border-r border-slate-100"
        style={{ width: isSidebarCollapsed ? '0px' : '256px', borderRightWidth: isSidebarCollapsed ? '0px' : '1px' }}
      >
        <div className="w-64 h-full flex flex-col">
          <Sidebar
            currentCategory={currentCategory}
            setCurrentCategory={setCurrentCategory}
            stats={stats}
            onUploadClick={triggerUploadDialog}
            onCreateFolderClick={handleCreateFolder}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(true)}
            isGoogleConnected={isGoogleConnected}
            onConnectGoogle={handleConnectGoogle}
            onDisconnectGoogle={handleDisconnectGoogle}
            googleUserEmail={googleUserEmail}
            isConnectingGoogle={isConnectingGoogle}
          />
        </div>
      </div>

      {/* Main drive workspace */}
      <FileGrid
        items={currentCategory === 'google-drive' ? googleDriveItems : items}
        currentFolderId={currentCategory === 'google-drive' ? googleDriveParentFolderId : currentFolderId}
        currentCategory={currentCategory}
        onNavigate={handleNavigate}
        onPreview={handleOpenFile}
        onDownload={currentCategory === 'google-drive' ? (item) => {
          if (googleAccessToken) {
            setGoogleDriveLoading(true);
            fetchGoogleDriveFileContent(googleAccessToken, item.id, item.type)
              .then(res => {
                const link = document.createElement('a');
                link.href = res.content;
                link.download = item.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setGoogleDriveLoading(false);
              })
              .catch(err => {
                console.error(err);
                setGoogleDriveLoading(false);
                setAlertMessage(`🚨 ดาวน์โหลดจากกูเกิ้ลไดฟ์ล้มเหลว: ${err.message || err}`);
              });
          }
        } : handleDownload}
        onRename={handleRename}
        onMove={handleMoveFileOrFolder}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onClearTrash={handleClearTrash}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(false)}
        onOpenChoice={(item) => setOpenChoiceItem(item)}
        breadcrumbsOverride={currentCategory === 'google-drive' ? googleDrivePath : undefined}
        onExportToGoogle={handleExportToGoogle}
        onImportFromGoogle={handleImportFromGoogle}
        isGoogleConnected={isGoogleConnected}
      />

      {/* Loading Overlay spinner */}
      {googleDriveLoading && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex flex-col items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3 border border-slate-100 select-none">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-700">กำลังประมวลผลข้อมูล Google Drive สื่อสารระบบ...</p>
          </div>
        </div>
      )}

      {/* Standard multimedia preview modal */}
      {previewItem && (
        <PreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onSaveContent={handleSaveTextContent}
          onDownload={handleDownload}
          onOpenHandoff={(item) => setOpenChoiceItem(item)}
        />
      )}

      {/* Choice Selector Modal for deciding how to open the file */}
      {openChoiceItem && (
        <OpenChoiceModal
          item={openChoiceItem}
          onClose={() => setOpenChoiceItem(null)}
          onSelectWeb={(item) => {
            setPreviewItem(item);
            setOpenChoiceItem(null);
          }}
          onSelectWord={(item) => {
            handleDownload(item);
            setOpenChoiceItem(null);
            setAlertMessage(`📥 กำลังจัดเตรียมสตรีมดาวน์โหลดไฟล์ "${item.name}" เพื่อเรียกเปิดทำงานโดยโปรแกรม Microsoft Word บนเครื่องคอมพิวเตอร์ของคุณโดยรอบด้าน...`);
          }}
          onSelectExcel={(item) => {
            setSimulatedExcelItem(item);
            setOpenChoiceItem(null);
          }}
          onSelectLocal={(item) => {
            handleDownload(item);
            setOpenChoiceItem(null);
            setAlertMessage(`🔗 ดึงไฟล์ "${item.name}" ลงคอมพิวเตอร์ของคุณสำเร็จแล้ว! ระบบปฏิบัติการในเครื่องจะเปิดทำงานโดยใช้โปรแกรมที่เกี่ยวข้องโดยอัตโนมัติ`);
          }}
        />
      )}

      {/* Interactive Simulated Microsoft Word */}
      {simulatedWordItem && (
        <SimulatedWordModal
          item={simulatedWordItem}
          onClose={() => setSimulatedWordItem(null)}
          onSaveContent={handleSaveTextContent}
          onOpenHandoff={(item) => setOpenChoiceItem(item)}
        />
      )}

      {/* Interactive Simulated Microsoft Excel */}
      {simulatedExcelItem && (
        <SimulatedExcelModal
          item={simulatedExcelItem}
          onClose={() => setSimulatedExcelItem(null)}
          onSaveContent={handleSaveTextContent}
          onOpenHandoff={(item) => setOpenChoiceItem(item)}
        />
      )}

      {/* Pop-up Folder Selector Move Modal */}
      {itemToMove && (
        <FolderSelectorModal
          itemToMove={itemToMove}
          allFolders={allFoldersList}
          onClose={() => setItemToMove(null)}
          onConfirmMove={handleConfirmMoveModal}
        />
      )}

      {/* Create Folder Modal */}
      {isCreateFolderOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                📁
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">สร้างโฟลเดอร์ใหม่</h3>
                <p className="text-[10px] text-slate-400 font-medium">ระบุหมวดหมู่การจัดเก็บให้เป็นระเบียบ</p>
              </div>
            </div>

            <div>
              <label htmlFor="folder-name-input" className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.55">
                ชื่อโฟลเดอร์
              </label>
              <input
                id="folder-name-input"
                type="text"
                autoFocus
                placeholder="ระบุชื่อโฟลเดอร์..."
                value={folderNameInput}
                onChange={(e) => setFolderNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmCreateFolder();
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-semibold focus:outline-hidden text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                id="btn-confirm-cancel-folder"
                onClick={() => setIsCreateFolderOpen(false)}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 cursor-pointer transition-colors"
                type="button"
              >
                ยกเลิก
              </button>
              <button
                id="btn-confirm-create-folder"
                onClick={confirmCreateFolder}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                type="button"
              >
                สร้างโฟลเดอร์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Edit className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">เปลี่ยนชื่อ</h3>
                <p className="text-[10px] text-slate-400 font-medium">กำหนดชื่อใหม่สำหรับ {renameItem.isFolder ? 'โฟลเดอร์' : 'ไฟล์'} ของคุณ</p>
              </div>
            </div>

            <div>
              <label htmlFor="rename-input" className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                กำหนดชื่อใหม่
              </label>
              <input
                id="rename-input"
                type="text"
                autoFocus
                placeholder="ระบุชื่อเก่า/ใหม่..."
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmRenameItem();
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-semibold focus:outline-hidden text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                id="btn-confirm-cancel-rename"
                onClick={() => setRenameItem(null)}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer transition-colors"
              >
                ยกเลิก
              </button>
              <button
                id="btn-confirm-save-rename"
                onClick={confirmRenameItem}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                บันทึกการเปลี่ยนชื่อ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Notification Popup Modal */}
      {alertMessage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-center items-center">
            <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-1 font-bold text-lg select-none">
              ℹ️
            </div>
            <div>
              <h3 className="font-bold text-slate-850 text-sm mb-1">การป้อนบริการระบบคลาวด์</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">{alertMessage}</p>
            </div>

            <button
              id="btn-alert-close"
              onClick={() => setAlertMessage(null)}
              className="w-full py-2.5 mt-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              ตกลง รับทราบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
