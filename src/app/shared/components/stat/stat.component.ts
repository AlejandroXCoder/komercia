import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-stat',
  standalone: true,
  imports: [CommonModule, NgIcon],
  templateUrl: './stat.component.html',
  styleUrls: ['./stat.component.scss']
})
export class StatComponent {
  @Input() title: string = '';
  @Input() value: string = '';
  @Input() icon?: string;
  @Input() colorClass?: string; // 'primary', 'success', 'warning', 'danger', 'purple', 'cyan'
  @Input() size?: 'compact' | 'normal' | 'expanded';
  @Input() clickable: boolean = false;
  @Input() loading: boolean = false;
  @Input() trend?: string; // '+12.5%', '-5.3%'
  @Input() trendUp?: boolean; // true para up, false para down
  @Input() showBadge?: boolean;
  @Input() badgeType?: 'success' | 'warning' | 'danger';

  get classes(): string {
    const classes = [];
    
    if (this.size) classes.push(this.size);
    if (this.colorClass) classes.push(this.colorClass);
    if (this.clickable) classes.push('clickable');
    if (this.loading) classes.push('loading');
    if (this.trend) classes.push('with-trend');
    if (this.showBadge) {
      classes.push('with-badge');
      if (this.badgeType) classes.push(`badge-${this.badgeType}`);
    }
    if (!this.icon) classes.push('no-icon');
    
    return classes.join(' ');
  }
}