import { DomainError } from '@monstrs/core-errors'

export class UknownFileBucketError extends DomainError {
  constructor() {
    super()
    this.message = 'Uknown file bucket'
  }
}
