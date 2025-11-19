import { Component, HostListener } from '@angular/core';
import { Router, RouterOutlet, RouterModule } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
  lucideHome, 
  lucideShoppingCart, 
  lucideBox, 
  lucideUsers, 
  lucideMoon, 
  lucideLogOut,
  lucideMenu,
  lucideX,
  lucideUser
} from '@ng-icons/lucide';
import { SwitchComponent } from '../../../shared/components/switch/switch.component';
import { LogoutComponent } from '../../../shared/components/logout/logout.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterModule, NgIcon, SwitchComponent, LogoutComponent, CommonModule],
  providers: [provideIcons({ 
    lucideHome, 
    lucideShoppingCart, 
    lucideBox, 
    lucideUsers, 
    lucideMoon, 
    lucideLogOut,
    lucideMenu,
    lucideX,
    lucideUser
  })],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent {
  currentRoute: string = '';
  isSidebarOpen: boolean = false;

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    
    // Prevenir scroll en el body cuando el sidebar está abierto en mobile
    if (this.isSidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeSidebarOnMobile(): void {
    // Cerrar el sidebar al hacer clic en un link solo en mobile/tablet
    if (window.innerWidth < 1024) {
      this.isSidebarOpen = false;
      document.body.style.overflow = '';
    }
  }

  // Cerrar sidebar al cambiar el tamaño de ventana a desktop
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    if (event.target.innerWidth >= 1024) {
      this.isSidebarOpen = false;
      document.body.style.overflow = '';
    }
  }
}