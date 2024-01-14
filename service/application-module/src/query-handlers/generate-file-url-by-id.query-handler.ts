import type { IQueryHandler }       from '@nestjs/cqrs'

import { QueryHandler }             from '@nestjs/cqrs'

import { FileRepository }           from '@files-system/domain-module'
import { FilesStorageAdapter }      from '@files-system/domain-module'

import { GenerateFileUrlByIdQuery } from '../queries/index.js'

@QueryHandler(GenerateFileUrlByIdQuery)
export class GenerateFileUrlQueryHandler implements IQueryHandler<GenerateFileUrlByIdQuery> {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly storageAdapter: FilesStorageAdapter
  ) {}

  async execute(query: GenerateFileUrlByIdQuery): Promise<string | undefined> {
    const file = await this.fileRepository.findById(query.id)

    if (file) {
      return this.storageAdapter.generateReadUrl(file)
    }

    return undefined
  }
}
