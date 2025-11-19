import { Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHome, lucideShoppingCart, lucideBox, lucideUsers } from '@ng-icons/lucide';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NgIcon],
  providers: [provideIcons({ lucideHome, lucideShoppingCart, lucideBox, lucideUsers })],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {}