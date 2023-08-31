import { Guard }                     from '@monstrs/guard-clause'
import { Against }                   from '@monstrs/guard-clause'

import { FilesBucketSizeConditions } from './files-bucket-size-conditions.value-object.js'

export class FilesBucketConditions {
  #type!: string

  #size!: FilesBucketSizeConditions

  get type(): string {
    return this.#type
  }

  private set type(type: string) {
    this.#type = type
  }

  get size(): FilesBucketSizeConditions {
    return this.#size
  }

  private set size(size: FilesBucketSizeConditions) {
    this.#size = size
  }

  @Guard()
  static create(
    @Against('type').Empty() type: string,
    @Against('size').NotInstance(FilesBucketSizeConditions) size: FilesBucketSizeConditions
  ): FilesBucketConditions {
    const filesBucketConditions = new FilesBucketConditions()

    filesBucketConditions.type = type
    filesBucketConditions.size = size

    return filesBucketConditions
  }
}
