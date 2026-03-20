/**
 * /api/ai — CalcAI 給与ルール解析
 * Gemini不使用・正規表現パターンマッチのみで動作（レート制限なし）
 */

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';

function parseRules(instruction) {
  const rules = [];

  instruction.split('\n').forEach(line => {
    const l = line.trim();
    if (!l) return;

    // ① 全員への倍率
    const mAll = l.match(/(?:全員|全社員|全スタッフ|みんな).*?(\d+\.?\d*)\s*倍/);
    if (mAll) { rules.push({ type: 'perf_multiply', target: 'all', value: Number(mAll[1]), label: '全員×' + mAll[1] + '倍' }); return; }

    // ② 基本給・給与を倍率変更（全員）
    const mBase = l.match(/(?:給与|給料|基本給).*?(?:全員|全社員)?.*?(\d+\.?\d*)\s*倍/);
    if (mBase) { rules.push({ type: 'base_multiply', target: 'all', value: Number(mBase[1]), label: '全員基本給×' + mBase[1] + '倍' }); return; }

    // ③ 部署への倍率
    const mDept = l.match(/([^\s]+[部課室グループ]).*?(\d+\.?\d*)\s*倍/);
    if (mDept) { rules.push({ type: 'perf_multiply', target: 'dept:' + mDept[1], value: Number(mDept[2]), label: mDept[1] + '×' + mDept[2] + '倍' }); return; }

    // ④ 役職への倍率
    const mPos = l.match(/([^\s]+(?:長|役|員|部長|課長|主任|マネージャー|リーダー)).*?(\d+\.?\d*)\s*倍/);
    if (mPos) { rules.push({ type: 'perf_multiply', target: 'pos:' + mPos[1], value: Number(mPos[2]), label: mPos[1] + '×' + mPos[2] + '倍' }); return; }

    // ⑤ 全員への手当追加
    const mAdd = l.match(/(?:全員|全社員).*?(\d{3,8})\s*円/);
    if (mAdd) { rules.push({ type: 'allowance_add', target: 'all', value: Number(mAdd[1]), label: '全員手当+' + mAdd[1] + '円' }); return; }

    // ⑥ 部署への手当追加
    const mDeptAdd = l.match(/([^\s]+[部課室グループ]).*?(\d{3,8})\s*円/);
    if (mDeptAdd) { rules.push({ type: 'allowance_add', target: 'dept:' + mDeptAdd[1], value: Number(mDeptAdd[2]), label: mDeptAdd[1] + '手当+' + mDeptAdd[2] + '円' }); return; }

    // ⑦ 個人への係数設定
    const mName = l.match(/([^\s]{2,10})(?:さん|の係数|の評価).*?(\d+\.?\d*)/);
    if (mName) { rules.push({ type: 'perf_set', target: 'name:' + mName[1], value: Number(mName[2]), label: mName[1] + 'の係数' + mName[2] }); return; }

    // ⑧ 係数を固定値に（全員）
    const mSet = l.match(/(?:係数|全員)\s*(\d+\.?\d*)\s*(?:固定|に設定|にする)/);
    if (mSet) { rules.push({ type: 'perf_set', target: 'all', value: Number(mSet[1]), label: '係数' + mSet[1] + '固定' }); return; }

    // ⑨ 最低係数保証
    const mMin = l.match(/(?:最低|以上|以下.*引き上げ|保証).*?(\d+\.?\d*)/);
    if (mMin) { rules.push({ type: 'perf_min', target: 'all', value: Number(mMin[1]), label: '係数最低' + mMin[1] + '保証' }); return; }

    // ⑩ 基本給に加算（全員）
    const mBaseAdd = l.match(/(?:全員|全社員).*?基本給.*?\+?(\d{3,8})\s*円/);
    if (mBaseAdd) { rules.push({ type: 'base_add', target: 'all', value: Number(mBaseAdd[1]), label: '全員基本給+' + mBaseAdd[1] + '円' }); return; }

    // ⑪ 部署への基本給倍率（%表記）
    const mDeptPct = l.match(/([^\s]+[部課室グループ]).*?[+＋](\d+\.?\d*)\s*%/);
    if (mDeptPct) { rules.push({ type: 'base_multiply', target: 'dept:' + mDeptPct[1], value: 1 + Number(mDeptPct[2]) / 100, label: mDeptPct[1] + '基本給+' + mDeptPct[2] + '%' }); return; }

    const mDeptPctMinus = l.match(/([^\s]+[部課室グループ]).*?[-－](\d+\.?\d*)\s*%/);
    if (mDeptPctMinus) { rules.push({ type: 'base_multiply', target: 'dept:' + mDeptPctMinus[1], value: 1 - Number(mDeptPctMinus[2]) / 100, label: mDeptPctMinus[1] + '基本給-' + mDeptPctMinus[2] + '%' }); return; }
  });

  return rules;
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
  if (!body?.instruction) return res.status(400).json({ error: 'instruction が必要です' });

  const instruction = String(body.instruction).slice(0, 500);
  const rules = parseRules(instruction);

  console.log(`[AI] "${instruction.slice(0, 60)}" → ${rules.length}ルール`);
  return res.status(200).json({ rules });
};
