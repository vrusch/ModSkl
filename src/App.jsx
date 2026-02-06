import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Droplets,
  Paintbrush,
  Filter,
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

// --- FIREBASE CONFIGURATION & INIT ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

// --- DATABASE OF PAINTS ---
const COLOR_DB = {
  // --- TAMIYA (X - Lesklé) ---
  "TAMIYA-X1": { name: "Black", hex: "#000000", type: "Akryl" },
  "TAMIYA-X2": { name: "White", hex: "#ffffff", type: "Akryl" },
  "TAMIYA-X3": { name: "Royal Blue", hex: "#002868", type: "Akryl" },
  "TAMIYA-X4": { name: "Blue", hex: "#0000ff", type: "Akryl" },
  "TAMIYA-X5": { name: "Green", hex: "#008000", type: "Akryl" },
  "TAMIYA-X6": { name: "Orange", hex: "#ffa500", type: "Akryl" },
  "TAMIYA-X7": { name: "Red", hex: "#cc0000", type: "Akryl" },
  "TAMIYA-X8": { name: "Lemon Yellow", hex: "#fff44f", type: "Akryl" },
  "TAMIYA-X9": { name: "Brown", hex: "#a52a2a", type: "Akryl" },
  "TAMIYA-X10": { name: "Gun Metal", hex: "#2a2a2a", type: "Akryl" },
  "TAMIYA-X11": { name: "Chrome Silver", hex: "#c0c0c0", type: "Akryl" },
  "TAMIYA-X12": { name: "Gold Leaf", hex: "#ffd700", type: "Akryl" },
  "TAMIYA-X13": { name: "Metallic Blue", hex: "#4169e1", type: "Akryl" },
  "TAMIYA-X18": { name: "Semi Gloss Black", hex: "#1a1a1a", type: "Akryl" },
  "TAMIYA-X22": { name: "Clear", hex: "#ffffff", type: "Akryl" },
  "TAMIYA-X27": { name: "Clear Red", hex: "#cc0000", type: "Akryl" },

  // --- TAMIYA (XF - Matné) ---
  "TAMIYA-XF1": { name: "Flat Black", hex: "#1a1a1a", type: "Akryl" },
  "TAMIYA-XF2": { name: "Flat White", hex: "#f0f0f0", type: "Akryl" },
  "TAMIYA-XF3": { name: "Flat Yellow", hex: "#e6e600", type: "Akryl" },
  "TAMIYA-XF4": { name: "Yellow Green", hex: "#9acd32", type: "Akryl" },
  "TAMIYA-XF5": { name: "Flat Green", hex: "#354a21", type: "Akryl" },
  "TAMIYA-XF6": { name: "Copper", hex: "#b87333", type: "Akryl" },
  "TAMIYA-XF7": { name: "Flat Red", hex: "#b82525", type: "Akryl" },
  "TAMIYA-XF8": { name: "Flat Blue", hex: "#00008b", type: "Akryl" },
  "TAMIYA-XF9": { name: "Hull Red", hex: "#800000", type: "Akryl" },
  "TAMIYA-XF10": { name: "Flat Brown", hex: "#8b4513", type: "Akryl" },
  "TAMIYA-XF15": { name: "Flat Flesh", hex: "#ffcc99", type: "Akryl" },
  "TAMIYA-XF16": { name: "Flat Aluminum", hex: "#a8a9ad", type: "Akryl" },
  "TAMIYA-XF19": { name: "Sky Grey", hex: "#808080", type: "Akryl" },
  "TAMIYA-XF20": { name: "Medium Grey", hex: "#a9a9a9", type: "Akryl" },
  "TAMIYA-XF24": { name: "Dark Grey", hex: "#4d5d53", type: "Akryl" },
  "TAMIYA-XF49": { name: "Khaki", hex: "#f0e68c", type: "Akryl" },
  "TAMIYA-XF52": { name: "Flat Earth", hex: "#734a32", type: "Akryl" },
  "TAMIYA-XF53": { name: "Neutral Grey", hex: "#708090", type: "Akryl" },
  "TAMIYA-XF56": { name: "Metallic Grey", hex: "#708090", type: "Akryl" },
  "TAMIYA-XF57": { name: "Buff", hex: "#d6b88e", type: "Akryl" },
  "TAMIYA-XF58": { name: "Olive Green", hex: "#556b2f", type: "Akryl" },
  "TAMIYA-XF59": { name: "Desert Yellow", hex: "#f4a460", type: "Akryl" },
  "TAMIYA-XF60": { name: "Dark Yellow", hex: "#a69e65", type: "Akryl" },
  "TAMIYA-XF61": { name: "Dark Green", hex: "#3b4d3b", type: "Akryl" },
  "TAMIYA-XF62": { name: "Olive Drab", hex: "#6b8e23", type: "Akryl" },
  "TAMIYA-XF63": { name: "German Grey", hex: "#4d5257", type: "Akryl" },
  "TAMIYA-XF64": { name: "Red Brown", hex: "#a52a2a", type: "Akryl" },
  "TAMIYA-XF66": { name: "Light Grey", hex: "#d3d3d3", type: "Akryl" },
  "TAMIYA-XF67": { name: "NATO Green", hex: "#4b5540", type: "Akryl" },
  "TAMIYA-XF68": { name: "NATO Brown", hex: "#5d4037", type: "Akryl" },
  "TAMIYA-XF69": { name: "NATO Black", hex: "#1f1f1f", type: "Akryl" },
  "TAMIYA-XF84": { name: "Dark Iron", hex: "#3a3a3a", type: "Akryl" },
  "TAMIYA-XF85": { name: "Rubber Black", hex: "#2b2b2b", type: "Akryl" },
  "TAMIYA-XF86": { name: "Flat Clear", hex: "#f5f5f5", type: "Akryl" },

  // --- TAMIYA (LP - Lacquer) ---
  "TAMIYA-LP1": { name: "Black", hex: "#000000", type: "Lacquer" },
  "TAMIYA-LP2": { name: "White", hex: "#ffffff", type: "Lacquer" },
  "TAMIYA-LP3": { name: "Flat Black", hex: "#1a1a1a", type: "Lacquer" },
  "TAMIYA-LP4": { name: "Flat White", hex: "#f0f0f0", type: "Lacquer" },
  "TAMIYA-LP11": { name: "Silver", hex: "#c0c0c0", type: "Lacquer" },
  "TAMIYA-LP38": { name: "Flat Aluminum", hex: "#a8a9ad", type: "Lacquer" },
  "TAMIYA-LP81": { name: "Mixing Blue", hex: "#0047ab", type: "Lacquer" },

  // --- MR. HOBBY (Gunze) ---
  "MRHOBBY-H1": { name: "White", hex: "#ffffff", type: "Akryl" },
  "MRHOBBY-H2": { name: "Black", hex: "#000000", type: "Akryl" },
  "MRHOBBY-H3": { name: "Red", hex: "#ff0000", type: "Akryl" },
  "MRHOBBY-H8": { name: "Silver", hex: "#c0c0c0", type: "Akryl" },
  "MRHOBBY-H12": { name: "Flat Black", hex: "#1a1a1a", type: "Akryl" },
  "MRHOBBY-H76": { name: "Burnt Iron", hex: "#4a3c3c", type: "Akryl" },
  "MRHOBBY-C33": { name: "Flat Black", hex: "#1a1a1a", type: "Lacquer" },
  "MRHOBBY-C62": { name: "Flat White", hex: "#f0f0f0", type: "Lacquer" },

  // --- AK INTERACTIVE ---
  "AKINTERACTIVE-AK11001": { name: "White", hex: "#ffffff", type: "3rd Gen" },
  "AKINTERACTIVE-AK11029": { name: "Black", hex: "#000000", type: "3rd Gen" },
  "AKINTERACTIVE-RC001": {
    name: "Matt Black",
    hex: "#1a1a1a",
    type: "Real Color",
  },

  // --- VALLEJO ---
  "VALLEJO-70950": { name: "Black", hex: "#000000", type: "Model Color" },
  "VALLEJO-70951": { name: "White", hex: "#ffffff", type: "Model Color" },
  "VALLEJO-70957": { name: "Flat Red", hex: "#a61c00", type: "Model Color" },
  "VALLEJO-70862": { name: "Black Grey", hex: "#2e2e2e", type: "Model Color" },
  "VALLEJO-70997": { name: "Silver", hex: "#c0c0c0", type: "Model Color" },
  "VALLEJO-71057": { name: "Black", hex: "#000000", type: "Model Air" },
  "VALLEJO-71001": { name: "White", hex: "#ffffff", type: "Model Air" },
};

export default function App() {
  const [user, setUser] = useState(null);
  const [paints, setPaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Správa ID Skladu (Warehouse ID) pro synchronizaci
  const [warehouseId, setWarehouseId] = useState(() => {
    // Zkusíme načíst uložené ID, jinak vygenerujeme nové
    const saved = localStorage.getItem("modelarsky_warehouse_id");
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(2, 7).toUpperCase();
    localStorage.setItem("modelarsky_warehouse_id", newId);
    return newId;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false); // Modál pro nastavení sync
  const [editingWarehouseId, setEditingWarehouseId] = useState(warehouseId);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("owned");

  const [autoDetectFound, setAutoDetectFound] = useState(false);
  const [autoDetectError, setAutoDetectError] = useState(false);
  const [customBrand, setCustomBrand] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  const [newPaint, setNewPaint] = useState({
    brand: "Tamiya",
    code: "",
    name: "",
    type: "Akryl",
    status: "owned",
    hex: "#808080",
  });

  // --- FIREBASE AUTH ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== "undefined" && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // --- FIREBASE DATA SYNC ---
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    // Používáme veřejnou kolekci 'paints' a filtrujeme v paměti podle warehouseId
    // Toto umožňuje snadné sdílení bez složitého nastavování oprávnění v tomto demu
    const q = collection(db, "artifacts", appId, "public", "data", "paints");

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allPaints = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filtrujeme pouze barvy patřící k aktuálnímu ID skladu
        const myPaints = allPaints.filter((p) => p.warehouseId === warehouseId);

        // Seřadíme podle času vložení (simulováno pomocí timestamp, pokud existuje, nebo názvu)
        myPaints.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        setPaints(myPaints);
        setIsLoading(false);
      },
      (error) => {
        console.error("Chyba při načítání dat:", error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user, warehouseId]);

  // Efekt pro uložení warehouse ID při změně
  useEffect(() => {
    localStorage.setItem("modelarsky_warehouse_id", warehouseId);
  }, [warehouseId]);

  // Efekt pro automatickou detekci barvy (stejný jako dříve)
  useEffect(() => {
    if (!isModalOpen) return;
    const cleanCode = newPaint.code.replace(/[\s.-]/g, "");
    if (cleanCode.length === 0) {
      setAutoDetectFound(false);
      setAutoDetectError(false);
      return;
    }
    const brandForSearch =
      newPaint.brand === "Jiné"
        ? customBrand.toUpperCase()
        : newPaint.brand.toUpperCase();
    const cleanBrand = brandForSearch.replace(/[\s.-]/g, "");
    const lookupKey = `${cleanBrand}-${cleanCode}`;
    const foundPaint = COLOR_DB[lookupKey];

    if (foundPaint) {
      setNewPaint((prev) => ({
        ...prev,
        name: foundPaint.name,
        hex: foundPaint.hex,
        type: foundPaint.type,
      }));
      setAutoDetectFound(true);
      setAutoDetectError(false);
    } else {
      setAutoDetectFound(false);
      if (cleanCode.length >= 2) setAutoDetectError(true);
      else setAutoDetectError(false);
    }
  }, [newPaint.brand, customBrand, newPaint.code, isModalOpen]);

  // Vymazání chybové hlášky
  useEffect(() => {
    setSubmitError("");
  }, [newPaint.code, newPaint.brand, newPaint.status, customBrand]);

  // Filtrování
  const filteredPaints = useMemo(() => {
    return paints.filter((paint) => {
      const matchesSearch =
        paint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paint.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paint.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = paint.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [paints, searchTerm, activeTab]);

  const ownedCount = paints.filter((p) => p.status === "owned").length;
  const buyCount = paints.filter((p) => p.status === "buy").length;

  // --- HANDLERS (CRUD with Firestore) ---

  const handleAddPaint = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSubmitError("");

    const finalBrand = newPaint.brand === "Jiné" ? customBrand : newPaint.brand;
    const finalCode = newPaint.code.trim().toUpperCase();

    if (finalBrand.trim() === "") {
      setSubmitError("Prosím zadejte název značky.");
      return;
    }

    // Kontrola duplicit (v rámci aktuálně načtených dat)
    const duplicate = paints.find(
      (p) =>
        p.brand === finalBrand &&
        p.code.toUpperCase() === finalCode &&
        p.status === newPaint.status,
    );

    if (duplicate) {
      const listName =
        newPaint.status === "owned"
          ? "ve sbírce (Mám doma)"
          : "v nákupním seznamu";
      setSubmitError(
        `Barvu ${finalBrand} ${finalCode} již máte ${listName}. Nelze přidat duplicitně.`,
      );
      return;
    }

    try {
      setSaveStatus("ukládám...");
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "paints"),
        {
          ...newPaint,
          brand: finalBrand,
          code: finalCode,
          warehouseId: warehouseId, // Důležité: přiřadíme k aktuálnímu skladu
          createdAt: Date.now(),
        },
      );

      setIsModalOpen(false);
      setNewPaint((prev) => ({
        brand: "Tamiya",
        code: "",
        name: "",
        type: "Akryl",
        hex: "#808080",
        status: prev.status,
      }));
      setCustomBrand("");
      setAutoDetectFound(false);
      setAutoDetectError(false);
      setActiveTab(newPaint.status);
      setSaveStatus("uloženo");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (err) {
      console.error(err);
      setSubmitError("Chyba při ukládání do cloudu.");
      setSaveStatus("chyba");
    }
  };

  const handleDelete = async (id) => {
    if (!user) return;
    if (confirm("Opravdu smazat tuto barvu z cloudu?")) {
      try {
        await deleteDoc(
          doc(db, "artifacts", appId, "public", "data", "paints", id),
        );
      } catch (err) {
        console.error(err);
        alert("Chyba při mazání.");
      }
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    if (!user) return;
    try {
      const newStatus = currentStatus === "owned" ? "buy" : "owned";
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "paints", id),
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
    setIsSyncModalOpen(false);
    // Data se automaticky načtou znovu díky useEffect závislosti na warehouseId
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
            {/* Tlačítko pro nastavení synchronizace */}
            <button
              onClick={() => {
                setEditingWarehouseId(warehouseId);
                setIsSyncModalOpen(true);
              }}
              className="bg-slate-700/50 hover:bg-slate-700 text-blue-300 p-2 rounded-full transition-all border border-blue-500/20"
              title="Nastavení sdílení dat"
            >
              <CloudCog size={20} />
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-lg transition-all active:scale-95"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        {/* Vyhledávání a Taby */}
        <div className="max-w-md mx-auto px-4 pb-4 space-y-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Hledat kód, název, značku..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200 placeholder-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

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

          {/* Status bar */}
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
          </div>
        ) : filteredPaints.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Droplets size={48} className="mx-auto mb-3 opacity-20" />
            <p>
              {activeTab === "owned"
                ? "V tomto skladu zatím nic není."
                : "Nákupní seznam je prázdný."}
            </p>
            <p className="text-xs mt-4 opacity-50 max-w-[200px] mx-auto">
              Pokud máte data na jiném zařízení, ověřte, že máte stejné{" "}
              <strong>ID Skladu</strong> (ikona mráčku).
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
                    <p className="text-xs text-slate-500">{paint.type}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
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
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modál: Synchronizace (Nastavení ID skladu) */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CloudCog className="text-blue-400" /> Sdílení Dat
              </h3>
              <button
                onClick={() => setIsSyncModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-4">
              <p className="text-sm text-slate-300 mb-2">
                Aby se data zobrazila na druhém zařízení (např. v mobilu i na
                PC), zadejte na obou zařízeních stejné ID.
              </p>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Vaše ID Skladu
              </label>
              <div className="flex gap-2">
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
            </div>

            <button
              onClick={handleUpdateWarehouseId}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all"
            >
              Použít toto ID
            </button>
          </div>
        </div>
      )}

      {/* Modál: Přidání nové barvy */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Nová barva</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSubmitError("");
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddPaint} className="space-y-4">
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
                      if (e.target.value !== "Jiné") setCustomBrand("");
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
                  <label className="block text-xs text-slate-400 mb-1">
                    Typ
                  </label>
                  <select
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={newPaint.type}
                    onChange={(e) =>
                      setNewPaint({ ...newPaint, type: e.target.value })
                    }
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

              {newPaint.brand === "Jiné" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs text-slate-400 mb-1">
                    Název vlastní značky
                  </label>
                  <input
                    type="text"
                    required={newPaint.brand === "Jiné"}
                    className="w-full bg-slate-800 border border-blue-500/50 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="Např. Mission Models, Alclad..."
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
                {autoDetectFound && (
                  <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                    <Wand2 size={10} /> Barva rozpoznána a automaticky vyplněna
                  </p>
                )}
                {autoDetectError && !submitError && (
                  <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                    <HelpCircle size={10} /> Barva nenalezena v databázi
                    (doplňte název ručně)
                  </p>
                )}
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

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Odstín (ruční úprava)
                </label>
                <div className="flex items-center gap-4 bg-slate-900 border border-slate-600 rounded-lg p-2">
                  <input
                    type="color"
                    className="w-10 h-10 rounded cursor-pointer border-none"
                    value={newPaint.hex}
                    onChange={(e) =>
                      setNewPaint({ ...newPaint, hex: e.target.value })
                    }
                  />
                  <span className="text-slate-400 text-sm">
                    {autoDetectFound
                      ? "Automaticky nastaveno"
                      : "Klikněte pro výběr odstínu"}
                  </span>
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
                  Uložit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
