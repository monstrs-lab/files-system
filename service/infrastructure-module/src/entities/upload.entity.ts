import type { FilesBucket } from '@files-system/domain-module'

import { Entity }           from '@mikro-orm/core'
import { Property }         from '@mikro-orm/core'
import { PrimaryKey }       from '@mikro-orm/core'
import { BaseEntity }       from '@mikro-orm/core'

@Entity({ tableName: 'uploads' })
export class UploadEntity extends BaseEntity<UploadEntity, 'id'> {
  @PrimaryKey({ type: 'uuid' })
  id!: string

  @Property({ type: 'uuid' })
  ownerId!: string

  @Property({ type: 'jsonb' })
  bucket!: FilesBucket

  @Property()
  filename!: string

  @Property()
  contentType!: string

  @Property()
  name!: string

  @Property()
  size!: number

  @Property({ length: 2048 })
  url!: string

  @Property()
  confirmed!: boolean
}
