import { DomainError } from '@monstrs/core-errors'

export class UploadAlreadyConfirmedError extends DomainError {
  constructor() {
    super('Upload already confirmed', 'files.upload-already-confirmed')
  }
}
