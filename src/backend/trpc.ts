import { startRouter } from "./Router/start/startRouter";
import { publicProcedure, t } from "./initTrpc";

export const appRouter = t.router({
  start: startRouter,
  double: publicProcedure
    .input((arg) => arg as { name: string })
    .query(({ input }) => {
      return {
        greeting: `Helloo ${input.name}`
      };
    }),

  test: publicProcedure.query(() => "test")
});

export const createCaller = t.createCallerFactory(appRouter);
export type AppRouter = typeof appRouter;
