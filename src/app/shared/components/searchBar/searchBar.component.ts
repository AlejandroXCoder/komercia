import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch, lucideX } from '@ng-icons/lucide';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, NgIcon],
  viewProviders: [provideIcons({ lucideSearch, lucideX })],
  templateUrl: './searchBar.component.html',
  styleUrls: ['./searchBar.component.scss']
})
export class SearchBarComponent {
  @Input() placeholder: string = 'Buscar...';
  @Input() showClearButton: boolean = true;
  @Input() debounceTime: number = 300;
  
  @Output() inputChange = new EventEmitter<string>();
  @Output() enterPressed = new EventEmitter<string>();
  @Output() cleared = new EventEmitter<void>();

  searchValue: string = '';
  private debounceTimer: any;

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchValue = value;

    // Limpiar el timer anterior
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Emitir después del debounce
    this.debounceTimer = setTimeout(() => {
      this.inputChange.emit(value);
    }, this.debounceTime);
  }

  onEnter(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.enterPressed.emit(this.searchValue);
  }

  clearSearch(): void {
    this.searchValue = '';
    this.inputChange.emit('');
    this.cleared.emit();
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}