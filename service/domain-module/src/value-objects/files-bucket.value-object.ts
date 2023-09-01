import { Guard }                 from '@monstrs/guard-clause'
import { Against }               from '@monstrs/guard-clause'

import { FilesBucketType }       from '../enums/index.js'
import { FilesBucketConditions } from './files-bucket-conditions.value-object.js'

export class FilesBucket {
  #type!: FilesBucketType

  #name!: string

  #bucket!: string

  #path!: string

  #conditions!: FilesBucketConditions

  get type(): FilesBucketType {
    return this.#type
  }

  private set type(type: FilesBucketType) {
    this.#type = type
  }

  get name(): string {
    return this.#name
  }

  private set name(name: string) {
    this.#name = name
  }

  get bucket(): string {
    return this.#bucket
  }

  private set bucket(bucket: string) {
    this.#bucket = bucket
  }

  get path(): string {
    return this.#path
  }

  private set path(path: string) {
    this.#path = path
  }

  get conditions(): FilesBucketConditions {
    return this.#conditions
  }

  private set conditions(conditions: FilesBucketConditions) {
    this.#conditions = conditions
  }

  @Guard()
  static create(
    @Against('type').NotEnum(FilesBucketType) type: FilesBucketType,
    @Against('name').Empty() name: string,
    @Against('bucket').Empty() bucket: string,
    @Against('path').Empty() path: string,
    @Against('conditions').NotInstance(FilesBucketConditions) conditions: FilesBucketConditions
  ): FilesBucket {
    const filesBucket = new FilesBucket()

    filesBucket.type = type
    filesBucket.name = name
    filesBucket.bucket = bucket
    filesBucket.path = path
    filesBucket.conditions = conditions

    return filesBucket
  }
}
