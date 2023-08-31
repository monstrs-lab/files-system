export interface StorageFileMetadata {
  bucket: string
  name: string
  size?: number
  contentType?: string
  contentEncoding?: string
  contentLanguage?: string
  metadata?: Record<string, string>
}

export abstract class FilesStorageAdapter {
  abstract generateUploadUrl(
    bucket: string,
    filename: string,
    contentType: string,
    contentLength: number
  ): Promise<string>

  abstract generateReadUrl(
    bucket: string,
    filename: string,
    cname?: string,
    expiration?: number
  ): Promise<string>

  abstract getMetadata(bucket: string, filename: string): Promise<StorageFileMetadata | undefined>
}
