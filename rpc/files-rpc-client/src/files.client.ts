import type { PromiseClient }  from '@connectrpc/connect'

import { createPromiseClient } from '@connectrpc/connect'
import { createGrpcTransport } from '@connectrpc/connect-node'

import { FilesService }        from '@files-system/files-rpc/connect'

export const createClient = (options = {}): PromiseClient<typeof FilesService> =>
  createPromiseClient(
    FilesService,
    createGrpcTransport({
      httpVersion: '2',
      baseUrl: process.env.PUBLICATIONS_SERVICE_URL || 'http://0.0.0.0:50051',
      ...options,
    })
  )

export const client = createClient()
