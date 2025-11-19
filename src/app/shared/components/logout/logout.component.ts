import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLogOut } from '@ng-icons/lucide';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [CommonModule, NgIcon],
  providers: [provideIcons({ lucideLogOut })],
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss']
})
export class LogoutComponent {
  @Input() showText: boolean = true;
  @Output() onLogout = new EventEmitter<void>();
  
  isLoggingOut: boolean = false;

  constructor(private router: Router) {}

  async handleLogout(): Promise<void> {
    if (this.isLoggingOut) return;

    try {
      this.isLoggingOut = true;

      // Emitir evento para que el componente padre maneje la lógica
      this.onLogout.emit();

      // Simular delay de logout (puedes quitar esto si no lo necesitas)
      await this.delay(500);

      // Limpiar datos de sesión
      this.clearSession();

      // Redirigir al login
      await this.router.navigate(['/login']);

    } catch (error) {
      console.error('Error durante el logout:', error);
    } finally {
      this.isLoggingOut = false;
    }
  }

  private clearSession(): void {
    // Limpiar localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    
    // Limpiar sessionStorage
    sessionStorage.clear();

    // Si usas cookies, aquí las limpiarías también
    // document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}