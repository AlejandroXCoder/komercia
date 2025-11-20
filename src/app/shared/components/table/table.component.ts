import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon,  provideIcons} from '@ng-icons/core';
import { lucideEye, lucideEdit, lucideTrash2} from '@ng-icons/lucide';

export type TableCell = string | number | StatusCell | ActionCell | ImageCell;

export interface StatusCell {
  type: 'status';
  id: number;
  status: boolean;
}

export interface ActionCell {
  type: 'actions';
  product: any;
}

export interface ImageCell {
  type: 'image';
  src: string;
  alt?: string;
}

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
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableComponent {
  @Input() headers: string[] = [];
  @Input() data: TableCell[][] = [];
  @Input() isLoading: boolean = false;

  @Output() actionTriggered = new EventEmitter<TableAction>();
  @Output() statusToggled = new EventEmitter<{ id: number; currentStatus: boolean }>();

  rowsPerPageOptions = [5, 10, 20, 50];
  rowsPerPage = 5;
  currentPage = 1;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.data.length / this.rowsPerPage));
  }

  get paginatedData(): TableCell[][] {
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    return this.data.slice(startIndex, startIndex + this.rowsPerPage);
  }

  goToPreviousPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  goToNextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  trackByRow = (index: number, row: TableCell[]) => row[0];

  isStatusCell(cell: TableCell): cell is StatusCell {
    return typeof cell === 'object' && cell !== null && (cell as StatusCell).type === 'status';
  }

  isActionCell(cell: TableCell): cell is ActionCell {
    return typeof cell === 'object' && cell !== null && (cell as ActionCell).type === 'actions';
  }

  isImageCell(cell: TableCell): cell is ImageCell {
    return typeof cell === 'object' && cell !== null && (cell as ImageCell).type === 'image';
  }

  onAction(type: 'view' | 'edit' | 'delete', product: any): void {
    this.actionTriggered.emit({ type, data: product });
  }

  onStatusToggle(id: number, currentStatus: boolean): void {
    this.statusToggled.emit({ id, currentStatus });
  }
}