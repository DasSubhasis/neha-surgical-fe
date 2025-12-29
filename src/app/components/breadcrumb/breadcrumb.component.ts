import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { generateBreadcrumb, BreadcrumbItem } from '../../utils/breadcrumb.utils';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './breadcrumb.component.html'
})
export class BreadcrumbComponent implements OnChanges {
  @Input() currentPage: string = 'dashboard';
  @Output() navigate = new EventEmitter<string>();

  breadcrumbItems: BreadcrumbItem[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentPage']) {
      this.breadcrumbItems = generateBreadcrumb(this.currentPage);
    }
  }

  handleNavigate(key: string): void {
    if (key !== this.currentPage) {
      const pageKey = key === 'home' ? 'dashboard' : key;
      this.navigate.emit(pageKey);
    }
  }

  isLast(index: number): boolean {
    return index === this.breadcrumbItems.length - 1;
  }

  isClickable(index: number): boolean {
    return !this.isLast(index);
  }
}
