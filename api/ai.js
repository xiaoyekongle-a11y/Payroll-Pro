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
  if (!body?.instruction) return res.status(400).json({ error: 'instruction が必要です' });
  if (body.instruction.length > 3000) return res.status(400).json({ error: '指示文が長すぎます（3000文字以内）' });

  // プロンプトをJSONオブジェクト形式（{ "rules": [...] }）を返すように明確化
  const prompt = `あなたは日本の高度な給与計算ルールパーサーです。
以下の自然言語による指示を解釈し、指定されたフォーマットのJSONオブジェクトに変換してください。

指示: ${body.instruction}

## ルールタイプ（type）
- base_add        : 基本給を加算（例: 全員10000円アップ） value=金額
- base_multiply   : 基本給を倍率変更 value=倍率（例: 1.05）
- perf_multiply   : 業績係数を掛け算 value=倍率（例: 1.2）
- perf_set        : 業績係数を固定値 value=係数値（例: 1.0）
- perf_min        : 業績係数の最低保証 value=最低係数（例: 1.0）
- allowance_add   : 支給手当を加算 value=金額（例: 5000）
- allowance_set   : 支給手当を固定額に設定 value=金額
- deduction_add   : 天引き（控除）を追加 value=金額（例: 親睦会費1000）
- bonus_multiply  : ボーナスをNヶ月分に変更 value=倍率（例: 3ヶ月分なら 3.0）
- bonus_add       : ボーナス支給額に特別加算 value=金額（例: 特別賞与100000）
- bonus_set       : ボーナス支給額を固定値に上書き value=金額

## target（対象）
- "all"             : 全従業員
- "dept:部署名"     : 特定部署（例: "dept:営業部"）
- "pos:役職名"      : 特定役職（例: "pos:部長"）
- "name:氏名"       : 特定個人（例: "name:田中太郎"）
- "dept:X|pos:Y"    : 複合条件・部署かつ役職（例: "dept:営業部|pos:マネージャー"）

## 出力ルール
- 以下の形式のJSONオブジェクトのみを出力すること。説明文は一切不要。
{
  "rules": [
    {"type":"bonus_multiply", "target":"dept:営業部", "value":3.0, "label":"営業部のボーナスを3ヶ月分に"},
    {"type":"base_add", "target":"all", "value":10000, "label":"全員に一律10000円アップ"},
    {"type":"deduction_add", "target":"all", "value":1000, "label":"親睦会費として全員から1000円天引き"}
  ]
}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You must output ONLY a JSON object containing a "rules" array.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.0,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    });
    clearTimeout(timeout);

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      return res.status(502).json({ error: err?.error?.message || `Groq APIエラー: ${groqRes.status}` });
    }

    const data = await groqRes.json();
    const raw  = (data?.choices?.[0]?.message?.content || '').trim();
    if (!raw) return res.status(500).json({ error: 'AIが空のレスポンスを返しました' });

    let parsed;
    try {
      // Markdownの ```json ... ``` を除去してパース
      const cleaned = raw.replace(/```json?|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ error: 'JSONパース失敗', raw: raw.slice(0, 300) });
    }

    // AIが "rules" 配列を返さなかった場合のフォールバック（オブジェクトの中の最初の配列を探す）
    let rules = parsed.rules || Object.values(parsed).find(v => Array.isArray(v)) || [];
    if (!Array.isArray(rules)) rules = [rules]; // 単一オブジェクトで返してきた場合の救済

    const VALID_TYPES = [
      'base_add', 'base_multiply', 'perf_multiply', 'perf_set', 'perf_min', 
      'allowance_add', 'allowance_set', 'deduction_add', 
      'bonus_multiply', 'bonus_add', 'bonus_set'
    ];

    // 文字列で数値が返ってきても許容するように Number(r.value) で変換する
    const validated = rules
      .filter(r => r && typeof r === 'object' && VALID_TYPES.includes(r.type) && typeof r.target === 'string')
      .map(r => ({
        type: r.type,
        target: r.target,
        value: Number(r.value) || 0,
        label: typeof r.label === 'string' ? r.label : `${r.type}(${r.target})`
      }))
      // 変換後、NaNなどの不正な数値でないものだけ残す
      .filter(r => Number.isFinite(r.value));

    console.log(`[AI] "${body.instruction.slice(0,50)}" → ${validated.length}ルール`);
    return res.status(200).json({ rules: validated });

  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') return res.status(504).json({ error: 'タイムアウト（20秒）' });
    return res.status(500).json({ error: e.message });
  }
};
