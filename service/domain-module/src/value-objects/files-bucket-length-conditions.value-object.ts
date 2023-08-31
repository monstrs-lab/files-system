import { Guard }   from '@monstrs/guard-clause'
import { Against } from '@monstrs/guard-clause'

export class FilesBucketLengthConditions {
  #min!: number

  #max!: number

  get min(): number {
    return this.#min
  }

  private set min(min: number) {
    this.#min = min
  }

  get max(): number {
    return this.#max
  }

  private set max(max: number) {
    this.#max = max
  }

  @Guard()
  static create(
    @Against('min').NotNumberBetween(0, Infinity) min: number,
    @Against('max').NotNumberBetween(0, Infinity) max: number
  ): FilesBucketLengthConditions {
    const filesBucketLengthConditions = new FilesBucketLengthConditions()

    filesBucketLengthConditions.min = min
    filesBucketLengthConditions.max = max

    return filesBucketLengthConditions
  }
}
