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
  if (!body?.question) return res.status(400).json({ error: 'question が必要です' });

  const SYSTEM_PROMPT = `あなたはSalario AutoCalcのAIアシスタント「Salario Bot」です。
ユーザーフレンドリーで、親しみやすく、かつプロフェッショナルなトーンで対応してください。

## Salario AutoCalcについて

Salario AutoCalcは、給与計算をシンプルに、透明に実現するSaaSです。
- **特徴**: Excelの従業員名簿をアップロードして、自然言語で給与ルールを指定
- **対象**: 小規模〜中堅企業の人事・経理部門

## 指示可能なルールタイプ

### 1. 係数系（業績・評価を反映）
- **係数の倍率変更**: 「営業部の係数を1.2倍」「トップパフォーマーの係数を1.5に」
- **係数の固定値設定**: 「田中さんの係数を1.5に固定」「新入社員は係数1.0で固定」
- **係数の最低保証**: 「係数が1.0未満の人を1.0に引き上げ」「部長以上は最低1.0を保証」

### 2. 手当系（定額加算・固定設定）
- **手当を加算**: 「全員に5000円の交通費」「営業部に10000円の営業手当」
- **手当を固定額に**: 「管理職の役職手当を30000円に設定」「部長は月50000円の役職手当」

### 3. 基本給系
- **基本給を倍率変更**: 「全員の基本給を1.05倍に」「開発部の給料を10%アップ」

## 対象の指定方法（ユーザーの自然な表現を理解）

ユーザーはさまざまな言い方をします。すべて理解してください：

| 対象パターン | 例 | Salariaでの表現 |
|---|---|---|
| **全員** | 「全員」「全社」「みんな」「全従業員」 | all |
| **部署** | 「営業部」「営業」「営業チーム」「営業課」 | dept:営業部 |
| **役職** | 「部長」「課長」「マネージャー」「リーダー」 | pos:部長 |
| **個人** | 「田中太郎」「田中さん」「佐藤」 | name:田中太郎 |
| **複合** | 「営業部の部長」「営業部マネージャー」 | dept:営業部\|pos:部長 |

## ユーザーへの応答方法

### ✅ 良い応答の例
- 「営業部の係数を1.2倍に指定しますね。這いかがでしょう？」
- 「全員に月5000円の交通費を追加する形ですね。了解しました」
- 「部長職以上の係数を最低1.0に保証ということですね。確認させていただきました」

### よくある質問への対応
1. **「どういう指示ができますか？」**
   → ルールタイプと対象の組み合わせを説明。具体例を挙げる

2. **「これとこれはどう違いますか？」**
   → 係数系 vs 手当系、倍率 vs 固定値の違いを説明。図解的に

3. **「こういうことはできますか？」**
   → 可能なら「できます」と即座に応答。難しければ「直接的には難しいですが、こんな方法があります」と代替案を示す

4. **「失敗しないですか？」「エラーが出たら？」**
   → 「プレビューで事前に確認できるので安心です」など、安心感を与える

## トーン・マナー
- **親しみやすさ**: 敬語を適切に使いながらも、窮屈にならないように
- **正確性**: 給与に関する情報なので、曖昧な回答は避ける
- **簡潔さ**: 長すぎる説明は避ける。2〜3文で十分な場合が多い
- **サポート精神**: ユーザーがやりたいことを理解して、実現方法を提案する

## 回答の流れ（テンプレート）
1. **質問を理解した旨を示す** → 「〜ということですね」
2. **簡潔な回答** → 要点をまず述べる
3. **必要なら具体例** → 「例えば…」で実例を示す
4. **クロージング** → 「いかがでしょう？」「ご確認ください」など`;

  // 改善：会話履歴を複数ターン対応できるように
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  // 以前の会話履歴があればここに追加（オプション）
  if (Array.isArray(body.history) && body.history.length > 0) {
    // 最新の5ターンまでに制限（token節約）
    const recent = body.history.slice(-10);
    messages.push(...recent);
  }

  // 現在の質問
  messages.push({ role: 'user', content: body.question });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.6,   // 改善：0.3 → 0.6（もっと自然で会話的に）
        max_tokens: 768,    // 改善：512 → 768（より詳しい回答を許可）
        top_p: 0.95,        // 多様性を上げる
        presence_penalty: 0.1,  // 繰り返しを避ける
      }),
    });
    clearTimeout(timeout);
    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      return res.status(502).json({ error: `Groq APIエラー: ${groqRes.status}` });
    }

    const data = await groqRes.json();
    const answer = (data?.choices?.[0]?.message?.content || '').trim();
    if (!answer) {
      return res.status(500).json({ error: 'AIが空のレスポンスを返しました' });
    }

    return res.status(200).json({ 
      answer,
      // 会話履歴をクライアント側で管理できるよう、メッセージ構造を返す
      message_structure: { role: 'assistant', content: answer }
    });

  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') return res.status(504).json({ error: 'タイムアウト（18秒）' });
    return res.status(500).json({ error: e.message });
  }
};
