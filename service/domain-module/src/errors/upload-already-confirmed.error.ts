import { DomainError } from '@monstrs/core-errors'

export class UploadAlreadyConfirmedError extends DomainError {
  constructor() {
    super()
    this.message = 'Upload already confirmed'
  }
}
