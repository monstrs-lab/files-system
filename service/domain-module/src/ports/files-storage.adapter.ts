import type { Upload } from '../aggregates/index.js'

export abstract class FilesStorageAdapter {
  abstract prepareUpload(upload: Upload): Promise<string>
}
