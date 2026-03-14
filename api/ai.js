module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  // CORS対応（Vercelプレビューデプロイ間のクロスオリジンに対応）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // プリフライトリクエスト
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY が設定されていません。Vercel環境変数を確認してください。' });
  }

  // body-parserが効いていない場合は手動でパース
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch {
      return res.status(400).json({ error: 'リクエストのJSONが不正です' });
    }
  }
  if (!body) {
    return res.status(400).json({ error: 'リクエストボディが空です' });
  }

  const { instruction } = body;
  if (!instruction || typeof instruction !== 'string') {
    return res.status(400).json({ error: 'instruction フィールドが必要です' });
  }
  if (instruction.length > 2000) {
    return res.status(400).json({ error: '指示文が長すぎます（2000文字以内）' });
  }

  const prompt = `給与計算ルールをJSON配列で返してください。

指示: ${instruction}

ルールタイプ（typeフィールド）:
- perf_multiply : 業績係数を倍率で掛け算  (value: 数値)
- perf_set      : 業績係数を固定値に設定  (value: 数値)
- allowance_add : 手当を加算              (value: 金額・円)

targetフィールド:
- "all"         : 全従業員
- "dept:部署名" : 特定部署（例: "dept:営業部"）
- "name:氏名"   : 特定個人（例: "name:田中太郎"）
- "pos:役職名"  : 特定役職（例: "pos:マネージャー"）

labelフィールド: ルールの日本語説明（例: "営業部×1.2倍"）

出力はJSON配列のみ。説明文・マークダウン・コードブロックは一切不要:
[{"type":"perf_multiply","target":"dept:営業部","value":1.2,"label":"営業部×1.2倍"}]

複数ルールがある場合は配列に並べる。ルールが読み取れない場合は空配列 [] を返す。`;

  // タイムアウト付きfetch
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15秒

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        // llama-3.3-70b-versatile: 精度が高くJSON出力が安定
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a Japanese payroll rule parser. Return ONLY a valid JSON array with no explanation, no markdown, no code blocks. Output raw JSON array only.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.0,   // 決定論的出力（ランダム性ゼロ）
        max_tokens: 512,
        // JSON出力を強制（Groq対応モデルのみ）
        response_format: { type: 'json_object' },
      }),
    });

    clearTimeout(timeout);

    if (!groqRes.ok) {
      const err = await groqRes.json().catch(() => ({}));
      const msg = err?.error?.message || `Groq APIエラー: ${groqRes.status}`;
      console.error('[AI] Groq error:', groqRes.status, msg);
      return res.status(502).json({ error: msg });
    }

    const data = await groqRes.json();
    const raw = (data?.choices?.[0]?.message?.content || '').trim();

    if (!raw) {
      console.error('[AI] Groq returned empty content');
      return res.status(500).json({ error: 'AIが空のレスポンスを返しました' });
    }

    // JSON配列の抽出（response_formatがjson_objectの場合、配列はラップされることがある）
    const cleaned = raw.replace(/```json?|```/g, '').trim();

    let rules;
    try {
      const parsed = JSON.parse(cleaned);
      // { rules: [...] } 形式でラップされている場合も対応
      if (Array.isArray(parsed)) {
        rules = parsed;
      } else if (Array.isArray(parsed.rules)) {
        rules = parsed.rules;
      } else if (Array.isArray(parsed.data)) {
        rules = parsed.data;
      } else {
        // オブジェクト内の最初の配列を探す
        const firstArray = Object.values(parsed).find(v => Array.isArray(v));
        rules = firstArray || [];
      }
    } catch {
      // JSONパース失敗時は正規表現で配列を抽出
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (!match) {
        console.error('[AI] JSON parse failed. Raw:', raw.slice(0, 200));
        return res.status(500).json({ error: 'AIが有効なJSON配列を返しませんでした', raw: raw.slice(0, 300) });
      }
      try {
        rules = JSON.parse(match[0]);
      } catch {
        return res.status(500).json({ error: 'JSONパースエラー', raw: raw.slice(0, 300) });
      }
    }

    // バリデーション: 各ルールの型チェック
    const VALID_TYPES = ['perf_multiply', 'perf_set', 'allowance_add'];
    const validated = rules.filter(r =>
      r && typeof r === 'object' &&
      VALID_TYPES.includes(r.type) &&
      typeof r.target === 'string' &&
      typeof r.value === 'number' &&
      Number.isFinite(r.value)
    ).map(r => ({
      type: r.type,
      target: r.target,
      value: r.value,
      label: typeof r.label === 'string' ? r.label : `${r.type}(${r.target})`,
    }));

    console.log(`[AI] instruction="${instruction.slice(0,50)}" → ${validated.length}ルール`);
    return res.status(200).json({ rules: validated });

  } catch (e) {
    clearTimeout(timeout);
    if (e.name === 'AbortError') {
      console.error('[AI] Groq request timed out');
      return res.status(504).json({ error: 'AIリクエストがタイムアウトしました（15秒）。再度お試しください。' });
    }
    console.error('[AI] Unexpected error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
