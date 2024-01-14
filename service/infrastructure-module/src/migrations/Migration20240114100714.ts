import { Migration } from '@mikro-orm/migrations'

export class Migration20240114100714 extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table "files" alter column "bucket" drop default;')
    this.addSql(
      'alter table "files" alter column "bucket" type varchar(255) using ("bucket"::varchar(255));'
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      'alter table "files" alter column "bucket" type varchar(255) using ("bucket"::varchar(255));'
    )
    this.addSql('alter table "files" alter column "bucket" set default \'-\';')
  }
}
