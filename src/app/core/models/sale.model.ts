export interface Sale {
  id: number;
  seller: {
    id: number;
    name: string;
    email: string;
    photo: string;
    status: boolean;
  };
  date: string;
  total: number;
  status: boolean;
  quantityProducts: number;
  details: SaleDetail[];
}

export interface SaleDetail {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    stock: number;
    image: string;
  };
  quantity: number;
  unitPrice: number;
  subtotal: number;
  saleId: number;
}

export interface SaleDTO {
  seller: {
    id: number;
  };
  date: string;
  status: boolean;
  details: SaleDetailDTO[];
}

export interface SaleDetailDTO {
  product: {
    id: number;
  };
  quantity: number;
}
