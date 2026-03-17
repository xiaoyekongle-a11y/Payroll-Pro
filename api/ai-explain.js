module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON不正' }); } }
  if (!body?.summary) return res.status(400).json({ error: 'summary が必要です' });

  const prompt = `# 給与計算結果の経営層向けサマリー作成

以下の給与計算結果について、**経営者・CFO・人事責任者が一目で理解できる、簡潔で正確なサマリー**を日本語で作成してください。

## 計算結果データ
\`\`\`json
${JSON.stringify(body.summary, null, 2)}
\`\`\`

---

## 📋 作成ガイド

### 対象読者
- **経営者** / **CFO** / **人事部長**
- **事業部長**（給与変動が部門に与える影響を理解したい）

### トーン・スタイル
- **簡潔性**: 要点を2〜4文で述べる
- **具体性**: 推定額、増減率、対象人数など、数字を入れる
- **結論**: 「予想される影響」「留意点」を明示
- **文体**: ビジネス日本語（敬語は適度に）

### 必ず含める情報
- [ ] 給与総額の現在値 → 変更後の予測値（増減額＋パーセンテージ）
- [ ] 対象者（全員 or 特定部署 or 職位など）
- [ ] 主要な変更内容（係数、手当、基本給）
- [ ] 実施予定月（あれば）
- [ ] 留意点・リスク（予算超過、給与バランスの歪みなど）

### 避けるべき表現
- ❌ 箇条書き（段落で述べる）
- ❌ 技術的用語・計算式（「係数 × 基本給」など）
- ❌ 曖昧な表現（「程度」「くらい」など）
- ❌ 複数形段落の「です」「ます」連続

### 数値表示のコツ
```
❌ 「年間約680万円」（「約」は曖昧）
✅ 「年間680万円の追加費用」（具体的）

❌ 「給与が上がります」（曖昧）
✅ 「月額給与総額が2,850万円から3,120万円に上昇（+270万円、+9.5%）」

❌ 「営業部の係数が改善されます」
✅ 「営業部員の平均月給が300,000円から360,000円に上昇（+60,000円、+20%）」
```

---

## 📝 出力仕様

**形式**: 平文・段落形式（マークダウン不要）  
**長さ**: 2〜5文（柔軟に）  
**言語**: 日本語（敬語適度に）

---

## 📊 例

### 入力例
\`\`\`json
{
  "before": {
    "total_salary": 28500000,
    "head_count": 95
  },
  "after": {
    "total_salary": 31200000,
    "head_count": 95,
    "changes": [
      { "target": "dept:営業部", "type": "perf_multiply", "value": 1.2 },
      { "target": "all", "type": "allowance_add", "value": 5000 }
    ]
  }
}
\`\`\`

### 出力例（パターン1: 増加の場合）
\`\`\`
全社員の基本給に加えて営業部の給与を1.2倍とし、全員に月5000円の交通費を加算した結果、月額給与総額は2,850万円から3,120万円へ増加（+270万円、+9.5%）することが見込まれます。これにより営業部の人員確保と動機付けが強化される一方、年間3,240万円の追加人件費が発生するため、予算との照合が必要です。
\`\`\`

### 出力例（パターン2: 部分的な変更の場合）
\`\`\`
管理職（部長以上）の役職手当を現行の月30,000円から50,000円に引き上げた場合、対象者約12名分で年間約288万円の追加費用が見込まれます。この変更は幹部層の待遇改善となり、離職防止効果が期待される一方、給与バランスの再調整が課題となります。
\`\`\`

### 出力例（パターン3: 複合的な変更の場合）
\`\`\`
営業部（42名）の係数を1.2倍に、全従業員（95名）に月5000円の交通費を加算する施策により、月額給与総額は2,850万円から3,120万円へ（+270万円、+9.5%）上昇します。営業部のモチベーション向上と全社的な待遇改善が実現される一方、年間3,240万円の追加人件費が発生するため、経営利益とのバランスを慎重に検討する必要があります。また、他部署との給与格差が拡大する点も留意してください。
\`\`\`

---

では、上記ガイドに従い、給与計算結果をサマリーしてください。`;

  // Anthropic APIを優先
  const tryAnthropicAPI = async () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
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
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      clearTimeout(timeout);

      if (apiRes.ok) {
        const data = await apiRes.json();
        const text = (data?.content?.[0]?.text || '').trim();
        if (text) {
          console.log('[Claude Sonnet] サマリー生成成功');
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
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: '経営層向けの給与計算サマリーライターです。正確かつ簡潔に報告してください。' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 1024,
        }),
      });
      clearTimeout(timeout);

      if (groqRes.ok) {
        const data = await groqRes.json();
        const text = (data?.choices?.[0]?.message?.content || '').trim();
        if (text) {
          console.log('[Groq] サマリー生成成功');
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
      let explanation = await tryAnthropicAPI();

      // ステップ2: 失敗時はGroqを試す
      if (!explanation) {
        explanation = await tryGroqAPI();
      }

      // ステップ3: 両方失敗時はエラー
      if (!explanation) {
        console.error('[Explain Error] 両APIが失敗');
        return res.status(502).json({
          error: 'サマリー生成に失敗しました',
          hint: 'ネットワーク接続を確認してください'
        });
      }

      return res.status(200).json({ explanation });

    } catch (e) {
      console.error('[Internal Error]', e.message);
      return res.status(500).json({
        error: '予期しないエラーが発生しました',
        detail: e.message
      });
    }
  })();
};
