module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON error' }); }
  }
  if (!body?.question) return res.status(400).json({ error: 'question required' });

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not set' });

  const prompt = `You are Salario AutoCalc assistant. Answer payroll rule questions.

User question: ${body.question}

Be helpful and concise.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
        }),
      }
    );

    if (!response.ok) return res.status(502).json({ error: 'API error' });

    const data = await response.json();
    const answer = (data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();

    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
```

---

## 📋 修正手順
```
1. GitHub → api/ai.js
2. Edit（✏️）
3. Ctrl+A で全削除
4. 上の「正しい ai.js」コードだけをコピペ
5. Commit changes
6. 同じことを ai-parse-excel.js と ai-chat.js でもやる
