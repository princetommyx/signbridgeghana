import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IonButton, IonIcon} from '@ionic/angular/standalone';
import {addIcons} from 'ionicons';
import {arrowForward, bulbOutline, codeSlashOutline, trendingUpOutline} from 'ionicons/icons';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  imports: [CommonModule, IonButton, IonIcon, RouterLink],
})
export class AboutComponent {
  // SignBridge Ghana About Component
  teamMembers = [
    {name: 'Prince Owusu-Ansah', role: 'Developer'},
    {name: 'Kyei-Charway Theophilus', role: 'Developer'},
    {name: 'Moro Abass Ramzy', role: 'Developer'},
  ];

  technologies = [
    {
      icon: 'code-slash-outline',
      title: 'Text & Speech-to-Sign',
      description:
        'Using low-bandwidth 3D avatars (WebGL/Three.js) to translate spoken language and text into Ghanaian Sign Language with minimal data consumption.',
    },
    {
      icon: 'bulb-outline',
      title: 'Sign-to-Speech',
      description:
        'Using local browser computer vision (MediaPipe) to track hand gestures and convert sign language into spoken language in real-time.',
    },
    {
      icon: 'trending-up-outline',
      title: 'Virtual Tutor',
      description:
        'Interactive AI Chatbots and Smart Tips for active learning, helping users improve their sign language skills through engagement.',
    },
  ];

  constructor() {
    addIcons({arrowForward, codeSlashOutline, bulbOutline, trendingUpOutline});
  }
}
