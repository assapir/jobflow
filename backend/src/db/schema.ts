import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  index,
} from "drizzle-orm/pg-core";

export const stageEnum = pgEnum("stage", [
  "wishlist",
  "applied",
  "phone_screen",
  "interview",
  "offer",
  "rejected",
]);

export type Stage = (typeof stageEnum.enumValues)[number];

// User profile enums for onboarding
export const professionEnum = pgEnum("profession", [
  "engineering",
  "product",
  "design",
  "marketing",
  "sales",
  "operations",
  "hr",
  "finance",
  "other",
]);

export type Profession = (typeof professionEnum.enumValues)[number];

export const experienceLevelEnum = pgEnum("experience_level", [
  "entry",
  "junior",
  "mid",
  "senior",
  "lead",
  "executive",
]);

export type ExperienceLevel = (typeof experienceLevelEnum.enumValues)[number];

// Users table for LinkedIn OAuth
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  linkedinId: varchar("linkedin_id", { length: 255 }).unique().notNull(),
  email: varchar("email", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  profilePicture: text("profile_picture"),
  country: varchar("country", { length: 100 }), // From LinkedIn locale
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// User profiles table for onboarding data
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .unique()
    .notNull(),
  profession: professionEnum("profession"),
  experienceLevel: experienceLevelEnum("experience_level"),
  preferredLocation: varchar("preferred_location", { length: 255 }),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;

// Refresh tokens table for JWT refresh token rotation
export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: varchar("token", { length: 255 }).unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;

// OAuth states for CSRF protection during LinkedIn login
export const oauthStates = pgTable("oauth_states", {
  state: varchar("state", { length: 64 }).primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type OAuthState = typeof oauthStates.$inferSelect;
export type NewOAuthState = typeof oauthStates.$inferInsert;

export const jobApplications = pgTable(
  "job_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    company: varchar("company", { length: 255 }).notNull(),
    position: varchar("position", { length: 255 }).notNull(),
    location: varchar("location", { length: 255 }),
    salary: varchar("salary", { length: 100 }),
    linkedinUrl: text("linkedin_url"),
    description: text("description"),
    stage: stageEnum("stage").default("wishlist").notNull(),
    order: integer("order").default(0).notNull(),
    notes: text("notes"),
    appliedAt: timestamp("applied_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_job_applications_user_stage_order").on(
      table.userId,
      table.stage,
      table.order
    ),
  ]
);

export type JobApplication = typeof jobApplications.$inferSelect;
export type NewJobApplication = typeof jobApplications.$inferInsert;
