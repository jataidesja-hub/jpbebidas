import { useState, useMemo, useEffect, useRef } from "react";
import { useStore } from "@/store/StoreContext";
import { CartItem } from "@/types";
import { calculateDistance, formatCurrency } from "@/lib/utils";
import {
  Search, MapPin, Tag, ShoppingCart, X, Phone,
  Facebook, Instagram, Minus, Plus, Trash2, Send, Megaphone, Navigation,
  Download, Smartphone, ClipboardList, ExternalLink
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { MapPicker } from "@/components/MapPicker";

const APP_VERSION = "PWA-1.0.2";
console.log(`[App] Running version: ${APP_VERSION}`);

function PromoTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const end = new Date(expiresAt).getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = end - now;
      if (distance < 0) {
        setTimeLeft("Expirada");
        clearInterval(interval);
        return;
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return <span className="font-mono bg-black/30 px-2 py-0.5 rounded-lg ml-2 text-xs border border-white/20 animate-pulse">{timeLeft}</span>;
}

function ProductMediaCarousel({ product }: { product: any }) {
  const allMedia = [product.imageUrl, ...(product.mediaUrls || [])].filter(Boolean);
  const [idx, setIdx] = useState(0);
  const touchStartX = useRef(0);

  const prev = () => setIdx(i => (i - 1 + allMedia.length) % allMedia.length);
  const next = () => setIdx(i => (i + 1) % allMedia.length);

  const getYouTubeId = (url: string) => {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
    return m ? m[1] : null;
  };

  const renderMedia = (url: string) => {
    const ytId = getYouTubeId(url);
    if (ytId) return <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full" allowFullScreen />;
    if (url.match(/\.(mp4|mov|webm)/i)) return <video src={url} controls className="w-full h-full object-cover" />;
    return <img src={url} className="w-full h-full object-cover" />;
  };

  return (
    <div className="aspect-video relative bg-black select-none"
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (dx < -50) next();
        else if (dx > 50) prev();
      }}>
      {renderMedia(allMedia[idx])}
      {allMedia.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm z-10">‹</button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm z-10">›</button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
            {allMedia.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === idx ? 'bg-white scale-125' : 'bg-white/40'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BannerCountdown({ expiresAt }: { expiresAt: string }) {

  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Encerrado'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${d > 0 ? d + 'd ' : ''}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="text-[10px] font-black uppercase opacity-70">Encerra em:</span>
      <span className="font-mono font-black text-lg bg-black/30 px-3 py-1 rounded-lg tracking-widest">{timeLeft}</span>
    </div>
  );
}

export default function ClientHome() {
  const { config, products, categories, promotions, banners, isLoading } = useStore();
  const { addOrder } = useStore();

  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<typeof products[0] | null>(null);
  const [orderSent, setOrderSent] = useState(false);
  const [promoPopupOpen, setPromoPopupOpen] = useState(false);
  const [initialPromo, setInitialPromo] = useState<any>(null);
  const [infoClosed, setInfoClosed] = useState(false);

  // Checkout form
  const [custName, setCustName] = useState("");
  const [custWhatsapp, setCustWhatsapp] = useState("+55 ");
  const [custAddress, setCustAddress] = useState("");
  const [custLat, setCustLat] = useState(0);
  const [custLng, setCustLng] = useState(0);
  const [locating, setLocating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'dinheiro' | 'cartao_credito' | 'cartao_debito'>('pix');
  const [changeFor, setChangeFor] = useState("");
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // WhatsApp Drag State
  const [waPos, setWaPos] = useState({ x: 0, y: 0 });
  const [isDraggingWa, setIsDraggingWa] = useState(false);
  const dragRef = useRef<{ startX: number, startY: number, initX: number, initY: number } | null>(null);

  const handleWaPointerDown = (e: React.PointerEvent) => {
    // @ts-ignore
    e.target.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, initX: waPos.x, initY: waPos.y };
  };

  const handleWaPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setIsDraggingWa(true);
    setWaPos({ 
      x: dragRef.current.initX + (e.clientX - dragRef.current.startX), 
      y: dragRef.current.initY + (e.clientY - dragRef.current.startY) 
    });
  };

  const handleWaPointerUp = (e: React.PointerEvent) => {
    // @ts-ignore
    e.target.releasePointerCapture(e.pointerId);
    dragRef.current = null;
    setTimeout(() => setIsDraggingWa(false), 100);
  };

  // Instagram Drag State
  const [igPos, setIgPos] = useState({ x: 0, y: 0 });
  const [isDraggingIg, setIsDraggingIg] = useState(false);
  const igDragRef = useRef<{ startX: number, startY: number, initX: number, initY: number } | null>(null);

  const handleIgPointerDown = (e: React.PointerEvent) => {
    // @ts-ignore
    e.target.setPointerCapture(e.pointerId);
    igDragRef.current = { startX: e.clientX, startY: e.clientY, initX: igPos.x, initY: igPos.y };
  };

  const handleIgPointerMove = (e: React.PointerEvent) => {
    if (!igDragRef.current) return;
    setIsDraggingIg(true);
    setIgPos({ 
      x: igDragRef.current.initX + (e.clientX - igDragRef.current.startX), 
      y: igDragRef.current.initY + (e.clientY - igDragRef.current.startY) 
    });
  };

  const handleIgPointerUp = (e: React.PointerEvent) => {
    // @ts-ignore
    e.target.releasePointerCapture(e.pointerId);
    igDragRef.current = null;
    setTimeout(() => setIsDraggingIg(false), 100);
  };

  // Initial Load & Auth logic would go here if needed
  
  // Carregar dados salvos do cliente para preenchimento automático
  useEffect(() => {
    const savedName = localStorage.getItem('mx_cust_name');
    const savedPhone = localStorage.getItem('mx_cust_phone');
    const savedAddress = localStorage.getItem('mx_cust_address');
    const savedLat = localStorage.getItem('mx_cust_lat');
    const savedLng = localStorage.getItem('mx_cust_lng');
    
    if (savedName) setCustName(savedName);
    if (savedPhone) setCustWhatsapp(savedPhone.startsWith('+55') ? savedPhone : '+55 ' + savedPhone);
    if (savedAddress) setCustAddress(savedAddress);
    if (savedLat) setCustLat(Number(savedLat));
    if (savedLng) setCustLng(Number(savedLng));
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const activePromos = useMemo(() => {
    const now = new Date().getTime();
    return promotions.filter(p => p.active && (!p.expiresAt || new Date(p.expiresAt).getTime() > now));
  }, [promotions]);

  useEffect(() => {
    const promoOnStart = activePromos.find(p => p.showOnStart);
    if (promoOnStart) {
      const shown = sessionStorage.getItem('mx_promo_shown');
      if (!shown) {
        setInitialPromo(promoOnStart);
        setPromoPopupOpen(true);
        sessionStorage.setItem('mx_promo_shown', 'true');
      }
    }
  }, [activePromos]);

  const getPromoPrice = (productId: string, originalPrice: number): number | null => {
    for (const promo of activePromos) {
      if (promo.productIds.length === 0 || promo.productIds.includes(productId)) {
        return originalPrice * (1 - promo.discountPercent / 100);
      }
    }
    return null;
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchCategory = activeCategory === "Todos" || p.category === activeCategory;
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCategory && matchSearch;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [activeCategory, searchTerm, products]);

  const addToCart = (product: typeof products[0]) => {
    if (!isOpen) { alert('Loja fechada!'); return; }
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (product.stock !== undefined && product.stock !== null && (existing?.quantity || 0) >= product.stock) {
        alert('Estoque insuficiente!'); return prev;
      }
      if (existing) return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.product.id === productId) {
        const newQty = c.quantity + delta;
        if (newQty <= 0) return c;
        const product = products.find(p => p.id === productId);
        if (delta > 0 && product?.stock && newQty > product.stock) return c;
        return { ...c, quantity: newQty };
      }
      return c;
    }));
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(c => c.product.id !== productId));
  const cartCount = cart.reduce((acc, c) => acc + c.quantity, 0);
  const subtotal = cart.reduce((acc, c) => acc + (getPromoPrice(c.product.id, c.product.price) ?? c.product.price) * c.quantity, 0);
  const total = subtotal;

  const handleDetectLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { handleMapChange(pos.coords.latitude, pos.coords.longitude); setLocating(false); },
      () => { alert('Erro ao obter GPS'); setLocating(false); }
    );
  };

  const handleMapChange = async (lat: number, lng: number) => {
    setCustLat(lat); setCustLng(lng);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.display_name) setCustAddress(data.display_name);
      }
    } catch (e) {}
  };

  const handleSendOrder = () => {
    if (!custName || !custWhatsapp) return alert('Preencha os dados!');
    addOrder({
      items: cart, customerName: custName, customerWhatsapp: custWhatsapp,
      customerAddress: custAddress, customerLat: custLat, customerLng: custLng,
      deliveryFee: 0, subtotal, total, paymentMethod,
      changeFor: paymentMethod === 'dinheiro' && changeFor ? parseFloat(changeFor) : null,
      isPaid: false
    });

    if (config.whatsapp) {
      const itemsList = cart.map(c => {
        const photos = (c.product.mediaUrls && c.product.mediaUrls.length > 0)
          ? c.product.mediaUrls.slice(0, 3).map(u => `\n    \uD83D\uDCF8 ${u}`).join('')
          : c.product.imageUrl ? `\n    \uD83D\uDCF8 ${c.product.imageUrl}` : '';
        return `\u2022 ${c.quantity}x ${c.product.name}${photos}`;
      }).join('\n');
      const mapLink = custLat && custLng ? `https://www.google.com/maps/search/?api=1&query=${custLat},${custLng}` : 'N\u00e3o informado';
      const changeMsg = paymentMethod === 'dinheiro' && changeFor ? `\n\uD83D\uDCB5 *Troco para:* R$ ${changeFor}` : '';
      const payLabels: Record<string, string> = { pix: 'PIX', dinheiro: 'Dinheiro vivo', cartao_credito: 'Cart\u00e3o de Cr\u00e9dito', cartao_debito: 'Cart\u00e3o de D\u00e9bito' };
      const msg = `\uD83D\uDED2 *NOVO PEDIDO*\n\n\uD83D\uDC64 *Cliente:* ${custName}\n\uD83D\uDCF1 *WhatsApp:* ${custWhatsapp}\n\uD83D\uDCCD *Endere\u00e7o:* ${custAddress}\n\uD83D\uDDFA\uFE0F *Localiza\u00e7\u00e3o GPS:* ${mapLink}\n\n*ITENS:*\n${itemsList}\n\n\uD83D\uDCB0 *Subtotal:* ${formatCurrency(subtotal)}\n\n\uD83D\uDCB3 *Pagamento:* ${payLabels[paymentMethod] || paymentMethod}${changeMsg}\n\n*Frete a combinar*`;
      let waNumber = config.whatsapp.replace(/\D/g, '');
      if (waNumber.length <= 11) waNumber = '55' + waNumber;
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    setOrderSent(true);
    setCart([]);
    localStorage.setItem('mx_cust_name', custName);
    localStorage.setItem('mx_cust_phone', custWhatsapp);
    localStorage.setItem('mx_cust_address', custAddress);
    localStorage.setItem('mx_cust_lat', custLat.toString());
    localStorage.setItem('mx_cust_lng', custLng.toString());
    setTimeout(() => { setOrderSent(false); setCheckoutOpen(false); }, 3000);
  };

  const allCategories = ["Todos", ...categories.map(c => c.name)];

  const isOpen = useMemo(() => {
    if (!config.openingHours || typeof config.openingHours !== 'object') return true;
    const now = new Date();
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const currentDay = dayNames[now.getDay()];
    const schedule = config.openingHours[currentDay];
    if (!schedule?.isOpen) return false;
    try {
      const openStr = (schedule.open || '00:00').toString();
      const closeStr = (schedule.close || '23:59').toString();
      const [openH, openM] = openStr.split(':').map(Number);
      const [closeH, closeM] = closeStr.split(':').map(Number);
      const cur = now.getHours() * 60 + now.getMinutes();
      const op = openH * 60 + openM;
      const cl = closeH * 60 + closeM;
      return cur >= op && cur <= cl;
    } catch (e) { return true; }
  }, [config.openingHours]);

  if (isLoading || !config?.name) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Carregando...</div>;

  return (
    <>
      <div className={`bg-zinc-50 dark:bg-zinc-950 min-h-screen text-zinc-900 dark:text-zinc-100 flex flex-col relative transition-all duration-700 ${!isOpen ? 'grayscale-[0.8]' : ''}`} style={{ fontFamily: config.font }}>
          {!isOpen && (
            <div className="absolute top-20 left-0 right-0 z-[45] flex justify-center pointer-events-none px-4">
              <div className="bg-red-500 text-white px-6 py-2 rounded-full font-black uppercase tracking-[0.2em] shadow-2xl animate-bounce text-xs">Loja Fechada</div>
            </div>
          )}

          <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800 shadow-sm h-16 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black bg-cover bg-center overflow-hidden" style={{ backgroundColor: config.primaryColor, backgroundImage: config.logoUrl ? `url(${config.logoUrl})` : 'none' }}>
                {!config.logoUrl && config.name.charAt(0)}
              </div>
              <div>
                <h1 className="font-black italic uppercase text-lg leading-none" style={{ color: config.primaryColor }}>{config.name}</h1>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isOpen ? 'text-emerald-500' : 'text-red-500'}`}>{isOpen ? 'Aberto' : 'Fechado'}</span>
              </div>
            </div>
            <button onClick={() => setCartOpen(true)} className="relative text-white p-2.5 rounded-xl transition-all shadow-md active:scale-90" style={{ backgroundColor: config.primaryColor }}>
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-bold">{cartCount}</span>}
            </button>
          </header>

          <main className="flex-1 max-w-6xl mx-auto w-full pb-24">

            {/* BANNERS */}
            {(() => {
              const now = Date.now();
              const activeBanners = banners.filter(b => b.active && (!b.expiresAt || new Date(b.expiresAt).getTime() > now));
              if (!activeBanners.length) return null;
              return (
                <div className="flex flex-col gap-3 px-4 pt-4">
                  {activeBanners.map(b => {
                    const TYPE_BG: Record<string, string> = { promo: 'from-emerald-600 to-emerald-800', sorteio: 'from-purple-600 to-purple-900', aviso: 'from-amber-500 to-orange-700' };
                    const TYPE_LABEL: Record<string, string> = { promo: '🔥 PROMOÇÃO', sorteio: '🎰 SORTEIO', aviso: '📢 AVISO' };
                    return (
                      <div key={b.id} className={`rounded-2xl overflow-hidden bg-gradient-to-r ${TYPE_BG[b.type]} text-white shadow-xl`}>
                        {b.imageUrl && <img src={b.imageUrl} alt={b.title} className="w-full max-h-48 object-cover" />}
                        <div className="p-4">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{TYPE_LABEL[b.type]}</span>
                          <h3 className="font-black text-xl mt-0.5">{b.title}</h3>
                          {b.description && <p className="text-sm opacity-90 mt-1">{b.description}</p>}
                          {b.expiresAt && <BannerCountdown expiresAt={b.expiresAt} />}
                          {b.link && (
                            <a href={b.link} target="_blank" rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-black transition-all">
                              Ver mais →
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <section className="px-4 py-10 flex flex-col items-center text-center gap-6">
              <h2 className="text-4xl md:text-6xl font-black italic uppercase leading-none">{config.slogan || 'Qualidade e Confiança'}</h2>
              <div className="w-full max-w-md relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                <input type="text" placeholder="Buscar produtos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-4 transition-all" style={{ '--tw-ring-color': `${config.primaryColor}20` } as React.CSSProperties} />
              </div>
            </section>

            <section className="sticky top-16 z-40 bg-zinc-50/80 dark:bg-zinc-950/80 backdrop-blur-xl py-4 border-b border-zinc-200 flex gap-3 px-4 overflow-x-auto hide-scrollbar">
              {allCategories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`h-10 px-6 rounded-full font-bold uppercase text-[10px] tracking-widest border transition-all whitespace-nowrap flex-shrink-0 flex items-center justify-center ${activeCategory === cat ? 'text-white border-transparent shadow-lg' : 'bg-white text-zinc-500'}`}
                  style={activeCategory === cat ? { backgroundColor: config.primaryColor } : {}}>
                  {cat}
                </button>
              ))}
            </section>

            <section className="px-4 mt-8 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {filteredProducts.map(p => {
                const pr = getPromoPrice(p.id, p.price);
                return p.externalUrl ? (
                    /* ── CARD VITRINE (link externo) ── */
                    <a
                      key={p.id}
                      href={p.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col group hover:shadow-lg transition-all duration-200"
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <img src={p.imageUrl || '/placeholder.png'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                          <ExternalLink className="w-2.5 h-2.5" /> Ver
                        </div>
                        {pr && <div className="absolute top-2 left-2 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">Oferta</div>}
                      </div>
                      <div className="p-3 flex-1 flex flex-col">
                        <h3 className="font-black text-sm uppercase leading-tight line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">{p.name}</h3>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex flex-col">
                            {p.price > 0 && (pr
                              ? <><span className="text-[10px] text-zinc-400 line-through leading-none">{formatCurrency(p.price)}</span><span className="text-sm sm:text-lg font-black leading-none" style={{ color: config.primaryColor }}>{formatCurrency(pr)}</span></>
                              : <span className="text-sm sm:text-lg font-black leading-none" style={{ color: config.primaryColor }}>{formatCurrency(p.price)}</span>
                            )}
                          </div>
                          <span className="text-[10px] font-black text-blue-500 uppercase tracking-wide">Acessar →</span>
                        </div>
                      </div>
                    </a>
                  ) : (
                    /* ── CARD NORMAL (carrinho) ── */
                    <div key={p.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
                      <div onClick={() => setViewingProduct(p)} className="cursor-pointer aspect-square relative overflow-hidden">
                        <img src={p.imageUrl || '/placeholder.png'} className={`w-full h-full object-cover ${(p.stock ?? 0) <= 0 ? 'grayscale opacity-50' : ''}`} />
                        {pr && <div className="absolute top-2 left-2 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">Oferta</div>}
                      </div>
                      <div className="p-3 flex-1 flex flex-col">
                        <h3 onClick={() => setViewingProduct(p)} className="font-black text-sm uppercase leading-tight line-clamp-2 cursor-pointer mb-2">{p.name}</h3>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex flex-col">
                            {pr ? (<><span className="text-[10px] text-zinc-400 line-through leading-none">{formatCurrency(p.price)}</span><span className="text-sm sm:text-lg font-black leading-none" style={{ color: config.primaryColor }}>{formatCurrency(pr)}</span></>) : (<span className="text-sm sm:text-lg font-black leading-none" style={{ color: config.primaryColor }}>{formatCurrency(p.price)}</span>)}
                          </div>
                          <button onClick={() => addToCart(p)} disabled={(p.stock ?? 0) <= 0 || !isOpen} className="w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-lg active:scale-90 disabled:grayscale" style={{ backgroundColor: config.primaryColor }}><ShoppingCart className="w-5 h-5" /></button>
                        </div>
                      </div>
                    </div>
                );
              })}
            </section>
          </main>
          
          <footer className="bg-white dark:bg-zinc-900 py-12 px-4 text-center border-t">
            <h3 className="font-black italic text-xl mb-4" style={{ color: config.primaryColor }}>{config.name}</h3>
            <p className="text-xs text-zinc-500 italic mb-6">{config.slogan}</p>
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">{APP_VERSION}</div>
          </footer>

          {cartCount > 0 && (
            <div className="fixed bottom-6 left-4 right-4 sm:hidden z-50 animate-in slide-in-from-bottom-10">
              <button onClick={() => setCartOpen(true)} className="w-full h-14 text-white rounded-2xl shadow-2xl flex items-center justify-between px-6 font-black uppercase tracking-tight" style={{ backgroundColor: config.primaryColor }}>
                <span className="flex items-center gap-3"><ShoppingCart className="w-6 h-6" /> {cartCount} itens</span>
                <span>{formatCurrency(subtotal)}</span>
              </button>
            </div>
          )}
      </div>

      {/* FIXED OVERLAYS */}
      {config.informativeText && !infoClosed && (
        <div className="fixed top-20 left-4 right-4 md:left-10 md:right-auto md:w-80 z-[400] bg-zinc-950/95 backdrop-blur-3xl p-5 rounded-3xl border border-white/20 shadow-2xl animate-in slide-in-from-top-10">
          <button onClick={() => setInfoClosed(true)} className="absolute -top-2 -right-2 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-2xl border-2 border-zinc-100 active:scale-90"><X className="w-5 h-5" /></button>
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shrink-0 animate-bounce shadow-lg shadow-amber-500/40"><Megaphone className="w-5 h-5 text-white" /></div>
            <div className="flex-1 min-w-0">
               <span className="text-[10px] font-black uppercase text-amber-500 tracking-[0.2em] block mb-1">Aviso</span>
               <p className="text-white text-sm font-bold leading-tight">{config.informativeText}</p>
            </div>
          </div>
        </div>
      )}

      {promoPopupOpen && initialPromo && (
        <div className="fixed inset-0 z-[450] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in" onClick={() => setPromoPopupOpen(false)}>
           <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-md overflow-hidden relative shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
              <button onClick={() => setPromoPopupOpen(false)} className="absolute top-6 right-6 w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center active:scale-75 transition-all"><X className="w-6 h-6" /></button>
              <div className="p-10 text-center space-y-8">
                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900 rounded-3xl flex items-center justify-center mx-auto animate-bounce"><Tag className="w-12 h-12 text-emerald-500" /></div>
                <div><h2 className="text-4xl font-black italic uppercase tracking-tighter leading-tight">{initialPromo.title}</h2><p className="text-zinc-500 font-bold mt-2 text-lg">{initialPromo.description}</p></div>
                <div className="bg-emerald-500 p-8 rounded-[2rem] shadow-xl shadow-emerald-500/30 text-white"><span className="text-6xl font-black">{initialPromo.discountPercent}% OFF</span></div>
                <button onClick={() => setPromoPopupOpen(false)} className="w-full h-16 rounded-2xl text-white font-black uppercase text-xl transition-all hover:opacity-90 active:scale-95" style={{ backgroundColor: config.primaryColor }}>Ver Ofertas</button>
              </div>
           </div>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-[400] flex justify-end" onClick={() => setCartOpen(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" />
          <div className="relative w-full max-w-md h-full bg-white dark:bg-zinc-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between"><h2 className="text-xl font-black italic uppercase"><ShoppingCart className="w-5 h-5 inline mr-2" /> Carrinho</h2><button onClick={() => setCartOpen(false)} className="p-2"><X className="w-5 h-5" /></button></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.map(item => (
                <div key={item.product.id} className="flex gap-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 border border-zinc-100">
                  <img src={item.product.imageUrl || '/placeholder.png'} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-sm uppercase tracking-tight truncate">{item.product.name}</h4>
                    <p className="font-black text-base mt-1" style={{ color: config.primaryColor }}>{formatCurrency(getPromoPrice(item.product.id, item.product.price) ?? item.product.price)}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <button onClick={() => updateQuantity(item.product.id, -1)} className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center active:scale-90"><Minus className="w-4 h-4" /></button>
                      <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white active:scale-90" style={{ backgroundColor: config.primaryColor }}><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.product.id)} className="text-zinc-400 self-start"><Trash2 className="w-5 h-5" /></button>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="p-6 border-t space-y-4 bg-zinc-50 dark:bg-zinc-900">
                <div className="flex justify-between items-center"><span className="text-zinc-500 font-bold uppercase text-xs">Total</span><span className="text-2xl font-black italic">{formatCurrency(subtotal)}</span></div>
                <button onClick={() => { setCartOpen(false); setCheckoutOpen(true); }} className="w-full h-16 text-white rounded-2xl font-black uppercase text-lg shadow-xl" style={{ backgroundColor: config.primaryColor }}>Finalizar Pedido</button>
              </div>
            )}
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-in fade-in" onClick={() => setCheckoutOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-md max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 p-8 space-y-6" onClick={e => e.stopPropagation()}>
            {orderSent ? (
                <div className="p-16 text-center space-y-6"><h3 className="text-3xl font-black italic uppercase leading-tight">Enviado!</h3><p className="text-zinc-500 font-medium">Seu pedido foi realizado.</p></div>
             ) : (
                <>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">Finalizar</h2>
                  <div className="space-y-4">
                    <input value={custName} onChange={e => setCustName(e.target.value)} placeholder="Seu Nome Completo" className="w-full h-12 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 font-bold outline-none border border-zinc-200 dark:border-zinc-700 focus:ring-2 ring-primary-500 transition-all text-sm" />
                    <input value={custWhatsapp?.startsWith('+55') ? custWhatsapp : '+55 ' + (custWhatsapp || '')} onChange={e => { let v = e.target.value; if (!v.startsWith('+55 ')) v = '+55 ' + v.replace(/^\+?55\s*/, ''); setCustWhatsapp(v); }} placeholder="Seu WhatsApp (com DDD)" className="w-full h-12 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 font-bold outline-none border border-zinc-200 dark:border-zinc-700 focus:ring-2 ring-primary-500 transition-all text-sm" />
                    
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Local de Entrega</p>
                      
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 p-1 rounded-xl flex items-center mb-3">
                        <input value={custAddress} onChange={e => setCustAddress(e.target.value)} placeholder="Digite o endereço completo" className="h-10 bg-transparent flex-1 px-3 font-bold outline-none text-sm text-zinc-900 dark:text-white" />
                      </div>
                      
                      <Button variant="outline" onClick={handleDetectLocation} disabled={locating} className="w-full h-12 rounded-xl border-dashed border-2 mb-3">
                        <Navigation className={`w-4 h-4 mr-2 ${locating ? 'animate-spin' : ''}`} /> 
                        {locating ? 'Obtendo localização...' : 'Usar minha localização atual GPS'}
                      </Button>
                      
                      <div className="rounded-xl overflow-hidden border-2 border-primary-500/20 shadow-inner">
                        <MapPicker lat={custLat} lng={custLng} onChange={handleMapChange} />
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-2 text-center italic">Arraste o mapa para marcar o local exato da obra/entrega.</p>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Forma de Pagamento</p>
                      <select value={paymentMethod} onChange={(e: any) => setPaymentMethod(e.target.value)} className="w-full h-12 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 font-bold outline-none border border-zinc-200 dark:border-zinc-700 focus:ring-2 ring-primary-500 transition-all text-sm appearance-none">
                        <option value="pix">PIX</option>
                        <option value="dinheiro">Dinheiro vivo</option>
                        <option value="cartao_credito">Cartão de Crédito</option>
                        <option value="cartao_debito">Cartão de Débito</option>
                      </select>
                      
                      {paymentMethod === 'dinheiro' && (
                         <div className="mt-3 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 animate-in fade-in slide-in-from-top-2">
                           <p className="text-xs font-bold text-zinc-500 mb-2">Precisa de troco para quanto?</p>
                           <input type="number" placeholder="Ex: 50" value={changeFor} onChange={e => setChangeFor(e.target.value)} className="w-full h-10 bg-white dark:bg-zinc-900 rounded-lg px-3 font-bold outline-none border border-zinc-200 dark:border-zinc-700 focus:ring-2 ring-primary-500 text-sm" />
                         </div>
                      )}
                      
                      {paymentMethod === 'pix' && config.pixKey && (
                        <div className="mt-3 bg-primary-50 dark:bg-primary-900/10 p-4 rounded-xl border border-primary-200 dark:border-primary-900/30 animate-in fade-in slide-in-from-top-2">
                          <p className="text-xs font-bold text-primary-600 dark:text-primary-400 mb-1">Chave PIX da Loja:</p>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-zinc-900 dark:text-white select-all bg-white dark:bg-zinc-900 px-2 py-1 rounded inline-block">{config.pixKey}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                    <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-2xl space-y-2 border shadow-inner">
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-xl font-black italic uppercase">Subtotal</span>
                        <span className="text-3xl font-black italic" style={{ color: config.primaryColor }}>{formatCurrency(total)}</span>
                      </div>
                      <p className="text-xs text-zinc-400 italic">Frete a combinar pelo WhatsApp</p>
                    </div>
                  <button onClick={handleSendOrder} className="w-full h-16 text-white rounded-2xl font-black uppercase text-xl shadow-2xl flex items-center justify-center gap-3" style={{ backgroundColor: config.primaryColor }}>Confirmar Pedido <Send className="w-5 h-5" /></button>
                </>
             )}
          </div>
        </div>
      )}

      {viewingProduct && (
        <div className="fixed inset-0 z-[450] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in" onClick={() => setViewingProduct(null)}>
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-lg overflow-hidden relative shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewingProduct(null)} className="absolute top-6 right-6 w-12 h-12 bg-black/20 text-white rounded-full flex items-center justify-center backdrop-blur-md z-10"><X className="w-7 h-7" /></button>
            <ProductMediaCarousel product={viewingProduct} />
            <div className="p-8">
              <span className="text-[10px] font-black uppercase text-zinc-400">{viewingProduct.category}</span>
              <h2 className="text-3xl font-black italic uppercase mt-1">{viewingProduct.name}</h2>
              {viewingProduct.description && (
                <p className="text-zinc-500 font-bold mt-4 italic whitespace-pre-wrap">{viewingProduct.description}</p>
              )}
              <div className="flex items-center justify-between py-6 my-6 border-y">
                {viewingProduct.price > 0 && <span className="text-4xl font-black italic" style={{ color: config.primaryColor }}>{formatCurrency(getPromoPrice(viewingProduct.id, viewingProduct.price) ?? viewingProduct.price)}</span>}
                {!viewingProduct.externalUrl && <span className={`text-xs font-black uppercase ${(viewingProduct.stock ?? 0) <= 0 ? 'text-red-500' : 'text-emerald-500'}`}>{(viewingProduct.stock ?? 0) <= 0 ? 'Esgotado' : `${viewingProduct.stock} un.`}</span>}
              </div>
              {viewingProduct.externalUrl ? (
                <a href={viewingProduct.externalUrl} target="_blank" rel="noopener noreferrer" className="w-full h-16 rounded-2xl text-white font-black uppercase text-xl shadow-2xl flex items-center justify-center gap-3" style={{ backgroundColor: config.primaryColor }}>
                  <ExternalLink className="w-6 h-6" /> Ver no Site
                </a>
              ) : (
                <button onClick={() => { addToCart(viewingProduct); setViewingProduct(null); }} disabled={(viewingProduct.stock ?? 0) <= 0 || !isOpen} className="w-full h-16 rounded-2xl text-white font-black uppercase text-xl shadow-2xl disabled:grayscale" style={{ backgroundColor: config.primaryColor }}>{!isOpen ? 'Loja Fechada' : 'Adicionar ao Carrinho'}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showInstallBanner && (
        <div className="fixed bottom-32 left-4 right-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 z-[400] flex items-center justify-between animate-in slide-in-from-bottom-10 md:hidden">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg bg-cover bg-center overflow-hidden" style={{ backgroundColor: config.primaryColor, backgroundImage: config.logoUrl ? `url(${config.logoUrl})` : 'none' }}>
              {!config.logoUrl && <Download className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight">Instalar Aplicativo</p>
              <p className="text-[10px] text-zinc-500 font-bold">Acesse mais rápido e offline</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowInstallBanner(false)} className="px-3 py-2 text-xs font-bold text-zinc-400">Agora não</button>
            <button onClick={handleInstallClick} className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-90">Instalar</button>
          </div>
        </div>
      )}

      {/* DRAGGABLE WHATSAPP FIXED BTN */}
      <a
        href={`https://wa.me/${config.whatsapp?.replace(/\D/g, '')}`}
        target="_blank" rel="noreferrer"
        onClick={(e) => { if (isDraggingWa) e.preventDefault(); }}
        onPointerDown={handleWaPointerDown}
        onPointerMove={handleWaPointerMove}
        onPointerUp={handleWaPointerUp}
        style={{ transform: `translate(${waPos.x}px, ${waPos.y}px)`, touchAction: 'none' }}
        className="fixed bottom-24 right-6 w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-xl z-[400] border-4 border-white dark:border-zinc-900 cursor-grab active:cursor-grabbing"
      >
        <Phone className="w-8 h-8 pointer-events-none" />
      </a>

      {/* INSTAGRAM FIXED BTN */}
      {config.instagram && (
        <a
          href={config.instagram.startsWith('http') ? config.instagram : `https://instagram.com/${config.instagram.replace('@','')}`}
          target="_blank" rel="noreferrer"
          onClick={(e) => { if (isDraggingIg) e.preventDefault(); }}
          onPointerDown={handleIgPointerDown}
          onPointerMove={handleIgPointerMove}
          onPointerUp={handleIgPointerUp}
          style={{ transform: `translate(${igPos.x}px, ${igPos.y}px)`, touchAction: 'none', background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}
          className="fixed bottom-44 right-6 w-14 h-14 text-white rounded-full flex items-center justify-center shadow-xl z-[400] border-4 border-white dark:border-zinc-900 cursor-grab active:cursor-grabbing"
        >
          <Instagram className="w-7 h-7 pointer-events-none" />
        </a>
      )}
    </>
  );
}
