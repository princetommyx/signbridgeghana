import {Component} from '@angular/core';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonIcon,
  IonSearchbar,
  IonChip,
  IonLabel,
} from '@ionic/angular/standalone';
import {addIcons} from 'ionicons';
import {searchOutline, bookOutline, schoolOutline, heartOutline, starOutline} from 'ionicons/icons';

@Component({
  selector: 'app-dictionary',
  templateUrl: './dictionary.component.html',
  styleUrls: ['./dictionary.component.scss'],
  imports: [
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonIcon,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonSearchbar,
    IonChip,
    IonLabel,
  ],
})
export class DictionaryComponent {
  categories = [
    {name: 'Greetings', icon: 'heart-outline'},
    {name: 'Numbers', icon: 'star-outline'},
    {name: 'Common Phrases', icon: 'book-outline'},
    {name: 'Education', icon: 'school-outline'},
  ];

  featuredSigns = [
    {
      word: 'Akwaaba',
      description: 'The traditional Ghanaian welcome.',
      category: 'Greetings',
    },
    {
      word: 'Thank You',
      description: 'Expression of gratitude in GSL.',
      category: 'Common Phrases',
    },
    {
      word: 'Family',
      description: 'Signs for family members.',
      category: 'Social',
    },
  ];

  constructor() {
    addIcons({searchOutline, bookOutline, schoolOutline, heartOutline, starOutline});
  }
}
