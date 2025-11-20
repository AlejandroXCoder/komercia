import { Component, Input, Output, EventEmitter, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch, lucideChevronDown } from '@ng-icons/lucide';

export interface SelectOption {
  value: any;
  label: string;
  subtitle?: string;
  image?: string;
}

@Component({
  selector: 'app-select-search',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  providers: [
    provideIcons({ lucideSearch, lucideChevronDown }),
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectSearchComponent),
      multi: true
    }
  ],
  templateUrl: './select-search.component.html',
  styleUrls: ['./select-search.component.scss']
})
export class SelectSearchComponent implements ControlValueAccessor, OnInit {
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Seleccione una opción';
  @Input() searchPlaceholder: string = 'Buscar...';
  @Input() disabled: boolean = false;
  @Input() error: boolean = false;

  @Output() optionSelected = new EventEmitter<any>();

  isOpen = false;
  searchQuery = '';
  selectedOption: SelectOption | null = null;
  filteredOptions: SelectOption[] = [];

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit() {
    this.filteredOptions = this.options;
  }

  ngOnChanges() {
    this.filteredOptions = this.filterOptions();
  }

  toggleDropdown() {
    if (!this.disabled) {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.searchQuery = '';
        this.filteredOptions = this.options;
      }
    }
  }

  closeDropdown() {
    this.isOpen = false;
    this.searchQuery = '';
  }

  selectOption(option: SelectOption) {
    this.selectedOption = option;
    this.onChange(option.value);
    this.onTouched();
    this.optionSelected.emit(option.value);
    this.closeDropdown();
  }

  onSearchChange() {
    this.filteredOptions = this.filterOptions();
  }

  filterOptions(): SelectOption[] {
    if (!this.searchQuery.trim()) {
      return this.options;
    }
    
    const query = this.searchQuery.toLowerCase();
    return this.options.filter(option => 
      option.label.toLowerCase().includes(query) ||
      (option.subtitle && option.subtitle.toLowerCase().includes(query))
    );
  }

  // ControlValueAccessor methods
  writeValue(value: any): void {
    if (value) {
      this.selectedOption = this.options.find(opt => opt.value === value) || null;
    } else {
      this.selectedOption = null;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
