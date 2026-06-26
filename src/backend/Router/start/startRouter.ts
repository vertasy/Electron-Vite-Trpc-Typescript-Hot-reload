import { publicProcedure, t } from "../../initTrpc";
import setupCode from "./code";
import newSetup, {
  NewSetupArgs,
  refreshChannels,
  selectChannel
} from "./newSetup";
import GetStatus from "./status";

export const startRouter = t.router({
  newSetup: publicProcedure
    .input((arg) => arg as NewSetupArgs)
    .query(({ input }) => newSetup(input)),
  selecChannel: publicProcedure
    .input((arg) => arg as { channelId: string })
    .query(({ input }) => selectChannel({ channelId: input.channelId })),
  refreshChannels: publicProcedure.query(() => refreshChannels()),
  setCode: publicProcedure
    .input(
      (arg) =>
        arg as {
          code: string;
        }
    )
    .query(({ input }) => setupCode(input.code)),
  getStaus: publicProcedure.query(() => GetStatus())
});
