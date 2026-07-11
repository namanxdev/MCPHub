CREATE TABLE IF NOT EXISTS "server_scans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "server_id" uuid,
  "target" text NOT NULL,
  "score" integer NOT NULL,
  "grade" text NOT NULL,
  "tools_count" integer DEFAULT 0 NOT NULL,
  "findings" jsonb NOT NULL,
  "scanned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tool_baselines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "target" text NOT NULL,
  "tool_name" text NOT NULL,
  "hash" text NOT NULL,
  "captured_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "server_scans" ADD CONSTRAINT "server_scans_server_id_servers_id_fk"
    FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_scans_server" ON "server_scans" ("server_id","scanned_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_scans_target" ON "server_scans" ("target");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_baselines_target_tool" ON "tool_baselines" ("target","tool_name");
