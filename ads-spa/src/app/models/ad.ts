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
}

export interface AdDto {
  title: string;
  description: string;
  category: string;
  price: number;
  imageUrl?: string;
  lat?: number;
  lng?: number;
}
