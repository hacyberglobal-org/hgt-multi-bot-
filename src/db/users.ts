import { db } from './index.ts';
import { users, gigIntegrations, activityLogs } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, displayName?: string, photoUrl?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
        photoUrl: photoUrl || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || null,
          photoUrl: photoUrl || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database error in getOrCreateUser:", error);
    throw new Error("Failed to register or sync user", { cause: error });
  }
}

export async function getUserProfile(uid: string) {
  try {
    const results = await db.select().from(users).where(eq(users.uid, uid));
    return results[0] || null;
  } catch (error) {
    console.error("Database error in getUserProfile:", error);
    throw new Error("Failed to fetch user profile", { cause: error });
  }
}

export async function logUserActivity(userId: string, action: string, platform?: string, details?: string) {
  try {
    const result = await db.insert(activityLogs).values({
      userId,
      action,
      platform: platform || null,
      details: details || null,
    }).returning();
    return result[0];
  } catch (error) {
    console.error("Database error in logUserActivity:", error);
    throw new Error("Failed to record activity log", { cause: error });
  }
}

export async function getUserActivityLogs(userId: string) {
  try {
    return await db.select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.timestamp))
      .limit(50);
  } catch (error) {
    console.error("Database error in getUserActivityLogs:", error);
    throw new Error("Failed to fetch activity logs", { cause: error });
  }
}
