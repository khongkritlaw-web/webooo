/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  File, 
  Search, 
  List, 
  Grid, 
  ChevronRight, 
  MoreVertical, 
  Download, 
  Trash2, 
  Edit, 
  FolderInput, 
  Undo,
  ArrowUp,
  ArrowDown,
  Eye,
  Plus,
  Laptop
} from 'lucide-react';
import { DBItem, FileCategory } from '../types';

interface FileGridProps {
  items: DBItem[];
  currentFolderId: string | null;
  currentCategory: FileCategory;
  onNavigate: (folderId: string | null) => void;
  onPreview: (item: DBItem) => void;
  onDownload: (item: DBItem) => void;
  onRename: (item: DBItem) => void;
  onMove: (item: DBItem) => void;
  onDelete: (item: DBItem) => void;
  onRestore: (item: DBItem) => void;
  onClearTrash: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenChoice?: (item: DBItem) => void;
}

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'date' | 'size';
type SortOrder = 'asc' | 'desc';

export default function FileGrid({
  items,
  currentFolderId,
  currentCategory,
  onNavigate,
  onPreview,
  onDownload,
  onRename,
  onMove,
  onDelete,
  onRestore,
  onClearTrash,
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenChoice,
}: FileGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // States for folder drag & drop move
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Filter items based on active folder, category or search query
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // 1. Separate Trash vs Active items
    if (currentCategory === 'trash') {
      result = result.filter(item => item.isTrashed);
    } else {
      result = result.filter(item => !item.isTrashed);

      // 2. Filter by Folder (only if not searching, which searches the entire space)
      if (searchQuery.trim() === '') {
        result = result.filter(item => item.parentId === currentFolderId);
      }

      // 3. Filter by file types category 
      if (currentCategory !== 'all') {
        result = result.filter(item => {
          if (item.isFolder) return false;
          const mime = item.type.toLowerCase();
          switch (currentCategory) {
            case 'images':
              return mime.startsWith('image/');
            case 'documents':
              return mime.startsWith('text/') || mime.includes('pdf') || mime.includes('document') || mime.includes('sheet') || mime.includes('msword') || mime.includes('excel') || mime.includes('csv');
            case 'audio-video':
              return mime.startsWith('audio/') || mime.startsWith('video/');
            default:
              return true;
          }
        });
      }
    }

    // 4. Handle search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => item.name.toLowerCase().includes(q));
    }

    // 5. Sort directories first, then files with the selected condition
    result.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;

      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name, 'th');
      } else if (sortField === 'date') {
        comparison = a.updatedAt - b.updatedAt;
      } else if (sortField === 'size') {
        comparison = a.size - b.size;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [items, currentFolderId, currentCategory, searchQuery, sortField, sortOrder]);

  // Construct current directory path breadcrumbs
  const breadcrumbs = useMemo(() => {
    const list: { id: string | null; name: string }[] = [{ id: null, name: 'โฟลเดอร์หลัก (Home)' }];
    if (!currentFolderId) return list;

    let targetId: string | null = currentFolderId;
    const pathList: { id: string | null; name: string }[] = [];

    while (targetId) {
      const folder = items.find(item => item.id === targetId && item.isFolder);
      if (folder) {
        pathList.unshift({ id: folder.id, name: folder.name });
        targetId = folder.parentId;
      } else {
        break;
      }
    }

    return [...list, ...pathList];
  }, [items, currentFolderId]);

  const currentFolderName = useMemo(() => {
    if (!currentFolderId) return 'โฟลเดอร์หลัก';
    const folder = items.find(item => item.id === currentFolderId);
    return folder ? folder.name : 'โฟลเดอร์หลัก';
  }, [items, currentFolderId]);

  // Read sizes 
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleToggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  // Close menus on click away
  React.useEffect(() => {
    const closeAll = () => setActiveMenuId(null);
    window.addEventListener('click', closeAll);
    return () => window.removeEventListener('click', closeAll);
  }, []);

  // --- HTML5 Drag and Drop Handlers for Folder Sorting ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOverFolder = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    if (draggedItemId && draggedItemId !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDragLeaveFolder = () => {
    setDragOverFolderId(null);
  };

  const handleDropOnFolder = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain') || draggedItemId;
    setDraggedItemId(null);
    setDragOverFolderId(null);

    if (itemId && itemId !== targetFolderId) {
      const itemToMove = items.find(x => x.id === itemId);
      if (itemToMove) {
        // Trigger save/move operation
        onMove({ ...itemToMove, parentId: targetFolderId });
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50/40 relative">
      {/* Top action bar with search */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between shrink-0 gap-4">
        {/* Search Input Box */}
        <div className="flex items-center gap-3 w-full max-w-sm shrink-0">
          {isSidebarCollapsed && (
            <button
              id="btn-sidebar-expand"
              onClick={onToggleSidebar}
              className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer shrink-0 shadow-sm shadow-indigo-50"
              title="แสดงเมนูนำทางฝั่งซ้าย"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
              </svg>
            </button>
          )}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="input-search"
              type="text"
              placeholder="ค้นหาชื่อไฟล์ หรือเนื้อหาจากคลาวด์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/60 focus:border-indigo-500 rounded-xl text-xs font-semibold focus:outline-hidden transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Sorting options + View options */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl gap-0.5">
            <button
              id="btn-sort-name"
              onClick={() => handleToggleSort('name')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                sortField === 'name' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>ชื่อ</span>
              {sortField === 'name' && (sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)}
            </button>
            <button
              id="btn-sort-date"
              onClick={() => handleToggleSort('date')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                sortField === 'date' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>ล่าสุด</span>
              {sortField === 'date' && (sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)}
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-250 shrink-0" />

          {/* Grid/List views toggler */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl">
            <button
              id="btn-view-grid"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="ตารางไอคอน"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              id="btn-view-list"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="ตารางรายการ"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main folder workspace panel */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
        
        {/* Dynamic Breadcrumbs list path */}
        <div className="flex flex-wrap items-center justify-between gap-4 select-none">
          <div className="flex flex-wrap items-center gap-1 bg-white border border-slate-100 px-3.5 py-1.5 rounded-xl shadow-xs">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id || 'root'}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                <button
                  id={`btn-crumb-${idx}`}
                  onClick={() => {
                    if (currentCategory === 'trash') {
                      onNavigate(null);
                    } else {
                      onNavigate(crumb.id);
                    }
                  }}
                  className={`text-xs font-bold transition-all max-w-[150px] truncate ${
                    idx === breadcrumbs.length - 1 
                      ? 'text-slate-800' 
                      : 'text-indigo-600 hover:text-indigo-800 cursor-pointer'
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentCategory === 'trash' && filteredAndSortedItems.length > 0 && (
              <button
                id="btn-clear-trash"
                onClick={onClearTrash}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 animate-pulse" />
                <span>ล้างถังขยะอย่างถาวร</span>
              </button>
            )}

            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200/50 px-2.5 py-1.5 rounded-xl">
              {currentCategory === 'trash' 
                ? 'ถังขยะ' 
                : searchQuery 
                  ? `ค้นหา: "${searchQuery}"` 
                  : `หมวดหลัก: ${currentFolderName}`}
            </span>
          </div>
        </div>



        {/* --- Folder List Grid View --- */}
        {filteredAndSortedItems.length === 0 ? (
          /* Empty drive State graphic */
          <div className="flex flex-col items-center justify-center py-24 select-none">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4 text-2xl">
              📂
            </div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">
              {searchQuery ? 'ไม่พบข้อมูลที่ตรงกับการสะกดคำค้นหา' : 'ยังไม่มีไฟล์หรือโฟลเดอร์จัดเก็บที่นี่'}
            </h3>
            <p className="text-[11px] font-medium text-slate-400 text-center max-w-sm leading-relaxed mb-4">
              {searchQuery 
                ? 'กรุณาลองเปลี่ยนคำค้นหา หรือค้นหาขอบเขตหมวดหมู่อื่นดูแทน' 
                : 'เริ่มต้นลากไฟล์จากนอกหน้าต่างระบบบราวเซอร์ของคุณมาวางที่นี่ หรือกดปุ่ม "อัปโหลดไฟล์" ในแถบด้านข้าง'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View layout rendering directory items */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredAndSortedItems.map((item) => {
              const isOverThisFolder = dragOverFolderId === item.id;
              
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={(e) => item.isFolder ? handleDragOverFolder(e, item.id) : undefined}
                  onDragLeave={item.isFolder ? handleDragLeaveFolder : undefined}
                  onDrop={(e) => item.isFolder ? handleDropOnFolder(e, item.id) : undefined}
                  onClick={() => {
                    if (item.isFolder) {
                      onNavigate(item.id);
                    } else {
                      onPreview(item);
                    }
                  }}
                  onDoubleClick={() => {
                    if (item.isFolder) {
                      onNavigate(item.id);
                    } else {
                      onPreview(item);
                    }
                  }}
                  className={`p-4 bg-white border rounded-2xl cursor-pointer hover:shadow-md transition-all flex flex-col justify-between group h-36 relative select-none ${
                    isOverThisFolder 
                      ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-200' 
                      : 'border-slate-100 hover:border-slate-350'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div 
                      className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105 ${
                        item.isFolder ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'
                      }`}
                    >
                      {item.isFolder ? (
                        <Folder className="w-5 h-5 fill-indigo-100/50" />
                      ) : (
                        <File className="w-5 h-5 text-slate-500" />
                      )}
                    </div>

                    {/* Actions Menu button */}
                    <div className="relative">
                      <button
                        id={`btn-menu-${item.id}`}
                        onClick={(e) => toggleMenu(e, item.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* Floating actions menu */}
                      {activeMenuId === item.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl w-36 py-1.5 z-40 animate-in fade-in slide-in-from-top-1 duration-100">
                          {item.isTrashed ? (
                            <>
                              <button
                                onClick={() => onRestore(item)}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Undo className="w-3.5 h-3.5 text-indigo-600" />
                                <span>กู้คืนข้อมูล</span>
                              </button>
                              <button
                                onClick={() => onDelete(item)}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-rose-50 text-rose-600 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer border-t border-slate-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>ลบถาวร</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => onPreview(item)}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                                <span>{item.isFolder ? 'เปิดดูโฟลเดอร์' : 'เปิดดูไฟล์'}</span>
                              </button>
                              {!item.isFolder && onOpenChoice && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenChoice(item);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-indigo-50 text-indigo-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer border-b border-indigo-100/50"
                                >
                                  <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>เปิดด้วยแอปในเครื่อง</span>
                                </button>
                              )}
                              {!item.isFolder && (
                                <button
                                  onClick={() => onDownload(item)}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5 text-slate-500" />
                                  <span>ดาวน์โหลด</span>
                                </button>
                              )}
                              <button
                                onClick={() => onRename(item)}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer border-t border-slate-50"
                              >
                                <Edit className="w-3.5 h-3.5 text-slate-500" />
                                <span>เปลี่ยนชื่อ</span>
                              </button>
                              <button
                                onClick={() => onMove(item)}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <FolderInput className="w-3.5 h-3.5 text-indigo-600" />
                                <span>ย้ายตำแหน่ง</span>
                              </button>
                              <button
                                onClick={() => onDelete(item)}
                                className="w-full text-left px-3.5 py-1.5 hover:bg-rose-50 text-rose-600 text-[11px] font-bold flex items-center gap-1.5 transition-colors border-t border-slate-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>ย้ายลงถังขยะ</span>
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-700 text-xs truncate max-w-full leading-relaxed" title={item.name}>
                      {item.name}
                    </h4>
                    <p className="text-[9px] font-bold text-slate-400 font-mono mt-0.5">
                      {item.isFolder ? 'รายการด้านใน' : formatSize(item.size)} • {formatDate(item.updatedAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View tabular formatting directory items */
          <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                  <th className="px-6 py-3">ชื่อ</th>
                  <th className="px-6 py-3 hidden sm:table-cell">ประเภท</th>
                  <th className="px-6 py-3">ขนาด</th>
                  <th className="px-6 py-3">วันที่แก้ไข</th>
                  <th className="px-6 py-3 w-16 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedItems.map((item) => {
                  const isOverThisFolder = dragOverFolderId === item.id;
                  return (
                    <tr
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragOver={(e) => item.isFolder ? handleDragOverFolder(e, item.id) : undefined}
                      onDragLeave={item.isFolder ? handleDragLeaveFolder : undefined}
                      onDrop={(e) => item.isFolder ? handleDropOnFolder(e, item.id) : undefined}
                      onClick={() => {
                        if (item.isFolder) {
                          onNavigate(item.id);
                        } else {
                          onPreview(item);
                        }
                      }}
                      onDoubleClick={() => {
                        if (item.isFolder) {
                          onNavigate(item.id);
                        } else {
                          onPreview(item);
                        }
                      }}
                      className={`hover:bg-slate-50/60 cursor-pointer border-b border-slate-50 transition-colors select-none ${
                        isOverThisFolder ? 'bg-indigo-50/50' : ''
                      }`}
                    >
                      <td className="px-6 py-3.5 font-bold text-slate-700 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          item.isFolder ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'
                        }`}>
                          {item.isFolder ? (
                            <Folder className="w-4 h-4 fill-indigo-100/30" />
                          ) : (
                            <File className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <span className="truncate max-w-xs md:max-w-md block">{item.name}</span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-400 hidden sm:table-cell truncate max-w-[120px] font-mono leading-none text-[10px]">
                        {item.type || 'unknown'}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-mono font-bold">
                        {item.isFolder ? 'โฟลเดอร์' : formatSize(item.size)}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {formatDate(item.updatedAt)}
                      </td>
                      <td className="px-6 py-3.5 text-center relative">
                        <button
                          id={`btn-menu-tr-${item.id}`}
                          onClick={(e) => toggleMenu(e, item.id)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-450 hover:text-slate-600 cursor-pointer"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* Floating actions menu */}
                        {activeMenuId === item.id && (
                          <div className="absolute right-6 top-8 bg-white border border-slate-100 rounded-xl shadow-xl w-36 py-1.5 z-40 text-left animate-in fade-in duration-75">
                            {item.isTrashed ? (
                              <>
                                <button
                                  onClick={() => onRestore(item)}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 text-indigo-700 font-bold flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Undo className="w-3.5 h-3.5" />
                                  <span>กู้คืนข้อมูล</span>
                                </button>
                                <button
                                  onClick={() => onDelete(item)}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-rose-50 text-rose-600 font-bold flex items-center gap-1.5 cursor-pointer border-t border-slate-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>ลบถาวร</span>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => onPreview(item)}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>{item.isFolder ? 'เปิดเข้าดู' : 'เปิดดูพรีวิว'}</span>
                                </button>
                                {!item.isFolder && onOpenChoice && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenChoice(item);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 hover:bg-indigo-50 text-indigo-700 font-bold flex items-center gap-1.5 cursor-pointer border-b border-indigo-100/50"
                                  >
                                    <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>เปิดด้วยแอปในเครื่อง</span>
                                  </button>
                                )}
                                {!item.isFolder && (
                                  <button
                                    onClick={() => onDownload(item)}
                                    className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5 text-slate-500" />
                                    <span>ดาวน์โหลด</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => onRename(item)}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer border-t border-slate-50"
                                >
                                  <Edit className="w-3.5 h-3.5 text-slate-500" />
                                  <span>เปลี่ยนชื่อ</span>
                                </button>
                                <button
                                  onClick={() => onMove(item)}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-1.5 cursor-pointer"
                                >
                                  <FolderInput className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>ย้ายตำแหน่ง</span>
                                </button>
                                <button
                                  onClick={() => onDelete(item)}
                                  className="w-full text-left px-3.5 py-1.5 hover:bg-rose-50 text-rose-600 font-bold flex items-center gap-1.5 cursor-pointer border-t border-slate-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>ย้ายลงถังขยะ</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
