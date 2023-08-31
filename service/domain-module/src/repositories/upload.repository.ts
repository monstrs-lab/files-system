import type { Upload } from '../aggregates/index.js'

export abstract class UploadRepository {
  abstract save(aggregate: Upload): Promise<void>

  abstract findById(id: string): Promise<Upload | undefined>
}
