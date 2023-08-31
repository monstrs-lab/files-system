import { Guard }                       from '@monstrs/guard-clause'
import { Against }                     from '@monstrs/guard-clause'

import { FilesBucketLengthConditions } from './files-bucket-length-conditions.value-object.js'

export class FilesBucketConditions {
  #type!: string

  #length!: FilesBucketLengthConditions

  get type(): string {
    return this.#type
  }

  private set type(type: string) {
    this.#type = type
  }

  get length(): FilesBucketLengthConditions {
    return this.#length
  }

  private set length(length: FilesBucketLengthConditions) {
    this.#length = length
  }

  @Guard()
  static create(
    @Against('type').Empty() type: string,
    @Against('length').NotInstance(FilesBucketLengthConditions) length: FilesBucketLengthConditions
  ): FilesBucketConditions {
    const filesBucketConditions = new FilesBucketConditions()

    filesBucketConditions.type = type
    filesBucketConditions.length = length

    return filesBucketConditions
  }
}
