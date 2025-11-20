import { Component, OnInit, HostListener, Inject, PLATFORM_ID, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { TableComponent, TableCell, StatusCell, ActionCell, ImageCell } from '../../shared/components/table/table.component';
import { SearchBarComponent } from '../../shared/components/searchBar/searchBar.component';
import { StatComponent } from '../../shared/components/stat/stat.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/Input/input.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { 
  lucidePlus, 
  lucideUsers,
  lucideCheckCircle,
  lucideImage,
  lucideEye,
  lucideEdit,
  lucideTrash2,
  lucideX,
  lucideMail,
  lucideUserX
} from '@ng-icons/lucide';
import { SellerService } from '../../core/services/seller.service';
import { Seller, SellerDTO } from '../../core/models/seller.model';
import { finalize } from 'rxjs/operators';
import { TableAction } from '../../shared/components/table/table.component';
import { toast, NgxSonnerToaster } from 'ngx-sonner';

@Component({
  selector: 'app-sellers',
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
    lucideUsers,
    lucideCheckCircle,
    lucideImage,
    lucideEye,
    lucideEdit,
    lucideTrash2,
    lucideX,
    lucideMail,
    lucideUserX
  })],
  templateUrl: './sellers.component.html',
  styleUrls: ['./sellers.component.scss']
})
export class SellersComponent implements OnInit {
  headers = ['ID', 'Foto', 'Nombre', 'Email', 'Estado', 'Acciones'];
  
  sellersData: Seller[] = [];
  filteredSellersData: TableCell[][] = [];
  allSellers: Seller[] = [];
  modalType: 'none' | 'form' | 'detail' = 'none';
  sellerForm!: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  isLoading = false;
  currentSellerId?: number;
  selectedSeller?: Seller;
  private isBrowser: boolean;
  selectedFileName: string = '';
  photoBase64: string = '';

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
    private sellerService: SellerService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.initForm();
    this.loadSellers();
  }

  initForm() {
    this.sellerForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      photo: [''],
      status: [true, [Validators.required]]
    });
  }

  loadSellers() {
    this.isLoading = true;
    this.sellerService.getAllSellers({ page: this.currentPage, size: this.pageSize })
      .pipe(finalize(() => {
        this.isLoading = false;
      }))
      .subscribe({
        next: (response) => {
          this.sellersData = response.data.data || [];
          this.allSellers = response.data.data || [];
          this.totalElements = response.data.totalItems || 0;
          this.totalPages = response.data.totalPages || 0;
          this.updateTableData();
        },
        error: (error) => {
          this.sellersData = [];
          this.allSellers = [];
          this.updateTableData();
          toast.error('Error al cargar vendedores', {
            description: 'No se pudieron cargar los vendedores. Intente nuevamente.'
          });
        }
      });
  }

  onInputChange(fieldName: string, event: any) {
    const value = event.target?.value || event;
    this.sellerForm.get(fieldName)?.setValue(value);
    this.sellerForm.get(fieldName)?.markAsTouched();
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
        this.photoBase64 = base64Full;
        
        // Guardar solo el base64 puro en el formulario para enviar a la API
        this.sellerForm.get('photo')?.setValue(base64Pure);
        this.sellerForm.get('photo')?.markAsTouched();
      };
      reader.onerror = () => {
        toast.error('Error al leer archivo', {
          description: 'No se pudo procesar la imagen seleccionada'
        });
      };
      reader.readAsDataURL(file);
    }
  }

  clearPhoto(): void {
    this.selectedFileName = '';
    this.photoBase64 = '';
    this.sellerForm.get('photo')?.setValue('');
    
    // Limpiar el input file
    if (this.isBrowser) {
      const fileInput = document.getElementById('photoUpload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }

  updateTableData() {
    if (!this.sellersData || this.sellersData.length === 0) {
      this.filteredSellersData = [];
      return;
    }
    this.filteredSellersData = this.sellersData.map(seller => {
      // Preparar la imagen con el prefijo si no lo tiene
      const photoSrc = seller.photo 
        ? (seller.photo.startsWith('data:') ? seller.photo : `data:image/png;base64,${seller.photo}`)
        : '';

      return [
        seller.id,
        photoSrc 
          ? { type: 'image', src: photoSrc, alt: seller.name } as ImageCell
          : 'Sin foto',
        seller.name,
        seller.email,
        { type: 'status', id: seller.id, status: seller.status } as StatusCell,
        { type: 'actions', product: seller } as ActionCell
      ];
    });
  }

  handleSearch(query: string) {
    if (!this.allSellers || this.allSellers.length === 0) {
      this.filteredSellersData = [];
      return;
    }

    if (!query.trim()) {
      this.sellersData = this.allSellers;
      this.updateTableData();
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    this.sellersData = this.allSellers.filter(seller =>
      seller.name.toLowerCase().includes(lowercaseQuery) ||
      seller.email.toLowerCase().includes(lowercaseQuery) ||
      seller.id.toString().includes(query)
    );

    this.updateTableData();
  }

  openModal(seller?: Seller) {
    if (seller) {
      this.isEditMode = true;
      this.currentSellerId = seller.id;
      
      // Si hay foto, agregar el prefijo para la vista previa si no lo tiene
      if (seller.photo) {
        this.selectedFileName = 'Foto actual';
        // Si la foto no comienza con 'data:', asumimos que es base64 puro y agregamos el prefijo
        this.photoBase64 = seller.photo.startsWith('data:') 
          ? seller.photo 
          : `data:image/png;base64,${seller.photo}`;
      } else {
        this.selectedFileName = '';
        this.photoBase64 = '';
      }
      
      this.sellerForm.patchValue({
        name: seller.name,
        email: seller.email,
        photo: seller.photo,
        status: seller.status
      });
    } else {
      this.isEditMode = false;
      this.currentSellerId = undefined;
      this.selectedFileName = '';
      this.photoBase64 = '';
      this.sellerForm.reset({
        name: '',
        email: '',
        photo: '',
        status: true
      });
    }
    this.modalType = 'form';
    
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
  }

  handleCloseModal() {
    if (this.sellerForm.dirty && !confirm('¿Está seguro de cerrar? Los cambios no guardados se perderán.')) {
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
      this.sellerForm.reset();
      this.isEditMode = false;
      this.currentSellerId = undefined;
      this.selectedFileName = '';
      this.photoBase64 = '';
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
    if (this.sellerForm.valid) {
      this.saveSeller();
    } else {
      this.markFormGroupTouched(this.sellerForm);
    }
  }

  async saveSeller() {
    if (this.sellerForm.invalid) {
      return;
    }

    this.isSubmitting = true;

    const formValue = this.sellerForm.value;
    const sellerDTO: SellerDTO = {
      name: formValue.name,
      email: formValue.email,
      photo: formValue.photo || '',
      status: formValue.status
    };

    const request$ = this.isEditMode && this.currentSellerId
      ? this.sellerService.updateSeller(this.currentSellerId, sellerDTO)
      : this.sellerService.createSeller(sellerDTO);

    request$
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: (response) => {
          toast.success(response.title || 'Operación exitosa', {
            description: response.message || 'El vendedor se guardó correctamente.'
          });
          this.loadSellers();
          this.closeModal();
        },
        error: (error) => {
          console.error('Error al guardar el vendedor:', error);
          const errorTitle = error?.error?.title || 'Error al guardar';
          const errorMessage = error?.error?.message || 'Por favor, intente nuevamente.';
          
          toast.error(errorTitle, {
            description: errorMessage
          });
        }
      });
  }

  viewSellerDetail(id: number) {
    this.sellerService.getSellerById(id).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.selectedSeller = response.data;
          this.modalType = 'detail';
          this.cdr.detectChanges();
          
          if (this.isBrowser) {
            document.body.style.overflow = 'hidden';
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar vendedor:', error);
        toast.error('Error al cargar', {
          description: 'No se pudo cargar la información del vendedor.'
        });
      }
    });
  }

  editSeller(id: number) {
    this.sellerService.getSellerById(id).subscribe({
      next: (response) => {
        const seller = response.data;
        // Cerrar el modal de detalle primero
        this.modalType = 'none';
        this.selectedSeller = undefined;
        
        // Esperar a que se cierre completamente antes de abrir el de edición
        setTimeout(() => {
          this.openModal(seller);
        }, 300);
      },
      error: (error) => {
        console.error('Error al cargar vendedor:', error);
        toast.error('Error al cargar', {
          description: 'No se pudo cargar el vendedor para editar.'
        });
      }
    });
  }

  deleteSeller(id: number) {
    if (!confirm('¿Está seguro de eliminar este vendedor?')) {
      return;
    }

    this.sellerService.deleteSeller(id).subscribe({
      next: (response) => {
        toast.success(response.title || 'Vendedor eliminado', {
          description: response.message || 'El vendedor fue eliminado correctamente.'
        });

        if (this.filteredSellersData.length === 1 && this.currentPage > 0) {
          this.currentPage--;
        }

        this.loadSellers();
      },
      error: (error) => {
        console.error('Error al eliminar vendedor:', error);
        const errorTitle = error?.error?.title || 'Error al eliminar';
        const errorMessage = error?.error?.message || 'No se pudo eliminar el vendedor.';
        
        toast.error(errorTitle, {
          description: errorMessage
        });
      }
    });
  }

  toggleSellerStatus(id: number, currentStatus: boolean) {
    const newStatus = !currentStatus;
    this.sellerService.toggleSellerStatus(id, newStatus).subscribe({
      next: (response) => {
        toast.success(response.title || 'Estado actualizado', {
          description: response.message || 'El estado del vendedor fue actualizado.'
        });
        this.loadSellers();
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
      this.selectedSeller = undefined;
    }, 300);
  }

  handleAction(action: TableAction): void {
    const seller = action.data as Seller;
    
    switch (action.type) {
      case 'view':
        this.viewSellerDetail(seller.id);
        break;
      case 'edit':
        this.editSeller(seller.id);
        break;
      case 'delete':
        this.deleteSeller(seller.id);
        break;
    }
  }

  handleStatusToggle(event: { id: number; currentStatus: boolean }): void {
    this.toggleSellerStatus(event.id, event.currentStatus);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.sellerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.sellerForm.get(fieldName);
    
    if (field?.hasError('required')) {
      return 'Este campo es requerido';
    }
    
    if (field?.hasError('email')) {
      return 'El email debe tener un formato válido';
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

  get totalVendedores(): number {
    return this.totalElements || this.sellersData.length;
  }

  get vendedoresActivos(): number {
    return this.allSellers.filter(s => s.status).length;
  }

  get vendedoresInactivos(): number {
    return this.allSellers.filter(s => !s.status).length;
  }

  ngOnDestroy() {
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }
}