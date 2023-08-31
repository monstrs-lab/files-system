import { DomainError } from '@monstrs/core-errors'

export class UploadInitiatorDoesNotMatch extends DomainError {
  constructor() {
    super()
    this.message = 'Upload initiator does not match'
  }
}
