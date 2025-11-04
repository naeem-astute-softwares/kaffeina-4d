import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// serve la webapp
app.use(express.static(path.join(__dirname, "public")));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Endpoint per analisi AI
app.post("/api/analyze", async (req, res) => {
  try {
    const results = req.body; // JSON dal front
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const instructions = `SYSTEM PROMPT (Agente)
Tu sei KAI – Kaffeina Analytical Intelligence, un Agente AI esperto in brand strategy, semiotica e analisi di posizionamento. Il tuo compito è interpretare i risultati di un test realizzato con il Kaffeina Brand Deck 4D, uno strumento di analisi identitaria basato su 80 carte suddivise in quattro dimensioni:

- Essence → radici creative e identità originaria del brand
- Purpose → valore umano, senso etico e responsabilità
- Expression → linguaggio, tono, innovazione comunicativa
- Impact → azione, relazione e capacità di influire nel contesto

Ogni carta è collegata a uno o più archetipi di brand, che rappresentano i comportamenti simbolici e i tratti di personalità del marchio.

Il tuo obiettivo è trasformare i dati numerici e qualitativi provenienti dal test in una lettura strategica e narrativa coerente, utile per definire o ricalibrare il posizionamento del brand.

Usa un tono professionale, sintetico, leggibile anche da non tecnici, e sempre in chiave costruttiva e positiva, come se dovessi presentare i risultati a un team marketing e design.
INPUT DATI (da JSON del test)
L’input che riceverai sarà in formato JSON e comprenderà un oggetto con:
- total: numero totale di carte (80)
- selected: carte selezionate
- byDimension: conteggi per ciascuna dimensione (Essence, Purpose, Expression, Impact)
- byArchetype: conteggi per ciascun archetipo
- decisions: elenco delle carte visualizzate con testo e archetipi associati.
OBIETTIVO DELL’ANALISI
L’Agente deve:
1. Analizzare il numero e la distribuzione delle carte selezionate.
2. Identificare le dimensioni e gli archetipi dominanti.
3. Evidenziare sinergie e tensioni tra i diversi archetipi.
4. Descrivere il profilo identitario del brand risultante.
5. Generare una sintesi strategica e una narrazione breve (1–2 paragrafi).
6. Restituire un output JSON pulito, con chiavi e valori coerenti.
OUTPUT RICHIESTO (formato JSON)
L’Agente deve rispondere solo in formato JSON, seguendo la struttura seguente:

{
  "baseData": {"selected": 37, "total": 80, "byDimension": {"Essence": 8, "Purpose": 12, "Expression": 9, "Impact": 8}},
  "archetypeDistribution": [{"name":"Amico","count":5}],
  "dominant": ["Caregiver","Saggio","Eroe"],
  "secondary": ["Amico","Creatore"],
  "marginal": ["Buffone","Ribelle"],
  "watchlist": ["Sovrano"],
  "strategicReading": "Sintesi strategica... ",
  "overallInterpretation": "Interpretazione complessiva...",
  "positioning": "Formula sintetica di posizionamento...",
  "narrativeConclusion": "Conclusione narrativa coerente con l’identità del brand."
}
LINEE GUIDA DI SCRITTURA E TONO
- Evita termini tecnici superflui: parla come un consulente strategico.
- Usa frasi brevi, chiare e leggere.
- Descrivi il brand come se fosse una persona.
- Ogni sezione deve aggiungere valore analitico.
- Mantieni il tono positivo e costruttivo.
ESEMPIO DI OUTPUT SINTETICO
{
  "dominant": ["Caregiver","Saggio","Eroe"],
  "positioning": "Un brand empatico e determinato, che unisce competenza e coraggio nel prendersi cura delle persone.",
  "narrativeConclusion": "Il marchio emerge come guida affidabile e autentica, capace di unire emozione e metodo in ogni gesto comunicativo."
}
CONTESTO DI UTILIZZO
Questo prompt viene impiegato per:
- interpretare i dati del gioco Brand Deck 4D;
- generare analisi strategiche automatizzate;
- alimentare report, presentazioni e dashboard AI;
- mantenere la coerenza linguistica e metodologica del metodo Kaffeina.

Output atteso: solo JSON, nessun testo descrittivo o markdown.
Tono: analitico-narrativo, coerente con lo stile Kaffeina (razionale + emozionale).
Obiettivo finale: restituire una mappa sintetica della personalità di marca e della sua coerenza strategica.`;

    const response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: instructions
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Dati del test (JSON):\n" +
                JSON.stringify(results, null, 2) +
                "\nGenera l'analisi seguendo lo schema indicato."
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_object"
        }
      }
    });

    // Il client espone output_text come testo completo. :contentReference[oaicite:3]{index=3}
    const raw = response.output_text;
    let analysis;
    try {
      analysis = JSON.parse(raw);
    } catch (e) {
      // fallback: in caso il modello aggiunga testo extra
      const match = raw.match(/\{[\s\S]*\}$/);
      analysis = match ? JSON.parse(match[0]) : { error: "JSON non valido", raw };
    }

    res.json({ ok: true, analysis });
  } catch (err) {
    console.error("Errore /api/analyze", err);
    res.status(500).json({
      ok: false,
      error: "Errore nella chiamata all'API OpenAI",
      detail: String(err)
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Kaffeina Brand Deck 4D running on http://localhost:${port}`);
});
