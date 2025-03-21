/**
 * Daydreams agent with cli, twitter, extension(s)
 * Using Groq as the model provider
 */
import { createGroq } from "@ai-sdk/groq";
import {
  createDreams,
  validateEnv,
  createMemoryStore,
  createContainer,
} from "@daydreamsai/core";
import { tavily } from "@tavily/core";
import { cli } from "@daydreamsai/core/extensions";
import { telegram } from "@daydreamsai/telegram";
import { z } from "zod";
import { knowledge } from "./character.js";
import { goalContexts } from "./contexts/contexts.js";
import { tasks } from "./actions/tasks.js";
import { knowledgeActions } from "./actions/knowledge.js";
import { ggchat } from "./extensions/ggchat/index.js";
import { createChromaVectorStore } from "@daydreamsai/chromadb";
import { openai } from "@ai-sdk/openai";

const env = validateEnv(
  z.object({
    GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
    TELEGRAM_TOKEN: z.string().min(1, "TELEGRAM_TOKEN is required"),
    GGCHAT_SUPABASE_URL: z.string().min(1, "GGCHAT_SUPABASE_URL is required"),
    GGCHAT_SUPABASE_KEY: z.string().min(1, "GGCHAT_SUPABASE_KEY is required"),
    GGCHAT_BOT_ID: z.string().min(1, "GGCHAT_BOT_ID is required"),
    GGCHAT_CHAT_ID: z.string().min(1, "GGCHAT_CHAT_ID is required"),
    OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
    TAVILY_API_KEY: z.string().min(1, "TAVILY_API_KEY is required"),
  }),
);

const container = createContainer();
container.singleton("tavily", () =>
  tavily({
    apiKey: process.env.TAVILY_API_KEY!,
  }),
);

const groq = createGroq({
  apiKey: env.GROQ_API_KEY!,
});

const startAgent = async () => {
  /*  console.log("Initializing MongoDB memory store...");
  const mongoStore = await createMongoMemoryStore({
    uri: env.MONGO_URI!,
    dbName: env.MONGO_DB_NAME!,
    collectionName: env.MONGO_COLLECTION_NAME!,
  });

  console.log("MongoDB memory store initialized successfully");

  const memory = createMemory(mongoStore, {
    upsert: () => Promise.resolve(),
    query: () => Promise.resolve([]),
    createIndex: () => Promise.resolve(),
    deleteIndex: () => Promise.resolve(),
  });
*/

  console.log("Initializing Chroma memory store...");
  const vector = createChromaVectorStore(
    "agent-memory",
    "http://localhost:8000",
  );

  // Create and start the agent
  createDreams({
    model: groq("deepseek-r1-distill-llama-70b"),
    extensions: [cli, telegram, ggchat],
    container,
    context: goalContexts,
    actions: [...knowledgeActions, ...tasks],
    memory: {
      store: createMemoryStore(),
      vector,
      vectorModel: openai("gpt-4-turbo"),
    },
  }).start({
    id: "Maximus", //random valid 24-character hex ObjectId
    initialGoal: "",
    initialTasks: [],
    initialKnowledge: knowledge,
  });
};

startAgent().catch((err) => {
  console.error("Failed to start agent:", err);
  process.exit(1);
});
