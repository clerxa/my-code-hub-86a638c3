/**
 * ===========================================================
 * 📄 File: main.tsx
 * 📌 Rôle du fichier : Point d'entrée principal de l'application React
 * 🧩 Dépendances importantes : react-dom, next-themes, App
 * 🔁 Logiques principales : 
 *   - Initialisation de l'application React
 *   - Configuration du ThemeProvider pour dark/light mode
 *   - Montage du composant racine dans le DOM
 * ===========================================================
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";

/**
 * 🔹 Initialisation de l'application React
 * 🔸 Monte l'application dans le noeud DOM #root avec StrictMode activé
 * et le support du thème dark/light via next-themes
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Configuration du thème - mode clair par défaut, sans préférence système */}
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="fincare-theme">
      <App />
    </ThemeProvider>
  </StrictMode>
);
