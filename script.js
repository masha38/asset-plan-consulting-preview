const form = document.querySelector("#consultation-form");
const status = document.querySelector(".form-status");
const submitButton = document.querySelector(".submit-button");
const submitLabel = document.querySelector("[data-submit-label]");
const topicSelect = document.querySelector("#topic");
const diagnosticResult = document.querySelector("[data-diagnostic-result]");
const diagnosticLink = document.querySelector("[data-diagnostic-link]");
const diagnosticOptions = document.querySelectorAll("[data-diagnostic]");
const fields = ["name", "phone", "topic", "consent"];

function selectDiagnostic(option) {
  diagnosticOptions.forEach((item) => item.classList.toggle("is-active", item === option));
  if (diagnosticResult) diagnosticResult.textContent = option.dataset.diagnostic;
}

diagnosticOptions.forEach((option) => option.addEventListener("click", () => selectDiagnostic(option)));
diagnosticLink?.addEventListener("click", () => {
  const activeOption = document.querySelector("[data-diagnostic].is-active");
  if (activeOption && topicSelect) topicSelect.value = activeOption.dataset.diagnostic;
});

function setError(fieldName, message) {
  const field = document.querySelector(`#${fieldName}`);
  const error = document.querySelector(`[data-error-for="${fieldName}"]`);
  if (!field || !error) return;
  if (message) { field.setAttribute("aria-invalid", "true"); error.textContent = message; }
  else { field.removeAttribute("aria-invalid"); error.textContent = ""; }
}

function validateForm() {
  let valid = true;
  fields.forEach((fieldName) => setError(fieldName, ""));
  const name = document.querySelector("#name");
  const phone = document.querySelector("#phone");
  const topic = document.querySelector("#topic");
  const consent = document.querySelector("#consent");
  if (!name.value.trim()) { setError("name", "이름을 입력해 주세요."); valid = false; }
  if (!phone.value.trim()) { setError("phone", "연락처를 입력해 주세요."); valid = false; }
  else if (!/^[0-9\s-]{9,13}$/.test(phone.value.trim())) { setError("phone", "연락처 형식을 확인해 주세요."); valid = false; }
  if (!topic.value) { setError("topic", "상담 항목을 선택해 주세요."); valid = false; }
  if (!consent.checked) { setError("consent", "개인정보 수집 및 이용 동의가 필요합니다."); valid = false; }
  return valid;
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  status.classList.remove("is-visible");
  if (!validateForm()) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }
  submitButton.disabled = true;
  submitLabel.textContent = "확인 중";
  window.setTimeout(() => {
    submitButton.disabled = false;
    submitLabel.textContent = "무료 금융진단 신청";
    status.textContent = "신청 화면이 정상적으로 작동합니다. 현재 시안에서는 정보가 저장되지 않습니다.";
    status.classList.add("is-visible");
    form.reset();
  }, 500);
});
