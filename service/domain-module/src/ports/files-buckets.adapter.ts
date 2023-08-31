import type { FilesBucket } from '../value-objects/index.js'

export abstract class FilesBucketsAdapter {
  abstract toFilesBucket(name: string): FilesBucket | undefined
}
