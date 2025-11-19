export interface Product {
  id: number;
  image: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: boolean;
}

export interface ProductDTO {
  id?: number;
  image?: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  status: boolean;
}
