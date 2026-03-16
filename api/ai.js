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

  // 従業員データコンテキスト（フロントエンドから渡される）
  let empContext = '';
  if (body.employees && Array.isArray(body.employees) && body.employees.length > 0) {
    const sample = body.employees.slice(0, 30).map(e =>
      `${e.name}(部署:${e.dept || '未設定'},役職:${e.pos || '未設定'},基本給:${e.base}円,係数:${e.perf})`
    ).join('\n');
    empContext = `\n\n## 現在の従業員データ（${body.employees.length}名）\n${sample}`;
  }

  const prompt = `あなたは日本の給与計算SaaS「Salario」のルールパーサーです。
ユーザーの自然言語の指示を、給与計算ルールのJSON配列に正確に変換してください。

## ユーザーの指示
${body.instruction}
${empContext}

## ルールタイプ（type）一覧
| type | 説明 | valueの意味 |
|------|------|------------|
| perf_multiply | 業績係数を掛け算 | 倍率（例: 1.2 = 現在の係数×1.2） |
| perf_set | 業績係数を固定値にする | 固定する係数値（例: 1.5） |
| perf_min | 業績係数の最低保証 | 最低係数（例: 1.0 → 1.0未満の人だけ引き上げ） |
| allowance_add | 手当を加算 | 金額（円）（例: 5000） |
| allowance_set | 手当を固定額に設定 | 金額（円）（例: 30000） |
| base_multiply | 基本給を倍率変更 | 倍率（例: 1.05 = 基本給×1.05） |
| base_add | 基本給を加算 | 金額（円）（例: 10000） |

## target（対象）の書き方
| パターン | 意味 | 例 |
|----------|------|-----|
| "all" | 全従業員 | "all" |
| "dept:部署名" | 特定部署 | "dept:営業部" |
| "pos:役職名" | 特定役職 | "pos:部長" |
| "name:氏名" | 特定個人 | "name:田中太郎" |
| "dept:X\|pos:Y" | 複合条件（AかつB） | "dept:営業部\|pos:マネージャー" |

## 重要な変換ルール
1. 「〜を○倍にする」「〜を○倍に」→ type=perf_multiply, value=○
2. 「〜の給与を○倍」「〜の給料を○倍」→ type=base_multiply, value=○  
3. 「〜の係数を○にする」「〜の係数を○に固定」→ type=perf_set, value=○
4. 「〜に○円の手当」「〜に○円追加」「〜に○円加算」→ type=allowance_add, value=○
5. 「〜の手当を○円」「〜の手当○円に設定」→ type=allowance_set, value=○
6. 「〜の基本給を○円アップ」「〜の基本給+○円」→ type=base_add, value=○
7. 「係数が○以下/未満の人を○に」→ type=perf_min, value=○
8. 「全員」「みんな」「全社員」→ target="all"
9. 「○○部」「○○課」「○○室」→ target="dept:○○部"
10. 「部長」「課長」「マネージャー」「主任」→ target="pos:部長" 等
11. 個人名が指定された場合 → target="name:名前"

## label: ルールの日本語説明（ユーザーに表示するため必須）

## 出力形式
- JSON配列のみを出力すること
- 説明文・マークダウン記法・コードブロックは絶対に使わない
- 1つの指示に複数のルールが含まれる場合は全て配列に入れる
- 指示が理解できない場合は空配列 [] を返す

## 変換例
入力: "営業部の係数を1.2倍にして、開発部に残業手当10000円を追加"
出力:
[
  {"type":"perf_multiply","target":"dept:営業部","value":1.2,"label":"営業部の係数を1.2倍"},
  {"type":"allowance_add","target":"dept:開発部","value":10000,"label":"開発部に残業手当10000円追加"}
]

入力: "田中さんの係数を1.5に固定して、全員に交通費3000円を追加"
出力:
[
  {"type":"perf_set","target":"name:田中","value":1.5,"label":"田中さんの係数を1.5に固定"},
  {"type":"allowance_add","target":"all","value":3000,"label":"全員に交通費3000円追加"}
]

入力: "全員の給与を2倍にする"
出力:
[{"type":"perf_multiply","target":"all","value":2.0,"label":"全員の給与を2倍"}]

入力: "部長以上は係数1.3、それ以外は1.0"
出力:
[
  {"type":"perf_set","target":"pos:部長","value":1.3,"label":"部長は係数1.3に設定"},
  {"type":"perf_set","target":"all","value":1.0,"label":"全員の係数を1.0に設定"}
]`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `あなたは日本の給与計算SaaS「Salario」のAIルール解析エンジンです。
ユーザーの自然言語指示を正確にJSON配列に変換します。
絶対にJSON配列のみを出力し、説明文やマークダウンは使いません。
指示が曖昧な場合は、最も一般的な解釈を選んでください。
「倍にする」は perf_multiply を使います。
「〜円追加」「〜円の手当」は allowance_add を使います。
「〜に固定」「〜にする」は perf_set を使います。`
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.0,
        max_tokens: 2048,
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

    const cleaned = raw.replace(/```json?|```/g, '').trim();
    let rules;
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) rules = parsed;
      else if (parsed.rules && Array.isArray(parsed.rules)) rules = parsed.rules;
      else rules = Object.values(parsed).find(v => Array.isArray(v)) || [];
    } catch {
      const m = cleaned.match(/\[[\s\S]*\]/);
      if (!m) return res.status(500).json({ error: 'JSONパース失敗', raw: raw.slice(0, 500) });
      try { rules = JSON.parse(m[0]); } catch { return res.status(500).json({ error: 'JSONパースエラー' }); }
    }

    const VALID_TYPES = ['perf_multiply', 'perf_set', 'perf_min', 'allowance_add', 'allowance_set', 'base_multiply', 'base_add'];
    const validated = rules
      .filter(r => r && typeof r === 'object' && VALID_TYPES.includes(r.type) && typeof r.target === 'string' && typeof r.value === 'number' && Number.isFinite(r.value))
      .map(r => ({ type: r.type, target: r.target, value: r.value, label: typeof r.label === 'string' ? r.label : `${r.type}(${r.target})` }));

    console.log(`[AI] "${body.instruction.slice(0,80)}" → ${validated.length}ルール: ${JSON.stringify(validated)}`);
    return res.status(200).json({ rules: validated });

  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') return res.status(504).json({ error: 'タイムアウト（25秒）' });
    return res.status(500).json({ error: e.message });
  }
};
