module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON不正' }); } }
  if (!body?.instruction) return res.status(400).json({ error: 'instruction が必要です' });
  if (body.instruction.length > 3000) return res.status(400).json({ error: '指示文が長すぎます（3000文字以内）' });

  const prompt = `# 【重要】日本の給与計算ルール解析

あなたは給与計算システムのルール解析AIです。
ユーザーの自然言語指示を、正確な給与計算ルール配列に変換してください。

## 🔴 最重要ルール

1. **JSON配列形式で返す**
   - 説明や前置きがあってもOK
   - マークダウンコードブロック付きでOK
   - 最終的に有効なJSONがあれば検出します

2. **正確性が最優先**
   - 「多少不確実なら、配列に含める」という戦略は禁止
   - 信頼度が80%以上の場合だけルールに追加
   - 不確実なら【何も返さない】ことを優先

3. **ユーザーの意図を汲み取る**
   - 「営業」「営業部」「営業課」→ すべて dept:営業部
   - 「1.2倍」「×1.2」「20%UP」→ すべて value: 1.2
   - 「管理職」「管理者」「マネージャー」→ すべて pos:管理職

---

## 📋 ユーザー指示

\`\`\`
${body.instruction}
\`\`\`

---

## 📚 ルールタイプ（完全ガイド）

### 係数系（業績評価を反映）

#### perf_multiply: 係数に倍率を掛ける
\`\`\`
用法: 「営業部の係数を1.2倍」「営業部×1.2倍」「営業部を1.2倍に」
効果: 従業員の係数 × 1.2
例: 係数1.0の人 → 1.2 / 係数2.0の人 → 2.4
\`\`\`

#### perf_set: 係数を固定値に設定
\`\`\`
用法: 「田中さんの係数を1.5に固定」「係数を1.5に設定」
効果: 係数 = value（どうなっていても、この値に上書き）
例: 係数0.8の人 → 1.5 / 係数2.0の人 → 1.5
\`\`\`

#### perf_min: 係数の最低値を保証
\`\`\`
用法: 「係数が1.0未満の人を1.0に引き上げ」「係数の最低は1.0」
効果: 係数 = MAX(現在の係数, value)
例: 係数0.8の人 → 1.0 / 係数1.2の人 → 1.2（変わらず）
\`\`\`

### 手当系（月額加算・固定）

#### allowance_add: 金額を加算
\`\`\`
用法: 「全員に5000円の交通費」「営業部に10000円の営業手当」
効果: 月給＋ value
例: 給与300,000 + 5,000 = 305,000
\`\`\`

#### allowance_set: 手当を固定額に設定
\`\`\`
用法: 「管理職の役職手当を30000円に設定」「部長は月50000円」
効果: 手当額 = value（上書き）
例: 現在1,000円の手当 → 30,000円
\`\`\`

### 基本給系

#### base_multiply: 基本給に倍率を適用
\`\`\`
用法: 「全員の基本給を1.05倍」「開発部の給料を10%アップ」
効果: 基本給 × value
例: 300,000 × 1.05 = 315,000
\`\`\`

---

## 🎯 対象指定（target）のマッピング

| ユーザー表現 | 解釈 | target値 |
|---|---|---|
| 「全員」「全社」「全従業員」「みんな」 | 全対象 | \`"all"\` |
| 「営業部」「営業」「営業課」「営業チーム」 | 部署 | \`"dept:営業部"\` |
| 「開発」「企画」「人事」 | 部署 | \`"dept:開発部"\` |
| 「部長」「課長」「マネージャー」「リーダー」 | 役職 | \`"pos:部長"\` |
| 「管理職」「管理者」 | 役職 | \`"pos:管理職"\` |
| 「田中太郎」「田中さん」「田中」 | 個人 | \`"name:田中太郎"\` |
| 「営業部の部長」「営業部マネージャー」 | 複合 | \`"dept:営業部\|pos:部長"\` |

---

## 🔢 数値の解釈

### 倍率
\`\`\`
「1.2倍」「×1.2」「1.2x」 → 1.2
「20%UP」「+20%」 → 1.2
「10%カット」「-10%」 → 0.9
\`\`\`

### 金額
\`\`\`
「5000」「5000円」「5,000円」 → 5000
「5k」「5K」 → 5000
「50万」「50万円」 → 500000
\`\`\`

---

## ✅ 検証チェックリスト（回答前に確認）

ユーザーの指示文に対して、以下を確認して から回答してください。

- [ ] ルールのtype が有効か？（perf_multiply など）
- [ ] target が指定されているか、曖昧でないか？
  - 「営業」だけ → dept:営業部 に統一
  - 「部長」だけ → pos:部長 に統一
  - 「全員」「全社」 → all に統一
- [ ] value が数値型か？（文字列でない）
  - 「1.2倍」→ 1.2
  - 「5000円」→ 5000
- [ ] label が日本語で明確か？
  - ユーザーが指示した内容を日本語で説明
- [ ] 複数ルールの場合、順序は正しいか？
  - 同じ対象なら、重要度順に並べる
- [ ] 矛盾するルールはないか？
  - 「係数を1.2倍」と「係数を1.5に固定」→ 後者を優先

---

## 📤 返す形式（JSONのみ）

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
    "target": "all",
    "value": 5000,
    "label": "全員に月5000円の交通費を加算"
  },
  {
    "type": "perf_min",
    "target": "pos:部長",
    "value": 1.0,
    "label": "部長以上の係数を1.0以上に保証"
  }
]
\`\`\`

---

## ❓ よくある質問

### Q1: ユーザーが「営業部マネージャーの係数を1.5倍」と言った場合？
**A:** 複合条件です。
\`\`\`json
{
  "type": "perf_multiply",
  "target": "dept:営業部|pos:マネージャー",
  "value": 1.5,
  "label": "営業部のマネージャーの係数を1.5倍"
}
\`\`\`

### Q2: 「営業部を1.2倍、開発部を1.5倍」と言った場合？
**A:** 別ルールにします。
\`\`\`json
[
  {
    "type": "perf_multiply",
    "target": "dept:営業部",
    "value": 1.2,
    "label": "営業部の係数を1.2倍"
  },
  {
    "type": "perf_multiply",
    "target": "dept:開発部",
    "value": 1.5,
    "label": "開発部の係数を1.5倍"
  }
]
\`\`\`

### Q3: 何も読み取れない場合？
**A:** 空配列を返す。
\`\`\`json
[]
\`\`\`

---

## 📝 例

### 例1: シンプルなルール
**ユーザー入力:**
\`\`\`
営業部の係数を1.2倍、全員に5000円
\`\`\`

**出力:**
\`\`\`json
[
  {
    "type": "perf_multiply",
    "target": "dept:営業部",
    "value": 1.2,
    "label": "営業部の係数を1.2倍"
  },
  {
    "type": "allowance_add",
    "target": "all",
    "value": 5000,
    "label": "全員に5000円を加算"
  }
]
\`\`\`

### 例2: 複雑なルール
**ユーザー入力:**
\`\`\`
営業部を1.2倍、管理職に月30000円の手当、係数が1.0未満の人は1.0に引き上げ
\`\`\`

**出力:**
\`\`\`json
[
  {
    "type": "perf_multiply",
    "target": "dept:営業部",
    "value": 1.2,
    "label": "営業部の係数を1.2倍"
  },
  {
    "type": "allowance_set",
    "target": "pos:管理職",
    "value": 30000,
    "label": "管理職の役職手当を月30000円に設定"
  },
  {
    "type": "perf_min",
    "target": "all",
    "value": 1.0,
    "label": "全員の係数を最低1.0に保証"
  }
]
\`\`\`

---

では、上記ルールに従って、ユーザーの指示をルール配列に変換してください。`;

  // Anthropic APIを優先
  const tryAnthropicAPI = async () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'claude-opus-4-6',  // 最高精度のOpus 4
          max_tokens: 1024,
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
          const rules = Array.isArray(parsed) ? parsed : [];
          if (rules.length >= 0) {
            console.log('[Claude Opus] 成功 -', rules.length, 'ルール');
            return rules;
          }
        } catch (e) {
          console.log('[Claude Parse Error]', e.message);
        }
      }
    } catch (e) {
      clearTimeout(timeout);
      console.log('[Claude API Error]', e.message);
    }
    return null;
  };

  // Groqをフォールバック
  const tryGroqAPI = async () => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return null;

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
            { role: 'system', content: '日本の給与計算ルールパーサーです。ユーザー指示をJSON配列に変換してください。精度が最優先です。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,  // 精度重視（より厳格に）
          max_tokens: 1024,
        }),
      });
      clearTimeout(timeout);

      if (groqRes.ok) {
        const data = await groqRes.json();
        const raw = (data?.choices?.[0]?.message?.content || '').trim();
        const cleaned = raw.replace(/```json?|```/g, '').trim();
        try {
          const parsed = JSON.parse(cleaned);
          const rules = Array.isArray(parsed) ? parsed : [];
          if (rules.length >= 0) {
            console.log('[Groq] 成功 -', rules.length, 'ルール');
            return rules;
          }
        } catch (e) {
          console.log('[Groq Parse Error]', e.message);
        }
      }
    } catch (e) {
      clearTimeout(timeout);
      console.log('[Groq API Error]', e.message);
    }
    return null;
  };

  // メイン処理
  (async () => {
    try {
      // ステップ1: Anthropic Claudeを試す
      let rules = await tryAnthropicAPI();

      // ステップ2: 失敗時はGroqを試す
      if (rules === null) {
        rules = await tryGroqAPI();
      }

      // ステップ3: 両方失敗時はエラー
      if (rules === null) {
        console.error('[Parse Error] 両APIが失敗');
        return res.status(502).json({
          error: 'AI解析に失敗しました',
          hint: 'ネットワークを確認するか、別の指示を試してください'
        });
      }

      // ステップ4: ルールの検証＆正規化
      const VALID_TYPES = ['perf_multiply', 'perf_set', 'perf_min', 'allowance_add', 'allowance_set', 'base_multiply'];
      
      const validated = rules
        .filter(r => {
          // 基本的な型チェック
          if (!r || typeof r !== 'object') {
            console.warn('[Validation] 無効なルール:', r);
            return false;
          }
          
          // 必須フィールド
          if (!VALID_TYPES.includes(r.type)) {
            console.warn('[Validation] 無効なtype:', r.type);
            return false;
          }
          if (typeof r.target !== 'string' || !r.target.trim()) {
            console.warn('[Validation] 無効なtarget:', r.target);
            return false;
          }

          // value: 数値チェック
          let val = r.value;
          if (typeof val === 'string') {
            val = parseFloat(val);
          }
          if (typeof val !== 'number' || !isFinite(val)) {
            console.warn('[Validation] 無効なvalue:', r.value);
            return false;
          }

          return true;
        })
        .map(r => {
          // 数値の正規化
          let val = r.value;
          if (typeof val === 'string') {
            val = parseFloat(val);
          }

          // targetの正規化
          let target = r.target.trim();
          // 「営業」→「dept:営業部」のように補完する
          if (!target.includes(':') && !target.includes('|')) {
            // デフォルトは all と判定
            if (target.match(/^(全員|全社|みんな|全従業員)$/)) {
              target = 'all';
            } else {
              // その他は読み取り不可
              console.warn('[Normalization] targetを正規化できません:', r.target);
            }
          }

          return {
            type: r.type,
            target: target,
            value: val,
            label: typeof r.label === 'string' && r.label.trim() 
              ? r.label.trim() 
              : `${r.type}(${target})`
          };
        });

      console.log(`[AI Parse] "${body.instruction.slice(0, 50)}" → ${validated.length}ルール`);
      return res.status(200).json({ rules: validated });

    } catch (e) {
      console.error('[Internal Error]', e.message);
      return res.status(500).json({
        error: '予期しないエラーが発生しました',
        detail: e.message
      });
    }
  })();
};
