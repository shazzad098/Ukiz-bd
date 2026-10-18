CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event" varchar(32) NOT NULL,
	"path" varchar(512) NOT NULL,
	"sessionId" varchar(64),
	"referrer" varchar(512),
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
