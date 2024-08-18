import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phoneDisplay'
})
export class PhoneDisplayPipe implements PipeTransform {

  transform(value: string): string {
    if (!value) return value;
    // Adding spaces after every 3 digits
    return value.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  }

}
