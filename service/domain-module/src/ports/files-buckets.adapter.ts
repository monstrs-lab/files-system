import type { FilesBucket } from '../value-objects/index.js'

export abstract class FilesBucketsAdapter {
  abstract get(name: string): FilesBucket | undefined
}
