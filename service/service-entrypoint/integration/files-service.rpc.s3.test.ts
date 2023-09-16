import type { PromiseClient }                         from '@connectrpc/connect'
import type { INestMicroservice }                     from '@nestjs/common'
import type { StartedKafkaContainer }                 from '@testcontainers/kafka'
import type { StartedTestContainer }                  from 'testcontainers'

import { createReadStream }                           from 'node:fs'
import { join }                                       from 'node:path'
import { fileURLToPath }                              from 'node:url'

import { ConnectError }                               from '@connectrpc/connect'
import { ConnectRpcServer }                           from '@monstrs/nestjs-connectrpc'
import { ServerProtocol }                             from '@monstrs/nestjs-connectrpc'
import { Test }                                       from '@nestjs/testing'
import { KafkaContainer }                             from '@testcontainers/kafka'
import { createPromiseClient }                        from '@connectrpc/connect'
import { createGrpcTransport }                        from '@connectrpc/connect-node'
import { faker }                                      from '@faker-js/faker'
import { describe }                                   from '@jest/globals'
import { afterAll }                                   from '@jest/globals'
import { beforeAll }                                  from '@jest/globals'
import { expect }                                     from '@jest/globals'
import { it }                                         from '@jest/globals'
import { GenericContainer }                           from 'testcontainers'
import { Wait }                                       from 'testcontainers'
import getPort                                        from 'get-port'
import fetch                                          from 'node-fetch'

import { FilesBucketsAdapter }                        from '@files-system/domain-module'
import { FilesBucketSizeConditions }                  from '@files-system/domain-module'
import { FilesBucketConditions }                      from '@files-system/domain-module'
import { FilesBucketType }                            from '@files-system/domain-module'
import { FilesBucket }                                from '@files-system/domain-module'
import { FilesService }                               from '@files-system/files-rpc/connect'
import { StaticFilesBucketsAdapterImpl }              from '@files-system/infrastructure-module'
import { FILES_SYSTEM_INFRASTRUCTURE_MODULE_OPTIONS } from '@files-system/infrastructure-module'

import { FilesSystemServiceEntrypointModule }         from '../src/files-system-service-entrypoint.module.js'

describe('files-service', () => {
  describe('rpc', () => {
    describe('s3', () => {
      let postgres: StartedTestContainer
      let kafka: StartedKafkaContainer
      let service: INestMicroservice
      let storage: StartedTestContainer
      let client: PromiseClient<typeof FilesService>

      beforeAll(async () => {
        kafka = await new KafkaContainer().withExposedPorts(9093).start()

        postgres = await new GenericContainer('bitnami/postgresql')
          .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections'))
          .withEnvironment({
            POSTGRESQL_PASSWORD: 'password',
            POSTGRESQL_DATABASE: 'db',
          })
          .withExposedPorts(5432)
          .start()

        storage = await new GenericContainer('minio/minio')
          .withCopyContentToContainer([
            {
              content: '1',
              target: '/data/public/mock.txt',
            },
          ])
          .withWaitStrategy(Wait.forLogMessage('1 Online'))
          .withEnvironment({
            MINIO_ROOT_USER: 'accesskey',
            MINIO_ROOT_PASSWORD: 'secretkey',
            MINIO_DOMAIN: 'localhost',
          })
          .withCommand(['server', '/data'])
          .withExposedPorts(9000)
          .start()

        const port = await getPort()

        const testingModule = await Test.createTestingModule({
          imports: [FilesSystemServiceEntrypointModule],
        })
          .overrideProvider(FILES_SYSTEM_INFRASTRUCTURE_MODULE_OPTIONS)
          .useValue({
            storage: 's3',
            db: {
              port: postgres.getMappedPort(5432),
            },
            events: {
              brokers: [`${kafka.getHost()}:${kafka.getMappedPort(9093)}`],
            },
            s3: {
              endpoint: `http://localhost:${storage.getMappedPort(9000)}`,
              region: 'eu-central-1',
              credentials: {
                accessKeyId: 'accesskey',
                secretAccessKey: 'secretkey',
              },
            },
          })
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
          strategy: new ConnectRpcServer({
            protocol: ServerProtocol.HTTP2_INSECURE,
            port,
          }),
        })

        await service.listen()

        client = createPromiseClient(
          FilesService,
          createGrpcTransport({
            httpVersion: '2',
            baseUrl: `http://localhost:${port}`,
            idleConnectionTimeoutMs: 1000,
          })
        )
      })

      afterAll(async () => {
        await service.close()
        await postgres.stop()
        await storage.stop()
        await kafka.stop()
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
              method: 'PUT',
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
