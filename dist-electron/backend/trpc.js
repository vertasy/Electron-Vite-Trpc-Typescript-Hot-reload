"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCaller = exports.appRouter = exports.publicProcedure = void 0;
const server_1 = require("@trpc/server");
const t = server_1.initTRPC.create();
exports.publicProcedure = t.procedure;
exports.appRouter = t.router({
    double: exports.publicProcedure
        .input((arg) => arg)
        .query(({ input }) => {
        return {
            greeting: `Helloo ${input.name}`
        };
    }),
    test: exports.publicProcedure.mutation(() => 22)
});
exports.createCaller = t.createCallerFactory(exports.appRouter);
