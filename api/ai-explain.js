/**
 * /api/ai-explain — CalcAI 計算結果サマリー生成
 */

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';


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
  if (!body?.summary) return res.status(400).json({ error: 'summary が必要です' });

  // 入力を許可リストで絞り込み
  const rawSummary = body.summary;
  const safeSummary = {
    count:        Number(rawSummary.count)        || 0,
    totalGross:   Number(rawSummary.totalGross)   || 0,
    totalNet:     Number(rawSummary.totalNet)     || 0,
    totalIns:     Number(rawSummary.totalIns)     || 0,
    totalTax:     Number(rawSummary.totalTax)     || 0,
    totalBonus:   Number(rawSummary.totalBonus)   || 0,
    month:        String(rawSummary.month        || '').slice(0, 10),
    appliedRules: Number(rawSummary.appliedRules) || 0,
  };

  const prompt = `以下の給与計算結果について、3〜4文で簡潔にサマリーを作成してください。
数字は具体的に、経営者・人事担当者に向けた口調で。

${JSON.stringify(safeSummary)}

フォーマット: 平文（箇条書き不要）。日本語。`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const geminiRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'gemini-1.5-flash',
          messages: [
            { role: 'system', content: 'あなたは日本語の給与サマリーライターです。簡潔・正確に記述してください。' },
            { role: 'user',   content: prompt },
          ],
          temperature: 0.4,
          max_tokens: 300,
        }),
      }
    );
    clearTimeout(timeout);

    if (!geminiRes.ok) {
      console.error('[AI-EXPLAIN] Gemini error:', geminiRes.status);
      return res.status(502).json({ error: 'AI処理に失敗しました。しばらくしてから再試行してください。' });
    }

    const data = await geminiRes.json();
    const explanation = (data?.choices?.[0]?.message?.content || '').trim();
    return res.status(200).json({ explanation: explanation.slice(0, 500) });

  } catch (e) {
    clearTimeout(timeout);
    console.error('[AI-EXPLAIN] exception:', e.message);
    if (e.name === 'AbortError') return res.status(504).json({ error: 'タイムアウトしました。再試行してください。' });
    return res.status(500).json({ error: '内部エラーが発生しました。' });
  }
};
