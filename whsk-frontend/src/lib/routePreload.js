import apiList from './apiList';
import { cachedGet } from './cachedGet';
import { ACTIVE_HSK_LEVEL } from './course';

export const routeModules = {
  login: () => import('../Components/Login/Login'),
  signup: () => import('../Components/Signup/Signup'),
  tutorial: () => import('../Components/Tutorial/Tutorial').then(module => ({ default: module.Tutorial })),
  quiz: () => import('../Components/Quiz/Quiz'),
  leaderboard: () => import('../Components/Scoreboard/Scoreboard'),
  profile: () => import('../Components/ProfileInformation/Profile'),
};

export function canPreload() {
  const connection = typeof navigator !== 'undefined' && navigator.connection;
  return !connection?.saveData && !['slow-2g', '2g'].includes(connection?.effectiveType);
}

export function preloadRoute(path) {
  if (!canPreload()) return;
  const route = path.split('/')[1]?.toLowerCase();
  routeModules[route]?.().catch(() => {});
  if (route === 'tutorial') cachedGet(apiList.workbook, 300000).catch(() => {});
  if (route === 'quiz') {
    cachedGet(`${apiList.questions}?hskLevel=${ACTIVE_HSK_LEVEL}`, 30000).catch(() => {});
    cachedGet(`${apiList.hskWords}?version=2.0&compact=true`, 300000).catch(() => {});
  }
}

export function preloadLesson(number) {
  if (!canPreload()) return;
  import('../Components/Tutorial/WorkbookExercise').catch(() => {});
  cachedGet(`${apiList.workbook}/lesson/${number}?answers=1`, 300000).catch(() => {});
}
