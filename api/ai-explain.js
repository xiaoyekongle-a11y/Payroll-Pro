module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY が未設定です' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON不正' }); } }
  if (!body?.summary) return res.status(400).json({ error: 'summary が必要です' });

  const prompt = `以下の給与計算結果について、3〜4文で簡潔にサマリーを作成してください。
数字は具体的に、経営者・人事担当者に向けた口調で。

${JSON.stringify(body.summary)}

フォーマット: 平文（箇条書き不要）。日本語。`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',  // 軽量・高速モデル
        messages: [
          { role: 'system', content: 'あなたは日本語の給与サマリーライターです。簡潔・正確に記述してください。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 300,
      }),
    });
    clearTimeout(timeout);
    if (!groqRes.ok) return res.status(502).json({ error: `Groq APIエラー: ${groqRes.status}` });

    const data = await groqRes.json();
    const explanation = (data?.choices?.[0]?.message?.content || '').trim();
    return res.status(200).json({ explanation });

  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') return res.status(504).json({ error: 'タイムアウト' });
    return res.status(500).json({ error: e.message });
  }
};
