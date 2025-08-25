import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  username = '';
  error = '';

  constructor(private userService: UserService, private router: Router) {}

  login() {
    if (!this.username.trim()) {
      this.error = 'Please enter a username.';
      return;
    }
    this.userService.login(this.username.trim());
    this.router.navigate(['/dashboard']);
  }
}
