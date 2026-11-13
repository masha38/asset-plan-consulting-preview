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

const carousel = document.querySelector("[data-carousel]");

if (carousel) {
  const slides = [...carousel.querySelectorAll("[data-slide]")];
  const dots = [...carousel.querySelectorAll("[data-slide-to]")];
  const currentLabel = carousel.querySelector("[data-carousel-current]");
  const liveStatus = carousel.querySelector("[data-carousel-status]");
  const previousButton = carousel.querySelector("[data-carousel-prev]");
  const nextButton = carousel.querySelector("[data-carousel-next]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let activeIndex = 0;
  let rotationTimer;

  function showSlide(nextIndex, announce = true) {
    activeIndex = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      const isActive = index === activeIndex;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });
    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-selected", String(isActive));
      dot.tabIndex = isActive ? 0 : -1;
    });
    if (currentLabel) currentLabel.textContent = String(activeIndex + 1).padStart(2, "0");
    if (announce && liveStatus) liveStatus.textContent = `${activeIndex + 1}번째 배너 표시 중`;
  }

  function stopRotation() {
    window.clearInterval(rotationTimer);
  }

  function startRotation() {
    stopRotation();
    if (!reduceMotion && document.visibilityState === "visible") {
      rotationTimer = window.setInterval(() => showSlide(activeIndex + 1, false), 5500);
    }
  }

  previousButton?.addEventListener("click", () => { showSlide(activeIndex - 1); startRotation(); });
  nextButton?.addEventListener("click", () => { showSlide(activeIndex + 1); startRotation(); });
  dots.forEach((dot) => dot.addEventListener("click", () => { showSlide(Number(dot.dataset.slideTo)); startRotation(); }));
  carousel.addEventListener("mouseenter", stopRotation);
  carousel.addEventListener("mouseleave", startRotation);
  carousel.addEventListener("focusin", stopRotation);
  carousel.addEventListener("focusout", (event) => { if (!carousel.contains(event.relatedTarget)) startRotation(); });
  carousel.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); showSlide(activeIndex - 1); startRotation(); }
    if (event.key === "ArrowRight") { event.preventDefault(); showSlide(activeIndex + 1); startRotation(); }
  });
  document.addEventListener("visibilitychange", () => document.hidden ? stopRotation() : startRotation());
  showSlide(0, false);
  startRotation();
}

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
