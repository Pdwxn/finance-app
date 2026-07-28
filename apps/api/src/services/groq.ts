import OpenAI from 'openai';
import { env } from '../config/env';

export const groq = new OpenAI({
  apiKey: env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function generateSummary(prompt: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: env.GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 600,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Groq no devolvió contenido');
  return content.trim();
}
