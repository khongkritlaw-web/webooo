/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DBItem {
  id: string;
  name: string;
  isFolder: boolean;
  parentId: string | null; // null represents the root level
  size: number; // in bytes
  type: string; // mime type, e.g. "image/png" or "text/plain" or "directory" for folders
  content?: string; // base64 or raw text content of the file
  createdAt: number;
  updatedAt: number;
  tag?: string; // e.g., "งาน", "ส่วนตัว", "สำคัญ", "เอกสารเก่า"
  isTrashed: boolean;
  trashDate?: number;
}

export type FileCategory = 'all' | 'images' | 'documents' | 'audio-video' | 'archives' | 'trash';

export interface StorageStats {
  usedBytes: number;
  maxBytes: number; // e.g., 200 MB simulated
  fileCount: number;
  folderCount: number;
  byType: {
    images: number;
    documents: number;
    media: number;
    archives: number;
    others: number;
  };
}

export interface ActivityLog {
  id: string;
  action: 'create_folder' | 'upload_file' | 'delete_item' | 'rename_item' | 'move_item' | 'update_file' | 'restore_item';
  itemName: string;
  itemType: 'file' | 'folder';
  timestamp: number;
}
