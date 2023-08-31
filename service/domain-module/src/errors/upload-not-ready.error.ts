import { DomainError } from '@monstrs/core-errors'

export class UploadNotReadyError extends DomainError {
  constructor() {
    super()
    this.message = 'Upload not ready'
  }
}
