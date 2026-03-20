/**
 * /api/ai-parse-excel — CalcAI Excel列ヘッダー自動解析
 * Gemini不使用・キーワードマッチのみで動作（レート制限なし）
 */

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';

// 各フィールドのキーワード定義
const FIELD_PATTERNS = {
  name:  /氏名|名前|従業員名|社員名|スタッフ名|name/i,
  dept:  /部署|所属|部門|department|dept/i,
  pos:   /役職|職位|position|job.?title/i,
  base:  /基本給|月給|基本賃金|base.?salary|base.?pay|basic/i,
  perf:  /業績|係数|評価|成績|perf|factor/i,
  age:   /年齢|age/i,
  dep:   /扶養|被扶養|dependent/i,
  bonus: /ボーナス|賞与|bonus/i,
};

const EXPECTED_COLS = ['name', 'dept', 'pos', 'base', 'perf', 'age', 'dep', 'bonus'];

function detectHeader(rows) {
  const emptyColumns = () => Object.fromEntries(EXPECTED_COLS.map(k => [k, -1]));

  if (!rows || rows.length === 0) {
    return { headerRowIndex: 0, columns: emptyColumns() };
  }

  let bestRowIdx = 0;
  let bestMatches = 0;
  let bestColumns = emptyColumns();

  for (let rowIdx = 0; rowIdx < Math.min(rows.length, 5); rowIdx++) {
    const row = rows[rowIdx];
    if (!Array.isArray(row)) continue;

    const columns = emptyColumns();
    let matchCount = 0;

    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const cell = String(row[colIdx] ?? '').trim();
      if (!cell) continue;
      for (const [field, pattern] of Object.entries(FIELD_PATTERNS)) {
        if (columns[field] === -1 && pattern.test(cell)) {
          columns[field] = colIdx;
          matchCount++;
          break;
        }
      }
    }

    if (matchCount > bestMatches) {
      bestMatches = matchCount;
      bestRowIdx = rowIdx;
      bestColumns = columns;
    }
  }

  return { headerRowIndex: bestRowIdx, columns: bestColumns };
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
  if (!body.rows || !Array.isArray(body.rows)) {
    return res.status(400).json({ error: 'rows が必要です' });
  }

  const safeRows = body.rows
    .slice(0, 5)
    .map(row =>
      (Array.isArray(row) ? row : [])
        .slice(0, 50)
        .map(cell => String(cell ?? '').slice(0, 100))
    );

  const result = detectHeader(safeRows);
  console.log('[AI-PARSE] keyword match:', JSON.stringify(result));
  return res.status(200).json(result);
};
