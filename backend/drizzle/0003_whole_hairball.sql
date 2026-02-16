CREATE TABLE "oauth_states" (
	"state" varchar(64) PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL
);
