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

  const prompt = `# Excelデータの自動フィールドマッピング

あなたは日本の給与・人事データをExcelから読み込むシステムのAIです。
与えられたヘッダーとサンプルデータから、各列が何のデータか推測してください。

## ヘッダー行
\`\`\`
${JSON.stringify(headers)}
\`\`\`

## サンプルデータ（最大5行）
${sampleRows.map((r, i) => `
**行${i + 1}:**
\`\`\`json
${JSON.stringify(r)}
\`\`\`
`).join('')}

---

## あなたの役目

1. **フィールドマッピング**: 各Excelの列を、以下のフィールドに割り当てる
2. **データ正規化**: サンプル行の氏名・部署・役職を、表記ゆれを統一して返す

### マッピング対象フィールド

| フィールド | 説明 | 優先度 | 例 |
|---|---|---|---|
| \`name\` | 従業員の氏名 | 🔴必須 | 田中太郎、田中 太郎 |
| \`dept\` | 部署・部門・グループ | 重要 | 営業部、開発課、営業1チーム |
| \`pos\` | 役職・肩書 | 重要 | 部長、マネージャー、プレイヤー |
| \`base\` | 基本給・月給・月額賃金 | 🔴必須 | 300000、300,000、30万 |
| \`perf\` | 業績係数・評価係数・パフォーマンス | オプション | 1.2、1.2倍、1.0 |
| \`age\` | 年齢 | オプション | 35、35歳 |
| \`dep\` | 扶養家族数 | オプション | 2、2人 |
| \`bank\` | 銀行口座・振込先 | オプション | 〇〇銀行 \|\|\| \|\|\| |
| \`bonus\` | ボーナス・賞与・一時金額 | オプション | 500000、500万 |

### マッピングのコツ

- **列番号は0始まり**: 最初の列が0、2番目が1...
- **読み取れない列**: \`null\` を返す
- **複数の候補**: 最も確度の高いものを選ぶ
  - 例）「給料」「給与」「月給」→ すべて \`base\` にマップ
  - 例）「係数」「パフォーマンス」「評価」→ すべて \`perf\` にマップ
- **別フィールド**: サンプルを見て、標準外のフィールドがあれば無視OK

### 正規化ルール

サンプル行の値を以下ルールで統一してください。

| フィールド | 正規化ルール |
|---|---|
| \`name\` | 前後の空白削除、全角⇔半角統一（全角推奨）、敬称削除（「さん」「様」など） |
| \`dept\` | 前後の空白削除、「〇〇部」「〇〇課」「〇〇チーム」を「部」「課」で統一、全角スペース削除 |
| \`pos\` | 前後の空白削除、役職を階層順に統一（部長 > 課長 > マネージャー > メンバー） |
| \`base\`, \`bonus\` | カンマ、「万」「千」削除。\`number\` 型で返す |
| \`perf\`, \`age\`, \`dep\` | 数値に統一。存在しない場合は \`null\` |
| \`bank\` | 銀行コード・口座番号は削除、銀行名と支店名のみ残す |

---

## 出力形式（JSONのみ）

\`\`\`json
{
  "mapping": {
    "name": <列番号 | null>,
    "dept": <列番号 | null>,
    "pos": <列番号 | null>,
    "base": <列番号 | null>,
    "perf": <列番号 | null>,
    "age": <列番号 | null>,
    "dep": <列番号 | null>,
    "bank": <列番号 | null>,
    "bonus": <列番号 | null>
  },
  "normalized_rows": [
    {
      "name": "正規化した氏名",
      "dept": "正規化した部署 | null",
      "pos": "正規化した役職 | null",
      "base": 数値 | null,
      "perf": 数値 | null,
      "age": 数値 | null,
      "dep": 数値 | null,
      "bank": "銀行名 支店名 | null",
      "bonus": 数値 | null
    },
    ...
  ]
}
\`\`\`

### 例

**ヘッダー:** \`["Name", "Salary", "Bonus", "Perf"]\`
**サンプル:**
- 行1: \`["太郎", 300000, 500000, 1.2]\`
- 行2: \`["花子", 280000, 400000, 1.0]\`

**出力:**
\`\`\`json
{
  "mapping": {
    "name": 0,
    "dept": null,
    "pos": null,
    "base": 1,
    "perf": 3,
    "age": null,
    "dep": null,
    "bank": null,
    "bonus": 2
  },
  "normalized_rows": [
    {
      "name": "太郎",
      "dept": null,
      "pos": null,
      "base": 300000,
      "perf": 1.2,
      "age": null,
      "dep": null,
      "bank": null,
      "bonus": 500000
    },
    {
      "name": "花子",
      "dept": null,
      "pos": null,
      "base": 280000,
      "perf": 1.0,
      "age": null,
      "dep": null,
      "bank": null,
      "bonus": 400000
    }
  ]
}
\`\`\`

---

**重要**: マッピングと正規化は独立しています。
- マッピングが完全でなくても（いくつか\`null\`があっても）OK
- 読み取れた列だけで構いません
- 正規化データも、マッピングで見つかった列のみ埋めてください`;

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
        } catch (e) {
          console.log('[Claude Parse Error]', e.message);
          // フォールバック
        }
      }
    } catch (e) {
      clearTimeout(timeout);
      console.log('[Claude API Error]', e.message);
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
          { role: 'system', content: '日本語のExcelデータパーサーです。フィールドマッピングと正規化をJSONで返してください。読み取れない列は null でOKです。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,  // 改善：0.0 → 0.5（より自然な推測）
        max_tokens: 2048,
        // response_format を削除 → より柔軟に応答
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
