module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { 
    try { body = JSON.parse(body); } 
    catch { return res.status(400).json({ error: 'JSON不正' }); } 
  }
  if (!body?.instruction) return res.status(400).json({ error: 'instruction が必要です' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY未設定' });

  const prompt = `あなたは日本の給与計算ルール解析AI。

ユーザー指示：${body.instruction}

以下のJSON配列で返す:
[{"type":"perf_multiply","target":"dept:営業部","value":1.2,"label":"営業部×1.2"}]

ルールタイプ一覧:
- perf_multiply: 係数×倍率
- perf_set: 係数=固定値
- perf_min: 係数の最小保証
- allowance_add: 金額加算
- allowance_set: 金額固定
- base_multiply: 基本給×倍率

対象（target）:
- "all": 全員
- "dept:部署名": 部署
- "pos:役職名": 役職
- "name:氏名": 個人
- "dept:部署|pos:役職": 複合

JSON配列のみ返す。説明なし。`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
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
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error('[Anthropic Error]', res.status);
      return res.status(502).json({ error: 'API error' });
    }

    const data = await res.json();
    const raw = (data?.content?.[0]?.text || '').trim();
    const cleaned = raw.replace(/```json?|```/g, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      const rules = Array.isArray(parsed) ? parsed : [];
      const VALID_TYPES = ['perf_multiply', 'perf_set', 'perf_min', 'allowance_add', 'allowance_set', 'base_multiply'];
      
      const validated = rules
        .filter(r => r && VALID_TYPES.includes(r.type) && typeof r.target === 'string' && typeof r.value === 'number')
        .map(r => ({
          type: r.type,
          target: r.target,
          value: r.value,
          label: typeof r.label === 'string' ? r.label : `${r.type}(${r.target})`
        }));

      console.log('[Claude Opus] 成功 -', validated.length, 'ルール');
      return res.status(200).json({ rules: validated });
    } catch (e) {
      console.log('[JSON Parse Error]', e.message);
      return res.status(502).json({ error: 'Parse failed' });
    }

  } catch (e) {
    clearTimeout(timeout);
    console.error('[Error]', e.message);
    return res.status(500).json({ error: e.message });
  }
};
```

### ステップ4: GitHubで保存
```
Commit changes
→ メッセージ：「Fix ai.js - remove invalid text」
→ Commit directly to main branch
