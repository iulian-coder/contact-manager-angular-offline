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

  currentContactId!: number | null;
  isEditMode: boolean = false;

  constructor(
    private contactService: ContactService,
    private route: ActivatedRoute,
    private router: Router) {
  }

  ngOnInit(): void {
    this.checkBackendStatus();
    setInterval(() => { this.checkBackendStatus(); }, 10000); // 10 seconds

    this.router.events.pipe(filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.changeStatusEditMode(false);
      const currentUrl = this.router.url;

      this.isOnHomePage = currentUrl === '/' || currentUrl === '/contacts';
      this.isOnDetailPage = currentUrl.startsWith('/contact/') && !currentUrl.endsWith('/new');
      this.isNewRecord = currentUrl.endsWith('/new');
    });

    this.contactService.editMode$.pipe(takeWhile(() => this.alive)).subscribe((editMode) => {
      this.isEditMode = editMode;
    });

    this.contactService.currentContactId$.pipe(takeWhile(() => this.alive)).subscribe(id => {
      this.currentContactId = id;
    })
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
    const id = idString ? parseInt(idString) : null;
    return id;
  }

  checkOnlineStatus():boolean{
    return this.contactService.checkOnlineStatus();
  }

  checkBackendStatus(): void {
    this.contactService.checkBackendStatus().subscribe({
      next: (response) => {
        this.isBackendUp = true;
      },
      error: (error) => {
        this.isBackendUp = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.alive = false;
  }

}
