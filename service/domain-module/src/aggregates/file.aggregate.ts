import { AggregateRoot }    from '@nestjs/cqrs'
import { Guard }            from '@monstrs/guard-clause'
import { Against }          from '@monstrs/guard-clause'

import { FilesBucketType }  from '../enums/index.js'
import { FileCreatedEvent } from '../events/index.js'

export class File extends AggregateRoot {
  #id!: string

  #ownerId!: string

  #type!: FilesBucketType

  #url!: string

  #bucket!: string

  #name!: string

  #size!: number

  #contentType?: string

  #contentEncoding?: string

  #contentLanguage?: string

  #metadata?: Record<string, string>

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

  get type(): FilesBucketType {
    return this.#type
  }

  private set type(type: FilesBucketType) {
    this.#type = type
  }

  get url(): string {
    return this.#url
  }

  private set url(url: string) {
    this.#url = url
  }

  get bucket(): string {
    return this.#bucket
  }

  private set bucket(bucket: string) {
    this.#bucket = bucket
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

  get contentType(): string | undefined {
    return this.#contentType
  }

  private set contentType(contentType: string | undefined) {
    this.#contentType = contentType
  }

  get contentEncoding(): string | undefined {
    return this.#contentEncoding
  }

  private set contentEncoding(contentEncoding: string | undefined) {
    this.#contentEncoding = contentEncoding
  }

  get contentLanguage(): string | undefined {
    return this.#contentLanguage
  }

  private set contentLanguage(contentLanguage: string | undefined) {
    this.#contentLanguage = contentLanguage
  }

  get metadata(): Record<string, string> | undefined {
    return this.#metadata
  }

  private set metadata(metadata: Record<string, string> | undefined) {
    this.#metadata = metadata
  }

  @Guard()
  static create(
    @Against('id').NotUUID(4) id: string,
    @Against('ownerId').NotUUID(4) ownerId: string,
    @Against('type').NotEnum(FilesBucketType) type: FilesBucketType,
    @Against('url').Empty() url: string,
    @Against('bucket').Empty() bucket: string,
    @Against('name').Empty() name: string,
    @Against('size').NotNumberBetween(0, Infinity) size: number,
    contentType?: string,
    contentEncoding?: string,
    contentLanguage?: string,
    metadata?: Record<string, string>
  ): File {
    const file = new File()

    file.apply(
      new FileCreatedEvent(
        id,
        ownerId,
        type,
        url,
        bucket,
        name,
        size,
        contentType,
        contentEncoding,
        contentLanguage,
        metadata
      )
    )

    return file
  }

  protected onFileCreatedEvent(event: FileCreatedEvent): void {
    this.id = event.fileId
    this.ownerId = event.ownerId
    this.type = event.type
    this.url = event.url
    this.bucket = event.bucket
    this.name = event.name
    this.size = event.size
    this.contentType = event.contentType
    this.contentEncoding = event.contentEncoding
    this.contentLanguage = event.contentLanguage
    this.metadata = event.metadata
  }
}
