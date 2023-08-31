import { DomainError } from '@monstrs/core-errors'

export class FileNotFoundError extends DomainError {
  constructor() {
    super()
    this.message = 'File not found'
  }
}
