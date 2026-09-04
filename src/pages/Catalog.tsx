import { useEffect, useState } from 'react';
import { ShoppingCart, Package, Trash2, CheckCircle2, Settings } from 'lucide-react';
import type { Product, Category, CartItem } from '../types';

export default function Catalog() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [botToken, setBotToken] = useState<string | undefined>();
  const [adminId, setAdminId] = useState<string | undefined>();
  
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [showSplash, setShowSplash] = useState(true);
  
  const [clientUsername, setClientUsername] = useState('');
  const [tgUserId, setTgUserId] = useState<number | undefined>();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  
  useEffect(() => {
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (tgUser?.username) {
      setClientUsername(tgUser.username);
    }
    if (tgUser?.id) {
      setTgUserId(tgUser.id);
    }
  }, []);

  useEffect(() => {
    const minSplashTime = new Promise(resolve => setTimeout(resolve, 1500));
    const fetchData = fetch(`${import.meta.env.BASE_URL}products.json?t=${Date.now()}`).then(res => res.json());

    Promise.all([fetchData, minSplashTime])
      .then(([data]) => {
        setCategories(data.categories || []);
        setProducts(data.products || []);
        if (data.botToken) setBotToken(data.botToken);
        if (data.adminId) setAdminId(data.adminId);
        
        if (data.categories?.length > 0) {
          setActiveCategory(data.categories[0].id);
        }
        setShowSplash(false);
      })
      .catch(err => {
        console.error(err);
        setShowSplash(false);
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

  const handleCheckout = async () => {
    if (!clientUsername) {
      alert("Пожалуйста, укажите ваш Telegram username (без @)");
      return;
    }

    setOrderLoading(true);
    
    const text = cart.map(item => 
      `${item.name} x${item.quantity} - ${item.price * item.quantity} BYN`
    ).join('\n');
    const totalText = `\n\nИтого: ${cartTotal} BYN`;
    
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const usernameText = tgUser?.username ? `\nОт: @${tgUser.username}` : `\nОт: @${clientUsername.replace('@', '')}`;
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
      alert('Ошибка: Бот не настроен администратором.');
    }
    setOrderLoading(false);
  };

  const filteredProducts = products.filter(p => p.categoryId === activeCategory);
  const isAdmin = tgUserId?.toString() === adminId?.toString();

  return (
    <div className="min-h-screen pb-24 relative bg-[var(--color-tg-bg)]">
      {showSplash && (
        <div className="fixed inset-0 z-50 bg-[#130f1c] flex flex-col items-center justify-center">
          <div className="w-48 h-48 rounded-full overflow-hidden shadow-[0_0_40px_rgba(124,58,237,0.4)] mb-8 border-2 border-[#7c3aed]">
            <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="Vape Empire" className="w-full h-full object-cover" />
          </div>
          <div className="w-32 h-1 bg-[#1e1b2e] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#7c3aed] to-[#c084fc] w-full animate-pulse" />
          </div>
        </div>
      )}

      <div className="sticky top-0 z-10 bg-[#130f1c]/90 backdrop-blur-md border-b border-[var(--color-tg-secondary-bg)] p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--color-tg-primary)]">
            <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="Logo" className="w-full h-full object-cover" />
          </div>
          Vape Empire
        </h1>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative p-2.5 rounded-full bg-[var(--color-tg-secondary-bg)] text-[var(--color-tg-text)] shadow-sm"
        >
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
            className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-semibold transition-all ${
              activeCategory === cat.id 
                ? 'bg-gradient-to-r from-[#7c3aed] to-[#c084fc] text-white shadow-lg shadow-[#7c3aed]/30' 
                : 'bg-[var(--color-tg-secondary-bg)] text-[var(--color-tg-hint)]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        {filteredProducts.map(product => (
          <ProductCard key={product.id} product={product} onAdd={addToCart} />
        ))}
      </div>

      {isCartOpen && (
        <>
          <div 
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm transition-opacity"
          />
          <div 
            className="fixed bottom-0 left-0 right-0 h-[85vh] bg-[var(--color-tg-bg)] rounded-t-3xl z-50 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-[var(--color-tg-secondary-bg)] transition-transform translate-y-0"
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
                className="p-2 bg-[var(--color-tg-secondary-bg)] rounded-full text-[var(--color-tg-hint)] hover:text-white transition-colors"
              >
                Закрыть
              </button>
            </div>
            
            {orderSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 size={48} className="text-green-500" />
                </div>
                <h3 className="text-2xl font-bold">Ваш заказ оформлен!</h3>
                <p className="text-[var(--color-tg-hint)]">Наш менеджер свяжется с вами в Telegram в ближайшее время для уточнения деталей.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.length === 0 ? (
                    <div className="text-center text-[var(--color-tg-hint)] mt-10 flex flex-col items-center">
                      <Package size={48} className="mb-4 opacity-20" />
                      Корзина пуста
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex gap-3 items-center bg-[var(--color-tg-secondary-bg)] p-3 rounded-2xl">
                        <div className="w-16 h-16 bg-[var(--color-tg-bg)] rounded-xl flex items-center justify-center p-1 overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="object-cover h-full w-full rounded-lg" />
                          ) : (
                            <Package className="text-[var(--color-tg-hint)] opacity-50" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm line-clamp-2">{item.name}</h4>
                          <p className="text-[var(--color-tg-primary)] font-bold mt-1 text-sm">{item.price} BYN</p>
                          
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center bg-[var(--color-tg-bg)] rounded-lg p-0.5">
                              <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 flex items-center justify-center text-lg rounded-md bg-[var(--color-tg-secondary-bg)]">-</button>
                              <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 flex items-center justify-center text-lg rounded-md bg-[var(--color-tg-secondary-bg)]">+</button>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-400 ml-auto bg-red-500/10 rounded-lg">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="p-5 border-t border-[var(--color-tg-secondary-bg)] bg-[var(--color-tg-bg)] shadow-[0_-10px_20px_rgba(0,0,0,0.2)] pb-safe">
                    <div className="mb-4 text-center">
                      <span className="text-xs text-[var(--color-tg-hint)]">Менеджер уточнит нужный вкус и детали при подтверждении заказа</span>
                    </div>
                    
                    <div className="mb-4">
                      <label className="text-xs text-[var(--color-tg-hint)] mb-1.5 block font-medium">Ваш Telegram юзернейм для связи (без @):</label>
                      <input 
                        type="text" 
                        value={clientUsername}
                        onChange={e => setClientUsername(e.target.value)}
                        placeholder="ivan123"
                        className="w-full bg-[var(--color-tg-secondary-bg)] p-3 rounded-xl outline-none border border-transparent focus:border-[var(--color-tg-primary)] text-sm transition-colors"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[var(--color-tg-hint)] font-medium">Итого к оплате:</span>
                      <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#c084fc] to-[#7c3aed]">{cartTotal} BYN</span>
                    </div>
                    <button 
                      onClick={handleCheckout}
                      disabled={orderLoading || !clientUsername}
                      className="w-full py-3.5 bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white rounded-xl font-bold text-lg active:scale-95 transition-all shadow-lg shadow-[#7c3aed]/30 disabled:opacity-50 disabled:grayscale"
                    >
                      {orderLoading ? 'Оформление...' : 'Оформить заказ'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {isAdmin && (
        <button 
          onClick={() => window.location.hash = 'admin'}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(212,175,55,0.4)] z-30 active:scale-95 transition-transform"
        >
          <Settings size={28} />
        </button>
      )}
    </div>
  );
}

function ProductCard({ product, onAdd }: { product: Product, onAdd: (p: Product) => void }) {
  return (
    <div className="bg-[var(--color-tg-secondary-bg)] rounded-2xl overflow-hidden flex flex-col border border-white/5 hover:border-[var(--color-tg-primary)]/50 transition-colors shadow-sm">
      <div className="h-36 bg-[#130f1c] flex items-center justify-center overflow-hidden p-3 relative">
        {product.image ? (
          <img src={product.image} alt={product.name} className="object-contain h-full w-full drop-shadow-lg" />
        ) : (
          <Package size={48} className="text-[var(--color-tg-hint)] opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-tg-secondary-bg)] to-transparent opacity-50" />
      </div>
      <div className="p-3 flex flex-col flex-1">
        <div className="h-10 mb-2">
          <h3 className="font-bold text-sm leading-tight line-clamp-2">{product.name}</h3>
        </div>
        
        <div className="flex-1 flex flex-col justify-end text-center mt-1">
          <span className="text-[10px] text-[var(--color-tg-hint)] mb-2 block leading-tight">Менеджер уточнит вкус<br/>при заказе</span>
          <p className="text-[var(--color-tg-primary)] font-black text-lg mb-3">{product.price} BYN</p>
          
          <button 
            onClick={() => onAdd(product)}
            className="w-full py-2.5 bg-white/5 hover:bg-[var(--color-tg-primary)] text-white rounded-xl text-sm font-bold active:scale-95 transition-all border border-white/10 hover:border-transparent hover:shadow-lg hover:shadow-[var(--color-tg-primary)]/30"
          >
            В корзину
          </button>
        </div>
      </div>
    </div>
  );
}
