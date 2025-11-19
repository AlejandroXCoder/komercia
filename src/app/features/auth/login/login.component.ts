import { Component } from '@angular/core';
import { InputComponent } from '../../../shared/components/Input/input.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMail, lucideLock} from '@ng-icons/lucide';
import { SwitchComponent } from '../../../shared/components/switch/switch.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [InputComponent, NgIcon, SwitchComponent],
  providers: [provideIcons({ lucideMail, lucideLock })],
  templateUrl: './login.component.html'
})
export class LoginComponent {}