import type { INestMicroservice }               from '@nestjs/common'
import type { StartedTestContainer }            from 'testcontainers'
import type { FilesService }                    from '@files-system/files-rpc/connect'
import type { PromiseClient }                   from '@files-system/files-rpc'

import { fileURLToPath }                        from 'node:url'
import { join }                                 from 'node:path'
import { createReadStream }                     from 'node:fs'

import { GCS_CLIENT_API_ENDPOINT }              from '@monstrs/nestjs-gcs-client'
import { GCS_CLIENT_KEY_FILENAME }              from '@monstrs/nestjs-gcs-client'
import { Test }                                 from '@nestjs/testing'
import { describe }                             from '@jest/globals'
import { afterAll }                             from '@jest/globals'
import { beforeAll }                            from '@jest/globals'
import { expect }                               from '@jest/globals'
import { it }                                   from '@jest/globals'
import { faker }                                from '@faker-js/faker'
import { GenericContainer }                     from 'testcontainers'
import { Wait }                                 from 'testcontainers'
import getPort                                  from 'get-port'
import fetch                                    from 'node-fetch'

import { FilesBucketsAdapter }                  from '@files-system/domain-module'
import { FilesBucketSizeConditions }            from '@files-system/domain-module'
import { FilesBucketConditions }                from '@files-system/domain-module'
import { FilesBucketType }                      from '@files-system/domain-module'
import { FilesBucket }                          from '@files-system/domain-module'
import { ServerBufConnect }                     from '@files-system/infrastructure-module'
import { ServerProtocol }                       from '@files-system/infrastructure-module'
import { MIKRO_ORM_CONFIG_MODULE_OPTIONS_PORT } from '@files-system/infrastructure-module'
import { StaticFilesBucketsAdapterImpl }        from '@files-system/infrastructure-module'
import { FILES_STORAGE_PROVIDER }               from '@files-system/infrastructure-module'
import { ConnectError }                         from '@files-system/files-rpc'
import { createFilesClient }                    from '@files-system/files-rpc'

import { FilesSystemServiceEntrypointModule }   from '../src/files-system-service-entrypoint.module.js'

describe('files-service', () => {
  describe('rpc', () => {
    describe('gcs', () => {
      let postgres: StartedTestContainer
      let service: INestMicroservice
      let storage: StartedTestContainer
      let client: PromiseClient<typeof FilesService>

      beforeAll(async () => {
        postgres = await new GenericContainer('bitnami/postgresql')
          .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections'))
          .withEnvironment({
            POSTGRESQL_PASSWORD: 'password',
            POSTGRESQL_DATABASE: 'db',
          })
          .withExposedPorts(5432)
          .start()

        const storagePort = await getPort()

        storage = await new GenericContainer('fsouza/fake-gcs-server')
          .withWaitStrategy(Wait.forLogMessage('server started at'))
          .withCommand(['-scheme', 'http', '-external-url', `http://localhost:${storagePort}`])
          .withCopyContentToContainer([
            {
              content: 'bucket mock',
              target: '/data/public/mock.txt',
            },
          ])
          .withExposedPorts({
            container: 4443,
            host: storagePort,
          })
          .start()

        const port = await getPort()

        const testingModule = await Test.createTestingModule({
          imports: [FilesSystemServiceEntrypointModule],
        })
          .overrideProvider(MIKRO_ORM_CONFIG_MODULE_OPTIONS_PORT)
          .useValue(postgres.getMappedPort(5432))
          .overrideProvider(FILES_STORAGE_PROVIDER)
          .useValue('gcs')
          .overrideProvider(GCS_CLIENT_API_ENDPOINT)
          .useValue(`http://127.0.0.1:${storage.getMappedPort(4443)}`)
          .overrideProvider(GCS_CLIENT_KEY_FILENAME)
          .useValue(
            join(
              fileURLToPath(new URL('.', import.meta.url)),
              'fixtures/fake-google-credentials.json'
            )
          )
          .overrideProvider(MIKRO_ORM_CONFIG_MODULE_OPTIONS_PORT)
          .useValue(postgres.getMappedPort(5432))
          .overrideProvider(FilesBucketsAdapter)
          .useValue(
            new StaticFilesBucketsAdapterImpl([
              FilesBucket.create(
                FilesBucketType.PUBLIC,
                'public',
                'public',
                '/scope',
                FilesBucketConditions.create('image/*', FilesBucketSizeConditions.create(0, 1000))
              ),
            ])
          )
          .compile()

        service = testingModule.createNestMicroservice({
          strategy: new ServerBufConnect({
            protocol: ServerProtocol.HTTP2_INSECURE,
            port,
          }),
        })

        await service.listen()

        client = createFilesClient({ baseUrl: `http://localhost:${port}` })
      })

      afterAll(async () => {
        await service.close()
        await postgres.stop()
        await storage.stop()
      })

      describe('uploads', () => {
        describe('create upload', () => {
          it('check create upload', async () => {
            const { result: upload } = await client.createUpload({
              ownerId: faker.string.uuid(),
              name: faker.system.commonFileName('png'),
              bucket: 'public',
              size: 206,
            })

            expect(upload!.url).toBeTruthy()
          })
        })

        describe('upload', () => {
          it('check upload file', async () => {
            const { result: upload } = await client.createUpload({
              ownerId: faker.string.uuid(),
              name: faker.system.commonFileName('png'),
              bucket: 'public',
              size: 206,
            })

            const response = await fetch(upload!.url, {
              body: createReadStream(
                join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures/test.png')
              ),
              method: 'POSt',
              headers: {
                'Content-Length': '206',
                'Content-Type': 'image/png',
              },
            })

            expect(response.status).toBe(200)
          })
        })

        describe('confirm', () => {
          it('check validate not uploaded file', async () => {
            const { result: upload } = await client.createUpload({
              ownerId: faker.string.uuid(),
              name: faker.system.commonFileName('png'),
              bucket: 'public',
              size: 206,
            })

            try {
              await client.confirmUpload({
                id: upload?.id,
                ownerId: upload?.ownerId,
              })
            } catch (error) {
              if (error instanceof ConnectError) {
                expect(error.rawMessage).toBe('File not uploaded')
              }
            }
          })

          it('check confirm upload', async () => {
            const { result: upload } = await client.createUpload({
              ownerId: faker.string.uuid(),
              name: faker.system.commonFileName('png'),
              bucket: 'public',
              size: 206,
            })

            await fetch(upload!.url, {
              body: createReadStream(
                join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures/test.png')
              ),
              method: 'POSt',
              headers: {
                'Content-Length': '206',
                'Content-Type': 'image/png',
              },
            })

            await client.confirmUpload({
              id: upload?.id,
              ownerId: upload?.ownerId,
            })
          })

          it('check confirm already confirmed upload', async () => {
            const { result: upload } = await client.createUpload({
              ownerId: faker.string.uuid(),
              name: faker.system.commonFileName('png'),
              bucket: 'public',
              size: 206,
            })

            await fetch(upload!.url, {
              body: createReadStream(
                join(fileURLToPath(new URL('.', import.meta.url)), 'fixtures/test.png')
              ),
              method: 'PUT',
              headers: {
                'Content-Length': '206',
                'Content-Type': 'image/png',
              },
            })

            await client.confirmUpload({
              id: upload?.id,
              ownerId: upload?.ownerId,
            })

            try {
              await client.confirmUpload({
                id: upload?.id,
                ownerId: upload?.ownerId,
              })
            } catch (error) {
              if (error instanceof ConnectError) {
                expect(error.rawMessage).toBe('Upload already confirmed')
              }
            }
          })
        })
      })
    })
  })
})
