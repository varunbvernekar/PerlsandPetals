import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SearchComponent } from '../search/search.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, SearchComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  isMenuOpen = false;
  isSearchOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  openSearch() {
    this.isSearchOpen = true;
    this.isMenuOpen = false;
  }

  closeSearch() {
    this.isSearchOpen = false;
  }
}
