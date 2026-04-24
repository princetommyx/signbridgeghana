import {Component, inject, OnInit} from '@angular/core';
import {Store} from '@ngxs/store';
import {takeUntil, tap} from 'rxjs/operators';
import {BaseComponent} from '../../../components/base/base.component';
import {IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar} from '@ionic/angular/standalone';
import {TranslateInputButtonComponent} from '../input/button/button.component';
import {LanguageSelectorsComponent} from '../language-selectors/language-selectors.component';
import {SendFeedbackComponent} from '../send-feedback/send-feedback.component';
import {TranslocoPipe} from '@jsverse/transloco';
import {NtkmeButtonModule} from '@ctrl/ngx-github-buttons';
import {SpokenToSignedComponent} from '../spoken-to-signed/spoken-to-signed.component';
import {SignedToSpokenComponent} from '../signed-to-spoken/signed-to-spoken.component';
import {DropPoseFileComponent} from '../drop-pose-file/drop-pose-file.component';
import {addIcons} from 'ionicons';
import {cloudUpload, informationCircleOutline, language, moon, sunny, videocam} from 'ionicons/icons';
import {RouterLink} from '@angular/router';
import {LogoComponent} from '../../../components/logo/logo.component';
import {AsyncPipe} from '@angular/common';
import {SetSetting} from '../../../modules/settings/settings.actions';
// LandingFooterComponent removed — footer UI removed from templates
import {ChatbotWidgetComponent} from '../chatbot/chatbot-widget.component';

@Component({
  selector: 'app-translate-desktop',
  templateUrl: './translate-desktop.component.html',
  styleUrls: ['./translate-desktop.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonContent,
    IonTitle,
    IonIcon,
    TranslateInputButtonComponent,
    LanguageSelectorsComponent,
    SendFeedbackComponent,
    TranslocoPipe,
    SpokenToSignedComponent,
    SignedToSpokenComponent,
    DropPoseFileComponent,
    IonButton,
    RouterLink,
    LogoComponent,
    AsyncPipe,
    // LandingFooterComponent,
    ChatbotWidgetComponent,
  ],
})
export class TranslateDesktopComponent extends BaseComponent implements OnInit {
  protected store = inject(Store);
  spokenToSigned$ = this.store.select<boolean>(state => state.translate.spokenToSigned);
  theme$ = this.store.select<string>(state => state.settings.theme);

  pages = [{key: 'home', route: '/'}];

  spokenToSigned: boolean;

  constructor() {
    super();

    addIcons({language, videocam, cloudUpload, informationCircleOutline, moon, sunny});
  }

  ngOnInit(): void {
    this.spokenToSigned$
      .pipe(
        tap(spokenToSigned => (this.spokenToSigned = spokenToSigned)),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe();
  }
}
