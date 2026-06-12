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
  ChevronLeft,
  Cloud,
  LogOut
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
  isGoogleConnected: boolean;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  googleUserEmail: string | null;
}

export default function Sidebar({
  currentCategory,
  setCurrentCategory,
  stats,
  onUploadClick,
  onCreateFolderClick,
  isCollapsed,
  onToggleCollapse,
  isGoogleConnected,
  onConnectGoogle,
  onDisconnectGoogle,
  googleUserEmail,
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

      {/* Google Drive Integration Panel */}
      <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-2">
          <Cloud className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Google Drive บริการคลาวด์</span>
        </div>

        {isGoogleConnected ? (
          <div className="flex flex-col gap-2 bg-white border border-slate-150 rounded-xl p-2.5">
            <div className="overflow-hidden">
              <span className="text-[10px] text-emerald-600 font-bold block">● เชื่อมต่อกูเกิ้ลไดฟ์แล้ว</span>
              <span className="text-[11px] font-semibold text-slate-700 truncate block mt-0.5" title={googleUserEmail || ""}>
                {googleUserEmail || "แชร์ข้อมูลสำเร็จ"}
              </span>
            </div>
            
            <button
              id="btn-sidebar-drive-nav"
              onClick={() => setCurrentCategory('google-drive')}
              className={`w-full py-2 px-2 bg-indigo-50 border border-indigo-100/50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                currentCategory === 'google-drive' ? 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700' : ''
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>เปิดดูไฟล์ใน Google Drive</span>
            </button>

            <button
              id="btn-sidebar-disconnect-google"
              onClick={onDisconnectGoogle}
              className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>ยกเลิกเชื่อมต่อบัญชี</span>
            </button>
          </div>
        ) : (
          <div className="bg-white border border-slate-150 rounded-xl p-3 flex flex-col gap-2">
            <p className="text-[10px] text-slate-500 font-medium leading-normal">
              เอาข้อมูลเก็บไว้และเรียกดูข้อมูลผ่านกูเกิ้ลไดฟ์ได้ทันทีตลอดเวลา
            </p>
            <button
              id="btn-sidebar-connect-google"
              onClick={onConnectGoogle}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
            >
              <Cloud className="w-3.5 h-3.5 shrink-0" />
              <span>เชื่อมต่อ Google Drive</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
