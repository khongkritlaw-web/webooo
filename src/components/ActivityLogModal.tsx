/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { X, History, Trash2, CheckCircle, RefreshCcw, FileText, FolderPlus, HelpCircle } from 'lucide-react';
import { ActivityLog } from '../types';
import { getActivityLogs, clearAllActivityLogs } from '../db';

interface ActivityLogModalProps {
  onClose: () => void;
}

export default function ActivityLogModal({ onClose }: ActivityLogModalProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  useEffect(() => {
    getActivityLogs().then(loadedLogs => {
      setLogs(loadedLogs);
    });
  }, [lastUpdated]);

  const handleClearLogs = async () => {
    if (confirm('คุณต้องการลบประวัติกิจกรรมทั้งหมดในคลาวด์ไดรฟ์นี้ใช่หรือไม่? (การกระทำนี้ไม่สามารถย้อนคืนได้)')) {
      await clearAllActivityLogs();
      setLastUpdated(Date.now());
    }
  };

  const getActionDetails = (log: ActivityLog) => {
    const timeStr = new Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = new Date(log.timestamp).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    
    let icon = <CheckCircle className="w-4 h-4 text-emerald-500" />;
    let text = '';

    switch (log.action) {
      case 'create_folder':
        icon = <FolderPlus className="w-4 h-4 text-indigo-500" />;
        text = `สร้างโฟลเดอร์ใหม่ "${log.itemName}"`;
        break;
      case 'upload_file':
        icon = <FileText className="w-4 h-4 text-emerald-500" />;
        text = `ได้ทำการอัปโหลดไฟล์ "${log.itemName}"`;
        break;
      case 'delete_item':
        icon = <Trash2 className="w-4 h-4 text-rose-500" />;
        text = `ย้าย "${log.itemName}" ลงถังขยะ`;
        break;
      case 'rename_item':
        icon = <RefreshCcw className="w-4 h-4 text-blue-500 animate-spin" style={{ animationDuration: '3s' }} />;
        text = `เปลี่ยนรายละเอียดชื่อเป็น "${log.itemName}"`;
        break;
      case 'move_item':
        icon = <RefreshCcw className="w-4 h-4 text-yellow-500" />;
        text = `ย้ายโฟลเดอร์/คัดเลือกปลายทางใหม่ให้ "${log.itemName}"`;
        break;
      case 'update_file':
        icon = <FileText className="w-4 h-4 text-violet-500" fill="rgba(139, 92, 246, 0.1)" />;
        text = `บันทึกการแก้ไขข้อมูลไฟล์เรียบร้อย: "${log.itemName}"`;
        break;
      case 'restore_item':
        icon = <CheckCircle className="w-4 h-4 text-teal-500" />;
        text = `กู้คืน "${log.itemName}" ออกจากถังขยะเรียบร้อย`;
        break;
    }

    return { icon, text, date: `${dateStr} ${timeStr}` };
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[80vh]">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-sm">ประวัติการทำงานและกิจกรรมล่าสุด</h3>
          </div>
          <button
            id="btn-log-close"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list timeline */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="flex justify-between items-center mb-2 select-none">
            <span className="text-[11px] font-semibold text-slate-400">
              จดบันทึกประวัติการกระทำของคุณทั้งหมดบนบราวเซอร์:
            </span>
            {logs.length > 0 && (
              <button
                id="btn-log-clear"
                onClick={handleClearLogs}
                className="text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer"
              >
                ลบประวัติทั้งหมด
              </button>
            )}
          </div>

          <div className="space-y-4 mt-2">
            {logs.map((log) => {
              const details = getActionDetails(log);
              return (
                <div key={log.id} className="flex gap-3 text-xs leading-normal items-start">
                  <div className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg shrink-0 mt-0.5">
                    {details.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 font-semibold">{details.text}</p>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{details.date}</span>
                  </div>
                </div>
              );
            })}

            {logs.length === 0 && (
              <div className="text-center py-12 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 border border-dotted border-slate-200 mb-2">
                  <History className="w-5 h-5" />
                </div>
                <p className="text-slate-400 text-xs">ยังไม่มีประวัติกิจกรรมใดๆ บนคลาวด์ไดรฟ์ขณะนี้</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-end select-none shrink-0">
          <button
            id="btn-log-done"
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            เสร็จสิ้น
          </button>
        </div>

      </div>
    </div>
  );
}
