module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON不正' }); } }
  if (!body?.headers || !body?.rows) return res.status(400).json({ error: 'headers と rows が必要です' });

  const { headers, rows } = body;

  // サンプル行（最大5行）をAIに渡す
  const sampleRows = rows.slice(0, 5);

  const prompt = `あなたは日本語の給与データパーサーです。
以下のExcelヘッダー行とサンプルデータを分析して、各列が何を表しているか判定してください。

ヘッダー行: ${JSON.stringify(headers)}

サンプルデータ（最大5行）:
${sampleRows.map((r, i) => `行${i + 1}: ${JSON.stringify(r)}`).join('\n')}

以下のフィールドへのマッピングをJSON形式で返してください:
- name: 氏名・名前・従業員名など（必須）
- dept: 部署・部門・所属など
- pos: 役職・職位・ポジションなど
- base: 基本給・基本賃金・月給・給与額など（必須）
- perf: 業績係数・評価係数・パフォーマンス係数など（なければnull）
- age: 年齢・満年齢など（なければnull）
- dep: 扶養家族数・家族数など（なければnull）
- bank: 銀行名・振込先など（なければnull）
- bonus: ボーナス・賞与・一時金など（なければnull）

各フィールドに対して、対応するヘッダー列のインデックス（0始まり）を返してください。
対応する列がない場合はnullを返してください。

また、各行の「氏名」と「役職」の値を正規化してください（スペースの統一、全角/半角の統一など）。

出力形式（JSONのみ、説明不要）:
{
  "mapping": {
    "name": 列インデックスまたはnull,
    "dept": 列インデックスまたはnull,
    "pos": 列インデックスまたはnull,
    "base": 列インデックスまたはnull,
    "perf": 列インデックスまたはnull,
    "age": 列インデックスまたはnull,
    "dep": 列インデックスまたはnull,
    "bank": 列インデックスまたはnull,
    "bonus": 列インデックスまたはnull
  },
  "normalized_rows": [
    {
      "name": "正規化した氏名",
      "dept": "正規化した部署名",
      "pos": "正規化した役職名",
      "base": 数値,
      "perf": 数値またはnull,
      "age": 数値またはnull,
      "dep": 数値またはnull,
      "bank": "文字列またはnull",
      "bonus": 数値またはnull
    }
  ]
}`;

  // Anthropic Claude APIを使用
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      clearTimeout(timeout);
      if (apiRes.ok) {
        const data = await apiRes.json();
        const raw = (data?.content?.[0]?.text || '').trim();
        const cleaned = raw.replace(/```json?|```/g, '').trim();
        try {
          const parsed = JSON.parse(cleaned);
          return res.status(200).json({ ...parsed, source: 'claude' });
        } catch { /* fall through to GROQ */ }
      }
    } catch (e) {
      clearTimeout(timeout);
    }
  }

  // フォールバック: Groq
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: 'APIキーが未設定です' });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'あなたは日本語Excelデータパーサーです。JSONのみ返してください。説明不要。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.0,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
    });
    clearTimeout(timeout);
    if (!groqRes.ok) return res.status(502).json({ error: `APIエラー: ${groqRes.status}` });
    const data = await groqRes.json();
    const raw = (data?.choices?.[0]?.message?.content || '').trim();
    const cleaned = raw.replace(/```json?|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return res.status(200).json({ ...parsed, source: 'groq' });
  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') return res.status(504).json({ error: 'タイムアウト' });
    return res.status(500).json({ error: e.message });
  }
};
