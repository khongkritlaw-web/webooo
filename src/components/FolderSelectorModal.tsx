/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Folder, HelpCircle, HardDrive } from 'lucide-react';
import { DBItem } from '../types';

interface FolderSelectorModalProps {
  itemToMove: DBItem | null;
  allFolders: DBItem[];
  onClose: () => void;
  onConfirmMove: (itemId: string, destinationFolderId: string | null) => Promise<void>;
}

export default function FolderSelectorModal({
  itemToMove,
  allFolders,
  onClose,
  onConfirmMove,
}: FolderSelectorModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!itemToMove) return null;

  // Filter out the folder itself and any recursive paths that live inside it if the item to move is a folder!
  // To avoid circular loops (moving a folder inside itself or its children).
  const isDescendant = (folder: DBItem, parentToFindId: string): boolean => {
    let curr = folder;
    while (curr.parentId) {
      if (curr.parentId === parentToFindId) return true;
      const nextParent = allFolders.find(f => f.id === curr.parentId);
      if (!nextParent) break;
      curr = nextParent;
    }
    return false;
  };

  const eligibleFolders = allFolders.filter(folder => {
    // Cannot move into itself
    if (folder.id === itemToMove.id) return false;
    // Cannot move a folder into its own children descendants
    if (itemToMove.isFolder && isDescendant(folder, itemToMove.id)) return false;
    // Must not be in trash
    if (folder.isTrashed) return false;
    return true;
  });

  const handleMove = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmMove(itemToMove.id, selectedFolderId);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <Folder className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-sm">ย้ายตำแหน่งโฟลเดอร์/ไฟล์</h3>
          </div>
          <button
            id="btn-move-close"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 flex-1 max-h-[40vh] overflow-y-auto space-y-3">
          <span className="text-[11px] font-semibold text-slate-400 select-none">
            กรุณาเลือกตำแหน่งปลายทางเพื่อเซฟผลย้ายไฟล์ชื่อ <b>{itemToMove.name}</b> :
          </span>

          <div className="space-y-1.5 mt-2">
            {/* Folder Root Option */}
            <button
              id="btn-dest-root"
              onClick={() => setSelectedFolderId(null)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all text-xs font-semibold ${
                selectedFolderId === null
                  ? 'border-indigo-500 bg-indigo-50/40 text-indigo-700 font-bold'
                  : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 text-slate-700'
              }`}
            >
              <HardDrive className="w-4 h-4 text-indigo-600" />
              <div className="flex-1 min-w-0">
                <p className="truncate">หน้าหลัก / Root</p>
                <p className="text-[10px] text-slate-400 font-normal">แร็คจัดเก็บชั้นนอกสุดของไดรฟ์</p>
              </div>
            </button>

            {/* Other directories */}
            {eligibleFolders.map((folder) => (
              <button
                id={`btn-dest-folder-${folder.id}`}
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all text-xs font-semibold ${
                  selectedFolderId === folder.id
                    ? 'border-indigo-500 bg-indigo-50/40 text-indigo-700 font-bold'
                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Folder className="w-4 h-4 text-amber-500 fill-amber-50" />
                <div className="flex-1 min-w-0">
                  <p className="truncate">{folder.name}</p>
                  <p className="text-[10px] text-slate-400 font-normal">โฟลเดอร์รหัส: {folder.id}</p>
                </div>
              </button>
            ))}
          </div>

          {eligibleFolders.length === 0 && selectedFolderId !== null && (
            <p className="text-[10px] text-slate-400 text-center select-none pt-2">
              ไม่มีโฟลเดอร์อื่นว่างที่เหมาะสมสำหรับย้ายเข้าไปจัดวาง
            </p>
          )}
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-2.5 select-none shrink-0">
          <button
            id="btn-move-cancel"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-500 hover:text-slate-700 bg-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            ยกเลิก
          </button>
          <button
            id="btn-move-confirm"
            onClick={handleMove}
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            {isSubmitting ? 'กำลังจัดเก็บ...' : 'ยืนยันการเปลี่ยนตำแหน่ง'}
          </button>
        </div>

      </div>
    </div>
  );
}
