import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Product, Category, Promotion, Banner, StoreConfig, Order, OpeningHours } from '@/types';
import { supabase } from '@/lib/supabase';

const STORE_ID = (import.meta as any).env.VITE_STORE_ID || '1';
console.log(`[Store] Initialized for Store ID: ${STORE_ID}`);

// ── localStorage cache helpers ────────────────────────────────
const CACHE_KEY = `mx_cache_${STORE_ID}`;
const CACHE_TTL = 1000 * 60 * 30; // 30 min

function saveCache(data: object) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

function loadCache(): { config: StoreConfig; products: Product[]; categories: Category[]; promotions: any[]; banners: any[]; orders: Order[] } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null; // expirado
    return data;
  } catch { return null; }
}

const DEFAULT_OPENING_HOURS: OpeningHours = {
  'Segunda': { open: '08:00', close: '18:00', isOpen: true },
  'Terça': { open: '08:00', close: '18:00', isOpen: true },
  'Quarta': { open: '08:00', close: '18:00', isOpen: true },
  'Quinta': { open: '08:00', close: '18:00', isOpen: true },
  'Sexta': { open: '08:00', close: '18:00', isOpen: true },
  'Sábado': { open: '08:00', close: '12:00', isOpen: true },
  'Domingo': { open: '00:00', close: '00:00', isOpen: false },
};

const DEFAULT_CONFIG: StoreConfig = {
  name: 'Point do SOM',
  font: 'Inter',
  primaryColor: '#ef4444',
  logoUrl: '',
  address: 'Q. 16 - Res. Itaipu, Goiânia - GO, 74356-048, Brasil',
  lat: -16.7445258,
  lng: -49.336495,
  deliveryFeePerKm: 2,
  slogan: 'As melhores porções da região!',
  whatsapp: '5562991090176',
  pixKey: '',
  openingHours: DEFAULT_OPENING_HOURS,
  informativeText: '',
  alertSound: 'default',
};

interface StoreContextType {
  config: StoreConfig;
  setConfig: (c: StoreConfig) => void;
  products: Product[];
  setProducts: (p: Product[]) => void;
  addProduct: (p: Omit<Product, 'id'>) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  categories: Category[];
  setCategories: (c: Category[]) => void;
  addCategory: (c: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  promotions: Promotion[];
  setPromotions: (p: Promotion[]) => void;
  addPromotion: (p: Omit<Promotion, 'id'>) => void;
  updatePromotion: (p: Promotion) => void;
  deletePromotion: (id: string) => void;
  orders: Order[];
  addOrder: (o: Omit<Order, 'id' | 'createdAt' | 'status'>) => void;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  updateOrderPayment: (id: string, isPaid: boolean) => Promise<void>;
  updateOrderFee: (id: string, fee: number) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  banners: Banner[];
  addBanner: (b: Omit<Banner, 'id'>) => void;
  updateBanner: (b: Banner) => void;
  deleteBanner: (id: string) => void;
  uploadImage: (file: File) => Promise<string>;

  isLoading: boolean;
  isSaving: boolean;
  realtimeStatus: string;
}


const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<StoreConfig>(DEFAULT_CONFIG);
  const [products, setProductsState] = useState<Product[]>([]);
  const [categories, setCategoriesState] = useState<Category[]>([]);
  const [promotions, setPromotionsState] = useState<Promotion[]>([]);
  const [banners, setBannersState] = useState<Banner[]>([]);
  const [orders, setOrdersState] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState('connecting');
  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);

  // Initial load com cache localStorage
  useEffect(() => {
    // 1. Carrega cache imediatamente (app funciona offline)
    const cached = loadCache();
    if (cached) {
      if (cached.config) setConfigState(c => ({ ...c, ...cached.config }));
      if (cached.products) setProductsState(cached.products);
      if (cached.categories) setCategoriesState(cached.categories);
      if (cached.promotions) setPromotionsState(cached.promotions);
      if (cached.banners) setBannersState(cached.banners);
      if (cached.orders) setOrdersState(cached.orders);
      setIsLoading(false);
    }

    // 2. Tenta buscar dados frescos do Supabase em background
    const fetchData = async () => {
      try {
        let freshConfig: StoreConfig | null = null;
        try {
          const confRes = await supabase.from('config').select('*').eq('id', STORE_ID).limit(1).single();
          if (confRes.data) {
            freshConfig = { ...DEFAULT_CONFIG, ...Object.fromEntries(Object.entries(confRes.data).filter(([_, v]) => v != null)) as Partial<StoreConfig> };
            if (!freshConfig.openingHours || Object.keys(freshConfig.openingHours).length === 0) {
              freshConfig.openingHours = DEFAULT_OPENING_HOURS;
            }
            setConfigState(freshConfig);
          }
        } catch (confErr) {
          console.warn('[Cache] Supabase config indisponível, usando cache.');
        }

        const [prodRes, catRes, promRes, ordRes, banRes] = await Promise.all([
          supabase.from('products').select('*').eq('store_id', STORE_ID),
          supabase.from('categories').select('*').eq('store_id', STORE_ID),
          supabase.from('promotions').select('*').eq('store_id', STORE_ID),
          supabase.from('orders').select('*').eq('store_id', STORE_ID),
          supabase.from('banners').select('*').eq('store_id', STORE_ID)
        ]);

        const freshProducts   = prodRes.data  || (cached?.products   ?? []);
        const freshCategories = catRes.data   || (cached?.categories ?? []);
        const freshPromotions = promRes.data  || (cached?.promotions ?? []);
        const freshOrders     = ordRes.data   || (cached?.orders     ?? []);
        const freshBanners    = banRes.data   || (cached?.banners    ?? []);

        setProductsState(freshProducts);
        setCategoriesState(freshCategories);
        setPromotionsState(freshPromotions);
        setOrdersState(freshOrders);
        setBannersState(freshBanners);

        // Salva tudo no cache
        saveCache({
          config:     freshConfig ?? cached?.config ?? DEFAULT_CONFIG,
          products:   freshProducts,
          categories: freshCategories,
          promotions: freshPromotions,
          banners:    freshBanners,
          orders:     freshOrders,
        });
      } catch (err) {
        console.warn('[Cache] Supabase indisponível, usando dados em cache.', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sync listener (real-time all tables)
  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'config', filter: `id=eq.${STORE_ID}` }, payload => {
        console.log('[Real-time] Config updated', payload.new);
        if (payload.new) setConfigState(prev => ({ ...prev, ...payload.new }));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `store_id=eq.${STORE_ID}` }, payload => {
        console.log('[Real-time] Products changed', payload.eventType);
        if (payload.eventType === 'INSERT') {
          setProductsState(prev => prev.some(p => p.id === payload.new.id) ? prev : [...prev, payload.new as Product]);
        }
        if (payload.eventType === 'UPDATE') setProductsState(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } as Product : p));
        if (payload.eventType === 'DELETE') setProductsState(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `store_id=eq.${STORE_ID}` }, payload => {
        console.log('[Real-time] Categories changed', payload.eventType);
        if (payload.eventType === 'INSERT') {
          setCategoriesState(prev => prev.some(c => c.id === payload.new.id) ? prev : [...prev, payload.new as Category]);
        }
        if (payload.eventType === 'UPDATE') setCategoriesState(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } as Category : c));
        if (payload.eventType === 'DELETE') setCategoriesState(prev => prev.filter(c => c.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions', filter: `store_id=eq.${STORE_ID}` }, payload => {
        console.log('[Real-time] Promotions changed', payload.eventType);
        if (payload.eventType === 'INSERT') {
          setPromotionsState(prev => prev.some(p => p.id === payload.new.id) ? prev : [...prev, payload.new as Promotion]);
        }
        if (payload.eventType === 'UPDATE') setPromotionsState(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } as Promotion : p));
        if (payload.eventType === 'DELETE') setPromotionsState(prev => prev.filter(p => p.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners', filter: `store_id=eq.${STORE_ID}` }, payload => {
        console.log('[Real-time] Banners changed', payload.eventType);
        if (payload.eventType === 'INSERT') {
          setBannersState(prev => prev.some(b => b.id === payload.new.id) ? prev : [...prev, payload.new as Banner]);
        }
        if (payload.eventType === 'UPDATE') setBannersState(prev => prev.map(b => b.id === payload.new.id ? { ...b, ...payload.new } as Banner : b));
        if (payload.eventType === 'DELETE') setBannersState(prev => prev.filter(b => b.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `store_id=eq.${STORE_ID}` }, payload => {
        console.log('[Real-time] Orders changed', payload.eventType);
        if (payload.eventType === 'INSERT') {
          setOrdersState(prev => {
            if (prev.some(o => o.id === payload.new.id)) return prev;
            
            // Play alert sound based on config
            try {
              const sound = configRef.current.alertSound || 'default';
              if (sound !== 'none') {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const gain = ctx.createGain();
                gain.connect(ctx.destination);
                
                if (sound === 'default') {
                  const osc1 = ctx.createOscillator();
                  osc1.connect(gain);
                  osc1.type = 'sine';
                  osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
                  gain.gain.setValueAtTime(0, ctx.currentTime);
                  gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
                  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                  osc1.start(ctx.currentTime);
                  osc1.stop(ctx.currentTime + 0.5);

                  const osc2 = ctx.createOscillator();
                  osc2.connect(gain);
                  osc2.type = 'sine';
                  osc2.frequency.setValueAtTime(523.25, ctx.currentTime + 0.4);
                  gain.gain.setValueAtTime(0, ctx.currentTime + 0.4);
                  gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.45);
                  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
                  osc2.start(ctx.currentTime + 0.4);
                  osc2.stop(ctx.currentTime + 1.2);
                }
                else if (sound === 'siren') {
                  const osc = ctx.createOscillator();
                  osc.connect(gain);
                  osc.type = 'square';
                  osc.frequency.setValueAtTime(600, ctx.currentTime);
                  osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.4);
                  osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.8);
                  osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 1.2);
                  osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 1.6);
                  gain.gain.setValueAtTime(0, ctx.currentTime);
                  gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
                  gain.gain.setValueAtTime(0.1, ctx.currentTime + 1.5);
                  gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.6);
                  osc.start(ctx.currentTime);
                  osc.stop(ctx.currentTime + 1.6);
                }
                else if (sound === 'digital') {
                  for(let i=0; i<4; i++) {
                    const osc = ctx.createOscillator();
                    const g = ctx.createGain();
                    osc.connect(g);
                    g.connect(ctx.destination);
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(800, ctx.currentTime + (i * 0.15));
                    g.gain.setValueAtTime(0, ctx.currentTime + (i * 0.15));
                    g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + (i * 0.15) + 0.02);
                    g.gain.linearRampToValueAtTime(0, ctx.currentTime + (i * 0.15) + 0.1);
                    osc.start(ctx.currentTime + (i * 0.15));
                    osc.stop(ctx.currentTime + (i * 0.15) + 0.1);
                  }
                }
                else if (sound === 'short') {
                  const osc = ctx.createOscillator();
                  osc.connect(gain);
                  osc.type = 'sine';
                  osc.frequency.setValueAtTime(880, ctx.currentTime);
                  osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.15);
                  gain.gain.setValueAtTime(0, ctx.currentTime);
                  gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
                  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                  osc.start(ctx.currentTime);
                  osc.stop(ctx.currentTime + 0.15);
                }
                else if (sound === 'soft') {
                  const osc = ctx.createOscillator();
                  osc.connect(gain);
                  osc.type = 'sine';
                  osc.frequency.setValueAtTime(440, ctx.currentTime);
                  gain.gain.setValueAtTime(0, ctx.currentTime);
                  gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
                  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.0);
                  osc.start(ctx.currentTime);
                  osc.stop(ctx.currentTime + 2.0);
                }
                else {
                  new Audio(sound).play().catch(() => {});
                }
              }
            } catch(e) {
              console.error("Erro ao tocar som:", e);
            }
          
          return [...prev, payload.new as Order];
        });
        }
        if (payload.eventType === 'UPDATE') setOrdersState(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } as Order : o));
        if (payload.eventType === 'DELETE') setOrdersState(prev => prev.filter(o => o.id !== payload.old.id));
      })

      .subscribe((status) => {
        console.log(`[Store] Supabase Realtime Subscription: ${status}`);
        setRealtimeStatus(status);
      });



    return () => {
      supabase.removeChannel(channel);
    };
  }, []);


  const uploadImage = async (file: File): Promise<string> => {
    setIsSaving(true);
    try {
      let finalFile = file;
      // Compress only images
      if (file.type.startsWith('image/')) {
        finalFile = await new Promise<File>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => {
            const img = new Image();
            img.src = e.target?.result as string;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let { width, height } = img;
              const max = 1200;
              if (width > height && width > max) { height *= max / width; width = max; }
              else if (height > max) { width *= max / height; height = max; }
              canvas.width = width; canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0, width, height);
              canvas.toBlob((blob) => {
                if (blob) resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' }));
                else resolve(file);
              }, 'image/jpeg', 0.7);
            };
            img.onerror = () => resolve(file);
          };
          reader.onerror = () => resolve(file);
        });
      }

      // Upload para Cloudinary (sem egress Supabase)
      const formData = new FormData();
      formData.append('file', finalFile);
      formData.append('upload_preset', 'ml_default');

      const res = await fetch('https://api.cloudinary.com/v1_1/daffg0p8g/image/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Erro no upload Cloudinary');
      const data = await res.json();
      return data.secure_url as string;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // CONFIG
  const setConfig = async (c: StoreConfig) => {
    setConfigState(c);
    setIsSaving(true);
    try {
      const { error } = await supabase.from('config').upsert({ id: STORE_ID, ...c });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar no banco (verifique permissões do Supabase): ' + err.message);
    } finally { setIsSaving(false); }
  };

  // PRODUCTS
  const addProduct = async (p: Omit<Product, 'id'>) => {
    const newP = { id: genId(), store_id: STORE_ID, ...p };
    setProductsState(prev => [...prev, newP]);
    setIsSaving(true);
    const { error } = await supabase.from('products').insert([newP]);
    setIsSaving(false);
    if (error) {
      alert('Erro ao salvar produto: ' + error.message);
      setProductsState(prev => prev.filter(x => x.id !== newP.id)); // Reverte em caso de erro
    }
  };
  const updateProduct = async (p: Product) => {
    const previous = products.find(x => x.id === p.id);
    setProductsState(prev => prev.map(x => x.id === p.id ? p : x));
    setIsSaving(true);
    const { error } = await supabase.from('products').upsert({ ...p, store_id: STORE_ID });
    setIsSaving(false);
    if (error) {
      alert('Erro ao atualizar produto: ' + error.message);
      if (previous) setProductsState(prev => prev.map(x => x.id === p.id ? previous : x));
    }
  };
  const deleteProduct = async (id: string) => {
    const previous = products.find(x => x.id === id);
    setProductsState(prev => prev.filter(x => x.id !== id));
    setIsSaving(true);
    const { error } = await supabase.from('products').delete().eq('id', id);
    setIsSaving(false);
    if (error && previous) {
      alert('Erro ao excluir produto: ' + error.message);
      setProductsState(prev => [...prev, previous]);
      return;
    }
    // Apaga arquivo do Supabase Storage se a imagem for do Supabase
    if (previous?.imageUrl?.includes('supabase')) {
      try {
        const fileName = previous.imageUrl.split('/images/').pop();
        if (fileName) await supabase.storage.from('images').remove([fileName]);
      } catch (e) { console.warn('Erro ao deletar imagem do Storage:', e); }
    }
    // Apaga mediaUrls do Storage também
    if (previous?.mediaUrls?.length) {
      const supabaseFiles = previous.mediaUrls
        .filter(u => u.includes('supabase'))
        .map(u => u.split('/images/').pop())
        .filter(Boolean) as string[];
      if (supabaseFiles.length) {
        try { await supabase.storage.from('images').remove(supabaseFiles); }
        catch (e) { console.warn('Erro ao deletar mediaUrls do Storage:', e); }
      }
    }
  };


  const setProducts = (p: Product[]) => setProductsState(p);

  // CATEGORIES
  const addCategory = async (c: Omit<Category, 'id'>) => {
    const newC = { id: genId(), store_id: STORE_ID, ...c };
    setCategoriesState(prev => [...prev, newC]);
    setIsSaving(true);
    const { error } = await supabase.from('categories').insert([newC]);
    setIsSaving(false);
    if (error) {
      alert('Erro ao criar categoria: ' + error.message);
      setCategoriesState(prev => prev.filter(x => x.id !== newC.id));
    }
  };
  const deleteCategory = async (id: string) => {
    const previous = categories.find(x => x.id === id);
    setCategoriesState(prev => prev.filter(x => x.id !== id));
    setIsSaving(true);
    const { error } = await supabase.from('categories').delete().eq('id', id);
    setIsSaving(false);
    if (error && previous) {
      alert('Erro ao deletar categoria: ' + error.message);
      setCategoriesState(prev => [...prev, previous]);
    }
  };

  const setCategories = (c: Category[]) => setCategoriesState(c);

  // PROMOTIONS
  const addPromotion = async (p: Omit<Promotion, 'id'>) => {
    const newP = { id: genId(), store_id: STORE_ID, ...p };
    setPromotionsState(prev => [...prev, newP]);
    setIsSaving(true);
    const { error } = await supabase.from('promotions').insert([newP]);
    setIsSaving(false);
    if (error) {
      alert('Erro ao criar promoção: ' + error.message);
      setPromotionsState(prev => prev.filter(x => x.id !== newP.id));
    }
  };
  const updatePromotion = async (p: Promotion) => {
    const previous = promotions.find(x => x.id === p.id);
    setPromotionsState(prev => prev.map(x => x.id === p.id ? p : x));
    setIsSaving(true);
    const { error } = await supabase.from('promotions').upsert({ ...p, store_id: STORE_ID });
    setIsSaving(false);
    if (error && previous) {
      alert('Erro ao atualizar: ' + error.message);
      setPromotionsState(prev => prev.map(x => x.id === p.id ? previous : x));
    }
  };
  const deletePromotion = async (id: string) => {
    const previous = promotions.find(x => x.id === id);
    setPromotionsState(prev => prev.filter(x => x.id !== id));
    setIsSaving(true);
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    setIsSaving(false);
    if (error && previous) {
      alert('Erro ao excluir: ' + error.message);
      setPromotionsState(prev => [...prev, previous]);
    }
  };

  const setPromotions = (p: Promotion[]) => setPromotionsState(p);

  // BANNERS
  const addBanner = async (b: Omit<Banner, 'id'>) => {
    const newB: Banner = { id: genId(), store_id: STORE_ID, ...b } as Banner;
    setBannersState(prev => [...prev, newB]);
    const { error } = await supabase.from('banners').insert([newB]);
    if (error) { alert('Erro ao criar banner: ' + error.message); setBannersState(prev => prev.filter(x => x.id !== newB.id)); }
  };
  const updateBanner = async (b: Banner) => {
    setBannersState(prev => prev.map(x => x.id === b.id ? b : x));
    const { error } = await supabase.from('banners').upsert({ ...b, store_id: STORE_ID });
    if (error) alert('Erro ao atualizar banner: ' + error.message);
  };
  const deleteBanner = async (id: string) => {
    setBannersState(prev => prev.filter(x => x.id !== id));
    await supabase.from('banners').delete().eq('id', id);
  };

  // ORDERS
  const addOrder = async (o: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
    const newO: Order = { ...o, id: genId(), createdAt: new Date().toISOString(), status: 'pending' };
    const dbOrder = { ...newO, store_id: STORE_ID };
    setOrdersState(prev => [...prev, newO]);
    setIsSaving(true);
    
    // Baixa no estoque
    try {
      for (const item of o.items) {
        const prod = products.find(p => p.id === item.product.id);
        if (prod && prod.stock !== undefined && prod.stock > 0) {
          const newStock = Math.max(0, prod.stock - item.quantity);
          // Atualiza localmente o produto para refletir a baixa imediatamente
          setProductsState(prev => prev.map(p => p.id === prod.id ? { ...p, stock: newStock } : p));
          // Sincroniza com Supabase
          await supabase.from('products').update({ stock: newStock }).eq('id', prod.id);
        }
      }
    } catch (stockErr) {
      console.error("Erro ao dar baixa no estoque:", stockErr);
    }

    const { error } = await supabase.from('orders').insert([dbOrder]);
    setIsSaving(false);
    if (error) console.error("Erro ao salvar pedido no DB:", error.message);
  };
  const updateOrderStatus = async (id: string, status: Order['status']) => {
    const previous = orders.find(x => x.id === id);
    setOrdersState(prev => prev.map(x => x.id === id ? { ...x, status } : x));
    setIsSaving(true);
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    setIsSaving(false);
    if (error && previous) {
      alert('Erro ao atualizar: ' + error.message);
      setOrdersState(prev => prev.map(x => x.id === id ? previous : x));
    }
  };
  const updateOrderPayment = async (id: string, isPaid: boolean) => {
    const previous = orders.find(x => x.id === id);
    setOrdersState(prev => prev.map(x => x.id === id ? { ...x, isPaid } : x));
    setIsSaving(true);
    const { error } = await supabase.from('orders').update({ isPaid }).eq('id', id);
    setIsSaving(false);
    if (error && previous) {
      alert('Erro ao atualizar pagamento: ' + error.message);
      setOrdersState(prev => prev.map(x => x.id === id ? previous : x));
    }
  };

  const updateOrderFee = async (id: string, fee: number) => {
    const previous = orders.find(x => x.id === id);
    if (!previous) return;
    const total = previous.subtotal + fee;
    setOrdersState(prev => prev.map(x => x.id === id ? { ...x, deliveryFee: fee, total } : x));
    setIsSaving(true);
    const { error } = await supabase.from('orders').update({ deliveryFee: fee, total }).eq('id', id);
    setIsSaving(false);
    if (error) {
      alert('Erro ao atualizar taxa: ' + error.message);
      setOrdersState(prev => prev.map(x => x.id === id ? previous : x));
    }
  };

  const deleteOrder = async (id: string) => {
    const previous = orders.find(x => x.id === id);
    if (!previous) return;
    
    // RESTORE STOCK
    try {
      for (const item of previous.items) {
        const prod = products.find(p => p.id === item.product.id);
        if (prod && prod.stock !== undefined) {
          const newStock = prod.stock + item.quantity;
          // Prevent restoring if it was marked as unlimited (e.g. 999 or above)
          if (prod.stock < 990) {
            setProductsState(prev => prev.map(p => p.id === prod.id ? { ...p, stock: newStock } : p));
            await supabase.from('products').update({ stock: newStock }).eq('id', prod.id);
          }
        }
      }
    } catch (err) {
      console.error("Erro ao retornar estoque:", err);
    }

    setOrdersState(prev => prev.filter(x => x.id !== id));
    setIsSaving(true);
    const { error } = await supabase.from('orders').delete().eq('id', id);
    setIsSaving(false);
    if (error && previous) {
      alert('Erro ao excluir pedido: ' + error.message);
      setOrdersState(prev => [...prev, previous]);
    }
  };



  return (
    <StoreContext.Provider value={{
      config, setConfig,
      products, setProducts, addProduct, updateProduct, deleteProduct,
      categories, setCategories, addCategory, deleteCategory,
      promotions, setPromotions, addPromotion, updatePromotion, deletePromotion,
      orders, addOrder, updateOrderStatus, updateOrderPayment, updateOrderFee, deleteOrder,
      uploadImage, isLoading, isSaving, realtimeStatus,
      banners, addBanner, updateBanner, deleteBanner


    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
