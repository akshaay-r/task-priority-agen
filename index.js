import fs from "fs";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const TASK_FILE = "tasks.txt";
const OUTPUT_FILE = "categorized_tasks.json";

function readTasks() {
  return fs
    .readFileSync(TASK_FILE, "utf-8")
    .split("\n")
    .map((task) => task.trim())
    .filter(Boolean);
}

function buildPrompt(tasks) {
  return `
    You are an AI Agent that classifies tasks according to priority.
    
    Priority rules:
    High : urgent,deadlines,money,bugs,interviews 
    Medium : important but not urgent
    Low : optional,liesure,can be postponed

    Return tasks  ONLY in the given format.
    Format 
    High Priority

    1.task1
    2.task2

    Medium Priority

    1.task1
    2.task2

    Low Priority
    
    1.task1
    2.task2


    Tasks : 
    ${tasks.map((task, i) => `${i + 1}. ${task}`).join("\n")}
    `;
}

async function classifyTasks(tasks) {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: buildPrompt(tasks) }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Groq API error details:");
    console.error(error.response?.data || error.message);
    throw error;
  }
}

function saveOutput(result) {
  fs.writeFileSync(OUTPUT_FILE, result);
}

async function runAgent() {
  try {
    const tasks = readTasks();
    const result = await classifyTasks(tasks);
    saveOutput(result);

    console.log("Tasks Categorized successfully");
    console.log(`Output save to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("Agent failed : ", error.message);
  }
}

runAgent();
