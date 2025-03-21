import { z } from "zod";
import { AgentContext, action } from "@daydreamsai/core";
import { GoalMemory } from "../types.js";

export const knowledgeActions = [
  action({
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
  }),
  /*  action({
    name: "addKnowledge",
    description: "Add knowledge",
    schema: z.object({ knowledge: z.string() }),
    async handler(
      call: { data: { knowledge: string } },
      ctx: AgentContext<GoalMemory, any>,
      _agent: any,
    ) {
      if (!ctx.memory) throw new Error("No agent memory found");
      ctx.memory.knowledge.push(call.data.knowledge);
      return {};
    },
  }),*/
];
