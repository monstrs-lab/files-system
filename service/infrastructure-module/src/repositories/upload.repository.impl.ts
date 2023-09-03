import type { Upload }                              from '@files-system/domain-module'

import { Inject }                                   from '@nestjs/common'
import { Injectable }                               from '@nestjs/common'
import { EventBus }                                 from '@nestjs/cqrs'
import { InjectRepository }                         from '@mikro-orm/nestjs'
import { EntityRepository }                         from '@mikro-orm/core'
import { EntityManager as PostgreSqlEntityManager } from '@mikro-orm/postgresql'
import { EntityManager }                            from '@mikro-orm/core'

import { UploadRepository }                         from '@files-system/domain-module'

import { UploadEntity }                             from '../entities/index.js'
import { UploadMapper }                             from '../mappers/index.js'

@Injectable()
export class UploadRepositoryImpl extends UploadRepository {
  constructor(
    @InjectRepository(UploadEntity)
    private readonly repository: EntityRepository<UploadEntity>,
    @Inject(EntityManager)
    private readonly em: PostgreSqlEntityManager,
    private readonly eventBus: EventBus,
    private readonly mapper: UploadMapper
  ) {
    super()
  }

  async save(aggregate: Upload): Promise<void> {
    const exists = (await this.repository.findOne(aggregate.id)) || new UploadEntity()

    const em = this.em.fork()

    await em.begin()

    try {
      await em.persist(this.mapper.toPersistence(aggregate, exists)).flush()

      if (aggregate.getUncommittedEvents().length > 0) {
        this.eventBus.publishAll(aggregate.getUncommittedEvents())
      }

      aggregate.commit()

      await em.commit()
    } catch (error) {
      await em.rollback()

      throw error
    }
  }

  async findById(id: string): Promise<Upload | undefined> {
    const entity = await this.repository.findOne({
      id,
    })

    return entity ? this.mapper.toDomain(entity) : undefined
  }
}
