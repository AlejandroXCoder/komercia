import { Component, Input, Output, EventEmitter, HostListener, AfterContentChecked, ContentChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { ModalDescriptionDirective } from '../../directives/modal-description.directive'
import { ModalFooterDirective } from '../../directives/modal-footer.directive';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, NgIcon, ModalDescriptionDirective, ModalFooterDirective],
  providers: [provideIcons({ lucideX })],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements AfterContentChecked {
  @Input() isOpen: boolean = false;
  @Input() showCloseButton: boolean = true;
  @Input() closeOnOverlayClick: boolean = true;
  @Input() closeOnEscape: boolean = true;
  @Input() noPadding: boolean = false;
  @Input() size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  @Output() onClose = new EventEmitter<void>();
  @Output() onOpen = new EventEmitter<void>();

  @ContentChild(ModalDescriptionDirective, { read: ElementRef }) descriptionRef?: ElementRef;
  @ContentChild(ModalFooterDirective, { read: ElementRef }) footerRef?: ElementRef;

  hasDescription: boolean = false;
  hasFooter: boolean = false;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterContentChecked() {
    this.hasDescription = !!this.descriptionRef;
    this.hasFooter = !!this.footerRef;
  }

  ngOnChanges() {
    if (this.isOpen) {
      this.open();
    } else {
      this.closeModal();
    }
  }

  open() {
    if (this.isBrowser) {
      document.body.style.overflow = 'hidden';
    }
    this.onOpen.emit();
  }

  close() {
    this.isOpen = false;
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
    this.onClose.emit();
  }

  closeModal() {
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }

  onOverlayClick(event: MouseEvent) {
    if (this.closeOnOverlayClick && event.target === event.currentTarget) {
      this.close();
    }
  }

  @HostListener('document:keydown', ['$event'])
handleEscape(event: Event) {
  if (!(event instanceof KeyboardEvent)) return;
  if (event.key !== 'Escape') return;

  if (this.closeOnEscape && this.isOpen) {
    this.close();
  }
}

  ngOnDestroy() {
    if (this.isBrowser) {
      document.body.style.overflow = '';
    }
  }
}