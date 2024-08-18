export interface Contact {
    id: number;
    name: string;
    address: string;
    email: string;
    phone: string;
    cell: string;
    registration_date: Date;
    age: number;
    profile_picture: string;
  }

  export interface PendingChange {
    id?: number;
    type: 'CREATE' | 'UPDATE' | 'DELETE';
    data: any;
    timestamp: number;
  }
  