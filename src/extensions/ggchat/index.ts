import { z } from "zod";
import {
  context,
  service,
  extension,
  input,
  output,
  formatMsg,
  Logger,
  LogLevel,
} from "@daydreamsai/core";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const log = new Logger({ level: LogLevel.INFO });

const ggchatService = service({
  register(container) {
    container.singleton("supabase", () =>
      createClient(
        process.env.GGCHAT_SUPABASE_URL!,
        process.env.GGCHAT_SUPABASE_KEY!,
      ),
    );
  },
  async boot(container) {
    const supabase = container.resolve<SupabaseClient>("supabase");
    log.info("ggchat", "GGChat service started");
  },
});

const ggchatContext = context({
  type: "ggchat:chat",
  key: ({ roomId }) => roomId.toString(),
  schema: z.object({ roomId: z.string() }),
  async setup(args) {
    return { roomId: args.roomId };
  },
  description({ options }) {
    return `You are in GGChat room ${options.roomId}`;
  },
});

export const ggchat = extension({
  name: "ggchat",
  services: [ggchatService],
  contexts: {
    chat: ggchatContext,
  },
  inputs: {
    "ggchat:message": input({
      schema: z.object({
        user: z.object({ id: z.string(), username: z.string() }),
        text: z.string(),
      }),
      format: ({ user, text }) =>
        formatMsg({
          role: "user",
          content: text,
          user: user.username,
        }),
      subscribe(send, { container }) {
        const supabase = container.resolve<SupabaseClient>("supabase");
        log.info("ggchat", "Subscribing to messages...");

        supabase
          .channel("public:messages")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "messages" },
            (payload) => {
              log.info("ggchat", "Received message", payload.new);
            },
          )
          .subscribe();

        return () => {};
      },
    }),
  },
  outputs: {},
});
