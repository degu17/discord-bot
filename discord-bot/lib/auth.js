"use strict";
// 一時的にコメントアウト - Clerkライブラリの問題
// import { authMiddleware } from '@clerk/nextjs';
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = authMiddleware;
// export default authMiddleware({
//   publicRoutes: ['/api/webhook', '/api/status'],
//   ignoredRoutes: ['/api/webhook'],
// });
function authMiddleware() {
    return null;
}
exports.config = {
    matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
