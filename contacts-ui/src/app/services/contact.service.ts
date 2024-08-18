import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, from, lastValueFrom, map, Observable, of, tap } from 'rxjs';
import { Contact } from '../models/contact.model';
import { DexieService } from './dexie.service';

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  private contactsSubject = new BehaviorSubject<Contact[]>([]);
  contacts$: Observable<Contact[]> = this.contactsSubject.asObservable();

  private editModeSubject = new BehaviorSubject<boolean>(false);
  editMode$ = this.editModeSubject.asObservable();

  private currentContactIdSubject = new BehaviorSubject<number | null>(null);
  currentContactId$ = this.currentContactIdSubject.asObservable();

  private readonly apiBase = 'http://localhost:3000/api';
  private readonly apiUrl = `${this.apiBase}/contacts`;

  constructor(
    private http: HttpClient,
    private dexieService: DexieService
  ) {
    this.initializeContacts();
    this.listenForOnlineStatus();
  }


  private initializeContacts(): void {
    from(this.dexieService.getAllContacts())
      .pipe(
        tap(contacts => this.contactsSubject.next(contacts)),
        catchError(error => {
          console.error('Error loading contacts from Dexie:', error);
          return of([]);
        })).subscribe(() => {
          this.fetchContacts();
        });
  }

  private listenForOnlineStatus() {
    window.addEventListener('online', () => { this.syncPendingChanges(); });
  }

  fetchContacts(): void {
    this.http.get<{ data: Contact[] }>(this.apiUrl).pipe(
      map(response => response.data || []),
      tap(async contacts => {
        this.contactsSubject.next(contacts);
        await this.dexieService.updateContacts(contacts);
      }),
      catchError(error => {
        console.error('Error fetching contacts:', error);
        return this.loadContactsFromDexie();
      })
    ).subscribe();
  }

  private loadContactsFromDexie(): Observable<Contact[]> {
    return from(this.dexieService.getAllContacts()).pipe(
      tap(contacts => this.contactsSubject.next(contacts)),
      catchError(error => {
        console.error('Error loading contacts from Dexie:', error);
        return of([]);
      })
    );
  }

  createContact(contact: Contact): Observable<any> {
    return this.http.post<any>(this.apiUrl, contact).pipe(
      tap(async () => await this.handleLocalContactSave(contact)),
      catchError(async error => {
        console.error('Error creating contact:', error);
        await this.handleLocalContactSave(contact);
        return of();
      })
    );
  }

  updateContact(id: number, contact: Contact): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, contact).pipe(
      tap(async () => await this.handleLocalContactUpdate(id, contact)),
      catchError(async error => {
        console.error('Error updating contact:', error);
        await this.handleLocalContactUpdate(id, contact);
        return of();
      })
    );
  }

  deleteContact(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(async () => await this.handleLocalContactDelete(id)),
      catchError(async error => {
        console.error('Error deleting contact:', error);
        await this.handleLocalContactDelete(id);
        return of();
      })
    );
  }

  getContactById(id: number): Observable<Contact | null | undefined> {
    this.setCurrentContactId(id);
    return this.http.get<{ data: Contact }>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data || null),
      catchError(() => from(this.dexieService.getContactById(id)))
    );
  }

  private async handleLocalContactSave(contact: Contact): Promise<void> {
    await this.dexieService.addContact(contact);
    this.fetchContacts();
    if (!this.checkOnlineStatus()) {
      const { id, ...rest } = contact;
      this.dexieService.addPendingChange({ type: 'CREATE', data: rest })
    }
  }

  private async handleLocalContactUpdate(id: number, contact: Contact): Promise<void> {
    await this.dexieService.updateContact(id, contact);
    this.fetchContacts();
    if (!this.checkOnlineStatus()) {
      const { id: contactId, ...rest } = contact;
      this.dexieService.addPendingChange({ type: 'UPDATE', data: { id, ...rest } });
    }
  }

  private async handleLocalContactDelete(id: number): Promise<void> {
    await this.dexieService.deleteContact(id);
    this.fetchContacts();
    if (!this.checkOnlineStatus()) {
      this.dexieService.addPendingChange({ type: 'DELETE', data: { id } });
    }
  }

  setEditMode(status: boolean): void {
    this.editModeSubject.next(status);
  }

  private setCurrentContactId(id: number): void {
    this.currentContactIdSubject.next(id);
  }

  checkBackendStatus(): Observable<any> {
    return this.http.get(`${this.apiBase}/health`);
  }

  checkOnlineStatus(): boolean {
    return navigator.onLine;
  }

  addRandomContacts(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/random`, {}).pipe(tap(() => this.fetchContacts()));
  }

  private async syncPendingChanges() {
    const pendingChanges = await this.dexieService.getPendingChanges();
    for (const change of pendingChanges) {
      try {
        switch (change.type) {
          case 'CREATE':
            await lastValueFrom(this.createContact(change.data));
            break;
          case 'UPDATE':
            await lastValueFrom(this.updateContact(change.data.id, change.data));
            break;
          case 'DELETE':
            await lastValueFrom(this.deleteContact(change.data.id));
            break;
        }
        const id = change.id;
        if (id) {
          await this.dexieService.removePendingChange(id);
        }
      } catch (error) {
        console.error('Failed to sync change:', change, error);
      }
    }
  }
}
