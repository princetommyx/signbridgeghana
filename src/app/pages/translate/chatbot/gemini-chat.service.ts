import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {catchError, map, Observable, throwError} from 'rxjs';
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

interface GeminiChatRequest {
  messages: GeminiChatMessage[];
  userMessage: string;
  context: GeminiChatContext;
}

const SYSTEM_PROMPT =
  'You are a concise, helpful assistant for the Ghana Sign Language (GSL) translation app. ' +
  'Your primary goal is to help users learn and translate into GSL. ' +
  'Keep answers practical, clear, and respectful. Prefer short paragraphs and bullet points when useful. ' +
  'You have access to an official GSL Dictionary. When you explain how to sign a word, ' +
  'always include a reference at the end of your response in this exact format: [See "Word" in Dictionary] ' +
  'replacing "Word" with the specific sign you are explaining. ' +
  'You are powered by Gemini, a large language model from Google.';

@Injectable({providedIn: 'root'})
export class GeminiChatService {
  private http = inject(HttpClient);

  sendMessage(request: GeminiChatRequest): Observable<string> {
    const model = 'gemini-flash-latest';
    const apiKey = environment.geminiApiKey;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemPrompt = this.buildSystemPrompt(request.context);
    const contents = this.buildContents(request.messages, request.userMessage);

    return this.http
      .post<any>(endpoint, {
        systemInstruction: {
          parts: [{text: systemPrompt}],
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      })
      .pipe(
        map(response => {
          const candidate = response.candidates?.[0];
          if (candidate?.finishReason === 'SAFETY') {
            return 'I apologize, but I cannot answer that question due to safety filters.';
          }
          const reply = candidate?.content?.parts?.[0]?.text?.trim();
          if (!reply) {
            throw new Error('Empty response from AI assistant');
          }
          return reply;
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Gemini API Error:', error);
          let message = 'Unable to get a response.';
          if (error.status === 403) message = 'API Key invalid or blocked by CORS.';
          if (error.status === 404) message = 'Model not found.';
          if (error.error?.error?.message) message = error.error.error.message;
          return throwError(() => new Error(message));
        })
      );
  }

  private buildSystemPrompt(context: GeminiChatContext): string {
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

  private buildContents(history: GeminiChatMessage[], userMessage: string): any[] {
    const contents = [];
    let lastRole: string | null = null;

    for (const message of history) {
      const role = message.role === 'assistant' ? 'model' : 'user';
      if (role === lastRole) continue;
      contents.push({
        role,
        parts: [{text: message.text}],
      });
      lastRole = role;
    }

    if (lastRole === 'user' && contents.length > 0) {
      contents[contents.length - 1].parts[0].text += `\n\n${userMessage}`;
    } else {
      contents.push({role: 'user', parts: [{text: userMessage}]});
    }

    return contents;
  }
}
