/* global meact, apiService, router */

const alerts = (function () {
  const [loadingText, getLoadingText, setLoadingText] = meact.useState("");
  const [errorText, getErrorText, setErrorText] = meact.useState("");

  const module = { setErrorText, setLoadingText };

  module.handleError = function ({ res, status }) {
    res.json().then((err) => {
      alerts.setErrorText(err.error);
      if (status === 401) {
        apiService.voidToken();
        router.navigate("home");
      }
    });

    setLoadingText("");
  };

  module.init = function () {
    meact.useEffect(
      function () {
        const text = getLoadingText();
        const loadingScreen = document.querySelector("#loadingScreen");

        if (text === "") loadingScreen.classList.add("hidden");
        else loadingScreen.classList.remove("hidden");

        document.querySelector("#loadingText").innerHTML = text;
      },
      [loadingText],
    );

    meact.useEffect(
      function () {
        const text = getErrorText();

        if (text === "") return;

        document.querySelector("#errorScreen").innerHTML = `
        <div class="error-container">
          <image class="error-icon" src="/media/warning.png"></image>
          <div class="error-text">${text}</div>
        </div>
      `;
      },
      [errorText],
    );
  };

  return module;
})();
