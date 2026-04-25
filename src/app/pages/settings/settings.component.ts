import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonSelect,
  IonSelectOption,
  IonIcon,
  IonButton,
} from '@ionic/angular/standalone';
import {addIcons} from 'ionicons';
import {
  accessibilityOutline,
  colorPaletteOutline,
  notificationsOutline,
  megaphoneOutline,
  informationCircleOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    IonSelect,
    IonSelectOption,
    IonIcon,
    IonButton,
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  fontSize: string = 'medium';
  highContrast: boolean = false;
  hapticFeedback: boolean = true;
  vibrateOnSign: boolean = true;
  visualAlerts: boolean = true;
  notifications: boolean = true;

  constructor() {
    addIcons({
      accessibilityOutline,
      colorPaletteOutline,
      notificationsOutline,
      megaphoneOutline,
      informationCircleOutline,
    });
  }

  ngOnInit() {
    // Load settings from local storage if available
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      this.fontSize = settings.fontSize || 'medium';
      this.highContrast = settings.highContrast || false;
      this.hapticFeedback = settings.hapticFeedback || true;
      this.vibrateOnSign = settings.vibrateOnSign || true;
      this.visualAlerts = settings.visualAlerts || true;
      this.notifications = settings.notifications || true;
    }
  }

  saveSettings() {
    const settings = {
      fontSize: this.fontSize,
      highContrast: this.highContrast,
      hapticFeedback: this.hapticFeedback,
      vibrateOnSign: this.vibrateOnSign,
      visualAlerts: this.visualAlerts,
      notifications: this.notifications,
    };
    localStorage.setItem('app-settings', JSON.stringify(settings));
    this.applyAccessibilityChanges();
  }

  applyAccessibilityChanges() {
    // Apply font size
    document.documentElement.style.setProperty(
      '--app-font-scale',
      this.fontSize === 'small' ? '0.9' : this.fontSize === 'large' ? '1.2' : '1.0'
    );

    // Apply high contrast
    if (this.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }
}
