/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, FileText, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Check, RefreshCw, Laptop } from 'lucide-react';
import { DBItem } from '../types';

interface SimulatedWordModalProps {
  item: DBItem;
  onClose: () => void;
  onSaveContent: (id: string, content: string) => Promise<void>;
  onOpenHandoff?: (item: DBItem) => void;
}

export default function SimulatedWordModal({
  item,
  onClose,
  onSaveContent,
  onOpenHandoff,
}: SimulatedWordModalProps) {
  const [docText, setDocText] = useState('');
  const [currFont, setCurrFont] = useState('Inter');
  const [currSize, setCurrSize] = useState('14px');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left');
  
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDocText(item.content || '');
  }, [item]);

  const wordCount = docText ? docText.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = docText.length;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveContent(item.id, docText);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error('Word Simulator Save Fail:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col z-50 animate-in fade-in duration-200">
      
      {/* 1. Word Online Header bar */}
      <div className="bg-[#185abd] text-white px-5 py-3 flex items-center justify-between shadow-md select-none shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide">Word</span>
              <span className="text-[10px] bg-sky-400/30 text-sky-100 font-bold px-1.5 py-0.5 rounded leading-none">
                Online Simulator
              </span>
            </div>
            <h4 className="text-xs font-semibold text-sky-100 mt-0.5 flex items-center gap-1.5">
              <span>{item.name}</span>
              <span className="text-[10px] opacity-60">• บันทึกอัตโนมัติไปยังระบบคลาวด์</span>
            </h4>
          </div>
        </div>

        {/* Word Online Actions */}
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs font-medium text-emerald-100 bg-emerald-700/40 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
              <Check className="w-3.5 h-3.5" />
              <span>อัปเดตไฟล์สำมะโนครัวเรียบร้อย</span>
            </span>
          )}
          <button
            id="word-save-btn"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#124a9c] hover:bg-[#0c397c] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all disabled:opacity-60 font-sans"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'กำลังอัปโหลด...' : 'บันทึกงาน'}</span>
          </button>

          {onOpenHandoff && (
            <button
              id="word-handoff-btn"
              onClick={() => {
                onClose();
                onOpenHandoff(item);
              }}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all font-sans"
              title="เปิดดูคู่มือวิธีเข้าเปิดทำงานบนโปรแกรม Microsoft Word บนคอมพิวเตอร์ของคุณ"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>เปิดด้วยแอปในเครื่อง</span>
            </button>
          )}
          
          <button
            id="word-close-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
            title="ปิดโปรแกรม"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Ribbon controls and menus */}
      <div className="bg-slate-50 border-b border-slate-200 select-none shrink-0 text-xs">
        {/* Tab category indicator */}
        <div className="flex px-4 border-b border-slate-100 text-slate-500 font-semibold gap-4 bg-white">
          <span className="px-3 py-2 border-b-2 border-[#185abd] text-[#185abd] cursor-pointer">หน้าแรก (Home)</span>
          <span className="px-3 py-2 hover:text-slate-800 cursor-pointer">แทรก (Insert)</span>
          <span className="px-3 py-2 hover:text-slate-800 cursor-pointer">เค้าโครง (Layout)</span>
          <span className="px-3 py-2 hover:text-slate-800 cursor-pointer">มุมมอง (View)</span>
        </div>

        {/* Home Toolbar Tools */}
        <div className="px-6 py-2.5 flex items-center gap-6 overflow-x-auto bg-slate-50">
          
          {/* Font Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
            <select
              value={currFont}
              onChange={(e) => setCurrFont(e.target.value)}
              className="px-2 py-0.5 font-bold text-slate-700 bg-transparent text-[11px] outline-none cursor-pointer"
            >
              <font value="Inter">Inter (Sans-serif)</font>
              <option value="Sarabun">Sarabun (ไทยนอร์มอล)</option>
              <option value="Courier New">Courier New (โมโนสเปซ)</option>
              <option value="Georgia">Georgia (เซอริฟทางการ)</option>
              <option value="Comic Sans MS">Comic Sans (สไตล์น่ารัก)</option>
            </select>

            <select
              value={currSize}
              onChange={(e) => setCurrSize(e.target.value)}
              className="px-2 py-0.5 border-l border-slate-150 font-semibold text-slate-600 bg-transparent text-[11px] outline-none cursor-pointer"
            >
              <option value="12px">12 pt</option>
              <option value="14px">14 pt</option>
              <option value="16px">16 pt</option>
              <option value="18px">18 pt</option>
              <option value="24px">24 pt</option>
              <option value="32px">32 pt</option>
            </select>
          </div>

          <div className="h-6 w-[1px] bg-slate-250 shrink-0" />

          {/* Formatter Styles */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsBold(!isBold)}
              className={`p-1.5 rounded-lg border font-black transition-all ${
                isBold ? 'bg-[#e2ebf8] text-[#185abd] border-sky-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="ตัวหนา"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsItalic(!isItalic)}
              className={`p-1.5 rounded-lg border font-black transition-all ${
                isItalic ? 'bg-[#e2ebf8] text-[#185abd] border-sky-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="ตัวเอียง"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsUnderline(!isUnderline)}
              className={`p-1.5 rounded-lg border font-black transition-all ${
                isUnderline ? 'bg-[#e2ebf8] text-[#185abd] border-sky-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="ขีดเส้นใต้"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-6 w-[1px] bg-slate-250 shrink-0" />

          {/* Alignment Tools */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setAlignment('left')}
              className={`p-1.5 rounded-md transition-colors ${
                alignment === 'left' ? 'bg-[#e2ebf8] text-[#185abd]' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setAlignment('center')}
              className={`p-1.5 rounded-md transition-colors ${
                alignment === 'center' ? 'bg-[#e2ebf8] text-[#185abd]' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setAlignment('right')}
              className={`p-1.5 rounded-md transition-colors ${
                alignment === 'right' ? 'bg-[#e2ebf8] text-[#185abd]' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-6 w-[1px] bg-slate-250 shrink-0 hidden sm:block" />

          {/* Quick tips label helper */}
          <div className="hidden sm:flex flex-col text-[10px] text-slate-400 font-medium select-none">
            <span>ตัวประมวลผลคำกระดาษเสมือนจริง:</span>
            <span className="font-semibold text-[#185abd]">เข้ากันได้กับโปรแกรม MS Word ในเครื่องของคุณ 100%</span>
          </div>

        </div>
      </div>

      {/* 3. Document Workspace Screen */}
      <div className="flex-1 bg-slate-200/60 p-8 overflow-y-auto flex justify-center">
        {/* Printable styled workspace paper block */}
        <div className="bg-white min-h-[1056px] w-[816px] p-[96px] shadow-xl border border-slate-300 rounded-sm flex flex-col relative transition-all duration-300">
          
          <textarea
            id="word-textarea-workspace"
            value={docText}
            onChange={(e) => setDocText(e.target.value)}
            placeholder="เริ่มเขียนเอกสาร Word ออนไลน์ของคุณที่นี่..."
            style={{
              fontFamily: currFont === 'Sarabun' ? '"Sarabun", sans-serif' : currFont,
              fontSize: currSize,
              textAlign: alignment,
              fontWeight: isBold ? 'bold' : 'normal',
              fontStyle: isItalic ? 'italic' : 'normal',
              textDecoration: isUnderline ? 'underline' : 'none',
              lineHeight: '1.6',
            }}
            className="w-full flex-1 outline-none text-slate-800 bg-transparent resize-none leading-relaxed"
          />

          <span className="absolute bottom-4 right-6 text-[10px] text-slate-300 font-mono select-none">
            กระดาษจำลองขนาด Letter
          </span>
        </div>
      </div>

      {/* 4. Footer status indicator */}
      <div className="bg-slate-100 border-t border-slate-200 px-6 py-1.5 flex justify-between items-center text-[10px] select-none text-slate-500 shrink-0 font-medium">
        <div className="flex gap-4">
          <span>หน้า 1 จาก 1</span>
          <span>{wordCount} คำ</span>
          <span>{charCount} อักขระ</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
          <span>เชื่อมต่อเซิร์ฟเวอร์ Word Online (คลาวด์ไดรฟ์ไทย) สำเร็จ</span>
        </div>
      </div>

    </div>
  );
}
