import type { DynamicModule }     from '@nestjs/common'

import { Module }                 from '@nestjs/common'
import { createClient }           from '@connectrpc/connect'
import { createGrpcTransport }    from '@connectrpc/connect-node'

import { FilesService }           from '@files-system/files-rpc'

import { FILES_RPC_CLIENT_TOKEN } from '../constants/index.js'

@Module({})
export class FilesRPCClientCoreModule {
  static register(
    options: { baseUrl?: string; idleConnectionTimeoutMs?: number } = {}
  ): DynamicModule {
    return {
      global: true,
      module: FilesRPCClientCoreModule,
      providers: [
        {
          provide: FILES_RPC_CLIENT_TOKEN,
          useValue: createClient(
            FilesService,
            createGrpcTransport({
              httpVersion: '2',
              baseUrl: process.env.FILES_SERVICE_URL || 'http://0.0.0.0:50051',
              ...options,
            })
          ),
        },
      ],
      exports: [FILES_RPC_CLIENT_TOKEN],
    }
  }
}
