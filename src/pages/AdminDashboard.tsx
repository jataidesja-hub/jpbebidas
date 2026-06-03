import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/StoreContext";
import { Product, Category, Promotion, Banner } from "@/types";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import {
  Package, LayoutGrid, Settings, BarChart, Megaphone, Search,
  MapPin, Plus, Save, LogOut, Trash2, Edit, X, Upload, Image as ImageIcon,
  Palette, Type, Phone, Store, ClipboardList, Map, Send, Link as LinkIcon, Eye,
  Printer, Radio, Clock, ExternalLink, Globe, Loader2, Smartphone
} from "lucide-react";


import { MapPicker } from "@/components/MapPicker";

const AVAILABLE_FONTS = ['Inter', 'Roboto', 'Poppins', 'Outfit', 'Montserrat', 'Playfair Display', 'Oswald', 'Raleway'];

/* ─── MODAL WRAPPER ─── */
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xl font-black italic text-zinc-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function InputField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
      <input {...props} className="w-full h-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 outline-none focus:ring-2 ring-primary-500 transition-all text-zinc-900 dark:text-white" />
    </div>
  );
}

function TextArea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
      <textarea {...props} className="w-full h-24 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 outline-none focus:ring-2 ring-primary-500 transition-all resize-none text-zinc-900 dark:text-white" />
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { config, isLoading, realtimeStatus } = useStore();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showMoreMenu, setShowMoreMenu] = useState(false);


  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  useEffect(() => {
    const isAuth = localStorage.getItem("admin_auth");
    if (!isAuth) {
      navigate("/admin");
    } else {
      setIsAuthChecking(false);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    navigate("/admin");
  };

  if (isAuthChecking) return null;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart },
    { id: 'pedidos', label: 'Pedidos', icon: ClipboardList },
    { id: 'produtos', label: 'Produtos', icon: Package },
    { id: 'categorias', label: 'Categorias', icon: LayoutGrid },
    { id: 'promocoes', label: 'Promoções', icon: Megaphone },
    { id: 'banners', label: 'Banners/Sorteios', icon: Radio },
    { id: 'config', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* SIDEBAR — desktop only */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-6 flex-col shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: config.primaryColor }}>
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest text-xs">Painel de</h2>
            <h2 className="font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest text-sm">Administração</h2>
          </div>
        </div>
        <nav className="flex-1 space-y-1.5">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id ? 'text-white shadow-lg' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              style={activeTab === tab.id ? { backgroundColor: config.primaryColor } : {}}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
        <Button variant="ghost" onClick={handleLogout} className="mt-auto text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 justify-start">
          <LogOut className="w-5 h-5 mr-3" /> Sair
        </Button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 lg:p-8 overflow-auto relative pb-24 lg:pb-8">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center">
             <div className="flex flex-col items-center gap-4">
               <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="font-bold text-zinc-600 dark:text-zinc-400 animate-pulse">Carregando dados...</p>
             </div>
          </div>
        )}

        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-white capitalize italic">
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-zinc-400 hidden lg:block">Gerenciamento completo da sua loja</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${realtimeStatus === 'SUBSCRIBED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 animate-pulse'}`}>
              <Radio className={`w-3 h-3 ${realtimeStatus === 'SUBSCRIBED' ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{realtimeStatus === 'SUBSCRIBED' ? 'Online' : 'Offline'}</span>
            </div>
            <button onClick={() => window.open('/', '_blank')} className="p-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl transition-all" title="Ver Loja">
              <Eye className="w-5 h-5" />
            </button>
            {installPrompt && (
              <button onClick={handleInstall} className="flex items-center gap-1.5 px-3 py-2 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all" style={{ backgroundColor: config.primaryColor }}>
                <Smartphone className="w-4 h-4" /> <span className="hidden sm:inline">Instalar ADM</span>
              </button>
            )}
            <button onClick={handleLogout} className="lg:hidden p-2.5 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-xl transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'pedidos' && <OrdersTab />}
        {activeTab === 'produtos' && <ProductsTab />}
        {activeTab === 'categorias' && <CategoriesTab />}
        {activeTab === 'promocoes' && <PromotionsTab />}
        {activeTab === 'banners' && <BannersTab />}
        {activeTab === 'config' && <ConfigTab />}
      </main>

      {/* BOTTOM NAV — mobile only */}
      {showMoreMenu && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)}>
          <div className="absolute bottom-16 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4 grid grid-cols-3 gap-3" onClick={e => e.stopPropagation()}>
            {tabs.slice(4).map((tab) => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setShowMoreMenu(false); }}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${activeTab === tab.id ? 'text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                style={activeTab === tab.id ? { backgroundColor: config.primaryColor, color: 'white' } : {}}
              >
                <tab.icon className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase text-center leading-tight">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-stretch h-16">
        {tabs.slice(0, 4).map((tab) => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setShowMoreMenu(false); }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${activeTab === tab.id ? '' : 'text-zinc-400'}`}
            style={activeTab === tab.id ? { color: config.primaryColor } : {}}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase leading-none">{tab.label.split('/')[0]}</span>
          </button>
        ))}
        <button onClick={() => setShowMoreMenu(v => !v)}
          className={`flex flex-col items-center justify-center gap-1 flex-1 transition-all ${showMoreMenu || tabs.slice(4).some(t => t.id === activeTab) ? '' : 'text-zinc-400'}`}
          style={showMoreMenu || tabs.slice(4).some(t => t.id === activeTab) ? { color: config.primaryColor } : {}}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase leading-none">Mais</span>
        </button>
      </nav>
    </div>
  );
}

/* ═══════════════════════ OG FETCH HELPER ═══════════════════════ */
async function fetchOGData(url: string) {
  // 1ª tentativa: Microlink API — resolve links encurtados (meli.la, etc.),
  //   segue redirecionamentos e extrai metadados estruturados sem precisar de key.
  try {
    const mlRes = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=false&pdf=false`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (mlRes.ok) {
      const ml = await mlRes.json();
      if (ml.status === 'success') {
        const d = ml.data;
        const image = d.image?.url ?? d.logo?.url ?? null;
        // Microlink não retorna preço — tentamos extraí-lo da descrição/título como fallback
        const priceMatch = (d.description ?? d.title ?? '').match(/R\$\s*([\d.,]+)/);
        const price = priceMatch ? parseFloat(priceMatch[1].replace('.', '').replace(',', '.')) : null;
        return {
          title: d.title ?? null,
          description: d.description ?? null,
          image,
          price,
          resolvedUrl: d.url ?? url, // URL real após redirecionamento
        };
      }
    }
  } catch { /* cai no fallback */ }

  // 2ª tentativa: proxies CORS (funciona para URLs diretas sem redirecionamento)
  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  ];

  let html = '';
  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) continue;
      const raw = await res.text();
      try { const j = JSON.parse(raw); html = j.contents ?? j.body ?? raw; } catch { html = raw; }
      if (html.length > 500) break;
    } catch { continue; }
  }

  if (!html) throw new Error('Não foi possível acessar a URL. Verifique o link e tente novamente.');

  const getMeta = (attrVal: string) => {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${attrVal}["'][^>]+content=["']([^"']+)["']` +
      `|<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${attrVal}["']`,
      'i'
    );
    const m = html.match(re);
    return m ? (m[1] ?? m[2]) : null;
  };

  const og = (p: string) => getMeta(`og:${p}`);

  // Preço via JSON-LD
  let price: number | null = null;
  const ldBlocks = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of ldBlocks) {
    try {
      const json = JSON.parse(block.replace(/<\/?script[^>]*>/gi, '').trim());
      const entries = Array.isArray(json) ? json : [json];
      for (const entry of entries) {
        const offers = entry?.offers ?? entry?.Offers;
        const raw = offers?.price ?? offers?.lowPrice ?? entry?.price;
        if (raw) { price = parseFloat(String(raw).replace(',', '.')); break; }
      }
    } catch { /* ignora */ }
    if (price) break;
  }

  if (!price) {
    const rawMeta = og('price:amount') ?? og('product:price:amount') ?? getMeta('product:price:amount');
    if (rawMeta) price = parseFloat(rawMeta.replace(/[^0-9.,]/g, '').replace(',', '.')) || null;
  }

  return {
    title: og('title') ?? null,
    description: og('description') ?? null,
    image: og('image') ?? null,
    price,
    resolvedUrl: null,
  };
}

/* ═══════════════════════ PRODUCTS TAB ═══════════════════════ */
function ProductsTab() {
  const { products, categories, config, addProduct, updateProduct, deleteProduct, uploadImage, isSaving } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '', category: '', imageUrl: '', externalUrl: '', mediaUrls: [] as string[] });
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryFileRef = useRef<HTMLInputElement>(null);
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [fetchingOG, setFetchingOG] = useState(false);

  const selectedCategory = categories.find(c => c.name === form.category);
  const isExternal = selectedCategory?.isExternalLinks ?? false;

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchFilter.toLowerCase());
        const matchCategory = activeCategory === 'Todas' || p.category === activeCategory;
        return matchSearch && matchCategory;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, searchFilter, activeCategory]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', stock: '', category: categories[0]?.name || '', imageUrl: '', externalUrl: '', mediaUrls: [] });
    setImagePreviewError(false);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      price: p.price.toString(),
      stock: p.stock?.toString() || '',
      category: p.category,
      imageUrl: p.imageUrl || '',
      externalUrl: p.externalUrl || '',
      mediaUrls: p.mediaUrls || []
    });
    setImagePreviewError(false);
    setModalOpen(true);
  };

  const handleFetchOG = async () => {
    if (!form.externalUrl) return alert('Cole o link do produto primeiro!');
    setFetchingOG(true);
    try {
      const data = await fetchOGData(form.externalUrl);
      setForm(f => ({
        ...f,
        name: data.title || f.name,
        description: data.description || f.description,
        imageUrl: data.image || f.imageUrl,
        price: data.price ? data.price.toFixed(2) : f.price,
        // Atualiza para a URL real caso o link fosse encurtado (meli.la, etc.)
        externalUrl: data.resolvedUrl || f.externalUrl,
      }));
      setImagePreviewError(false);
    } catch (e: any) {
      alert(e?.message || 'Não foi possível buscar os dados automaticamente. Preencha manualmente.');
    } finally {
      setFetchingOG(false);
    }
  };

  const handleSave = () => {
    if (!form.name || !form.price) return alert('Preencha nome e preço!');
    if (isExternal && !form.externalUrl) return alert('Cole o link do produto externo!');
    const data = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      stock: parseFloat(form.stock) || 0,
      category: form.category,
      imageUrl: form.mediaUrls[0] || '',
      mediaUrls: form.mediaUrls,
      externalUrl: isExternal ? form.externalUrl.trim() : undefined,
    };
    if (editing) {
      updateProduct({ ...editing, ...data });
    } else {
      addProduct(data);
    }
    setModalOpen(false);
  };

  return (
    <>
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar produto por nome..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full h-11 pl-10 pr-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 ring-primary-500 text-sm text-zinc-900 dark:text-white"
            />
          </div>
          <Button onClick={openNew} className="rounded-xl ml-4 h-11 shadow-lg shadow-primary-500/20"><Plus className="w-5 h-5 mr-2" /> Novo Produto</Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {['Todas', ...categories.map(c => c.name)].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                activeCategory === cat 
                  ? 'text-white border-transparent shadow-md' 
                  : 'bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300'
              }`}
              style={activeCategory === cat ? { backgroundColor: config.primaryColor } : {}}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead>
            <tr className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">
              <th className="p-4">Foto</th>
              <th className="p-4">Produto</th>
              <th className="p-4">Venda</th>
              <th className="p-4">Estoque</th>
              <th className="p-4">Categoria</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredProducts.map(p => (
              <tr key={p.id} className="text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="p-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 m-3 text-zinc-400" />}
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-semibold">{p.name}</div>
                  {p.description && <div className="text-xs text-zinc-400 truncate max-w-[200px]">{p.description}</div>}
                </td>
                <td className="p-4 font-bold" style={{ color: 'var(--primary-500, #0284c7)' }}>R$ {p.price.toFixed(2)}</td>
                <td className="p-4 italic font-medium">{p.stock || 0} un</td>
                <td className="p-4">
                  <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                    {p.externalUrl && <Globe className="w-3 h-3 text-blue-500" />}
                    {p.category}
                  </span>
                </td>
                <td className="p-4 text-right space-x-1">
                  {p.externalUrl && (
                    <a href={p.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex p-2 text-zinc-400 hover:text-blue-500 transition-colors" title="Abrir link externo"><ExternalLink className="w-5 h-5" /></a>
                  )}
                  <button onClick={() => openEdit(p)} className="p-2 text-zinc-400 hover:text-blue-500 transition-colors" title="Editar produto"><Edit className="w-5 h-5" /></button>
                  <button onClick={() => { if (confirm('Excluir este produto?')) deleteProduct(p.id); }} className="p-2 text-zinc-400 hover:text-red-500 transition-colors" title="Excluir produto"><Trash2 className="w-5 h-5" /></button>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr><td colSpan={6} className="p-12 text-center text-zinc-400">{searchFilter ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Produto' : 'Novo Produto'}>
        <div className="space-y-4">

          {/* EXTERNAL LINK SECTION */}
          {isExternal && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest">Link do Produto Externo</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={form.externalUrl}
                  onChange={e => setForm(f => ({ ...f, externalUrl: e.target.value }))}
                  placeholder="https://www.mercadolivre.com.br/produto..."
                  className="flex-1 h-11 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 rounded-xl px-3 outline-none focus:ring-2 ring-blue-400 text-sm text-zinc-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleFetchOG}
                  disabled={fetchingOG || !form.externalUrl}
                  className="flex-shrink-0 h-11 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
                  title="Buscar imagem e preço automaticamente"
                >
                  {fetchingOG ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {fetchingOG ? 'Buscando...' : 'Auto-preencher'}
                </button>
              </div>
              <p className="text-[10px] text-blue-500">Cole o link e clique em "Auto-preencher" para buscar imagem e preço automaticamente.</p>
            </div>
          )}

          <InputField label="Nome" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Lâmpada LED 9W" />
          <TextArea label="Descrição" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreva o produto..." />

          <div className={`grid gap-4 ${isExternal ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <InputField label="Preço (R$)" type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
            {!isExternal && (
              <div className="flex gap-4 items-center">
                <InputField label="Estoque Atual" type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
                <div className="flex items-center gap-2 mt-6">
                  <input type="checkbox" id="stockToggle" checked={Number(form.stock) > 0 || form.stock === ''} onChange={e => setForm(f => ({ ...f, stock: e.target.checked ? '999' : '0' }))} className="w-5 h-5" />
                  <label htmlFor="stockToggle" className="font-bold text-sm">Disponível?</label>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Categoria</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full h-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 outline-none focus:ring-2 ring-primary-500 text-zinc-900 dark:text-white">
              {categories.map(c => <option key={c.id} value={c.name}>{c.isExternalLinks ? '🌐 ' : ''}{c.name}</option>)}
            </select>
          </div>

          {/* GALLERY */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" /> Galeria de Fotos/Vídeos
              <span className="text-zinc-400 font-normal normal-case tracking-normal">(opcional, até 10)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {form.mediaUrls.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 group">
                  {url.match(/\.(mp4|mov|webm)/i)
                    ? <video src={url} className="w-full h-full object-cover" />
                    : url.includes('youtube') || url.includes('youtu.be')
                    ? <div className="w-full h-full flex items-center justify-center"><ExternalLink className="w-6 h-6 text-red-500" /></div>
                    : <img src={url} className="w-full h-full object-cover" />}
                  <button onClick={() => setForm(f => ({ ...f, mediaUrls: f.mediaUrls.filter((_, j) => j !== i) }))}
                    className="absolute top-1 right-1 w-6 h-6 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {form.mediaUrls.length < 10 && (
                <button onClick={() => galleryFileRef.current?.click()} disabled={galleryUploading}
                  className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-zinc-600 hover:border-zinc-400 transition-all">
                  {galleryUploading ? <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /> : <Plus className="w-6 h-6" />}
                  <span className="text-[10px] font-bold">{galleryUploading ? 'Enviando...' : 'Adicionar'}</span>
                </button>
              )}
            </div>
            <input type="file" ref={galleryFileRef} className="hidden" accept="image/*,video/*" capture="environment"
              onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                setGalleryUploading(true);
                try { const url = await uploadImage(file); setForm(f => ({ ...f, mediaUrls: [...f.mediaUrls, url] })); }
                catch { alert('Erro ao subir mídia'); } finally { setGalleryUploading(false); e.target.value = ''; }
              }} />
            <input type="url" placeholder="Ou cole URL de imagem/vídeo/YouTube..."
              className="w-full h-10 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 outline-none focus:ring-2 ring-primary-500 text-sm text-zinc-900 dark:text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val && form.mediaUrls.length < 10) { setForm(f => ({ ...f, mediaUrls: [...f.mediaUrls, val] })); (e.target as HTMLInputElement).value = ''; }
                }
              }} />
            <p className="text-[10px] text-zinc-400">Cole a URL e pressione Enter para adicionar</p>
          </div>

          <Button onClick={handleSave} className="w-full h-12 rounded-xl mt-4">
            <Save className="w-5 h-5 mr-2" /> {editing ? 'Salvar Alterações' : 'Cadastrar Produto'}
          </Button>
        </div>
      </Modal>
    </>
  );
}

/* ═══════════════════════ CATEGORIES TAB ═══════════════════════ */
function CategoriesTab() {
  const { categories, addCategory, deleteCategory } = useStore();
  const [name, setName] = useState('');
  const [isExternalLinks, setIsExternalLinks] = useState(false);

  const handleAdd = () => {
    if (!name.trim()) return alert('Digite o nome da categoria!');
    addCategory({ name: name.trim(), isExternalLinks });
    setName('');
    setIsExternalLinks(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-6">
        <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Nova Categoria</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-3">
            <InputField label="Nome da Categoria" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Fios e Cabos" />
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div
                onClick={() => setIsExternalLinks(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${isExternalLinks ? 'bg-primary-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                style={isExternalLinks ? { backgroundColor: 'var(--primary-500, #0284c7)' } : {}}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isExternalLinks ? 'translate-x-5' : ''}`} />
              </div>
              <div>
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-500" /> Vitrine de Links Externos
                </span>
                <p className="text-xs text-zinc-400 mt-0.5">Produtos com link para Mercado Livre, Shopee, Amazon, etc.</p>
              </div>
            </label>
          </div>
          <Button onClick={handleAdd} className="h-12 rounded-xl self-end"><Plus className="w-5 h-5 mr-2" /> Adicionar</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map(c => (
          <div key={c.id} className={`bg-white dark:bg-zinc-900 rounded-2xl border p-5 flex items-center justify-between group hover:shadow-md transition-all ${c.isExternalLinks ? 'border-blue-200 dark:border-blue-900' : 'border-zinc-100 dark:border-zinc-800'}`}>
            <div className="flex items-center gap-2">
              {c.isExternalLinks && <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />}
              <div>
                <span className="font-bold text-zinc-900 dark:text-white">{c.name}</span>
                {c.isExternalLinks && <p className="text-[10px] text-blue-500 font-semibold">Links externos</p>}
              </div>
            </div>
            <button onClick={() => { if (confirm(`Excluir categoria "${c.name}"?`)) deleteCategory(c.id); }}
              className="p-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════ PROMOTIONS TAB ═══════════════════════ */
function PromotionsTab() {
  const { promotions, products, addPromotion, deletePromotion, updatePromotion } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', discountPercent: '10', productIds: [] as string[], expiresAt: '', showOnStart: false });

  const handleSave = () => {
    if (!form.title) return alert('Preencha o título!');
    addPromotion({ 
      title: form.title, 
      description: form.description, 
      discountPercent: parseInt(form.discountPercent), 
      productIds: form.productIds, 
      active: true,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      showOnStart: form.showOnStart
    });
    setModalOpen(false);
    setForm({ title: '', description: '', discountPercent: '10', productIds: [], expiresAt: '', showOnStart: false });
  };


  const toggleProduct = (id: string) => {
    setForm(f => ({ ...f, productIds: f.productIds.includes(id) ? f.productIds.filter(x => x !== id) : [...f.productIds, id] }));
  };

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button onClick={() => setModalOpen(true)} className="rounded-xl"><Plus className="w-5 h-5 mr-2" /> Nova Promoção</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promotions.map(p => (
          <div key={p.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{p.title}</h3>
                <p className="text-sm text-zinc-500">{p.description}</p>
                {p.expiresAt && (
                  <p className="text-xs font-bold text-orange-500 mt-1">Expira: {new Date(p.expiresAt).toLocaleString()}</p>
                )}
              </div>
              <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-full text-sm font-bold">-{p.discountPercent}%</span>
            </div>
            <div className="flex gap-2 flex-wrap mb-4">
              {p.productIds.map(pid => {
                const prod = products.find(x => x.id === pid);
                return prod ? <span key={pid} className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-xs font-medium">{prod.name}</span> : null;
              })}
              {p.productIds.length === 0 && <span className="text-xs text-zinc-400">Todos os produtos</span>}
            </div>
            <div className="flex gap-2">
              <Button variant={p.active ? 'outline' : 'primary'} size="sm" onClick={() => updatePromotion({ ...p, active: !p.active })} className="rounded-lg">
                {p.active ? 'Desativar' : 'Ativar'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { if (confirm('Excluir promoção?')) deletePromotion(p.id); }} className="rounded-lg text-red-500 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {promotions.length === 0 && (
          <div className="col-span-2 text-center py-16 text-zinc-400">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-bold">Nenhuma promoção cadastrada</p>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova Promoção">
        <div className="space-y-4">
          <InputField label="Título" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Black Friday" />
          <TextArea label="Descrição" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhe a promoção..." />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Desconto (%)" type="number" value={form.discountPercent} onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))} placeholder="10" />
            <InputField label="Data Limite (Opcional)" type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} placeholder="" />
          </div>
          <label className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl cursor-pointer">
            <input type="checkbox" checked={form.showOnStart} onChange={e => setForm(f => ({ ...f, showOnStart: e.target.checked }))} className="w-5 h-5 rounded border-zinc-300 dark:border-zinc-700 text-primary-600 focus:ring-primary-500" />
            <div className="flex-1">
              <p className="text-sm font-bold text-zinc-900 dark:text-white">Destaque na Inicialização</p>
              <p className="text-[10px] text-zinc-500">Mostrar esta promoção em um popup quando o cliente abrir o app.</p>
            </div>
          </label>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Produtos (clique para selecionar)</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {products.map(p => (
                <button key={p.id} onClick={() => toggleProduct(p.id)}
                  className={`p-2 rounded-lg text-xs font-medium text-left transition-all border ${form.productIds.includes(p.id) ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-600' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'}`}>
                  {p.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-400">Sem seleção = aplica a todos</p>
          </div>
          <Button onClick={handleSave} className="w-full h-12 rounded-xl mt-4"><Save className="w-5 h-5 mr-2" /> Criar Promoção</Button>
        </div>
      </Modal>
    </>
  );
}

/* ═══════════════════════ BANNERS TAB ═══════════════════════ */
function BannersTab() {
  const { banners, addBanner, updateBanner, deleteBanner, uploadImage } = useStore();
  const { config } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{ title: string; description: string; imageUrl: string; link: string; type: 'promo'|'sorteio'|'aviso'; expiresAt: string; active: boolean }>({
    title: '', description: '', imageUrl: '', link: '',
    type: 'promo', expiresAt: '', active: true
  });

  const handleSave = () => {
    if (!form.title) return alert('Preencha o título!');
    addBanner({ ...form, expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null });
    setModalOpen(false);
    setForm({ title: '', description: '', imageUrl: '', link: '', type: 'promo', expiresAt: '', active: true });
  };

  const TYPE_LABELS: Record<string, string> = { promo: 'Promoção', sorteio: 'Sorteio', aviso: 'Aviso' };
  const TYPE_COLORS: Record<string, string> = { promo: 'bg-emerald-100 text-emerald-700', sorteio: 'bg-purple-100 text-purple-700', aviso: 'bg-amber-100 text-amber-700' };

  return (
    <>
      <div className="flex justify-end mb-6">
        <Button onClick={() => setModalOpen(true)} className="rounded-xl"><Plus className="w-5 h-5 mr-2" /> Novo Banner</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map(b => (
          <div key={b.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm">
            {b.imageUrl && <img src={b.imageUrl} alt={b.title} className="w-full h-40 object-cover" />}
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${TYPE_COLORS[b.type]}`}>{TYPE_LABELS[b.type]}</span>
                  <h3 className="font-bold text-lg mt-1">{b.title}</h3>
                  <p className="text-sm text-zinc-500">{b.description}</p>
                  {b.link && <a href={b.link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline mt-1 block truncate">{b.link}</a>}
                  {b.expiresAt && <p className="text-xs font-bold text-orange-500 mt-1">Expira: {new Date(b.expiresAt).toLocaleString('pt-BR')}</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant={b.active ? 'outline' : 'primary'} size="sm" onClick={() => updateBanner({ ...b, active: !b.active })} className="rounded-lg">
                  {b.active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { if (confirm('Excluir banner?')) deleteBanner(b.id); }} className="rounded-lg text-red-500">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {banners.length === 0 && (
          <div className="col-span-2 text-center py-16 text-zinc-400">
            <Radio className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-bold">Nenhum banner cadastrado</p>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Banner / Sorteio">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tipo</label>
            <div className="flex gap-2">
              {(['promo', 'sorteio', 'aviso'] as const).map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-black uppercase border transition-all ${form.type === t ? 'text-white border-transparent' : 'bg-zinc-50 text-zinc-500 border-zinc-200'}`}
                  style={form.type === t ? { backgroundColor: config.primaryColor } : {}}>
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          <InputField label="Título" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: SORTEIO DE UM SUBWOOFER!" />
          <TextArea label="Descrição" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhe a promoção ou regras do sorteio..." />
          <InputField label="Link (Opcional)" type="url" value={form.link || ''} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." />
          <InputField label="Data Limite / Fim do Sorteio (Opcional)" type="datetime-local" value={form.expiresAt || ''} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Imagem</label>
            <div className="flex gap-3">
              <input type="url" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="URL da imagem..." className="flex-1 h-12 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 outline-none text-sm text-zinc-900 dark:text-white" />
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (file) { setIsUploading(true); try { const url = await uploadImage(file); setForm(f => ({ ...f, imageUrl: url })); } catch { alert('Erro ao subir imagem'); } finally { setIsUploading(false); } }
                }} />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="h-12 rounded-xl shrink-0">
                {isUploading ? <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /> : <Upload className="w-5 h-5" />}
              </Button>
            </div>
            {form.imageUrl && <img src={form.imageUrl} className="w-full h-32 object-cover rounded-xl mt-2" />}
          </div>
          <Button onClick={handleSave} className="w-full h-12 rounded-xl"><Save className="w-5 h-5 mr-2" /> Salvar Banner</Button>
        </div>
      </Modal>
    </>
  );
}

/* ═══════════════════════ CONFIG TAB ═══════════════════════ */
function ConfigTab() {
  const { config, setConfig, uploadImage } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({ ...config });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({ ...config });
  }, [config]);

  const handleSave = () => {
    setConfig(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDetectLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          handleMapChange(pos.coords.latitude, pos.coords.longitude);
        },
        () => alert('Não foi possível obter localização automaticamente. Por favor, arraste o pino no mapa.')
      );
    } else {
      alert('Geolocalização não suportada.');
    }
  };

  const handleMapChange = async (lat: number, lng: number) => {
    setForm(f => ({ ...f, lat, lng }));
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          setForm(f => ({ ...f, address: data.display_name }));
        }
      }
    } catch (e) {
      console.error("Erro ao obter endereço", e);
    }
  };

  const THEME_COLORS = [
    { name: 'Azul', color: '#0284c7' },
    { name: 'Roxo', color: '#7c3aed' },
    { name: 'Verde', color: '#059669' },
    { name: 'Laranja', color: '#ea580c' },
    { name: 'Rosa', color: '#db2777' },
    { name: 'Vermelho', color: '#dc2626' },
    { name: 'Amarelo', color: '#ca8a04' },
    { name: 'Ciano', color: '#0891b2' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-4">
        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Store className="w-5 h-5" /> Informações da Loja</h3>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Nome da Loja" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <InputField label="Slogan" value={form.slogan} onChange={e => setForm(f => ({ ...f, slogan: e.target.value }))} placeholder="Ex: O melhor sabor!" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="WhatsApp da Loja (com DDD)" value={form.whatsapp?.startsWith('+55') ? form.whatsapp : '+55 ' + (form.whatsapp || '')} onChange={e => { let v = e.target.value; if (!v.startsWith('+55 ')) v = '+55 ' + v.replace(/^\+?55\s*/, ''); setForm(f => ({...f, whatsapp: v})); }} placeholder="5511999999999" />
          <InputField label="Chave PIX" value={form.pixKey || ''} onChange={e => setForm(f => ({ ...f, pixKey: e.target.value }))} placeholder="Sua chave PIX" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <InputField label="Instagram (@usuario ou link)" value={(form as any).instagram || ''} onChange={e => setForm(f => ({ ...f, instagram: e.target.value } as any))} placeholder="@pointdosom" />
        </div>
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-4"><Megaphone className="w-5 h-5" /> Informativos</h3>
          <p className="text-xs text-zinc-500 mb-2">Este texto aparecerá no topo do aplicativo para todos os clientes.</p>
          <TextArea label="Texto Informativo" value={form.informativeText || ''} onChange={e => setForm(f => ({ ...f, informativeText: e.target.value }))} placeholder="Ex: Informamos que no dia 20/04 não abriremos devido ao feriado." />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-4">
        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Type className="w-5 h-5" /> Fonte do Sistema</h3>
        <div className="grid grid-cols-4 gap-2">
          {AVAILABLE_FONTS.map(f => (
            <button key={f} onClick={() => setForm(prev => ({ ...prev, font: f }))}
              className={`p-3 rounded-xl text-sm font-medium border transition-all ${form.font === f ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'}`}
              style={{ fontFamily: f }}>{f}</button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-4">
        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Palette className="w-5 h-5" /> Cor Principal</h3>
        <div className="flex gap-3 flex-wrap">
          {THEME_COLORS.map(tc => (
            <button key={tc.color} onClick={() => setForm(f => ({ ...f, primaryColor: tc.color }))}
              className={`w-12 h-12 rounded-xl transition-all shadow-sm hover:scale-110 ${form.primaryColor === tc.color ? 'ring-4 ring-offset-2 ring-zinc-400 scale-110' : ''}`}
              style={{ backgroundColor: tc.color }} title={tc.name} />
          ))}
          <div className="flex items-center gap-2 ml-2">
            <input type="color" value={form.primaryColor} onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))} className="w-12 h-12 rounded-xl cursor-pointer border-0" />
            <span className="text-xs text-zinc-400 font-mono">{form.primaryColor}</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-4">
        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><ImageIcon className="w-5 h-5" /> Logotipo</h3>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-primary-500/20 shadow-inner shrink-0 cursor-pointer hover:opacity-80 transition-all" onClick={() => fileInputRef.current?.click()}>
            {isUploading ? (
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            ) : form.logoUrl ? (
              <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Upload className="w-8 h-8 text-zinc-400 animate-pulse" />
            )}
          </div>
          <div className="space-y-3 flex-1">
            <InputField label="URL do Logo" value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="Cole a URL ou clique no quadro ao lado" />
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              capture="environment"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    setIsUploading(true);
                    const url = await uploadImage(file);
                    setForm(f => ({ ...f, logoUrl: url }));
                  } catch (err) { alert('Erro ao subir logo'); }
                  finally { setIsUploading(false); }
                }
              }}
            />
            <p className="text-[10px] text-zinc-400 italic font-medium">Dica: Clique no quadro à esquerda para selecionar um arquivo do seu dispositivo.</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-4">
        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Clock className="w-5 h-5" /> Horário de Funcionamento</h3>
        <p className="text-xs text-zinc-500 mb-2">Defina os dias e horários em que sua loja está aberta para receber pedidos.</p>
        <div className="space-y-2">
          {Object.entries(form.openingHours || {}).map(([day, schedule]) => (
            <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl gap-4">
              <div className="flex items-center gap-4">
                <div className="w-24 font-bold text-zinc-700 dark:text-zinc-300">{day}</div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({
                    ...f,
                    openingHours: {
                      ...(f.openingHours || {}),
                      [day]: { ...schedule, isOpen: !schedule.isOpen }
                    }
                  }))}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                    schedule.isOpen 
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800' 
                      : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                  }`}
                >
                  {schedule.isOpen ? 'Aberto' : 'Fechado'}
                </button>
              </div>
              
              <div className={`flex items-center gap-3 transition-all ${schedule.isOpen ? 'opacity-100' : 'opacity-30 grayscale pointer-events-none'}`}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Abre:</span>
                  <input
                    type="time"
                    value={schedule.open}
                    onChange={e => setForm(f => ({
                      ...f,
                      openingHours: {
                        ...(f.openingHours || {}),
                        [day]: { ...schedule, open: e.target.value }
                      }
                    }))}
                    className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary-500 text-zinc-900 dark:text-white font-bold"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Fecha:</span>
                  <input
                    type="time"
                    value={schedule.close}
                    onChange={e => setForm(f => ({
                      ...f,
                      openingHours: {
                        ...(f.openingHours || {}),
                        [day]: { ...schedule, close: e.target.value }
                      }
                    }))}
                    className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary-500 text-zinc-900 dark:text-white font-bold"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 space-y-4">
        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><MapPin className="w-5 h-5" /> Endereço e Entrega</h3>
        <InputField label="Endereço exato da loja" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Rua, Número, Bairro, Cidade" />
        <p className="text-xs text-zinc-500 mb-2">Este é o ponto de partida usado para calcular o frete dos clientes. Ajuste o pino se necessário.</p>
        <MapPicker lat={form.lat} lng={form.lng} onChange={handleMapChange} />
        
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleDetectLocation} className="h-12 rounded-xl mb-2 mt-2"><MapPin className="w-5 h-5 mr-2" /> Usar meu GPS atual</Button>
          {form.lat !== 0 && <span className="text-xs text-emerald-500 font-bold self-center">✓ Cooordenadas ajustadas via mapa</span>}
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <input type="checkbox" id="freeDelivery" checked={form.deliveryFeePerKm === 0} onChange={e => setForm(f => ({ ...f, deliveryFeePerKm: e.target.checked ? 0 : 2.5 }))} className="w-5 h-5" />
          <label htmlFor="freeDelivery" className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Entrega Grátis (Zerar Taxa)</label>
        </div>
        
        {form.deliveryFeePerKm > 0 && (
          <InputField label="Taxa de Entrega por KM (R$)" type="number" step="0.50" value={form.deliveryFeePerKm.toString()} onChange={e => setForm(f => ({ ...f, deliveryFeePerKm: parseFloat(e.target.value) || 0 }))} />
        )}
      </div>

      <Button onClick={handleSave} className="w-full h-14 rounded-2xl text-lg">
        <Save className="w-5 h-5 mr-3" /> {saved ? '✓ Configurações Salvas!' : 'Salvar Configurações'}
      </Button>
    </div>
  );
}

/* ═══════════════════════ DASHBOARD TAB ═══════════════════════ */
function DashboardTab() {
  const { orders, config } = useStore();
  const [period, setPeriod] = useState<'today' | '7days' | '30days' | 'all'>('7days');
  const primaryColor = config.primaryColor;

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    today.setHours(0,0,0,0);
    
    return orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      if (period === 'today') return orderDate >= today;
      if (period === '7days') {
        const last7 = new Date();
        last7.setDate(now.getDate() - 7);
        last7.setHours(0,0,0,0);
        return orderDate >= last7;
      }
      if (period === '30days') {
        const last30 = new Date();
        last30.setDate(now.getDate() - 30);
        last30.setHours(0,0,0,0);
        return orderDate >= last30;
      }
      return true;
    });
  }, [orders, period]);

  const stats = useMemo(() => {
    const revenue = filteredOrders.reduce((acc, o) => acc + o.total, 0);
    const count = filteredOrders.length;
    
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const revenueToday = orders
      .filter(o => new Date(o.createdAt) >= todayStart)
      .reduce((acc, o) => acc + o.total, 0);

    const itemSalesCount: Record<string, { name: string, qty: number, revenue: number }> = {};
    filteredOrders.forEach(o => {
      o.items.forEach(item => {
        if (!itemSalesCount[item.product.id]) {
          itemSalesCount[item.product.id] = { name: item.product.name, qty: 0, revenue: 0 };
        }
        itemSalesCount[item.product.id].qty += item.quantity;
        itemSalesCount[item.product.id].revenue += (item.product.price * item.quantity);
      });
    });

    const sortedItems = Object.values(itemSalesCount).sort((a, b) => b.qty - a.qty);
    const top3 = sortedItems.slice(0, 3);

    return { revenue, count, revenueToday, itemSales: sortedItems, top3 };
  }, [filteredOrders, orders]);

  return (
    <div className="space-y-8">
      <div className="flex gap-2">
        {(['today', '7days', '30days', 'all'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all border ${
              period === p ? 'text-white border-transparent shadow-lg' : 'bg-white dark:bg-zinc-900 text-zinc-500 border-zinc-200 dark:border-zinc-800'
            }`}
            style={period === p ? { backgroundColor: primaryColor } : {}}>
            {p === 'today' ? 'Hoje' : p === '7days' ? 'Últimos 7 dias' : p === '30days' ? 'Últimos 30 dias' : 'Tudo'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Vendas Hoje</p>
          <p className="text-3xl font-black text-emerald-500">{formatCurrency(stats.revenueToday)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Faturamento ({period})</p>
          <p className="text-3xl font-black text-zinc-900 dark:text-white">{formatCurrency(stats.revenue)}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Pedidos no Período</p>
          <p className="text-3xl font-black text-zinc-900 dark:text-white">{stats.count}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <h3 className="font-black text-lg italic mb-4 flex items-center gap-2 text-zinc-900 dark:text-white">
            <BarChart className="w-5 h-5" style={{ color: primaryColor }} /> Top 3 Mais Vendidos
          </h3>
          <div className="space-y-3">
            {stats.top3.map((item, i) => (
               <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                 <div className="flex items-center gap-3">
                   <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400">{i + 1}</span>
                   <span className="font-bold text-zinc-700 dark:text-zinc-300">{item.name}</span>
                 </div>
                 <span className="font-black" style={{ color: primaryColor }}>{item.qty} saídas</span>
               </div>
            ))}
            {stats.top3.length === 0 && <p className="text-center py-6 text-zinc-400 italic">Sem dados no período</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex flex-col h-[350px]">
          <h3 className="font-black text-lg italic mb-4 flex items-center gap-2 text-zinc-900 dark:text-white">
            <Package className="w-5 h-5" style={{ color: primaryColor }} /> Volume por Item
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {stats.itemSales.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm p-3 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 rounded-lg transition-colors">
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">{item.name}</span>
                <div className="text-right">
                  <p className="font-black text-zinc-900 dark:text-white">{item.qty} unidades</p>
                  <p className="text-[10px] text-zinc-500 font-bold">{formatCurrency(item.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ ORDERS TAB ═══════════════════════ */
function OrdersTab() {
  const { orders, updateOrderStatus, updateOrderPayment, deleteOrder, config } = useStore();
  const [subTab, setSubTab] = useState<'pending' | 'finished'>('pending');

  const filteredList = useMemo(() => {
    return [...orders].reverse().filter(o => {
      if (subTab === 'pending') return o.status === 'pending' || o.status === 'confirmed';
      return o.status === 'delivered';
    });
  }, [orders, subTab]);

  
  const paymentLabels = {
    pix: 'PIX', dinheiro: 'Dinheiro', cartao_credito: 'Cartão de Crédito', cartao_debito: 'Cartão de Débito'
  };
  
  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
    confirmed: { label: 'Confirmado', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
    delivered: { label: 'Entregue', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  };

  const handlePrint = (o: typeof orders[0]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = o.items.map(item => `
      <tr>
        <td style="padding: 5px 0;">${item.quantity}x ${item.product.name}</td>
        <td style="text-align: right;">${formatCurrency(item.product.price * item.quantity)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Cupom Não Fiscal - ${o.id}</title>
          <style>
            body { font-family: monospace; width: 80mm; padding: 10px; color: #000; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .details { font-size: 12px; margin-bottom: 10px; }
            .items { width: 100%; border-collapse: collapse; font-size: 12px; }
            .footer { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; text-align: center; font-size: 10px; }
            .total { font-weight: bold; font-size: 14px; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <strong>${config.name}</strong><br/>
            ${config.slogan || ''}<br/>
            ${config.address || ''}
          </div>
          <div class="details">
            PEDIDO: ${o.id.toUpperCase()}<br/>
            DATA: ${new Date(o.createdAt).toLocaleString('pt-BR')}<br/>
            CLIENTE: ${o.customerName}<br/>
            FONE: ${o.customerWhatsapp}<br/>
            END: ${o.customerAddress || 'Retirada'}
          </div>
          <table class="items">
            ${itemsHtml}
          </table>
          <div class="footer">
            <div style="display: flex; justify-content: space-between;"><span>Subtotal</span><span>${formatCurrency(o.subtotal)}</span></div>
            <div style="display: flex; justify-content: space-between;"><span>Entrega</span><span>${formatCurrency(o.deliveryFee)}</span></div>
            <div class="total" style="display: flex; justify-content: space-between;"><span>TOTAL</span><span>${formatCurrency(o.total)}</span></div>
            <br/>
            <strong>PAGAMENTO: ${paymentLabels[o.paymentMethod || 'pix'].toUpperCase()}</strong><br/>
            ${o.isPaid ? 'PAGO' : 'PAGAR NA ENTREGA'}<br/>
            ${o.paymentMethod === 'dinheiro' && o.changeFor ? `TROCO PARA: ${formatCurrency(o.changeFor)} (VOLTAR ${formatCurrency(o.changeFor - o.total)})` : ''}

            <br/><br/>
            Obrigado pela preferência!
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSendToDriver = (o: typeof orders[0]) => {
    const itemsList = o.items.map((item) => `• ${item.quantity}x ${item.product.name}`).join('\n');
    const mapLink = (o.customerLat && o.customerLng) ? `\n🗺️ Mapa: https://www.google.com/maps/search/?api=1&query=${o.customerLat},${o.customerLng}` : '';
    
    let paymentInfo = '';
    if (o.isPaid) {
      paymentInfo = `✅ *PAGAMENTO CONFIRMADO* via ${paymentLabels[o.paymentMethod || 'pix'].toUpperCase()}`;
    } else {
      paymentInfo = `💰 *COBRAR NA ENTREGA* via ${paymentLabels[o.paymentMethod || 'pix'].toUpperCase()}`;
      if (o.paymentMethod === 'dinheiro' && o.changeFor) {
        paymentInfo += `\n⚠️ *LEVAR TROCO PARA:* ${formatCurrency(o.changeFor)} (Voltar *${formatCurrency(o.changeFor - o.total)}*)`;
      }
    }

    const deliveryLink = `${window.location.origin}/entregue/${o.id}`;

    const msg = `🛵 *ENTREGA DE PEDIDO*\n\n👤 Cliente: *${o.customerName}*\n📱 WhatsApp: ${o.customerWhatsapp}\n📍 Endereço: ${o.customerAddress || 'Não informado'}${mapLink}\n\n*ITENS:*\n${itemsList}\n\n${paymentInfo}\n\n💰 Valor Total: *${formatCurrency(o.total)}*\n\n✅ *APÓS ENTREGAR, CLIQUE NO LINK ABAIXO PARA BAIXAR NO SISTEMA:*\n${deliveryLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };


  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl w-fit">
        <button onClick={() => setSubTab('pending')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === 'pending' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}>
          Pendentes ({orders.filter(o => o.status !== 'delivered').length})
        </button>
        <button onClick={() => setSubTab('finished')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${subTab === 'finished' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}>
          Finalizados ({orders.filter(o => o.status === 'delivered').length})
        </button>
      </div>

      {filteredList.length === 0 && (
        <div className="text-center py-20 text-zinc-400 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-bold">{subTab === 'pending' ? 'Nenhum pedido pendente' : 'Nenhum pedido finalizado'}</p>
        </div>
      )}
      {filteredList.map(o => (

        <div key={o.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-6 shadow-sm hover:border-primary-500/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-lg">{o.customerName}</h3>
              <div className="flex flex-col gap-1 mt-1">
                <p className="text-sm text-zinc-500 flex items-center gap-2"><Phone className="w-3 h-3" /> {o.customerWhatsapp}</p>
                <p className="text-xs text-zinc-400 flex items-center gap-2 mb-1" title={o.customerAddress}><MapPin className="w-3 h-3 shrink-0" /> <span className="truncate max-w-[280px] sm:max-w-md block">{o.customerAddress || 'Endereço não informado'}</span></p>
                {o.customerLat !== 0 && o.customerLng !== 0 && (
                   <a href={`https://www.google.com/maps/search/?api=1&query=${o.customerLat},${o.customerLng}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-bold flex items-center gap-1 mt-1 transition-colors">
                     <Map className="w-3 h-3" /> Ver no Google Maps
                   </a>
                )}
                <p className="text-[10px] text-zinc-400 font-mono mt-2 uppercase">ID: {o.id} • {new Date(o.createdAt).toLocaleString('pt-BR')}</p>
                
                <div className="mt-3 bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg inline-block self-start border border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Pagamento: {paymentLabels[o.paymentMethod || 'pix']}</p>
                  {o.paymentMethod === 'dinheiro' && o.changeFor && (
                    <div className="mt-1 flex flex-col gap-0.5">
                      <p className="text-xs text-orange-600 dark:text-orange-400 font-bold">⚠️ Levar troco para: {formatCurrency(o.changeFor)}</p>
                      <p className="text-xs text-orange-700 dark:text-orange-300 font-black">💰 TROCO PARA O CLIENTE: {formatCurrency(o.changeFor - o.total)}</p>
                    </div>
                  )}

                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${statusLabels[o.status].color}`}>
                {statusLabels[o.status].label}
              </span>
              
              <button onClick={() => updateOrderPayment(o.id, !o.isPaid)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors flex items-center gap-1.5 ${o.isPaid ? 'bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-red-50 border-red-300 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'}`}>
                {o.isPaid ? '✅ Pago' : '⏳ Aguardando Pagamento'}
              </button>
              <p className="text-2xl font-black text-primary-500 mt-1">{formatCurrency(o.total)}</p>
            </div>
          </div>
          
          <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-xl p-4 space-y-2">
            {o.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm items-center">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 rounded-md text-[10px] font-bold">{item.quantity}x</span>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.product.name}</span>
                </div>
                <span className="font-bold text-zinc-900 dark:text-white">{formatCurrency(item.product.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-zinc-200 dark:border-zinc-800 mt-3 pt-3 flex flex-col gap-1">
              <div className="flex justify-between text-xs text-zinc-500"><span>Subtotal</span><span>{formatCurrency(o.subtotal)}</span></div>
              <div className="flex justify-between text-xs text-zinc-500"><span>Taxa de entrega</span><span>{formatCurrency(o.deliveryFee)}</span></div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            {o.status === 'pending' && (
              <Button size="sm" onClick={() => updateOrderStatus(o.id, 'confirmed')} className="rounded-xl px-6 h-10 shadow-lg shadow-primary-500/20">Confirmar Pedido</Button>
            )}
            {o.status === 'confirmed' && (
              <Button size="sm" onClick={() => updateOrderStatus(o.id, 'delivered')} className="rounded-xl px-6 h-10 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 uppercase font-black text-[10px] tracking-widest">Marcar como Entregue</Button>
            )}
            {o.status !== 'pending' && (
              <Button size="sm" variant="outline" onClick={() => handleSendToDriver(o)} className="rounded-xl px-4 h-10 ml-auto border-blue-500 text-blue-500 dark:border-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                <Send className="w-4 h-4 mr-2" /> Encaminhar Entregador
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => handlePrint(o)} title="Imprimir Cupom" className="rounded-xl px-4 h-10 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <Printer className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { if(confirm('Excluir este pedido permanentemente?')) deleteOrder(o.id); }} title="Excluir Pedido" className="rounded-xl px-4 h-10 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

        </div>
      ))}
    </div>
  );
}
