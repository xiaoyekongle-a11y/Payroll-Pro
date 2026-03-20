/**
 * /api/ai-explain — CalcAI 計算結果サマリー生成
 * Gemini不使用・テンプレートベースで動作（レート制限なし）
 */

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';

function fmtY(n) {
  return Math.round(n).toLocaleString('ja-JP') + '円';
}

function generateSummary(s) {
  const month   = s.month || '今月';
  const count   = Number(s.count) || 0;
  const gross   = Number(s.totalGross) || 0;
  const net     = Number(s.totalNet) || 0;
  const bonus   = Number(s.totalBonus) || 0;
  const applied = Number(s.appliedRules) || 0;

  const avgNet = count > 0 ? Math.round(net / count) : 0;
  const bonusPart = bonus > 0 ? `ボーナス支給総額は${fmtY(bonus)}です。` : '';
  const rulePart  = applied > 0 ? `今回は${applied}名にカスタムルールが適用されました。` : '';

  return `${month}の給与計算が完了しました。対象${count}名の支給額合計は${fmtY(gross)}、手取り合計は${fmtY(net)}（平均${fmtY(avgNet)}）です。${bonusPart}${rulePart}`.trim();
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

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'リクエスト形式が不正です' }); }
  }
  if (!body?.summary) return res.status(400).json({ error: 'summary が必要です' });

  const explanation = generateSummary(body.summary);
  return res.status(200).json({ explanation });
};
