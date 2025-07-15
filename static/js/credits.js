/* global router */

// eslint-disable-next-line no-unused-vars
const credits = (function () {
  const module = {};

  module.unload = function () {
    document.querySelector("#credits").classList.add("hidden");
  };

  module.load = function () {
    document.querySelector("#credits").classList.remove("hidden");
  };

  module.init = function () {
    document
      .querySelector("#creditsNavButton")
      .addEventListener("click", function () {
        router.navigate("credits");
      });

    document.querySelector("#credits").classList.add("hidden");
  };

  return module;
})();
