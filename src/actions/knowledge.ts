import { z } from "zod";
import { AgentContext, action } from "@daydreamsai/core";
import { GoalMemory } from "../types.js";

export const knowledgeActions = [
  action({
    name: "getKnowledge",
    description: "Get knowledge",
    schema: z.object({}),
    async handler(
      call: { data: { knowledge: string } },
      ctx: { agentMemory: any },
      _agent: any,
    ) {
      if (!ctx.agentMemory) throw new Error("No agent memory found");
      return { knowledge: ctx.agentMemory.knowledge };
    },
  }),
  action({
    name: "addKnowledge",
    description: "Add knowledge",
    schema: z.object({ knowledge: z.string() }),
    handler(
      call: { data: { knowledge: string } },
      ctx: { agentMemory: any },
      _agent: any,
    ) {
      const agentMemory = ctx.agentMemory as GoalMemory;
      if (!agentMemory) throw new Error("No agent memory found");
      agentMemory.knowledge.push(call.data.knowledge);

      return {};
    },
  }),
];
