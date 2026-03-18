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
  if (!body?.instruction) return res.status(400).json({ error: 'instruction が必要です' });
  if (body.instruction.length > 3000) return res.status(400).json({ error: '指示文が長すぎます（3000文字以内）' });

  // 従業員データコンテキスト
  let empContext = '';
  if (body.employees && Array.isArray(body.employees) && body.employees.length > 0) {
    const sample = body.employees.slice(0, 20).map(e =>
      `${e.name}(部署:${e.dept || '未設定'},役職:${e.pos || '未設定'},基本給:${e.base}円)`
    ).join(', ');
    empContext = `\n\n現在の従業員: ${sample}`;
  }

  const systemPrompt = `あなたは給与計算ルールのJSONパーサーです。
ユーザーの自然言語指示を以下のJSON配列に変換してください。

ルールtype一覧:
- perf_multiply: 業績係数を掛ける (value=倍率, 例:1.2)
- perf_set: 業績係数を固定 (value=係数, 例:1.5)
- perf_min: 係数の最低保証 (value=最低値, 例:1.0)
- allowance_add: 手当を追加 (value=円, 例:5000)
- allowance_set: 手当を固定 (value=円, 例:30000)
- base_multiply: 基本給を倍率変更 (value=倍率, 例:1.05)
- base_add: 基本給を加算 (value=円, 例:10000)

target一覧:
- "all": 全員
- "dept:営業部": 特定部署
- "pos:部長": 特定役職
- "name:田中": 特定個人

必ずJSON配列のみを出力。余計な説明は禁止。`;

  const userPrompt = `指示: ${body.instruction}${empContext}

上記の指示をJSON配列で出力してください。

例1: "全員の給与を2倍にする"
→ [{"type":"perf_multiply","target":"all","value":2.0,"label":"全員×2倍"}]

例2: "営業部に5000円の手当を追加"
→ [{"type":"allowance_add","target":"dept:営業部","value":5000,"label":"営業部に手当5000円追加"}]

例3: "田中さんの係数を1.5に固定して、全員に交通費3000円追加"
→ [{"type":"perf_set","target":"name:田中","value":1.5,"label":"田中の係数1.5固定"},{"type":"allowance_add","target":"all","value":3000,"label":"全員に交通費3000円"}]

例4: "開発部の基本給を+20%して、営業部を-10%する"
→ [{"type":"base_multiply","target":"dept:開発部","value":1.2,"label":"開発部基本給+20%"},{"type":"base_multiply","target":"dept:営業部","value":0.9,"label":"営業部基本給-10%"}]

JSON配列:`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

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
        temperature: 0.0,
        max_tokens: 2048,
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
    console.log('[AI] raw response:', raw.slice(0, 500));

    if (!raw) return res.status(500).json({ error: 'AIが空のレスポンスを返しました' });

    // JSONを抽出（コードブロック・余計なテキストを除去）
    let cleaned = raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim();

    // JSON配列またはオブジェクトをパース
    let rules = [];
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        rules = parsed;
      } else if (parsed && typeof parsed === 'object') {
        // {"rules": [...]} や {"result": [...]} 等に対応
        const arr = Object.values(parsed).find(v => Array.isArray(v));
        rules = arr || [];
      }
    } catch {
      // JSON全体がパースできない場合、配列部分だけ抽出
      const m = cleaned.match(/\[[\s\S]*\]/);
      if (m) {
        try { rules = JSON.parse(m[0]); } catch { /* ignore */ }
      }
    }

    console.log('[AI] parsed rules before validation:', JSON.stringify(rules));

    const VALID_TYPES = ['perf_multiply', 'perf_set', 'perf_min', 'allowance_add', 'allowance_set', 'base_multiply', 'base_add'];
    const validated = rules
      .filter(r => {
        if (!r || typeof r !== 'object') return false;
        if (!VALID_TYPES.includes(r.type)) return false;
        if (typeof r.target !== 'string') return false;
        // value を数値に変換（文字列 "1.2" も対応）
        const v = Number(r.value);
        if (!Number.isFinite(v)) return false;
        r.value = v; // 数値に正規化
        return true;
      })
      .map(r => ({
        type: r.type,
        target: r.target,
        value: r.value,
        label: typeof r.label === 'string' ? r.label : `${r.type}(${r.target}=${r.value})`
      }));

    console.log(`[AI] "${body.instruction.slice(0, 60)}" → ${validated.length}ルール`);
    return res.status(200).json({ rules: validated });

  } catch (e) {
    clearTimeout(timeout);
    console.error('[AI] exception:', e.message);
    if (e.name === 'AbortError') return res.status(504).json({ error: 'タイムアウト（25秒）' });
    return res.status(500).json({ error: e.message });
  }
};
