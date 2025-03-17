/*import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Extension, AnyAgent } from "@daydreamsai/core";

const ggchatConfigSchema = z.object({
  supabaseUrl: z.string().min(1, "Supabase URL is required"),
  supabaseKey: z.string().min(1, "Supabase key is required"),
  chatId: z.string().uuid("Chat ID must be a valid UUID"),
  botId: z.string().uuid("Bot ID must be a valid UUID"),
  shouldRespondOnlyToMentions: z.boolean().optional().default(false),
});

export type GGChatConfig = z.infer<typeof ggchatConfigSchema>;

export class GGChatExtension implements Extension {
  public readonly name = "ggchat";
  private supabase: SupabaseClient;
  private config: GGChatConfig;
  private messages: Map<
    string,
    Array<{ userId: string; userName: string; content: any }>
  > = new Map();
  private agent!: AnyAgent;

  constructor(config: GGChatConfig) {
    this.config = ggchatConfigSchema.parse(config);
    this.supabase = createClient(
      this.config.supabaseUrl,
      this.config.supabaseKey,
    );
  }

  async install(agent: AnyAgent): Promise<void> {
    this.agent = agent;
    await this.start();
  }

  private async start(): Promise<void> {
    await this.subscribeToMessages();
    this.setupShutdownHandlers();
  }

  private async subscribeToMessages(): Promise<void> {
    this.supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${this.config.chatId}`,
        },
        async (payload) => {
          const { message, user_id } = payload.new;

          if (user_id === this.config.botId) return;

          try {
            await this.handleMessage(message, user_id);
          } catch (error) {
            console.error(`Error handling GGChat message: ${error}`);
          }
        },
      )
      .subscribe();
  }

  private async handleMessage(message: string, userId: string): Promise<void> {
    if (
      this.config.shouldRespondOnlyToMentions &&
      !this._isMessageForMe(message)
    ) {
      return;
    }

    // Track message history
    this.trackMessage(this.config.chatId, userId, "User", { text: message });

    // Generate response using the agent's model
    const response = await this.agent.model.doGenerate({
      inputFormat: "messages",
      mode: { type: "regular" },
      prompt: [
        {
          role: "user",
          content: [{ type: "text", text: message }],
        },
      ],
      temperature: 0.7,
    });

    if (!response || !response.text) {
      console.error("No response generated");
      return;
    }

    // Clean up response text by removing think tags
    const cleanedResponse = response.text
      .replace(/<think>|<\/think>/g, "")
      .trim();

    // Send response to Supabase
    await this.supabase.from("messages").insert({
      chat_id: this.config.chatId,
      message: cleanedResponse,
      user_id: this.config.botId,
      type: "regular",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      meta: "{}",
    });
  }

  private _isMessageForMe(message: string): boolean {
    return true; // Always respond in Daydreams framework
  }

  private trackMessage(
    chatId: string,
    userId: string,
    userName: string,
    content: any,
  ) {
    const MAX_MESSAGES = 50;
    if (!this.messages.has(chatId)) {
      this.messages.set(chatId, []);
    }

    const chatMessages = this.messages.get(chatId)!;
    chatMessages.push({ userId, userName, content });

    if (chatMessages.length > MAX_MESSAGES) {
      chatMessages.splice(0, chatMessages.length - MAX_MESSAGES);
    }
  }

  private setupShutdownHandlers(): void {
    const shutdownHandler = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down GGChat extension...`);
      try {
        await this.stop();
        console.log("GGChat extension stopped gracefully");
      } catch (error) {
        console.error("Error during GGChat extension shutdown:", error);
      }
    };

    process.once("SIGINT", () => shutdownHandler("SIGINT"));
    process.once("SIGTERM", () => shutdownHandler("SIGTERM"));
    process.once("SIGHUP", () => shutdownHandler("SIGHUP"));
  }

  async stop(): Promise<void> {
    await this.supabase.removeAllChannels();
  }
}

export const ggchat = (config: GGChatConfig): Extension =>
  new GGChatExtension(config);
*/
