import { DomainError } from '@monstrs/core-errors'

export class InvalidContentTypeError extends DomainError {
  constructor(received: string, expected: string) {
    super(
      `Files bucket not support type '${received}', only '${expected}'`,
      'files.invalid-content-type'
    )
  }
}
