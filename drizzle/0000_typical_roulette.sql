CREATE TABLE "server_health_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid,
	"is_reachable" boolean NOT NULL,
	"latency_ms" integer,
	"tools_count" integer,
	"error_message" text,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid,
	"server_url" text NOT NULL,
	"tool_name" text NOT NULL,
	"latency_ms" integer NOT NULL,
	"response_bytes" integer NOT NULL,
	"is_error" boolean DEFAULT false NOT NULL,
	"error_type" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"prompt_name" text NOT NULL,
	"description" text,
	"arguments" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"uri" text NOT NULL,
	"name" text,
	"description" text,
	"mime_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "server_tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"server_id" uuid NOT NULL,
	"tool_name" text NOT NULL,
	"description" text,
	"input_schema" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"url" text NOT NULL,
	"transport_type" text NOT NULL,
	"short_description" text NOT NULL,
	"long_description" text,
	"author_name" text NOT NULL,
	"author_url" text,
	"repo_url" text,
	"connection_guide" text,
	"categories" text[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"tools_count" integer DEFAULT 0 NOT NULL,
	"resources_count" integer DEFAULT 0 NOT NULL,
	"prompts_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "servers_slug_unique" UNIQUE("slug"),
	CONSTRAINT "servers_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "server_health_checks" ADD CONSTRAINT "server_health_checks_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_metrics" ADD CONSTRAINT "server_metrics_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_prompts" ADD CONSTRAINT "server_prompts_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_resources" ADD CONSTRAINT "server_resources_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server_tools" ADD CONSTRAINT "server_tools_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_health_checks_server" ON "server_health_checks" USING btree ("server_id","checked_at");--> statement-breakpoint
CREATE INDEX "idx_metrics_server_time" ON "server_metrics" USING btree ("server_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_metrics_server_tool" ON "server_metrics" USING btree ("server_id","tool_name");--> statement-breakpoint
CREATE INDEX "idx_server_prompts_server" ON "server_prompts" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "idx_server_resources_server" ON "server_resources" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "idx_server_tools_server" ON "server_tools" USING btree ("server_id");--> statement-breakpoint
CREATE INDEX "idx_servers_status" ON "servers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_servers_slug" ON "servers" USING btree ("slug");