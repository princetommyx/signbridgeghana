import {Component, inject, OnInit} from '@angular/core';
import {IonContent} from '@ionic/angular/standalone';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute} from '@angular/router';

interface GSLSign {
  word: string;
  description: string;
  category: string;
  source: string;
  image?: string;
}

@Component({
  selector: 'app-dictionary',
  standalone: true,
  imports: [IonContent, FormsModule, CommonModule],
  templateUrl: './dictionary.component.html',
  styleUrls: ['./dictionary.component.scss'],
})
export class DictionaryComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  searchQuery: string = '';
  searchResults: GSLSign[] = [];
  isSearching: boolean = false;
  allSigns: GSLSign[] = [];

  ngOnInit() {
    // Load the full dictionary from JSON
    this.http.get<GSLSign[]>('assets/docs/gsl-dictionary.json').subscribe(data => {
      this.allSigns = data;

      // Check for deep links from the chatbot
      this.route.queryParams.subscribe(params => {
        if (params['search']) {
          this.searchQuery = params['search'];
          this.onSearch();
        }
      });
    });
  }

  onSearch() {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.searchResults = [];
      this.isSearching = false;
      return;
    }

    this.isSearching = true;
    this.searchResults = this.allSigns.filter(
      sign =>
        sign.word.toLowerCase().includes(query) ||
        sign.category.toLowerCase().includes(query) ||
        sign.description.toLowerCase().includes(query)
    );
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.isSearching = false;
  }
}
