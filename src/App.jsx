import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  Plus,
  Search,
  Trash2,
  Paintbrush,
  X,
  Wand2,
  HelpCircle,
  Save,
  ShoppingCart,
  Check,
  Package,
  AlertTriangle,
  Cloud,
  CloudCog,
  Loader2,
  Share2,
  Droplets,
  Pencil,
  StickyNote,
  Filter,
  Download,
  Upload,
  FileText,
  FlaskConical,
  Database,
  FileJson,
  WifiOff,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  writeBatch,
  setDoc,
} from "firebase/firestore";

// ==============================================================================
// 🛠️ POMOCNÉ FUNKCE (UTILS)
// ==============================================================================

const toTitleCase = (str) => {
  if (!str) return "";
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
  );
};

const toSentenceCase = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Normalizuje ID pro porovnávání (odstraní mezery, tečky, lomítka A POMLČKY)
const normalizeId = (brand, code) => {
  if (!brand || !code) return "";
  const cleanBrand = brand.toUpperCase().replace(/[\s\/.\-]/g, "");
  const cleanCode = code.toUpperCase().replace(/[\s\/.\-]/g, "");
  return `${cleanBrand}_${cleanCode}`;
};

// Generuje bezpečné ID dokumentu pro Firestore (pro import katalogu)
const generateSafeDocId = (brand, code) => {
  const safeBrand = brand.toUpperCase().replace(/[\s\/.]/g, "_");
  const safeCode = code.toUpperCase().replace(/[\s\/.]/g, "_");
  return `${safeBrand}_${safeCode}`;
};

// ==============================================================================
// 🔧 KONFIGURACE FIREBASE (UNIVERZÁLNÍ)
// ==============================================================================

const getEnv = (key) => {
  try {
    if (import.meta && import.meta.env && import.meta.env[key])
      return import.meta.env[key];
  } catch (e) {}
  try {
    if (typeof process !== "undefined" && process.env && process.env[key])
      return process.env[key];
  } catch (e) {}
  return "";
};

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("VITE_FIREBASE_APP_ID"),
  measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID"),
};

if (typeof __firebase_config !== "undefined") {
  Object.assign(firebaseConfig, JSON.parse(__firebase_config));
}

const currentAppId =
  typeof __app_id !== "undefined" ? __app_id : "modelarsky-sklad-v1";

let app, auth, db;
try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
  } else {
    console.warn("OFFLINE MODE: API Key nenalezen.");
  }
} catch (error) {
  console.error("Firebase Init Error:", error);
}

const STANDARD_BRANDS = [
  "AK Interactive",
  "Ammo Mig",
  "Gunze",
  "Hataka",
  "MRP",
  "Tamiya",
  "Vallejo",
];
const STANDARD_TYPES = [
  "Akryl",
  "Lacquer",
  "Email (Syntetika)",
  "Sprej",
  "Tmel",
  "Lak",
  "Ředidlo",
  "Wash",
  "Pigment",
];

// ==============================================================================
// 🧩 KOMPONENTY (Sub-components)
// ==============================================================================

const PaintItem = React.memo(
  ({ paint, activeTab, onEdit, onToggleStatus, onDelete }) => (
    <div className="bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-700/50 flex items-center gap-4 relative overflow-hidden group animate-in slide-in-from-bottom-2 duration-300">
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
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {paint.brand}
            </span>
            <h3 className="font-semibold text-slate-100 truncate">
              {paint.code} - {paint.name}
            </h3>
            <div className="flex flex-wrap gap-x-2 gap-y-1 items-center">
              <p className="text-xs text-slate-500">{paint.type}</p>
              {paint.note && (
                <span className="text-[10px] bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <StickyNote size={10} /> {paint.note}
                </span>
              )}
            </div>
            {(paint.thinner || paint.ratio) && (
              <div className="mt-2 text-[11px] text-slate-400 bg-slate-900/50 p-2 rounded border border-slate-700/50 flex items-start gap-2">
                <FlaskConical
                  size={14}
                  className="mt-0.5 text-blue-400 shrink-0"
                />
                <div className="leading-tight">
                  {paint.thinner && (
                    <div>
                      <span className="opacity-50">Ředidlo:</span>{" "}
                      {paint.thinner}
                    </div>
                  )}
                  {paint.ratio && (
                    <div>
                      <span className="opacity-50">Poměr:</span> {paint.ratio}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onEdit(paint)}
          className="p-2 text-slate-500 hover:text-blue-400 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <Pencil size={18} />
        </button>
        <button
          onClick={() => onToggleStatus(paint.id, paint.status)}
          className={`p-2 rounded-lg border transition-colors ${activeTab === "owned" ? "bg-slate-700 border-slate-600 text-slate-300 hover:text-orange-400" : "bg-green-900/20 border-green-500/30 text-green-400 hover:bg-green-900/40"}`}
        >
          {activeTab === "owned" ? (
            <ShoppingCart size={20} />
          ) : (
            <Check size={20} />
          )}
        </button>
        <button
          onClick={() => onDelete(paint.id)}
          className="p-2 text-slate-600 hover:text-red-400 transition-colors"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  ),
);

const FilterBar = ({
  searchTerm,
  setSearchTerm,
  showFilters,
  setShowFilters,
  activeTypeFilter,
  setActiveTypeFilter,
  availableTypes,
  saveStatus,
  warehouseId,
  isOffline,
}) => (
  <div className="max-w-md mx-auto px-4 pb-4 space-y-3">
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Hledat..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200 placeholder-slate-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`p-3 rounded-xl border transition-all ${showFilters || activeTypeFilter !== "all" ? "bg-blue-600 text-white border-blue-500" : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"}`}
      >
        <Filter size={20} />
      </button>
    </div>
    {showFilters && (
      <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-2">
        <button
          onClick={() => setActiveTypeFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${activeTypeFilter === "all" ? "bg-blue-500/20 border-blue-500 text-blue-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"}`}
        >
          Vše
        </button>
        {availableTypes.map((type) => (
          <button
            key={type}
            onClick={() => setActiveTypeFilter(type)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${activeTypeFilter === type ? "bg-blue-500/20 border-blue-500 text-blue-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"}`}
          >
            {type}
          </button>
        ))}
      </div>
    )}
    <div className="flex justify-between items-center px-1">
      <div className="flex items-center gap-1 text-[10px] text-slate-500">
        <Cloud size={10} /> ID Skladu:{" "}
        <span className="font-mono text-blue-400">{warehouseId}</span>
      </div>
      {isOffline && (
        <span className="text-xs text-red-400 flex items-center justify-end gap-1">
          <WifiOff size={12} /> Offline režim
        </span>
      )}
      {saveStatus && (
        <span className="text-xs text-green-400 flex items-center justify-end gap-1 animate-pulse">
          <Save size={12} /> {saveStatus}
        </span>
      )}
    </div>
  </div>
);

const StatsBar = ({ activeTab, setActiveTab, ownedCount, buyCount }) => (
  <div className="max-w-md mx-auto px-4 pb-2">
    <div className="flex bg-slate-950 p-1 rounded-xl">
      <button
        onClick={() => setActiveTab("owned")}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "owned" ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
      >
        <Package size={16} /> Mám doma{" "}
        <span className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-xs">
          {ownedCount}
        </span>
      </button>
      <button
        onClick={() => setActiveTab("buy")}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "buy" ? "bg-slate-800 text-orange-400 shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
      >
        <ShoppingCart size={16} /> Koupit{" "}
        {buyCount > 0 && (
          <span className="bg-orange-900/50 text-orange-400 px-1.5 py-0.5 rounded text-xs">
            {buyCount}
          </span>
        )}
      </button>
    </div>
  </div>
);

const SettingsModal = ({
  onClose,
  warehouseId,
  setWarehouseId,
  onExportData,
  onExportList,
  onImportData,
  isImporting,
  onImportCatalog,
  catalogSize,
}) => {
  const [tempId, setTempId] = useState(warehouseId);
  const fileInputRef = useRef(null);
  const catalogInputRef = useRef(null);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-700 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CloudCog className="text-blue-400" /> Nastavení
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-6">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Synchronizace
          </h4>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={tempId}
              onChange={(e) => setTempId(e.target.value.toUpperCase())}
              className="flex-1 bg-slate-950 border border-blue-500 text-blue-400 text-center font-mono text-xl py-2 rounded-lg focus:outline-none"
            />
            <button
              onClick={() => {
                navigator.clipboard?.writeText(tempId);
                alert("ID zkopírováno");
              }}
              className="bg-slate-700 text-slate-300 px-3 rounded-lg hover:bg-slate-600"
            >
              <Share2 size={18} />
            </button>
          </div>
          <button
            onClick={() => {
              setWarehouseId(tempId);
              onClose();
            }}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-all text-sm"
          >
            Uložit nové ID
          </button>
        </div>

        <div className="bg-indigo-900/30 p-4 rounded-xl border border-indigo-500/30 mb-6">
          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Database size={12} /> Cloud Katalog
          </h4>
          {catalogSize > 0 && (
            <div className="flex items-center gap-2 text-green-400 text-xs font-bold mb-3 bg-green-900/20 p-2 rounded border border-green-500/20">
              <Check size={16} />
              <span>Katalog aktivní ({catalogSize} položek)</span>
            </div>
          )}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="file"
                accept=".json"
                ref={catalogInputRef}
                onChange={onImportCatalog}
                className="hidden"
              />
              <button
                onClick={() => catalogInputRef.current?.click()}
                disabled={isImporting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
              >
                {isImporting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileJson size={14} />
                )}{" "}
                Nahrát / Aktualizovat Katalog (JSON)
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 italic">
            Tip: Použijte pro hromadnou aktualizaci. Existující barvy se
            aktualizují, nové přidají.
          </p>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 space-y-3">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Moje Data
          </h4>
          <button
            onClick={onExportData}
            className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 text-slate-200 p-3 rounded-lg border border-slate-600 transition-colors text-sm"
          >
            <span className="flex items-center gap-2">
              <Download size={16} className="text-green-400" /> Záloha (JSON)
            </span>
          </button>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={onImportData}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 text-slate-200 p-3 rounded-lg border border-slate-600 transition-colors text-sm disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                {isImporting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} className="text-orange-400" />
                )}{" "}
                {isImporting ? "Nahrávám..." : "Obnovit"}
              </span>
            </button>
          </div>
          <button
            onClick={onExportList}
            className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 text-slate-200 p-3 rounded-lg border border-slate-600 transition-colors text-sm mt-4"
          >
            <span className="flex items-center gap-2">
              <FileText size={16} className="text-blue-400" /> Nákupní seznam
              (TXT)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

const EditModal = ({
  onClose,
  editingId,
  onSave,
  activeTab,
  existingPaints,
  catalog,
}) => {
  const [formData, setFormData] = useState(() => {
    if (editingId) {
      const paint = existingPaints.find((p) => p.id === editingId);
      if (paint) return { ...paint };
    }
    return {
      brand: "Tamiya",
      code: "",
      name: "",
      type: "Akryl",
      status: activeTab,
      hex: "#808080",
      note: "",
      thinner: "",
      ratio: "",
    };
  });

  const [customBrand, setCustomBrand] = useState(() =>
    editingId && formData.brand && !STANDARD_BRANDS.includes(formData.brand)
      ? formData.brand
      : "",
  );
  const [customType, setCustomType] = useState(() =>
    editingId && formData.type && !STANDARD_TYPES.includes(formData.type)
      ? formData.type
      : "",
  );
  const [autoDetectFound, setAutoDetectFound] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingId) {
      if (!STANDARD_BRANDS.includes(formData.brand))
        setFormData((prev) => ({ ...prev, brand: "Jiná..." }));
      if (!STANDARD_TYPES.includes(formData.type))
        setFormData((prev) => ({ ...prev, type: "Jiný..." }));
    }
  }, []);

  useEffect(() => {
    const cleanCode = formData.code.replace(/[\s.-]/g, "");
    if (cleanCode.length === 0) {
      setAutoDetectFound(false);
      return;
    }

    const currentBrand =
      formData.brand === "Jiná..." ? customBrand : formData.brand;
    const searchPaintId = normalizeId(currentBrand, cleanCode);

    let foundPaint = catalog.find(
      (item) => normalizeId(item.brand, item.code) === searchPaintId,
    );
    if (!foundPaint) {
      const memoryMatch = existingPaints.find(
        (p) => normalizeId(p.brand, p.code) === searchPaintId,
      );
      if (memoryMatch) foundPaint = { ...memoryMatch };
    }

    if (foundPaint) {
      setAutoDetectFound(true);
      if (!editingId) {
        setFormData((prev) => ({
          ...prev,
          name: foundPaint.name,
          hex: foundPaint.hex,
          type: STANDARD_TYPES.includes(foundPaint.type)
            ? foundPaint.type
            : "Jiný...",
        }));
        if (!STANDARD_TYPES.includes(foundPaint.type))
          setCustomType(foundPaint.type);
      }
    } else {
      setAutoDetectFound(false);
    }
  }, [
    formData.brand,
    customBrand,
    formData.code,
    editingId,
    catalog,
    existingPaints,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setIsSaving(true);

    const finalBrand =
      formData.brand === "Jiná..." ? toTitleCase(customBrand) : formData.brand;
    const finalType =
      formData.type === "Jiný..." ? toTitleCase(customType) : formData.type;
    const finalCode = formData.code.trim().toUpperCase();

    if (!finalBrand || !finalType) {
      setSubmitError("Vyplňte značku a typ.");
      setIsSaving(false);
      return;
    }

    const checkId = normalizeId(finalBrand, finalCode);
    const duplicate = existingPaints.find(
      (p) =>
        normalizeId(p.brand, p.code) === checkId &&
        p.status === formData.status &&
        p.id !== editingId,
    );

    if (duplicate) {
      setSubmitError(
        `Tuto barvu už máte v seznamu (uloženo jako: ${duplicate.code}).`,
      );
      setIsSaving(false);
      return;
    }

    const success = await onSave({
      ...formData,
      brand: finalBrand,
      type: finalType,
      code: finalCode,
      name: toTitleCase(formData.name),
      thinner: toTitleCase(formData.thinner),
      note: toSentenceCase(formData.note),
    });

    if (!success) {
      setSubmitError("Chyba: Nepodařilo se připojit k databázi.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-10 duration-300 overflow-y-auto max-h-[95vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {editingId ? "Úprava barvy" : "Nová barva"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex bg-slate-900 p-1 rounded-lg mb-4">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, status: "owned" })}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.status === "owned" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              Mám doma
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, status: "buy" })}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.status === "buy" ? "bg-orange-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
            >
              Chci koupit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="block text-xs text-slate-400 mb-1">
                Značka
              </label>
              <select
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
              >
                {STANDARD_BRANDS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
                <option>Jiná...</option>
              </select>
            </div>
            <div className="col-span-1">
              <label className="block text-xs text-slate-400 mb-1">Typ</label>
              <select
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
              >
                {STANDARD_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
                <option>Jiný...</option>
              </select>
            </div>
          </div>
          {formData.brand === "Jiná..." && (
            <input
              type="text"
              className="w-full bg-slate-800 border border-blue-500/50 rounded-lg p-3 text-white"
              value={customBrand}
              onChange={(e) => setCustomBrand(e.target.value)}
              placeholder="Název značky..."
            />
          )}
          {formData.type === "Jiný..." && (
            <input
              type="text"
              className="w-full bg-slate-800 border border-blue-500/50 rounded-lg p-3 text-white"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder="Typ..."
            />
          )}
          <div className="relative">
            <label className="block text-xs text-slate-400 mb-1">Kód</label>
            <input
              type="text"
              className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 outline-none ${autoDetectFound ? "border-green-500" : "border-slate-600"}`}
              value={formData.code}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  code: e.target.value.toUpperCase(),
                });
                setSubmitError("");
              }}
              placeholder="XF-1"
            />
            {autoDetectFound && (
              <Wand2
                size={18}
                className="absolute right-3 top-8 text-green-400"
              />
            )}
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Název</label>
            <input
              type="text"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <FlaskConical size={12} /> Ředění
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                className="bg-slate-900 border border-slate-600 rounded-lg p-3 text-white text-sm"
                value={formData.thinner}
                onChange={(e) =>
                  setFormData({ ...formData, thinner: e.target.value })
                }
                placeholder="Ředidlo..."
              />
              <input
                type="text"
                className="bg-slate-900 border border-slate-600 rounded-lg p-3 text-white text-sm"
                value={formData.ratio}
                onChange={(e) =>
                  setFormData({ ...formData, ratio: e.target.value })
                }
                placeholder="Poměr 1:1"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Poznámka
            </label>
            <textarea
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white resize-none"
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
            />
          </div>
          <div className="flex gap-3">
            <input
              type="color"
              className="w-12 h-12 rounded-lg cursor-pointer border border-slate-600 p-1 bg-slate-900"
              value={formData.hex}
              onChange={(e) =>
                setFormData({ ...formData, hex: e.target.value })
              }
            />
            <input
              type="text"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white font-mono uppercase"
              value={formData.hex}
              onChange={(e) =>
                setFormData({ ...formData, hex: e.target.value })
              }
            />
          </div>
          {submitError && (
            <div className="text-red-400 text-sm flex gap-2 items-center bg-red-900/20 p-2 rounded border border-red-500/50">
              <AlertTriangle size={16} /> {submitError}
            </div>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" />
            ) : editingId ? (
              "Uložit"
            ) : (
              "Přidat"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

// ==============================================================================
// 🚀 HLAVNÍ APLIKACE
// ==============================================================================

export default function App() {
  const [user, setUser] = useState(null);
  const [paints, setPaints] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  const [warehouseId, setWarehouseId] = useState(() => {
    try {
      return (
        localStorage.getItem("modelarsky_warehouse_id") ||
        Math.random().toString(36).substring(2, 7).toUpperCase()
      );
    } catch {
      return "DEMO";
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("owned");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTypeFilter, setActiveTypeFilter] = useState("all");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== "undefined" && __initial_auth_token)
          await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth err:", err);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    setIsLoading(true);
    try {
      const unsubPaints = onSnapshot(
        collection(db, "artifacts", currentAppId, "public", "data", "paints"),
        (snapshot) => {
          const allPaints = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setPaints(
            allPaints
              .filter((p) => p.warehouseId === warehouseId)
              .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
          );
          setIsLoading(false);
        },
      );

      const unsubCatalog = onSnapshot(
        collection(db, "artifacts", currentAppId, "public", "data", "catalog"),
        (snapshot) => {
          setCatalog(snapshot.docs.map((doc) => doc.data()));
        },
      );

      return () => {
        unsubPaints();
        unsubCatalog();
      };
    } catch (err) {
      setIsLoading(false);
    }
  }, [user, warehouseId]);

  useEffect(() => {
    try {
      localStorage.setItem("modelarsky_warehouse_id", warehouseId);
    } catch (e) {}
  }, [warehouseId]);

  const handleImportCatalog = async (e) => {
    const file = e.target.files[0];
    if (
      !file ||
      !db ||
      !confirm("Pozor: Toto nahraje data do globálního katalogu. Pokračovat?")
    )
      return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error("Soubor musí být JSON pole.");

        const chunkSize = 450;
        const catalogRef = collection(
          db,
          "artifacts",
          currentAppId,
          "public",
          "data",
          "catalog",
        );
        let totalProcessed = 0;

        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize);
          const batch = writeBatch(db);
          chunk.forEach((item) => {
            if (item.brand && item.code) {
              const docId = generateSafeDocId(item.brand, item.code);
              batch.set(doc(catalogRef, docId), item, { merge: true });
              totalProcessed++;
            }
          });
          await batch.commit();
        }
        alert(`Katalog aktualizován! (${totalProcessed} pol.)`);
        setIsSettingsOpen(false);
      } catch (err) {
        alert("Chyba: " + err.message);
      } finally {
        setIsLoading(false);
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const availableFilterTypes = useMemo(() => {
    const uniqueTypes = new Set(STANDARD_TYPES);
    paints.forEach((p) => {
      if (p.type) uniqueTypes.add(p.type);
    });
    return Array.from(uniqueTypes).sort();
  }, [paints]);

  const filteredPaints = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();
    return paints.filter((paint) => {
      const matchesSearch =
        !lowerTerm ||
        paint.name.toLowerCase().includes(lowerTerm) ||
        paint.code.toLowerCase().includes(lowerTerm) ||
        paint.brand.toLowerCase().includes(lowerTerm) ||
        (paint.note && paint.note.toLowerCase().includes(lowerTerm));
      return (
        matchesSearch &&
        paint.status === activeTab &&
        (activeTypeFilter === "all" || paint.type === activeTypeFilter)
      );
    });
  }, [paints, searchTerm, activeTab, activeTypeFilter]);

  const handleEditStart = useCallback((paint) => {
    setEditingId(paint.id);
    setIsModalOpen(true);
  }, []);
  const handleDelete = useCallback(async (id) => {
    if (db && confirm("Smazat barvu?"))
      await deleteDoc(
        doc(db, "artifacts", currentAppId, "public", "data", "paints", id),
      );
  }, []);
  const handleToggleStatus = useCallback(async (id, currentStatus) => {
    if (db)
      await updateDoc(
        doc(db, "artifacts", currentAppId, "public", "data", "paints", id),
        { status: currentStatus === "owned" ? "buy" : "owned" },
      );
  }, []);

  const handleSavePaint = async (paintData) => {
    if (!db) return false;
    setSaveStatus("ukládám...");
    try {
      if (editingId)
        await updateDoc(
          doc(
            db,
            "artifacts",
            currentAppId,
            "public",
            "data",
            "paints",
            editingId,
          ),
          paintData,
        );
      else
        await addDoc(
          collection(db, "artifacts", currentAppId, "public", "data", "paints"),
          { ...paintData, warehouseId, createdAt: Date.now() },
        );

      // --- CROWDSOURCING LOGIKA ---
      const catalogId = generateSafeDocId(paintData.brand, paintData.code);
      const existsInCatalog = catalog.some(
        (item) =>
          normalizeId(item.brand, item.code) ===
          normalizeId(paintData.brand, paintData.code),
      );

      if (!existsInCatalog) {
        const catalogItem = {
          brand: paintData.brand,
          code: paintData.code,
          name: paintData.name,
          type: paintData.type,
          hex: paintData.hex,
        };
        await setDoc(
          doc(
            db,
            "artifacts",
            currentAppId,
            "public",
            "data",
            "catalog",
            catalogId,
          ),
          catalogItem,
          { merge: true },
        );
      }
      // -----------------------------

      setIsModalOpen(false);
      setEditingId(null);
      setSaveStatus("uloženo");
      if (activeTab !== paintData.status) setActiveTab(paintData.status);
      setTimeout(() => setSaveStatus(""), 2000);
      return true;
    } catch (e) {
      setSaveStatus("chyba");
      return false;
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file || !db) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        let added = 0;
        for (const item of data) {
          if (
            paints.some(
              (p) =>
                p.brand === item.brand &&
                p.code === item.code &&
                p.status === item.status,
            )
          )
            continue;
          const { id, ...rest } = item;
          await addDoc(
            collection(
              db,
              "artifacts",
              currentAppId,
              "public",
              "data",
              "paints",
            ),
            { ...rest, warehouseId, createdAt: Date.now() },
          );
          added++;
        }
        alert(`Importováno: ${added}`);
      } catch (err) {
        alert("Chyba importu");
      }
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  const handleExportJson = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(paints, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-${warehouseId}.json`;
    link.click();
  };
  const handleExportTxt = () => {
    const txt = paints
      .filter((p) => p.status === "buy")
      .map((p) => `[ ] ${p.brand} ${p.code} - ${p.name}`)
      .join("\n");
    const url = URL.createObjectURL(new Blob([txt], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `buy-list.txt`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-20">
      <div className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10 shadow-md">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Paintbrush size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent hidden sm:block">
              Modelářský Sklad
            </h1>
            <h1 className="text-xl font-bold text-white sm:hidden">Sklad</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="bg-slate-700/50 hover:bg-slate-700 text-blue-300 p-2 rounded-full border border-blue-500/20"
            >
              <CloudCog size={20} />
            </button>
            <button
              onClick={() => {
                setEditingId(null);
                setIsModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-lg"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>
        <FilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          activeTypeFilter={activeTypeFilter}
          setActiveTypeFilter={setActiveTypeFilter}
          availableTypes={availableFilterTypes}
          saveStatus={saveStatus}
          warehouseId={warehouseId}
          isOffline={!db}
        />
        <StatsBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          ownedCount={paints.filter((p) => p.status === "owned").length}
          buyCount={paints.filter((p) => p.status === "buy").length}
        />
      </div>
      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <p>Načítám...</p>
          </div>
        ) : filteredPaints.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Droplets size={48} className="mx-auto mb-3 opacity-20" />
            <p>Nic nenalezeno.</p>
          </div>
        ) : (
          filteredPaints.map((paint) => (
            <PaintItem
              key={paint.id}
              paint={paint}
              activeTab={activeTab}
              onEdit={handleEditStart}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          warehouseId={warehouseId}
          setWarehouseId={setWarehouseId}
          onExportData={handleExportJson}
          onExportList={handleExportTxt}
          onImportData={handleImport}
          isImporting={isImporting}
          onImportCatalog={handleImportCatalog}
          catalogSize={catalog.length}
        />
      )}
      {isModalOpen && (
        <EditModal
          onClose={() => setIsModalOpen(false)}
          editingId={editingId}
          onSave={handleSavePaint}
          activeTab={activeTab}
          existingPaints={paints}
          catalog={catalog}
        />
      )}
    </div>
  );
}
