import { Component, Input, forwardRef, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export interface MultiSelectOption {
  [key: string]: any;
}

@Component({
  selector: 'app-searchable-multiselect',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableMultiselectComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative w-full" (click)="$event.stopPropagation()">
      <!-- Selected tags + input -->
      <div
        class="min-h-[38px] w-full px-2 py-1 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent bg-white flex flex-wrap gap-1 items-center cursor-text"
        (click)="openDropdown()"
      >
        <span
          *ngFor="let id of selectedIds"
          class="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-xs rounded-full"
        >
          {{ getLabel(id) }}
          <button type="button" (click)="removeItem(id, $event)" class="hover:text-red-600 leading-none">&times;</button>
        </span>
        <input
          #searchInput
          type="text"
          [(ngModel)]="searchText"
          (input)="onSearchChange()"
          (focus)="isOpen = true; filterOptions()"
          (blur)="onBlur()"
          [placeholder]="selectedIds.length === 0 ? placeholder : ''"
          class="flex-1 min-w-[120px] outline-none text-sm py-0.5 bg-transparent"
        />
        <svg class="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      <!-- Dropdown list -->
      <div
        *ngIf="isOpen"
        class="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-52 overflow-auto"
      >
        <div
          *ngFor="let option of filteredOptions"
          (mousedown)="toggleOption(option)"
          class="px-3 py-2 cursor-pointer hover:bg-indigo-50 text-sm flex items-center gap-2 transition-colors duration-150"
          [class.bg-indigo-100]="isSelected(option[idKey])"
        >
          <svg *ngIf="isSelected(option[idKey])" class="w-4 h-4 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg *ngIf="!isSelected(option[idKey])" class="w-4 h-4 text-transparent flex-shrink-0" viewBox="0 0 24 24"></svg>
          {{ option[nameKey] }}
        </div>
        <div *ngIf="filteredOptions.length === 0" class="px-3 py-2 text-gray-500 text-sm">No results found</div>
      </div>
    </div>
  `,
  styles: []
})
export class SearchableMultiselectComponent implements ControlValueAccessor, OnChanges {
  @Input() options: MultiSelectOption[] = [];
  @Input() placeholder: string = 'Search and select...';
  @Input() idKey: string = 'id';
  @Input() nameKey: string = 'name';

  searchText: string = '';
  filteredOptions: MultiSelectOption[] = [];
  isOpen: boolean = false;
  selectedIds: (number | string)[] = [];

  private onChange: any = () => {};
  private onTouch: any = () => {};

  ngOnChanges() {
    this.filterOptions();
  }

  openDropdown() {
    this.isOpen = true;
    this.filterOptions();
  }

  onBlur() {
    setTimeout(() => {
      this.isOpen = false;
      this.searchText = '';
      this.filterOptions();
    }, 200);
  }

  onSearchChange() {
    this.isOpen = true;
    this.filterOptions();
  }

  filterOptions() {
    const search = this.searchText.toLowerCase();
    this.filteredOptions = search
      ? this.options.filter(o => o[this.nameKey].toLowerCase().includes(search))
      : [...this.options];
  }

  toggleOption(option: MultiSelectOption) {
    const id = option[this.idKey];
    if (this.isSelected(id)) {
      this.selectedIds = this.selectedIds.filter(s => s !== id);
    } else {
      this.selectedIds = [...this.selectedIds, id];
    }
    this.searchText = '';
    this.filterOptions();
    this.onChange(this.selectedIds);
    this.onTouch();
  }

  removeItem(id: number | string, event: Event) {
    event.stopPropagation();
    this.selectedIds = this.selectedIds.filter(s => s !== id);
    this.onChange(this.selectedIds);
    this.onTouch();
  }

  isSelected(id: number | string): boolean {
    return this.selectedIds.includes(id);
  }

  getLabel(id: number | string): string {
    const option = this.options.find(o => o[this.idKey] === id);
    return option ? option[this.nameKey] : String(id);
  }

  writeValue(value: any): void {
    this.selectedIds = Array.isArray(value) ? value : [];
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouch = fn; }
  setDisabledState?(_: boolean): void {}
}
