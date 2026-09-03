const fs = require('fs');
let code = fs.readFileSync('src/pages/Catalog.tsx', 'utf8');
code = code.replace("import type { Product, Category, CartItem, CatalogData } from '../types';", "import type { Product, Category, CartItem } from '../types';");
fs.writeFileSync('src/pages/Catalog.tsx', code);
