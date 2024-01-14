import { Guard }            from '@monstrs/guard-clause'
import { Against }          from '@monstrs/guard-clause'
import { AggregateRoot }    from '@nestjs/cqrs'

import { FilesBucketType }  from '../enums/index.js'
import { FileCreatedEvent } from '../events/index.js'

export class File extends AggregateRoot {
  #id!: string

  #ownerId!: string

  #type!: FilesBucketType

  #url!: string

  #bucket!: string

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

  @Guard()
  static create(
    @Against('id').NotUUID(4) id: string,
    @Against('ownerId').NotUUID(4) ownerId: string,
    @Against('type').NotEnum(FilesBucketType) type: FilesBucketType,
    @Against('url').Empty() url: string,
    @Against('bucket').Empty() bucket: string
  ): File {
    const file = new File()

    file.apply(new FileCreatedEvent(id, ownerId, type, url, bucket))

    return file
  }

  protected onFileCreatedEvent(event: FileCreatedEvent): void {
    this.id = event.fileId
    this.ownerId = event.ownerId
    this.type = event.type
    this.url = event.url
    this.bucket = event.bucket
  }
}
