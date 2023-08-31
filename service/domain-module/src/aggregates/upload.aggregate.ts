/// <reference path="../types/mime-match.d.ts" />

import type { FilesBucket }            from '../value-objects/index.js'
import type { FilesStorageAdapter }    from '../ports/index.js'
import type { FilesBucketsAdapter }    from '../ports/index.js'

import { extname }                     from 'node:path'
import { format }                      from 'node:path'
import { join }                        from 'node:path'
import { relative }                    from 'node:path'
import { format as formatUrl }         from 'node:url'

import { AggregateRoot }               from '@nestjs/cqrs'
import { Guard }                       from '@monstrs/guard-clause'
import { Against }                     from '@monstrs/guard-clause'
import match                           from 'mime-match'
import mime                            from 'mime-types'

import { UploadConfirmedEvent }        from '../events/index.js'
import { UploadCreatedEvent }          from '../events/index.js'
import { UknownFileBucketError }       from '../errors/index.js'
import { UknownFileTypeError }         from '../errors/index.js'
import { InvalidContentTypeError }     from '../errors/index.js'
import { InvalidContentLengthError }   from '../errors/index.js'
import { UploadNotFoundError }         from '../errors/index.js'
import { UploadAlreadyConfirmedError } from '../errors/index.js'
import { UploadInitiatorDoesNotMatch } from '../errors/index.js'
import { FileNotFoundError }           from '../errors/index.js'
import { File }                        from './file.aggregate.js'

export class Upload extends AggregateRoot {
  #id!: string

  #ownerId!: string

  #url!: string

  #name!: string

  #filename!: string

  #bucket!: FilesBucket

  #size!: number

  #confirmed: boolean = false

  constructor(
    private readonly buckets: FilesBucketsAdapter,
    private readonly storage: FilesStorageAdapter
  ) {
    super()
  }

  get id(): string {
    return this.#id
  }

  private set id(id: string) {
    this.#id = id
  }

  get ownerId(): string {
    return this.#ownerId
  }

  private set ownerId(ownerId: string) {
    this.#ownerId = ownerId
  }

  get url(): string {
    return this.#url
  }

  private set url(url: string) {
    this.#url = url
  }

  get name(): string {
    return this.#name
  }

  private set name(name: string) {
    this.#name = name
  }

  get filename(): string {
    return this.#filename
  }

  private set filename(filename: string) {
    this.#filename = filename
  }

  get bucket(): FilesBucket {
    return this.#bucket
  }

  private set bucket(bucket: FilesBucket) {
    this.#bucket = bucket
  }

  get size(): number {
    return this.#size
  }

  private set size(size: number) {
    this.#size = size
  }

  get confirmed(): boolean {
    return this.#confirmed
  }

  private set confirmed(confirmed: boolean) {
    this.#confirmed = confirmed
  }

  @Guard()
  async create(
    @Against('id').NotUUID(4) id: string,
    @Against('ownerId').NotUUID(4) ownerId: string,
    @Against('bucketName').Empty() bucketName: string,
    @Against('name').Empty() name: string,
    @Against('size').NotNumberBetween(0, Infinity) size: number
  ): Promise<Upload> {
    const bucket = this.buckets.get(bucketName)

    if (!bucket) {
      throw new UknownFileBucketError()
    }

    const contentType = mime.lookup(name)

    if (!contentType) {
      throw new UknownFileTypeError()
    }

    if (!match(contentType, bucket.conditions.type)) {
      throw new InvalidContentTypeError(contentType, bucket.conditions.type)
    }

    if (!(size > bucket.conditions.length.min && size < bucket.conditions.length.max)) {
      throw new InvalidContentLengthError(size, bucket.conditions.length)
    }

    const filename = format({
      name: bucket.path.startsWith('/')
        ? relative('/', join(bucket.path, id))
        : join(bucket.path, id),
      ext: extname(name),
    })

    const url = await this.storage.generateUploadUrl(bucket.bucket, filename, contentType, size)

    this.apply(new UploadCreatedEvent(id, ownerId, url, name, filename, bucket, size))

    return this
  }

  @Guard()
  async confirm(@Against('ownerId').NotUUID(4) ownerId: string): Promise<File> {
    if (!this.url) {
      throw new UploadNotFoundError()
    }

    if (this.confirmed) {
      throw new UploadAlreadyConfirmedError()
    }

    if (this.ownerId !== ownerId) {
      throw new UploadInitiatorDoesNotMatch()
    }

    const metadata = await this.storage.getMetadata(this.bucket.bucket, this.filename)

    if (!metadata) {
      throw new FileNotFoundError()
    }

    const signedReadUrl = await this.storage.generateReadUrl(
      this.bucket.bucket,
      this.filename,
      this.bucket.hostname
    )

    const parsedUrl = new URL(signedReadUrl)

    parsedUrl.search = ''

    const url = formatUrl(parsedUrl)

    this.apply(new UploadConfirmedEvent(this.id))

    const file = await File.create(
      this.id,
      this.ownerId,
      this.bucket.type,
      url,
      metadata.bucket,
      metadata.name,
      metadata.size || this.size,
      metadata.contentType,
      metadata.contentEncoding,
      metadata.contentLanguage,
      metadata.metadata
    )

    return file
  }

  protected onUploadCreatedEvent(event: UploadCreatedEvent): void {
    this.id = event.uploadId
    this.ownerId = event.ownerId
    this.url = event.url
    this.name = event.name
    this.filename = event.filename
    this.bucket = event.bucket
    this.size = event.size
  }

  protected onUploadConfirmedEvent(): void {
    this.confirmed = true
  }
}
