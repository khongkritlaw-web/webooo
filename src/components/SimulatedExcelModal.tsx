/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Grid, Check, Loader2, Play, Laptop } from 'lucide-react';
import { DBItem } from '../types';

interface SimulatedExcelModalProps {
  item: DBItem;
  onClose: () => void;
  onSaveContent: (id: string, content: string) => Promise<void>;
  onOpenHandoff?: (item: DBItem) => void;
}

export default function SimulatedExcelModal({
  item,
  onClose,
  onSaveContent,
  onOpenHandoff,
}: SimulatedExcelModalProps) {
  const [gridData, setGridData] = useState<string[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>({ r: 0, c: 0 });
  const [editorValue, setEditorValue] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const ROW_COUNT = 30;

  // Initialize spreadsheet grid
  useEffect(() => {
    // Basic CSV parser
    const baseGrid = Array.from({ length: ROW_COUNT }, () => Array(COLS.length).fill(''));
    
    if (item.content) {
      const rows = item.content.split('\n');
      rows.forEach((rowStr, rIdx) => {
        if (rIdx >= ROW_COUNT) return;
        // Split by comma or semicolon or tab
        const cells = rowStr.split(/[,;\t]/);
        cells.forEach((cellVal, cIdx) => {
          if (cIdx >= COLS.length) return;
          baseGrid[rIdx][cIdx] = cellVal.replace(/^"|"$/g, '').trim();
        });
      });
    } else {
      // Seed mock values if empty to make it look like a real corporate template!
      baseGrid[0][0] = 'ลำดับ';
      baseGrid[0][1] = 'รายการสินค้า / บริการ';
      baseGrid[0][2] = 'จำนวน';
      baseGrid[0][3] = 'ราคาต่อหน่วย';
      baseGrid[0][4] = 'ราคารวม (สูตร)';

      baseGrid[1][0] = '1';
      baseGrid[1][1] = 'เช่าระบบคลาวด์ไทยเกรดพรีเมียม';
      baseGrid[1][2] = '2';
      baseGrid[1][3] = '4500';
      baseGrid[1][4] = '9000';

      baseGrid[2][0] = '2';
      baseGrid[2][1] = 'พัฒนาระบบซอฟต์แวร์ Cloud OS';
      baseGrid[2][2] = '1';
      baseGrid[2][3] = '15000';
      baseGrid[2][4] = '15000';

      baseGrid[3][0] = 'รวม';
      baseGrid[3][4] = '24000';
    }

    setGridData(baseGrid);
    if (baseGrid[0][0] !== undefined) {
      setSelectedCell({ r: 0, c: 0 });
      setEditorValue(baseGrid[0][0]);
    }
  }, [item]);

  // Sync cell clicked selection value to Formula Bar
  const handleCellClick = (r: number, c: number) => {
    setSelectedCell({ r, c });
    setEditorValue(gridData[r]?.[c] || '');
  };

  // Handle value change inside cell
  const handleCellChange = (r: number, c: number, val: string) => {
    const updated = [...gridData];
    updated[r] = [...updated[r]];
    updated[r][c] = val;
    setGridData(updated);
  };

  const handleEditorChange = (val: string) => {
    setEditorValue(val);
    if (selectedCell) {
      handleCellChange(selectedCell.r, selectedCell.c, val);
    }
  };

  // Parse Excel to CSV style and Save
  const handleSaveWorkspace = async () => {
    setIsSaving(true);
    try {
      // Find last non-empty row to avoid massive white-space outputs
      let lastActiveRow = 0;
      gridData.forEach((row, ri) => {
        const hasData = row.some(cell => cell && cell.trim() !== '');
        if (hasData) lastActiveRow = ri;
      });

      const activeRows = gridData.slice(0, lastActiveRow + 1);
      const csvStr = activeRows.map(row => row.join(',')).join('\n');
      
      await onSaveContent(item.id, csvStr);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed saving Sheet content:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Simulated Sheet Formula Solver
  const runAutoSum = () => {
    if (!selectedCell) return;
    const { r, c } = selectedCell;
    
    // Look up previous cells in column
    let sum = 0;
    for (let i = 0; i < r; i++) {
      const val = parseFloat(gridData[i][c]);
      if (!isNaN(val)) sum += val;
    }

    if (sum > 0) {
      handleCellChange(r, c, sum.toString());
      setEditorValue(sum.toString());
    } else {
      handleCellChange(r, c, '=SUM(C2:D4)');
      setEditorValue('=SUM(C2:D4)');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col z-50 animate-in fade-in duration-200">
      
      {/* 1. Office Online Excel Header */}
      <div className="bg-[#107c41] text-white px-5 py-3 flex items-center justify-between shadow-md select-none shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <Grid className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide">Excel</span>
              <span className="text-[10px] bg-emerald-400/30 text-emerald-100 font-bold px-1.5 py-0.5 rounded leading-none">
                Online Simulator
              </span>
            </div>
            <h4 className="text-xs font-semibold text-emerald-100 mt-0.5 flex items-center gap-1.5">
              <span>{item.name}</span>
              <span className="text-[10px] opacity-60">• ระบบจัดเก็บข้อมูลกริดอัจฉริยะ</span>
            </h4>
          </div>
        </div>

        {/* Action controllers */}
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-medium text-emerald-100 bg-emerald-800/40 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
              <Check className="w-3.5 h-3.5" />
              <span>บันทึกตารางคำนวณเรียบร้อย</span>
            </span>
          )}
          
          <button
            id="excel-save-btn"
            onClick={handleSaveWorkspace}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#0b5c30] hover:bg-[#084423] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all disabled:opacity-60 font-sans"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'กำลังเก็บข้อมูล...' : 'บันทึกงานสเปรดชีต'}</span>
          </button>

          {onOpenHandoff && (
            <button
              id="excel-handoff-btn"
              onClick={() => {
                onClose();
                onOpenHandoff(item);
              }}
              className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-all font-sans"
              title="เปิดดูคู่มือวิธีเข้าเปิดทำงานบนโปรแกรม Microsoft Excel บนคอมพิวเตอร์ของคุณ"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>เปิดด้วยแอปในเครื่อง</span>
            </button>
          )}

          <button
            id="excel-close-btn"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
            title="ปิดโปรแกรม Excel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Ribbon menus Tabs */}
      <div className="bg-slate-50 border-b border-slate-200 select-none shrink-0 text-xs">
        <div className="flex px-4 border-b border-slate-100 text-slate-500 font-semibold gap-4 bg-white">
          <span className="px-3 py-2 border-b-2 border-[#107c41] text-[#107c41] cursor-pointer">หน้าแรก (Home)</span>
          <span className="px-3 py-2 hover:text-slate-800 cursor-pointer">แทรก (Insert)</span>
          <span className="px-3 py-2 hover:text-slate-800 cursor-pointer">สูตรคำนวณ (Formulas)</span>
          <span className="px-3 py-2 hover:text-slate-800 cursor-pointer">ข้อมูล (Data)</span>
        </div>

        {/* Toolbar formulas quick helpers */}
        <div className="px-6 py-2 bg-slate-50 border-b border-slate-150 flex items-center gap-4 overflow-x-auto">
          {/* Quick Calc Tool */}
          <button
            id="excel-calc-sum"
            onClick={runAutoSum}
            className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-100 text-emerald-800 border border-slate-200 rounded-lg font-bold text-[11px] cursor-pointer shadow-xs transition-colors"
            title="รวมค่าตัวเลขด้านบน คอลัมน์โดยอัตโนมัติ"
          >
            <span className="font-serif">∑</span>
            <span>หาผลรวมคอลัมน์ (AutoSum)</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-200" />
          
          <button 
            onClick={() => handleEditorChange('')}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[10px] font-semibold"
          >
            ล้างข้อมูลในเซลล์ (Clear Cell)
          </button>

          <span className="text-[10px] text-slate-400 font-medium">คำแนะนำ: ดับเบิ้ลคลิกกระดาษตารางพรีวิว หรือแก้ไขได้ทันที</span>
        </div>

        {/* 3. Formula Input line fx */}
        <div className="px-3 py-1.5 bg-slate-100 flex items-center gap-2 border-b border-slate-200 font-mono">
          <span className="text-[11px] font-bold text-slate-400 bg-white border border-slate-200 px-2.5 py-0.5 rounded shadow-inner min-w-[36px] text-center select-none">
            {selectedCell ? `${COLS[selectedCell.c]}${selectedCell.r + 1}` : 'A1'}
          </span>
          <span className="text-slate-400 font-bold italic select-none">fx</span>
          <input
            id="excel-formula-bar"
            type="text"
            value={editorValue}
            placeholder="ใส่สูตรคำนวณ หรือป้อนข้อความดิบ..."
            onChange={(e) => handleEditorChange(e.target.value)}
            className="flex-1 px-3 py-1 bg-white border border-slate-200 focus:border-[#107c41] rounded-md outline-hidden text-[11px] font-semibold text-slate-700"
          />
        </div>
      </div>

      {/* 4. Grid table */}
      <div className="flex-1 bg-slate-250 overflow-auto p-4">
        <div className="bg-white border border-slate-350 shadow-md inline-block max-w-full font-mono text-xs select-none">
          <table className="border-collapse table-fixed w-full">
            <thead>
              <tr className="bg-slate-100 text-slate-600">
                {/* Index Top Corner */}
                <th className="w-12 border border-slate-300 text-center py-1 font-sans text-[10px] font-bold text-slate-400 shrink-0">
                  #
                </th>
                {COLS.map((col, idx) => (
                  <th key={col} className="w-40 border border-slate-300 text-center py-1 font-medium font-sans">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridData.map((row, ri) => (
                <tr key={ri} className="hover:bg-slate-50/50">
                  {/* Row Indicator column */}
                  <td className="bg-slate-100 border border-slate-300 text-center py-1 text-[10px] text-slate-400 font-bold font-sans">
                    {ri + 1}
                  </td>
                  
                  {row.map((cellValue, ci) => {
                    const isSelected = selectedCell?.r === ri && selectedCell?.c === ci;
                    
                    return (
                      <td
                        key={`${ri}-${ci}`}
                        onClick={() => handleCellClick(ri, ci)}
                        className={`border border-slate-200 px-2 py-1.5 relative select-text truncate text-slate-700 font-medium ${
                          isSelected ? 'bg-emerald-50/40 ring-2 ring-emerald-600 border-transparent z-10' : 'bg-white'
                        }`}
                        style={{ minWidth: '160px', height: '28px' }}
                      >
                        <input
                          type="text"
                          value={cellValue}
                          onChange={(e) => handleCellChange(ri, ci, e.target.value)}
                          className="w-full h-full bg-transparent outline-none focus:outline-none focus:ring-0 border-0 p-0 text-[11px] font-semibold truncate"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Sheet selection footer */}
      <div className="bg-slate-100 border-t border-slate-250 px-6 py-2 flex justify-between items-center text-[10px] select-none text-slate-500 shrink-0 font-medium">
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-0.5 overflow-hidden shadow-xs">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-md cursor-pointer border border-emerald-100">
            Sheet1
          </span>
          <span className="px-3 py-1 text-slate-400 hover:text-slate-800 font-bold rounded-md cursor-pointer flex items-center">
            +
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span>พร้อมใช้งานตารางสถิติจำลองการเปิดคอมพิวเตอร์อย่างเป็นทางการ</span>
        </div>
      </div>

    </div>
  );
}
