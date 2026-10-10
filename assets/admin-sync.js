(() => {
  const apiBase = "https://omax-admin-control.pkmmittal97.chatgpt.site";
  const navIds = ["international-trips", "india-trips", "india-tour-packages", "golden-triangle", "rajasthan", "tiger-safari", "food-tours"];
  const postJson = (url, payload) => new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", url, true);
    request.setRequestHeader("Content-Type", "application/json");
    request.timeout = 10000;
    request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error("Submission failed"));
    request.onerror = request.ontimeout = () => reject(new Error("Submission failed"));
    request.send(JSON.stringify(payload));
  });

  function applyAdminControls(cms) {
    if (!cms) return;
    window.__VIT_CMS__ = cms;
    try { sessionStorage.setItem("vit-cms", JSON.stringify(cms)); } catch {}
    const nav = document.querySelector(".mainnav");
    if (nav) {
      const controlHash = JSON.stringify([cms.settings?.navigationItems || "", (cms.tours || []).filter(t => t.showInNavbar && t.published).map(t => [t.id,t.name])]);
      if (nav.dataset.adminControlHash === controlHash) return;
      nav.dataset.adminControlHash = controlHash;
      const baseNodes = [...nav.children].filter(node => !node.classList.contains("mobile-enquire") && !node.classList.contains("cms-tour-nav"));
      baseNodes.slice(0, navIds.length).forEach((node, index) => node.dataset.adminNavId = navIds[index]);
      let items;
      try { items = JSON.parse(cms.settings?.navigationItems || "null"); } catch {}
      if (Array.isArray(items)) {
        items.sort((a,b) => a.order-b.order).forEach(item => {
          const node = nav.querySelector(`[data-admin-nav-id="${item.id}"]`);
          if (!node) return;
          node.hidden = item.visible === false;
          const label = node.matches("a") ? node : node.querySelector("button");
          if (label && node.matches("a")) label.textContent = item.label;
          else if (label?.firstChild) label.firstChild.textContent = `${item.label} `;
          nav.insertBefore(node, nav.querySelector(".mobile-enquire"));
        });
      }
      nav.querySelectorAll(".cms-tour-nav").forEach(node => node.remove());
      (cms.tours || []).filter(t => t.showInNavbar && t.published).forEach(tour => {
        const link = document.createElement("a");
        link.className = "cms-tour-nav";
        link.href = `#tour/${tour.id}`;
        link.textContent = tour.name;
        nav.insertBefore(link, nav.querySelector(".mobile-enquire"));
      });
    }
  }

  fetch(`${apiBase}/api/public/bootstrap?v=${Date.now()}`, { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(cms => {
    if (!cms) return;
    applyAdminControls(cms);
    const observer = new MutationObserver(() => applyAdminControls(cms));
    observer.observe(document.getElementById("root"), { childList:true, subtree:true });
  }).catch(() => {});

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
