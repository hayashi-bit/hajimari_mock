import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { feedbacks } from "../../drizzle/schema";
import { desc, eq, sql } from "drizzle-orm";

export const feedbackRouter = router({
  /**
   * フィードバック送信（匿名OK）
   */
  create: publicProcedure
    .input(
      z.object({
        deviceId: z.string().min(1),
        displayName: z.string().optional(),
        sessionId: z.number().optional(),
        type: z.enum(["feedback", "idea", "bug", "request"]),
        content: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [result] = await db!.insert(feedbacks).values({
        deviceId: input.deviceId,
        displayName: input.displayName || null,
        sessionId: input.sessionId || null,
        type: input.type,
        content: input.content,
      });
      return { id: result.insertId };
    }),

  /**
   * フィードバック一覧取得（全員分）
   */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        type: z.enum(["feedback", "idea", "bug", "request"]).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const limit = input?.limit ?? 50;
      const db = await getDb();
      const conditions = input?.type ? eq(feedbacks.type, input.type) : undefined;

      const rows = await db!
        .select()
        .from(feedbacks)
        .where(conditions)
        .orderBy(desc(feedbacks.createdAt))
        .limit(limit);

      return rows;
    }),

  /**
   * フィードバックサマリー（ダッシュボード用）
   */
  summary: publicProcedure.query(async () => {
    const db = await getDb();
    const [countResult] = await db!
      .select({
        total: sql<number>`count(*)`,
        feedbackCount: sql<number>`sum(case when type = 'feedback' then 1 else 0 end)`,
        ideaCount: sql<number>`sum(case when type = 'idea' then 1 else 0 end)`,
        bugCount: sql<number>`sum(case when type = 'bug' then 1 else 0 end)`,
        requestCount: sql<number>`sum(case when type = 'request' then 1 else 0 end)`,
        newCount: sql<number>`sum(case when status = 'new' then 1 else 0 end)`,
      })
      .from(feedbacks);

    const latest = await db!
      .select()
      .from(feedbacks)
      .orderBy(desc(feedbacks.createdAt))
      .limit(5);

    return {
      counts: {
        total: Number(countResult.total) || 0,
        feedback: Number(countResult.feedbackCount) || 0,
        idea: Number(countResult.ideaCount) || 0,
        bug: Number(countResult.bugCount) || 0,
        request: Number(countResult.requestCount) || 0,
        new: Number(countResult.newCount) || 0,
      },
      latest,
    };
  }),

  /**
   * ステータス更新（管理者用）
   */
  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "noted", "planned", "done", "wontfix"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      await db!
        .update(feedbacks)
        .set({ status: input.status })
        .where(eq(feedbacks.id, input.id));
      return { success: true };
    }),
});
