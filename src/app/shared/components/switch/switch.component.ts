import { Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { CommonModule } from '@angular/common';
import { lucideMoon, lucideSun } from '@ng-icons/lucide';

@Component({
  selector: 'app-switch',
  standalone: true,
  imports: [NgIcon, CommonModule],
  providers: [provideIcons({ lucideMoon, lucideSun })],
  templateUrl: './switch.component.html',
  styleUrls: ['./switch.component.scss']
})
export class SwitchComponent {
  isDarkMode = false;

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode', this.isDarkMode);
  }
}