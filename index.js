const express = require("express");
const app = express();
const mongoose = require("mongoose"); // 데이터베이스 도구
const path = require("path");

app.use(express.static("public"));
app.use(express.json());

// ▼▼▼ 선생님의 MongoDB 보물지도 주소 (비밀번호 포함됨) ▼▼▼
const MONGO_URI =
  "mongodb+srv://moony_db:dnsaud74@cluster0.obamce0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// 1. 데이터베이스 연결
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✨ MongoDB 데이터베이스 연결 성공! ✨"))
  .catch((err) => console.log("🔥 연결 실패:", err));

// 2. 데이터베이스 모양 정의 (Schema)
const gameSchema = new mongoose.Schema({
  pool: Array, // 남은 캡슐 리스트
  history: Object, // 당첨 기록 { "아이디": "1등" }
});

// 3. 모델 만들기 (이 이름으로 DB에 저장됨)
const Game = mongoose.model("Game", gameSchema);

// 아이디 목록 & 당첨 설정
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

// 게임 데이터 가져오기 (없으면 새로 만듦)
async function getGameData() {
  let game = await Game.findOne();
  if (!game) {
    // 처음 실행이라 데이터가 없으면 만듭니다.
    game = new Game({ pool: [], history: {} });
    await resetGameLogic(game);
  }
  return game;
}

// 초기화 로직 (DB 내부에서 처리)
async function resetGameLogic(game) {
  let newPool = [];
  PRIZE_SETTINGS.forEach((item) => {
    for (let i = 0; i < item.count; i++) newPool.push(item.rank);
  });
  const loserCount = TOTAL_USERS - newPool.length;
  for (let i = 0; i < loserCount; i++) newPool.push("꽝");

  // 섞기
  game.pool = newPool.sort(() => Math.random() - 0.5);
  game.history = {};
  await game.save(); // DB에 저장
  console.log("게임이 초기화되었습니다 (DB 저장 완료)");
}

// ▼▼▼ API 설정 ▼▼▼

// 현황 확인
app.get("/status", async (req, res) => {
  const game = await getGameData();
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 꽝: 0 };

  game.pool.forEach((item) => {
    if (counts[item] !== undefined) counts[item]++;
  });

  res.json({ total: game.pool.length, counts: counts });
});

// 강제 초기화 (주소창에 /reset 입력 시)
app.get("/reset", async (req, res) => {
  const game = await getGameData();
  await resetGameLogic(game);
  res.send("<h1>데이터베이스 초기화 완료!</h1><a href='/'>돌아가기</a>");
});

// 뽑기
app.post("/draw", async (req, res) => {
  const { userId } = req.body;
  const game = await getGameData();

  if (!ALLOWED_IDS.includes(userId))
    return res.json({ error: "명단에 없는 아이디입니다." });

  // DB에 저장된 history 확인
  if (game.history && game.history[userId]) {
    return res.json({
      result: game.history[userId],
      msg: "이미 참여하셨습니다!",
    });
  }

  if (game.pool.length === 0)
    return res.json({ error: "모든 경품이 소진되었습니다." });

  // 뽑기 진행
  const idx = Math.floor(Math.random() * game.pool.length);
  const result = game.pool.splice(idx, 1)[0]; // pool에서 하나 꺼냄

  // 기록 저장
  if (!game.history) game.history = {}; // history가 없으면 생성
  game.history[userId] = result;

  // 변경된 pool과 history를 DB에 영구 저장 (★중요)
  // Mongoose에서 Object나 Array가 바뀌면 알려줘야 함
  game.markModified("pool");
  game.markModified("history");
  await game.save();

  return res.json({ result: result });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
