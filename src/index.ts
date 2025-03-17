/**
 * Daydreams agent with cli, twitter, discord extension(s)
 * Using Groq as the model provider
 */
import { createGroq } from "@ai-sdk/groq";
import { createDreams, validateEnv } from "@daydreamsai/core";
import { cli } from "@daydreamsai/core/extensions";
import { telegram } from "@daydreamsai/telegram";
import { z } from "zod";
import { knowledge } from "./character.js";
import { goalContexts } from "./contexts/contexts.js";
import { tasks } from "./actions/tasks.js";
import { knowledgeAction } from "./actions/knowledge.js";
import { ggchat } from "./extensions/ggchat/index.js";
const env = validateEnv(
  z.object({
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
    TELEGRAM_TOKEN: z.string().min(1, "TELEGRAM_TOKEN is required"),
    GGCHAT_SUPABASE_URL: z.string().min(1, "GGCHAT_SUPABASE_URL is required"),
    GGCHAT_SUPABASE_KEY: z.string().min(1, "GGCHAT_SUPABASE_KEY is required"),
    GGCHAT_BOT_ID: z.string().min(1, "GGCHAT_BOT_ID is required"),
    GGCHAT_CHAT_ID: z.string().min(1, "GGCHAT_CHAT_ID is required"),
  }),
);

// Initialize Groq client
const groq = createGroq({
  apiKey: env.GROQ_API_KEY!,
});

createDreams({
  model: groq("deepseek-r1-distill-llama-70b"),
  extensions: [cli, telegram, ggchat],
  context: goalContexts,
  actions: [knowledgeAction, ...tasks],
}).start({
  id: "test",
  initialGoal: "",
  initialTasks: [],
  initialKnowledge: knowledge,
});
