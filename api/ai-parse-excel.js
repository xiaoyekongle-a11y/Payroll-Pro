module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  if (!body?.headers || !body?.rows) {
    return res.status(400).json({ error: 'headers and rows required' });
  }

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_GEMINI_API_KEY not set' });
  }

  const { headers, rows } = body;
  const sample = rows.slice(0, 5);

  const prompt = `Map Excel columns to fields. Headers: ${JSON.stringify(headers)} Sample: ${JSON.stringify(sample)}
Return: {"mapping":{"name":0,"dept":1,"pos":2,"base":3,"perf":null,"age":null,"dep":null,"bank":null,"bonus":null},"normalized_rows":[]}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
        })
      }
    );

    if (!response.ok) {
      return res.status(502).json({ error: 'API error' });
    }

    const data = await response.json();
    const text = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    const json = text.replace(/```json?|```/g, '').trim();
    const result = JSON.parse(json);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
