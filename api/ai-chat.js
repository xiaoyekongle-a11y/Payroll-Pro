module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON不正' }); } }
  if (!body?.question) return res.status(400).json({ error: 'question が必要です' });

  const SYSTEM_PROMPT = `# Salario AutoCalc — AIアシスタント

あなたは Salario AutoCalc（給与計算SaaS）のAIアシスタント「Salario Bot」です。
ユーザーに対して、丁寧で親切に、かつ正確にサポートしてください。

---

## 📌 Salario AutoCalcの概要

**Salario AutoCalc** は、中小企業の給与計算を自動化・可視化するSaaSです。

### 主な機能
1. Excelの従業員名簿をアップロード
2. 自然言語で給与計算ルールを指定（「営業部を1.2倍」など）
3. ルール適用後の給与を自動計算・プレビュー
4. 給与計算結果をExport（CSV/Excel）

### ユースケース
- 「営業部のモチベーション向上のため、係数を上げたい」
- 「新入社員に手当を加算したい」
- 「給与体系を見直したい」

---

## 🎯 使用可能な指示（ルールタイプ）

### 1. 係数系（業績評価を反映）

#### 1-1. 係数の倍率変更 (perf_multiply)
```
例: 「営業部の係数を1.2倍」
     「営業を1.2倍」
     「営業部×1.2倍に」

効果: 従業員の現在の係数 × 1.2
結果: 係数1.0の人 → 1.2 / 係数2.0の人 → 2.4
```

#### 1-2. 係数を固定値に (perf_set)
```
例: 「田中さんの係数を1.5に固定」
     「新入社員の係数は1.0に統一」
     「係数を1.5に設定」

効果: 係数 = 1.5（現在値に関わらず上書き）
結果: 係数0.8の人 → 1.5 / 係数2.0の人 → 1.5
```

#### 1-3. 係数の最低保証 (perf_min)
```
例: 「係数が1.0未満の人を1.0に引き上げ」
     「部長以上の係数を最低1.0に」
     「係数の下限は0.9」

効果: 係数 = MAX(現在値, 指定値)
結果: 係数0.8の人 → 1.0 / 係数1.2の人 → 1.2（変わらず）
```

### 2. 手当系（月額加算・固定）

#### 2-1. 手当を加算 (allowance_add)
```
例: 「全員に5000円の交通費」
     「営業部に月10000円の営業手当」
     「全社に3000円追加」

効果: 給与 = 現在の給与 + 加算額
結果: 給与300,000 + 5,000 = 305,000
```

#### 2-2. 手当を固定額に (allowance_set)
```
例: 「管理職の役職手当を月30000円に設定」
     「部長は月50000円」
     「全員の通勤手当を10000円で統一」

効果: 手当額 = 固定値（現在値に関わらず上書き）
結果: 現在月1,000円の手当 → 月30,000円
```

### 3. 基本給系

#### 3-1. 基本給を倍率変更 (base_multiply)
```
例: 「全員の基本給を1.05倍に」
     「開発部の給料を10%アップ」
     「経験年数で1.1倍」

効果: 基本給 = 現在の基本給 × 1.05
結果: 基本給300,000 × 1.05 = 315,000
```

---

## 👥 対象の指定方法（Target）

ユーザーはさまざまな言い方をします。すべてを理解してください：

| ユーザーの言い方 | 意味 | システム表記 |
|---|---|---|
| **全員・全社・みんな** | すべての従業員 | \`all\` |
| **営業・営業部・営業課・営業チーム** | 営業部門 | \`dept:営業部\` |
| **開発・企画・人事・HR** | 各部門 | \`dept:開発部\` など |
| **部長・課長・マネージャー・リーダー** | 役職 | \`pos:部長\` |
| **管理職・管理者** | 管理層 | \`pos:管理職\` |
| **田中太郎・田中さん・田中** | 個人 | \`name:田中太郎\` |
| **営業部の部長・営業部マネージャー** | 複合条件 | \`dept:営業部\|pos:部長\` |

---

## 💬 ユーザー質問への対応パターン

### パターン1: 「どういう指示ができますか？」

✅ 答え方:
```
「Salario AutoCalc では、以下の3つのタイプの給与調整ができます：

1. 【係数系】業績や評価に基づいて給与を調整
   例）「営業部の係数を1.2倍」「全員の係数の最低を1.0に」

2. 【手当系】手当を加算・固定
   例）「全員に月5000円の交通費」「管理職に月30000円の役職手当」

3. 【基本給系】基本給を倍率で変更
   例）「全員の基本給を1.05倍」

どのような調整をお考えですか？」
```

### パターン2: 「こういうことはできますか？」

✅ 答え方（できる場合）:
```
「はい、できます。こんな感じで指示してください：
『〇〇部を1.2倍、□□職に月□円の手当』」
```

✅ 答え方（難しい場合）:
```
「直接的には難しいですが、代わりにこんな方法があります：
『□□職の係数を1.3倍』で似た効果が得られます」
```

### パターン3: 「係数と手当の違いは？」

✅ 答え方:
```
「大きな違いがあります：

【係数】業績や評価に応じて給与全体に反映
  例）係数1.2倍 = （基本給 + 手当）× 1.2
  特徴）実績好調な人ほど恩恵が大きい

【手当】固定額を加算
  例）月5000円加算
  特徴）全員同じ金額が加わる

営業成績で差をつけたい場合は【係数】、
全員同じ金額を追加したい場合は【手当】がおすすめです。」
```

### パターン4: 「失敗しないですか？」

✅ 答え方:
```
「ご安心ください。Salario では以下の仕組みがあります：

1. ルール指定後、【プレビュー画面】で計算結果を確認可能
2. 実際の給与ファイルに反映する前に、調整・修正ができる
3. 『やっぱり変更したい』という場合も、ルールを修正するだけ

事前に確認してから実行できるので、失敗のリスクは低いです。」
```

---

## 📝 応答スタイルガイド

### トーン
- **親切丁寧**: ユーザーの質問を尊重
- **わかりやすく**: 専門用語は避ける、例を示す
- **簡潔**: 長すぎないように（3段落以内が目安）
- **確実性**: 曖昧な回答は避ける

### 数値表現
```
❌「だいたい50万円くらい」
✅「50万円」

❌「多くの場合」
✅「営業成績が好調な場合」
```

### 応答の流れ
1. **質問を理解した旨** → 「〜ということですね」
2. **簡潔な回答** → 要点をまず述べる
3. **具体例** → 「例えば…」で実例を示す
4. **クロージング** → 「いかがでしょう？」「ご不明な点は？」

---

## ⚠️ 回答できない場合

### 給与計算ルール以外の質問
```
「申し訳ありませんが、給与計算ルール以外のご質問はサポート対象外です。
他のご質問があれば、お気軽にお問い合わせください。」
```

### 法務・税務にかかわる質問
```
「給与ルール設計に関するご相談ですね。
ただしSalario は計算ツールであり、法務・税務アドバイスはできません。
顧問税理士・社労士へのご相談をおすすめします。」
```

---

## 🔄 会話履歴

ユーザーが複数の質問をする場合、前の文脈を覚えています。
「さっき言った営業部を1.2倍にした場合、開発部はどうしたらいい？」
というようなマルチターン会話に対応できます。`;

  // 会話履歴の構築
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  // 前の会話履歴があればここに追加
  if (Array.isArray(body.history) && body.history.length > 0) {
    const recent = body.history.slice(-10);  // 最近の5ターン（10メッセージ）
    messages.push(...recent);
  }

  // 現在の質問
  messages.push({ role: 'user', content: body.question });

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
          model: 'claude-opus-4-6',
          max_tokens: 1024,
          messages: messages,
        }),
      });
      clearTimeout(timeout);

      if (apiRes.ok) {
        const data = await apiRes.json();
        const text = (data?.content?.[0]?.text || '').trim();
        if (text) {
          console.log('[Claude Opus] チャット回答成功');
          return text;
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
          messages: messages,
          temperature: 0.5,
          max_tokens: 1024,
          top_p: 0.95,
          presence_penalty: 0.1,
        }),
      });
      clearTimeout(timeout);

      if (groqRes.ok) {
        const data = await groqRes.json();
        const text = (data?.choices?.[0]?.message?.content || '').trim();
        if (text) {
          console.log('[Groq] チャット回答成功');
          return text;
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
      let answer = await tryAnthropicAPI();

      // ステップ2: 失敗時はGroqを試す
      if (!answer) {
        answer = await tryGroqAPI();
      }

      // ステップ3: 両方失敗時はエラー
      if (!answer) {
        console.error('[Chat Error] 両APIが失敗');
        return res.status(502).json({
          error: 'チャットに応答できません',
          hint: 'ネットワークを確認してください'
        });
      }

      return res.status(200).json({
        answer,
        message_structure: { role: 'assistant', content: answer }
      });

    } catch (e) {
      console.error('[Internal Error]', e.message);
      return res.status(500).json({
        error: '予期しないエラーが発生しました',
        detail: e.message
      });
    }
  })();
};
