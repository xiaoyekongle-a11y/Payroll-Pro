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
  if (!body?.question) return res.status(400).json({ error: 'question が必要です' });

  const SYSTEM_PROMPT = `あなたはSalario CalcAIのAIアシスタントです。
CalcAIは給与計算SaaSで、Excelの名簿をアップロードして自然言語で給与ルールを指示できます。

あなたの役割は、ユーザーの給与計算ルールの書き方についての質問に答えたり、特定の指示がシステムでどのように解釈・計算されるかを分かりやすく解説することです。
もし「この指示だとどうなる？」と聞かれた場合は、無理に具体的な金額を計算しようとせず、「その指示は『〇〇の基本給を〇倍する』『〇〇に手当として〇円追加する』というルールとしてシステムに解釈され、皆さんの給与に自動適用されます」といった形でルールの意味を論理的に整理して伝えてください。

使用できる指示の種類:
1. 係数倍率: 「営業部の基本給+20%（係数1.2倍）」「開発部-20%（係数0.8倍）」
2. 係数固定: 「田中さんの係数を1.5に固定」
3. 最低保証: 「部長以上の係数を最低1.0に保証」
4. 手当追加: 「全員に5000円の交通費を追加」
5. 手当固定: 「管理職の手当を30000円に設定」
6. 基本給変更: 「全員の基本給を1.05倍」

対象の指定方法:
- 全員: 「全員」「全社員」
- 部署: 「営業部」「開発部」など
- 役職: 「部長」「マネージャー」など
- 個人: 氏名を直接記述
- 複合: 「営業部の部長」など

質問に対しては、途中で途切れないよう最後まで丁寧に日本語で答えてください。`;

  // 会話履歴対応
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
  if (body.history && Array.isArray(body.history)) {
    body.history.forEach(h => {
      if (h.role === 'user' || h.role === 'assistant') {
        messages.push({ role: h.role, content: h.content });
      }
    });
  } else {
    messages.push({ role: 'user', content: body.question });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const geminiRes = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages,
        temperature: 0.3,
        max_tokens: 2048,
      }),
    });
    clearTimeout(timeout);
    if (!geminiRes.ok) return res.status(502).json({ error: `Gemini APIエラー: ${geminiRes.status}` });

    const data = await geminiRes.json();
    const answer = (data?.choices?.[0]?.message?.content || '').trim();
    return res.status(200).json({ answer });

  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') return res.status(504).json({ error: 'タイムアウト' });
    return res.status(500).json({ error: e.message });
  }
};
