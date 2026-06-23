export interface FileResult {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: number;
  thumbnailUri?: string | null;
}
