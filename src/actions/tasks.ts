import { action } from "@daydreamsai/core";
import { AgentContext } from "@daydreamsai/core";
import { z } from "zod";
import { GoalMemory } from "../types.js";

export const tasks = [
  action({
    name: "addTask",
    description: "Add a task to the goal",
    schema: z.object({ task: z.string() }),
    async handler(
      call: { data: { task: string } },
      ctx: AgentContext<GoalMemory, any>,
      _agent: any,
    ) {
      if (!ctx.memory) throw new Error("No agent memory found");
      ctx.memory.tasks.push(call.data.task);
      return {};
    },
  }),
  action({
    name: "completeTask",
    description: "Complete a task",
    schema: z.object({ task: z.string() }),
    async handler(
      call: { data: { task: string } },
      ctx: AgentContext<GoalMemory, any>,
      _agent: any,
    ) {
      if (!ctx.memory) throw new Error("No agent memory found");
      ctx.memory.tasks = ctx.memory.tasks.filter(
        (task) => task !== call.data.task,
      );
      return {};
    },
  }),
];
