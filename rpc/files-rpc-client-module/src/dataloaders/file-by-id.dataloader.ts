import type { Client }            from '@connectrpc/connect'
import type { File }              from '@files-system/files-rpc'
import type { FilesService }      from '@files-system/files-rpc'

import { Injectable }             from '@nestjs/common'
import { Inject }                 from '@nestjs/common'
import DataLoader                 from 'dataloader'

import { FILES_RPC_CLIENT_TOKEN } from '../constants/index.js'

@Injectable()
export class FileByIdDataLoader {
  protected dataloader: DataLoader<string, File>

  constructor(
    @Inject(FILES_RPC_CLIENT_TOKEN)
    protected readonly client: Client<typeof FilesService>
  ) {
    this.dataloader = new DataLoader<string, File>(async (queries) => this.getFiles(queries), {
      cache: false,
    })
  }

  async load(fileId: string): Promise<File> {
    return this.dataloader.load(fileId)
  }

  async loadMany(fileIds: Array<string>): Promise<Array<Error | File>> {
    return this.dataloader.loadMany(fileIds)
  }

  protected async getFiles(fileIds: ReadonlyArray<string>): Promise<Array<File>> {
    const { files } = await this.client.listFiles({
      query: {
        id: {
          conditions: {
            in: {
              values: fileIds.map((fileId) => fileId),
            },
          },
        },
      },
    })

    const filesById: Record<string, File> = files.reduce(
      (result, file) => ({
        ...result,
        [file.id]: file,
      }),
      {}
    )

    return fileIds.map((fileId) => filesById[fileId])
  }
}
