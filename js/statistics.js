/**
 * statistics.js — scoring and statistics (pure functions, no DOM, no storage).
 *
 *   score = BASE × DIFFICULTY_MULTIPLIER × TIME_FACTOR × STREAK_FACTOR
 */
(function () {
  const RT = (globalThis.RT = globalThis.RT || {});

  const BASE_POINTS = 100;
  const MAX_TIME_FACTOR = 1.5; // answering instantly
  const STREAK_STEP = 0.1; // +10% per previous consecutive correct answer
  const MAX_STREAK_FACTOR = 2.0;

  const difficultyMultiplier = (d) => RT.difficulty.level(d).multiplier;

  /** 1.0 at the time limit, up to 1.5 when answering instantly. Never below 1. */
  function timeFactor(timeUsed, timeLimit) {
    if (!(timeLimit > 0)) return 1;
    const left = Math.max(0, Math.min(1, 1 - timeUsed / timeLimit));
    return 1 + (MAX_TIME_FACTOR - 1) * left;
  }

  function streakFactor(streakBefore) {
    return Math.min(MAX_STREAK_FACTOR, 1 + STREAK_STEP * Math.max(0, streakBefore));
  }

  /** Wrong / timed-out answers score 0. */
  function computeScore({ correct, difficulty, timeUsed, timeLimit, streakBefore }) {
    if (!correct) return 0;
    return Math.round(BASE_POINTS * difficultyMultiplier(difficulty) * timeFactor(timeUsed, timeLimit) * streakFactor(streakBefore));
  }

  const bucket = () => ({ total: 0, correct: 0, incorrect: 0, totalTime: 0, score: 0 });

  function emptyStats() {
    return {
      totalQuestions: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      totalTime: 0,
      bestTime: null, // fastest CORRECT answer, in seconds
      currentStreak: 0,
      bestStreak: 0,
      totalScore: 0,
      moduleStats: {},
      difficultyStats: {},
    };
  }

  const num = (v, def = 0) => (typeof v === 'number' && isFinite(v) && v >= 0 ? v : def);

  function sanitizeBucket(b) {
    const o = bucket();
    if (b && typeof b === 'object') for (const k of Object.keys(o)) o[k] = num(b[k]);
    return o;
  }

  function sanitizeStats(raw) {
    const s = emptyStats();
    for (const k of ['totalQuestions', 'correctAnswers', 'incorrectAnswers', 'totalTime', 'currentStreak', 'bestStreak', 'totalScore']) s[k] = num(raw[k]);
    s.bestTime = raw.bestTime === null || raw.bestTime === undefined ? null : num(raw.bestTime, null);
    for (const m of ['moduleStats', 'difficultyStats']) {
      if (raw[m] && typeof raw[m] === 'object') for (const k of Object.keys(raw[m])) s[m][k] = sanitizeBucket(raw[m][k]);
    }
    return s;
  }

  function addTo(b, r) {
    b.total += 1;
    if (r.correct) b.correct += 1;
    else b.incorrect += 1;
    b.totalTime += r.timeUsed;
    b.score += r.score;
  }

  /** Returns a NEW stats object with the result recorded. */
  function record(stats, r) {
    const s = JSON.parse(JSON.stringify(stats));
    s.totalQuestions += 1;
    s.totalTime += r.timeUsed;
    s.totalScore += r.score;
    if (r.correct) {
      s.correctAnswers += 1;
      s.currentStreak += 1;
      s.bestStreak = Math.max(s.bestStreak, s.currentStreak);
      s.bestTime = s.bestTime === null ? r.timeUsed : Math.min(s.bestTime, r.timeUsed);
    } else {
      s.incorrectAnswers += 1;
      s.currentStreak = 0;
    }
    addTo((s.moduleStats[r.module] = s.moduleStats[r.module] || bucket()), r);
    addTo((s.difficultyStats[r.difficulty] = s.difficultyStats[r.difficulty] || bucket()), r);
    return s;
  }

  const accuracy = (s) => (s.totalQuestions ? s.correctAnswers / s.totalQuestions : 0);
  const averageTime = (s) => (s.totalQuestions ? s.totalTime / s.totalQuestions : 0);
  const bucketAccuracy = (b) => (b && b.total ? b.correct / b.total : 0);
  const bucketAvgTime = (b) => (b && b.total ? b.totalTime / b.total : 0);

  RT.statistics = {
    BASE_POINTS, difficultyMultiplier, timeFactor, streakFactor, computeScore,
    emptyStats, sanitizeStats, record, accuracy, averageTime, bucketAccuracy, bucketAvgTime,
  };
})();
