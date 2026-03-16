module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY が設定されていません' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); } }
  if (!body) return res.status(400).json({ error: 'Empty body' });

  const { instruction } = body;
  if (!instruction || typeof instruction !== 'string') return res.status(400).json({ error: 'instruction is required' });
  if (instruction.length > 2000) return res.status(400).json({ error: '指示文が長すぎます（2000文字以内）' });

  const prompt = `あなたは給与計算ルールのパーサーです。指示文を解析してJSON配列のみを返してください。説明文・マークダウン・コードブロック不要。

指示: ${instruction}

【ルールタイプ】
- perf_multiply : 業績係数を掛け算。「N倍」「N割増」はこれ。value=倍率（例: 2倍→2.0）
- perf_set      : 業績係数を固定値に。value=係数値（例: 係数1.5→1.5）
- allowance_add : 手当金額を加算。value=円（例: 5000円→5000）

【targetフィールド】
- "all" : 全従業員
- "dept:部署名" : 特定部署（例: "dept:営業部"）
- "name:氏名" : 特定個人
- "pos:役職名" : 特定役職

【解釈ルール】
- 「給与をN倍」「全員N倍」→ perf_multiply, target:"all", value:N
- 「N割増」→ perf_multiply, value:1+N/10
- 「N%アップ」→ perf_multiply, value:1+N/100
- 「N円の手当」→ allowance_add, value:N
- 「係数をNにする」→ perf_set, value:N
- 解釈できない場合は []

【例】
「給与全員2倍」→ [{"type":"perf_multiply","target":"all","value":2.0,"label":"全員×2倍"}]
「営業部1.2倍、全員5000円手当」→ [{"type":"perf_multiply","target":"dept:営業部","value":1.2,"label":"営業部×1.2倍"},{"type":"allowance_add","target":"all","value":5000,"label":"全員手当+5000円"}]

JSON配列のみ返す:`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a Japanese payroll rule parser. Return ONLY a valid JSON array. No explanation, no markdown.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.0, max_tokens: 512,
      }),
    });
    clearTimeout(timeout);
    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      return res.status(502).json({ error: err?.error?.message || 'Groq APIエラー: ' + groqRes.status });
    }
    const data = await groqRes.json();
    const raw = (data?.choices?.[0]?.message?.content || '').trim();
    const cleaned = raw.replace(/```json?|```/g, '').trim();
    let rules;
    try {
      const parsed = JSON.parse(cleaned);
      rules = Array.isArray(parsed) ? parsed : Array.isArray(parsed.rules) ? parsed.rules : Object.values(parsed).find(v => Array.isArray(v)) || [];
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (!match) return res.status(500).json({ error: 'AIが有効なJSON配列を返しませんでした' });
      try { rules = JSON.parse(match[0]); } catch { return res.status(500).json({ error: 'JSONパースエラー' }); }
    }
    const VALID_TYPES = ['perf_multiply', 'perf_set', 'allowance_add'];
    const validated = rules.filter(r =>
      r && typeof r === 'object' && VALID_TYPES.includes(r.type) &&
      typeof r.target === 'string' && typeof r.value === 'number' && Number.isFinite(r.value)
    ).map(r => ({ type: r.type, target: r.target, value: r.value, label: typeof r.label === 'string' ? r.label : `${r.type}(${r.target})` }));
    return res.status(200).json({ rules: validated });
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') return res.status(504).json({ error: 'AIリクエストがタイムアウトしました' });
    return res.status(500).json({ error: e.message });
  }
};
