import {Routes} from '@angular/router';
import {NotFoundComponent} from './pages/not-found/not-found.component';
import {provideStates} from '@ngxs/store';
import {TranslateState} from './modules/translate/translate.state';
import {LanguageDetectionService} from './modules/translate/language-detection/language-detection.service';
import {MediaPipeLanguageDetectionService} from './modules/translate/language-detection/mediapipe.service';
import {MainComponent} from './pages/main.component';

export const routes: Routes = [
  {
    path: 'playground',
    loadComponent: () => import('./pages/playground/playground.component').then(m => m.PlaygroundComponent),
  },
  {
    path: 'benchmark',
    loadComponent: () => import('./pages/benchmark/benchmark.component').then(m => m.BenchmarkComponent),
    providers: [{provide: LanguageDetectionService, useClass: MediaPipeLanguageDetectionService}],
  },
  {path: '', loadChildren: () => import('./pages/landing/landing.routes').then(m => m.routes)},
  {path: 'about', redirectTo: ''},
  {path: 'legal', loadChildren: () => import('./pages/landing/landing.routes').then(m => m.routes)},
  {
    path: 'translate',
    component: MainComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/translate/translate.component').then(m => m.TranslateComponent),
        providers: [
          provideStates([TranslateState]),
          {provide: LanguageDetectionService, useClass: MediaPipeLanguageDetectionService},
        ],
      },
      {path: 'settings', loadChildren: () => import('./pages/settings/settings.routes').then(m => m.routes)},
    ],
  },
  {path: '**', component: NotFoundComponent},
];
