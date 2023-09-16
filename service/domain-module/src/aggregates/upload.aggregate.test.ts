import { faker }                       from '@faker-js/faker'
import { describe }                    from '@jest/globals'
import { expect }                      from '@jest/globals'
import { it }                          from '@jest/globals'

import { FilesBucketType }             from '../enums/index.js'
import { UploadAlreadyConfirmedError } from '../errors/index.js'
import { UploadInitiatorDoesNotMatch } from '../errors/index.js'
import { UploadNotReadyError }         from '../errors/index.js'
import { UknownFileTypeError }         from '../errors/index.js'
import { InvalidContentTypeError }     from '../errors/index.js'
import { InvalidContentSizeError }     from '../errors/index.js'
import { FileNotUploadedError }        from '../errors/index.js'
import { StorageFileMetadata }         from '../value-objects/index.js'
import { FilesBucketSizeConditions }   from '../value-objects/index.js'
import { FilesBucketConditions }       from '../value-objects/index.js'
import { FilesBucket }                 from '../value-objects/index.js'
import { Upload }                      from './upload.aggregate.js'

describe('files-system', () => {
  describe('domain', () => {
    describe('aggregates', () => {
      describe('upload', () => {
        describe('create', () => {
          it('check unknown file type', async () => {
            expect(() =>
              new Upload().create(
                faker.string.uuid(),
                faker.string.uuid(),
                FilesBucket.create(
                  FilesBucketType.PUBLIC,
                  faker.word.sample(),
                  faker.word.sample(),
                  faker.system.directoryPath(),

                  FilesBucketConditions.create('image/*', FilesBucketSizeConditions.create(0, 100))
                ),
                faker.system.commonFileName('unknown'),
                faker.number.int()
              )).toThrowError(UknownFileTypeError)
          })

          it('check unknown content type', async () => {
            expect(() =>
              new Upload().create(
                faker.string.uuid(),
                faker.string.uuid(),
                FilesBucket.create(
                  FilesBucketType.PUBLIC,
                  faker.word.sample(),
                  faker.word.sample(),
                  faker.system.directoryPath(),

                  FilesBucketConditions.create('image/*', FilesBucketSizeConditions.create(0, 100))
                ),
                faker.system.commonFileName('xls'),
                faker.number.int()
              )).toThrowError(InvalidContentTypeError)
          })

          it('check unknown content size', async () => {
            expect(() =>
              new Upload().create(
                faker.string.uuid(),
                faker.string.uuid(),
                FilesBucket.create(
                  FilesBucketType.PUBLIC,
                  faker.word.sample(),
                  faker.word.sample(),
                  faker.system.directoryPath(),

                  FilesBucketConditions.create('image/*', FilesBucketSizeConditions.create(0, 100))
                ),
                faker.system.commonFileName('png'),
                faker.number.int({ min: 200 })
              )).toThrowError(InvalidContentSizeError)
          })

          it('check create', async () => {
            const uploadId = faker.string.uuid()
            const ownerId = faker.string.uuid()
            const name = faker.system.commonFileName('png')
            const filename = `${uploadId}.png`
            const size = faker.number.int({ min: 1, max: 99 })

            const bucket = FilesBucket.create(
              FilesBucketType.PUBLIC,
              faker.word.sample(),
              faker.word.sample(),
              faker.system.directoryPath(),

              FilesBucketConditions.create('image/*', FilesBucketSizeConditions.create(0, 100))
            )

            const upload = new Upload().create(uploadId, ownerId, bucket, name, size)

            expect(upload.getUncommittedEvents()).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  uploadId,
                  ownerId,
                  filename,
                  name,
                  size,
                }),
              ])
            )

            expect(upload).toEqual(
              expect.objectContaining({
                id: uploadId,
                ownerId,
                filename,
                name,
                size,
              })
            )
          })
        })

        describe('prepare', () => {
          it('check prepare', async () => {
            const url = faker.image.urlPlaceholder()

            const upload = new Upload().create(
              faker.string.uuid(),
              faker.string.uuid(),
              FilesBucket.create(
                FilesBucketType.PUBLIC,
                faker.word.sample(),
                faker.word.sample(),
                faker.system.directoryPath(),

                FilesBucketConditions.create('image/*', FilesBucketSizeConditions.create(0, 100))
              ),
              faker.system.commonFileName('png'),
              faker.number.int({ min: 1, max: 99 })
            )

            upload.commit()
            upload.prepare(url)

            expect(upload.getUncommittedEvents()).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  uploadId: upload.id,
                  url,
                }),
              ])
            )

            expect(upload).toEqual(
              expect.objectContaining({
                url,
              })
            )
          })
        })

        describe('confirm', () => {
          it('check url', async () => {
            expect(() =>
              new Upload().confirm(
                faker.string.uuid(),
                StorageFileMetadata.create(faker.image.urlPlaceholder(), 206, 'image/png')
              )).toThrowError(UploadNotReadyError)
          })

          it('check match initiator', async () => {
            const upload = new Upload()
              .create(
                faker.string.uuid(),
                faker.string.uuid(),
                FilesBucket.create(
                  FilesBucketType.PUBLIC,
                  faker.word.sample(),
                  faker.word.sample(),
                  faker.system.directoryPath(),

                  FilesBucketConditions.create('image/*', FilesBucketSizeConditions.create(0, 100))
                ),
                faker.system.commonFileName('png'),
                faker.number.int({ min: 1, max: 99 })
              )
              .prepare(faker.image.urlPlaceholder())

            expect(() =>
              upload.confirm(
                faker.string.uuid(),
                StorageFileMetadata.create(faker.image.urlPlaceholder(), 206, 'image/png')
              )).toThrowError(UploadInitiatorDoesNotMatch)
          })

          it('check file uploaded', async () => {
            const upload = new Upload()
              .create(
                faker.string.uuid(),
                faker.string.uuid(),
                FilesBucket.create(
                  FilesBucketType.PUBLIC,
                  faker.word.sample(),
                  faker.word.sample(),
                  faker.system.directoryPath(),

                  FilesBucketConditions.create('image/*', FilesBucketSizeConditions.create(0, 100))
                ),
                faker.system.commonFileName('png'),
                faker.number.int({ min: 1, max: 99 })
              )
              .prepare(faker.image.urlPlaceholder())

            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            expect(() => upload.confirm(upload.ownerId, undefined as any)).toThrowError(
              FileNotUploadedError
            )
          })

          it('check confirm', async () => {
            const upload = new Upload()
              .create(
                faker.string.uuid(),
                faker.string.uuid(),
                FilesBucket.create(
                  FilesBucketType.PUBLIC,
                  faker.word.sample(),
                  faker.word.sample(),
                  faker.system.directoryPath(),

                  FilesBucketConditions.create('image/*', FilesBucketSizeConditions.create(0, 100))
                ),
                faker.system.commonFileName('png'),
                faker.number.int({ min: 1, max: 99 })
              )
              .prepare(faker.image.urlPlaceholder())

            upload.commit()
            upload.confirm(
              upload.ownerId,
              StorageFileMetadata.create(faker.image.urlPlaceholder(), 206, 'image/png')
            )

            expect(upload.getUncommittedEvents()).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  uploadId: upload.id,
                }),
              ])
            )

            expect(upload).toEqual(
              expect.objectContaining({
                confirmed: true,
              })
            )
          })

          it('check already confirmed', async () => {
            const upload = new Upload()
              .create(
                faker.string.uuid(),
                faker.string.uuid(),
                FilesBucket.create(
                  FilesBucketType.PUBLIC,
                  faker.word.sample(),
                  faker.word.sample(),
                  faker.system.directoryPath(),

                  FilesBucketConditions.create('image/*', FilesBucketSizeConditions.create(0, 100))
                ),
                faker.system.commonFileName('png'),
                faker.number.int({ min: 1, max: 99 })
              )
              .prepare(faker.image.urlPlaceholder())

            upload.confirm(
              upload.ownerId,
              StorageFileMetadata.create(faker.image.urlPlaceholder(), 206, 'image/png')
            )

            expect(() =>
              upload.confirm(
                upload.ownerId,
                StorageFileMetadata.create(faker.image.urlPlaceholder(), 206, 'image/png')
              )).toThrowError(UploadAlreadyConfirmedError)
          })
        })
      })
    })
  })
})
