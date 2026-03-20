// このAPIは削除されました（有料化機能廃止）
module.exports = async function handler(req, res) {
  res.status(404).json({ error: 'このエンドポイントは利用できません' });
};
