import React, { useState, useMemo, useEffect, useRef } from "react";
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
} from "firebase/firestore";

// ==============================================================================
// 🔧 KONFIGURACE FIREBASE
// ==============================================================================

// ⚠️ INSTRUKCE PRO VERCEL DEPLOY ⚠️
// Tento editor (Canvas) neumí syntaxi 'import.meta.env', kterou Vercel vyžaduje.
// Proto je níže uvedena konfigurace ve dvou verzích.

// --- VERZE A: PRO VERCEL / VITE (Moderní) ---
// Před nahráním na Vercel ODKOMENTUJTE (smažte /* a */) tento blok:

const manualConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// --- VERZE B: PRO CANVAS / MÍSTNÍ NÁHLED (Záložní) ---
// Tento blok nechte aktivní pro náhled zde.
// Pokud použijete Verzi A, tuto Verzi B zakomentujte nebo smažte.
/*
const manualConfig = {
  apiKey: (typeof process !== 'undefined' && process.env) ? process.env.VITE_FIREBASE_API_KEY : "",
  authDomain: (typeof process !== 'undefined' && process.env) ? process.env.VITE_FIREBASE_AUTH_DOMAIN : "",
  projectId: (typeof process !== 'undefined' && process.env) ? process.env.VITE_FIREBASE_PROJECT_ID : "",
  storageBucket: (typeof process !== 'undefined' && process.env) ? process.env.VITE_FIREBASE_STORAGE_BUCKET : "",
  messagingSenderId: (typeof process !== 'undefined' && process.env) ? process.env.VITE_FIREBASE_MESSAGING_SENDER_ID : "",
  appId: (typeof process !== 'undefined' && process.env) ? process.env.VITE_FIREBASE_APP_ID : "",
  measurementId: (typeof process !== 'undefined' && process.env) ? process.env.VITE_FIREBASE_MEASUREMENT_ID : ""
};
*/
// ------------------------------------------------------------------------------

let firebaseConfig;
let currentAppId;

// Zjištění, zda běžíme v prostředí Canvas (zde) nebo jinde (Vercel/Local)
if (typeof __firebase_config !== "undefined") {
  // Jsme v Canvas prostředí - použijeme systémové proměnné
  firebaseConfig = JSON.parse(__firebase_config);
  currentAppId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";
} else {
  // Jsme na Vercelu nebo localhostu - použijeme manuální konfiguraci
  // Zde se použije buď Verze A (import.meta) nebo Verze B (process.env) podle toho, co je aktivní
  firebaseConfig = manualConfig;
  currentAppId = "modelarsky-sklad-v1";
}

// Inicializace Firebase
let app, auth, db;
try {
  // Debugovací výpis pro kontrolu
  if (!firebaseConfig.apiKey) {
    console.warn(
      "DEBUG: API Key nenalezen. Zkontrolujte, zda jste pro Vercel odkomentovali VERZI A.",
    );
  }

  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.error("Chyba inicializace Firebase:", error);
}

// ==============================================================================

// Základní seznam značek (lze rozšířit přes "Jiná...")
const STANDARD_BRANDS = [
  "AK Interactive",
  "Ammo Mig",
  "Gunze",
  "Hataka",
  "MRP",
  "Tamiya",
  "Vallejo",
];

// Základní seznam typů (lze rozšířit přes "Jiný...")
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

// Databáze známých barev
const COLOR_DB = {
  "TAMIYA-X1": { name: "Black", hex: "#000000", type: "Akryl" },
  "TAMIYA-X2": { name: "White", hex: "#ffffff", type: "Akryl" },
  "TAMIYA-XF1": { name: "Flat Black", hex: "#1a1a1a", type: "Akryl" },
  "TAMIYA-XF2": { name: "Flat White", hex: "#f0f0f0", type: "Akryl" },
  "GUNZE-H1": { name: "White", hex: "#ffffff", type: "Akryl" },
  "GUNZE-H2": { name: "Black", hex: "#000000", type: "Akryl" },
  "GUNZE-C1": { name: "White", hex: "#ffffff", type: "Lacquer" },
  "VALLEJO-70950": { name: "Black", hex: "#000000", type: "Akryl" },
  "VALLEJO-70951": { name: "White", hex: "#ffffff", type: "Akryl" },
};

export default function App() {
  const [user, setUser] = useState(null);
  const [paints, setPaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const [warehouseId, setWarehouseId] = useState(() => {
    try {
      const saved = localStorage.getItem("modelarsky_warehouse_id");
      if (saved) return saved;
      const newId = Math.random().toString(36).substring(2, 7).toUpperCase();
      localStorage.setItem("modelarsky_warehouse_id", newId);
      return newId;
    } catch (e) {
      return "DEMO";
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingWarehouseId, setEditingWarehouseId] = useState(warehouseId);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("owned");

  const [showFilters, setShowFilters] = useState(false);
  const [activeTypeFilter, setActiveTypeFilter] = useState("all");

  const [autoDetectFound, setAutoDetectFound] = useState(false);
  const [autoDetectError, setAutoDetectError] = useState(false);

  const [customBrand, setCustomBrand] = useState("");
  const [customType, setCustomType] = useState("");

  const [submitError, setSubmitError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [newPaint, setNewPaint] = useState({
    brand: "Tamiya",
    code: "",
    name: "",
    type: "Akryl",
    status: "owned",
    hex: "#808080",
    note: "",
    thinner: "",
    ratio: "",
  });

  // --- FIREBASE AUTH ---
  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      // Pokud chybí auth, znamená to, že se nenačetla konfigurace
      setSaveStatus("Chybí Config");
      return;
    }

    const initAuth = async () => {
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Chyba přihlášení:", err);
        setSaveStatus("Chyba auth");
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- FIREBASE DATA SYNC ---
  useEffect(() => {
    if (!user || !db) return;
    setIsLoading(true);

    try {
      const q = collection(
        db,
        "artifacts",
        currentAppId,
        "public",
        "data",
        "paints",
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const allPaints = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const myPaints = allPaints.filter(
            (p) => p.warehouseId === warehouseId,
          );
          myPaints.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

          setPaints(myPaints);
          setIsLoading(false);
        },
        (error) => {
          console.error("Chyba při načítání dat:", error);
          setIsLoading(false);
          setSaveStatus("chyba DB");
        },
      );

      return () => unsubscribe();
    } catch (err) {
      console.error("Chyba nastavení listeneru:", err);
      setIsLoading(false);
    }
  }, [user, warehouseId]);

  useEffect(() => {
    try {
      localStorage.setItem("modelarsky_warehouse_id", warehouseId);
    } catch (e) {}
  }, [warehouseId]);

  // Efekt pro automatickou detekci barvy
  useEffect(() => {
    if (!isModalOpen) return;

    const cleanCode = newPaint.code.replace(/[\s.-]/g, "");
    if (cleanCode.length === 0) {
      setAutoDetectFound(false);
      setAutoDetectError(false);
      return;
    }

    const currentBrand =
      newPaint.brand === "Jiná..." ? customBrand : newPaint.brand;
    const brandForSearch = currentBrand.toUpperCase().replace(/[\s.-]/g, "");
    const lookupKey = `${brandForSearch}-${cleanCode}`;
    const foundPaint = COLOR_DB[lookupKey];

    if (foundPaint) {
      setAutoDetectFound(true);
      setAutoDetectError(false);

      if (!editingId) {
        setNewPaint((prev) => ({
          ...prev,
          name: foundPaint.name,
          hex: foundPaint.hex,
          type: STANDARD_TYPES.includes(foundPaint.type)
            ? foundPaint.type
            : "Jiný...",
        }));
        if (!STANDARD_TYPES.includes(foundPaint.type)) {
          setCustomType(foundPaint.type);
        }
      }
    } else {
      setAutoDetectFound(false);
      if (cleanCode.length >= 2) setAutoDetectError(true);
      else setAutoDetectError(false);
    }
  }, [newPaint.brand, customBrand, newPaint.code, isModalOpen, editingId]);

  // Reset chybové hlášky
  useEffect(() => {
    setSubmitError("");
  }, [newPaint.code, newPaint.brand, newPaint.status, customBrand]);

  // --- FILTROVÁNÍ ---
  const availableFilterTypes = useMemo(() => {
    const uniqueTypes = new Set(STANDARD_TYPES);
    paints.forEach((p) => {
      if (p.type) uniqueTypes.add(p.type);
    });
    return Array.from(uniqueTypes).sort();
  }, [paints]);

  const filteredPaints = useMemo(() => {
    return paints.filter((paint) => {
      const lowerTerm = searchTerm.toLowerCase();

      const matchesSearch =
        paint.name.toLowerCase().includes(lowerTerm) ||
        paint.code.toLowerCase().includes(lowerTerm) ||
        paint.brand.toLowerCase().includes(lowerTerm) ||
        (paint.note && paint.note.toLowerCase().includes(lowerTerm)) ||
        (paint.thinner && paint.thinner.toLowerCase().includes(lowerTerm));

      const matchesTab = paint.status === activeTab;
      const matchesType =
        activeTypeFilter === "all" || paint.type === activeTypeFilter;

      return matchesSearch && matchesTab && matchesType;
    });
  }, [paints, searchTerm, activeTab, activeTypeFilter]);

  const ownedCount = paints.filter((p) => p.status === "owned").length;
  const buyCount = paints.filter((p) => p.status === "buy").length;

  // --- IMPORT & EXPORT LOGIC ---

  const handleExportData = () => {
    const dataStr = JSON.stringify(paints, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `modelarsky-sklad-${warehouseId}-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportShoppingList = () => {
    const buyList = paints.filter((p) => p.status === "buy");

    if (buyList.length === 0) {
      alert("V nákupním seznamu nic není.");
      return;
    }

    let textContent = `NÁKUPNÍ SEZNAM (Sklad: ${warehouseId})\nDatum: ${new Date().toLocaleDateString()}\n----------------------------------------\n\n`;

    buyList.forEach((p) => {
      textContent += `[ ] ${p.brand} ${p.code} - ${p.name} (${p.type})\n`;
      if (p.note) textContent += `    Pozn: ${p.note}\n`;
      if (p.thinner)
        textContent += `    Ředidlo: ${p.thinner} (${p.ratio || "?"})\n`;
    });

    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nakupni-seznam-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!Array.isArray(importedData))
          throw new Error("Neplatný formát dat");

        let addedCount = 0;
        let skipCount = 0;

        for (const item of importedData) {
          if (!item.brand || !item.code) continue;

          const exists = paints.some(
            (p) =>
              p.brand === item.brand &&
              p.code === item.code &&
              p.status === item.status,
          );

          if (!exists) {
            const { id, ...dataWithoutId } = item;
            await addDoc(
              collection(
                db,
                "artifacts",
                currentAppId,
                "public",
                "data",
                "paints",
              ),
              {
                ...dataWithoutId,
                warehouseId: warehouseId,
                createdAt: Date.now(),
              },
            );
            addedCount++;
          } else {
            skipCount++;
          }
        }

        alert(
          `Import dokončen!\nPřidáno: ${addedCount}\nPřeskočeno (již existuje): ${skipCount}`,
        );
      } catch (err) {
        console.error(err);
        alert("Chyba při importu souboru. Je to validní JSON záloha?");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  // --- CRUD OPERACE ---

  const handleEditStart = (paint) => {
    const isStandardBrand = STANDARD_BRANDS.includes(paint.brand);
    const isStandardType = STANDARD_TYPES.includes(paint.type);

    setNewPaint({
      brand: isStandardBrand ? paint.brand : "Jiná...",
      code: paint.code,
      name: paint.name,
      type: isStandardType ? paint.type : "Jiný...",
      status: paint.status,
      hex: paint.hex,
      note: paint.note || "",
      thinner: paint.thinner || "",
      ratio: paint.ratio || "",
    });

    setCustomBrand(isStandardBrand ? "" : paint.brand);
    setCustomType(isStandardType ? "" : paint.type);

    setEditingId(paint.id);
    setIsModalOpen(true);
    setSubmitError("");
  };

  const handleAddStart = () => {
    setNewPaint({
      brand: "Tamiya",
      code: "",
      name: "",
      type: "Akryl",
      status: activeTab,
      hex: "#808080",
      note: "",
      thinner: "",
      ratio: "",
    });
    setCustomBrand("");
    setCustomType("");
    setEditingId(null);
    setIsModalOpen(true);
    setSubmitError("");
  };

  const handleSavePaint = async (e) => {
    e.preventDefault();
    if (!user || !db) {
      setSubmitError(
        "Chyba: Nejste připojeni k databázi. Zkuste obnovit stránku.",
      );
      return;
    }
    setSubmitError("");

    const finalBrand =
      newPaint.brand === "Jiná..." ? customBrand : newPaint.brand;
    const finalType = newPaint.type === "Jiný..." ? customType : newPaint.type;
    const finalCode = newPaint.code.trim().toUpperCase();

    if (finalBrand.trim() === "") {
      setSubmitError("Prosím zadejte název značky.");
      return;
    }
    if (finalType.trim() === "") {
      setSubmitError("Prosím zadejte typ.");
      return;
    }

    const duplicate = paints.find(
      (p) =>
        p.brand === finalBrand &&
        p.code.toUpperCase() === finalCode &&
        p.status === newPaint.status &&
        p.id !== editingId,
    );

    if (duplicate) {
      const listName =
        newPaint.status === "owned" ? "ve sbírce" : "v nákupním seznamu";
      setSubmitError(`Barvu ${finalBrand} ${finalCode} již máte ${listName}.`);
      return;
    }

    try {
      setSaveStatus("ukládám...");

      const paintData = {
        ...newPaint,
        brand: finalBrand,
        type: finalType,
        code: finalCode,
      };

      if (editingId) {
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
      } else {
        await addDoc(
          collection(db, "artifacts", currentAppId, "public", "data", "paints"),
          {
            ...paintData,
            warehouseId: warehouseId,
            createdAt: Date.now(),
          },
        );
      }

      setIsModalOpen(false);
      setEditingId(null);
      setSaveStatus("uloženo");
      setTimeout(() => setSaveStatus(""), 2000);

      if (activeTab !== newPaint.status) {
        setActiveTab(newPaint.status);
      }
    } catch (err) {
      console.error(err);
      setSubmitError("Chyba při ukládání do cloudu.");
      setSaveStatus("chyba");
    }
  };

  const handleDelete = async (id) => {
    if (!user || !db) return;
    if (confirm("Opravdu smazat tuto barvu z cloudu?")) {
      try {
        await deleteDoc(
          doc(db, "artifacts", currentAppId, "public", "data", "paints", id),
        );
      } catch (err) {
        console.error(err);
        alert("Chyba při mazání.");
      }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    if (!user || !db) return;
    try {
      const newStatus = currentStatus === "owned" ? "buy" : "owned";
      await updateDoc(
        doc(db, "artifacts", currentAppId, "public", "data", "paints", id),
        {
          status: newStatus,
        },
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateWarehouseId = () => {
    if (editingWarehouseId.trim().length < 3) {
      alert("ID skladu musí mít alespoň 3 znaky.");
      return;
    }
    setWarehouseId(editingWarehouseId.trim().toUpperCase());
    setIsSettingsOpen(false);
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
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent hidden sm:block">
              Modelářský Sklad
            </h1>
            <h1 className="text-xl font-bold text-white sm:hidden">Sklad</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingWarehouseId(warehouseId);
                setIsSettingsOpen(true);
              }}
              className="bg-slate-700/50 hover:bg-slate-700 text-blue-300 p-2 rounded-full transition-all border border-blue-500/20"
              title="Nastavení a Data"
            >
              <CloudCog size={20} />
            </button>

            <button
              onClick={handleAddStart}
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-lg transition-all active:scale-95"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        {/* Vyhledávání a Filtry */}
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
              className={`p-3 rounded-xl border transition-all ${
                showFilters || activeTypeFilter !== "all"
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-slate-900 text-slate-400 border-slate-700 hover:text-white"
              }`}
            >
              <Filter size={20} />
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-2 animate-in slide-in-from-top-2">
              <button
                onClick={() => setActiveTypeFilter("all")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  activeTypeFilter === "all"
                    ? "bg-blue-500/20 border-blue-500 text-blue-300"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                }`}
              >
                Vše
              </button>
              {availableFilterTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    activeTypeFilter === type
                      ? "bg-blue-500/20 border-blue-500 text-blue-300"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          )}

          <div className="flex bg-slate-950 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("owned")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "owned"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Package size={16} />
              Mám doma
              <span className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-xs">
                {ownedCount}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("buy")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "buy"
                  ? "bg-slate-800 text-orange-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <ShoppingCart size={16} />
              Koupit
              {buyCount > 0 && (
                <span className="bg-orange-900/50 text-orange-400 px-1.5 py-0.5 rounded text-xs">
                  {buyCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <Cloud size={10} /> ID Skladu:{" "}
              <span className="font-mono text-blue-400">{warehouseId}</span>
            </div>
            {saveStatus && (
              <span className="text-xs text-green-400 flex items-center justify-end gap-1 animate-pulse">
                <Save size={12} /> {saveStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Seznam barev */}
      <div className="max-w-md mx-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <p className="text-sm">Načítám data z cloudu...</p>
            {!firebaseConfig.apiKey && (
              <p className="text-xs text-red-400 mt-2 px-4 text-center">
                Pokud toto vidíte v náhledu (Canvas), zkuste obnovit stránku.
                <br />
                Pokud na Vercelu/Localhost, zkontrolujte{" "}
                <code>manualConfig</code>.
              </p>
            )}
          </div>
        ) : filteredPaints.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Droplets size={48} className="mx-auto mb-3 opacity-20" />
            <p>
              {activeTab === "owned"
                ? "Nic nenalezeno (zkuste změnit filtr)."
                : "Nákupní seznam je prázdný."}
            </p>
          </div>
        ) : (
          filteredPaints.map((paint) => (
            <div
              key={paint.id}
              className="bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-700/50 flex items-center gap-4 relative overflow-hidden group animate-in slide-in-from-bottom-2 duration-300"
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

                    {/* Zobrazení ředění v seznamu */}
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
                              <span className="opacity-50">Poměr:</span>{" "}
                              {paint.ratio}
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
                  onClick={() => handleEditStart(paint)}
                  className="p-2 text-slate-500 hover:text-blue-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                  title="Upravit"
                >
                  <Pencil size={18} />
                </button>

                <button
                  onClick={() => toggleStatus(paint.id, paint.status)}
                  title={
                    activeTab === "owned"
                      ? "Došlo - přidat do nákupního seznamu"
                      : "Koupeno - přidat do sbírky"
                  }
                  className={`p-2 rounded-lg border transition-colors ${
                    activeTab === "owned"
                      ? "bg-slate-700 border-slate-600 text-slate-300 hover:text-orange-400 hover:border-orange-500/50"
                      : "bg-green-900/20 border-green-500/30 text-green-400 hover:bg-green-900/40"
                  }`}
                >
                  {activeTab === "owned" ? (
                    <ShoppingCart size={20} />
                  ) : (
                    <Check size={20} />
                  )}
                </button>

                <button
                  onClick={() => handleDelete(paint.id)}
                  className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                  title="Smazat"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modál: Nastavení a Data (Původně jen Sync) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-700 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CloudCog className="text-blue-400" /> Nastavení a Data
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Synchronizace
              </h4>
              <p className="text-xs text-slate-300 mb-2">
                Pro sdílení dat mezi zařízeními použijte stejné ID.
              </p>
              <label className="block text-xs text-slate-400 mb-1">
                Vaše ID Skladu
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={editingWarehouseId}
                  onChange={(e) =>
                    setEditingWarehouseId(e.target.value.toUpperCase())
                  }
                  className="flex-1 bg-slate-950 border border-blue-500 text-blue-400 text-center font-mono text-xl py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(editingWarehouseId);
                      alert("ID zkopírováno");
                    }
                  }}
                  className="bg-slate-700 text-slate-300 px-3 rounded-lg hover:bg-slate-600"
                  title="Zkopírovat"
                >
                  <Share2 size={18} />
                </button>
              </div>
              <button
                onClick={handleUpdateWarehouseId}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-all text-sm"
              >
                Uložit nové ID
              </button>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Správa dat
              </h4>

              <div className="space-y-3">
                {/* Export JSON */}
                <button
                  onClick={handleExportData}
                  className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 text-slate-200 p-3 rounded-lg border border-slate-600 transition-colors text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Download size={16} className="text-green-400" /> Záloha
                    všeho (JSON)
                  </span>
                </button>

                {/* Import JSON */}
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    onChange={handleImportData}
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
                      )}
                      {isImporting ? "Nahrávám data..." : "Obnovit ze zálohy"}
                    </span>
                  </button>
                </div>

                {/* Export TXT (Nákupní seznam) */}
                <button
                  onClick={handleExportShoppingList}
                  className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 text-slate-200 p-3 rounded-lg border border-slate-600 transition-colors text-sm mt-4"
                >
                  <span className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-400" /> Nákupní
                    seznam (TXT)
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modál: Přidání / Úprava */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-10 duration-300 overflow-y-auto max-h-[95vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingId ? "Úprava barvy" : "Nová barva"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSubmitError("");
                  setEditingId(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSavePaint} className="space-y-4">
              <div className="flex bg-slate-900 p-1 rounded-lg mb-4">
                <button
                  type="button"
                  onClick={() => setNewPaint({ ...newPaint, status: "owned" })}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    newPaint.status === "owned"
                      ? "bg-blue-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Mám doma
                </button>
                <button
                  type="button"
                  onClick={() => setNewPaint({ ...newPaint, status: "buy" })}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                    newPaint.status === "buy"
                      ? "bg-orange-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
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
                    value={newPaint.brand}
                    onChange={(e) => {
                      setNewPaint({ ...newPaint, brand: e.target.value });
                      // Reset custom brandu pokud vybereme standardní
                      if (e.target.value !== "Jiná...") setCustomBrand("");
                    }}
                  >
                    {STANDARD_BRANDS.map((brand) => (
                      <option key={brand}>{brand}</option>
                    ))}
                    <option value="Jiná...">Jiná...</option>
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-xs text-slate-400 mb-1">
                    Typ
                  </label>
                  <select
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newPaint.type}
                    onChange={(e) => {
                      setNewPaint({ ...newPaint, type: e.target.value });
                      if (e.target.value !== "Jiný...") setCustomType("");
                    }}
                  >
                    {STANDARD_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                    <option value="Jiný...">Jiný...</option>
                  </select>
                </div>
              </div>

              {/* Input pro vlastní značku */}
              {newPaint.brand === "Jiná..." && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs text-slate-400 mb-1">
                    Název vlastní značky
                  </label>
                  <input
                    type="text"
                    required={newPaint.brand === "Jiná..."}
                    className="w-full bg-slate-800 border border-blue-500/50 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="Např. Revell, Humbrol..."
                  />
                </div>
              )}

              {/* Input pro vlastní typ */}
              {newPaint.type === "Jiný..." && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs text-slate-400 mb-1">
                    Vlastní typ
                  </label>
                  <input
                    type="text"
                    required={newPaint.type === "Jiný..."}
                    className="w-full bg-slate-800 border border-blue-500/50 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="Např. Olej, Filtr, Lepidlo..."
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Kód barvy (např. XF-1)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className={`w-full bg-slate-900 border rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                      submitError
                        ? "border-red-500 ring-1 ring-red-500/50"
                        : autoDetectFound
                          ? "border-green-500 ring-1 ring-green-500/50"
                          : autoDetectError
                            ? "border-orange-500/50 ring-1 ring-orange-500/50"
                            : "border-slate-600"
                    }`}
                    value={newPaint.code}
                    onChange={(e) =>
                      setNewPaint({
                        ...newPaint,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Zadejte kód..."
                  />
                  {autoDetectFound && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 animate-in fade-in zoom-in duration-300">
                      <Wand2 size={18} />
                    </div>
                  )}
                  {autoDetectError && !submitError && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-400 animate-in fade-in zoom-in duration-300">
                      <HelpCircle size={18} />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Název odstínu
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newPaint.name}
                  onChange={(e) =>
                    setNewPaint({ ...newPaint, name: e.target.value })
                  }
                  placeholder="Např. Flat Black"
                />
              </div>

              {/* Sekce Ředění */}
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <FlaskConical size={12} /> Ředění (volitelné)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs text-slate-400 mb-1">
                      Doporučené ředidlo
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={newPaint.thinner}
                      onChange={(e) =>
                        setNewPaint({ ...newPaint, thinner: e.target.value })
                      }
                      placeholder="Např. X-20A, Voda..."
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs text-slate-400 mb-1">
                      Poměr (barva:ředidlo)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={newPaint.ratio}
                      onChange={(e) =>
                        setNewPaint({ ...newPaint, ratio: e.target.value })
                      }
                      placeholder="Např. 1:1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Poznámka (volitelné)
                </label>
                <textarea
                  rows="2"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={newPaint.note}
                  onChange={(e) =>
                    setNewPaint({ ...newPaint, note: e.target.value })
                  }
                  placeholder="Např. určeno pro Tiger I, ředit 1:1..."
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Odstín (výběr nebo HEX kód)
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    className="w-12 h-12 rounded-lg cursor-pointer border border-slate-600 p-1 bg-slate-900 shrink-0"
                    value={newPaint.hex}
                    onChange={(e) =>
                      setNewPaint({ ...newPaint, hex: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono uppercase"
                    value={newPaint.hex}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith("#")) val = "#" + val;
                      setNewPaint({ ...newPaint, hex: val });
                    }}
                    placeholder="#000000"
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="pt-2">
                {submitError && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4 flex items-start gap-3 text-red-400 text-sm animate-in slide-in-from-top-2">
                    <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!!submitError}
                  className={`w-full font-bold py-3 rounded-xl shadow-lg transition-all ${
                    submitError
                      ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-500 text-white active:scale-95"
                  }`}
                >
                  {editingId ? "Uložit změny" : "Přidat barvu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
