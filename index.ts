/**
 * Daydreams agent with cli, twitter, discord extension(s)
 * Using Groq as the model provider
 */
import { createGroq } from "@ai-sdk/groq";
import {
    createDreams,
    context,
    render,
    action,
    validateEnv,
    AgentContext,
} from "@daydreamsai/core";
import { cli } from "@daydreamsai/core/extensions";
import { telegram } from "@daydreamsai/telegram";
import { string, z } from "zod";
import { knowledge } from "./character.js";

const env = validateEnv(
    z.object({
        GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
        TELEGRAM_TOKEN: z.string().min(1, "TELEGRAM_TOKEN is required"),
    })
);

// Initialize Groq client
const groq = createGroq({
    apiKey: env.GROQ_API_KEY!,
});

const template = `
Knowledge: {{knowledge}}
Goal: {{goal}} 
Tasks: {{tasks}}
Current Task: {{currentTask}}
`;

type GoalMemory = {
    knowledge: string[];
    goal: string;
    tasks: string[];
    currentTask: string;
};

const goalContexts = context({
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

    create(state: { args: { initialGoal: string; initialTasks: string[]; initialKnowledge: string[] } }) {
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

createDreams({
    model: groq("deepseek-r1-distill-llama-70b"),
    extensions: [cli, telegram],
    context: goalContexts, 
    actions: [
        action({
            name: "getKnowledge",
            description: "Get all knowledge",
            schema: z.object({}),
            async handler(
                call: { data: {} },
                ctx: AgentContext<GoalMemory, any>,
                _agent: any
            ) {
                if (!ctx.memory) throw new Error("No agent memory found");
                return { knowledge: ctx.memory.knowledge };
            },
        }),
        action({
            name: "addTask",
            description: "Add a task to the goal",
            schema: z.object({ task: z.string() }),
            async handler(
                call: { data: { task: string } },
                ctx: AgentContext<GoalMemory, any>,
                _agent: any
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
                _agent: any
            ) {
                if (!ctx.memory) throw new Error("No agent memory found");
                ctx.memory.tasks = ctx.memory.tasks.filter(
                    (task) => task !== call.data.task
                );
                return {};
            },
        }),
    ],
}).start({ 
    id: "test", 
    initialGoal: "", 
    initialTasks: [],
    initialKnowledge: knowledge
});
