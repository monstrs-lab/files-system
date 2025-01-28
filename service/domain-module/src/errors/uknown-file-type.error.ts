import { DomainError } from '@monstrs/core-errors'

export class UknownFileTypeError extends DomainError {
  constructor() {
    super('Uknown file type', 'files.uknown-file-type')
  }
}
