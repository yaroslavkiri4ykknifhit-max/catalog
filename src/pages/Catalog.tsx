import { useEffect, useState } from 'react';
import { ShoppingCart, Package, Trash2 } from 'lucide-react';
import type { Product, Category, CartItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export default function Catalog() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('products.json?t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories || []);
        setProducts(data.products || []);
        if (data.categories?.length > 0) {
          setActiveCategory(data.categories[0].id);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    const text = cart.map(item => `${item.name} x${item.quantity} - ${item.price * item.quantity} BYN`).join('%0A');
    const totalText = `%0A%0AИтого: ${cartTotal} BYN`;
    const message = `Новый заказ!%0A%0A${text}${totalText}`;
    
    // Attempt to use Telegram Web App SDK if available, else fallback to link
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(`https://t.me/YOUR_MANAGER_USERNAME?text=${message}`);
    } else {
      window.open(`https://t.me/YOUR_MANAGER_USERNAME?text=${message}`, '_blank');
    }
  };

  const filteredProducts = products.filter(p => p.categoryId === activeCategory);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--color-tg-bg)] border-b border-[var(--color-tg-secondary-bg)] p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Package className="text-[var(--color-tg-primary)]" /> Vape Empire
        </h1>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative p-2 rounded-full bg-[var(--color-tg-secondary-bg)] text-[var(--color-tg-text)]"
        >
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Categories */}
      <div className="p-4 flex gap-2 overflow-x-auto no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-medium transition-colors ${
              activeCategory === cat.id 
                ? 'bg-[var(--color-tg-primary)] text-[var(--color-tg-primary-text)]' 
                : 'bg-[var(--color-tg-secondary-bg)] text-[var(--color-tg-hint)]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product List */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {filteredProducts.map(product => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={product.id} 
            className="bg-[var(--color-tg-secondary-bg)] rounded-xl overflow-hidden flex flex-col"
          >
            <div className="h-40 bg-black/20 flex items-center justify-center overflow-hidden relative p-4">
              {product.image ? (
                <img src={product.image} alt={product.name} className="object-contain h-full w-full mix-blend-screen drop-shadow-lg" />
              ) : (
                <Package size={48} className="text-[var(--color-tg-hint)] opacity-20" />
              )}
            </div>
            <div className="p-3 flex flex-col flex-1 justify-between">
              <div>
                <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-[var(--color-tg-primary)] font-bold mb-3">{product.price} BYN</p>
              </div>
              <button 
                onClick={() => addToCart(product)}
                className="w-full py-2 bg-[var(--color-tg-primary)] text-[var(--color-tg-primary-text)] rounded-lg text-sm font-medium active:scale-95 transition-transform"
              >
                В корзину
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Cart Modal */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 h-[85vh] bg-[var(--color-tg-bg)] rounded-t-3xl z-50 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.3)]"
            >
              <div className="p-4 border-b border-[var(--color-tg-secondary-bg)] flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="text-[var(--color-tg-primary)]" /> 
                  Корзина
                </h2>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 bg-[var(--color-tg-secondary-bg)] rounded-full text-[var(--color-tg-hint)]"
                >
                  Закрыть
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center text-[var(--color-tg-hint)] mt-10">
                    Корзина пуста 😔
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-3 items-center bg-[var(--color-tg-secondary-bg)] p-3 rounded-xl">
                      <div className="w-16 h-16 bg-black/20 rounded-lg flex items-center justify-center p-1">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="object-contain h-full w-full" />
                        ) : (
                          <Package className="text-[var(--color-tg-hint)] opacity-50" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                        <p className="text-[var(--color-tg-primary)] font-bold">{item.price} BYN</p>
                        
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center bg-[var(--color-tg-bg)] rounded-lg">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-lg">-</button>
                            <span className="w-6 text-center font-medium">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-lg">+</button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-400 ml-auto">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t border-[var(--color-tg-secondary-bg)] bg-[var(--color-tg-bg)] pb-safe">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[var(--color-tg-hint)]">Итого:</span>
                    <span className="text-2xl font-bold">{cartTotal} BYN</span>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    className="w-full py-4 bg-[var(--color-tg-primary)] text-[var(--color-tg-primary-text)] rounded-xl font-bold text-lg active:scale-95 transition-transform shadow-lg shadow-[var(--color-tg-primary)]/20"
                  >
                    Оформить заказ
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
