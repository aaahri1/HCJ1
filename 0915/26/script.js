const LOREM_WORDS = (
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod " +
  "tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam " +
  "quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo " +
  "consequat duis aute irure in reprehenderit voluptate velit esse cillum " +
  "eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident " +
  "sunt culpa qui officia deserunt mollit anim id est laborum"
).split(" ");

const MIN_LENGTH = 10;
const MAX_LENGTH = 5000;
const DEFAULT_LENGTH = 150;
const SENTENCE_WORD_COUNT = [6, 14];
const PARAGRAPH_SENTENCE_COUNT = [3, 6];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function buildLoremText(targetLength) {
  let paragraphs = [];
  let currentLength = 0;
  let wordIndex = 0;

  while (currentLength < targetLength) {
    const sentenceCount = randomInt(
      PARAGRAPH_SENTENCE_COUNT[0],
      PARAGRAPH_SENTENCE_COUNT[1]
    );
    let sentences = [];

    for (let s = 0; s < sentenceCount; s++) {
      const wordCount = randomInt(SENTENCE_WORD_COUNT[0], SENTENCE_WORD_COUNT[1]);
      let words = [];
      for (let w = 0; w < wordCount; w++) {
        words.push(LOREM_WORDS[wordIndex % LOREM_WORDS.length]);
        wordIndex++;
      }
      let sentence = words.join(" ");
      sentence = capitalize(sentence) + ".";
      sentences.push(sentence);

      currentLength += sentence.length + 1;
      if (currentLength >= targetLength) break;
    }

    paragraphs.push(sentences.join(" "));
    if (currentLength >= targetLength) break;
  }

  let text = paragraphs.join("\n\n");

  if (text.length > targetLength) {
    text = text.slice(0, targetLength);
  }

  return text;
}

const slider = document.getElementById("length-slider");
const numberInput = document.getElementById("length-input");
const output = document.getElementById("output");
const charCountLabel = document.getElementById("char-count");
const copyBtn = document.getElementById("copy-btn");

function render(length) {
  const text = buildLoremText(length);
  output.value = text;
  charCountLabel.textContent = `${text.length}자`;
}

function clamp(value) {
  if (Number.isNaN(value)) return DEFAULT_LENGTH;
  return Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, value));
}

function setLength(length, { syncInputs = true } = {}) {
  const clamped = clamp(length);
  if (syncInputs) {
    slider.value = clamped;
    numberInput.value = clamped;
  }
  render(clamped);
}

slider.addEventListener("input", () => {
  numberInput.value = slider.value;
  render(Number(slider.value));
});

numberInput.addEventListener("input", () => {
  const value = Number(numberInput.value);
  if (!Number.isNaN(value) && value >= MIN_LENGTH && value <= MAX_LENGTH) {
    slider.value = value;
    render(value);
  }
});

numberInput.addEventListener("change", () => {
  setLength(Number(numberInput.value));
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(output.value);
    copyBtn.textContent = "복사됨!";
    copyBtn.classList.add("copied");
    setTimeout(() => {
      copyBtn.textContent = "복사";
      copyBtn.classList.remove("copied");
    }, 1500);
  } catch (err) {
    output.select();
    document.execCommand("copy");
  }
});

setLength(DEFAULT_LENGTH);
