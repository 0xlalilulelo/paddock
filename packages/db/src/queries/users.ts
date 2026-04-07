import { db } from "../client";
import { users, userPreferences, userLayouts, savedArticles, articles, sources } from "../schema";
import { eq, and, desc } from "drizzle-orm";
import type { UserPreferences, UserLayout } from "@paddock/api-types";

export async function upsertUser(clerkId: string, email?: string) {
  const [user] = await db
    .insert(users)
    .values({ id: clerkId, email })
    .onConflictDoUpdate({
      target: users.id,
      set: { email },
    })
    .returning();
  return user;
}

export async function getUserPreferences(userId: string) {
  const [row] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function upsertUserPreferences(
  userId: string,
  prefs: Partial<UserPreferences>
) {
  return db
    .insert(userPreferences)
    .values({
      userId,
      seriesOrder: prefs.seriesOrder ?? [],
      notificationPrefs: prefs.notificationPrefs ?? {},
      theme: prefs.theme ?? "dark",
      pushToken: prefs.pushToken ?? null,
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        ...(prefs.seriesOrder !== undefined && { seriesOrder: prefs.seriesOrder }),
        ...(prefs.notificationPrefs !== undefined && {
          notificationPrefs: prefs.notificationPrefs,
        }),
        ...(prefs.theme !== undefined && { theme: prefs.theme }),
        ...(prefs.pushToken !== undefined && { pushToken: prefs.pushToken }),
        updatedAt: new Date(),
      },
    });
}

export async function getUserLayout(userId: string) {
  const [row] = await db
    .select()
    .from(userLayouts)
    .where(eq(userLayouts.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function upsertUserLayout(userId: string, layout: UserLayout) {
  return db
    .insert(userLayouts)
    .values({ userId, layout })
    .onConflictDoUpdate({
      target: userLayouts.userId,
      set: { layout, updatedAt: new Date() },
    });
}

export async function getSavedArticles(userId: string) {
  const rows = await db
    .select({
      articleId: savedArticles.articleId,
      savedAt: savedArticles.savedAt,
      article: articles,
      source: sources,
    })
    .from(savedArticles)
    .innerJoin(articles, eq(articles.id, savedArticles.articleId))
    .innerJoin(sources, eq(sources.id, articles.sourceId))
    .where(eq(savedArticles.userId, userId))
    .orderBy(desc(savedArticles.savedAt))
    .limit(100);

  return rows.map(({ articleId, savedAt, article, source }) => ({
    articleId,
    savedAt: savedAt?.toISOString() ?? new Date().toISOString(),
    article: {
      id: article.id,
      title: article.title,
      summary: article.summary,
      url: article.url,
      imageUrl: article.imageUrl,
      publishedAt: article.publishedAt?.toISOString() ?? new Date().toISOString(),
      isBreaking: article.isBreaking ?? false,
      series: article.series ?? [],
      source: { name: source.name },
    },
  }));
}

export async function saveArticle(userId: string, articleId: string) {
  return db
    .insert(savedArticles)
    .values({ userId, articleId })
    .onConflictDoNothing();
}

export async function unsaveArticle(userId: string, articleId: string) {
  return db
    .delete(savedArticles)
    .where(
      and(
        eq(savedArticles.userId, userId),
        eq(savedArticles.articleId, articleId)
      )
    );
}
