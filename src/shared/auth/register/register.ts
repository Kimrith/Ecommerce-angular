import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Auths } from '../../../Service/Auth/auths';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html'
})
export class Register {
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  strength = 0;
  strengthText = 'Enter a password';
  isSubmitting = false;
  showSuccess = false;

  selectedRole = 'Customer';
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  registerResponse: any = null;

  constructor(
    private fb: FormBuilder,
    private authsService: Auths,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role: ['Customer', Validators.required],
      shopName: [''],
      terms: [false, Validators.requiredTrue],
      newsletter: [false]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  setRole(role: string) {
    this.selectedRole = role;
    this.registerForm.patchValue({ role: role });

    const shopNameControl = this.registerForm.get('shopName');
    if (role === 'Seller') {
      shopNameControl?.setValidators([Validators.required]);
    } else {
      shopNameControl?.clearValidators();
      shopNameControl?.setValue('');
    }
    shopNameControl?.updateValueAndValidity();
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      this.selectedFile = file;
      this.imagePreview = URL.createObjectURL(file);
    }
  }

  checkStrength() {
    const password = this.registerForm.get('password')?.value || '';
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;

    this.strength = score;
    const texts = ['Weak', 'Fair', 'Good', 'Strong'];
    this.strengthText = password.length === 0 ? 'Enter a password' : texts[score];
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('firstName', this.registerForm.get('firstName')?.value);
    formData.append('lastName', this.registerForm.get('lastName')?.value);
    formData.append('email', this.registerForm.get('email')?.value);
    formData.append('phoneNumber', this.registerForm.get('phone')?.value);
    formData.append('password', this.registerForm.get('password')?.value);
    formData.append('confirmPassword', this.registerForm.get('confirmPassword')?.value);
    formData.append('role', this.selectedRole);

    if (this.selectedRole === 'Seller') {
      formData.append('shopName', this.registerForm.get('shopName')?.value);
    }

    if (this.selectedFile) {
      formData.append('profileImage', this.selectedFile, this.selectedFile.name);
    }

    this.authsService.register(formData).subscribe({
      next: (response) => {
        // Run inside Angular zone and trigger change detection immediately
        this.ngZone.run(() => {
          this.registerResponse = response;
          this.isSubmitting = false;
          this.showSuccess = true;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          this.isSubmitting = false;
          this.cdr.detectChanges();
          alert(error.error?.message || 'Registration failed. Please check your inputs.');
        });
      }
    });
  }

  closeModal() {
    this.showSuccess = false;

    if (this.registerResponse) {
      const response = this.registerResponse;
      const userRole = response.role || (response.user && response.user.role);

      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      localStorage.setItem('userData', JSON.stringify(response));

      if (userRole === 'Customer') {
        this.router.navigate(['/']);
      } else if (userRole === 'Seller') {
        const status = (response.status || (response.user && response.user.status) || '').toString().trim().toLowerCase();
        if (status === 'suspended' || status === 'inactive') {
          this.router.navigate(['/seller-suspended']);
        } else {
          this.router.navigate(['/sellers']);
        }
      } else if (userRole === 'Admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/login']);
      }
    } else {
      this.router.navigate(['/login']);
    }
  }
}