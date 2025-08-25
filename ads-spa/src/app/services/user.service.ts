import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface User {
  username: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private users: User[] = [];
  private currentUserSubject: BehaviorSubject<User | null>;
  currentUser$;

  constructor() {
    const saved = localStorage.getItem('currentUser');
    const user = saved ? (JSON.parse(saved) as User) : null;
    this.currentUserSubject = new BehaviorSubject<User | null>(user);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  login(username: string): User {
    let user = this.users.find((u) => u.username === username);
    if (!user) {
      user = { username };
      this.users.push(user);
    }
    this.currentUserSubject.next(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    return user;
  }

  logout() {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}
