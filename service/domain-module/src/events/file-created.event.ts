import type { FilesBucketType } from '../enums/index.js'

export class FileCreatedEvent {
  constructor(
    public readonly fileId: string,
    public readonly ownerId: string,
    public readonly type: FilesBucketType,
    public readonly url: string,
    public readonly bucket: string,
    public readonly name: string,
    public readonly size: number,
    public readonly contentType?: string,
    public readonly contentEncoding?: string,
    public readonly contentLanguage?: string,
    public readonly metadata?: Record<string, string>
  ) {}
}
