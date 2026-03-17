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

  // サンプル行（最大10行）をAIに渡す
  const sampleRows = rows.slice(0, 10);

  const prompt = `# 【重要】日本語給与データのフィールドマッピング ＆ 正規化

あなたは日本の給与・人事Excelファイルのデータ解析AIです。
以下のExcelヘッダーとサンプルデータから、**正確に**各列をフィールドに割り当て、データを正規化してください。

## 🔴 最重要ルール

1. **JSON配列形式で返す（マークダウンコード블록なし）**
   - 説明や前置きがあってもOK
   - 最終的なJSONだけ抽出できればOK
   - ただしJSONは完全で有効である必要があります

2. **自分で検証してから返す**
   - マッピングが正しいか確認
   - データ型が正しいか確認
   - 氏名と部署が混在していないか確認
   - 信頼度が60%未満の場合は null を返す

3. **曖昧なマッピングは null**
   - 「この列が何か確実でない」→ null
   - 無理に推測しない

## 📊 入力データ

### ヘッダー行
\`\`\`
${JSON.stringify(headers)}
\`\`\`

### サンプルデータ（最大10行）
${sampleRows.map((r, i) => `
**行${i + 1}:**
${JSON.stringify(r)}
`).join('')}

---

## 📋 マッピング対象フィールド（指定順序）

| フィールド | 定義 | 必須か | マッピング例 | 検証ルール |
|---|---|---|---|---|
| \`name\` | 従業員の氏名 | 🔴YES | 列0: "太郎"、列1: "田中太郎" | 名前らしい文字列、数字なし、部署名を含まない |
| \`dept\` | 部署・部門 | ○ | 列2: "営業部"、列3: "営業" | 「部」「課」「チーム」などの部門キーワード、数字少ない |
| \`pos\` | 役職・肩書 | ○ | 列4: "部長"、列5: "マネージャー" | 「長」「長」「マネージャー」などの役職キーワード |
| \`base\` | 基本給・月給 | 🔴YES | 列6: 300000、列7: "30万" | 数値または「万」付き数値、150000～1000000の範囲が妥当 |
| \`perf\` | 業績係数・評価 | ○ | 列8: 1.2、列9: "1.2倍" | 0.5～2.0の数値、または null |
| \`age\` | 年齢 | ○ | 列10: 35、列11: "35歳" | 20～70の数値 |
| \`dep\` | 扶養家族数 | ○ | 列12: 2、列13: "2人" | 0～10の数値 |
| \`bank\` | 銀行・振込先 | ○ | 列14: "〇〇銀行" | 銀行名のキーワード |
| \`bonus\` | ボーナス・賞与 | ○ | 列15: 500000、列16: "50万" | 数値または「万」付き数値 |

---

## 🔍 マッピング判定のガイドライン

### name（氏名）の判定
✅ マッピング対象：
- 「太郎」「山田太郎」「山田 太郎」
- 「鈴木花子」
- スペースや全角あり

❌ マッピング対象外：
- 「営業部」「営業」（部署）
- 「部長」「課長」（役職）
- 「300000」（数値）
- 「1.2」（係数）

### dept（部署）の判定
✅ マッピング対象：
- 「営業部」「営業課」「営業チーム」「営業」
- 「開発部」「HR」「企画」
- 「北営業所」「東京営業」

❌ マッピング対象外：
- 「部長」「課長」（役職）
- 「300000」（数値）
- 空白や「社」のみ

### base（基本給）の判定
✅ マッピング対象：
- 300000、350000、300,000
- "30万"、"35万"
- 150,000～1,000,000の範囲

❌ マッピング対象外：
- 「基本給」「給与」（ラベル）
- 1.2、0.9（係数）
- 2、3（扶養家族数）

---

## 🛠️ 正規化ルール

### name（氏名）の正規化
```
入力：「　田中　太郎　」「田中　太郎　」「田中太郎」
→ 出力：「田中太郎」（前後の空白削除、内部の複数スペースを1つに）

入力：「田中太郎 様」「田中太郎さん」「田中太郎殿」
→ 出力：「田中太郎」（敬称削除）

入力：全角スペース「田中　太郎」
→ 出力：「田中太郎」または「田中 太郎」（半角1スペースに統一）
```

### dept（部署）の正規化
```
入力：「営業　部」「営業　　部」「営業部　」
→ 出力：「営業部」（余分なスペース削除）

入力：「営業課」「営業チーム」「営業」
→ 出力：「営業部」（「課」→「部」に統一、根拠: Excelのヘッダーを参考）

入力：「北営業所営業部」「東京営業部」
→ 出力：「営業部」（所属地や詳細は削除し、主要部署名のみ）
```

### pos（役職）の正規化
```
入力：「部　長」「部長　」「部長様」
→ 出力：「部長」

入力：「課長」「主任」「リーダー」「マネージャー」
→ 出力：「課長」（統一記号なし）

入力：複数役職「部長兼営業部長」
→ 出力：「部長」（最上位のものだけ）
```

### base（基本給）の正規化
```
入力：「300000」「300,000」「300.000」
→ 出力：300000（number型）

入力：「30万」「30万円」「¥300,000」
→ 出力：300000（number型）
```

### perf（業績係数）の正規化
```
入力：「1.2」「1.2倍」「1.2x」「×1.2」
→ 出力：1.2（number型）

入力：「120%」「+20%」
→ 出力：1.2（number型、パーセントを小数に変換）

入力：空白、「なし」、「N/A」
→ 出力：null
```

---

## 📤 必ず返す形式（JSONのみ）

\`\`\`json
{
  "mapping": {
    "name": <列番号 0-N, または null>,
    "dept": <列番号 0-N, または null>,
    "pos": <列番号 0-N, または null>,
    "base": <列番号 0-N, または null>,
    "perf": <列番号 0-N, または null>,
    "age": <列番号 0-N, または null>,
    "dep": <列番号 0-N, または null>,
    "bank": <列番号 0-N, または null>,
    "bonus": <列番号 0-N, または null>
  },
  "normalized_rows": [
    {
      "name": "正規化した氏名" (string),
      "dept": "正規化した部署" (string) または null,
      "pos": "正規化した役職" (string) または null,
      "base": 正規化した基本給 (number) または null,
      "perf": 業績係数 (number) または null,
      "age": 年齢 (number) または null,
      "dep": 扶養家族数 (number) または null,
      "bank": "銀行名" (string) または null,
      "bonus": ボーナス (number) または null
    },
    ...（入力行数分）
  ],
  "confidence": <0.0～1.0の信頼度>,
  "notes": "マッピング時の注釈（あれば）"
}
\`\`\`

---

## 📝 検証チェックリスト（回答前に確認）

- [ ] mapping.name が null でない か？（必須）
- [ ] mapping.base が null でない か？（必須）
- [ ] normalized_rows の各行に name が入っている か？
- [ ] base が数値型（文字列でない）か？
- [ ] 氏名に部署名や役職が含まれていないか？
- [ ] 部署名に氏名が含まれていないか？
- [ ] base が妥当な範囲（150,000～1,000,000）か？
- [ ] perf が0.5～2.0の範囲か？（または null）
- [ ] confidence が70%以上か？（低い場合はnullマッピングを増やす）

---

## 例（参考）

### 入力例
\`\`\`
ヘッダー: ["社員名", "部署", "給料", "係数"]
行1: ["太郎", "営業部", "300000", "1.2"]
行2: ["花子", "企画課", "280000", "1.0"]
\`\`\`

### 出力例
\`\`\`json
{
  "mapping": {
    "name": 0,
    "dept": 1,
    "pos": null,
    "base": 2,
    "perf": 3,
    "age": null,
    "dep": null,
    "bank": null,
    "bonus": null
  },
  "normalized_rows": [
    {
      "name": "太郎",
      "dept": "営業部",
      "pos": null,
      "base": 300000,
      "perf": 1.2,
      "age": null,
      "dep": null,
      "bank": null,
      "bonus": null
    },
    {
      "name": "花子",
      "dept": "企画課",
      "pos": null,
      "base": 280000,
      "perf": 1.0,
      "age": null,
      "dep": null,
      "bank": null,
      "bonus": null
    }
  ],
  "confidence": 0.95,
  "notes": "部署名「企画課」は「企画部」に統一する余地あり"
}
\`\`\`

---

では、上記ルールに従って、正確にマッピングと正規化を実行してください。`;

  // Anthropic APIを優先
  const tryAnthropicAPI = async () => {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
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
          model: 'claude-sonnet-4-20250514',  // 最高精度のSonnet 4
          max_tokens: 4096,
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
          // 基本的な構造チェック
          if (parsed.mapping && parsed.normalized_rows && Array.isArray(parsed.normalized_rows)) {
            console.log('[Claude Sonnet] 成功');
            return { ...parsed, source: 'claude-sonnet' };
          }
        } catch (e) {
          console.log('[Claude Parse Error]', e.message, '生データ:', raw.slice(0, 300));
        }
      } else {
        console.log('[Claude API Error]', apiRes.status);
      }
    } catch (e) {
      clearTimeout(timeout);
      console.log('[Claude Fetch Error]', e.message);
    }
    return null;
  };

  // Groqをフォールバック
  const tryGroqAPI = async () => {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: '日本語Excelデータパーサー。フィールドマッピングと正規化を正確に実行し、JSON形式で返してください。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,  // 精度重視
          max_tokens: 4096,
        }),
      });
      clearTimeout(timeout);

      if (groqRes.ok) {
        const data = await groqRes.json();
        const raw = (data?.choices?.[0]?.message?.content || '').trim();
        const cleaned = raw.replace(/```json?|```/g, '').trim();
        try {
          const parsed = JSON.parse(cleaned);
          if (parsed.mapping && parsed.normalized_rows && Array.isArray(parsed.normalized_rows)) {
            console.log('[Groq] 成功');
            return { ...parsed, source: 'groq' };
          }
        } catch (e) {
          console.log('[Groq Parse Error]', e.message);
        }
      }
    } catch (e) {
      clearTimeout(timeout);
      console.log('[Groq Fetch Error]', e.message);
    }
    return null;
  };

  // メイン処理
  (async () => {
    try {
      // ステップ1: Anthropic Claudeを試す
      let result = await tryAnthropicAPI();

      // ステップ2: 失敗時はGroqを試す
      if (!result) {
        result = await tryGroqAPI();
      }

      // ステップ3: 両方失敗時はエラー
      if (!result) {
        console.error('[Parse Error] 両APIが失敗');
        return res.status(502).json({
          error: 'AI解析に失敗しました。別のAPIを試してください',
          hint: 'Excelフォーマットが標準的か確認してください'
        });
      }

      // ステップ4: 結果の検証
      if (!result.mapping) {
        console.error('[Validation Error] mappingなし');
        return res.status(502).json({ error: 'AI結果の形式が不正です' });
      }

      // 必須フィールドチェック
      if (result.mapping.name === null && result.mapping.base === null) {
        console.error('[Validation Error] nameとbaseが両方null');
        return res.status(502).json({
          error: '氏名列と基本給列が特定できません。Excelのヘッダーを確認してください',
          mapping: result.mapping
        });
      }

      // ステップ5: 追加的なデータクリーニング
      if (result.normalized_rows && Array.isArray(result.normalized_rows)) {
        result.normalized_rows = result.normalized_rows.map(row => {
          // 数値型の強制
          if (row.base && typeof row.base === 'string') {
            row.base = parseInt(String(row.base).replace(/[^\d]/g, '')) || 0;
          }
          if (row.bonus && typeof row.bonus === 'string') {
            row.bonus = parseInt(String(row.bonus).replace(/[^\d]/g, '')) || 0;
          }
          if (row.perf && typeof row.perf === 'string') {
            row.perf = parseFloat(row.perf) || 1.0;
          }
          // 氏名クリーニング：部署や役職が混ざっていないか
          if (row.name) {
            row.name = String(row.name)
              .replace(/[（(][\s\S]*[）)]/g, '')  // 括弧内削除
              .replace(/[【【\[][\s\S]*[】\]]/g, '')  // 括弧削除
              .replace(/\s+/g, ' ')  // 複数スペースを1つに
              .trim();
          }
          // 部署クリーニング
          if (row.dept) {
            row.dept = String(row.dept)
              .replace(/[（(][\s\S]*[）)]/g, '')
              .replace(/\s+/g, '')  // 部署ではスペース削除
              .trim();
          }
          return row;
        });
      }

      console.log(`[Parse Complete] ${result.normalized_rows?.length || 0}行を正規化`);
      return res.status(200).json(result);

    } catch (e) {
      console.error('[Internal Error]', e.message);
      return res.status(500).json({
        error: '予期しないエラーが発生しました',
        detail: e.message
      });
    }
  })();
};
