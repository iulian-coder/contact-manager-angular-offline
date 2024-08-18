import { Component, OnInit } from '@angular/core';
import { ContactService } from '../../services/contact.service';
import { Router } from '@angular/router';
import { Contact } from '../../models/contact.model';
import { getInitials } from '../../../utils';

@Component({
  selector: 'app-contact-list',
  templateUrl: './contact-list.component.html',
  styleUrl: './contact-list.component.css'
})
export class ContactListComponent implements OnInit {

  groupedData: { [key: string]: Contact[] } = {};

  constructor(
    private contactService: ContactService,
    private router: Router
  ) { };

  ngOnInit(): void {
    this.contactService.contacts$.subscribe(res => {
      this.groupedData = res?.reduce((acc: any, item: any) => {
        const firstLetter = item.name[0].toUpperCase();
        if (!acc[firstLetter]) {
          acc[firstLetter] = [];
        }
        acc[firstLetter].push(item);
        return acc;
      }, {});
    })
  }

  viewContact(id: number): void {
    this.router.navigate(['/contact', id]);
  }

  getContactInitials(name: string): string {
    return getInitials(name);
  }

}
