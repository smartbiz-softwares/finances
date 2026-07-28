export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  birthDate?: string;
  address?: string;
  phone?: string;
  theme: 'light' | 'dark';
  currency: string;
  createdAt: string;
}
