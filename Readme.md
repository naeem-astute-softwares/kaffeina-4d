# Kaffeina Brand Deck 4D – Web App (Static)

App statica pronta per **Cursor** e deploy su **Vercel/Netlify/GitHub Pages**.

## Uso in Cursor
1. Apri la cartella progetto.
2. Apri `index.html` con Live Server o direttamente nel browser.
3. Clicca **"Mescola e inizia"**. A fine mazzo → riepilogo + **Export JSON**.

## Collegamento Agente (facoltativo)
- Avvia `api-proxy/server.js` (Node/Express).
- Sostituisci `sendToAgent()` nel client con una `fetch` POST verso `/api/agent/analyze`.

## Deploy
**Vercel:** importa repo o `vercel` dalla root (static site).  
**Netlify:** drag & drop della cartella, build vuota, publish dir `./`.  
**GitHub Pages:** Settings → Pages → deploy from branch.
