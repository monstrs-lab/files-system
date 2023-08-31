import type { FilesBucket } from '../value-objects/index.js'

export class UploadCreatedEvent {
  constructor(
    public readonly uploadId: string,
    public readonly ownerId: string,
    public readonly url: string,
    public readonly name: string,
    public readonly filename: string,
    public readonly bucket: FilesBucket,
    public readonly size: number
  ) {}
}
