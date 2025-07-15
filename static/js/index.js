/* global alerts, auth, credits, gallery, home */

// eslint-disable-next-line no-unused-vars
const router = (function () {
  const module = {};

  let curPage = "home";
  let curArgs = null;

  module.navigate = function (route, args) {
    const _curPage = curPage;
    curPage = route;
    curArgs = args;

    if (!routes.get(route))
      console.error(`Error: route ${route} does not exist.`);
    if (routes.get(_curPage).unload) routes.get(_curPage).unload();

    routes.get(route).load(args || null);
  };

  module.getCurrentPage = function () {
    return {
      curPage,
      curArgs,
    };
  };

  // Each component can define functions: init, load, unload
  let routes = new Map([
    ["gallery", gallery],
    ["home", home],
    ["auth", auth],
    ["credits", credits],
  ]);

  window.onload = function () {
    alerts.init();

    routes.forEach(function (component) {
      if (component.init) {
        component.init();
      }
    });

    routes.get("home").load(null);
    alerts.setLoadingText("");
  };

  return module;
})();
