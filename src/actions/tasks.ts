import { action } from "@daydreamsai/core";
import { AgentContext } from "@daydreamsai/core";
import { z } from "zod";
import { GoalMemory } from "../types.js";

export const tasks = [
  action({
    name: "addTask",
    description: "Add a task to the goal",
    schema: z.object({ task: z.string() }),
    handler(
      call: { data: { task: string } },
      ctx: { agentMemory: any },
      _agent: any,
    ) {
      const agentMemory = ctx.agentMemory as GoalMemory;
      agentMemory.tasks.push(call.data.task);
      return {};
    },
  }),
  action({
    name: "completeTask",
    description: "Complete a task",
    schema: z.object({ task: z.string() }),
    handler(
      call: { data: { task: string } },
      ctx: { agentMemory: any },
      _agent: any,
    ) {
      const agentMemory = ctx.agentMemory as GoalMemory;
      if (agentMemory) {
        agentMemory.tasks = agentMemory.tasks.filter(
          (task) => task !== call.data.task,
        );
      }
      return {};
    },
  }),
];
