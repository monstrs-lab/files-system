import { Entity }          from '@mikro-orm/core'
import { Property }        from '@mikro-orm/core'
import { PrimaryKey }      from '@mikro-orm/core'
import { Enum }            from '@mikro-orm/core'
import { BaseEntity }      from '@mikro-orm/core'

import { FilesBucketType } from '@files-system/domain-module'

@Entity({ tableName: 'files' })
export class FileEntity extends BaseEntity<FileEntity, 'id'> {
  @PrimaryKey({ type: 'uuid' })
  id!: string

  @Enum({ items: () => FilesBucketType, type: 'smallint', default: FilesBucketType.PRIVATE })
  type: FilesBucketType = FilesBucketType.PRIVATE

  @Property({ type: 'uuid' })
  ownerId!: string

  @Property({ length: 2048 })
  url!: string

  @Property()
  bucket!: string
}
