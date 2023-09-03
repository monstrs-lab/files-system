import type { INestMicroservice }                     from '@nestjs/common'
import type { StartedTestContainer }                  from 'testcontainers'
import type { PromiseClient }                         from '@connectrpc/connect'
import type { StartedKafkaContainer }                 from '@testcontainers/kafka'

import { KafkaContainer }                             from '@testcontainers/kafka'
import { Test }                                       from '@nestjs/testing'
import { ConnectError }                               from '@connectrpc/connect'
import { findValidationErrorDetails }                 from '@monstrs/protobuf-rpc'
import { describe }                                   from '@jest/globals'
import { afterAll }                                   from '@jest/globals'
import { beforeAll }                                  from '@jest/globals'
import { expect }                                     from '@jest/globals'
import { it }                                         from '@jest/globals'
import { faker }                                      from '@faker-js/faker'
import { createPromiseClient }                        from '@connectrpc/connect'
import { createGrpcTransport }                        from '@connectrpc/connect-node'
import { GenericContainer }                           from 'testcontainers'
import { Wait }                                       from 'testcontainers'
import getPort                                        from 'get-port'

import { ConnectRpcServer }                           from '@files-system/infrastructure-module'
import { ServerProtocol }                             from '@files-system/infrastructure-module'
import { FilesService }                               from '@files-system/files-rpc/connect'
import { FilesBucketsAdapter }                        from '@files-system/domain-module'
import { FilesBucketSizeConditions }                  from '@files-system/domain-module'
import { FilesBucketConditions }                      from '@files-system/domain-module'
import { FilesBucketType }                            from '@files-system/domain-module'
import { FilesBucket }                                from '@files-system/domain-module'
import { StaticFilesBucketsAdapterImpl }              from '@files-system/infrastructure-module'
import { FILES_SYSTEM_INFRASTRUCTURE_MODULE_OPTIONS } from '@files-system/infrastructure-module'

import { FilesSystemServiceEntrypointModule }         from '../src/files-system-service-entrypoint.module.js'

describe('files-service', () => {
  describe('rpc', () => {
    describe('common', () => {
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
            db: {
              port: postgres.getMappedPort(5432),
            },
            events: {
              brokers: [`${kafka.getHost()}:${kafka.getMappedPort(9093)}`],
            },
          })
          .overrideProvider(FilesBucketsAdapter)
          .useValue(
            new StaticFilesBucketsAdapterImpl([
              FilesBucket.create(
                FilesBucketType.PUBLIC,
                'public',
                'public',
                '/',
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
          it('check invalid owner id validation', async () => {
            expect.assertions(1)

            try {
              await client.createUpload({})
            } catch (error) {
              if (error instanceof ConnectError) {
                expect(findValidationErrorDetails(error)).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: 'ownerId',
                      property: 'ownerId',
                      messages: expect.arrayContaining([
                        expect.objectContaining({
                          id: 'isUuid',
                          constraint: 'ownerId must be a UUID',
                        }),
                      ]),
                    }),
                  ])
                )
              }
            }
          })

          it('check invalid bucket validation', async () => {
            expect.assertions(1)

            try {
              await client.createUpload({})
            } catch (error) {
              if (error instanceof ConnectError) {
                expect(findValidationErrorDetails(error)).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: 'bucket',
                      property: 'bucket',
                      messages: expect.arrayContaining([
                        expect.objectContaining({
                          id: 'isNotEmpty',
                          constraint: 'bucket should not be empty',
                        }),
                      ]),
                    }),
                  ])
                )
              }
            }
          })

          it('check invalid name validation', async () => {
            expect.assertions(1)

            try {
              await client.createUpload({})
            } catch (error) {
              if (error instanceof ConnectError) {
                expect(findValidationErrorDetails(error)).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: 'name',
                      property: 'name',
                      messages: expect.arrayContaining([
                        expect.objectContaining({
                          id: 'isNotEmpty',
                          constraint: 'name should not be empty',
                        }),
                      ]),
                    }),
                  ])
                )
              }
            }
          })

          it('check invalid size validation', async () => {
            expect.assertions(1)

            try {
              await client.createUpload({})
            } catch (error) {
              if (error instanceof ConnectError) {
                expect(findValidationErrorDetails(error)).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: 'size',
                      property: 'size',
                      messages: expect.arrayContaining([
                        expect.objectContaining({
                          id: 'min',
                          constraint: 'size must not be less than 1',
                        }),
                      ]),
                    }),
                  ])
                )
              }
            }
          })

          it('check unknown bucket', async () => {
            expect.assertions(1)

            try {
              await client.createUpload({
                ownerId: faker.string.uuid(),
                bucket: 'uknown',
                name: faker.system.commonFileName('png'),
                size: 1,
              })
            } catch (error) {
              if (error instanceof ConnectError) {
                expect(findValidationErrorDetails(error)).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: 'guard.against.not-instance',
                      property: 'bucket',
                      messages: expect.arrayContaining([
                        expect.objectContaining({
                          id: 'guard.against.not-instance',
                          constraint: `Guard against 'bucket' value 'undefined' not instance 'FilesBucket'.`,
                        }),
                      ]),
                    }),
                  ])
                )
              }
            }
          })

          it('check invalid file type', async () => {
            expect.assertions(1)

            try {
              await client.createUpload({
                ownerId: faker.string.uuid(),
                bucket: 'public',
                name: 'test.zip',
                size: 1,
              })
            } catch (error) {
              if (error instanceof ConnectError) {
                expect(error.rawMessage).toBe(
                  `Files bucket not support type 'application/zip', only 'image/*'`
                )
              }
            }
          })

          it('check file size', async () => {
            expect.assertions(1)

            try {
              await client.createUpload({
                ownerId: faker.string.uuid(),
                name: faker.system.commonFileName('png'),
                bucket: 'public',
                size: 2000,
              })
            } catch (error) {
              if (error instanceof ConnectError) {
                expect(error.rawMessage).toBe(
                  'File size must be greater than 0 and less than 1000, current size is 2000'
                )
              }
            }
          })
        })

        describe('confirm upload', () => {
          it('check invalid id validation', async () => {
            expect.assertions(1)

            try {
              await client.confirmUpload({})
            } catch (error) {
              if (error instanceof ConnectError) {
                expect(findValidationErrorDetails(error)).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: 'id',
                      property: 'id',
                      messages: expect.arrayContaining([
                        expect.objectContaining({
                          id: 'isUuid',
                          constraint: 'id must be a UUID',
                        }),
                      ]),
                    }),
                  ])
                )
              }
            }
          })

          it('check invalid owner id validation', async () => {
            expect.assertions(1)

            try {
              await client.confirmUpload({})
            } catch (error) {
              if (error instanceof ConnectError) {
                expect(findValidationErrorDetails(error)).toEqual(
                  expect.arrayContaining([
                    expect.objectContaining({
                      id: 'ownerId',
                      property: 'ownerId',
                      messages: expect.arrayContaining([
                        expect.objectContaining({
                          id: 'isUuid',
                          constraint: 'ownerId must be a UUID',
                        }),
                      ]),
                    }),
                  ])
                )
              }
            }
          })
        })
      })
    })
  })
})
