const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");

app.use(express.static("public"));
app.use(express.json());

// 데이터 저장 파일 경로
const DATA_FILE = path.join(__dirname, "data.json");

// 아이디 목록 (총 20명)
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

// 당첨 인원 설정
const PRIZE_SETTINGS = [
  { rank: 1, count: 1 },
  { rank: 2, count: 1 },
  { rank: 3, count: 1 },
  { rank: 4, count: 1 },
  { rank: 5, count: 3 },
];
const TOTAL_USERS = 20;

let gameState = { pool: [], history: {} };

// ▼▼▼ [중요] 서버 켜질 때마다 무조건 강제 초기화 (테스트용) ▼▼▼
// 파일이 있어도 무시하고 새로 섞습니다. 문제를 해결하는 핵심 코드입니다.
resetGame();
// ▲▲▲▲▲▲

function resetGame() {
  let newPool = [];

  // 1. 당첨 티켓 넣기
  PRIZE_SETTINGS.forEach((item) => {
    for (let i = 0; i < item.count; i++) {
      newPool.push(item.rank);
    }
  });

  // 2. 남은 자리 꽝으로 채우기
  const currentCount = newPool.length;
  const loserCount = TOTAL_USERS - currentCount;

  for (let i = 0; i < loserCount; i++) {
    newPool.push("꽝");
  }

  // 3. 섞기 (셔플)
  gameState.pool = newPool.sort(() => Math.random() - 0.5);
  gameState.history = {};
  saveData();
  console.log("게임이 초기화되었습니다. (캡슐 20개 장전 완료)");
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(gameState));
}

// 현황 확인 API
app.get("/status", (req, res) => {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 꽝: 0 };
  gameState.pool.forEach((item) => {
    if (counts[item] !== undefined) counts[item]++;
  });

  res.json({
    total: gameState.pool.length,
    counts: counts,
  });
});

// 강제 초기화 링크
app.get("/reset", (req, res) => {
  resetGame();
  res.send("<h1>초기화 완료!</h1><a href='/'>돌아가기</a>");
});

// 뽑기 로직
app.post("/draw", (req, res) => {
  const { userId } = req.body;

  if (!ALLOWED_IDS.includes(userId))
    return res.json({ error: "명단에 없는 아이디입니다." });
  if (gameState.history[userId])
    return res.json({
      result: gameState.history[userId],
      msg: "이미 참여하셨습니다!",
    });
  if (gameState.pool.length === 0)
    return res.json({ error: "모든 경품이 소진되었습니다." });

  const idx = Math.floor(Math.random() * gameState.pool.length);
  const result = gameState.pool.splice(idx, 1)[0];

  gameState.history[userId] = result;
  saveData();

  return res.json({ result: result });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
