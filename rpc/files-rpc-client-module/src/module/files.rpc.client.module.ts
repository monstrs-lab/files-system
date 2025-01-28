import type { DynamicModule }       from '@nestjs/common'

import { Module }                   from '@nestjs/common'

import * as dataloaders             from '../dataloaders/index.js'
import { FilesRPCClient }           from '../client/index.js'
import { FilesRPCClientCoreModule } from './files.rpc.client.core.module.js'

@Module({})
export class FilesRPCClientModule {
  static register(
    options: { baseUrl?: string; idleConnectionTimeoutMs?: number } = {}
  ): DynamicModule {
    return {
      module: FilesRPCClientModule,
      imports: [FilesRPCClientCoreModule.register(options)],
    }
  }

  static attach(): DynamicModule {
    return {
      module: FilesRPCClientModule,
      providers: [FilesRPCClient, ...Object.values(dataloaders)],
      exports: [FilesRPCClient],
    }
  }
}
