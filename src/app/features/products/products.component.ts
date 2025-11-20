import { Component, OnInit, HostListener, Inject, PLATFORM_ID, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { TableComponent, TableCell, StatusCell, ActionCell } from '../../shared/components/table/table.component';
import { SearchBarComponent } from '../../shared/components/searchBar/searchBar.component';
import { StatComponent } from '../../shared/components/stat/stat.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/Input/input.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
  lucidePlus, 
  lucideDollarSign, 
  lucideBox,
  lucideCheckCircle,
  lucideImage,
  lucideEye,
  lucideEdit,
  lucideTrash2,
  lucideX
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
    InputComponent,
    NgIcon,
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
    lucideTrash2,
    lucideX
  })],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  headers = ['ID', 'Nombre', 'Descripción', 'Precio', 'Stock', 'Estado', 'Acciones'];
  
  productsData: Product[] = [];
  filteredProductsData: TableCell[][] = [];
  allProducts: Product[] = [];
  modalType: 'none' | 'form' | 'detail' = 'none';
  productForm!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  isLoading = false;
  currentProductId?: number;
  selectedProduct?: Product;
  private isBrowser: boolean;
  selectedFileName: string = '';
  imageBase64: string = '';

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
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

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
          toast.error('Error al cargar productos', {
            description: 'No se pudieron cargar los productos. Intente nuevamente.'
          });
        }
      });
  }

  onInputChange(fieldName: string, event: any) {
    const value = event.target?.value || event;
    this.productForm.get(fieldName)?.setValue(value);
    this.productForm.get(fieldName)?.markAsTouched();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Formato no válido', {
          description: 'Por favor seleccione una imagen válida (JPG, PNG, GIF, WEBP)'
        });
        return;
      }

      // Validar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error('Archivo muy grande', {
          description: 'La imagen no debe superar los 5MB'
        });
        return;
      }

      this.selectedFileName = file.name;
      
      // Convertir a base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64Full = reader.result as string;
        // Remover el prefijo data:image/...;base64, y obtener solo el base64 puro
        const base64Pure = base64Full.split(',')[1];
        
        // Guardar la versión completa para la vista previa
        this.imageBase64 = base64Full;
        
        // Guardar solo el base64 puro en el formulario para enviar a la API
        this.productForm.get('image')?.setValue(base64Pure);
        this.productForm.get('image')?.markAsTouched();
      };
      reader.onerror = () => {
        toast.error('Error al leer archivo', {
          description: 'No se pudo procesar la imagen seleccionada'
        });
      };
      reader.readAsDataURL(file);
    }
  }

  clearImage(): void {
    this.selectedFileName = '';
    this.imageBase64 = '';
    this.productForm.get('image')?.setValue('');
    
    // Limpiar el input file
    if (this.isBrowser) {
      const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
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
      { type: 'status', id: product.id, status: product.status } as StatusCell,
      { type: 'actions', product } as ActionCell
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
      
      // Si hay imagen, agregar el prefijo para la vista previa si no lo tiene
      if (product.image) {
        this.selectedFileName = 'Imagen actual';
        // Si la imagen no comienza con 'data:', asumimos que es base64 puro y agregamos el prefijo
        this.imageBase64 = product.image.startsWith('data:') 
          ? product.image 
          : `data:image/png;base64,${product.image}`;
      } else {
        this.selectedFileName = '';
        this.imageBase64 = '';
      }
      
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
      this.selectedFileName = '';
      this.imageBase64 = '';
      this.productForm.reset({
        name: '',
        description: '',
        price: '',
        stock: '',
        image: '',
        status: true
      });
    }
    this.modalType = 'form';
    
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  handleCloseModal() {
    if (this.productForm.dirty && !confirm('¿Está seguro de cerrar? Los cambios no guardados se perderán.')) {
      return;
    }
    this.closeModal();
  }

  closeModal() {
    this.modalType = 'none';
    
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
    
    // Limpiar el formulario después de la animación
    setTimeout(() => {
      this.productForm.reset();
      this.isEditMode = false;
      this.currentProductId = undefined;
      this.selectedFileName = '';
      this.imageBase64 = '';
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
          // Usar el título y mensaje de la respuesta de la API
          toast.success(response.title || 'Operación exitosa', {
            description: response.message || 'El producto se guardó correctamente.'
          });
          this.loadProducts();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error al guardar el producto:', error);
          // Manejar errores de la API con su estructura
          const errorTitle = error?.error?.title || 'Error al guardar';
          const errorMessage = error?.error?.message || 'Por favor, intente nuevamente.';
          
          toast.error(errorTitle, {
            description: errorMessage
          });
        }
      });
  }

  viewProductDetail(id: number) {
  this.productService.getProductById(id).subscribe({
    next: (response) => {
      this.ngZone.run(() => {
        this.selectedProduct = response.data;
        this.modalType = 'detail';
        this.cdr.detectChanges();
        
        if (this.isBrowser) {
          document.body.style.overflow = 'hidden';
        }
      });
    },
    error: (error) => {
      console.error('Error al cargar producto:', error);
      toast.error('Error al cargar', {
        description: 'No se pudo cargar la información del producto.'
      });
    }
  });
}

  editProduct(id: number) {
    this.productService.getProductById(id).subscribe({
      next: (response) => {
        const product = response.data;
        // Cerrar el modal de detalle primero
        this.modalType = 'none';
        this.selectedProduct = undefined;
        
        // Esperar a que se cierre completamente antes de abrir el de edición
        setTimeout(() => {
          this.openModal(product);
        }, 300); // Tiempo suficiente para la animación de cierre
      },
      error: (error) => {
        console.error('Error al cargar producto:', error);
        toast.error('Error al cargar', {
          description: 'No se pudo cargar el producto para editar.'
        });
      }
    });
  }

  deleteProduct(id: number) {
    if (!confirm('¿Está seguro de eliminar este producto?')) {
      return;
    }

    this.productService.deleteProduct(id).subscribe({
      next: (response) => {
        toast.success(response.title || 'Producto eliminado', {
          description: response.message || 'El producto fue eliminado correctamente.'
        });

        // Si solo queda un elemento en la página y no estamos en la primera, retroceder página
        if (this.filteredProductsData.length === 1 && this.currentPage > 0) {
          this.currentPage--;
        }

        this.loadProducts();
      },
      error: (error) => {
        console.error('Error al eliminar producto:', error);
        const errorTitle = error?.error?.title || 'Error al eliminar';
        const errorMessage = error?.error?.message || 'No se pudo eliminar el producto.';
        
        toast.error(errorTitle, {
          description: errorMessage
        });
      }
    });
  }

  toggleProductStatus(id: number, currentStatus: boolean) {
    const newStatus = !currentStatus;
    this.productService.toggleProductStatus(id, newStatus).subscribe({
      next: (response) => {
        toast.success(response.title || 'Estado actualizado', {
          description: response.message || 'El estado del producto fue actualizado.'
        });
        this.loadProducts();
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
    
    // Limpiar el producto seleccionado después de la animación
    setTimeout(() => {
      this.selectedProduct = undefined;
    }, 300);
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

  ngOnDestroy() {
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }
}