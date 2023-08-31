import { DomainError } from '@monstrs/core-errors'

export class UploadNotFoundError extends DomainError {
  constructor() {
    super()
    this.message = 'Upload not found'
  }
}
