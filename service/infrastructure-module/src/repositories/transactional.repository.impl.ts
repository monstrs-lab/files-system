import type { File }                                from '@files-system/domain-module'
import type { Upload }                              from '@files-system/domain-module'
import type { RecordMetadata }                      from '@monstrs/nestjs-cqrs-kafka-events'
import type { IEvent }                              from '@nestjs/cqrs'

import { EntityRepository }                         from '@mikro-orm/core'
import { EntityManager }                            from '@mikro-orm/core'
import { InjectRepository }                         from '@mikro-orm/nestjs'
import { EntityManager as PostgreSqlEntityManager } from '@mikro-orm/postgresql'
import { Injectable }                               from '@nestjs/common'
import { Inject }                                   from '@nestjs/common'
import { EventBus }                                 from '@nestjs/cqrs'

import { TransactionalRepository }                  from '@files-system/domain-module'

import { FileEntity }                               from '../entities/index.js'
import { UploadEntity }                             from '../entities/index.js'
import { FileMapper }                               from '../mappers/index.js'
import { UploadMapper }                             from '../mappers/index.js'

@Injectable()
export class TransactionalRepositoryImpl extends TransactionalRepository {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: EntityRepository<FileEntity>,
    @InjectRepository(UploadEntity)
    private readonly uploadRepository: EntityRepository<UploadEntity>,
    @Inject(EntityManager)
    private readonly em: PostgreSqlEntityManager,
    private readonly eventBus: EventBus,
    private readonly uploadMapper: UploadMapper,
    private readonly fileMapper: FileMapper
  ) {
    super()
  }

  override async saveUploadAndFile(upload: Upload, file: File): Promise<void> {
    const uploadEntity = (await this.uploadRepository.findOne(upload.id)) || new UploadEntity()
    const fileEntity = (await this.fileRepository.findOne(file.id)) || new FileEntity()

    const em = this.em.fork()

    await em.begin()

    try {
      em.persist(this.uploadMapper.toPersistence(upload, uploadEntity))
      em.persist(this.fileMapper.toPersistence(file, fileEntity))

      await this.eventBus.publishAll<IEvent, Promise<Array<RecordMetadata>>>([
        ...upload.getUncommittedEvents(),
        ...file.getUncommittedEvents(),
      ])

      upload.commit()
      file.commit()

      await em.commit()
    } catch (error) {
      await em.rollback()

      throw error
    }
  }
}
