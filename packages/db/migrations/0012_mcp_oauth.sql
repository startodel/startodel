CREATE TABLE "oauth_clients" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text,
	"redirect_uris" text[] NOT NULL,
	"auth_method" text NOT NULL,
	"secret_hash" text
);
--> statement-breakpoint
CREATE TABLE "oauth_connections" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"redirect_uri" text NOT NULL,
	"resource" text NOT NULL,
	"challenge" text NOT NULL,
	"code_hash" text NOT NULL,
	"code_expires_at" timestamp with time zone DEFAULT now() + interval '5 minutes' NOT NULL,
	"exchanged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "oauth_connections_code_hash_unique" UNIQUE("code_hash"),
	CONSTRAINT "oauth_connections_user_id_id_unique" UNIQUE("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "oauth_refresh_tokens" (
	"hash" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"rotated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "oauth_requests" (
	"hash" text PRIMARY KEY NOT NULL,
	"client_id" uuid NOT NULL,
	"redirect_uri" text NOT NULL,
	"resource" text NOT NULL,
	"challenge" text NOT NULL,
	"state" text,
	"expires_at" timestamp with time zone DEFAULT now() + interval '15 minutes' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "oauth_connections" ADD CONSTRAINT "oauth_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_connections" ADD CONSTRAINT "oauth_connections_client_id_oauth_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "oauth_refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "oauth_refresh_tokens_user_id_connection_id_oauth_connections_user_id_id_fk" FOREIGN KEY ("user_id","connection_id") REFERENCES "public"."oauth_connections"("user_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_requests" ADD CONSTRAINT "oauth_requests_client_id_oauth_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth_clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_refresh_current" ON "oauth_refresh_tokens" USING btree ("connection_id") WHERE "oauth_refresh_tokens"."rotated_at" is null;--> statement-breakpoint
CREATE INDEX "oauth_requests_expiry" ON "oauth_requests" USING btree ("expires_at");