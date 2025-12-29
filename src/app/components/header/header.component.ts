import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  @Input() email: string = '';
  @Output() logout = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<string>();

  avatarDropdownOpen: boolean = false;

  get userInitial(): string {
    return this.email ? this.email.charAt(0).toUpperCase() : 'U';
  }

  toggleAvatarDropdown(): void {
    this.avatarDropdownOpen = !this.avatarDropdownOpen;
  }

  closeDropdown(): void {
    this.avatarDropdownOpen = false;
  }

  handleProfileClick(): void {
    this.navigate.emit('profile');
    this.avatarDropdownOpen = false;
  }

  handleLogoutClick(): void {
    this.avatarDropdownOpen = false;
    this.logout.emit();
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}
