import { Migration } from '@mikro-orm/migrations'

export class Migration20230831193126 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'create table "files" ("id" uuid not null, "type" smallint not null default 1, "owner_id" uuid not null, "name" varchar(255) not null, "url" varchar(2048) not null, constraint "files_pkey" primary key ("id"));'
    )

    this.addSql(
      'create table "uploads" ("id" uuid not null, "owner_id" uuid not null, "url" varchar(2048) not null, "name" varchar(255) not null, "filename" varchar(255) not null, "bucket" jsonb not null, "size" int not null, "confirmed" boolean not null, constraint "uploads_pkey" primary key ("id"));'
    )
  }
}
