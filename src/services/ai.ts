// ai.ts
import axios from 'axios';

const HF_API_KEY = import.meta.env.VITE_HUGGINGFACE_API_KEY;
const HF_API_BASE = 'https://api-inference.huggingface.co/models';

// ✅ Production-ready, recommended models
export const MODELS = {
  CHAT: 'meta-llama/Meta-Llama-3-8B-Instruct',
  TEXT_GEN: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
  QA: 'deepset/roberta-base-squad2',
  CODE: 'bigcode/starcoder2-7b'
};

// 🌐 Generic request to Hugging Face model
async function hfRequest(model: string, payload: any): Promise<any> {
  const url = `${HF_API_BASE}/${model}`;

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data;
  } catch (err: any) {
    console.error(`❌ HF Error [${model}]:`, err?.response?.data || err.message);
    throw new Error(`Failed to query ${model}`);
  }
}

// 💬 Chat with LLaMA or Mixtral
export async function chatWithAI(message: string): Promise<string> {
  const payload = {
    inputs: message,
    options: { wait_for_model: true }
  };

  const response = await hfRequest(MODELS.CHAT, payload);
  return response?.generated_text || '🤖 No response';
}

// ✍️ General text generation
export async function generateText(prompt: string, maxTokens = 200): Promise<string> {
  const payload = {
    inputs: prompt,
    parameters: {
      max_new_tokens: maxTokens,
      temperature: 0.7,
      top_p: 0.9
    },
    options: { wait_for_model: true }
  };

  const response = await hfRequest(MODELS.TEXT_GEN, payload);
  return response?.[0]?.generated_text || '🤖 No output';
}

// 🧠 Question answering
export async function answerQuestion(context: string, question: string): Promise<string> {
  const payload = {
    inputs: {
      context,
      question
    },
    options: { wait_for_model: true }
  };

  const response = await hfRequest(MODELS.QA, payload);
  return response?.answer || '🤖 No answer found';
}

// 🧑‍💻 Code generation or suggestion
export async function generateCode(prompt: string, maxTokens = 200): Promise<string> {
  const payload = {
    inputs: prompt,
    parameters: {
      max_new_tokens: maxTokens,
      temperature: 0.6
    },
    options: { wait_for_model: true }
  };

  const response = await hfRequest(MODELS.CODE, payload);
  return response?.[0]?.generated_text || '🤖 Code output not available';
}
