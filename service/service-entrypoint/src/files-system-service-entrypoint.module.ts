import { MicroservisesRegistryModule }     from '@monstrs/nestjs-microservices-registry'
import { Module }                          from '@nestjs/common'

import { FilesSystemApplicationModule }    from '@files-system/application-module'
import { FilesSystemInfrastructureModule } from '@files-system/infrastructure-module'

@Module({
  imports: [
    MicroservisesRegistryModule.register(),
    FilesSystemApplicationModule.register(),
    FilesSystemInfrastructureModule.register(),
  ],
})
export class FilesSystemServiceEntrypointModule {}
