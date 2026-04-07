CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"url_hash" text NOT NULL,
	"title" text NOT NULL,
	"source_id" text NOT NULL,
	"series" text[] DEFAULT '{}' NOT NULL,
	"published_at" timestamp with time zone,
	"scraped_at" timestamp with time zone DEFAULT now() NOT NULL,
	"summary" text,
	"image_url" text,
	"is_breaking" boolean DEFAULT false NOT NULL,
	"cluster_id" uuid,
	"embedding" vector(768)
);
--> statement-breakpoint
CREATE TABLE "clusters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"representative_article_id" uuid,
	"series" text NOT NULL,
	"article_count" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"series" text NOT NULL,
	"event_name" text NOT NULL,
	"circuit_name" text NOT NULL,
	"country" text NOT NULL,
	"country_code" text NOT NULL,
	"timezone" text NOT NULL,
	"season" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"type" text NOT NULL,
	"content" jsonb NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_articles" (
	"user_id" text NOT NULL,
	"article_id" uuid NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_articles_user_id_article_id_pk" PRIMARY KEY("user_id","article_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"type" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"estimated_duration_minutes" integer
);
--> statement-breakpoint
CREATE TABLE "social_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text DEFAULT 'x' NOT NULL,
	"author_handle" text NOT NULL,
	"author_display_name" text NOT NULL,
	"author_type" text NOT NULL,
	"content" text NOT NULL,
	"url" text NOT NULL,
	"series" text[] DEFAULT '{}' NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"scraped_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_breaking" boolean DEFAULT false NOT NULL,
	"media_urls" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"domain" text NOT NULL,
	"favicon_url" text,
	"tier" integer DEFAULT 1 NOT NULL,
	"series" text[] DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_layouts" (
	"user_id" text PRIMARY KEY NOT NULL,
	"layout" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"series_order" text[] DEFAULT '{}' NOT NULL,
	"notification_prefs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"theme" text DEFAULT 'dark' NOT NULL,
	"push_token" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "x_accounts" (
	"handle" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"account_type" text NOT NULL,
	"series" text[] DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_cluster_id_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."clusters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_updates" ADD CONSTRAINT "live_updates_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_articles" ADD CONSTRAINT "saved_articles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_articles" ADD CONSTRAINT "saved_articles_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_layouts" ADD CONSTRAINT "user_layouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "articles_url_hash_idx" ON "articles" USING btree ("url_hash");--> statement-breakpoint
CREATE INDEX "articles_series_published_idx" ON "articles" USING btree ("series","published_at");--> statement-breakpoint
CREATE INDEX "articles_cluster_idx" ON "articles" USING btree ("cluster_id");--> statement-breakpoint
CREATE INDEX "articles_breaking_idx" ON "articles" USING btree ("is_breaking","scraped_at");--> statement-breakpoint
CREATE INDEX "clusters_series_created_idx" ON "clusters" USING btree ("series","created_at");--> statement-breakpoint
CREATE INDEX "events_series_season_idx" ON "events" USING btree ("series","season");--> statement-breakpoint
CREATE INDEX "live_updates_session_time_idx" ON "live_updates" USING btree ("session_id","timestamp");--> statement-breakpoint
CREATE INDEX "sessions_starts_at_status_idx" ON "sessions" USING btree ("starts_at","status");--> statement-breakpoint
CREATE INDEX "sessions_event_idx" ON "sessions" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "social_posts_url_idx" ON "social_posts" USING btree ("url");--> statement-breakpoint
CREATE INDEX "social_posts_author_published_idx" ON "social_posts" USING btree ("author_handle","published_at");--> statement-breakpoint
CREATE INDEX "social_posts_series_published_idx" ON "social_posts" USING btree ("series","published_at");