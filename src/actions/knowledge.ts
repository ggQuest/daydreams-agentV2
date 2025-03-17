import { z } from "zod";
import { AgentContext, action } from "@daydreamsai/core";
import { GoalMemory } from "../types.js";

export const knowledgeAction = action({
  name: "getKnowledge",
  description: "Get all knowledge",
  schema: z.object({}),
  async handler(
    call: { data: {} },
    ctx: AgentContext<GoalMemory, any>,
    _agent: any,
  ) {
    if (!ctx.memory) throw new Error("No agent memory found");
    return { knowledge: ctx.memory.knowledge };
  },
});
