import { NestLogger }                         from '@monstrs/nestjs-logger'
import { NestFactory }                        from '@nestjs/core'

import { MicroservisesRegistry }              from '@files-system/infrastructure-module'

import { FilesSystemServiceEntrypointModule } from './files-system-service-entrypoint.module.js'

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(FilesSystemServiceEntrypointModule, {
    logger: new NestLogger(),
  })

  app.enableShutdownHooks()

  app
    .get<typeof MicroservisesRegistry>(MicroservisesRegistry, { strict: false })
    .connect(app, { inheritAppConfig: true })

  await app.startAllMicroservices()
  await app.listen(3000)

  if (import.meta.webpackHot) {
    import.meta.webpackHot.accept()
    import.meta.webpackHot.dispose(() => {
      app.close()
    })
  }
}

bootstrap()
