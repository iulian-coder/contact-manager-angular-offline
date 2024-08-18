import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactService } from '../../services/contact.service';
import { takeWhile } from 'rxjs';
import { formatDateToYYYYMMDD, getInitials, phoneNumberValidator } from '../../../utils';


@Component({
  selector: 'app-contact-detail',
  templateUrl: './contact-detail.component.html',
  styleUrl: './contact-detail.component.css'
})

export class ContactDetailComponent implements OnInit, OnDestroy {

  contactForm!: FormGroup;
  alive = true;


  imageWidth = 100;
  imageHeight = 100;

  constructor(
    private formBuilder: FormBuilder,
    private contactService: ContactService,
    private route: ActivatedRoute,
    private router: Router
  ) { }


  ngOnInit(): void {
    const today = formatDateToYYYYMMDD(new Date().toISOString());
    this.contactForm = this.formBuilder.group({
      name: [null, Validators.required],
      address: [null],
      email: [null, [Validators.required, Validators.email]],
      phone: [null, [Validators.required, phoneNumberValidator]],
      cell: [null, [phoneNumberValidator]],
      registration_date: [today, Validators.required],
      age: [null],
      profile_picture: [null]
    });

    const id = this.getIdFromRoute();
    if (id) {
      this.contactService.editMode$.pipe(takeWhile(() => this.alive)).subscribe((editMode) => {
        if (editMode) {
          this.contactForm.enable();
        } else {
          this.loadContact(id);
          this.contactForm.disable();
        }
      });
    }
  }

  private loadContact(id: number) {
    this.contactService.getContactById(id).subscribe((data: any) => {
      const contactValue = data ?? null;
      if (contactValue) {
        if (contactValue.registration_date) {
          contactValue.registration_date = formatDateToYYYYMMDD(contactValue.registration_date);
        }
        this.contactForm.patchValue(contactValue);
      }
    });
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = this.imageWidth;
        canvas.height = this.imageHeight;
        ctx?.drawImage(img, 0, 0, this.imageWidth, this.imageHeight);
        const imageBase64 = canvas.toDataURL('image/png');
        this.contactForm.patchValue({ profile_picture: imageBase64 });
      };
    };
    reader.readAsDataURL(file);
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      const formValue = this.contactForm.getRawValue();
      const id = this.getIdFromRoute();
      if (id) {
        this.contactService.updateContact(id, formValue).subscribe(res => {
          this.contactService.setEditMode(false);
        });
      } else {
        this.contactService.createContact(formValue).subscribe(() => {
          this.router.navigate(['/contacts']);
        });
      }
    }
  }

  removeProfilePicture(): void {
    this.contactForm.patchValue({ profile_picture: null });
  }

  getContactInitials(name: string): string {
    return getInitials(name);
  }

  getIdFromRoute(): number | null {
    const idString = this.route.snapshot.paramMap.get('id');
    const id = idString ? parseInt(idString) : null;
    return id;
  }

  ngOnDestroy(): void {
    this.alive = false;
  }
}
