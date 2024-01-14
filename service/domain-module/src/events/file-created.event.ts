import type { FilesBucketType } from '../enums/index.js'

export class FileCreatedEvent {
  constructor(
    public readonly fileId: string,
    public readonly ownerId: string,
    public readonly type: FilesBucketType,
    public readonly url: string,
    public readonly bucket: string
  ) {}
}
