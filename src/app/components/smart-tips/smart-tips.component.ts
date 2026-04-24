import {Component, inject} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {Store} from '@ngxs/store';
import {combineLatest, Observable} from 'rxjs';
import {distinctUntilChanged, map} from 'rxjs/operators';
import {IonCard, IonCardContent, IonCardHeader, IonCardTitle} from '@ionic/angular/standalone';
import {PosePlaybackService} from '../../pages/translate/pose-viewers/pose-playback.service';

const TIP_DICTIONARY: Record<string, string> = {
  hello: 'Wave your hand side to side.',
  hi: 'Raise your hand up towards your head, palm facing out, and give a small wave.',
  thanks: 'Bring your fingertips from your chin outward.',
  please: 'Rub your palm in a circular motion on your chest.',
  yes: 'Make a fist and nod it up and down, like your head nodding yes.',
  no: 'Bring your index and middle fingers together with your thumb, like a mouth closing.',
  sorry: 'Make a fist and rub it in a circle on your chest.',
  goodbye: 'Wave your open hand side to side.',
  'good morning':
    'Place your right hand, palm up, near your mouth, then move it away as if offering something, then bring your left hand to your right elbow and raise your right hand.',
  'good night':
    'Place one hand flat under your chin and move it down, then rest your head on your hands as if sleeping.',
  'i love you':
    'Extend your thumb, index finger, and pinky while keeping your middle and ring fingers down, and move your hand slightly side to side.',
  'how are you': 'Place both hands together, twist them outward, then point towards the person.',
  'thank you': 'Touch your fingers to your chin and move your hand forward.',
  help: 'Place your right fist on your left palm and move both hands upward.',
  'please help':
    'Rub your right hand in a circle on your chest, then place your right fist on your left palm and move both hands upward.',
};

function tokenizeWords(text: string): string[] {
  return (text || '')
    .trim()
    .split(/\s+/)
    .map(t => t.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter(Boolean)
    .map(t => t.toLowerCase());
}

function indexFromTiming(currentTime: number, duration: number, length: number): number {
  if (length <= 0) {
    return -1;
  }

  // If timing isn't available yet, still show *something* (first token)
  // so users can see the overlay working.
  if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  const clamped = Math.min(Math.max(currentTime, 0), duration);
  const ratio = clamped / duration;
  const idx = Math.floor(ratio * length);
  return Math.min(Math.max(idx, 0), length - 1);
}

@Component({
  selector: 'app-smart-tips',
  templateUrl: './smart-tips.component.html',
  styleUrls: ['./smart-tips.component.scss'],
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardContent, AsyncPipe],
})
export class SmartTipsComponent {
  private store = inject(Store);
  private playback = inject(PosePlaybackService);

  private text$: Observable<string> = this.store.select(state => {
    const normalized = state.translate?.normalizedSpokenLanguageText;
    const raw = state.translate?.spokenLanguageText;
    return (normalized ?? raw ?? '') as string;
  });

  // Phrase-aware: Try to match up to 3-word phrases, then 2, then 1
  readonly currentPhrase$: Observable<string | null> = combineLatest([
    this.text$.pipe(map(tokenizeWords)),
    this.playback.currentTime$,
    this.playback.duration$,
  ]).pipe(
    map(([words, currentTime, duration]) => {
      const idx = indexFromTiming(currentTime, duration, words.length);
      if (idx < 0) return null;
      // Try 3-word, 2-word, then 1-word phrase
      for (let n = 3; n >= 1; n--) {
        if (idx - n + 1 >= 0) {
          const phrase = words.slice(idx - n + 1, idx + 1).join(' ');
          if (TIP_DICTIONARY[phrase]) return phrase;
        }
      }
      // Fallback to single word
      return words[idx] || null;
    }),
    distinctUntilChanged()
  );

  readonly tip$: Observable<string | null> = this.currentPhrase$.pipe(
    map(phrase => (phrase ? (TIP_DICTIONARY[phrase] ?? null) : null)),
    distinctUntilChanged()
  );

  readonly message$ = combineLatest([this.currentPhrase$, this.tip$]).pipe(
    map(([phrase, tip]) => {
      if (!phrase) {
        return null;
      }

      return {
        word: phrase,
        tip:
          tip ?? `No written tip available for this sign yet. Watch the skeleton above to see how to sign "${phrase}".`,
      };
    }),
    distinctUntilChanged((a, b) => a?.word === b?.word && a?.tip === b?.tip)
  );
}
