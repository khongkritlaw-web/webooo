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

/**
 * Upload a file to Google Drive.
 */
export async function uploadFileToGoogleDrive(
  accessToken: string,
  name: string,
  type: string,
  contentStr: string,
  parentFolderId: string | null
): Promise<GoogleDriveFile> {
  const metadata: any = {
    name: name,
    mimeType: type,
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  let body: any;
  let headers: HeadersInit = {
    'Authorization': `Bearer ${accessToken}`,
  };

  if (contentStr.startsWith('data:')) {
    const parts = contentStr.split(',');
    const metadataBoundary = 'foo_bar_boundary';
    headers['Content-Type'] = `multipart/related; boundary=${metadataBoundary}`;

    const mimeMatch = contentStr.match(/data:(.*?);base64,/);
    const mime = mimeMatch ? mimeMatch[1] : type;
    metadata.mimeType = mime;

    const base64Data = parts[1];
    const metadataPart = `--${metadataBoundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
    const mediaPart = `--${metadataBoundary}\r\nContent-Type: ${mime}\r\nContent-Transfer-Encoding: base64\r\n\r\n${base64Data}\r\n--${metadataBoundary}--`;
    
    body = metadataPart + mediaPart;
  } else {
    const metadataBoundary = 'foo_bar_boundary';
    headers['Content-Type'] = `multipart/related; boundary=${metadataBoundary}`;
    
    const metadataPart = `--${metadataBoundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
    const mediaPart = `--${metadataBoundary}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${contentStr}\r\n--${metadataBoundary}--`;
    
    body = metadataPart + mediaPart;
  }

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: headers,
    body: body,
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Google Drive Upload Error:', errText);
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new folder on Google Drive.
 */
export async function createFolderInGoogleDrive(
  accessToken: string,
  name: string,
  parentFolderId: string | null
): Promise<GoogleDriveFile> {
  const metadata: any = {
    name: name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Google Drive Create Folder Error:', errText);
    throw new Error(`Folder creation failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete a file or folder from Google Drive.
 */
export async function deleteFileFromGoogleDrive(
  accessToken: string,
  fileId: string
): Promise<void> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Google Drive Delete Error:', errText);
    throw new Error(`Delete failed: ${response.status}`);
  }
}

/**
 * Fetch file content from Google Drive.
 */
export async function fetchGoogleDriveFileContent(
  accessToken: string,
  fileId: string,
  mimeType: string
): Promise<{ content: string; isBase64: boolean }> {
  let url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  let isWorkspaceDoc = false;

  if (mimeType.startsWith('application/vnd.google-apps.')) {
    isWorkspaceDoc = true;
    if (mimeType.includes('document')) {
      url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
    } else if (mimeType.includes('spreadsheet')) {
      url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/csv`;
    } else {
      url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`;
    }
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Google Drive fetch content error:', errText);
    throw new Error(`Fetch content failed: ${response.status}`);
  }

  const contentType = response.headers.get('Content-Type') || '';
  if (isWorkspaceDoc && (mimeType.includes('document') || mimeType.includes('spreadsheet'))) {
    const text = await response.text();
    return { content: text, isBase64: false };
  } else if (contentType.startsWith('text/') || contentType.includes('json') || contentType.includes('xml')) {
    const text = await response.text();
    return { content: text, isBase64: false };
  } else {
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({ content: reader.result as string, isBase64: true });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
