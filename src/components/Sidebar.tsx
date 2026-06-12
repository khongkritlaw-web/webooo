/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ImageIcon, 
  FileText, 
  Music, 
  Trash2, 
  PlusCircle, 
  FolderPlus, 
  HardDrive,
  ChevronLeft
} from 'lucide-react';
import { FileCategory, StorageStats } from '../types';

interface SidebarProps {
  currentCategory: FileCategory;
  setCurrentCategory: (cat: FileCategory) => void;
  stats: StorageStats;
  onUploadClick: () => void;
  onCreateFolderClick: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  currentCategory,
  setCurrentCategory,
  stats,
  onUploadClick,
  onCreateFolderClick,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {

  const categories = [
    { id: 'all' as FileCategory, label: 'ไฟล์และโฟลเดอร์ทั้งหมด', icon: HardDrive, color: 'text-indigo-600' },
    { id: 'images' as FileCategory, label: 'รูปภาพ / ภาพถ่าย', icon: ImageIcon, color: 'text-emerald-500' },
    { id: 'documents' as FileCategory, label: 'เอกสารและไฟล์ข้อความ', icon: FileText, color: 'text-indigo-500' },
    { id: 'audio-video' as FileCategory, label: 'เพลงและสื่อวิดีโอ', icon: Music, color: 'text-amber-500' },
    { id: 'trash' as FileCategory, label: 'ถังขยะรักษาความปลอดภัย', icon: Trash2, color: 'text-rose-500' },
  ];

  return (
    <div className="w-64 bg-white border-r border-slate-100 flex flex-col h-full shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-50 select-none flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block px-2">เมนูเข้าใช้งาน</span>
        <button
          id="btn-sidebar-collapse"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mr-1"
          title="พับเก็บเมนูนำทาง"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Primary Actions for Adding Folders and Files */}
      <div className="p-4 flex flex-col gap-2 border-b border-slate-50 shrink-0">
        <button
          id="btn-sidebar-upload"
          onClick={onUploadClick}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all duration-150 shadow-sm shadow-indigo-100"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>เพิ่มไฟล์ใหม่ (Upload)</span>
        </button>
        <button
          id="btn-sidebar-folder"
          onClick={onCreateFolderClick}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/50 rounded-xl text-xs font-bold cursor-pointer transition-all duration-150"
        >
          <FolderPlus className="w-4 h-4 shrink-0 text-slate-500" />
          <span>สร้างโฟลเดอร์ใหม่</span>
        </button>
      </div>

      {/* Navigation Categories */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          <span className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-400">หมวดหมู่ไดรฟ์</span>
          <nav className="space-y-0.5 mt-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = currentCategory === cat.id;
              return (
                <button
                  id={`btn-cat-${cat.id}`}
                  key={cat.id}
                  onClick={() => setCurrentCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : cat.color}`} />
                    <span>{cat.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

    </div>
  );
}
