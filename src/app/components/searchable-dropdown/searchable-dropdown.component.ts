import { Component, Input, Output, EventEmitter, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export interface DropdownOption {
  id?: number;
  name: string;
  [key: string]: any;
}

@Component({
  selector: 'app-searchable-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableDropdownComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative w-full">
      <div class="relative">
        <input
          type="text"
          [(ngModel)]="searchText"
          (focus)="onFocus()"
          (blur)="onBlur()"
          (input)="onSearchChange()"
          [placeholder]="placeholder"
          [required]="required"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
          [class.border-red-300]="required && !value"
        />
        <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      <div
        *ngIf="isOpen && filteredOptions.length > 0"
        class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
      >
        <div
          *ngFor="let option of filteredOptions"
          (mousedown)="selectOption(option)"
          class="px-3 py-2 cursor-pointer hover:bg-indigo-50 hover:text-indigo-900 transition-colors duration-150"
          [class.bg-indigo-100]="option.name === value"
        >
          {{ option.name }}
        </div>
      </div>
      
      <div
        *ngIf="isOpen && filteredOptions.length === 0 && searchText"
        class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg"
      >
        <div class="px-3 py-2 text-gray-500 text-sm">
          No results found
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SearchableDropdownComponent implements ControlValueAccessor, OnInit {
  @Input() options: DropdownOption[] = [];
  @Input() placeholder: string = 'Select option';
  @Input() required: boolean = false;
  
  searchText: string = '';
  filteredOptions: DropdownOption[] = [];
  isOpen: boolean = false;
  value: string = '';
  
  private onChange: any = () => {};
  private onTouch: any = () => {};

  ngOnInit() {
    this.filteredOptions = [...this.options];
  }

  ngOnChanges() {
    this.filteredOptions = [...this.options];
    if (this.searchText && !this.isOpen) {
      // Update display text if value exists
      const selectedOption = this.options.find(opt => opt.name === this.value);
      if (selectedOption) {
        this.searchText = selectedOption.name;
      }
    }
  }

  onFocus() {
    this.isOpen = true;
    this.filteredOptions = [...this.options];
    this.searchText = '';
  }

  onBlur() {
    setTimeout(() => {
      this.isOpen = false;
      // Restore selected value text if exists
      if (this.value) {
        const selectedOption = this.options.find(opt => opt.name === this.value);
        if (selectedOption) {
          this.searchText = selectedOption.name;
        }
      } else {
        this.searchText = '';
      }
    }, 200);
  }

  onSearchChange() {
    if (!this.searchText) {
      this.filteredOptions = [...this.options];
      return;
    }
    
    const search = this.searchText.toLowerCase();
    this.filteredOptions = this.options.filter(option =>
      option.name.toLowerCase().includes(search)
    );
  }

  selectOption(option: DropdownOption) {
    this.value = option.name;
    this.searchText = option.name;
    this.isOpen = false;
    this.onChange(this.value);
    this.onTouch();
  }

  writeValue(value: any): void {
    this.value = value || '';
    if (this.value) {
      const selectedOption = this.options.find(opt => opt.name === this.value);
      if (selectedOption) {
        this.searchText = selectedOption.name;
      }
    } else {
      this.searchText = '';
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Handle disabled state if needed
  }
}
