import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, takeWhile, timeout } from 'rxjs';
import { ContactService } from '../../services/contact.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {

  alive: boolean = true;
  isBackendUp: boolean = false;

  isNewRecord: boolean = false;
  isOnDetailPage: boolean = false;
  isOnHomePage: boolean = false;

  currentContactId: number | null = null;
  isEditMode: boolean = false;

  constructor(
    private contactService: ContactService,
    private route: ActivatedRoute,
    private router: Router) {
  }

  ngOnInit(): void {
    this.initBackendStatusCheck();
    this.initRouterEventListeners();
    this.initContactServiceSubscriptions();
  }

  private initContactServiceSubscriptions() {
    this.contactService.editMode$.pipe(takeWhile(() => this.alive))
      .subscribe(editMode => this.isEditMode = editMode);

    this.contactService.currentContactId$.pipe(takeWhile(() => this.alive))
      .subscribe(id => this.currentContactId = id);
  }

  private initRouterEventListeners() {
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      this.changeStatusEditMode(false);
      const currentUrl = this.router.url;

      this.isOnHomePage = currentUrl === '/' || currentUrl === '/contacts';
      this.isOnDetailPage = currentUrl.startsWith('/contact/') && !currentUrl.endsWith('/new');
      this.isNewRecord = currentUrl.endsWith('/new');
    });
  }

  private initBackendStatusCheck() {
    this.updateBackendStatus();
    setInterval(() => { this.updateBackendStatus(); }, 10000); // 10 seconds
    window.addEventListener('online', this.updateBackendStatus.bind(this));
    window.addEventListener('offline', this.updateBackendStatus.bind(this));
  }

  changeStatusEditMode(status: boolean): void {
    this.contactService.setEditMode(status);
  }

  onDeleteContact(): void {
    if (this.currentContactId) {
      this.contactService.deleteContact(this.currentContactId).subscribe(() => {
        this.router.navigate(['/contacts']);
      })
    }
  }

  onAddContact(): void {
    this.router.navigate(['/contact/new']);
  }

  onAddRandomContacts(): void {
    this.contactService.addRandomContacts().subscribe(() => {
      this.router.navigate(['/contacts']);
    })
  }

  getIdFromRoute(): number | null {
    const idString = this.route.snapshot.paramMap.get('id');
    return idString ? parseInt(idString) : null;
  }

  checkOnlineStatus(): boolean {
    return this.contactService.checkOnlineStatus();
  }

  updateBackendStatus(): void {
    if (!this.checkOnlineStatus()) {
      this.isBackendUp = false;
    } else {
      this.contactService.checkBackendStatus().subscribe({
        next: () => this.isBackendUp = true,
        error: () => this.isBackendUp = false
      });
    }
  }

  ngOnDestroy(): void {
    this.alive = false;

    window.removeEventListener('online', this.updateBackendStatus.bind(this));
    window.removeEventListener('offline', this.updateBackendStatus.bind(this));
  }

}
