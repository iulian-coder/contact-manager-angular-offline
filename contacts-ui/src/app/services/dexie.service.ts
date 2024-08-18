import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { Contact, PendingChange } from '../models/contact.model';

@Injectable({
  providedIn: 'root',
})
export class DexieService extends Dexie {
  contacts!: Table<Contact, number>;
  pendingChanges!: Dexie.Table<PendingChange, number>;

  constructor() {
    super('ContactsDatabase');
    this.version(2).stores({
      contacts: '++id, name, email, phone',
      pendingChanges: '++id, type, data, timestamp',
    });

    this.contacts = this.table('contacts');
    this.pendingChanges = this.table('pendingChanges');
  }

  async addContact(contact: Contact) {
    return this.contacts.add(contact);
  }

  async updateContacts(contacts: Contact[]): Promise<void> {
    await this.contacts.clear();
    await this.contacts.bulkAdd(contacts);
  }

  async updateContact(id: number, contact: Partial<Contact>) {
    return this.contacts.update(id, contact);
  }

  async deleteContact(id: number) {
    return this.contacts.delete(id);
  }

  async getContactById(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async getAllContacts(): Promise<Contact[]> {
    return this.contacts.toArray();
  }

  // PendingChanges
  async addPendingChange(change: Omit<PendingChange, 'id' | 'timestamp'>): Promise<number> {
    const pendingChange: PendingChange = { ...change, timestamp: Date.now() };
    return this.pendingChanges.add(pendingChange);
  }

  async getPendingChanges() {
    return this.pendingChanges.toArray();
  }

  async removePendingChange(id: number) {
    return this.pendingChanges.delete(id);
  }
}
