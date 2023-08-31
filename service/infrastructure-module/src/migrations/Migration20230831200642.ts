import { Migration } from '@mikro-orm/migrations'

export class Migration20230831200642 extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table "uploads" add column "content_type" varchar(255) not null;')
  }

  override async down(): Promise<void> {
    this.addSql('alter table "uploads" drop column "content_type";')
  }
}
