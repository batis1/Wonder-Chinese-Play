export const emptyProgress = () => ({ version: 1, activities: {}, currentLesson: 1 });

export function readProgress(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    if (value?.version === 1 && value.activities && typeof value.activities === "object" && !Array.isArray(value.activities)) return value;
  } catch { /* Leave malformed or legacy storage alone and start a new workbook record. */ }
  return emptyProgress();
}

export function isAvailable(lesson, activity, progress) {
  const index = lesson.activities.findIndex(item => item.id === activity.id);
  return index >= 0 && lesson.activities.slice(0, index).every(item => progress.activities[item.id]?.finished);
}

export function nextActivity(lesson, progress) {
  return lesson.activities.find(item => !progress.activities[item.id]?.finished) || lesson.activities[0];
}

export function saveAttempt(progress, lesson, activity, answers, finished = false, result = {}) {
  return {
    ...progress,
    currentLesson: lesson.number,
    activities: {
      ...progress.activities,
      [activity.id]: { answers, finished: Boolean(finished), updatedAt: new Date().toISOString(), ...result }
    }
  };
}
