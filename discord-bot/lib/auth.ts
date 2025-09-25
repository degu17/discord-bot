// 一時的にコメントアウト - Clerkライブラリの問題
// import { authMiddleware } from '@clerk/nextjs';

// export default authMiddleware({
//   publicRoutes: ['/api/webhook', '/api/status'],
//   ignoredRoutes: ['/api/webhook'],
// });

export default function authMiddleware() {
  return null;
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
