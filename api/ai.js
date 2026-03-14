module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  let body = req.body;
  // body-parserが効いていない場合は手動でパース
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }
  if (!body) {
    return res.status(400).json({ error: 'Empty body' });
  }

  const { instruction } = body;
  if (!instruction || typeof instruction !== 'string') {
    return res.status(400).json({ error: 'instruction is required' });
  }

  const prompt = `給与計算ルールをJSON配列で返してください。

指示: ${instruction}

ルールタイプ:
- perf_multiply: 業績係数を倍率で掛け算 (value: 数値)
- perf_set: 業績係数を固定値に設定 (value: 数値)
- allowance_add: 手当を加算 (value: 金額)

target: "all"=全員, "dept:部署名", "name:氏名", "pos:役職名"

JSON配列のみ返すこと（説明文不要）:
[{"type":"perf_multiply","target":"dept:営業部","value":1.2,"label":"営業部×1.2倍"}]`;

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a payroll rule parser. Return ONLY a valid JSON array. No explanation, no markdown, no code blocks. Just the raw JSON array.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.0,
        max_tokens: 512,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      return res.status(groqRes.status).json({
        error: err?.error?.message || 'Groq API error: ' + groqRes.status
      });
    }

    const data = await groqRes.json();
    const text = (data?.choices?.[0]?.message?.content || '').trim();

    // JSON配列部分のみ抽出
    const cleaned = text.replace(/```json?|```/g, '').trim();
    const match = cleaned.match(/\[[\s\S]*?\]/);
    if (!match) {
      console.error('[AI] No JSON array in response:', text);
      return res.status(500).json({ error: 'AI did not return a valid JSON array' });
    }

    const rules = JSON.parse(match[0]);
    return res.status(200).json({ rules });

  } catch (e) {
    console.error('[AI] error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
