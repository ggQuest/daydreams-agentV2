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
    container.resolve<SupabaseClient>("supabase");
    log.info("ggchat", `GGChat service started`);
  },
});

const ggchatContext = context({
  type: "ggchat:chat",
  key: () => process.env.GGCHAT_CHAT_ID!,
  schema: z.object({}),
  async setup() {
    return { chatId: process.env.GGCHAT_CHAT_ID! };
  },
  description({ options }) {
    return `You are in GGChat room ${options.chatId}`;
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
        user: z.object({
          id: z.string(),
        }),
        text: z.string(),
      }),
      format: ({ user, text }) =>
        formatMsg({
          role: "user",
          content: text,
          user: user.id,
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
              // Only process messages from our configured chat
              if (payload.new.chat_id === process.env.GGCHAT_CHAT_ID) {
                log.info("ggchat", "Received message");
                const mentionsMaximus = payload.new.message
                  .toLowerCase()
                  .includes("maximus");

                // Don't process our own messages
                if (payload.new.user_id !== process.env.GGCHAT_BOT_ID) {
                  send(
                    ggchatContext,
                    {
                      shouldRespond: mentionsMaximus,
                    },
                    {
                      user: {
                        id: payload.new.user_id,
                      },
                      text: payload.new.message,
                    },
                  );
                }
              }
            },
          )
          .subscribe();

        return () => {};
      },
    }),
  },
  outputs: {
    "ggchat:message": output({
      schema: z.object({
        content: z.string().describe("the content of the message to send"),
      }),
      description: "use this to send a GGChat message",
      enabled({ context }) {
        return context.type === ggchatContext.type;
      },
      handler: async (data, ctx, { container }) => {
        if (ctx.args.shouldRespond) {
          const supabase = container.resolve<SupabaseClient>("supabase");
          log.info("ggchat", "Sending message", data);
          await supabase.from("messages").insert({
            message: data.content,
            type: "regular",
            chat_id: process.env.GGCHAT_CHAT_ID,
            user_id: process.env.GGCHAT_BOT_ID,
            meta: { bot: true },
          });
        }
        return {
          data,
          timestamp: Date.now(),
        };
      },
      format: ({ data }) =>
        formatMsg({
          role: "assistant",
          content: data.content,
        }),
    }),
  },
});
