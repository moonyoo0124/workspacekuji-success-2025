const express = require("express");
const app = express();
const fs = require("fs");
const path = require("path");

app.use(express.static("public"));
app.use(express.json());

// 데이터 저장 파일 경로
const DATA_FILE = path.join(__dirname, "data.json");

// 아이디 목록
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

// 당첨 상품 설정 (등수, 인원수)
const PRIZE_SETTINGS = [
  { rank: 1, count: 1 }, // 1등 1명
  { rank: 2, count: 1 }, // 2등 1명
  { rank: 3, count: 1 }, // 3등 1명
  { rank: 4, count: 3 }, // 4등 3명
  { rank: 5, count: 3 }, // 5등 3명
];
const TOTAL_USERS = 20;

// 게임 데이터 관리
let gameState = {
  pool: [],
  history: {},
};

// 데이터 불러오기 또는 초기화
if (fs.existsSync(DATA_FILE)) {
  try {
    gameState = JSON.parse(fs.readFileSync(DATA_FILE));
  } catch (e) {
    resetGame();
  }
} else {
  resetGame();
}

function resetGame() {
  let newPool = [];

  // 1. 당첨 티켓 넣기
  PRIZE_SETTINGS.forEach((item) => {
    for (let i = 0; i < item.count; i++) {
      newPool.push(item.rank);
    }
  });

  // 2. 남은 자리 꽝으로 채우기
  const currentCount = newPool.length; // 현재 9개
  const loserCount = TOTAL_USERS - currentCount; // 11개
  for (let i = 0; i < loserCount; i++) {
    newPool.push("꽝");
  }

  // 3. 섞기
  gameState.pool = newPool.sort(() => Math.random() - 0.5);
  gameState.history = {};
  saveData();
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(gameState));
}

// 뽑기 요청 처리
app.post("/draw", (req, res) => {
  const { userId } = req.body;

  if (!ALLOWED_IDS.includes(userId))
    return res.json({ error: "명단에 없는 아이디입니다." });

  // 이미 뽑은 경우
  if (gameState.history[userId]) {
    return res.json({
      result: gameState.history[userId],
      msg: "이미 참여하셨습니다!",
    });
  }

  if (gameState.pool.length === 0)
    return res.json({ error: "모든 경품이 소진되었습니다." });

  // 뽑기 진행
  const idx = Math.floor(Math.random() * gameState.pool.length);
  const result = gameState.pool.splice(idx, 1)[0];

  gameState.history[userId] = result;
  saveData();

  return res.json({ result: result });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
