/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { createServer as createViteServer } from "vite";

interface ServerDBItem {
  id: string;
  name: string;
  isFolder: boolean;
  parentId: string | null;
  size: number;
  type: string;
  content?: string; // Content can be raw text or Base64 (for images/multimedia)
  createdAt: number;
  updatedAt: number;
  tag?: string;
  isTrashed: boolean;
  trashDate?: number;
}

interface ServerActivityLog {
  id: string;
  action: string;
  itemName: string;
  itemType: string;
  timestamp: number;
}

const PORT = 3000;
const STORAGE_DIR = path.join(process.cwd(), "storage");
const DB_METADATA_PATH = path.join(STORAGE_DIR, "db-metadata.json");
const ACTIVITY_LOGS_PATH = path.join(STORAGE_DIR, "activity-logs.json");

// Ensure storage folders exist
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Seed helper (only if DB doesn't exist)
function seedDatabase() {
  const now = Date.now();
  const folderDocId = 'f1_docs';
  const folderImagesId = 'f2_images';
  const folderDevId = 'f3_dev';

  const readmeContent = `# ยินดีต้อนรับสู่ระบบ Cloud File Manager! 🚀

นี่คือระบบบริการจัดการไฟล์และพื้นที่จัดเก็บข้อมูลแบบออนไลน์ส่วนตัวของคุณ

### คุณสมบัติที่โดดเด่น:
- **สร้างและจัดโครงสร้างโฟลเดอร์**: จัดการเป็นลำดับชั้นได้อย่างเสรี ซ้อนโฟลเดอร์ได้หลายชั้น
- **ลากและวางอัปโหลดไฟล์ (Drag & Drop)**: รวดเร็ว สะดวกสบาย รองรับเกือบทุกประเภทไฟล์
- **โปรแกรมแก้ไขเอกสารออนไลน์ (Online Text Editor)**: คุณสามารถแก้ไขไฟล์ข้อความ (.txt, .md, .json) และทำการกด 'บันทึก' เพื่ออัปเดตข้อมูลบนคลาวด์ของคุณได้ทันที!
- **ระบบถังขยะรักษาความปลอดภัย (Trash Bucket)**: ป้องกันอุบัติเหตุลบไฟล์สำคัญ โดยมีระยะพักก่อนลบถาวร
- **การติดป้ายกำกับ (Tags)**: เช่น งานส่วนตัว, เอกสารสำคัญ เป็นต้น เพื่อคัดกรองอย่างระเบียบ
- **ระบบพรีวิวครบวงจร**: ดูรูปภาพ, เอกสาร หรือเล่นเพลง/วิดีโอได้จากในเว็บบราวเซอร์โดยตรง

*ทดลองแก้ไขเอกสารไฟล์นี้ และกดยืนยันเซฟได้ทันที!* 🎉
`;

  const todoContent = `- [x] ออกแบบหน้าอินเทอร์เฟซผู้ใช้ (UI) หรูหรา
- [x] เชื่อมต่อระบบ Express backend มั่นคง เข้าถึงจากอุปกรณ์ไหนก็ได้!
- [x] จัดเก็บไฟล์และระบบค้นหาแบบ Full-text 
- [y] ลองอัปโหลดไฟล์ส่วนตัวของคุณดูสิ!
- [ ] ติดสติกเกอร์หน้ากล่องเก็บไฟล์สำหรับแยกประเภทงาน
`;

  // Tiny base64 card image
  const sampleSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%234f46e5"/><stop offset="100%" stop-color="%2306b6d4"/></linearGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/><text x="50%" y="45%" font-family="Helvetica, Arial, sans-serif" font-size="36" fill="white" font-weight="bold" text-anchor="middle">Thai Cloud Drive</text><text x="50%" y="58%" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.8)" text-anchor="middle">ระบบออนไลน์ของจริง เชื่อมต่อหลายอุปกรณ์ได้พร้อมกัน</text></svg>`;

  const initialItems: ServerDBItem[] = [
    {
      id: folderDocId,
      name: 'เอกสารส่วนตัว',
      isFolder: true,
      parentId: null,
      size: 0,
      type: 'directory',
      createdAt: now - 3600000 * 24,
      updatedAt: now - 3600000 * 24,
      tag: 'ส่วนตัว',
      isTrashed: false,
    },
    {
      id: folderImagesId,
      name: 'อัลบั้มรูปภาพ',
      isFolder: true,
      parentId: null,
      size: 0,
      type: 'directory',
      createdAt: now - 3600000 * 12,
      updatedAt: now - 3600000 * 12,
      tag: 'ส่วนตัว',
      isTrashed: false,
    },
    {
      id: folderDevId,
      name: 'งานพัฒนาส่วนกลาง',
      isFolder: true,
      parentId: null,
      size: 0,
      type: 'directory',
      createdAt: now - 3600000 * 48,
      updatedAt: now - 3600000 * 48,
      tag: 'งาน',
      isTrashed: false,
    },
    {
      id: 'file_readme',
      name: 'คู่มือคอมพิวเตอร์.md',
      isFolder: false,
      parentId: folderDocId,
      size: readmeContent.length,
      type: 'text/markdown',
      content: readmeContent,
      createdAt: now - 3600000 * 23,
      updatedAt: now - 3600000 * 23,
      tag: 'สำคัญ',
      isTrashed: false,
    },
    {
      id: 'file_todo',
      name: 'รายการเรียนรู้.txt',
      isFolder: false,
      parentId: folderDocId,
      size: todoContent.length,
      type: 'text/plain',
      content: todoContent,
      createdAt: now - 3600000 * 22,
      updatedAt: now - 3600000 * 12,
      tag: 'งาน',
      isTrashed: false,
    },
    {
      id: 'file_image_welcome',
      name: 'รูปตัวอย่างระบบ.png',
      isFolder: false,
      parentId: folderImagesId,
      size: sampleSVG.length,
      type: 'image/svg+xml',
      content: sampleSVG,
      createdAt: now - 3600000 * 10,
      updatedAt: now - 3600000 * 10,
      tag: 'ทั่วไป',
      isTrashed: false,
    },
    {
      id: 'file_root_note',
      name: 'คลิปบอร์ดคลาวด์.txt',
      isFolder: false,
      parentId: null,
      size: 61,
      type: 'text/plain',
      content: 'ยินดีต้อนรับสู่บริการพื้นที่เก็บไฟล์ออนไลน์ที่มีประสิทธิภาพ!',
      createdAt: now,
      updatedAt: now,
      tag: 'งาน',
      isTrashed: false,
    }
  ];

  fs.writeFileSync(DB_METADATA_PATH, JSON.stringify(initialItems, null, 2), "utf8");
}

if (!fs.existsSync(DB_METADATA_PATH)) {
  seedDatabase();
}

if (!fs.existsSync(ACTIVITY_LOGS_PATH)) {
  fs.writeFileSync(ACTIVITY_LOGS_PATH, JSON.stringify([], null, 2), "utf8");
}

// Low level db read/write helpers
function readItems(): ServerDBItem[] {
  try {
    return JSON.parse(fs.readFileSync(DB_METADATA_PATH, "utf8"));
  } catch (e) {
    return [];
  }
}

function writeItems(items: ServerDBItem[]) {
  fs.writeFileSync(DB_METADATA_PATH, JSON.stringify(items, null, 2), "utf8");
}

function readLogs(): ServerActivityLog[] {
  try {
    return JSON.parse(fs.readFileSync(ACTIVITY_LOGS_PATH, "utf8"));
  } catch (e) {
    return [];
  }
}

function writeLogs(logs: ServerActivityLog[]) {
  fs.writeFileSync(ACTIVITY_LOGS_PATH, JSON.stringify(logs, null, 2), "utf8");
}

// Disk space computation function (real disk space from shell execution with high-quality fallback)
function getDFDiskSpace(): { freeSpace: number; usedSpace: number; totalSpace: number } {
  let freeSpace = 100 * 1024 * 1024 * 1024; // 100 GB default fallback
  let usedSpace = 4.2 * 1024 * 1024 * 1024; // 4.2 GB default fallback
  let totalSpace = 104.2 * 1024 * 1024 * 1024;

  try {
    const rawOut = execSync("df -k .").toString().trim().split("\n");
    if (rawOut.length >= 2) {
      // Find the second row containing stats
      const columns = rawOut[1].split(/\s+/);
      if (columns.length >= 4) {
        const d_total = parseInt(columns[1], 10) * 1024; // KB to Bytes
        const d_used = parseInt(columns[2], 10) * 1024;
        const d_avail = parseInt(columns[3], 10) * 1024;
        
        if (!isNaN(d_total) && !isNaN(d_used) && !isNaN(d_avail)) {
          totalSpace = d_total;
          usedSpace = d_used;
          freeSpace = d_avail;
        }
      }
    }
  } catch (e) {
    // Silent fail, use standard mock-ups
  }

  // Also calculate files upload actual space from db metadata
  const items = readItems();
  const dbActualSize = items.reduce((sum, item) => sum + (item.isFolder ? 0 : item.size), 0);

  // Return realistic cloud quota based on physical drive capacity
  return {
    freeSpace: Math.max(freeSpace - dbActualSize, 1024 * 1024),
    usedSpace: dbActualSize,
    totalSpace: totalSpace,
  };
}

async function startServer() {
  const app = express();

  // Allow larger payload sizes for base64 file payloads (e.g. up to 15MB)
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // API Endpoints
  // Download or stream file content directly
  app.get("/api/download/:id", (req, res) => {
    try {
      const { id } = req.params;
      const items = readItems();
      const item = items.find(x => x.id === id);
      if (!item) {
        res.status(404).send("ไม่พบไฟล์ที่ระบุ");
        return;
      }

      if (item.isFolder) {
        res.status(400).send("โฟลเดอร์ไม่สามารถดาวน์โหลดเป็นไฟล์ตรงๆ ได้");
        return;
      }

      const contentType = item.type || "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(item.name)}`);

      if (item.content) {
        if (item.content.startsWith("data:")) {
          // Data URL base64 handling
          const parts = item.content.split(",");
          if (parts.length > 1) {
            const base64Data = parts[1];
            const buffer = Buffer.from(base64Data, "base64");
            res.send(buffer);
          } else {
            res.send(Buffer.from(item.content));
          }
        } else {
          // Plain raw text or markdown
          res.send(item.content);
        }
      } else {
        res.send(Buffer.alloc(0));
      }
    } catch (e: any) {
      res.status(500).send(e.message);
    }
  });

  // Get all items in the repository
  app.get("/api/items", (req, res) => {
    try {
      const items = readItems();
      res.json(items);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Save/Upload standard item
  app.post("/api/items", (req, res) => {
    try {
      const newItem = req.body as ServerDBItem;
      if (!newItem || !newItem.id) {
        res.status(400).json({ error: "ข้อมูลไอเท็มไม่สมบูรณ์" });
        return;
      }

      const items = readItems();
      // Remove possible duplicate ids
      const filtered = items.filter(x => x.id !== newItem.id);
      filtered.push(newItem);
      writeItems(filtered);

      res.status(201).json({ success: true, item: newItem });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Update specific item directly
  app.put("/api/items/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updatedItemFields = req.body as Partial<ServerDBItem>;
      
      const items = readItems();
      const idx = items.findIndex(x => x.id === id);
      if (idx === -1) {
        res.status(404).json({ error: "ไม่พบไอเท็มที่แก้ไข" });
        return;
      }

      items[idx] = { ...items[idx], ...updatedItemFields };
      writeItems(items);

      res.json({ success: true, item: items[idx] });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete item or delete folder
  app.delete("/api/items/:id", (req, res) => {
    try {
      const { id } = req.params;
      const items = readItems();
      
      const filtered = items.filter(x => x.id !== id);
      writeItems(filtered);

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Live real storage spaces tracker
  app.get("/api/system-storage", (req, res) => {
    try {
      const stats = getDFDiskSpace();
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Logs Activity Log Tracker endpoints
  app.get("/api/activity", (req, res) => {
    try {
      const logs = readLogs();
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/activity", (req, res) => {
    try {
      const newLog = req.body as ServerActivityLog;
      if (!newLog || !newLog.id) {
        res.status(400).json({ error: "ข้อมูล Log ไม่สมบูรณ์" });
        return;
      }

      const logs = readLogs();
      logs.unshift(newLog); // push on top
      writeLogs(logs.slice(0, 100)); // cap at 100 items

      res.status(201).json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/activity/clear", (req, res) => {
    try {
      writeLogs([]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });


  // Connect Dev system or production Static Build folder
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Thai Cloud Drive server] Online status initialized on port ${PORT}`);
  });
}

startServer();
