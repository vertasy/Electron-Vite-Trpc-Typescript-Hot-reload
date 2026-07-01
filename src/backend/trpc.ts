import { startRouter } from "./Router/start/startRouter";
import { syncRouter } from "./Router/sync/syncRouter";
import { publicProcedure, t } from "./initTrpc";

export const appRouter = t.router({
  start: startRouter,
  sync: syncRouter
});

export const createCaller = t.createCallerFactory(appRouter);
export type AppRouter = typeof appRouter;
