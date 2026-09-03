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
  options?: string[]; // e.g., ["Apple", "Mango"]
  _file?: File;
}

export interface CartItem extends Product {
  quantity: number;
  selectedOption?: string;
}

export interface CatalogData {
  categories: Category[];
  products: Product[];
  botToken?: string;
  adminId?: string;
}
