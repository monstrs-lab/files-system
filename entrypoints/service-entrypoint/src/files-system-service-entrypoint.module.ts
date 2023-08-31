import { Module }                      from '@nestjs/common'
import { MicroservisesRegistryModule } from '@monstrs/nestjs-microservices-registry'

@Module({
  imports: [MicroservisesRegistryModule.register()],
})
export class FilesSystemServiceEntrypointModule {}
