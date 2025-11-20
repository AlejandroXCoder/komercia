import { Component, OnInit, HostListener, Inject, PLATFORM_ID, ChangeDetectorRef, NgZone, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { TableComponent, TableCell, StatusCell, ActionCell } from '../../shared/components/table/table.component';
import { SearchBarComponent } from '../../shared/components/searchBar/searchBar.component';
import { StatComponent } from '../../shared/components/stat/stat.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { SelectSearchComponent, SelectOption } from '../../shared/components/select-search/select-search.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
  lucidePlus, 
  lucideDollarSign, 
  lucideShoppingCart, 
  lucideBox,
  lucideEye,
  lucideEdit,
  lucideTrash2,
  lucideX,
  lucideMinus
} from '@ng-icons/lucide';
import { SaleService } from '../../core/services/sale.service';
import { Sale, SaleDTO, SaleDetailDTO } from '../../core/models/sale.model';
import { SellerService } from '../../core/services/seller.service';
import { Seller } from '../../core/models/seller.model';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { finalize } from 'rxjs/operators';
import { TableAction } from '../../shared/components/table/table.component';
import { toast, NgxSonnerToaster } from 'ngx-sonner';
import { forkJoin } from 'rxjs';

interface ProductCard {
  product: {
    id: number;
    name: string;
    price: number;
    stock: number;
    image?: string;
    description?: string;
    status?: boolean;
  };
  quantity: number;
}

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    TableComponent, 
    SearchBarComponent, 
    StatComponent, 
    ButtonComponent, 
    SelectSearchComponent,
    NgIcon,
    NgxSonnerToaster
  ],
  providers: [provideIcons({ 
    lucidePlus, 
    lucideDollarSign, 
    lucideShoppingCart, 
    lucideBox,
    lucideEye,
    lucideEdit,
    lucideTrash2,
    lucideX,
    lucideMinus
  })],
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.scss']
})
export class SalesComponent implements OnInit, OnDestroy {
  headers = ['ID', 'Vendedor', 'Fecha', 'Total', 'Productos', 'Estado', 'Acciones'];
  
  salesData: Sale[] = [];
  filteredSalesData: TableCell[][] = [];
  allSales: Sale[] = [];
  sellers: Seller[] = [];
  products: Product[] = [];
  productCards: ProductCard[] = [];
  
  sellerOptions: SelectOption[] = [];
  productOptions: SelectOption[] = [];
  selectedProductId: string = '';
  
  modalType: 'none' | 'form' | 'detail' = 'none';
  saleForm!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  isLoading = false;
  currentSaleId?: number;
  selectedSale?: Sale;
  private isBrowser: boolean;

  get isModalOpen(): boolean {
    return this.modalType === 'form';
  }

  get isDetailModalOpen(): boolean {
    return this.modalType === 'detail';
  }

  // Paginación
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  constructor(
    private fb: FormBuilder,
    private saleService: SaleService,
    private sellerService: SellerService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.initForm();
    this.loadInitialData();
  }

  loadInitialData() {
    this.isLoading = true;
    
    forkJoin({
      sales: this.saleService.getAllSales({ page: this.currentPage, size: this.pageSize }),
      sellers: this.sellerService.getAllSellers({ page: 0, size: 100 }),
      products: this.productService.getAllProducts({ page: 0, size: 100 })
    }).pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (results) => {
          this.salesData = results.sales.data.data || [];
          this.allSales = results.sales.data.data || [];
          this.totalElements = results.sales.data.totalItems || 0;
          this.totalPages = results.sales.data.totalPages || 0;
          
          this.sellers = results.sellers.data.data || [];
          this.products = results.products.data.data?.filter(p => p.status && p.stock > 0) || [];
          
          // Crear opciones para los selects
          this.sellerOptions = this.sellers.map(seller => ({
            value: seller.id.toString(),
            label: seller.name,
            subtitle: seller.email,
            image: seller.photo ? `data:image/jpeg;base64,${seller.photo}` : undefined
          }));

          this.productOptions = this.products.map(product => ({
            value: product.id.toString(),
            label: product.name,
            subtitle: `$${product.price.toFixed(2)} - Stock: ${product.stock}`,
            image: product.image ? `data:image/jpeg;base64,${product.image}` : undefined
          }));
          
          this.updateTableData();
        },
        error: (error) => {
          console.error('Error al cargar datos:', error);
          toast.error('Error al cargar datos', {
            description: 'No se pudieron cargar los datos iniciales.'
          });
        }
      });
  }

  loadSales() {
    this.isLoading = true;
    this.saleService.getAllSales({ page: this.currentPage, size: this.pageSize })
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.salesData = response.data.data || [];
          this.allSales = response.data.data || [];
          this.totalElements = response.data.totalItems || 0;
          this.totalPages = response.data.totalPages || 0;
          this.updateTableData();
        },
        error: (error) => {
          this.salesData = [];
          this.allSales = [];
          this.updateTableData();
          toast.error('Error al cargar ventas', {
            description: 'No se pudieron cargar las ventas. Intente nuevamente.'
          });
        }
      });
  }

  initForm() {
    this.saleForm = this.fb.group({
      seller: ['', [Validators.required]],
      date: [this.getTodayDate(), [Validators.required]],
      status: [true, [Validators.required]]
    });
  }

  addProductToSale() {
    if (!this.selectedProductId) {
      toast.error('Seleccione un producto', {
        description: 'Debe seleccionar un producto antes de agregarlo.'
      });
      return;
    }

    const product = this.products.find(p => p.id.toString() === this.selectedProductId);
    if (!product) return;

    // Verificar si ya existe
    const existing = this.productCards.find(pc => pc.product.id === product.id);
    if (existing) {
      existing.quantity++;
      if (existing.quantity > product.stock) {
        existing.quantity = product.stock;
        toast.error('Stock insuficiente', {
          description: `Solo hay ${product.stock} unidades disponibles.`
        });
      }
      this.selectedProductId = '';
      return;
    }

    this.productCards.push({ 
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
        image: product.image,
        description: product.description,
        status: product.status
      }, 
      quantity: 1 
    });
    this.selectedProductId = '';
  }

  removeProductCard(productId: number) {
    this.productCards = this.productCards.filter(pc => pc.product.id !== productId);
  }

  updateQuantity(productId: number, change: number) {
    const card = this.productCards.find(pc => pc.product.id === productId);
    if (!card) return;

    const newQuantity = card.quantity + change;
    if (newQuantity < 1) {
      this.removeProductCard(productId);
    } else if (newQuantity <= card.product.stock) {
      card.quantity = newQuantity;
    } else {
      toast.error('Stock insuficiente', {
        description: `Solo hay ${card.product.stock} unidades disponibles.`
      });
    }
  }

  get totalProductsInSale(): number {
    return this.productCards.reduce((sum, card) => sum + card.quantity, 0);
  }

  get subtotalSale(): number {
    return this.productCards.reduce((sum, card) => sum + (card.product.price * card.quantity), 0);
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  onInputChange(fieldName: string, value: any) {
    this.saleForm.get(fieldName)?.setValue(value);
    this.saleForm.get(fieldName)?.markAsTouched();
  }

  updateTableData() {
    if (!this.salesData || this.salesData.length === 0) {
      this.filteredSalesData = [];
      return;
    }
    this.filteredSalesData = this.salesData.map(sale => [
      sale.id,
      sale.seller.name,
      new Date(sale.date).toLocaleDateString('es-ES'),
      `$${sale.total.toFixed(2)}`,
      sale.quantityProducts,
      { type: 'status', id: sale.id, status: sale.status } as StatusCell,
      { type: 'actions', product: sale } as ActionCell
    ]);
  }

  handleSearch(query: string) {
    if (!this.allSales || this.allSales.length === 0) {
      this.filteredSalesData = [];
      return;
    }

    if (!query.trim()) {
      this.salesData = this.allSales;
      this.updateTableData();
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    this.salesData = this.allSales.filter(sale =>
      sale.seller.name.toLowerCase().includes(lowercaseQuery) ||
      sale.date.includes(query) ||
      sale.id.toString().includes(query)
    );

    this.updateTableData();
  }

  openModal(sale?: Sale) {
    if (sale) {
      this.isEditMode = true;
      this.currentSaleId = sale.id;
      
      // Cargar productos como cards
      this.productCards = sale.details.map(detail => ({
        product: detail.product,
        quantity: detail.quantity
      }));
      
      this.saleForm.patchValue({
        seller: sale.seller.id.toString(),
        date: sale.date,
        status: sale.status
      });
    } else {
      this.isEditMode = false;
      this.currentSaleId = undefined;
      this.productCards = [];
      
      this.saleForm.reset({
        seller: '',
        date: this.getTodayDate(),
        status: true
      });
    }
    this.modalType = 'form';
    
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  handleCloseModal() {
    if (this.saleForm.dirty && !confirm('¿Está seguro de cerrar? Los cambios no guardados se perderán.')) {
      return;
    }
    this.closeModal();
  }

  closeModal() {
    this.modalType = 'none';
    
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
    
    setTimeout(() => {
      this.saleForm.reset();
      this.productCards = [];
      this.selectedProductId = '';
      this.isEditMode = false;
      this.currentSaleId = undefined;
    }, 300);
  }

  onOverlayClick(event: MouseEvent, modalType: 'form' | 'detail') {
    if (event.target === event.currentTarget) {
      if (modalType === 'form') {
        this.handleCloseModal();
      } else {
        this.closeDetailModal();
      }
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.isModalOpen) {
        this.handleCloseModal();
      } else if (this.isDetailModalOpen) {
        this.closeDetailModal();
      }
    }
  }

  onSubmit() {
    if (this.saleForm.valid) {
      this.saveSale();
    } else {
      this.markFormGroupTouched(this.saleForm);
    }
  }

  async saveSale() {
    if (this.saleForm.invalid || this.productCards.length === 0) {
      if (this.productCards.length === 0) {
        toast.error('Agregue productos', {
          description: 'Debe agregar al menos un producto a la venta.'
        });
      }
      return;
    }

    this.isSubmitting = true;

    const formValue = this.saleForm.value;
    
    const saleDTO: SaleDTO = {
      seller: {
        id: parseInt(formValue.seller)
      },
      date: formValue.date,
      status: formValue.status,
      details: this.productCards.map(card => ({
        product: {
          id: card.product.id
        },
        quantity: card.quantity
      }))
    };

    const request$ = this.isEditMode && this.currentSaleId
      ? this.saleService.updateSale(this.currentSaleId, saleDTO)
      : this.saleService.createSale(saleDTO);

    request$
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (response) => {
          toast.success(response.title || 'Operación exitosa', {
            description: response.message || 'La venta se guardó correctamente.'
          });
          this.loadSales();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error al guardar la venta:', error);
          const errorTitle = error?.error?.title || 'Error al guardar';
          const errorMessage = error?.error?.message || 'Por favor, intente nuevamente.';
          
          toast.error(errorTitle, {
            description: errorMessage
          });
        }
      });
  }

  viewSaleDetail(id: number) {
    this.saleService.getSaleById(id).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.selectedSale = response.data;
          this.modalType = 'detail';
          this.cdr.detectChanges();
          
          if (this.isBrowser) {
            document.body.style.overflow = 'hidden';
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar venta:', error);
        toast.error('Error al cargar', {
          description: 'No se pudo cargar la información de la venta.'
        });
      }
    });
  }

  editSale(id: number) {
    this.saleService.getSaleById(id).subscribe({
      next: (response) => {
        const sale = response.data;
        this.modalType = 'none';
        this.selectedSale = undefined;
        
        setTimeout(() => {
          this.openModal(sale);
        }, 300);
      },
      error: (error) => {
        console.error('Error al cargar venta:', error);
        toast.error('Error al cargar', {
          description: 'No se pudo cargar la venta para editar.'
        });
      }
    });
  }

  deleteSale(id: number) {
    if (!confirm('¿Está seguro de eliminar esta venta?')) {
      return;
    }

    this.saleService.deleteSale(id).subscribe({
      next: (response) => {
        toast.success(response.title || 'Venta eliminada', {
          description: response.message || 'La venta fue eliminada correctamente.'
        });

        if (this.filteredSalesData.length === 1 && this.currentPage > 0) {
          this.currentPage--;
        }

        this.loadSales();
      },
      error: (error) => {
        console.error('Error al eliminar venta:', error);
        const errorTitle = error?.error?.title || 'Error al eliminar';
        const errorMessage = error?.error?.message || 'No se pudo eliminar la venta.';
        
        toast.error(errorTitle, {
          description: errorMessage
        });
      }
    });
  }

  toggleSaleStatus(id: number, currentStatus: boolean) {
    const newStatus = !currentStatus;
    this.saleService.toggleSaleStatus(id, newStatus).subscribe({
      next: (response) => {
        toast.success(response.title || 'Estado actualizado', {
          description: response.message || 'El estado de la venta fue actualizado.'
        });
        this.loadSales();
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        const errorTitle = error?.error?.title || 'Error al actualizar';
        const errorMessage = error?.error?.message || 'No se pudo actualizar el estado.';
        
        toast.error(errorTitle, {
          description: errorMessage
        });
      }
    });
  }

  closeDetailModal() {
    this.modalType = 'none';
    
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
    
    setTimeout(() => {
      this.selectedSale = undefined;
    }, 300);
  }

  handleAction(action: TableAction): void {
    const sale = action.data as Sale;
    
    switch (action.type) {
      case 'view':
        this.viewSaleDetail(sale.id);
        break;
      case 'edit':
        this.editSale(sale.id);
        break;
      case 'delete':
        this.deleteSale(sale.id);
        break;
    }
  }

  handleStatusToggle(event: { id: number; currentStatus: boolean }): void {
    this.toggleSaleStatus(event.id, event.currentStatus);
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
    
    if (field?.hasError('minlength')) {
      return 'Debe agregar al menos un producto';
    }
    
    return 'Campo inválido';
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(c => {
          if (c instanceof FormGroup) {
            this.markFormGroupTouched(c);
          }
        });
      }
    });
  }

  get totalVentas(): number {
    return this.totalElements || this.salesData.length;
  }

  get valorTotalVentas(): string {
    const total = this.allSales.reduce((sum, sale) => sum + sale.total, 0);
    return `$${total.toFixed(2)}`;
  }

  get totalProductos(): number {
    return this.allSales.reduce((sum, sale) => sum + sale.quantityProducts, 0);
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }
}