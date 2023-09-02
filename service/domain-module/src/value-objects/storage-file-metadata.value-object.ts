import { Guard }   from '@monstrs/guard-clause'
import { Against } from '@monstrs/guard-clause'

export class StorageFileMetadata {
  #url!: string

  #size!: number

  #contentType!: string

  get url(): string {
    return this.#url
  }

  private set url(url: string) {
    this.#url = url
  }

  get size(): number {
    return this.#size
  }

  private set size(size: number) {
    this.#size = size
  }

  get contentType(): string {
    return this.#contentType
  }

  private set contentType(contentType: string) {
    this.#contentType = contentType
  }

  @Guard()
  static create(
    @Against('url').Empty() url: string,
    @Against('size').NotNumberBetween(0, Infinity) size: number,
    @Against('contentType').Empty() contentType: string
  ): StorageFileMetadata {
    const storageFileMetadata = new StorageFileMetadata()

    storageFileMetadata.url = url
    storageFileMetadata.size = size
    storageFileMetadata.contentType = contentType

    return storageFileMetadata
  }
}
