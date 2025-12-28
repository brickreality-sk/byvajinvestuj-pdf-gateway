const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

const PDF_WORKER_URL = process.env.PDF_WORKER_URL;           // napr. https://byvajinvestuj-pdf-worker-production.up.railway.app
const PDF_WORKER_API_KEY = process.env.PDF_WORKER_API_KEY;   // tajné, ostáva len na serveri

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/export/pdf", async (req, res) => {
  const { template = "A", reportId } = req.query;

  if (!PDF_WORKER_URL || !PDF_WORKER_API_KEY) {
    return res.status(500).json({ error: "Missing env vars (PDF_WORKER_URL/PDF_WORKER_API_KEY)" });
  }
  if (!reportId) return res.status(400).json({ error: "reportId is required" });

  const url =
    `${PDF_WORKER_URL}/api/pdf?template=${encodeURIComponent(template)}&reportId=${encodeURIComponent(reportId)}`;

  try {
    const r = await fetch(url, { headers: { "x-api-key": PDF_WORKER_API_KEY } });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).send(text);
    }

    // nech sa PDF otvorí v prehliadači (s lištou)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="report-${template}-${reportId}.pdf"`);

    const buf = Buffer.from(await r.arrayBuffer());
    res.send(buf);
  } catch (e) {
    res.status(500).json({ error: "Gateway failed", message: e.message });
  }
});

app.listen(PORT, () => console.log(`PDF gateway running on port ${PORT}`));
