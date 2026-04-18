import {Component, ElementRef, inject, ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {IonButton} from '@ionic/angular/standalone';
import {GeminiChatContext, GeminiChatMessage, GeminiChatService} from './gemini-chat.service';
import {Store} from '@ngxs/store';

@Component({
  selector: 'app-chatbot-widget',
  standalone: true,
  templateUrl: './chatbot-widget.component.html',
  styleUrls: ['./chatbot-widget.component.scss'],
  imports: [IonButton, FormsModule],
})
export class ChatbotWidgetComponent {
  private store = inject(Store);
  private chatService = inject(GeminiChatService);

  @ViewChild('messagesList') messagesList?: ElementRef<HTMLDivElement>;

  isOpen = false;
  isSending = false;
  errorMessage = '';
  inputText = '';
  messages: GeminiChatMessage[] = [
    {
      role: 'assistant',
      text: 'Hello! I can help with translations, sign language questions, and how to use this tool.',
    },
  ];

  get canSend(): boolean {
    return !this.isSending && !!this.inputText.trim();
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.scrollToBottom();
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  send() {
    const userText = this.inputText.trim();
    if (!userText || this.isSending) {
      return;
    }

    const context = this.getContext();

    this.errorMessage = '';
    this.messages.push({role: 'user', text: userText});
    this.inputText = '';
    this.isSending = true;
    this.scrollToBottom();

    this.chatService.sendMessage({messages: this.messages, userMessage: userText, context}).subscribe({
      next: reply => {
        this.messages.push({role: 'assistant', text: reply});
        this.isSending = false;
        this.scrollToBottom();
      },
      error: () => {
        this.errorMessage = 'Unable to get a response right now. Please try again in a moment.';
        this.isSending = false;
        this.scrollToBottom();
      },
    });
  }

  private getContext(): GeminiChatContext {
    return {
      spokenToSigned: this.store.selectSnapshot(state => state.translate.spokenToSigned),
      spokenLanguage: this.store.selectSnapshot(state => state.translate.spokenLanguage),
      signedLanguage: this.store.selectSnapshot(state => state.translate.signedLanguage),
      detectedLanguage: this.store.selectSnapshot(state => state.translate.detectedLanguage),
    };
  }

  private scrollToBottom() {
    setTimeout(() => {
      const element = this.messagesList?.nativeElement;
      if (!element) {
        return;
      }
      element.scrollTop = element.scrollHeight;
    });
  }
}
