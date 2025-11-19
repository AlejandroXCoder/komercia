import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TableComponent } from '../../shared/components/table/table.component';
import { SearchBarComponent } from '../../shared/components/searchBar/searchBar.component';
import { StatComponent } from '../../shared/components/stat/stat.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { InputComponent } from '../../shared/components/Input/input.component';
import { ModalDescriptionDirective } from '../../shared/directives/modal-description.directive';
import { ModalFooterDirective } from '../../shared/directives/modal-footer.directive';
import { provideIcons } from '@ng-icons/core';
import { 
  lucidePlus, 
  lucideDollarSign, 
  lucideShoppingCart, 
  lucideBox,
  lucideCheck 
} from '@ng-icons/lucide';

interface Sale {
  id: number;
  vendedor: string;
  fecha: string;
  total: number;
  estado: string;
  cantidadProductos: number;
  notas?: string;
}

interface Seller {
  id: string;
  nombre: string;
}

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableComponent, 
    SearchBarComponent, 
    StatComponent, 
    ButtonComponent, 
    ModalComponent, 
    InputComponent,
    ModalDescriptionDirective,
    ModalFooterDirective
  ],
  viewProviders: [provideIcons({ 
    lucidePlus, 
    lucideDollarSign, 
    lucideShoppingCart, 
    lucideBox,
    lucideCheck 
  })],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.scss']
})
export class SalesComponent implements OnInit {
  headers = ['ID', 'Vendedor', 'Fecha', 'Total', 'Estado', 'Cantidad de Productos'];
  
  salesData: Sale[] = [
    { id: 1, vendedor: 'Juan Pérez', fecha: '2025-11-14', total: 150.75, estado: 'Activo', cantidadProductos: 3 },
    { id: 2, vendedor: 'Ana Gómez', fecha: '2025-11-13', total: 200.50, estado: 'Activo', cantidadProductos: 5 },
    { id: 3, vendedor: 'Luis Martínez', fecha: '2025-11-12', total: 300.00, estado: 'Inactivo', cantidadProductos: 2 },
    { id: 4, vendedor: 'María López', fecha: '2025-11-11', total: 450.25, estado: 'Activo', cantidadProductos: 7 },
    { id: 5, vendedor: 'Carlos Ruiz', fecha: '2025-11-10', total: 120.00, estado: 'Activo', cantidadProductos: 1 },
    { id: 6, vendedor: 'Sofía Hernández', fecha: '2025-11-09', total: 380.90, estado: 'Activo', cantidadProductos: 4 },
    { id: 7, vendedor: 'Diego Torres', fecha: '2025-11-08', total: 275.60, estado: 'Inactivo', cantidadProductos: 3 }
  ];

  filteredSalesData: any[][] = [];
  
  sellers: Seller[] = [
    { id: '1', nombre: 'Juan Pérez' },
    { id: '2', nombre: 'Ana Gómez' },
    { id: '3', nombre: 'Luis Martínez' },
    { id: '4', nombre: 'María López' },
    { id: '5', nombre: 'Carlos Ruiz' },
    { id: '6', nombre: 'Sofía Hernández' },
    { id: '7', nombre: 'Diego Torres' }
  ];

  saleForm!: FormGroup;
  isModalOpen = false;
  isEditMode = false;
  isSubmitting = false;
  isLoading = false;
  currentSaleId?: number;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initForm();
    this.updateTableData();
  }

  initForm() {
    this.saleForm = this.fb.group({
      vendedor: ['', [Validators.required]],
      fecha: [this.getTodayDate(), [Validators.required]],
      total: ['', [Validators.required, Validators.min(0.01)]],
      estado: ['Activo', [Validators.required]],
      cantidadProductos: ['', [Validators.required, Validators.min(1)]],
      notas: ['']
    });
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  onInputChange(fieldName: string, event: any) {
    const value = event.target?.value || event;
    this.saleForm.get(fieldName)?.setValue(value);
    this.saleForm.get(fieldName)?.markAsTouched();
  }

  onDateChange(event: any) {
    const value = event.target?.value || event;
    this.saleForm.get('fecha')?.setValue(value);
    this.saleForm.get('fecha')?.markAsTouched();
  }

  updateTableData() {
    this.filteredSalesData = this.salesData.map(sale => [
      sale.id,
      sale.vendedor,
      sale.fecha,
      `$${sale.total.toFixed(2)}`,
      sale.estado,
      sale.cantidadProductos
    ]);
  }

  handleSearch(query: string) {
    if (!query.trim()) {
      this.updateTableData();
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = this.salesData.filter(sale =>
      sale.vendedor.toLowerCase().includes(lowercaseQuery) ||
      sale.fecha.includes(query) ||
      sale.id.toString().includes(query) ||
      sale.estado.toLowerCase().includes(lowercaseQuery)
    );

    this.filteredSalesData = filtered.map(sale => [
      sale.id,
      sale.vendedor,
      sale.fecha,
      `$${sale.total.toFixed(2)}`,
      sale.estado,
      sale.cantidadProductos
    ]);
  }

  openModal(sale?: Sale) {
    if (sale) {
      this.isEditMode = true;
      this.currentSaleId = sale.id;
      this.saleForm.patchValue({
        vendedor: this.sellers.find(s => s.nombre === sale.vendedor)?.id,
        fecha: sale.fecha,
        total: sale.total,
        estado: sale.estado,
        cantidadProductos: sale.cantidadProductos,
        notas: sale.notas || ''
      });
    } else {
      this.isEditMode = false;
      this.currentSaleId = undefined;
      this.saleForm.reset({
        vendedor: '',
        fecha: this.getTodayDate(),
        total: '',
        estado: 'Activo',
        cantidadProductos: '',
        notas: ''
      });
    }
    this.isModalOpen = true;
  }

  handleCloseModal() {
    if (this.saleForm.dirty && !confirm('¿Está seguro de cerrar? Los cambios no guardados se perderán.')) {
      return;
    }
    this.closeModal();
  }

  closeModal() {
    this.isModalOpen = false;
    this.saleForm.reset();
    this.isEditMode = false;
    this.currentSaleId = undefined;
  }

  // Método llamado por el botón en el footer
  onSubmit() {
    if (this.saleForm.valid) {
      this.saveSale();
    } else {
      // Marcar todos los campos como touched para mostrar errores
      this.markFormGroupTouched(this.saleForm);
    }
  }

  // Método que maneja el guardado
  async saveSale() {
    // Doble verificación por si acaso
    if (this.saleForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    try {
      // Simular delay de API
      await this.delay(1000);

      const formValue = this.saleForm.value;
      const seller = this.sellers.find(s => s.id === formValue.vendedor);

      if (this.isEditMode && this.currentSaleId) {
        // Actualizar venta existente
        const index = this.salesData.findIndex(s => s.id === this.currentSaleId);
        if (index !== -1) {
          this.salesData[index] = {
            id: this.currentSaleId,
            vendedor: seller?.nombre || '',
            fecha: formValue.fecha,
            total: parseFloat(formValue.total),
            estado: formValue.estado,
            cantidadProductos: parseInt(formValue.cantidadProductos),
            notas: formValue.notas
          };
        }
      } else {
        // Crear nueva venta
        const newSale: Sale = {
          id: this.getNextId(),
          vendedor: seller?.nombre || '',
          fecha: formValue.fecha,
          total: parseFloat(formValue.total),
          estado: formValue.estado,
          cantidadProductos: parseInt(formValue.cantidadProductos),
          notas: formValue.notas
        };
        this.salesData.unshift(newSale);
      }

      this.updateTableData();
      this.closeModal();
      
      // Aquí podrías mostrar una notificación de éxito
      console.log('Venta guardada exitosamente');

    } catch (error) {
      console.error('Error al guardar la venta:', error);
      // Aquí podrías mostrar una notificación de error
    } finally {
      this.isSubmitting = false;
    }
  }

  getNextId(): number {
    return Math.max(...this.salesData.map(s => s.id), 0) + 1;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.saleForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.saleForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return 'Este campo es requerido';
    }
    
    if (field?.hasError('min')) {
      const min = field.errors?.['min'].min;
      return `El valor mínimo es ${min}`;
    }
    
    return 'Campo inválido';
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Computed properties para las stats
  get totalVentas(): number {
    return this.salesData.length;
  }

  get valorTotalVentas(): number {
    return this.salesData.reduce((sum, sale) => sum + sale.total, 0);
  }

  get totalProductos(): number {
    return this.salesData.reduce((sum, sale) => sum + sale.cantidadProductos, 0);
  }
}