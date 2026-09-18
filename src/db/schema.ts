import { pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const gigIntegrations = pgTable('gig_integrations', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // references Firebase UID
  platform: text('platform').notNull(), // spark, uber, doordash, etc.
  status: text('status').notNull().default('connected'),
  accountId: text('account_id'),
  accountData: jsonb('account_data'),
  verifiedAt: timestamp('verified_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  action: text('action').notNull(),
  platform: text('platform'),
  details: text('details'),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  integrations: many(gigIntegrations),
  logs: many(activityLogs),
}));

export const gigIntegrationsRelations = relations(gigIntegrations, ({ one }) => ({
  user: one(users, {
    fields: [gigIntegrations.userId],
    references: [users.uid],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.uid],
  }),
}));
