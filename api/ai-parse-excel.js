module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY が未設定です' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON不正' }); } }
  if (!body.rows || !Array.isArray(body.rows)) return res.status(400).json({ error: 'rows が必要です' });

  const systemPrompt = `あなたは給与・人事データのエクセル(CSV)解析AIです。
ユーザーから提供されるスプレッドシートデータの冒頭行（2D配列形式JSON）を読み取り、
どの行が「ヘッダー行（列名が書かれた行）」か、そして各必須項目が「何列目（0開始のインデックス）」にあるかを特定してください。

【特定すべき項目】
- name: 従業員名、氏名、名前など
- dept: 部署、部門コード、所属など
- pos: 役職、職位、等級など
- base: 基本給、月給、基本賃金など
- perf: 業績係数、評価、倍率など
- age: 年齢、生年など
- dep: 扶養人数、家族数など
- bank: 銀行口座、振込先口座など
- bonus: ボーナス、賞与額、特別手当など

【出力形式】
必ず以下のJSON形式のみを出力してください。見つからない項目は -1 を設定してください。
{
  "headerRowIndex": (ヘッダー行のインデックス番号、0以上の整数),
  "columns": {
    "name": (該当列インデックス),
    "dept": (該列インデックス),
    "pos": (該当列インデックス),
    "base": (該当列インデックス),
    "perf": (該当列インデックス),
    "age": (該当列インデックス),
    "dep": (該当列インデックス),
    "bank": (該当列インデックス),
    "bonus": (該当列インデックス)
  }
}`;

  const userPrompt = `以下のデータを解析してJSONを返してください:\n\n${JSON.stringify(body.rows)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 1024,
        response_format: { type: 'json_object' }
      }),
    });
    clearTimeout(timeout);

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      console.error('[AI] Gemini error:', geminiRes.status, JSON.stringify(err));
      return res.status(502).json({ error: err?.error?.message || `Gemini APIエラー: ${geminiRes.status}` });
    }

    const data = await geminiRes.json();
    const raw = (data?.choices?.[0]?.message?.content || '').trim();
    let cleaned = raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim();

    try {
      const result = JSON.parse(cleaned);
      return res.status(200).json(result);
    } catch {
      return res.status(500).json({ error: 'AIが不正なJSONを返却しました。' });
    }
  } catch (e) {
    clearTimeout(timeout);
    console.error('[AI] exception:', e.message);
    if (e.name === 'AbortError') return res.status(504).json({ error: 'タイムアウト（20秒）' });
    return res.status(500).json({ error: e.message });
  }
};
