import { DomainError } from '@monstrs/core-errors'

export class FileNotUploadedError extends DomainError {
  constructor() {
    super('File not uploaded', 'files.file-not-uploaded')
  }
}
