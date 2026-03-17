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

  const SYSTEM_PROMPT = `あなたはSalario AutoCalcのAIアシスタントです。
AutoCalcは給与計算SaaSで、Excelの名簿をアップロードして自然言語で給与ルールを指示できます。

使用できる指示の種類:
1. 係数・手当: 「営業部の係数を1.2倍」「全員に5000円の交通費」「管理職の手当を30000円に設定」
2. 基本給の変更: 「全員の基本給を1万円アップ」「基本給を1.05倍」
3. ボーナス操作: 「営業部のボーナスを3ヶ月分にする」「田中さんに特別賞与10万円」「役員のボーナスを100万円で固定」
4. 控除（天引き）: 「全員から親睦会費1000円を引く」「遅刻による罰金5000円を引く」

対象の指定方法:
- 全員: 「全員」「全社員」
- 部署: 「営業部」「開発部」など
- 役職: 「部長」「マネージャー」など
- 個人: 氏名を直接記述
- 複合: 「営業部の部長」「開発部のマネージャー以上」

質問に対して簡潔・丁寧に日本語で答えてください。`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: body.question },
        ],
        temperature: 0.3,
        max_tokens: 512,
      }),
    });
    clearTimeout(timeout);
    if (!groqRes.ok) return res.status(502).json({ error: `Groq APIエラー: ${groqRes.status}` });

    const data = await groqRes.json();
    const answer = (data?.choices?.[0]?.message?.content || '').trim();
    return res.status(200).json({ answer });

  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') return res.status(504).json({ error: 'タイムアウト' });
    return res.status(500).json({ error: e.message });
  }
};
