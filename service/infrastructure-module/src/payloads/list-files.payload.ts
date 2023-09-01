/* eslint-disable max-classes-per-file */

import type { ListFilesRequest_FilesQuery } from '@files-system/files-system-rpc/interfaces'
import type { ListFilesRequest }            from '@files-system/files-system-rpc/interfaces'

import { IdQueryPayload }                   from '@monstrs/rpc-query-payloads'
import { OrderPayload }                     from '@monstrs/rpc-query-payloads'
import { PagerPayload }                     from '@monstrs/rpc-query-payloads'
import { IsOptional }                       from 'class-validator'
import { ValidateNested }                   from 'class-validator'

export class ListFilesQueryPayload {
  constructor(private readonly query: ListFilesRequest_FilesQuery) {}

  @IsOptional()
  @ValidateNested()
  get id(): IdQueryPayload {
    return new IdQueryPayload(this.query.id)
  }
}

export class ListFilesPayload {
  constructor(private readonly request: ListFilesRequest) {}

  @IsOptional()
  @ValidateNested()
  get pager(): PagerPayload | undefined {
    return this.request.pager ? new PagerPayload(this.request.pager) : undefined
  }

  @IsOptional()
  @ValidateNested()
  get order(): OrderPayload | undefined {
    return this.request.order ? new OrderPayload(this.request.order) : undefined
  }

  @IsOptional()
  @ValidateNested()
  get query(): ListFilesQueryPayload | undefined {
    return this.request.query ? new ListFilesQueryPayload(this.request.query) : undefined
  }
}
