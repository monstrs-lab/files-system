import type { ICommandHandler } from '@nestjs/cqrs'

import assert                   from 'node:assert'

import { CommandHandler }       from '@nestjs/cqrs'

import { UploadRepository }     from '@files-system/domain-module'
import { FileRepository }       from '@files-system/domain-module'
import { FilesStorageAdapter }  from '@files-system/domain-module'

import { ConfirmUploadCommand } from '../commands/index.js'

@CommandHandler(ConfirmUploadCommand)
export class ConfirmUploadCommandHandler implements ICommandHandler<ConfirmUploadCommand, void> {
  constructor(
    private readonly uploadRepository: UploadRepository,
    private readonly fileRepository: FileRepository,
    private readonly storageAdapter: FilesStorageAdapter
  ) {}

  async execute(command: ConfirmUploadCommand): Promise<void> {
    const upload = await this.uploadRepository.findById(command.uploadId)

    assert.ok(upload, `Upload with id '${command.uploadId}' not found`)

    const metadata = await this.storageAdapter.toFileMetadata(upload)

    const file = await upload.confirm(command.ownerId, metadata!)

    await this.uploadRepository.save(upload)
    await this.fileRepository.save(file)
  }
}
