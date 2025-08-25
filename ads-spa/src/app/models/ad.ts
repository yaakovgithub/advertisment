export interface Ad {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  createdAt: string;
  address?: string;
  username: string;
}

export interface AdDto {
  title: string;
  description: string;
  category: string;
  price: number;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  address?: string;
  username?: string;
}
