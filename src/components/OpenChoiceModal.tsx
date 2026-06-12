/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { X, Globe, Laptop, ArrowRight, CheckCircle2, ChevronRight, HardDrive, Sparkles, ExternalLink, Download } from 'lucide-react';
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
  // State to switch into Device Handoff Assistant screen
  const [showHandoff, setShowHandoff] = useState(false);

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
        webType: 'word',
        officeProto: 'ms-word'
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
        webType: 'excel',
        officeProto: 'ms-excel'
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

  const handleLaunchLocalApp = () => {
    // Run core item download function from parent App.tsx
    onSelectLocal(item);
    // Switch to step instructions view inside modal
    setShowHandoff(true);
  };

  const handleLaunchProtocol = () => {
    if (!localAppsInfo.officeProto) return;
    const fileUrl = `${window.location.origin}/api/download/${item.id}`;
    // Construct MS Office custom protocol URI format: ms-word:ofv|u|URL
    const protocolUri = `${localAppsInfo.officeProto}:ofv|u|${fileUrl}`;
    
    // Attempt redirecting browser to open native operating system protocol app handler
    window.location.href = protocolUri;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-[32px] w-full max-w-2xl border border-slate-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Section */}
        <div className="bg-slate-50 border-b border-slate-100 px-8 py-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-650 bg-indigo-50 px-2.5 py-1 rounded-full">
              ระบุวิธีการเปิดไฟล์ • วิธีเข้าถึงข้อมูลแอปภายนอก
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

        {/* Dynamic Inner Screen View */}
        {!showHandoff ? (
          /* SECTION A: Main Choice screen with exactly two columns */
          <div className="p-8 flex flex-col gap-6">
            <p className="text-slate-500 font-semibold text-xs leading-relaxed">
              เลือกสภาพแวดล้อมที่ท่านต้องการใช้งานระบบเปิดไฟล์ สำหรับดูพรีวิว แก้ไขคำดิบ หรือเชื่อมโยงไปยังโปรแกรมทางการบนอุปกรณ์คอมพิวเตอร์และมือถือของคุณโดยสะดวก:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Column 1: Launch Web Simulator / Viewer */}
              <div 
                id="choice-web-viewer"
                onClick={handleSelectWeb}
                className="p-6 rounded-2xl border border-indigo-100 bg-indigo-50/10 hover:bg-indigo-50/20 hover:border-indigo-300 hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between text-left"
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
                onClick={handleLaunchLocalApp}
                className="p-6 rounded-2xl border border-slate-100 bg-white hover:border-indigo-300 hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between text-left"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-850 text-xs mb-1.5 group-hover:text-indigo-650 flex items-center gap-1.5">
                    <span>💻 เปิดด้วยโปรแกรมในเครื่อง</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mb-3">
                    ดาวน์โหลดไฟล์อัตโนมัติ และแจ้งคำสั่งระบบเครื่อง เพื่อเรียกเปิดไฟล์ผ่านโปรแกรมทางการในแอป Windows, Mac, iOS, Android ของท่านได้อย่างอิสระ
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

                <div className="mt-5 flex items-center gap-1 text-[10px] font-bold text-indigo-650 animate-bounce">
                  <span>ดาวน์โหลดและเปิดโปรแกรมในเครื่อง</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* SECTION B: Device Handoff Assistant screen displaying precise PC/Mobile steps */
          <div className="p-8 flex flex-col gap-6 animate-in slide-in-from-bottom duration-350">
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                ✓
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-800">ส่งดึงข้อมูลไฟล์สตรีมลงเครื่องท่านเรียบร้อยแล้ว!</h4>
                <p className="text-[10px] text-emerald-650 leading-relaxed font-semibold mt-0.5">
                  ระบบได้สร้างไฟล์ตัวดาวน์โหลดลงคอมพิวเตอร์/สมาร์ทโฟนของท่านเป็นที่เรียบร้อย เนื่องจากมาตรฐานความปลอดภัยของเว็บเบราว์เซอร์ จึงจำเป็นต้องรบกวนท่านคลิกเปิดต่ออีก 1 ขั้นตอนด้านล่างนี้
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Instructions Column 1: PC/Mac Desktop */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">💻</span>
                  <h4 className="text-xs font-bold text-slate-800">วิธีการเปิดสำหรับ PC / Mac ของท่าน</h4>
                </div>
                <ol className="space-y-3 text-[10px] text-slate-600 font-semibold leading-relaxed pl-1">
                  <li className="flex items-start gap-1.5">
                    <span className="w-4 h-4 bg-indigo-50 text-indigo-650 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold">1</span>
                    <span>เปิดโฟลเดอร์ปลายทางที่เก็บไฟล์ (โฟลเดอร์ <b>Downloads / รายการดาวน์โหลด</b> ในเครื่องคอมพิวเตอร์)</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="w-4 h-4 bg-indigo-50 text-indigo-650 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold">2</span>
                    <span><b>ดับเบิลคลิก (Double-click)</b> ที่ตัวไฟล์ <code>{item.name}</code> ได้โดยตรง</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="w-4 h-4 bg-indigo-50 text-indigo-650 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold">3</span>
                    <span>ระบบจะดึงเรียกแอปที่ผูกไว้ในเครื่องหลักของคุณ (เช่น Microsoft Word / Excel หรือ Adobe Reader) โชว์ที่หน้าจอหลักอัตโนมัติ!</span>
                  </li>
                </ol>
              </div>

              {/* Instructions Column 2: Mobile Devices */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">📱</span>
                  <h4 className="text-xs font-bold text-slate-800">วิธีการเปิดสำหรับมือถือ (Android / iOS)</h4>
                </div>
                <ol className="space-y-3 text-[10px] text-slate-600 font-semibold leading-relaxed pl-1">
                  <li className="flex items-start gap-1.5">
                    <span className="w-4 h-4 bg-indigo-50 text-indigo-650 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold">1</span>
                    <span>มองหน้าต่างแจ้งเตือน <b>"ดาวน์โหลดไฟล์เสร็จสมบูรณ์"</b> บนขอบหน้าจอมือถือของคุณ</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="w-4 h-4 bg-indigo-50 text-indigo-650 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold">2</span>
                    <span><b>แตะ (Tap) ที่แจ้งเตือน</b> เพื่อเข้าถึงการเปิดไฟล์ ระบบมือถือจะป๊อปอัปให้ท่านกดเพื่อนำผลเข้าสู่แอปพลิเคชันอย่าง WPS Office หรือ Google Docs</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="w-4 h-4 bg-indigo-50 text-indigo-650 rounded-full flex items-center justify-center text-[9px] shrink-0 font-bold">3</span>
                    <span>หากไม่พบ ให้เปิดแอป <b>"Files / แฟ้มส่วนตัว"</b> ในเครื่องโทรศัพท์ เพื่อกดดับเบิลรวบไฟล์ที่เพิ่งโหลดได้ทันที</span>
                  </li>
                </ol>
              </div>
            </div>

            {/* Smart Protocol Launch Option (e.g. for Office documents docx, xlsx) */}
            {localAppsInfo.officeProto && (
              <div className="p-4 bg-indigo-50/55 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-xs">
                    🚀
                  </div>
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>เรียกใช้งานโปรโตคอลสยบเว็บบล็อก (Office App Launch Code)</span>
                    </h5>
                    <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                      ทดลองส่งให้ระบบ OS ของคุณเรียกเปิด {localAppsInfo.category} โดยตรงจาก Link สตรีมคลาวด์ไดเร็กต์
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLaunchProtocol}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer select-none"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>สั่งเปิด {localAppsInfo.category.split(' ')[0]}</span>
                </button>
              </div>
            )}

            {/* Control Actions footer within the assistant view */}
            <div className="flex justify-between items-center mt-2">
              <button
                onClick={() => setShowHandoff(false)}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ← ย้อนกลับไปเลือกตัวเลือกการเปิด
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => onSelectLocal(item)}
                  className="p-2 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-500 cursor-pointer flex items-center gap-1 text-[10px] font-semibold"
                  title="ดาวน์โหลดไฟล์ซ้ำอีกรอบ"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลดไฟล์ซ้ำ</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-[10px] cursor-pointer"
                >
                  เข้าใจแล้ว
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


