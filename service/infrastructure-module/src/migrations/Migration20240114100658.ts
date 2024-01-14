import { Migration } from '@mikro-orm/migrations'

export class Migration20240114100658 extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table "files" add column "bucket" varchar(255) not null default \'-\';')
  }

  override async down(): Promise<void> {
    this.addSql('alter table "files" drop column "bucket";')
  }
}
