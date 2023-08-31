import { DomainError } from '@monstrs/core-errors'

export class UknownFileTypeError extends DomainError {
  constructor() {
    super()
    this.message = 'Uknown file type'
  }
}
