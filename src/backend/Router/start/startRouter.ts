import { publicProcedure, t } from "../../initTrpc";
import newSetup, { NewSetupArgs } from "./newSetup";

export const startRouter = t.router({
  newSetup: publicProcedure
    .input((arg) => arg as NewSetupArgs)
    .query(({ input }) => newSetup(input))
});
