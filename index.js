const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");

// ▼▼▼ 여기에 public 폴더 위치를 알려주는 코드가 꼭 있어야 이미지가 뜹니다! ▼▼▼
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// 몽고DB 주소 (선생님 주소 그대로)
const MONGO_URI =
  "mongodb+srv://moony_db:dnsaud74@cluster0.obamce0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// 데이터베이스 연결
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✨ MongoDB 연결 성공! ✨"))
  .catch((err) => console.log("🔥 연결 실패:", err));

// 데이터베이스 모델
const gameSchema = new mongoose.Schema({
  pool: Array,
  history: Object,
});
const Game = mongoose.model("Game", gameSchema);

// 설정값
const ALLOWED_IDS = [
  "iino_hs422",
  "luv_zzri",
  "empty.da",
  "ggyuw.w",
  "mingmong.2",
  "tanjiro_.0213",
  "ziro_714",
  "jikukuii",
  "areumxia",
  "strategic_muzan",
  "umm_morani",
  "flo12414",
  "shy__giyu",
  "ming2.2",
  "yukie_2222_",
  "hime_nyoung",
  "j.euu_",
  "miming__c",
  "cha_duck_",
  "_ming_miing",
];
const PRIZE_SETTINGS = [
  { rank: 1, count: 1 },
  { rank: 2, count: 1 },
  { rank: 3, count: 1 },
  { rank: 4, count: 1 },
  { rank: 5, count: 3 },
];
const TOTAL_USERS = 20;

// DB에서 데이터 가져오기 (없으면 생성)
async function getGameData() {
  let game = await Game.findOne();
  if (!game) {
    game = new Game({ pool: [], history: {} });
    await resetGameLogic(game);
  }
  return game;
}

// 게임 초기화 로직
async function resetGameLogic(game) {
  let newPool = [];
  PRIZE_SETTINGS.forEach((item) => {
    for (let i = 0; i < item.count; i++) newPool.push(item.rank);
  });
  const loserCount = TOTAL_USERS - newPool.length;
  for (let i = 0; i < loserCount; i++) newPool.push("꽝");

  game.pool = newPool.sort(() => Math.random() - 0.5);
  game.history = {};
  await game.save();
  console.log("게임 리셋 완료");
}

// ▼▼▼ API ▼▼▼

// 메인 화면 (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 현황 확인
app.get("/status", async (req, res) => {
  const game = await getGameData();
  // 카운트 계산
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 꽝: 0 };
  game.pool.forEach((item) => {
    if (counts[item] !== undefined) counts[item]++;
  });
  res.json({ total: game.pool.length, counts: counts });
});

// 강제 리셋 (주소창에 /reset 입력 시)
app.get("/reset", async (req, res) => {
  const game = await getGameData();
  await resetGameLogic(game);
  res.send(
    "<h1>게임이 초기화되었습니다! (캡슐 장전 완료)</h1><a href='/'>돌아가기</a>"
  );
});

// 뽑기
app.post("/draw", async (req, res) => {
  const { userId } = req.body;
  const game = await getGameData();

  if (!ALLOWED_IDS.includes(userId))
    return res.json({ error: "명단에 없는 아이디입니다." });
  if (game.history && game.history[userId]) {
    return res.json({
      result: game.history[userId],
      msg: "이미 참여하셨습니다!",
    });
  }
  if (game.pool.length === 0)
    return res.json({ error: "모든 경품이 소진되었습니다." });

  const idx = Math.floor(Math.random() * game.pool.length);
  const result = game.pool.splice(idx, 1)[0];

  if (!game.history) game.history = {};
  game.history[userId] = result;

  game.markModified("pool");
  game.markModified("history");
  await game.save();

  return res.json({ result: result });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
