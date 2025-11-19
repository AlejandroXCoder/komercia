import { Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHome, lucideShoppingCart, lucideBox, lucideUsers } from '@ng-icons/lucide';

@Component({
  selector: 'app-sellers',
  standalone: true,
  imports: [NgIcon],
  providers: [provideIcons({ lucideHome, lucideShoppingCart, lucideBox, lucideUsers })],
  templateUrl: './sellers.component.html',
  styleUrls: ['./sellers.component.scss']
})
export class SellersComponent {}