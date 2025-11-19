import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, NgIcon],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent {
  @Input() label: string = '';
  @Input() icon?: string;
  @Input() isPrimary: boolean = true;
  @Input() variant?: 'success' | 'danger' | 'warning';
  @Input() size?: 'small' | 'large';
  @Input() fullWidth: boolean = false;
  @Input() iconOnly: boolean = false;
  @Input() disabled: boolean = false;
  @Input() isLoading: boolean = false;
  
  @Output() clicked = new EventEmitter<void>();

  handleClick() {
    if (!this.disabled && !this.isLoading) {
      this.clicked.emit();
    }
  }
}