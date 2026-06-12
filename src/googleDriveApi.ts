/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DBItem } from './types';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  parents?: string[];
  webViewLink?: string;
  thumbnailLink?: string;
}

/**
 * Map a raw Google Drive API file object to our local DBItem format.
 */
export function mapGoogleDriveItemToDBItem(driveFile: GoogleDriveFile, targetParentId: string | null): DBItem {
  const isFolder = driveFile.mimeType === 'application/vnd.google-apps.folder';
  const size = driveFile.size ? parseInt(driveFile.size, 10) : 0;
  const updatedAt = Date.parse(driveFile.modifiedTime) || Date.now();

  return {
    id: driveFile.id,
    name: driveFile.name,
    isFolder,
    parentId: targetParentId,
    size,
    type: isFolder ? 'directory' : (driveFile.mimeType || 'application/octet-stream'),
    content: driveFile.webViewLink, // Store view link inside content for easy preview/access
    createdAt: updatedAt,
    updatedAt,
    isTrashed: false,
    tag: isFolder ? undefined : 'Google Drive',
  };
}

/**
 * Fetch files and folders inside a specific parent Google Drive folder.
 */
export async function getGoogleDriveItems(
  accessToken: string,
  parentFolderId: string | null
): Promise<DBItem[]> {
  const queryParent = parentFolderId ? `'${parentFolderId}' in parents` : `'root' in parents`;
  const query = `${queryParent} and trashed = false`;
  
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime,parents,webViewLink,thumbnailLink)&pageSize=150`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Google Drive API error:', errText);
    throw new Error(`Google Drive API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawFiles: GoogleDriveFile[] = data.files || [];
  
  return rawFiles.map(file => mapGoogleDriveItemToDBItem(file, parentFolderId));
}

/**
 * Fetch detailed metadata of a single Google Drive folder to get its name.
 */
export async function getGoogleDriveFolderMetadata(
  accessToken: string,
  folderId: string
): Promise<{ id: string; name: string; parentId: string | null }> {
  const url = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,parents`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Google Drive folder metadata: ${response.status}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    parentId: data.parents?.[0] || null,
  };
}
