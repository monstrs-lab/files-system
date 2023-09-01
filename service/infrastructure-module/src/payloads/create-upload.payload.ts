import type { CreateUploadRequest } from '@files-system/files-system-rpc/interfaces'

import { IsNotEmpty }               from 'class-validator'
import { IsInt }                    from 'class-validator'
import { Min }                      from 'class-validator'
import { IsUUID }                   from 'class-validator'

export class CreateUploadPayload {
  constructor(private readonly request: CreateUploadRequest) {}

  @IsUUID('4')
  get ownerId(): string {
    return this.request.ownerId
  }

  @IsNotEmpty()
  get bucket(): string {
    return this.request.bucket
  }

  @IsNotEmpty()
  get name(): string {
    return this.request.name
  }

  @IsInt()
  @Min(1)
  get size(): number {
    return this.request.size
  }
}
