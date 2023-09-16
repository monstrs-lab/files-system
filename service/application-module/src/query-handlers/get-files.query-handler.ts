import type { FindFilesByQueryResult } from '@files-system/domain-module'
import type { IQueryHandler }          from '@nestjs/cqrs'

import { QueryHandler }                from '@nestjs/cqrs'

import { FileRepository }              from '@files-system/domain-module'

import { GetFilesQuery }               from '../queries/index.js'

@QueryHandler(GetFilesQuery)
export class GetFilesQueryHandler implements IQueryHandler<GetFilesQuery> {
  constructor(private readonly fileRepository: FileRepository) {}

  async execute({ pager, order, query }: GetFilesQuery): Promise<FindFilesByQueryResult> {
    return this.fileRepository.findByQuery({
      pager,
      order,
      query,
    })
  }
}
