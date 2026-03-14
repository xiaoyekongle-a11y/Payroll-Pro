export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { instruction } = body;
  if (!instruction || typeof instruction !== 'string') {
    return new Response(JSON.stringify({ error: 'instruction is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const prompt = `あなたは給与計算ルール解析AIです。
以下の自然言語の指示を解析し、給与計算ルールのJSON配列として返してください。

指示: ${instruction}

利用可能なルールタイプ:
- perf_multiply: 業績係数を倍率で掛け算 (value: 倍率数値)
- perf_set: 業績係数を固定値に設定 (value: 固定値)
- allowance_add: 手当を加算 (value: 金額数値)

targetフィールド:
- "all": 全員
- "dept:部署名": 特定部署
- "name:氏名": 特定従業員
- "pos:役職名": 特定役職

必ずJSON配列のみ返してください（説明文・コードブロック不要）:
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
            content: '給与計算ルール解析AIです。指示をJSON配列のみで返します。説明文やコードブロックは不要です。',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: err?.error?.message || 'Groq API error: ' + groqRes.status }),
        { status: groqRes.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await groqRes.json();
    const text = data?.choices?.[0]?.message?.content || '';
    // JSON配列部分だけ抽出（前後の説明文・コードブロックを除去）
    const jsonStr = text.replace(/```json?|```/g, '').trim();
    const match = jsonStr.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('AI response did not contain a JSON array');
    const rules = JSON.parse(match[0]);

    return new Response(JSON.stringify({ rules }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
