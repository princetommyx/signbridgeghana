import * as express from 'express';
import * as cors from 'cors';
import * as httpErrors from 'http-errors';
import {onRequest} from 'firebase-functions/v2/https';
import {defineSecret} from 'firebase-functions/params';
import fetch from 'node-fetch';
import {appCheckVerification} from '../middlewares/appcheck.middleware';
import {errorMiddleware} from '../middlewares/error.middleware';
import {optionsRequest} from '../middlewares/options.request';
import {unkeyRatelimit} from '../middlewares/unkey-ratelimit.middleware';

const SYSTEM_PROMPT =
  'You are a concise, helpful assistant for a sign-language translation app. ' +
  'Keep answers practical, clear, and respectful. Prefer short paragraphs and bullet points when useful.';

type ChatRole = 'user' | 'assistant';

interface ChatContext {
  spokenToSigned: boolean;
  spokenLanguage: string;
  signedLanguage: string;
  detectedLanguage?: string | null;
}

interface ChatMessage {
  role: ChatRole;
  text: string;
}

interface ChatRequestBody {
  messages?: ChatMessage[];
  userMessage?: string;
  context?: ChatContext;
}

function parseBody(req: express.Request): {history: ChatMessage[]; userMessage: string; context: ChatContext} {
  const body = (req.body ?? {}) as ChatRequestBody;
  const userMessage = body.userMessage?.trim();

  if (!userMessage) {
    throw new httpErrors.BadRequest('Missing "userMessage" in request body');
  }

  if (userMessage.length > 4000) {
    throw new httpErrors.BadRequest('"userMessage" exceeds maximum length');
  }

  const rawHistory = Array.isArray(body.messages) ? body.messages : [];
  const history = rawHistory
    .slice(-20)
    .filter(message => (message.role === 'user' || message.role === 'assistant') && typeof message.text === 'string')
    .map(message => ({
      role: message.role,
      text: message.text.trim().slice(0, 4000),
    }))
    .filter(message => !!message.text);

  const context = {
    spokenToSigned: body.context?.spokenToSigned ?? true,
    spokenLanguage: body.context?.spokenLanguage?.trim() || 'en',
    signedLanguage: body.context?.signedLanguage?.trim() || 'ase',
    detectedLanguage: body.context?.detectedLanguage?.trim() || null,
  };

  return {history, userMessage, context};
}

function buildSystemPrompt(context: ChatContext): string {
  const mode = context.spokenToSigned ? 'spoken-to-signed' : 'signed-to-spoken';
  const detectedLanguage = context.detectedLanguage ? `Detected spoken language: ${context.detectedLanguage}.` : '';

  return [
    SYSTEM_PROMPT,
    `Current translate mode: ${mode}.`,
    `Spoken language: ${context.spokenLanguage}.`,
    `Signed language: ${context.signedLanguage}.`,
    detectedLanguage,
    'When the user asks for help, keep responses short, practical, and tailored to the current translate direction.',
  ]
    .filter(Boolean)
    .join(' ');
}

export const geminiChatFunctions = () => {
  const geminiApiKey = defineSecret('GEMINI_API_KEY');

  const app = express();
  app.use(cors());
  app.use(appCheckVerification);
  app.use(unkeyRatelimit('api.chatbot-gemini', 120, '30m'));
  app.options('*', optionsRequest);

  app.post(['/', '/api/chatbot-gemini'], async (req, res) => {
    const {history, userMessage, context} = parseBody(req);

    const model = 'gemini-2.0-flash';
    const key = geminiApiKey.value() || process.env['GEMINI_API_KEY'];
    if (!key) {
      throw new httpErrors.InternalServerError('GEMINI_API_KEY is not configured');
    }
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const contents = [
      ...history.map(message => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{text: message.text}],
      })),
      {role: 'user', parts: [{text: userMessage}]},
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        systemInstruction: {
          parts: [{text: buildSystemPrompt(context)}],
        },
        contents,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 600,
        },
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error('Gemini API call failed with status:', response.status);
      console.error('Error details:', details);
      throw new httpErrors.BadGateway(`Gemini API request failed: ${details}`);
    }

    const json = (await response.json()) as any;
    const candidate = json.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];
    const reply = parts
      .map((part: {text?: string}) => part.text ?? '')
      .join('\n')
      .trim();

    if (!reply) {
      throw new httpErrors.BadGateway('Gemini API returned an empty response');
    }

    res.json({reply});
  });

  app.use(errorMiddleware);

  return onRequest(
    {
      invoker: 'public',
      cpu: 'gcf_gen1',
      concurrency: 2,
      timeoutSeconds: 30,
      secrets: [geminiApiKey],
    },
    app
  );
};
