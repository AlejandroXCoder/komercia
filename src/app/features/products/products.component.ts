import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
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
  lucideBox,
  lucideCheckCircle,
  lucideImage,
  lucideEye,
  lucideEdit,
  lucideTrash2
} from '@ng-icons/lucide';
import { ProductService } from '../../core/services/product.service';
import { Product, ProductDTO } from '../../core/models/product.model';
import { finalize } from 'rxjs/operators';
import { TableAction } from '../../shared/components/table/table.component';
import { toast, NgxSonnerToaster } from 'ngx-sonner';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    TableComponent, 
    SearchBarComponent, 
    StatComponent, 
    ButtonComponent, 
    ModalComponent, 
    InputComponent,
    ModalDescriptionDirective,
    ModalFooterDirective,
    NgxSonnerToaster
  ],
  providers: [provideIcons({ 
    lucidePlus, 
    lucideDollarSign, 
    lucideBox,
    lucideCheckCircle,
    lucideImage,
    lucideEye,
    lucideEdit,
    lucideTrash2
  })],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  headers = ['ID', 'Nombre', 'Descripción', 'Precio', 'Stock', 'Estado', 'Acciones'];
  
  productsData: Product[] = [];
  filteredProductsData: any[][] = [];
  allProducts: Product[] = [];
  modalType: 'none' | 'form' | 'detail' = 'none';
  productForm!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  isLoading = false;
  currentProductId?: number;
  selectedProduct?: Product;

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
    private productService: ProductService
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadProducts();
  }

  initForm() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(255)]],
      price: ['', [Validators.required, Validators.min(0.01)]],
      stock: ['', [Validators.required, Validators.min(0)]],
      image: [''],
      status: [true, [Validators.required]]
    });
  }

  loadProducts() {
  this.isLoading = true;
  this.productService.getAllProducts({ page: this.currentPage, size: this.pageSize })
    .pipe(finalize(() => {
      this.isLoading = false;
    }))
    .subscribe({
      next: (response) => {
        
        // CAMBIO AQUÍ: Acceder a response.data.data en lugar de response.data.content
        this.productsData = response.data.data || [];
        this.allProducts = response.data.data || [];
        this.totalElements = response.data.totalItems || 0;
        this.totalPages = response.data.totalPages || 0;
        this.updateTableData();
      },
      error: (error) => {
        this.productsData = [];
        this.allProducts = [];
        this.updateTableData();
      }
    });
}

  onInputChange(fieldName: string, event: any) {
    const value = event.target?.value || event;
    this.productForm.get(fieldName)?.setValue(value);
    this.productForm.get(fieldName)?.markAsTouched();
  }

  updateTableData() {
    if (!this.productsData || this.productsData.length === 0) {
      this.filteredProductsData = [];
      return;
    }
    
    this.filteredProductsData = this.productsData.map(product => [
      product.id,
      product.name,
      product.description || 'Sin descripción',
      `$${product.price.toFixed(2)}`,
      product.stock,
      { status: product.status, id: product.id },
      { product } // Pasamos el producto completo para las acciones
    ]);
  }

  handleSearch(query: string) {
    if (!this.allProducts || this.allProducts.length === 0) {
      this.filteredProductsData = [];
      return;
    }

    if (!query.trim()) {
      this.productsData = this.allProducts;
      this.updateTableData();
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    this.productsData = this.allProducts.filter(product =>
      product.name.toLowerCase().includes(lowercaseQuery) ||
      product.description.toLowerCase().includes(lowercaseQuery) ||
      product.id.toString().includes(query)
    );

    this.updateTableData();
  }

  openModal(product?: Product) {
    if (product) {
      this.isEditMode = true;
      this.currentProductId = product.id;
      this.productForm.patchValue({
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        image: product.image,
        status: product.status
      });
    } else {
      this.isEditMode = false;
      this.currentProductId = undefined;
      this.productForm.reset({
        name: '',
        description: '',
        price: '',
        stock: '',
        image: '',
        status: true
      });
    }
    this.modalType = 'form'
  }

  handleCloseModal() {
    if (this.productForm.dirty && !confirm('¿Está seguro de cerrar? Los cambios no guardados se perderán.')) {
      return;
    }
    this.closeModal();
  }

  closeModal() {
    this.modalType = 'none';
    this.productForm.reset();
    this.isEditMode = false;
    this.currentProductId = undefined;
  }

  onSubmit() {
    if (this.productForm.valid) {
      this.saveProduct();
    } else {
      this.markFormGroupTouched(this.productForm);
    }
  }

  async saveProduct() {
    if (this.productForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    const formValue = this.productForm.value;
    const productDTO: ProductDTO = {
      name: formValue.name,
      description: formValue.description || '',
      price: parseFloat(formValue.price),
      stock: parseInt(formValue.stock),
      image: formValue.image || '',
      status: formValue.status
    };

    const request$ = this.isEditMode && this.currentProductId
      ? this.productService.updateProduct(this.currentProductId, productDTO)
      : this.productService.createProduct(productDTO);

    request$
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (response) => {
          toast.success(response.message || 'Operación exitosa', {
            description: 'El producto se guardó correctamente.'
          });
          this.loadProducts();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error al guardar el producto:', error);
          toast.error('Error al guardar el producto', {
            description: error?.error?.message || 'Por favor, intente nuevamente.'
          });
        }
      });
  }

  viewProductDetail(id: number) {
    this.productService.getProductById(id).subscribe({
      next: (response) => {
        this.selectedProduct = response.data;
        this.modalType = 'detail';
      },
      error: (error) => {
        console.error('Error al cargar producto:', error);
      }
    });
  }

  editProduct(id: number) {
    this.productService.getProductById(id).subscribe({
      next: (response) => {
        const product = response.data;
        this.closeDetailModal(); 
        setTimeout(() => {
          this.openModal(product);
        }, 100); 
      },
      error: (error) => {
        console.error('Error al cargar producto:', error);
      }
    });
  }

  deleteProduct(id: number) {
    if (!confirm('¿Está seguro de eliminar este producto?')) {
      return;
    }

    this.productService.deleteProduct(id).subscribe({
      next: (response) => {
        toast.success(response.message || 'Producto eliminado', {
          description: 'El producto fue eliminado correctamente.'
        });
        this.loadProducts();
      },
      error: (error) => {
        console.error('Error al eliminar producto:', error);
        toast.error('Error al eliminar el producto', {
          description: error?.error?.message || 'No se pudo eliminar el producto.'
        });
      }
    });
  }

  toggleProductStatus(id: number, currentStatus: boolean) {
    const newStatus = !currentStatus;
    this.productService.toggleProductStatus(id, newStatus).subscribe({
      next: (response) => {
        toast.success(response.message || 'Estado actualizado', {
          description: 'El estado del producto fue actualizado.'
        });
        this.loadProducts();
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        toast.error('Error al cambiar el estado', {
          description: error?.error?.message || 'No se pudo actualizar el estado.'
        });
      }
    });
  }

  closeDetailModal() {
    this.modalType = 'none';
    this.selectedProduct = undefined;
  }

  handleAction(action: TableAction): void {
    const product = action.data as Product;
    
    switch (action.type) {
      case 'view':
        this.viewProductDetail(product.id);
        break;
      case 'edit':
        this.editProduct(product.id);
        break;
      case 'delete':
        this.deleteProduct(product.id);
        break;
    }
  }

  handleStatusToggle(event: { id: number; currentStatus: boolean }): void {
    this.toggleProductStatus(event.id, event.currentStatus);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return 'Este campo es requerido';
    }
    
    if (field?.hasError('min')) {
      const min = field.errors?.['min'].min;
      return `El valor mínimo es ${min}`;
    }

    if (field?.hasError('maxLength')) {
      const maxLength = field.errors?.['maxLength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
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



  get totalProductos(): number {
    return this.totalElements || this.productsData.length;
  }

  get valorTotalInventario(): string {
    const total = this.allProducts.reduce((sum, product) => sum + (product.price * product.stock), 0);
    return `$${total.toFixed(2)}`;
  }

  get productosActivos(): number {
    return this.allProducts.filter(p => p.status).length;
  }
}