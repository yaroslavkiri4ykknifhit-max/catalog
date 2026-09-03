import { useState, useEffect } from 'react';
import type { Product, Category } from '../types';
import { Save, Plus, Trash2, Settings, Loader2 } from 'lucide-react';

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('gh_token') || '');
  const [repo, setRepo] = useState(localStorage.getItem('gh_repo') || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('products.json?t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories || []);
        setProducts(data.products || []);
      })
      .catch(err => console.error(err));
  }, []);

  const saveSettings = () => {
    localStorage.setItem('gh_token', token);
    localStorage.setItem('gh_repo', repo);
    setSuccess('Настройки сохранены локально.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleImageUpload = async (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    // Convert to base64 to show immediately
    const b64 = await toBase64(file);
    
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, image: b64, _file: file } : p
    ));
  };

  const publishChanges = async () => {
    if (!token || !repo) {
      setError('Введите токен и репозиторий');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // 1. Process images: if there's a new _file, we should upload it, but to keep it simple and truly DB-less without bloating the repo, 
      // we can actually just upload images via GitHub API to the public/images folder, or just save them as base64 in the json!
      // Base64 in JSON is easiest but makes the JSON huge. Let's upload to public/images folder.
      
      const newProducts = [...products];
      
      for (let i = 0; i < newProducts.length; i++) {
        const p = newProducts[i] as any;
        if (p._file) {
          // Upload to GH
          const ext = p._file.name.split('.').pop();
          const filename = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
          const path = `public/images/${filename}`;
          
          const contentBase64 = p.image.split(',')[1]; // remove data:image/...;base64,
          
          const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: `Upload image ${filename}`,
              content: contentBase64,
              branch: 'main'
            })
          });
          
          if (!res.ok) throw new Error('Ошибка загрузки картинки');
          
          newProducts[i].image = `/images/${filename}`;
          delete newProducts[i]._file;
        }
      }
      
      // 2. Upload products.json
      const finalData = { categories, products: newProducts.map(p => { const { _file, ...rest } = p as any; return rest; }) };
      const jsonContent = btoa(unescape(encodeURIComponent(JSON.stringify(finalData, null, 2))));
      
      // Get current products.json sha
      const shaRes = await fetch(`https://api.github.com/repos/${repo}/contents/public/products.json`, {
        headers: { 'Authorization': `token ${token}` }
      });
      let sha = '';
      if (shaRes.ok) {
        const shaData = await shaRes.json();
        sha = shaData.sha;
      }
      
      const updateRes = await fetch(`https://api.github.com/repos/${repo}/contents/public/products.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Update products catalog via Admin',
          content: jsonContent,
          sha: sha || undefined,
          branch: 'main'
        })
      });
      
      if (!updateRes.ok) {
        const errData = await updateRes.json();
        throw new Error(errData.message || 'Ошибка обновления JSON');
      }
      
      setSuccess('Каталог успешно обновлен на GitHub! Изменения появятся через минуту.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = () => {
    const newId = Date.now().toString();
    setProducts([...products, { id: newId, name: 'Новый товар', price: 0, categoryId: categories[0]?.id || '' }]);
  };

  const updateProduct = (id: string, field: string, value: any) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-[var(--color-tg-bg)] text-[var(--color-tg-text)] p-4 max-w-2xl mx-auto pb-24">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings /> Управление каталогом
      </h1>
      
      <div className="bg-[var(--color-tg-secondary-bg)] p-4 rounded-xl mb-6 space-y-3">
        <h2 className="font-semibold text-lg border-b border-[var(--color-tg-bg)] pb-2 mb-2">Настройки GitHub</h2>
        <input 
          type="text" 
          placeholder="GitHub Token (ghp_...)" 
          value={token} 
          onChange={e => setToken(e.target.value)}
          className="w-full bg-[var(--color-tg-bg)] p-2 rounded-lg text-sm border border-transparent focus:border-[var(--color-tg-primary)] outline-none"
        />
        <input 
          type="text" 
          placeholder="Репозиторий (например: username/vape-catalog)" 
          value={repo} 
          onChange={e => setRepo(e.target.value)}
          className="w-full bg-[var(--color-tg-bg)] p-2 rounded-lg text-sm border border-transparent focus:border-[var(--color-tg-primary)] outline-none"
        />
        <button onClick={saveSettings} className="px-4 py-2 bg-[var(--color-tg-bg)] text-[var(--color-tg-primary)] rounded-lg text-sm font-medium">
          Сохранить настройки
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Товары</h2>
        <button onClick={addProduct} className="p-2 bg-[var(--color-tg-primary)] text-[var(--color-tg-primary-text)] rounded-full">
          <Plus size={20} />
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {products.map(p => (
          <div key={p.id} className="bg-[var(--color-tg-secondary-bg)] p-4 rounded-xl flex flex-col gap-3">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-[var(--color-tg-bg)] rounded-lg flex-shrink-0 relative overflow-hidden group">
                {p.image ? (
                  <img src={p.image} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-tg-hint)]">Нет фото</div>
                )}
                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                  <span className="text-xs font-bold text-white">Загрузить</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(p.id, e)} />
                </label>
              </div>
              <div className="flex-1 space-y-2">
                <input 
                  type="text" 
                  value={p.name} 
                  onChange={e => updateProduct(p.id, 'name', e.target.value)}
                  className="w-full bg-[var(--color-tg-bg)] p-2 rounded-lg text-sm font-medium outline-none"
                  placeholder="Название"
                />
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    value={p.price || ''} 
                    onChange={e => updateProduct(p.id, 'price', Number(e.target.value))}
                    className="w-1/3 bg-[var(--color-tg-bg)] p-2 rounded-lg text-sm outline-none"
                    placeholder="Цена (BYN)"
                  />
                  <select 
                    value={p.categoryId} 
                    onChange={e => updateProduct(p.id, 'categoryId', e.target.value)}
                    className="flex-1 bg-[var(--color-tg-bg)] p-2 rounded-lg text-sm outline-none"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={() => removeProduct(p.id)} className="p-2 h-fit text-red-400 bg-red-400/10 rounded-lg">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="p-3 bg-red-500/20 text-red-400 rounded-xl mb-4 text-sm font-medium">{error}</div>}
      {success && <div className="p-3 bg-green-500/20 text-green-400 rounded-xl mb-4 text-sm font-medium">{success}</div>}

      <button 
        onClick={publishChanges}
        disabled={loading}
        className="w-full py-4 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="animate-spin" /> : <Save />}
        Опубликовать изменения (GitHub)
      </button>
    </div>
  );
}
