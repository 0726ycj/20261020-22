// ===================================================
// PBL 專題：p5.js 多媒體測驗系統 - 學習二（看動畫、聽聲音、一題一頁）
// 檔案：sketch.js
// 特色：朗讀語音按鈕、Web Audio音效、動態視覺動畫、一題一頁解析
// ===================================================

// 全域變數宣告：測驗進度與狀態
let currentQuestionIndex = 0; // 當前題號 (0 ~ 3)
let score = 0;                // 答對總題數
let selectedOption = -1;      // 點選的選項編號 (-1 代表尚未作答)
let isAnswerChecked = false;  // 是否已點選作答
let quizFinished = false;     // 測驗是否結算

// 全域變數宣告：多媒體與音效
let audioCtx = null;          // Web Audio API 環境
let synth = window.speechSynthesis; // 瀏覽器語音合成 (TTS)

// 測驗題庫資料庫 (包含 p5.js 觀念、多媒體動畫類別)
const multiQuizData = [
  {
    question: "1. 在 p5.js 中，哪一個函式只會執行「一次」，用來初始化設定畫布與變數？",
    options: ["draw() 繪圖循環", "setup() 初始化設定", "preload() 預載資源", "mousePressed() 點擊按鈕"],
    correct: 1,
    explanation: "setup() 函式在程式啟動時僅執行一次，適合用來設定 createCanvas() 與初始設定值。",
    animType: "setupBox"
  },
  {
    question: "2. 想要讓畫布上的圖形跟隨使用者的滑鼠位置移動，應該使用哪兩個內建變數？",
    options: ["width 與 height", "mouseX 與 mouseY", "pmouseX 與 pmouseY", "frameCount"],
    correct: 1,
    explanation: "mouseX 與 mouseY 會隨時記錄當前滑鼠在畫布上的 X 軸與 Y 軸座標位置。",
    animType: "mouseFollow"
  },
  {
    question: "3. 想要設定圖形內部的填滿顏色為紅色，應該使用哪一個指令？",
    options: ["stroke(255, 0, 0)", "fill(255, 0, 0)", "background(255, 0, 0)", "color(255, 0, 0)"],
    correct: 1,
    explanation: "fill() 用於設定圖形內部的填滿色彩；stroke() 則是設定圖形外框顏色。",
    animType: "colorRect"
  },
  {
    question: "4. 哪一個函式預設會以每秒 60 幀（fps）的頻率不斷重複執行，是用來做動畫的核心？",
    options: ["setup() 函式", "createCanvas() 函式", "draw() 繪圖迴圈", "background() 函式"],
    correct: 2,
    explanation: "draw() 預設會持續循環執行，只要在內部改變變數數值，就能創造連續的動態視覺效果。",
    animType: "loopAnim"
  }
];

// HTML UI 按鈕元件
let optionButtons = [];
let audioSpeechButton = null;
let nextButton = null;

// ===================================================
// 1. setup() 與初始化
// ===================================================
function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);

  // 初始化聲音環境
  initAudioContext();

  // 建立當前題目的按鈕與介面
  createQuizUI();
}

// ===================================================
// 2. draw() 繪圖主循環
// ===================================================
function draw() {
  background(248, 250, 252); // 清爽灰藍底色

  if (!quizFinished) {
    // 1. 繪製頂部進度條與標題
    drawHeader();

    // 2. 繪製上方多媒體動畫展示區 (👀 看得到)
    drawMediaAnimation();

    // 3. 繪製題目與作答解析
    drawQuestionContent();
  } else {
    // 4. 繪製最終成績結算頁面
    drawResultScreen();
  }
}

// ===================================================
// 3. 頂部標題與進度條
// ===================================================
function drawHeader() {
  fill(30, 41, 59);
  noStroke();
  textSize(20);
  textStyle(BOLD);
  text("🎧 學習二：多媒體觀念測驗（看動畫・聽聲音）", width / 2, 35);

  // 進度文字
  textSize(13);
  fill(100, 116, 139);
  textStyle(NORMAL);
  text(`第 ${currentQuestionIndex + 1} 題 / 共 ${multiQuizData.length} 題`, width / 2, 62);

  // 進度條軌道 (灰底)
  stroke(226, 232, 240);
  strokeWeight(6);
  line(width * 0.2, 80, width * 0.8, 80);

  // 進度條進度 (紫底)
  let progressWidth = (width * 0.6) * ((currentQuestionIndex + 1) / multiQuizData.length);
  stroke(79, 70, 229);
  line(width * 0.2, 80, width * 0.2 + progressWidth, 80);
  noStroke();
}

// ===================================================
// 4. 上方多媒體視覺動畫 (👀 看得到)
// ===================================================
let animAngle = 0;

function drawMediaAnimation() {
  let boxW = min(width * 0.6, 380);
  let boxH = 110;
  let boxX = width / 2 - boxW / 2;
  let boxY = 95;

  // 動畫區外框面板
  fill(255);
  stroke(226, 232, 240);
  strokeWeight(2);
  rect(boxX, boxY, boxW, boxH, 12);

  let q = multiQuizData[currentQuestionIndex];
  
  push();
  translate(width / 2, boxY + boxH / 2 - 8);
  animAngle += 0.03;

  // 根據題目的 animType 繪製對應動畫
  if (q.animType === "setupBox") {
    // 動畫 1：僅執行一次的建構方塊
    noFill();
    stroke(79, 70, 229);
    strokeWeight(3);
    rect(-25, -25, 50, 50, 8);
    fill(79, 70, 229);
    noStroke();
    textSize(11);
    text("setup() [僅執行一次]", 0, 40);

  } else if (q.animType === "mouseFollow") {
    // 動畫 2：跟隨動態的紅點
    let targetX = sin(animAngle) * 55;
    fill(244, 63, 94);
    noStroke();
    ellipse(targetX, -5, 26, 26);
    fill(100, 116, 139);
    textSize(11);
    text("mouseX / mouseY 互動座標", 0, 40);

  } else if (q.animType === "colorRect") {
    // 動畫 3：fill() 色彩動態變幻
    colorMode(HSB, 360, 100, 100);
    fill((frameCount * 2) % 360, 80, 90);
    noStroke();
    rect(-35, -20, 70, 40, 6);
    colorMode(RGB, 255);
    fill(50);
    textSize(11);
    text("fill(r, g, b) 填滿色彩", 0, 40);

  } else if (q.animType === "loopAnim") {
    // 動畫 4：draw() 60fps 不斷旋轉動畫
    rotate(animAngle);
    noFill();
    stroke(16, 185, 129);
    strokeWeight(3);
    rect(-22, -22, 44, 44, 4);
    pop();

    push();
    translate(width / 2, boxY + boxH / 2 + 32);
    fill(16, 185, 129);
    noStroke();
    textSize(11);
    text("draw() 60fps 迴圈動畫", 0, 0);
  }
  pop();
}

// ===================================================
// 5. 題目繪製與作答解析小卡
// ===================================================
function drawQuestionContent() {
  let q = multiQuizData[currentQuestionIndex];

  // 繪製題目文字
  fill(30, 41, 59);
  textSize(15);
  textStyle(BOLD);
  textAlign(CENTER, CENTER);
  text(q.question, width / 2, 230);

  // 答題後的解析小卡
  if (isAnswerChecked) {
    let isCorrect = (selectedOption === q.correct);
    let boxW = min(width * 0.8, 580);
    let boxH = 80;
    let boxX = width / 2 - boxW / 2;
    let boxY = height - 145;

    fill(isCorrect ? color(220, 252, 231) : color(254, 226, 226));
    stroke(isCorrect ? color(34, 197, 94) : color(239, 68, 68));
    strokeWeight(2);
    rect(boxX, boxY, boxW, boxH, 10);

    noStroke();
    textAlign(LEFT, TOP);
    textSize(13);
    textStyle(BOLD);
    fill(isCorrect ? color(21, 128, 61) : color(185, 28, 28));
    text(isCorrect ? "🎉 答對了！" : "❌ 答錯了！正確答案是 (" + (q.correct + 1) + ")", boxX + 15, boxY + 12);

    textSize(11);
    textStyle(NORMAL);
    fill(51, 65, 85);
    text("💡 解析：" + q.explanation, boxX + 15, boxY + 35, boxW - 30);
  }
}

// ===================================================
// 6. UI 元件建立與語音發音控制 (👂 聽聲音)
// ===================================================
function createQuizUI() {
  updateQuestionUI();
}

function updateQuestionUI() {
  removeElements(); // 清除舊有的 HTML 按鈕

  let q = multiQuizData[currentQuestionIndex];
  let btnW = min(width * 0.75, 480);
  let btnH = 42;
  let startY = 270;

  // 1. 建立「🔊 朗讀題目與選項」按鈕
  audioSpeechButton = createButton("🔊 點我聽題目語音朗讀");
  audioSpeechButton.position(width / 2 - 100, 250);
  audioSpeechButton.size(200, 30);
  styleSpeechButton(audioSpeechButton);
  audioSpeechButton.mousePressed(() => {
    speakQuestionText(q);
  });

  // 2. 建立 4 個選項按鈕
  for (let i = 0; i < q.options.length; i++) {
    let btn = createButton(`(${i + 1}) ${q.options[i]}`);
    let posY = startY + i * (btnH + 10);
    
    btn.position(width / 2 - btnW / 2, posY);
    btn.size(btnW, btnH);
    styleOptionButton(btn);

    let optIdx = i;
    btn.mousePressed(() => {
      if (!isAnswerChecked) {
        handleOptionSelect(optIdx);
      }
    });

    optionButtons.push(btn);
  }

  // 3. 作答後建立「下一題」按鈕
  if (isAnswerChecked) {
    nextButton = createButton(currentQuestionIndex < multiQuizData.length - 1 ? "下一題 ➔" : "查看總成績 🏆");
    nextButton.position(width / 2 - 80, height - 55);
    nextButton.size(160, 42);
    styleNextButton(nextButton);
    nextButton.mousePressed(() => {
      stopSpeech(); // 切換題目時停止朗讀
      goToNextQuestion();
    });
  }
}

// 處理選擇選項時的音效與邏輯
function handleOptionSelect(selectedIndex) {
  selectedOption = selectedIndex;
  isAnswerChecked = true;
  let q = multiQuizData[currentQuestionIndex];

  // 聽聲音：播放答對或答錯音效
  if (selectedOption === q.correct) {
    score++;
    playTone(587.33, 0.15); // 高音叮咚
    setTimeout(() => playTone(880, 0.2), 120);
  } else {
    playTone(220, 0.25); // 低音嗡
  }

  updateQuestionUI();
}

// 切換下一題
function goToNextQuestion() {
  playTone(440, 0.1);
  if (currentQuestionIndex < multiQuizData.length - 1) {
    currentQuestionIndex++;
    selectedOption = -1;
    isAnswerChecked = false;
    updateQuestionUI();
  } else {
    quizFinished = true;
    removeElements();
  }
}

// ===================================================
// 7. 語音朗讀 (Speech Synthesis) 與音效 (Web Audio)
// ===================================================

// 使用 Web Speech API 朗讀文字
function speakQuestionText(q) {
  if (!synth) return;
  synth.cancel(); // 停止先前的發音

  let textToSpeak = `${q.question}。選項一：${q.options[0]}。選項二：${q.options[1]}。選項三：${q.options[2]}。選項四：${q.options[3]}`;
  let utterance = new SpeechSynthesisUtterance(textToSpeak);
  utterance.lang = "zh-TW"; // 設定繁體中文發音
  utterance.rate = 1.0;     // 語速
  synth.speak(utterance);
}

function stopSpeech() {
  if (synth) synth.cancel();
}

// 初始化 Web Audio Context
function initAudioContext() {
  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
  } catch (e) {
    console.log("AudioContext not supported");
  }
}

// 簡易音效產生器
function playTone(freq, duration) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let osc = audioCtx.createOscillator();
    let gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

// ===================================================
// 8. 成績結算頁面與樣式設定
// ===================================================
function drawResultScreen() {
  let cardW = min(width * 0.8, 400);
  let cardH = 260;
  let cardX = width / 2 - cardW / 2;
  let cardY = height / 2 - cardH / 2;

  fill(255);
  stroke(226, 232, 240);
  strokeWeight(2);
  rect(cardX, cardY, cardW, cardH, 16);

  textAlign(CENTER, CENTER);
  fill(30, 41, 59);
  textSize(22);
  textStyle(BOLD);
  text("🏆 學習二多媒體測驗完成！", width / 2, cardY + 45);

  let percent = Math.round((score / multiQuizData.length) * 100);
  textSize(44);
  fill(percent >= 60 ? color(34, 197, 94) : color(239, 68, 68));
  text(`${score} / ${multiQuizData.length} 題`, width / 2, cardY + 110);

  textSize(14);
  fill(100, 116, 139);
  textStyle(NORMAL);
  text(`總得分：${percent} 分`, width / 2, cardY + 155);

  textSize(12);
  fill(148, 163, 184);
  text("（點擊畫布任意處可重新測驗）", width / 2, cardY + 215);
}

function mousePressed() {
  if (quizFinished) {
    currentQuestionIndex = 0;
    score = 0;
    selectedOption = -1;
    isAnswerChecked = false;
    quizFinished = false;
    updateQuestionUI();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateQuestionUI();
}

// 按鈕樣式輔助函式
function styleOptionButton(btn) {
  btn.style("background-color", "#FFFFFF");
  btn.style("color", "#334155");
  btn.style("font-size", "14px");
  btn.style("font-weight", "600");
  btn.style("border", "2px solid #E2E8F0");
  btn.style("border-radius", "8px");
  btn.style("cursor", "pointer");
  btn.style("text-align", "left");
  btn.style("padding-left", "18px");
}

function styleSpeechButton(btn) {
  btn.style("background-color", "#EEF2FF");
  btn.style("color", "#4F46E5");
  btn.style("font-size", "12px");
  btn.style("font-weight", "bold");
  btn.style("border", "1px solid #C7D2FE");
  btn.style("border-radius", "15px");
  btn.style("cursor", "pointer");
}

function styleNextButton(btn) {
  btn.style("background-color", "#4F46E5");
  btn.style("color", "#FFFFFF");
  btn.style("font-size", "14px");
  btn.style("font-weight", "bold");
  btn.style("border", "none");
  btn.style("border-radius", "25px");
  btn.style("cursor", "pointer");
  btn.style("box-shadow", "0 4px 10px rgba(79, 70, 229, 0.3)");
}