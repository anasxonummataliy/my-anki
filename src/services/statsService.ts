import { getDb } from '@/db/client';
import { getStartOfDay, getEndOfDay } from '@/utils/date';
import { getSetting } from '@/db/repositories/settingsRepository';

export interface DashboardStats {
  totalWords: number;
  wordsLearned: number;
  wordsDueToday: number;
  dailyGoal: number;
  todayReviews: number;
  currentStreak: number;
  retentionRate: number;
  quizAccuracy: number;
  recentActivity: { day: string; count: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await getDb();
  const now = Date.now();
  const startToday = getStartOfDay(now);
  const endToday = getEndOfDay(now);

  // 1. Total Words
  const totalRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM words;`
  );
  const totalWords = totalRow?.count ?? 0;

  // 2. Words Learned (state = 2 and reps >= 2)
  const learnedRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM review_states WHERE state = 2 AND reps >= 2;`
  );
  const wordsLearned = learnedRow?.count ?? 0;

  // 3. Words Due Today (new cards + cards due before or at end of today)
  const dueRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM review_states WHERE state = 0 OR due <= ?;`,
    [endToday]
  );
  const wordsDueToday = dueRow?.count ?? 0;

  // 4. Daily Goal & Today Reviews
  const goalStr = await getSetting('daily_goal', '20');
  const dailyGoal = parseInt(goalStr, 10) || 20;

  const todayReviewsRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM review_logs WHERE review >= ? AND review <= ?;`,
    [startToday, endToday]
  );
  const todayReviews = todayReviewsRow?.count ?? 0;

  // 5. Current Streak: consecutive days with review or quiz activity leading up to today
  const activeDaysRows = await db.getAllAsync<{ day: string }>(
    `SELECT DISTINCT strftime('%Y-%m-%d', review / 1000, 'unixepoch', 'localtime') as day
     FROM review_logs
     UNION
     SELECT DISTINCT strftime('%Y-%m-%d', created_at / 1000, 'unixepoch', 'localtime') as day
     FROM quiz_sessions
     ORDER BY day DESC;`
  );

  const activeDays = new Set(activeDaysRows.map((r) => r.day));
  let streak = 0;
  const checkDate = new Date();

  // If user hasn't studied today yet, check if they studied yesterday to keep streak alive
  const todayString = checkDate.toISOString().split('T')[0];
  if (!activeDays.has(todayString)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dayStr = checkDate.toISOString().split('T')[0];
    if (activeDays.has(dayStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // 6. Retention Rate: percentage of reviews rated Good (3) or Easy (4)
  const retentionRow = await db.getFirstAsync<{ total: number; successful: number }>(
    `SELECT
       COUNT(*) as total,
       SUM(CASE WHEN rating IN (3, 4) THEN 1 ELSE 0 END) as successful
     FROM review_logs;`
  );
  const retentionRate =
    retentionRow && retentionRow.total > 0
      ? Math.round((retentionRow.successful / retentionRow.total) * 100)
      : 100;

  // 7. Quiz Accuracy
  const quizRow = await db.getFirstAsync<{ total_q: number; total_c: number }>(
    `SELECT
       COALESCE(SUM(total_questions), 0) as total_q,
       COALESCE(SUM(correct_answers), 0) as total_c
     FROM quiz_sessions;`
  );
  const quizAccuracy =
    quizRow && quizRow.total_q > 0
      ? Math.round((quizRow.total_c / quizRow.total_q) * 100)
      : 0;

  // 8. Recent 7 days review activity
  const recentActivity: { day: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString(undefined, { weekday: 'narrow' });
    const countRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM review_logs
       WHERE strftime('%Y-%m-%d', review / 1000, 'unixepoch', 'localtime') = ?;`,
      [dayStr]
    );
    recentActivity.push({ day: dayLabel, count: countRow?.count ?? 0 });
  }

  return {
    totalWords,
    wordsLearned,
    wordsDueToday,
    dailyGoal,
    todayReviews,
    currentStreak: streak,
    retentionRate,
    quizAccuracy,
    recentActivity,
  };
}
