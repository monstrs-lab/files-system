import { DomainError } from '@monstrs/core-errors'

export class FileNotUploadedError extends DomainError {
  constructor() {
    super()
    this.message = 'File not uploaded'
  }
}
