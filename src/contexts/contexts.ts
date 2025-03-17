import { context, render } from "@daydreamsai/core";
import { z, string } from "zod";
import { GoalMemory } from "../types.js";

const template = `
Knowledge: {{knowledge}}
Goal: {{goal}} 
Tasks: {{tasks}}
Current Task: {{currentTask}}
`;

export const goalContexts = context({
  type: "goal",
  schema: z.object({
    id: string(),
    initialGoal: z.string(),
    initialTasks: z.array(z.string()),
    initialKnowledge: z.array(z.string()),
  }),

  key({ id }: { id: string }) {
    return id;
  },

  create(state: {
    args: {
      initialGoal: string;
      initialTasks: string[];
      initialKnowledge: string[];
    };
  }) {
    return {
      knowledge: state.args.initialKnowledge || [],
      goal: state.args.initialGoal || "",
      tasks: state.args.initialTasks || [],
      currentTask: state.args.initialTasks?.[0] || "",
    } satisfies GoalMemory;
  },

  render({ memory }: { memory: GoalMemory }) {
    return render(template, {
      knowledge: memory.knowledge.join("\n"),
      goal: memory.goal,
      tasks: memory.tasks.join("\n"),
      currentTask: memory.currentTask ?? "NONE",
    });
  },
});
