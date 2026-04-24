import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {catchError, map, Observable, of, shareReplay} from 'rxjs';

export interface GSLTip {
  word: string;
  tip: string;
}

@Injectable({
  providedIn: 'root',
})
export class SmartTipsService {
  private http = inject(HttpClient);
  private apiKey = environment.geminiApiKey;
  private apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

  private cache = new Map<string, GSLTip[]>();

  getTipsForText(text: string): Observable<GSLTip[]> {
    if (!text) return of([]);
    if (this.cache.has(text)) return of(this.cache.get(text)!);

    const prompt = `
      You are an expert instructor in Ghana Sign Language (GSL). 
      For the following English text, provide a detailed but concise signing tip for each word.
      Focus on describing:
      1. The Handshape (e.g., "Open palm", "Fist", "Pointed finger")
      2. The Orientation (e.g., "Palm facing you", "Palm facing out")
      3. The Movement (e.g., "Move in a circle", "Tap your chin twice")
      
      Format the response as a JSON array of objects with "word" and "tip" fields.
      Keep each tip to one clear, descriptive sentence.
      
      Text: "${text}"
    `;

    return this.http
      .post<any>(this.apiUrl, {
        contents: [{parts: [{text: prompt}]}],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      })
      .pipe(
        map(response => {
          try {
            const jsonText = response.candidates[0].content.parts[0].text;
            const tips = JSON.parse(jsonText) as GSLTip[];
            this.cache.set(text, tips);
            return tips;
          } catch (e) {
            console.error('Failed to parse tips', e);
            return [];
          }
        }),
        catchError(() => of([])),
        shareReplay(1)
      );
  }
}
