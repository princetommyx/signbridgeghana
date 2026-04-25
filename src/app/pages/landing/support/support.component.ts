import {Component} from '@angular/core';
import {IonButton, IonContent, IonIcon} from '@ionic/angular/standalone';
import {FormsModule} from '@angular/forms';
import {NgIf} from '@angular/common';
import {addIcons} from 'ionicons';
import {mailOutline, callOutline, locationOutline, sendOutline} from 'ionicons/icons';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [IonContent, IonIcon, IonButton, FormsModule, NgIf],
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
})
export class SupportComponent {
  name = '';
  email = '';
  message = '';
  isSubmitted = false;

  constructor() {
    addIcons({mailOutline, callOutline, locationOutline, sendOutline});
  }

  onSubmit() {
    if (this.name && this.email && this.message) {
      // Mock submit
      this.isSubmitted = true;
      setTimeout(() => {
        this.isSubmitted = false;
        this.name = '';
        this.email = '';
        this.message = '';
      }, 3000);
    }
  }
}
