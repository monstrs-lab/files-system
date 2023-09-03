import type { Upload } from '../aggregates/index.js'
import type { File }   from '../aggregates/index.js'

export abstract class TransactionalRepository {
  abstract saveUploadAndFile(upload: Upload, file: File): Promise<void>
}
