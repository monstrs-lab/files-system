/* eslint-disable @typescript-eslint/consistent-type-imports */

import type { ServiceImpl }            from '@files-system/files-rpc'
import type { Upload }                 from '@files-system/domain-module'
import type { File }                   from '@files-system/domain-module'
import type { FindFilesByQueryResult } from '@files-system/domain-module'
import type { ListFilesRequest }       from '@files-system/files-rpc/interfaces'
import type { ListFilesResponse }      from '@files-system/files-rpc/interfaces'
import type { CreateUploadRequest }    from '@files-system/files-rpc/interfaces'
import type { ConfirmUploadRequest }   from '@files-system/files-rpc/interfaces'
import type { CreateUploadResponse }   from '@files-system/files-rpc/interfaces'
import type { ConfirmUploadResponse }  from '@files-system/files-rpc/interfaces'

import { Controller }                  from '@nestjs/common'
import { QueryBus }                    from '@nestjs/cqrs'
import { Validator }                   from '@monstrs/nestjs-validation'
import { BufMethod }                   from '@wolfcoded/nestjs-bufconnect'
import { BufService }                  from '@wolfcoded/nestjs-bufconnect'
import { UseFilters }                  from '@nestjs/common'
import { CommandBus }                  from '@nestjs/cqrs'
import { BufExceptionsFilter }         from '@monstrs/nestjs-buf-errors'
import { v4 as uuid }                  from 'uuid'

import { FilesService }                from '@files-system/files-rpc/connect'
import { GetFilesQuery }               from '@files-system/application-module'
import { CreateUploadCommand }         from '@files-system/application-module'
import { ConfirmUploadCommand }        from '@files-system/application-module'
import { GetUploadByIdQuery }          from '@files-system/application-module'
import { GetFileByIdQuery }            from '@files-system/application-module'

import { CreateUploadPayload }         from '../payloads/index.js'
import { ConfirmUploadPayload }        from '../payloads/index.js'
import { CreateUploadSerializer }      from '../serializers/index.js'
import { ConfirmUploadSerializer }     from '../serializers/index.js'
import { ListFilesPayload }            from '../payloads/index.js'
import { ListFilesSerializer }         from '../serializers/index.js'

@Controller()
@BufService(FilesService)
@UseFilters(BufExceptionsFilter)
export class FilesController implements ServiceImpl<typeof FilesService> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly validator: Validator
  ) {}

  @BufMethod()
  async createUpload(request: CreateUploadRequest): Promise<CreateUploadResponse> {
    const payload = new CreateUploadPayload(request)

    await this.validator.validate(payload)

    const command = new CreateUploadCommand(
      uuid(),
      payload.ownerId,
      payload.bucket,
      payload.name,
      payload.size
    )

    await this.commandBus.execute(command)

    return new CreateUploadSerializer(
      await this.queryBus.execute<GetUploadByIdQuery, Upload>(
        new GetUploadByIdQuery(command.uploadId)
      )
    )
  }

  @BufMethod()
  async confirmUpload(request: ConfirmUploadRequest): Promise<ConfirmUploadResponse> {
    const payload = new ConfirmUploadPayload(request)

    await this.validator.validate(payload)

    const command = new ConfirmUploadCommand(payload.id, payload.ownerId)

    await this.commandBus.execute(command)

    return new ConfirmUploadSerializer(
      await this.queryBus.execute<GetFileByIdQuery, File>(new GetFileByIdQuery(command.uploadId))
    )
  }

  @BufMethod()
  async listFiles(request: ListFilesRequest): Promise<ListFilesResponse> {
    const payload = new ListFilesPayload(request)

    await this.validator.validate(payload)

    return new ListFilesSerializer(
      await this.queryBus.execute<GetFilesQuery, FindFilesByQueryResult>(
        new GetFilesQuery(payload.pager, payload.order, payload.query)
      )
    )
  }
}
