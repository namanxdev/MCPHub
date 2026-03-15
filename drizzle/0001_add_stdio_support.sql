-- Add stdio/local server support columns
ALTER TABLE "servers" ADD COLUMN IF NOT EXISTS "server_type" text NOT NULL DEFAULT 'hosted';
ALTER TABLE "servers" ADD COLUMN IF NOT EXISTS "command" text;
ALTER TABLE "servers" ADD COLUMN IF NOT EXISTS "required_env_vars" text[] NOT NULL DEFAULT '{}';

-- Make url nullable: drop the NOT NULL constraint and unique constraint, then re-add a partial unique index
ALTER TABLE "servers" ALTER COLUMN "url" DROP NOT NULL;
ALTER TABLE "servers" DROP CONSTRAINT IF EXISTS "servers_url_unique";
CREATE UNIQUE INDEX IF NOT EXISTS "idx_servers_url_unique" ON "servers" ("url") WHERE "url" IS NOT NULL;
