cat > ai.js << 'EOF'
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not set' });

  const prompt = `Parse payroll rule: ${body.instruction}

Return JSON array only:
[{"type":"perf_multiply","target":"dept:sales","value":1.2,"label":"Sales x1.2"}]`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) return res.status(502).json({ error: 'API error' });

    const data = await response.json();
    const text = (data?.content?.[0]?.text || '').trim();
    const json = text.replace(/```json?|```/g, '').trim();
    const rules = JSON.parse(json);

    return res.status(200).json({ rules: Array.isArray(rules) ? rules : [] });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
EOF
