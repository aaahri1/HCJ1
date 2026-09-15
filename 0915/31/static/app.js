const dropzone = document.getElementById("dropzone");
const dropzoneText = document.getElementById("dropzone-text");
const fileInput = document.getElementById("file-input");
const slider = document.getElementById("sentence-slider");
const sentenceValue = document.getElementById("sentence-value");
const form = document.getElementById("upload-form");
const submitBtn = document.getElementById("submit-btn");
const statusEl = document.getElementById("status");
const resultCard = document.getElementById("result-card");
const resultMeta = document.getElementById("result-meta");
const summaryList = document.getElementById("summary-list");

let selectedFile = null;

function setFile(file) {
  if (!file) return;
  const ext = file.name.split(".").pop().toLowerCase();
  if (!["pdf", "docx"].includes(ext)) {
    showStatus("PDF 또는 DOCX 파일만 선택할 수 있습니다.", true);
    return;
  }
  selectedFile = file;
  dropzoneText.textContent = `선택된 파일: ${file.name}`;
  dropzone.classList.add("has-file");
  submitBtn.disabled = false;
  showStatus("");
}

fileInput.addEventListener("change", (e) => setFile(e.target.files[0]));

["dragenter", "dragover"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  })
);

["dragleave", "drop"].forEach((evt) =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
  })
);

dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  setFile(file);
});

slider.addEventListener("input", () => {
  sentenceValue.textContent = slider.value;
});

function showStatus(message, isError = false) {
  statusEl.hidden = !message;
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!selectedFile) return;

  submitBtn.disabled = true;
  resultCard.hidden = true;
  showStatus("요약 중입니다...");

  const formData = new FormData();
  formData.append("file", selectedFile);
  formData.append("num_sentences", slider.value);

  try {
    const res = await fetch("/api/summarize", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      showStatus(data.error || "요약 중 오류가 발생했습니다.", true);
      return;
    }

    showStatus("");
    summaryList.innerHTML = "";
    data.summary.forEach((sentence) => {
      const li = document.createElement("li");
      li.textContent = sentence;
      summaryList.appendChild(li);
    });
    resultMeta.textContent = `${data.filename} · 원문 ${data.original_char_count.toLocaleString()}자 → ${data.sentence_count}문장`;
    resultCard.hidden = false;
  } catch (err) {
    showStatus("서버와 통신 중 오류가 발생했습니다.", true);
  } finally {
    submitBtn.disabled = false;
  }
});
