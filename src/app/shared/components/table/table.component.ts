import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideEdit, lucideTrash2 } from '@ng-icons/lucide';

export interface TableAction {
  type: 'view' | 'edit' | 'delete';
  data: any;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  providers: [provideIcons({ lucideEye, lucideEdit, lucideTrash2 })],
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent {
  @Input() headers: string[] = [];
  @Input() data: any[][] = [];
  @Input() isLoading: boolean = false;
  
  @Output() actionTriggered = new EventEmitter<TableAction>();
  @Output() statusToggled = new EventEmitter<{ id: number; currentStatus: boolean }>();

  rowsPerPageOptions = [5, 10, 20, 50];
  rowsPerPage = 5;
  currentPage = 1;
  totalPages = 1;
  paginatedData: any[][] = [];

  ngOnInit() {
    this.updatePagination();
  }

  ngOnChanges() {
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.data.length / this.rowsPerPage) || 1;
    
    // Ajustar currentPage si es mayor que totalPages
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    const endIndex = startIndex + this.rowsPerPage;
    this.paginatedData = this.data.slice(startIndex, endIndex);
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  isStatusColumn(value: any): boolean {
    return this.isObject(value) && 'status' in value && 'id' in value;
  }

  isActionsColumn(value: any): boolean {
    return this.isObject(value) && 'product' in value;
  }

  onAction(type: 'view' | 'edit' | 'delete', product: any): void {
    this.actionTriggered.emit({ type, data: product });
  }

  onStatusToggle(id: number, currentStatus: boolean): void {
    this.statusToggled.emit({ id, currentStatus });
  }
}