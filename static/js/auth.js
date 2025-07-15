/* global alerts, apiService, router */

// eslint-disable-next-line no-unused-vars
const auth = (function () {
  "use strict";

  const module = {};
  let g_action;

  function exitPage() {
    router.navigate("home", null);
  }

  module.unload = function () {
    alerts.setLoadingText("");
    document.querySelector("#auth").classList.add("hidden");
  };

  module.load = function ({ action }) {
    g_action = action;

    if (action === "signout") {
      alerts.setLoadingText("signing out ...");
      if (apiService.isSignedIn())
        apiService
          .signout()
          .then(() => {
            exitPage();
          })
          .catch(alerts.handleError);
      else {
        alerts.setErrorText("Not Signed In.");
        alerts.setLoadingText("");
      }

      exitPage();
    } else {
      switch (action) {
        case "signin":
          document.querySelector("#authTitle").innerHTML =
            "Sign Into An Account";
          document.querySelector("#authButton").innerHTML = "Sign in";
          break;
        case "signup":
          document.querySelector("#authTitle").innerHTML = "Create An Account";
          document.querySelector("#authButton").innerHTML = "Sign up";
          break;
      }
      document.querySelector("#auth").classList.remove("hidden");
    }
  };

  module.init = function () {
    function navigate(action) {
      const { curPage, curArgs } = router.getCurrentPage();

      router.navigate("auth", {
        action,
        redirect: curPage,
        args: curArgs,
      });
    }

    document
      .querySelector("#loginNavButton")
      .addEventListener("click", () => navigate("signin"));

    document
      .querySelector("#signupNavButton")
      .addEventListener("click", () => navigate("signup"));

    document
      .querySelector("#signoutNavButton")
      .addEventListener("click", () => navigate("signout"));

    document.querySelector("#auth").addEventListener("submit", function (e) {
      e.preventDefault();

      const formData = new FormData(e.target);
      const formProps = Object.fromEntries(formData);
      document.querySelector("#authForm").reset();

      let loadingText;
      switch (g_action) {
        case "signup":
          loadingText = "Signing up ...";
          break;
        case "signin":
          loadingText = "Signing in ...";
          break;
      }

      alerts.setLoadingText(loadingText);

      apiService
        .authenticate(g_action, formProps.username, formProps.password)
        .then(exitPage)
        .catch(alerts.handleError);
    });
  };

  return module;
})();
