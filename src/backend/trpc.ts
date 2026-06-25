import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

export const publicProcedure = t.procedure;

export const appRouter = t.router({
  double: publicProcedure
    .input((arg) => arg as { name: string })
    .query(({ input }) => {
      return {
        greeting: `Helloo ${input.name}`
      };
    }),

  test: publicProcedure.mutation(() => 12)
});

export const createCaller = t.createCallerFactory(appRouter);
export type AppRouter = typeof appRouter;
