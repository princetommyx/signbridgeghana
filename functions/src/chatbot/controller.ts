import * as express from 'express';
import * as cors from 'cors';
import * as httpErrors from 'http-errors';
import {onRequest} from 'firebase-functions/v2/https';
import {defineSecret} from 'firebase-functions/params';
import fetch from 'node-fetch';
// import {appCheckVerification} from '../middlewares/appcheck.middleware';
import {errorMiddleware} from '../middlewares/error.middleware';
import {optionsRequest} from '../middlewares/options.request';
// import {unkeyRatelimit} from '../middlewares/unkey-ratelimit.middleware';

const SYSTEM_PROMPT =
  'You are a concise, helpful assistant for a sign-language translation app. ' +
  'Keep answers practical, clear, and respectful. Prefer short paragraphs and bullet points when useful. ' +
  'You are powered by Gemini, a large language model from Google.';

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
  // app.use(appCheckVerification);
  // TODO: Re-enable ratelimiting if needed
  // app.use(unkeyRatelimit('api.chatbot-gemini', 120, '30m'));
  app.options('*', optionsRequest);

  app.post(['/', '/api/chatbot-gemini'], async (req, res) => {
    const {history, userMessage, context} = parseBody(req);

    const model = 'gemini-2.0-flash';
    const apiKey = geminiApiKey.value();

    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set');
      throw new httpErrors.InternalServerError('AI configuration is missing');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Ensure roles alternate and are correctly mapped
    const contents = [];
    let lastRole: string | null = null;

    for (const message of history) {
      const role = message.role === 'assistant' ? 'model' : 'user';
      if (role === lastRole) continue; // Skip consecutive identical roles
      contents.push({
        role,
        parts: [{text: message.text}],
      });
      lastRole = role;
    }

    // Always add the current user message at the end
    if (lastRole === 'user' && contents.length > 0) {
      // If the last message was also from user, we can either merge or skip.
      // Gemini usually prefers alternating. We'll append to the last user message or just replace it.
      contents[contents.length - 1].parts[0].text += `\n\n${userMessage}`;
    } else {
      contents.push({role: 'user', parts: [{text: userMessage}]});
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          systemInstruction: {
            parts: [{text: buildSystemPrompt(context)}],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error (${response.status}):`, errorText);
        throw new httpErrors.BadGateway(`Gemini API failed: ${response.statusText}`);
      }

      const json = (await response.json()) as any;
      const candidate = json.candidates?.[0];

      if (candidate?.finishReason === 'SAFETY') {
        return res.json({reply: 'I apologize, but I cannot answer that question due to safety filters.'});
      }

      const reply = candidate?.content?.parts?.[0]?.text?.trim();

      if (!reply) {
        console.error('Gemini API returned empty response:', JSON.stringify(json));
        throw new httpErrors.BadGateway('Empty response from AI assistant');
      }

      res.json({reply});
    } catch (error: any) {
      if (httpErrors.isHttpError(error)) throw error;
      console.error('Unexpected error in Gemini chat:', error);
      throw new httpErrors.InternalServerError('An unexpected error occurred');
    }
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
