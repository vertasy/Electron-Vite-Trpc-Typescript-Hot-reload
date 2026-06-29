import { publicProcedure, t } from "../../initTrpc";
import syncDiscordDb, { pullDiscordDb } from "../../lib/handleDbDiscordSync";
import getSyncString from "./getSyncString";
import UploadDbRestore from "./uploadDb";

export const syncRouter = t.router({
  dbSync: publicProcedure.query(() => syncDiscordDb()),
  getSyncString: publicProcedure.query(() => getSyncString()),
  pullLatestDb: publicProcedure
    .input((restoreString) => {
      return restoreString as string;
    })
    .query(({ input }) => pullDiscordDb(input)),
  uploadDb: publicProcedure
    .input((arg) => arg as { path: string })
    .query(({ input }) => UploadDbRestore(input.path))
});
