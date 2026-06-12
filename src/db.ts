/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DBItem, ActivityLog } from './types';

export function getAllItems(): Promise<DBItem[]> {
  return fetch('/api/items')
    .then(async (res) => {
      if (!res.ok) {
        throw new Error('Failed to fetch items from online server');
      }
      return res.json();
    });
}

export function putItem(item: DBItem): Promise<void> {
  return fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error('Failed to save online item');
      }
      
      const log: ActivityLog = {
        id: Math.random().toString(36).substring(2),
        action: item.isFolder ? 'create_folder' : 'upload_file',
        itemName: item.name,
        itemType: item.isFolder ? 'folder' : 'file',
        timestamp: Date.now(),
      };
      return addActivityLog(log);
    });
}

export function saveItemDirect(item: DBItem): Promise<void> {
  return fetch(`/api/items/${item.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error('Failed to update online item');
      }
    });
}

export function deleteItem(id: string): Promise<void> {
  return fetch(`/api/items/${id}`, {
    method: 'DELETE',
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error('Failed to delete online item');
      }
    });
}

export function getActivityLogs(): Promise<ActivityLog[]> {
  return fetch('/api/activity')
    .then(async (res) => {
      if (!res.ok) {
        throw new Error('Failed to fetch activity logs');
      }
      return res.json();
    });
}

export function addActivityLog(log: ActivityLog): Promise<void> {
  return fetch('/api/activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log),
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error('Failed to save log');
      }
    });
}

export function clearAllActivityLogs(): Promise<void> {
  return fetch('/api/activity/clear', {
    method: 'POST',
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error('Failed to clear logs');
      }
    });
}

export function getSystemStorageStats(): Promise<{ freeSpace: number; usedSpace: number; totalSpace: number }> {
  return fetch('/api/system-storage')
    .then(async (res) => {
      if (!res.ok) {
        throw new Error('Failed to fetch real storage stats');
      }
      return res.json();
    });
}
