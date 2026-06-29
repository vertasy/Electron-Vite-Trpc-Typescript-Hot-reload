import { startRouter } from "./Router/start/startRouter";
import { syncRouter } from "./Router/sync/syncRouter";
import { GetImageFaceEmbedding } from "./face/face";
import { publicProcedure, t } from "./initTrpc";

export const appRouter = t.router({
  start: startRouter,
  sync: syncRouter,
  face: publicProcedure
    .input((path) => {
      return path as string;
    })
    .query((input) => GetImageFaceEmbedding(input.input))
});

export const createCaller = t.createCallerFactory(appRouter);
export type AppRouter = typeof appRouter;
