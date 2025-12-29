import { Component, Input, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActionItem {
  label: string;
  icon?: string;
  onClick: () => void;
  badge?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-action-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './action-dropdown.component.html'
})
export class ActionDropdownComponent {
  @Input() actions: ActionItem[][] = [];
  
  isOpen: boolean = false;

  constructor(private elementRef: ElementRef) {}

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  handleAction(action: ActionItem): void {
    if (!action.disabled) {
      action.onClick();
      this.closeDropdown();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }
}
