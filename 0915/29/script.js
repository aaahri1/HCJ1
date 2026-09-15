const form = document.getElementById("bmi-form");
const resultSection = document.getElementById("result");
const bmiNumberEl = document.getElementById("bmi-number");
const bmiCategoryEl = document.getElementById("bmi-category");
const currentWeightEl = document.getElementById("current-weight");
const standardWeightEl = document.getElementById("standard-weight");
const targetBody = document.getElementById("target-body");

const STANDARD_WEIGHT_FACTOR = { male: 22, female: 21 };
const TARGET_RATIOS = [90, 100, 110];

function getBmiCategory(bmi) {
  if (bmi < 18.5) return { label: "저체중", className: "underweight" };
  if (bmi < 23) return { label: "정상", className: "normal" };
  if (bmi < 25) return { label: "과체중", className: "overweight" };
  return { label: "비만", className: "obese" };
}

function formatKg(value) {
  return value.toFixed(1);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const heightCm = parseFloat(document.getElementById("height").value);
  const weightKg = parseFloat(document.getElementById("weight").value);
  const gender = form.querySelector('input[name="gender"]:checked').value;

  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return;
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const standardWeight = heightM * heightM * STANDARD_WEIGHT_FACTOR[gender];
  const category = getBmiCategory(bmi);

  bmiNumberEl.textContent = bmi.toFixed(1);
  bmiCategoryEl.textContent = category.label;
  bmiCategoryEl.className = `badge ${category.className}`;
  currentWeightEl.textContent = formatKg(weightKg);
  standardWeightEl.textContent = formatKg(standardWeight);

  targetBody.innerHTML = "";
  TARGET_RATIOS.forEach((ratio) => {
    const targetWeight = standardWeight * (ratio / 100);
    const diff = targetWeight - weightKg;

    const row = document.createElement("tr");

    const ratioCell = document.createElement("td");
    ratioCell.textContent = `${ratio}%`;

    const targetCell = document.createElement("td");
    targetCell.textContent = `${formatKg(targetWeight)}kg`;

    const diffCell = document.createElement("td");
    if (Math.abs(diff) < 0.05) {
      diffCell.textContent = "도달";
      diffCell.className = "diff-none";
    } else if (diff < 0) {
      diffCell.textContent = `${formatKg(Math.abs(diff))}kg 감량`;
      diffCell.className = "diff-lose";
    } else {
      diffCell.textContent = `${formatKg(diff)}kg 증량`;
      diffCell.className = "diff-gain";
    }

    row.append(ratioCell, targetCell, diffCell);
    targetBody.appendChild(row);
  });

  resultSection.hidden = false;
});
