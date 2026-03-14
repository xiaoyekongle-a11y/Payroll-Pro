export const config = { runtime: 'edge' };

export default async function handler(req) {
  // POSTのみ許可
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
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
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: err?.error?.message || 'Gemini API error: ' + geminiRes.status }),
        { status: geminiRes.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await geminiRes.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonStr = text.replace(/```json?|```/g, '').trim();
    const rules = JSON.parse(jsonStr);

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
