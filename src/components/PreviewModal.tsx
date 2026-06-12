/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Download, FileText, Check, AlertCircle } from 'lucide-react';
import { DBItem } from '../types';

interface PreviewModalProps {
  item: DBItem | null;
  onClose: () => void;
  onSaveContent: (id: string, updatedContent: string) => Promise<void>;
  onDownload: (item: DBItem) => void;
}

export default function PreviewModal({
  item,
  onClose,
  onSaveContent,
  onDownload,
}: PreviewModalProps) {
  const [editText, setEditText] = useState('');
  const [isEditable, setIsEditable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!item) return;

    // Reset editor state
    setSaveSuccess(false);
    
    // Check if the file is editable text
    const mime = item.type.toLowerCase();
    const isText = mime.startsWith('text/') || 
                   mime.includes('json') || 
                   mime.includes('javascript') || 
                   mime.includes('xml') || 
                   mime.includes('markdown');

    setIsEditable(isText);
    setEditText(item.content || '');
  }, [item]);

  if (!item) return null;

  const mime = item.type.toLowerCase();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveContent(item.id, editText);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      {/* Container main modal card */}
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header toolbar */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 text-sm truncate max-w-sm sm:max-w-md">{item.name}</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                หมวดหมู่: {item.type} • ขนาด: {formatSize(item.size)} • อัปเดตเมื่อ: {formatDate(item.updatedAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!item.isFolder && (
              <button
                id="btn-preview-download"
                onClick={() => onDownload(item)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                title="ดาวน์โหลดไฟล์เครื่อง"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ดาวน์โหลด</span>
              </button>
            )}
            <button
              id="btn-preview-close"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic preview stage */}
        <div className="flex-1 overflow-auto p-6 bg-slate-100/50 flex flex-col items-center justify-center min-h-[300px]">
          {/* 1. Editable Text document handler */}
          {isEditable ? (
            <div className="w-full h-full flex flex-col gap-3">
              <div className="flex justify-between items-center sm:-mt-1 select-none">
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50/50 px-2.5 py-1 rounded-md">
                  💡 คุณสามารถเพิ่ม/แก้ไขเนื้อหาเอกสารไฟล์นี้ และกดยืนยันเพื่อบันทึกไฟล์ได้ทันที !
                </span>
                
                {saveSuccess && (
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>บันทึกข้อมูลสำเร็จ !</span>
                  </span>
                )}
              </div>
              <textarea
                id="preview-text-editor"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="พิมพ์ข้อความของคุณที่นี่..."
                className="w-full flex-1 p-5 border border-slate-200 focus:border-indigo-500 rounded-2xl text-slate-700 text-xs font-mono bg-white outline-none leading-relaxed resize-none shadow-inner min-h-[280px]"
              />
              <div className="flex justify-end select-none">
                <button
                  id="btn-preview-save"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-md shadow-indigo-100"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
                </button>
              </div>
            </div>
          ) : /* 2. Image loader stage */
          mime.startsWith('image/') ? (
            <div className="max-w-full max-h-[50vh] flex items-center justify-center p-2">
              <img
                src={item.content}
                alt={item.name}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[50vh] object-contain rounded-xl shadow-md border border-slate-200 bg-white"
              />
            </div>
          ) : /* 3. Audio player stage */
          mime.startsWith('audio/') ? (
            <div className="w-full max-w-md bg-white border border-slate-100 p-6 rounded-2xl shadow-md flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 shadow-inner">
                <FileText className="w-8 h-8 animate-pulse" />
              </div>
              <div className="text-center">
                <h4 className="font-bold text-slate-800 text-xs truncate max-w-[280px]">{item.name}</h4>
                <p className="text-[10px] text-slate-400 tracking-wider uppercase mt-1 font-mono">Audio Track</p>
              </div>
              <audio 
                controls 
                src={item.content} 
                className="w-full mt-2" 
                controlsList="nodownload" 
              />
            </div>
          ) : /* 4. Video player stage */
          mime.startsWith('video/') ? (
            <div className="w-full max-w-2xl bg-black rounded-xl overflow-hidden aspect-video shadow-lg">
              <video 
                controls 
                src={item.content} 
                className="w-full h-full"
              />
            </div>
          ) : (
            /* 5. Unsupported download action fallback */
            <div className="text-center p-8 bg-white border border-slate-100 rounded-2xl max-w-sm flex flex-col items-center">
              <div className="w-12 h-12 bg-amber-50 border border-amber-100 text-amber-500 rounded-xl flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-slate-800 font-bold text-xs mb-1">ไม่สามารถดูพรีวิวประเภทไฟล์นี้ได้</h4>
              <p className="text-slate-400 text-[11px] mb-4 leading-relaxed">
                เนื่องจากระบบในเบราว์เซอร์ไม่รองรับเครื่องมืออ่านรหัสชนิดไฟล์ <b>{item.type}</b> ชิ้นนี้โดยตรง
              </p>
              <button
                id="btn-preview-unsupported-download"
                onClick={() => onDownload(item)}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดไปเปิดนอกตัวเครื่อง</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
