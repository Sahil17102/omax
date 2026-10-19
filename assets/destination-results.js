function placeDestinationResultsNextToPicker() {
  const picker = document.querySelector(".quick");
  const results = document.querySelector(".all-packages");

  if (!picker || !results) return false;
  if (picker.nextElementSibling !== results) {
    picker.after(results);
  }
  return true;
}

if (!placeDestinationResultsNextToPicker()) {
  const observer = new MutationObserver(() => {
    if (placeDestinationResultsNextToPicker()) observer.disconnect();
  });

  observer.observe(document.getElementById("root"), {
    childList: true,
    subtree: true,
  });
}
