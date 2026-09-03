import { useEffect, useState } from 'react';
import { ShoppingCart, Package, Trash2, CheckCircle2 } from 'lucide-react';
import type { Product, Category, CartItem, CatalogData } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export default function Catalog() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [botToken, setBotToken] = useState<string | undefined>();
  const [adminId, setAdminId] = useState<string | undefined>();
  
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [clientUsername, setClientUsername] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  
  useEffect(() => {
    // Try to get TG username if available
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser?.username) {
      setClientUsername(tgUser.username);
    }
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}products.json?t=${Date.now()}`)
      .then(res => res.json())
      .then((data: CatalogData) => {
        setCategories(data.categories || []);
        setProducts(data.products || []);
        if (data.botToken) setBotToken(data.botToken);
        if (data.adminId) setAdminId(data.adminId);
        
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

  const addToCart = (product: Product, selectedOption?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedOption === selectedOption);
      if (existing) {
        return prev.map(item => (item.id === product.id && item.selectedOption === selectedOption) 
          ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1, selectedOption }];
    });
  };

  const removeFromCart = (productId: string, selectedOption?: string) => {
    setCart(prev => prev.filter(item => !(item.id === productId && item.selectedOption === selectedOption)));
  };

  const updateQuantity = (productId: string, selectedOption: string | undefined, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId && item.selectedOption === selectedOption) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (!clientUsername) {
      alert("Пожалуйста, укажите ваш Telegram username (без @)");
      return;
    }

    setOrderLoading(true);
    
    const text = cart.map(item => 
      `${item.name}${item.selectedOption ? ` (${item.selectedOption})` : ''} x${item.quantity} - ${item.price * item.quantity} BYN`
    ).join('\n');
    const totalText = `\n\nИтого: ${cartTotal} BYN`;
    
    const usernameText = `\nОт: @${clientUsername.replace('@', '')}`;
    const message = `Новый заказ!\n\n${text}${totalText}${usernameText}`;
    
    if (botToken && adminId) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: adminId,
            text: message
          })
        });
        if (res.ok) {
          setOrderSuccess(true);
          setCart([]);
        } else {
          alert('Ошибка при отправке заказа.');
        }
      } catch (err) {
        alert('Ошибка при отправке заказа.');
      }
    } else {
      // Fallback if bot is not configured
      alert('Ошибка: Бот не настроен администратором.');
    }
    setOrderLoading(false);
  };

  const filteredProducts = products.filter(p => p.categoryId === activeCategory);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen pb-24 relative">
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

      <div className="p-4 grid grid-cols-2 gap-4">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} onAdd={addToCart} />
        ))}
      </div>

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
                  onClick={() => {
                    setIsCartOpen(false);
                    if (orderSuccess) setOrderSuccess(false);
                  }}
                  className="p-2 bg-[var(--color-tg-secondary-bg)] rounded-full text-[var(--color-tg-hint)]"
                >
                  Закрыть
                </button>
              </div>
              
              {orderSuccess ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <CheckCircle2 size={64} className="text-green-500" />
                  <h3 className="text-2xl font-bold">Ваш заказ оформлен!</h3>
                  <p className="text-[var(--color-tg-hint)]">Наш менеджер свяжется с вами в Telegram в ближайшее время для уточнения деталей.</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {cart.length === 0 ? (
                      <div className="text-center text-[var(--color-tg-hint)] mt-10">
                        Корзина пуста 😔
                      </div>
                    ) : (
                      cart.map(item => (
                        <div key={item.id + (item.selectedOption||'')} className="flex gap-3 items-center bg-[var(--color-tg-secondary-bg)] p-3 rounded-xl">
                          <div className="w-16 h-16 bg-[var(--color-tg-bg)] rounded-lg flex items-center justify-center p-1">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="object-contain h-full w-full" />
                            ) : (
                              <Package className="text-[var(--color-tg-hint)] opacity-50" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                            {item.selectedOption && (
                              <span className="text-xs bg-[var(--color-tg-primary)]/20 text-[var(--color-tg-primary)] px-2 py-0.5 rounded-full mt-1 inline-block">
                                {item.selectedOption}
                              </span>
                            )}
                            <p className="text-[var(--color-tg-primary)] font-bold mt-1">{item.price} BYN</p>
                            
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center bg-[var(--color-tg-bg)] rounded-lg">
                                <button onClick={() => updateQuantity(item.id, item.selectedOption, -1)} className="w-8 h-8 flex items-center justify-center text-lg">-</button>
                                <span className="w-6 text-center font-medium">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, item.selectedOption, 1)} className="w-8 h-8 flex items-center justify-center text-lg">+</button>
                              </div>
                              <button onClick={() => removeFromCart(item.id, item.selectedOption)} className="p-2 text-red-400 ml-auto">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {cart.length > 0 && (
                    <div className="p-4 border-t border-[var(--color-tg-secondary-bg)] bg-[var(--color-tg-bg)]">
                      <div className="mb-4">
                        <label className="text-xs text-[var(--color-tg-hint)] mb-1 block">Ваш Telegram юзернейм для связи (без @):</label>
                        <input 
                          type="text" 
                          value={clientUsername}
                          onChange={e => setClientUsername(e.target.value)}
                          placeholder="ivan123"
                          className="w-full bg-[var(--color-tg-secondary-bg)] p-3 rounded-xl outline-none border border-transparent focus:border-[var(--color-tg-primary)]"
                        />
                      </div>
                      
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[var(--color-tg-hint)]">Итого:</span>
                        <span className="text-2xl font-bold">{cartTotal} BYN</span>
                      </div>
                      <button 
                        onClick={handleCheckout}
                        disabled={orderLoading || !clientUsername}
                        className="w-full py-4 bg-[var(--color-tg-primary)] text-[var(--color-tg-primary-text)] rounded-xl font-bold text-lg active:scale-95 transition-transform disabled:opacity-50"
                      >
                        {orderLoading ? 'Оформление...' : 'Оформить заказ'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductCard({ product, onAdd }: { product: Product, onAdd: (p: Product, opt?: string) => void }) {
  const [selectedOption, setSelectedOption] = useState(product.options?.[0] || '');
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-tg-secondary-bg)] rounded-xl overflow-hidden flex flex-col"
    >
      <div className="h-32 bg-[var(--color-tg-bg)] flex items-center justify-center overflow-hidden p-2">
        {product.image ? (
          <img src={product.image} alt={product.name} className="object-contain h-full w-full" />
        ) : (
          <Package size={48} className="text-[var(--color-tg-hint)] opacity-20" />
        )}
      </div>
      <div className="p-3 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-semibold text-sm leading-tight mb-1">{product.name}</h3>
          
          {product.options && product.options.length > 0 && (
            <select 
              value={selectedOption}
              onChange={e => setSelectedOption(e.target.value)}
              className="w-full text-xs p-1 mb-2 bg-[var(--color-tg-bg)] text-[var(--color-tg-text)] rounded outline-none border border-[var(--color-tg-secondary-bg)]"
            >
              {product.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
          
          <p className="text-[var(--color-tg-primary)] font-bold mb-3">{product.price} BYN</p>
        </div>
        <button 
          onClick={() => onAdd(product, product.options?.length ? selectedOption : undefined)}
          className="w-full py-2 bg-[var(--color-tg-primary)] text-[var(--color-tg-primary-text)] rounded-lg text-sm font-medium active:scale-95 transition-transform"
        >
          В корзину
        </button>
      </div>
    </motion.div>
  );
}
