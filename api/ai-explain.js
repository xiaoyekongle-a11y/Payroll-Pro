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
  if (!body?.summary) return res.status(400).json({ error: 'summary が必要です' });

  // より自然で柔軟なプロンプト
  const prompt = `# 給与計算結果の経営層向けサマリー作成

以下の給与計算結果について、**経営者・人事責任者が一目で理解できる簡潔なサマリー**を作成してください。

## 計算結果データ
\`\`\`json
${JSON.stringify(body.summary, null, 2)}
\`\`\`

## 作成ガイド

### 文字数・長さについて
- **目安**: 2〜5文程度（強制ではありません）
- 重要な情報が含まれていれば、少し長くなってもOK
- 逆に、シンプルに1文で済む場合は1文でOK

### 文体・トーン
- **対象**: 経営者・CFO・人事部長向け
- **内容**: 具体的な数字を入れて、ビジネス的な結論を述べる
- **例:**
  - ✅「営業部の給与総額は月額450万円となり、全社平均比で12%上昇します」
  - ✅「今月の給与調整により、年間約680万円の追加コスト発生が見込まれます」
  - ✅「全社員の基本給を10%引き上げ、手当を月1万円加算した結果、月額給与総額は2,850万円から3,120万円へ（約270万円増）となります」

### 避けるべき表現
- ❌ 箇条書き（段落で）
- ❌ 技術的な用語の説明（計算式など）
- ❌「です」「ます」の連続（一部なら可）

### 包含すべき情報（あれば）
- 総額ベースの変動（増減額・パーセンテージ）
- 主要な対象グループ（部署・職位）
- 実施日時やタイムライン

---

## 出力仕様
平文・段落形式で返してください。マークダウンなし。`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',  // 軽量・高速モデル
        messages: [
          { 
            role: 'system', 
            content: 'あなたは経営層向けの給与計算サマリーライターです。数字に強く、ビジネス的な視点で正確かつ簡潔に報告します。不必要に長くならないよう心がけます。' 
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,  // 改善：0.4 → 0.5（もっと自然な表現）
        max_tokens: 500,   // 改善：300 → 500（長さをゆるく）
        top_p: 0.9,        // 多様性を少し上げる
      }),
    });
    clearTimeout(timeout);
    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      return res.status(502).json({ error: `Groq APIエラー: ${groqRes.status}` });
    }

    const data = await groqRes.json();
    const explanation = (data?.choices?.[0]?.message?.content || '').trim();
    if (!explanation) {
      return res.status(500).json({ error: 'AIが空のレスポンスを返しました' });
    }

    return res.status(200).json({ explanation });

  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') return res.status(504).json({ error: 'タイムアウト（15秒）' });
    return res.status(500).json({ error: e.message });
  }
};
