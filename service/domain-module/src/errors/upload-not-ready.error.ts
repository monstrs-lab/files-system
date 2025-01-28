import { DomainError } from '@monstrs/core-errors'

export class UploadNotReadyError extends DomainError {
  constructor() {
    super('Upload not ready', 'files.upload-not-ready')
  }
}
