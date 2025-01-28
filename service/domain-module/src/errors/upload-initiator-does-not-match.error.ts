import { DomainError } from '@monstrs/core-errors'

export class UploadInitiatorDoesNotMatch extends DomainError {
  constructor() {
    super('Upload initiator does not match', 'files.upload-initiator-does-not-match')
  }
}
