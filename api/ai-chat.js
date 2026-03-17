module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON不正' }); } }
  if (!body?.question) return res.status(400).json({ error: 'question が必要です' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY未設定' });

  const SYSTEM_PROMPT = `Salario AutoCalc のAIアシスタント。

給与計算ルール指示に対応：
- 係数系：「営業部を1.2倍」「係数を1.5に固定」「最低1.0」
- 手当系：「全員に5000円」「管理職は月30000円」
- 基本給系：「全員1.05倍」

対象指定：
- 全員：「全員」「全社」
- 部署：「営業」「営業部」
- 役職：「部長」「マネージャー」
- 個人：氏名

簡潔で親切に対応してください。`;

  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
  if (Array.isArray(body.history)) messages.push(...body.history.slice(-10));
  messages.push({ role: 'user', content: body.question });

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
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        messages: messages,
      }),
    });
    clearTimeout(timeout);

    if (!apiRes.ok) return res.status(502).json({ error: 'API error' });

    const data = await apiRes.json();
    const answer = (data?.content?.[0]?.text || '').trim();

    if (!answer) return res.status(502).json({ error: 'Empty response' });

    console.log('[Claude Opus] チャット回答成功');
    return res.status(200).json({ answer, message_structure: { role: 'assistant', content: answer } });

  } catch (e) {
    clearTimeout(timeout);
    console.error('[Error]', e.message);
    return res.status(500).json({ error: e.message });
  }
};
```

---

## ✅ 重要なポイント
```
❌ コードだけをコピー
❌ 説明文は入れない
❌ 最後の行まで確認
