Modelářský Sklad - Release Notes & Dokumentace

Verze: v1.5.0 (AI Edition)
Datum: Únor 2026
Tech Stack: React (Vite), Tailwind CSS, Firebase (Firestore, Auth), Google Gemini API

📝 O Aplikaci

"Modelářský Sklad" je webová aplikace (SPA) optimalizovaná pro mobilní zařízení, která slouží modelářům k evidenci barev a chemie. Umožňuje spravovat seznam vlastněných barev ("Mám doma") a nákupní seznam ("Chci koupit").

Hlavním tahákem verze 1.5.0 je integrace umělé inteligence (Gemini), která pomáhá s evidencí a poskytuje odborné rady na základě obsahu skladu.

🚀 Klíčové Funkce (Feature Set)

1. Správa Inventáře (CRUD)

Přidávání barev: Formulář s našeptávačem značek (Tamiya, Vallejo, Gunze, atd.), typů a kódů.

Seznamy: Přepínání mezi "Mám doma" a "Chci koupit".

Rychlé akce: Tlačítko pro přesun mezi stavy (dokoupeno / spotřebováno) a mazání.

Vizuální indikace: Zobrazení hex barvy (odstínu) přímo v seznamu.

2. Cloud Synchronizace & Data

Backend: Firebase Firestore.

Warehouse ID: Unikátní identifikátor skladu umožňující sdílení dat mezi více zařízeními bez nutnosti složité registrace (zadá se jen ID).

Crowdsourcing Katalog:

Aplikace udržuje "Globální katalog" (/public/data/catalog).

Když uživatel přidá novou barvu, která v katalogu není, automaticky se tam propíše (anonymizovaně).

To slouží pro Inteligentní našeptávač pro ostatní uživatele.

3. 🧠 AI Funkce (Gemini Integration)

AI Vision (Vyfoť a přidej):

Uživatel vyfotí lahvičku barvy.

AI analyzuje obrázek, přečte text (OCR + kontext) a vrátí JSON.

Formulář se automaticky předvyplní (Značka, Kód, Název, Typ, Odstín).

AI Rádce (RAG - Retrieval-Augmented Generation):

Chatbot, který má v "systémovém kontextu" vložený aktuální seznam barev uživatele.

Příklady dotazů: "Mám ředidlo na Gunze C?", "Jakou barvu použít na německou kamufláž, když mám tohle?".

AI odpovídá s ohledem na to, co uživatel skutečně vlastní.

4. Import / Export

JSON Záloha: Kompletní export uživatelských dat.

Nákupní seznam (TXT): Vygeneruje jednoduchý textový seznam "Chci koupit" pro sdílení např. do WhatsAppu.

Import Katalogu: Administrátorská funkce pro hromadné nahrání dat do globálního katalogu.

5. UX/UI

Design: Tmavý režim (Dark Mode) šetrný k očím v dílně.

Responzivita: Plně přizpůsobeno pro mobilní telefony (velká tlačítka, sticky header).

Filtrování: Fulltextové vyhledávání a filtry podle typu barvy (Akryl, Lacquer, atd.).

⚙️ Technické Detaily pro budoucí vývoj

Datová Struktura (Firestore)

Cesta: artifacts/{appId}/public/data/paints

{
"brand": "Tamiya",
"code": "XF-1",
"name": "Flat Black",
"type": "Akryl",
"hex": "#1a1a1a",
"status": "owned" | "buy",
"warehouseId": "USER_ID_STRING",
"createdAt": timestamp
}

Logika Našeptávače

Používá funkci normalizeId, která odstraňuje mezery, pomlčky a tečky pro porovnávání (např. "XF-1" == "XF1" == "xf 1").

Konfigurace prostředí

Aplikace vyžaduje API klíče v .env nebo v globálních proměnných:

Firebase Config (API Key, Auth Domain, Project ID...)

Gemini API Key

Poznámka pro AI: Při úpravách tohoto kódu vždy dbej na zachování funkce normalizeId pro konzistenci dat a nezapomeň, že AI funkce musí mít vždy v kontextu aktuální inventoryContext (seznam barev), aby byly odpovědi relevantní.
