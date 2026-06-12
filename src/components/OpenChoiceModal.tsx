/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { X, Globe, Laptop, ArrowRight, CheckCircle2, ChevronRight, HardDrive } from 'lucide-react';
import { DBItem } from '../types';

interface OpenChoiceModalProps {
  item: DBItem;
  onClose: () => void;
  onSelectWeb: (item: DBItem) => void;
  onSelectWord: (item: DBItem) => void;
  onSelectExcel: (item: DBItem) => void;
  onSelectLocal: (item: DBItem) => void;
}

export default function OpenChoiceModal({
  item,
  onClose,
  onSelectWeb,
  onSelectWord,
  onSelectExcel,
  onSelectLocal,
}: OpenChoiceModalProps) {
  // Extract file extension to suggest the list of programs in OS
  const fileExt = useMemo(() => {
    const parts = item.name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }, [item.name]);

  // Determine actual local programs for the file type
  const localAppsInfo = useMemo(() => {
    if (['doc', 'docx'].includes(fileExt) || item.type.includes('document') || item.type.includes('msword')) {
      return {
        category: 'โปรแกรมจัดการเอกสาร (Document)',
        list: [
          { name: 'Microsoft Word', os: 'Windows / macOS' },
          { name: 'WPS Office', os: 'Android / iOS / Windows' },
          { name: 'Apple Pages', os: 'macOS / iOS' },
          { name: 'Google Docs', os: 'เบราว์เซอร์ / มือถือ' }
        ],
        icon: '📝',
        webType: 'word'
      };
    }
    if (['xls', 'xlsx', 'csv'].includes(fileExt) || item.type.includes('sheet') || item.type.includes('excel') || item.type.includes('csv')) {
      return {
        category: 'โปรแกรมตารางคำนวณ (Spreadsheet)',
        list: [
          { name: 'Microsoft Excel', os: 'Windows / macOS' },
          { name: 'WPS Office / Sheets', os: 'Android / iOS' },
          { name: 'Apple Numbers', os: 'macOS / iOS' },
          { name: 'Google Sheets', os: 'เบราว์เซอร์ / มือถือ' }
        ],
        icon: '📊',
        webType: 'excel'
      };
    }
    if (['pdf'].includes(fileExt) || item.type.includes('pdf')) {
      return {
        category: 'โปรแกรมอ่านไฟล์ PDF (PDF Reader)',
        list: [
          { name: 'Adobe Acrobat Reader', os: 'Windows / Mac / มือถือ' },
          { name: 'Google Chrome / Safari', os: 'ทุกระบบปฏิบัติการ' },
          { name: 'Foxit PDF Reader', os: 'Windows / macOS' },
          { name: 'เครื่องมือระบบ (Preview)', os: 'macOS / iOS' }
        ],
        icon: '📕',
        webType: 'web'
      };
    }
    if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(fileExt) || item.type.startsWith('image/')) {
      return {
        category: 'โปรแกรมเปิดรูปภาพ (Image Viewer)',
        list: [
          { name: 'Windows Photos', os: 'Windows' },
          { name: 'macOS Preview / Photos', os: 'macOS' },
          { name: 'แอปคลังภาพ (Gallery / Photos)', os: 'iOS / Android' },
          { name: 'Google Chrome / Edge', os: 'ทุกระบบปฏิบัติการ' }
        ],
        icon: '🖼️',
        webType: 'web'
      };
    }
    if (['mp3', 'wav', 'mp4', 'mov', 'webm', 'ogg'].includes(fileExt) || item.type.startsWith('audio/') || item.type.startsWith('video/')) {
      return {
        category: 'โปรแกรมเล่นพรีวิวมีเดีย (Media Player)',
        list: [
          { name: 'QuickTime Player', os: 'macOS / iOS' },
          { name: 'Windows Media Player', os: 'Windows' },
          { name: 'VLC Media Player', os: 'ทุกระบบปฏิบัติการ (คอม & มือถือ)' },
          { name: 'แอปเล่นวิดีโอเริ่มต้น (Default Player)', os: 'Android / iOS' }
        ],
        icon: '🎵',
        webType: 'web'
      };
    }
    
    // Default fallback
    return {
      category: 'โปรแกรมจัดการไฟล์ทั่วไป (General File)',
      list: [
        { name: 'โปรแกรมเปิดไฟล์เริ่มต้นเครื่อง (Default App)', os: 'ระบบเครื่องออโต้' },
        { name: 'Notepad / VS Code', os: 'Windows / macOS' },
        { name: 'TextEdit', os: 'macOS' }
      ],
      icon: '📂',
      webType: 'web'
    };
  }, [fileExt, item.type]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSelectWeb = () => {
    if (localAppsInfo.webType === 'word') {
      onSelectWord(item);
    } else if (localAppsInfo.webType === 'excel') {
      onSelectExcel(item);
    } else {
      onSelectWeb(item);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-[32px] w-full max-w-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Section */}
        <div className="bg-slate-50 border-b border-slate-100 px-8 py-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-650 bg-indigo-50 px-2.5 py-1 rounded-full">
              ระบุวิธีการเปิดไฟล์ • วิธีเข้าถึงข้อมูลส่วนตัว
            </span>
            <h3 className="font-bold text-slate-800 text-sm mt-2 flex items-center gap-1.5">
              <span>กำลังเปิดไฟล์:</span>
              <span className="text-indigo-600 truncate max-w-xs sm:max-w-md">{item.name}</span>
            </h3>
            <p className="text-[9px] text-slate-400 font-mono mt-1 font-semibold">
              ชนิดไฟล์: {item.type} • ขนาดหน่วยความจำ: {formatSize(item.size)}
            </p>
          </div>
          <button
            id="btn-choice-close"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Section with Exactly Two Direct Columns */}
        <div className="p-8 flex flex-col gap-6">
          <p className="text-slate-500 font-semibold text-xs leading-relaxed">
            เลือกสภาพแวดล้อมที่ท่านต้องการใช้งานระบบเปิดไฟล์ เพื่อเพิ่มความสะดวกในการอ่านหรือแก้ไข จากหน้าจอใดๆ ก็ได้:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Column 1: Launch Web Simulator / Viewer */}
            <div 
              id="choice-web-viewer"
              onClick={handleSelectWeb}
              className="p-6 rounded-2xl border border-indigo-100 bg-indigo-50/10 hover:bg-indigo-50/20 hover:border-indigo-300 hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                  <Globe className="w-5 h-5 animate-pulse" />
                </div>
                <h4 className="font-bold text-slate-800 text-xs mb-1.5 group-hover:text-indigo-650 flex items-center gap-1.5">
                  <span>🌐 เปิดทำงานบนหน้าเว็บ</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mb-3">
                  เข้าถึงพรีวิวอย่างง่ายดาย, สามารถแก้ไขหรือป้อนข้อมูล และบันทึกกลับไปยังระบบคลาวด์ได้ทันทีจากทุกบราวเซอร์ โดยไม่ต้องผ่านกระบวนการย้ายเครื่อง
                </p>
                <div className="bg-indigo-50/50 border border-indigo-100/50 p-2.5 rounded-lg text-[9px] text-indigo-700 font-medium">
                  {localAppsInfo.webType === 'word' ? (
                    <span>📝 แฟ้มระบบจะเปิดด้วยแอปจัดการคำจำลอง <b>Word Online</b> ซึ่งรองรับการเปลี่ยนฟอนต์ จัดหน้า และการเขียนเนื้อหาด่วน</span>
                  ) : localAppsInfo.webType === 'excel' ? (
                    <span>📊 แฟ้มระบบจะเปิดด้วยแอป <b>Excel Online</b> รองรับตาราง ช่องกริด และสูตรคำนวณสถิติพื้นฐาน</span>
                  ) : (
                    <span>🔍 แฟ้มระบบจะเปิดด้วยเว็บพรีวิวเวอร์ในตัว สามารถดูรูปภาพ เล่นมีเดีย หรือตรวจงานพิมพ์ด่วนได้แสนสบาย</span>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-1 text-[10px] font-bold text-indigo-650">
                <span>เริ่มพรีวิวเนื้อหาเพื่อแก้ไข</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Column 2: Launch Device Associated Application */}
            <div 
              id="choice-local-app"
              onClick={() => onSelectLocal(item)}
              className="p-6 rounded-2xl border border-slate-100 bg-white hover:border-indigo-300 hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                  <Laptop className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-850 text-xs mb-1.5 group-hover:text-indigo-650 flex items-center gap-1.5">
                  <span>💻 เปิดด้วยโปรแกรมในเครื่อง</span>
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mb-3">
                  ดาวน์โหลดไฟล์อัตโนมัติ และแจ้งคำสั่งเบราเซอร์ให้เปิดไฟล์ผ่านโปรแกรมติดตั้งอย่างเป็นทางการในเครื่อง PC, Mac, หรือสมาร์ทโฟนของท่านในปุ่มเดียว
                </p>
                
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <span>{localAppsInfo.icon}</span>
                    <span>แนะนำโปรแกรมในเครื่องของคุณ</span>
                  </h5>
                  <div className="space-y-1 divide-y divide-slate-100">
                    {localAppsInfo.list.map((app, index) => (
                      <div key={index} className="flex justify-between items-center text-[9px] font-semibold pt-1 first:pt-0">
                        <span className="text-slate-700 flex items-center gap-1 mb-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-indigo-500 select-none shrink-0" />
                          <span>{app.name}</span>
                        </span>
                        <span className="text-slate-400 font-mono text-[8px]">{app.os}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-1 text-[10px] font-bold text-indigo-650">
                <span>ดาวน์โหลดไปรันขี่บแอปเครื่อง</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

