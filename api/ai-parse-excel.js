module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON不正' }); } }
  if (!body?.headers || !body?.rows) return res.status(400).json({ error: 'headers と rows が必要です' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY未設定' });

  const { headers, rows } = body;
  const sampleRows = rows.slice(0, 10);

  const prompt = `Excelデータのフィールド自動マッピング。

ヘッダー行: ${JSON.stringify(headers)}

サンプルデータ（最大10行）:
${sampleRows.map((r, i) => `行${i + 1}: ${JSON.stringify(r)}`).join('\n')}

以下のJSON形式で返す:
{
  "mapping": {
    "name": <列番号 or null>,
    "dept": <列番号 or null>,
    "pos": <列番号 or null>,
    "base": <列番号 or null>,
    "perf": <列番号 or null>,
    "age": <列番号 or null>,
    "dep": <列番号 or null>,
    "bank": <列番号 or null>,
    "bonus": <列番号 or null>
  },
  "normalized_rows": [
    {
      "name": "正規化した氏名",
      "dept": "部署名 or null",
      "pos": "役職 or null",
      "base": 300000,
      "perf": 1.2,
      "age": 35,
      "dep": 2,
      "bank": "銀行名 or null",
      "bonus": 500000
    }
  ]
}

JSON のみ返す。`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    clearTimeout(timeout);

    if (!apiRes.ok) return res.status(502).json({ error: 'API error' });

    const data = await apiRes.json();
    const raw = (data?.content?.[0]?.text || '').trim();
    const cleaned = raw.replace(/```json?|```/g, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.mapping && parsed.normalized_rows && Array.isArray(parsed.normalized_rows)) {
        console.log('[Claude Sonnet] 成功');
        return res.status(200).json(parsed);
      }
    } catch (e) {
      console.log('[Parse Error]', e.message);
      return res.status(502).json({ error: 'Parse failed' });
    }

  } catch (e) {
    clearTimeout(timeout);
    console.error('[Error]', e.message);
    return res.status(500).json({ error: e.message });
  }
};
