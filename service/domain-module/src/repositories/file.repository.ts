import type { Query } from '@monstrs/query-types'

import type { File }  from '../aggregates/index.js'

export interface FilesQuery {
  id?: Query.IDType
  ownerId?: Query.IDType
}

export interface FindFilesByQuery {
  pager?: Query.Pager
  order?: Query.Order
  query?: FilesQuery
}

export interface FindFilesByQueryResult {
  files: Array<File>
  hasNextPage: boolean
}

export abstract class FileRepository {
  abstract save(aggregate: File): Promise<void>

  abstract findById(id: string): Promise<File | undefined>

  abstract findByQuery(query: FindFilesByQuery): Promise<FindFilesByQueryResult>
}
