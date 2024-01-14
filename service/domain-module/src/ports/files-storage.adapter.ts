import type { Upload }              from '../aggregates/index.js'
import type { File }                from '../aggregates/index.js'
import type { StorageFileMetadata } from '../value-objects/index.js'

export abstract class FilesStorageAdapter {
  abstract prepareUpload(upload: Upload): Promise<string>

  abstract toFileMetadata(upload: Upload): Promise<StorageFileMetadata | undefined>

  abstract generateReadUrl(file: File): Promise<string | undefined>
}
