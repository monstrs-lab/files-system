import { Migration } from '@mikro-orm/migrations'

export class Migration20230902084941 extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table "files" drop column "name";')
  }

  override async down(): Promise<void> {
    this.addSql('alter table "files" add column "name" varchar(255) not null;')
  }
}
