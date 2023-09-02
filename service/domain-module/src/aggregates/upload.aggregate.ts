/// <reference path="../types/mime-match.d.ts" />

import { format }                      from 'node:path'
import { extname }                     from 'node:path'

import { AggregateRoot }               from '@nestjs/cqrs'
import { Guard }                       from '@monstrs/guard-clause'
import { Against }                     from '@monstrs/guard-clause'
import match                           from 'mime-match'
import mime                            from 'mime-types'

import { StorageFileMetadata }         from '../value-objects/index.js'
import { FilesBucket }                 from '../value-objects/index.js'
import { UploadConfirmedEvent }        from '../events/index.js'
import { UploadPreparedEvent }         from '../events/index.js'
import { UploadCreatedEvent }          from '../events/index.js'
import { UknownFileTypeError }         from '../errors/index.js'
import { InvalidContentTypeError }     from '../errors/index.js'
import { InvalidContentSizeError }     from '../errors/index.js'
import { UploadNotReadyError }         from '../errors/index.js'
import { UploadAlreadyConfirmedError } from '../errors/index.js'
import { UploadInitiatorDoesNotMatch } from '../errors/index.js'
import { FileNotUploadedError }        from '../errors/index.js'
import { File }                        from './file.aggregate.js'

export class Upload extends AggregateRoot {
  #id!: string

  #ownerId!: string

  #bucket!: FilesBucket

  #filename!: string

  #contentType!: string

  #name!: string

  #size!: number

  #url!: string

  #confirmed: boolean = false

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

  get bucket(): FilesBucket {
    return this.#bucket
  }

  private set bucket(bucket: FilesBucket) {
    this.#bucket = bucket
  }

  get filename(): string {
    return this.#filename
  }

  private set filename(filename: string) {
    this.#filename = filename
  }

  get contentType(): string {
    return this.#contentType
  }

  private set contentType(contentType: string) {
    this.#contentType = contentType
  }

  get name(): string {
    return this.#name
  }

  private set name(name: string) {
    this.#name = name
  }

  get size(): number {
    return this.#size
  }

  private set size(size: number) {
    this.#size = size
  }

  get url(): string {
    return this.#url
  }

  private set url(url: string) {
    this.#url = url
  }

  get confirmed(): boolean {
    return this.#confirmed
  }

  private set confirmed(confirmed: boolean) {
    this.#confirmed = confirmed
  }

  @Guard()
  create(
    @Against('id').NotUUID(4) id: string,
    @Against('ownerId').NotUUID(4) ownerId: string,
    @Against('bucket').NotInstance(FilesBucket) bucket: FilesBucket,
    @Against('name').Empty() name: string,
    @Against('size').NotNumberBetween(0, Infinity) size: number
  ): Upload {
    const contentType = mime.lookup(name)

    if (!contentType) {
      throw new UknownFileTypeError()
    }

    if (!match(contentType, bucket.conditions.type)) {
      throw new InvalidContentTypeError(contentType, bucket.conditions.type)
    }

    if (!(size > bucket.conditions.size.min && size < bucket.conditions.size.max)) {
      throw new InvalidContentSizeError(size, bucket.conditions.size)
    }

    const filename = format({ name: id, ext: extname(name) })

    this.apply(new UploadCreatedEvent(id, ownerId, bucket, filename, contentType, name, size))

    return this
  }

  @Guard()
  prepare(@Against('url').Empty() url: string): Upload {
    if (this.confirmed) {
      throw new UploadAlreadyConfirmedError()
    }

    this.apply(new UploadPreparedEvent(this.id, url))

    return this
  }

  @Guard()
  confirm(
    @Against('ownerId').NotUUID(4) ownerId: string,
    @Against('metadadta').Optional.NotInstance(StorageFileMetadata) metadata: StorageFileMetadata
  ): File {
    if (this.confirmed) {
      throw new UploadAlreadyConfirmedError()
    }

    if (!this.url) {
      throw new UploadNotReadyError()
    }

    if (this.ownerId !== ownerId) {
      throw new UploadInitiatorDoesNotMatch()
    }

    if (!metadata) {
      throw new FileNotUploadedError()
    }

    this.apply(new UploadConfirmedEvent(this.id))

    return File.create(this.id, this.ownerId, this.bucket.type, metadata.url || this.url)
  }

  protected onUploadCreatedEvent(event: UploadCreatedEvent): void {
    this.id = event.uploadId
    this.ownerId = event.ownerId
    this.bucket = event.bucket
    this.filename = event.filename
    this.contentType = event.contentType
    this.name = event.name
    this.size = event.size
  }

  protected onUploadPreparedEvent(event: UploadPreparedEvent): void {
    this.url = event.url
  }

  protected onUploadConfirmedEvent(): void {
    this.confirmed = true
  }
}
