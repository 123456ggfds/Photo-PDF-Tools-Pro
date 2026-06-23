import { ToolType } from "./tool";

export interface RecentFileEntry {
  id: string;
  toolType: ToolType;
  displayName: string;
  sourceUris: string[];
  outputUri: string;
  mimeType: string;
  createdAt: number;
  fileSize: number;
  thumbnailUri?: string | null;
}

export interface RecentFileItem extends RecentFileEntry {
  isAvailable: boolean;
}
