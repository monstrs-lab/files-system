import type { PromiseClient }  from '@bufbuild/connect'

import { createPromiseClient } from '@bufbuild/connect'
import { createGrpcTransport } from '@bufbuild/connect-node'

import { FilesService }        from './gen/connect/index.js'

export const createFilesClient = (options = {}): PromiseClient<typeof FilesService> =>
  createPromiseClient(
    FilesService,
    createGrpcTransport({
      httpVersion: '2',
      baseUrl: process.env.FILES_SERVICE_URL || 'http://0.0.0.0:50051',
      ...options,
    })
  )

export const referralProgramsClient = createFilesClient()
