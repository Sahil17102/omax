(() => {
  const apiBase = "https://vijay-tours-admin.mittar963.chatgpt.site";
  const postJson = (url, payload) => new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Content-Type", "application/json");
    request.timeout = 10000;
    request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error("Submission failed"));
    request.onerror = request.ontimeout = () => reject(new Error("Submission failed"));
    request.send(JSON.stringify(payload));
  });

  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.querySelector('button.submit')) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const button = form.querySelector('button.submit');
    const original = button?.textContent || "Send enquiry";
    if (button) {
      button.disabled = true;
      button.textContent = "Sending enquiry…";
    }

    const fields = new FormData(form);
    const hash = location.hash.match(/^#(?:tour|official|international)\/(.+)$/);
    const currentTour = window.__VIT_CMS__?.tours?.find((tour) => tour.id === hash?.[1]);
    const country = document.querySelector(".market-flag")?.parentElement?.textContent?.trim() || "";
    const payload = {
      name: fields.get("name"),
      phone: fields.get("phone"),
      email: fields.get("email"),
      travelDate: fields.get("dates"),
      message: fields.get("message"),
      country,
      tourId: currentTour?.id || null,
      tourName: currentTour?.name || "General enquiry",
    };

    try {
      await postJson(`${apiBase}/api/public/enquiries`, payload);
      form.innerHTML = '<div class="form-success"><h3>Enquiry received</h3><p>Thank you. Your details are now with the Vijay India Tours team and they will contact you shortly.</p><button type="button" onclick="location.reload()">Send another enquiry</button></div>';
    } catch {
      if (button) {
        button.disabled = false;
        button.textContent = original;
      }
      window.alert("Enquiry could not be sent. Please try again or contact us by phone.");
    }
  }, true);
})();
