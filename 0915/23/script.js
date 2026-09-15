const ELEMENT_META = {
  물: { icon: "💧", color: "var(--color-water)" },
  불: { icon: "🔥", color: "var(--color-fire)" },
  나무: { icon: "🌳", color: "var(--color-wood)" },
  땅: { icon: "⛰️", color: "var(--color-earth)" },
  바람: { icon: "🍃", color: "var(--color-wind)" },
};

const FORTUNES = {
  물: [
    "막혀있던 일이 물 흐르듯 자연스럽게 풀리는 하루예요.",
    "감정이 잔잔해지고 주변 사람들과의 관계가 편안해집니다.",
    "새로운 정보가 흘러들어와 좋은 기회로 이어질 수 있어요.",
    "무리하게 밀어붙이기보다 유연하게 대처하면 좋은 결과가 따라와요.",
    "마음속 걱정을 흘려보내면 한결 가벼워지는 하루가 될 거예요.",
  ],
  불: [
    "열정이 타올라 평소보다 추진력 있게 일을 해낼 수 있어요.",
    "누군가에게 주목받을 만한 활약을 펼치게 될 하루입니다.",
    "새로운 도전에 뛰어들기 좋은 에너지가 넘치는 날이에요.",
    "감정이 격해지기 쉬우니 한 박자 쉬고 말하면 더 좋겠어요.",
    "작은 아이디어가 큰 불씨가 되어 성과로 이어질 수 있어요.",
  ],
  나무: [
    "차근차근 쌓아온 노력이 서서히 결실을 맺기 시작해요.",
    "새로운 배움이나 계획을 시작하기에 좋은 기운이 흐릅니다.",
    "주변 사람들과의 관계가 뿌리처럼 단단해지는 하루예요.",
    "성장통이 있을 수 있지만 길게 보면 좋은 방향으로 나아가요.",
    "꾸준함이 빛을 발해 인정받게 될 하루입니다.",
  ],
  땅: [
    "안정감 있게 하루를 보내며 신뢰를 쌓기 좋은 날이에요.",
    "현실적인 계획을 세우면 예상보다 순조롭게 진행됩니다.",
    "재물이나 자산 관리에 신경 쓰면 좋은 흐름이 이어져요.",
    "든든한 사람의 도움으로 어려운 일이 수월하게 풀려요.",
    "서두르지 않고 기반을 다지면 오래가는 성과를 얻습니다.",
  ],
  바람: [
    "생각지 못한 곳에서 좋은 소식이 바람처럼 날아들어요.",
    "새로운 사람과의 만남이 좋은 인연으로 이어질 수 있어요.",
    "변화의 흐름을 잘 타면 뜻밖의 기회를 잡게 됩니다.",
    "머릿속이 복잡했다면 오늘은 한결 가벼워지는 하루예요.",
    "여행이나 이동과 관련된 일에 좋은 기운이 따릅니다.",
  ],
};

const LUCKY_COLORS = ["빨강", "주황", "노랑", "초록", "파랑", "보라", "하양", "검정", "분홍", "청록"];
const LUCKY_ITEMS = ["손수건", "우산", "머그컵", "펜", "동전", "책", "향초", "화분", "반지", "열쇠고리"];

const form = document.getElementById("fortune-form");
const elementGroup = document.getElementById("element-group");
const elementInput = document.getElementById("element");
const formCard = document.getElementById("form-card");
const resultCard = document.getElementById("result-card");
const resultIcon = document.getElementById("result-icon");
const resultTitle = document.getElementById("result-title");
const resultGreeting = document.getElementById("result-greeting");
const resultFortune = document.getElementById("result-fortune");
const luckyInfo = document.getElementById("lucky-info");
const retryBtn = document.getElementById("retry-btn");

elementGroup.addEventListener("click", (event) => {
  const btn = event.target.closest(".element-btn");
  if (!btn) return;

  elementGroup.querySelectorAll(".element-btn").forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
  elementInput.value = btn.dataset.element;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!elementInput.value) {
    alert("오늘의 원소를 선택해주세요.");
    return;
  }

  const name = document.getElementById("name").value.trim();
  const gender = form.querySelector('input[name="gender"]:checked')?.value ?? "";
  const element = elementInput.value;

  showResult(name, gender, element);
});

retryBtn.addEventListener("click", () => {
  resultCard.hidden = true;
  formCard.hidden = false;
});

function showResult(name, gender, element) {
  const meta = ELEMENT_META[element];
  const fortuneList = FORTUNES[element];
  const fortune = pickRandom(fortuneList);
  const luckyColor = pickRandom(LUCKY_COLORS);
  const luckyItem = pickRandom(LUCKY_ITEMS);
  const luckyNumber = Math.floor(Math.random() * 45) + 1;

  resultIcon.textContent = meta.icon;
  resultTitle.textContent = `${element}의 기운이 함께하는 오늘`;
  resultGreeting.textContent = `${name ? name + "님, " : ""}${gender ? gender + " " : ""}오늘의 운세를 확인해보세요.`;
  resultFortune.textContent = fortune;
  luckyInfo.innerHTML = `
    <span>행운의 색 <strong>${luckyColor}</strong></span>
    <span>행운의 숫자 <strong>${luckyNumber}</strong></span>
    <span>행운의 아이템 <strong>${luckyItem}</strong></span>
  `;

  formCard.hidden = true;
  resultCard.hidden = false;
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}
