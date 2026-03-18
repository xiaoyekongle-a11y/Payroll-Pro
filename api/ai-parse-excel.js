cat > ai-parse-excel.js << 'EOF'
module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON error' }); }
  }
  if (!body?.headers || !body?.rows) return res.status(400).json({ error: 'headers and rows required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not set' });

  const { headers, rows } = body;
  const sample = rows.slice(0, 5);

  const prompt = `Map Excel columns to fields.

Headers: ${JSON.stringify(headers)}
Sample: ${JSON.stringify(sample)}

Return JSON:
{"mapping":{"name":0,"dept":1,"pos":2,"base":3,"perf":null,"age":null,"dep":null,"bank":null,"bonus":null},"normalized_rows":[]}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) return res.status(502).json({ error: 'API error' });

    const data = await response.json();
    const text = (data?.content?.[0]?.text || '').trim();
    const json = text.replace(/```json?|```/g, '').trim();
    const result = JSON.parse(json);

    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
EOF
