import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../../environments/environment';

export interface GeminiChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export interface GeminiChatContext {
  spokenToSigned: boolean;
  spokenLanguage: string;
  signedLanguage: string;
  detectedLanguage?: string | null;
}

interface GeminiChatResponse {
  reply: string;
}

interface GeminiChatRequest {
  messages: GeminiChatMessage[];
  userMessage: string;
  context: GeminiChatContext;
}

@Injectable({providedIn: 'root'})
export class GeminiChatService {
  private http = inject(HttpClient);

  sendMessage(request: GeminiChatRequest): Observable<string> {
    const directKey = (environment as any).geminiApiKey;

    if (directKey) {
      return this.sendDirect(request, directKey);
    }

    return this.http
      .post<GeminiChatResponse>(environment.chatbotUrl, {
        ...request,
      })
      .pipe(map(response => response.reply));
  }

  private sendDirect(request: GeminiChatRequest, key: string): Observable<string> {
    const model = 'gemini-2.0-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    const systemPrompt = this.buildSystemPrompt(request.context);
    const contents = [
      ...request.messages.map(message => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{text: message.text}],
      })),
      {role: 'user', parts: [{text: request.userMessage}]},
    ];

    return this.http
      .post<any>(endpoint, {
        systemInstruction: {
          parts: [{text: systemPrompt}],
        },
        contents,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 600,
        },
      })
      .pipe(
        map(json => {
          const reply = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!reply) {
            throw new Error('Gemini API returned an empty response');
          }
          return reply.trim();
        })
      );
  }

  private buildSystemPrompt(context: GeminiChatContext): string {
    const base =
      'You are a concise, helpful assistant for a sign-language translation app. ' +
      'Keep answers practical, clear, and respectful. Prefer short paragraphs and bullet points when useful.';

    const mode = context.spokenToSigned ? 'spoken-to-signed' : 'signed-to-spoken';
    const detectedLanguage = context.detectedLanguage ? `Detected spoken language: ${context.detectedLanguage}.` : '';

    return [
      base,
      `Current translate mode: ${mode}.`,
      `Spoken language: ${context.spokenLanguage}.`,
      `Signed language: ${context.signedLanguage}.`,
      detectedLanguage,
      'When the user asks for help, keep responses short, practical, and tailored to the current translate direction.',
    ]
      .filter(Boolean)
      .join(' ');
  }
}
