export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  _file?: File;
}

export interface CartItem extends Product {
  quantity: number;
}
