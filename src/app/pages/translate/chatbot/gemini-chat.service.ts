import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';

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
    return this.http
      .post<GeminiChatResponse>('https://sign.mt/api/chatbot-gemini', {
        ...request,
      })
      .pipe(map(response => response.reply));
  }
}
