CREATE TABLE "rsvps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"attending" boolean NOT NULL,
	"guest_count" integer DEFAULT 1 NOT NULL,
	"dietary_notes" text,
	"token" text NOT NULL,
	"reminder_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rsvps_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "rsvp_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;