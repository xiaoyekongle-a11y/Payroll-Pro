module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON error' }); }
  }
  if (!body?.instruction) return res.status(400).json({ error: 'instruction required' });

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not set' });

  const prompt = `Parse payroll rule: ${body.instruction}

Return ONLY JSON array:
[{"type":"perf_multiply","target":"dept:sales","value":1.2,"label":"Sales x1.2"}]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
        }),
      }
    );

    if (!response.ok) return res.status(502).json({ error: 'API error' });

    const data = await response.json();
    const text = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    const json = text.replace(/```json?|```/g, '').trim();
    const rules = JSON.parse(json);

    return res.status(200).json({ rules: Array.isArray(rules) ? rules : [] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
