import { Injectable } from '@nestjs/common'

import { File }       from '../aggregates/index.js'

@Injectable()
export class FileFactory {
  create(): File {
    return new File()
  }
}
