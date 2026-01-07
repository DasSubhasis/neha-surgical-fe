import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, OtpResponse, AuthResponse } from '../../services/auth.service';

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
  otp: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

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

    this.authService.sendOtp(this.email.trim()).subscribe({
      next: (response: OtpResponse) => {
        this.showOTPVerification = true;
        this.successMessage = response.message || 'OTP sent successfully!';
        this.loading = false;
      },
      error: (error: any) => {
        this.errorMessage = error.message || 'Failed to send OTP. Please try again.';
        this.loading = false;
      }
    });
  }

  handleVerifyOTP(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.otp.trim() || this.otp.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit OTP!';
      return;
    }

    this.loading = true;

    this.authService.verifyOtp(this.email.trim(), this.otp).subscribe({
      next: (response: AuthResponse) => {
        this.successMessage = response.message || 'Login successful!';
        this.router.navigate(['/dashboard']);
        this.loading = false;
      },
      error: (error: any) => {
        this.errorMessage = error.message || 'Invalid OTP. Please try again.';
        this.loading = false;
      }
    });
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

    this.authService.resendOtp(this.email.trim()).subscribe({
      next: (response: OtpResponse) => {
        this.successMessage = response.message || 'OTP resent successfully!';
        this.loading = false;
      },
      error: (error: any) => {
        this.errorMessage = error.message || 'Failed to resend OTP. Please try again.';
        this.loading = false;
      }
    });
  }
}
