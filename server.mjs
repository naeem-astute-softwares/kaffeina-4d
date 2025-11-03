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

    const instructions = `
Sei un analista strategico esperto di branding.
Applichi il modello Kaffeina Brand Deck 4D:
- Essence = radici creative
- Purpose = valore umano
- Expression = innovazione e linguaggio
- Impact = azione e relazione

Ricevi i dati di un test sulle 80 carte (distribuzione per dimensione e per archetipo).
Devi restituire SOLO JSON, con questa struttura:

{
  "baseData": { "selected": number, "total": number, "byDimension": { ... } },
  "archetypeDistribution": [ { "name": string, "count": number }, ... ],
  "dominant": string[],
  "secondary": string[],
  "marginal": string[],
  "watchlist": string[],
  "strategicReading": string,
  "overallInterpretation": string,
  "positioning": string,
  "narrativeConclusion": string
}

Tono: professionale, chiaro, contemporaneo, leggermente narrativo.
Scrivi in italiano.
`;

    // Responses API: input + instructions, e JSON strutturato. :contentReference[oaicite:2]{index=2}
    const response = await client.responses.create({
      model,
      instructions,
      response_format: { type: "json_object" },
      input: [
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
      ]
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
