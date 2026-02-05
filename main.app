import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Trash2, AlertCircle, CheckCircle2, Droplets, Paintbrush, Filter, X, Wand2, HelpCircle, Save } from 'lucide-react';

// Databáze známých barev pro automatické doplňování
// Klíč je formát: "ZNAČKA-KÓD" (vše velkým, bez mezer a teček pro lepší shodu)
const COLOR_DB = {
  // --- TAMIYA (X - Lesklé) ---
  'TAMIYA-X1': { name: 'Black', hex: '#000000', type: 'Akryl' },
  'TAMIYA-X2': { name: 'White', hex: '#ffffff', type: 'Akryl' },
  'TAMIYA-X3': { name: 'Royal Blue', hex: '#002868', type: 'Akryl' },
  'TAMIYA-X4': { name: 'Blue', hex: '#0000ff', type: 'Akryl' },
  'TAMIYA-X5': { name: 'Green', hex: '#008000', type: 'Akryl' },
  'TAMIYA-X6': { name: 'Orange', hex: '#ffa500', type: 'Akryl' },
  'TAMIYA-X7': { name: 'Red', hex: '#cc0000', type: 'Akryl' },
  'TAMIYA-X8': { name: 'Lemon Yellow', hex: '#fff44f', type: 'Akryl' },
  'TAMIYA-X9': { name: 'Brown', hex: '#a52a2a', type: 'Akryl' },
  'TAMIYA-X10': { name: 'Gun Metal', hex: '#2a2a2a', type: 'Akryl' },
  'TAMIYA-X11': { name: 'Chrome Silver', hex: '#c0c0c0', type: 'Akryl' },
  'TAMIYA-X12': { name: 'Gold Leaf', hex: '#ffd700', type: 'Akryl' },
  'TAMIYA-X13': { name: 'Metallic Blue', hex: '#4169e1', type: 'Akryl' },
  'TAMIYA-X18': { name: 'Semi Gloss Black', hex: '#1a1a1a', type: 'Akryl' },
  'TAMIYA-X22': { name: 'Clear', hex: '#ffffff', type: 'Akryl' },
  'TAMIYA-X27': { name: 'Clear Red', hex: '#cc0000', type: 'Akryl' },
  
  // --- TAMIYA (XF - Matné) ---
  'TAMIYA-XF1': { name: 'Flat Black', hex: '#1a1a1a', type: 'Akryl' },
  'TAMIYA-XF2': { name: 'Flat White', hex: '#f0f0f0', type: 'Akryl' },
  'TAMIYA-XF3': { name: 'Flat Yellow', hex: '#e6e600', type: 'Akryl' },
  'TAMIYA-XF4': { name: 'Yellow Green', hex: '#9acd32', type: 'Akryl' },
  'TAMIYA-XF5': { name: 'Flat Green', hex: '#354a21', type: 'Akryl' },
  'TAMIYA-XF6': { name: 'Copper', hex: '#b87333', type: 'Akryl' },
  'TAMIYA-XF7': { name: 'Flat Red', hex: '#b82525', type: 'Akryl' },
  'TAMIYA-XF8': { name: 'Flat Blue', hex: '#00008b', type: 'Akryl' },
  'TAMIYA-XF9': { name: 'Hull Red', hex: '#800000', type: 'Akryl' },
  'TAMIYA-XF10': { name: 'Flat Brown', hex: '#8b4513', type: 'Akryl' },
  'TAMIYA-XF15': { name: 'Flat Flesh', hex: '#ffcc99', type: 'Akryl' },
  'TAMIYA-XF16': { name: 'Flat Aluminum', hex: '#a8a9ad', type: 'Akryl' },
  'TAMIYA-XF19': { name: 'Sky Grey', hex: '#808080', type: 'Akryl' },
  'TAMIYA-XF20': { name: 'Medium Grey', hex: '#a9a9a9', type: 'Akryl' },
  'TAMIYA-XF24': { name: 'Dark Grey', hex: '#4d5d53', type: 'Akryl' },
  'TAMIYA-XF49': { name: 'Khaki', hex: '#f0e68c', type: 'Akryl' },
  'TAMIYA-XF52': { name: 'Flat Earth', hex: '#734a32', type: 'Akryl' },
  'TAMIYA-XF53': { name: 'Neutral Grey', hex: '#708090', type: 'Akryl' },
  'TAMIYA-XF56': { name: 'Metallic Grey', hex: '#708090', type: 'Akryl' },
  'TAMIYA-XF57': { name: 'Buff', hex: '#d6b88e', type: 'Akryl' },
  'TAMIYA-XF58': { name: 'Olive Green', hex: '#556b2f', type: 'Akryl' },
  'TAMIYA-XF59': { name: 'Desert Yellow', hex: '#f4a460', type: 'Akryl' },
  'TAMIYA-XF60': { name: 'Dark Yellow', hex: '#a69e65', type: 'Akryl' },
  'TAMIYA-XF61': { name: 'Dark Green', hex: '#3b4d3b', type: 'Akryl' },
  'TAMIYA-XF62': { name: 'Olive Drab', hex: '#6b8e23', type: 'Akryl' },
  'TAMIYA-XF63': { name: 'German Grey', hex: '#4d5257', type: 'Akryl' },
  'TAMIYA-XF64': { name: 'Red Brown', hex: '#a52a2a', type: 'Akryl' },
  'TAMIYA-XF66': { name: 'Light Grey', hex: '#d3d3d3', type: 'Akryl' },
  'TAMIYA-XF67': { name: 'NATO Green', hex: '#4b5540', type: 'Akryl' },
  'TAMIYA-XF68': { name: 'NATO Brown', hex: '#5d4037', type: 'Akryl' },
  'TAMIYA-XF69': { name: 'NATO Black', hex: '#1f1f1f', type: 'Akryl' },
  'TAMIYA-XF84': { name: 'Dark Iron', hex: '#3a3a3a', type: 'Akryl' },
  'TAMIYA-XF85': { name: 'Rubber Black', hex: '#2b2b2b', type: 'Akryl' },
  'TAMIYA-XF86': { name: 'Flat Clear', hex: '#f5f5f5', type: 'Akryl' },

  // --- TAMIYA (LP - Lacquer) ---
  'TAMIYA-LP1': { name: 'Black', hex: '#000000', type: 'Lacquer' },
  'TAMIYA-LP2': { name: 'White', hex: '#ffffff', type: 'Lacquer' },
  'TAMIYA-LP3': { name: 'Flat Black', hex: '#1a1a1a', type: 'Lacquer' },
  'TAMIYA-LP4': { name: 'Flat White', hex: '#f0f0f0', type: 'Lacquer' },
  'TAMIYA-LP11': { name: 'Silver', hex: '#c0c0c0', type: 'Lacquer' },
  'TAMIYA-LP38': { name: 'Flat Aluminum', hex: '#a8a9ad', type: 'Lacquer' },
  'TAMIYA-LP81': { name: 'Mixing Blue', hex: '#0047ab', type: 'Lacquer' },

  // --- MR. HOBBY (Gunze) ---
  'MRHOBBY-H1': { name: 'White', hex: '#ffffff', type: 'Akryl' },
  'MRHOBBY-H2': { name: 'Black', hex: '#000000', type: 'Akryl' },
  'MRHOBBY-H3': { name: 'Red', hex: '#ff0000', type: 'Akryl' },
  'MRHOBBY-H8': { name: 'Silver', hex: '#c0c0c0', type: 'Akryl' },
  'MRHOBBY-H12': { name: 'Flat Black', hex: '#1a1a1a', type: 'Akryl' },
  'MRHOBBY-H76': { name: 'Burnt Iron', hex: '#4a3c3c', type: 'Akryl' },
  'MRHOBBY-C33': { name: 'Flat Black', hex: '#1a1a1a', type: 'Lacquer' },
  'MRHOBBY-C62': { name: 'Flat White', hex: '#f0f0f0', type: 'Lacquer' },
  
  // --- AK INTERACTIVE ---
  'AKINTERACTIVE-AK11001': { name: 'White', hex: '#ffffff', type: '3rd Gen' },
  'AKINTERACTIVE-AK11029': { name: 'Black', hex: '#000000', type: '3rd Gen' },
  'AKINTERACTIVE-RC001': { name: 'Matt Black', hex: '#1a1a1a', type: 'Real Color' },
  
  // --- VALLEJO ---
  'VALLEJO-70950': { name: 'Black', hex: '#000000', type: 'Model Color' },
  'VALLEJO-70951': { name: 'White', hex: '#ffffff', type: 'Model Color' },
  'VALLEJO-70957': { name: 'Flat Red', hex: '#a61c00', type: 'Model Color' },
  'VALLEJO-70862': { name: 'Black Grey', hex: '#2e2e2e', type: 'Model Color' },
  'VALLEJO-70997': { name: 'Silver', hex: '#c0c0c0', type: 'Model Color' },
  'VALLEJO-71057': { name: 'Black', hex: '#000000', type: 'Model Air' },
  'VALLEJO-71001': { name: 'White', hex: '#ffffff', type: 'Model Air' },
};

// Výchozí data pro nového uživatele (pokud nemá nic uloženo)
const DEFAULT_PAINTS = [
  { id: 1, brand: 'Tamiya', code: 'XF-1', name: 'Flat Black', type: 'Akryl', status: 'ok', hex: '#1a1a1a' },
  { id: 2, brand: 'Tamiya', code: 'XF-60', name: 'Dark Yellow', type: 'Akryl', status: 'low', hex: '#a69e65' },
];

export default function App() {
  // Načtení dat z LocalStorage při startu
  const [paints, setPaints] = useState(() => {
    try {
      const savedPaints = localStorage.getItem('modelarskySkladData');
      return savedPaints ? JSON.parse(savedPaints) : DEFAULT_PAINTS;
    } catch (e) {
      console.error('Chyba při načítání dat', e);
      return DEFAULT_PAINTS;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [autoDetectFound, setAutoDetectFound] = useState(false);
  const [autoDetectError, setAutoDetectError] = useState(false);
  const [customBrand, setCustomBrand] = useState('');
  const [saveStatus, setSaveStatus] = useState(''); // Indikátor uložení

  const [newPaint, setNewPaint] = useState({
    brand: 'Tamiya',
    code: '',
    name: '',
    type: 'Akryl',
    status: 'ok',
    hex: '#808080'
  });

  // Uložení dat do LocalStorage při každé změně seznamu barev
  useEffect(() => {
    try {
      localStorage.setItem('modelarskySkladData', JSON.stringify(paints));
      setSaveStatus('uloženo');
      const timer = setTimeout(() => setSaveStatus(''), 2000);
      return () => clearTimeout(timer);
    } catch (e) {
      console.error('Chyba při ukládání', e);
      setSaveStatus('chyba uložení');
    }
  }, [paints]);

  // Efekt pro automatickou detekci barvy
  useEffect(() => {
    if (!isModalOpen) return;

    const cleanCode = newPaint.code.replace(/[\s.-]/g, '').toUpperCase();
    
    if (cleanCode.length === 0) {
      setAutoDetectFound(false);
      setAutoDetectError(false);
      return;
    }

    const brandForSearch = newPaint.brand === 'Jiné' ? customBrand.toUpperCase() : newPaint.brand.toUpperCase();
    const cleanBrand = brandForSearch.replace(/[\s.-]/g, '');
    
    const lookupKey = `${cleanBrand}-${cleanCode}`;
    const foundPaint = COLOR_DB[lookupKey];

    if (foundPaint) {
      setNewPaint(prev => ({
        ...prev,
        name: foundPaint.name,
        hex: foundPaint.hex,
        type: foundPaint.type
      }));
      setAutoDetectFound(true);
      setAutoDetectError(false);
    } else {
      setAutoDetectFound(false);
      if (cleanCode.length >= 2) {
        setAutoDetectError(true);
      } else {
        setAutoDetectError(false);
      }
    }
  }, [newPaint.brand, customBrand, newPaint.code, isModalOpen]);

  const filteredPaints = useMemo(() => {
    return paints.filter(paint => {
      const matchesSearch = 
        paint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paint.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paint.brand.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        filterStatus === 'all' ? true :
        filterStatus === 'low' ? (paint.status === 'low' || paint.status === 'empty') :
        paint.status === paint.status;

      return matchesSearch && matchesStatus;
    });
  }, [paints, searchTerm, filterStatus]);

  const handleAddPaint = (e) => {
    e.preventDefault();
    
    const finalBrand = newPaint.brand === 'Jiné' ? customBrand : newPaint.brand;
    
    if (finalBrand.trim() === '') {
      alert('Prosím zadejte název značky.');
      return;
    }

    setPaints([...paints, { ...newPaint, brand: finalBrand, id: Date.now() }]);
    setIsModalOpen(false);
    
    setNewPaint({ brand: 'Tamiya', code: '', name: '', type: 'Akryl', status: 'ok', hex: '#808080' });
    setCustomBrand('');
    setAutoDetectFound(false);
    setAutoDetectError(false);
  };

  const handleDelete = (id) => {
    if (confirm('Opravdu smazat tuto barvu?')) {
      setPaints(paints.filter(p => p.id !== id));
    }
  };

  const toggleStatus = (id) => {
    setPaints(paints.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'ok' ? 'low' : p.status === 'low' ? 'empty' : 'ok';
        return { ...p, status: nextStatus };
      }
      return p;
    }));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'ok': return 'bg-green-100 text-green-700 border-green-200';
      case 'low': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'empty': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'ok': return 'Skladem';
      case 'low': return 'Dochází';
      case 'empty': return 'Prázdné';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-20">
      {/* Hlavička */}
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10 shadow-md">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Paintbrush size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Modelářský Sklad
            </h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-lg transition-all active:scale-95"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Vyhledávání a filtry */}
        <div className="max-w-md mx-auto px-4 pb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Hledat kód, název, značku..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200 placeholder-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button 
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filterStatus === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                Vše ({paints.length})
              </button>
              <button 
                onClick={() => setFilterStatus('low')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
                  filterStatus === 'low' ? 'bg-orange-900/50 text-orange-200 border-orange-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <AlertCircle size={14} />
                Dochází / Prázdné
              </button>
            </div>
            {/* Indikátor uložení */}
            {saveStatus && (
               <div className="text-xs text-green-400 flex items-center gap-1 animate-pulse px-2">
                 <Save size={12} /> {saveStatus}
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Seznam barev */}
      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        {filteredPaints.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Droplets size={48} className="mx-auto mb-3 opacity-20" />
            <p>Žádné barvy nenalezeny.</p>
          </div>
        ) : (
          filteredPaints.map((paint) => (
            <div 
              key={paint.id} 
              className="bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-700/50 flex items-center gap-4 relative overflow-hidden group"
            >
              <div 
                className="absolute left-0 top-0 bottom-0 w-1.5" 
                style={{ backgroundColor: paint.hex }}
              />

              <div 
                className="w-12 h-12 rounded-full shadow-inner border-2 border-slate-600 flex-shrink-0"
                style={{ backgroundColor: paint.hex }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{paint.brand}</span>
                    <h3 className="font-semibold text-slate-100 truncate">{paint.code} - {paint.name}</h3>
                    <p className="text-xs text-slate-500">{paint.type}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button 
                  onClick={() => toggleStatus(paint.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 transition-colors ${getStatusColor(paint.status)}`}
                >
                  {paint.status === 'ok' && <CheckCircle2 size={12} />}
                  {paint.status === 'low' && <AlertCircle size={12} />}
                  {paint.status === 'empty' && <X size={12} />}
                  {getStatusText(paint.status)}
                </button>
                
                <button 
                  onClick={() => handleDelete(paint.id)}
                  className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modální okno pro přidání */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Nová barva</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddPaint} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs text-slate-400 mb-1">Značka</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newPaint.brand}
                    onChange={(e) => {
                      setNewPaint({...newPaint, brand: e.target.value});
                      // Pokud uživatel přepne zpět z "Jiné", smažeme customBrand pro čistotu
                      if (e.target.value !== 'Jiné') setCustomBrand('');
                    }}
                  >
                    <option>Tamiya</option>
                    <option>Mr. Hobby</option>
                    <option>Vallejo</option>
                    <option>AK Interactive</option>
                    <option>Jiné</option>
                  </select>
                </div>
                
                <div className="col-span-1">
                  <label className="block text-xs text-slate-400 mb-1">Typ</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newPaint.type}
                    onChange={(e) => setNewPaint({...newPaint, type: e.target.value})}
                  >
                    <option>Akryl</option>
                    <option>Lacquer</option>
                    <option>Email (Syntetika)</option>
                    <option>Wash</option>
                    <option>Pigment</option>
                    <option>Sprej</option>
                    <option>Model Color</option>
                    <option>Model Air</option>
                    <option>3rd Gen</option>
                    <option>Real Color</option>
                  </select>
                </div>
              </div>

              {/* Pole pro vlastní značku se zobrazí jen když je vybráno "Jiné" */}
              {newPaint.brand === 'Jiné' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs text-slate-400 mb-1">Název vlastní značky</label>
                  <input 
                    type="text" 
                    required={newPaint.brand === 'Jiné'}
                    className="w-full bg-slate-800 border border-blue-500/50 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="Např. Mission Models, Alclad..."
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">Kód barvy (např. XF-1)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                      autoDetectFound ? 'border-green-500 ring-1 ring-green-500/50' : 
                      autoDetectError ? 'border-orange-500/50 ring-1 ring-orange-500/50' : 'border-slate-600'
                    }`}
                    value={newPaint.code}
                    onChange={(e) => setNewPaint({...newPaint, code: e.target.value})}
                    placeholder="Zadejte kód..."
                  />
                  {autoDetectFound && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 animate-in fade-in zoom-in duration-300">
                      <Wand2 size={18} />
                    </div>
                  )}
                  {autoDetectError && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 animate-in fade-in zoom-in duration-300">
                      <HelpCircle size={18} />
                    </div>
                  )}
                </div>
                {autoDetectFound && (
                  <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <Wand2 size={10} /> Barva rozpoznána a automaticky vyplněna
                  </p>
                )}
                {autoDetectError && (
                  <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                    <HelpCircle size={10} /> Barva nenalezena v databázi (doplňte název ručně)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Název odstínu</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newPaint.name}
                  onChange={(e) => setNewPaint({...newPaint, name: e.target.value})}
                  placeholder="Např. Flat Black"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Odstín (ruční úprava)</label>
                <div className="flex items-center gap-4 bg-slate-900 border border-slate-600 rounded-lg p-2">
                  <input 
                    type="color" 
                    className="w-10 h-10 rounded cursor-pointer border-none"
                    value={newPaint.hex}
                    onChange={(e) => setNewPaint({...newPaint, hex: e.target.value})}
                  />
                  <span className="text-slate-400 text-sm">
                    {autoDetectFound ? 'Automaticky nastaveno' : 'Klikněte pro výběr odstínu'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all"
                >
                  Uložit do seznamu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
