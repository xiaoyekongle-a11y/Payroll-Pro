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

  const prompt = `あなたは日本の給与計算ルール解析AIです。

ユーザーの指示を読み取って、適切な給与計算ルール配列に変換してください。
厳密である必要はなく、「意図を汲み取る」ことを優先してください。

## ユーザーの指示：
${body.instruction}

## ルールタイプ（完全ガイド）

**係数系（パフォーマンス評価を反映）:**
- perf_multiply   : 係数に倍率を掛ける。例）「営業部を1.2倍」→ 係数×1.2
- perf_set        : 係数を固定値に設定。例）「係数を1.5に固定」
- perf_min        : 係数の最低値を保証。例）「係数1.0未満の人を1.0に引き上げ」

**手当系（月額加算・固定）:**
- allowance_add   : 金額を加算。例）「5000円の交通費を加算」
- allowance_set   : 手当を固定額に設定。例）「管理職の手当を30000円に」

**基本給系:**
- base_multiply   : 基本給に倍率を適用。例）「基本給1.05倍」

## 対象パターン（柔軟な解釈OK）

ユーザーの表現を読み取って、以下いずれかに正規化してください：

| ユーザー表現例 | 正規化先 | target値の例 |
|---|---|---|
| 「全員」「全社」「全従業員」「みんな」 | all | "all" |
| 「営業部」「営業」「営業チーム」 | 部署名 | "dept:営業部" |
| 「部長」「マネージャー」「リーダー」 | 役職名 | "pos:部長" |
| 「田中太郎」「田中さん」「佐藤」 | 個人名 | "name:田中太郎" |
| 「営業部の部長」「営業部マネージャー」 | 複合条件 | "dept:営業部\|pos:部長" |
| 「100万円以上の給与の人」「高給者」 | 可能な範囲で推測 | "high_earners" など |

## 数値の解釈ガイド

- **金額**: 5000、5000円、5k（＝5000）など、柔軟に解釈。結果はnumber型で返す
- **倍率**: 1.2倍、×1.2、20%UP（＝1.2）など。小数点で返す
- **パーセント**: 10%UP（＝1.1）、10%カット（＝0.9）など自動変換

## 出力仕様

JSONの配列を返してください。以下のような形式です：

\`\`\`json
[
  {
    "type": "perf_multiply",
    "target": "dept:営業部",
    "value": 1.2,
    "label": "営業部の係数を1.2倍に"
  },
  {
    "type": "allowance_add",
    "target": "pos:管理職",
    "value": 5000,
    "label": "管理職に月5000円の役付手当を加算"
  }
]
\`\`\`

**重要なポイント:**
- 「何も読み取れなかった」ときだけ \`[]\` を返す
- JSONコードブロック（\`\`\`）で囲むのはOK
- 説明や前置きがあってもOK。JSONを含んでいれば検出できます
- typeに列挙されたもの以外は使用しないでください
- targetが明確でない場合、「all」か最も確度の高いものを選ぶ
- valueは必ず数値（文字列ではない）で返してください

## 例（参考）

### ユーザー入力: 「営業部を1.2倍、全員に5000円の交通費、部長以上は係数最低1.0」

\`\`\`json
[
  { "type": "perf_multiply", "target": "dept:営業部", "value": 1.2, "label": "営業部の係数を1.2倍" },
  { "type": "allowance_add", "target": "all", "value": 5000, "label": "全員に5000円の交通費" },
  { "type": "perf_min", "target": "pos:部長", "value": 1.0, "label": "部長以上の係数を1.0以上に保証" }
]
\`\`\`

### ユーザー入力: 「開発チームの給料を10%上げて」

\`\`\`json
[
  { "type": "base_multiply", "target": "dept:開発", "value": 1.1, "label": "開発部の基本給を10%アップ" }
]
\`\`\`

では、ユーザーの指示をルール配列に変換してください。`;

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
          { role: 'system', content: '日本語の給与ルール解析AIです。ユーザーの指示を理解して、JSON配列の給与ルールを返してください。完全な正確さより「意図の汲み取り」を優先します。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,  // 改善：0.0 → 0.5（柔軟性UP）
        max_tokens: 1024,
        // response_format を削除 → JSONが必須でなくなり、より自由な応答が可能
      }),
    });
    clearTimeout(timeout);

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      return res.status(502).json({ error: err?.error?.message || `Groq APIエラー: ${groqRes.status}` });
    }

    const data = await groqRes.json();
    const raw = (data?.choices?.[0]?.message?.content || '').trim();
    if (!raw) return res.status(500).json({ error: 'AIが空のレスポンスを返しました' });

    // より柔軟なJSON抽出ロジック
    const cleaned = raw.replace(/```json?|```/g, '').trim();
    let rules = [];

    try {
      // 1. JSONパース試行（全体）
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        rules = parsed;
      } else if (parsed && typeof parsed === 'object') {
        // オブジェクトの場合、配列を探す
        rules = Object.values(parsed).find(v => Array.isArray(v)) || [];
      }
    } catch {
      // 2. JSON配列を部分抽出
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          rules = JSON.parse(match[0]);
        } catch {
          // 3. 部分的な抽出失敗時はログして空配列
          console.log('[AI Parse Error] JSONパース失敗。生レスポンス:', raw.slice(0, 200));
          rules = [];
        }
      } else {
        console.log('[AI] JSONが見つかりません。生レスポンス:', raw.slice(0, 200));
        rules = [];
      }
    }

    // バリデーション＆正規化
    const VALID_TYPES = ['perf_multiply', 'perf_set', 'perf_min', 'allowance_add', 'allowance_set', 'base_multiply'];
    const validated = rules
      .filter(r => {
        // より寛容なバリデーション
        if (!r || typeof r !== 'object') return false;
        if (!VALID_TYPES.includes(r.type)) return false;
        if (typeof r.target !== 'string' || !r.target.trim()) return false;
        // valueが数値か、"1.2"のような数値文字列も許可
        const val = typeof r.value === 'number' ? r.value : parseFloat(r.value);
        return !isNaN(val) && isFinite(val);
      })
      .map(r => {
        const val = typeof r.value === 'number' ? r.value : parseFloat(r.value);
        return {
          type: r.type,
          target: r.target.trim(),
          value: val,
          label: typeof r.label === 'string' && r.label.trim() ? r.label.trim() : `${r.type}(${r.target})`
        };
      });

    console.log(`[AI Parse] "${body.instruction.slice(0, 50)}" → ${validated.length}ルール（生データ: ${rules.length}個）`);
    return res.status(200).json({ rules: validated });

  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') return res.status(504).json({ error: 'タイムアウト（20秒）' });
    return res.status(500).json({ error: e.message });
  }
};
