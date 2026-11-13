const form = document.querySelector("#consultation-form");
const status = document.querySelector(".form-status");
const submitButton = document.querySelector(".submit-button");
const submitLabel = document.querySelector("[data-submit-label]");
const topicSelect = document.querySelector("#topic");
const diagnosticResult = document.querySelector("[data-diagnostic-result]");
const diagnosticLink = document.querySelector("[data-diagnostic-link]");
const diagnosticOptions = document.querySelectorAll("[data-diagnostic]");
const fields = ["name", "phone", "topic", "consent"];
const company = document.querySelector("#company");
const GOOGLE_SHEETS_ENDPOINT = "https://script.google.com/macros/s/AKfycbyhWj0hdEYLbGQsG6S0zsatBuhTZA8Gyw-OVQmsPaWF0Zh95rrUTYDrzlUjhO29bCXPOQ/exec";

// 회사명은 선택 항목입니다. 이전 페이지가 캐시되어도 필수 검증이 남지 않게 명시적으로 해제합니다.
if (form) form.noValidate = true;
if (company) {
  company.required = false;
  company.removeAttribute("required");
  company.setCustomValidity("");
}

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

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.classList.remove("is-visible");
  if (!validateForm()) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }

  submitButton.disabled = true;
  submitLabel.textContent = "접수 중";

  const query = new URLSearchParams(window.location.search);
  const payload = new URLSearchParams({
    name: document.querySelector("#name").value.trim(),
    phone: document.querySelector("#phone").value.trim(),
    company: company?.value.trim() || "",
    topic: document.querySelector("#topic").value,
    consent: document.querySelector("#consent").checked ? "동의" : "",
    pageUrl: window.location.href,
    utmSource: query.get("utm_source") || "",
    utmMedium: query.get("utm_medium") || "",
    utmCampaign: query.get("utm_campaign") || "",
  });

  try {
    await fetch(GOOGLE_SHEETS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: payload,
    });

    status.textContent = "상담 신청이 접수되었습니다. 확인 후 연락드리겠습니다.";
    status.classList.add("is-visible");
    form.reset();
  } catch (error) {
    console.error("상담 신청 접수 오류", error);
    status.textContent = "접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    status.classList.add("is-visible");
  } finally {
    submitButton.disabled = false;
    submitLabel.textContent = "무료 상담 신청";
  }
});
