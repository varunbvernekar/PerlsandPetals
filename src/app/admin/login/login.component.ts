import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  isLoading = false;
  errorMessage = '';
  returnUrl = '/admin/dashboard';

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  ngOnInit(): void {
    // If admin is already logged in, redirect straight to dashboard
    this.authService.user$.pipe(take(1)).subscribe(user => {
      if (user) {
        this.router.navigate(['/admin/dashboard']);
      }
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin/dashboard';
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    try {
      await this.authService.login(email, password);
      await this.router.navigateByUrl(this.returnUrl);
    } catch (err: any) {
      console.error('Admin login failed:', err);
      this.errorMessage = this.authService.getErrorMessage(err);
    } finally {
      this.isLoading = false;
    }
  }
}
