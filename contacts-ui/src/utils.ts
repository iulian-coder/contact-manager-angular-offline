import { AbstractControl } from "@angular/forms";

export function getInitials(name: string): string {
    if (!name) return '';
    const initials = name.split(' ').map(word => word[0]).join('');
    return initials.slice(0, 2).toUpperCase();
}


export function phoneNumberValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const phonePattern = /^\+[0-9]{6,14}$/;
    // Matches international phone numbers in the format +[country code][phone number].
    // No spaces allowed. Requires between 6 and 14 digits.
    if (control.value && !phonePattern.test(control.value)) {
        return { 'invalidPhoneNumber': true };
    }
    return null;
}

export function formatDateToYYYYMMDD(isoString: string) {
    const date = new Date(isoString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}