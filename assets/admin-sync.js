(() => {
  const apiBase = "https://vijay-tours-admin.mittar963.chatgpt.site";

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
      const response = await fetch(`${apiBase}/api/public/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Submission failed");
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
