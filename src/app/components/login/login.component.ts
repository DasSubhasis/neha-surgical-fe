import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email: string = '';
  loading: boolean = false;
  showOTPVerification: boolean = false;
  showDemoEmails: boolean = false;
  otp: string = '';
  demoOTP: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  useRealApi: boolean = false; // Toggle for real API vs demo mode

  demoEmails = [
    { email: 'admin@nehasurgical.com', role: 'Admin' },
    { email: 'manager@nehasurgical.com', role: 'Manager' },
    { email: 'user@nehasurgical.com', role: 'User' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleDemoEmails(): void {
    this.showDemoEmails = !this.showDemoEmails;
  }

  closeDemoEmails(): void {
    this.showDemoEmails = false;
  }

  handleSendOTP(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email.trim()) {
      this.errorMessage = 'Please enter your email address!';
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email.trim())) {
      this.errorMessage = 'Please enter a valid email address!';
      return;
    }

    this.loading = true;

    if (this.useRealApi) {
      // Real API call
      this.authService.sendOtp(this.email.trim()).subscribe({
        next: (response) => {
          if (response.success) {
            this.showOTPVerification = true;
            this.successMessage = response.message || 'OTP sent successfully!';
          } else {
            this.errorMessage = response.message || 'Failed to send OTP. Please try again.';
          }
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to send OTP. Please try again.';
          this.loading = false;
        }
      });
    } else {
      // Demo mode - simulate API call
      setTimeout(() => {
        // Generate demo OTP
        this.demoOTP = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`Demo OTP for ${this.email}: ${this.demoOTP}`);
        
        this.showOTPVerification = true;
        this.successMessage = 'OTP sent successfully! (Demo Mode)';
        this.loading = false;
      }, 1500);
    }
  }

  handleVerifyOTP(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.otp.trim() || this.otp.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit OTP!';
      return;
    }

    this.loading = true;

    if (this.useRealApi) {
      // Real API call
      this.authService.verifyOtp(this.email.trim(), this.otp).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Login successful!';
            this.router.navigate(['/dashboard']);
          } else {
            this.errorMessage = response.message || 'Invalid OTP. Please try again.';
          }
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.message || 'Invalid OTP. Please try again.';
          this.loading = false;
        }
      });
    } else {
      // Demo mode - simulate OTP verification
      setTimeout(() => {
        if (this.otp === this.demoOTP) {
          const success = this.authService.demoLogin(this.email);
          if (success) {
            this.successMessage = 'Login successful!';
            this.router.navigate(['/dashboard']);
          }
        } else {
          this.errorMessage = 'Invalid OTP. Please try again.';
        }
        this.loading = false;
      }, 1000);
    }
  }

  handleBackToEmail(): void {
    this.showOTPVerification = false;
    this.otp = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  resendOTP(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    if (this.useRealApi) {
      // Real API call
      this.authService.resendOtp(this.email.trim()).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = response.message || 'OTP resent successfully!';
          } else {
            this.errorMessage = response.message || 'Failed to resend OTP. Please try again.';
          }
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to resend OTP. Please try again.';
          this.loading = false;
        }
      });
    } else {
      // Demo mode
      setTimeout(() => {
        this.demoOTP = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`New Demo OTP for ${this.email}: ${this.demoOTP}`);
        this.successMessage = 'OTP resent successfully! (Demo Mode)';
        this.loading = false;
      }, 1000);
    }
  }
}
