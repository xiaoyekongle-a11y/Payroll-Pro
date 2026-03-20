/**
 * /api/ai-parse-excel — CalcAI Excel列ヘッダー自動解析
 */

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';



// 429リトライ（指数バックオフ、最大3回）
async function callGeminiWithRetry(url, options, maxRetries = 3) {
  let lastStatus = 0;
  let lastText = '';
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s
      await new Promise(r => setTimeout(r, delay));
    }
    const res = await fetch(url, options);
    if (res.status !== 429) return res;
    lastStatus = res.status;
    lastText = await res.text().catch(() => '');
    console.warn(`[GEMINI] 429 rate limit, attempt ${attempt + 1}/${maxRetries}`);
  }
  // 全リトライ失敗：429をそのまま返す疑似Responseを作る
  return { ok: false, status: 429, text: async () => lastText };
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const origin = req.headers.origin || '';
  const corsOrigin = ALLOWED_ORIGIN || '*';
  if (ALLOWED_ORIGIN && origin !== ALLOWED_ORIGIN) {
    return res.status(403).json({ error: '不正なオリジンです' });
  }
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'サーバー設定エラー' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'リクエスト形式が不正です' }); }
  }
  if (!body.rows || !Array.isArray(body.rows)) {
    return res.status(400).json({ error: 'rows が必要です' });
  }

  // 入力制限：先頭5行・各セル100文字
  const safeRows = body.rows
    .slice(0, 5)
    .map(row =>
      (Array.isArray(row) ? row : [])
        .slice(0, 50)
        .map(cell => String(cell ?? '').slice(0, 100))
    );

  const systemPrompt = `あなたは給与・人事データのエクセル(CSV)解析AIです。
スプレッドシートデータの冒頭行を読み取り、ヘッダー行と各列のインデックスを特定してください。

【特定すべき項目】
- name: 従業員名、氏名など
- dept: 部署、所属など
- pos: 役職、職位など
- base: 基本給、月給など
- perf: 業績係数、評価など
- age: 年齢など
- dep: 扶養人数など
- bonus: ボーナス、賞与など

【出力形式】JSON形式のみ。見つからない項目は -1。
{
  "headerRowIndex": 整数,
  "columns": { "name":-1, "dept":-1, "pos":-1, "base":-1, "perf":-1, "age":-1, "dep":-1, "bonus":-1 }
}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const geminiRes = await callGeminiWithRetry(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'gemini-2.0-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: `以下のデータを解析してJSONを返してください:\n\n${JSON.stringify(safeRows)}` },
          ],
          temperature: 0.1,
          max_tokens: 512,
          response_format: { type: 'json_object' },
        }),
      }
    );
    clearTimeout(timeout);

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => '');
      console.error('[AI-PARSE] Gemini error:', geminiRes.status, errText.slice(0, 500));
      return res.status(502).json({ error: `AI処理に失敗しました (${geminiRes.status})。しばらくしてから再試行してください。` });
    }

    const data = await geminiRes.json();
    const raw = (data?.choices?.[0]?.message?.content || '').trim();
    const cleaned = raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim();

    try {
      const result = JSON.parse(cleaned);
      const EXPECTED_COLS = ['name', 'dept', 'pos', 'base', 'perf', 'age', 'dep', 'bonus'];
      const safeColumns = {};
      EXPECTED_COLS.forEach(k => {
        const v = Number(result?.columns?.[k]);
        safeColumns[k] = Number.isInteger(v) ? v : -1;
      });
      return res.status(200).json({
        headerRowIndex: Number.isInteger(result?.headerRowIndex) ? result.headerRowIndex : 0,
        columns: safeColumns,
      });
    } catch {
      return res.status(500).json({ error: 'AI解析結果の処理に失敗しました。' });
    }
  } catch (e) {
    clearTimeout(timeout);
    console.error('[AI-PARSE] exception:', e.message);
    if (e.name === 'AbortError') return res.status(504).json({ error: 'タイムアウトしました。再試行してください。' });
    return res.status(500).json({ error: '内部エラーが発生しました。' });
  }
};
