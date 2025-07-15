/* global alerts, meact, apiService, router */

// eslint-disable-next-line no-unused-vars
const home = (function () {
  "use strict";
  const [galleries, getGalleries, setGallery] = meact.useState(null);

  const module = {};

  function GalleryComponent(gallery) {
    const component = document.createElement("div");
    let image;
    if (!gallery.imageId) image = "/media/placeholder.jpg";
    else image = `/api/images/${gallery.imageId}/image`;

    component.innerHTML = `
      <div class="home-elem-container">
        <img
          src="${image}"
          class="home-thumbnail"
          />
        <div class="home-description">${gallery.username}'s Gallery</div>
      </div>`;

    component.addEventListener("click", () => {
      router.navigate("gallery", { id: gallery.userId });
    });

    component.addEventListener("mouseover", () => {
      component
        .querySelector(".home-thumbnail")
        .classList.add("home-thumbnail-focused");
    });

    component.addEventListener("mouseout", () => {
      component
        .querySelector(".home-thumbnail")
        .classList.remove("home-thumbnail-focused");
    });

    return component;
  }

  module.init = function () {
    document.querySelector("#homeNavButton").addEventListener("click", () => {
      router.navigate("home");
    });

    meact.useEffect(() => {
      const res = getGalleries();

      if (!res || !res.users) return;

      res.users.forEach((gallery) => {
        document.querySelector("#home").append(GalleryComponent(gallery));
      });
    }, [galleries]);
  };

  module.load = function () {
    const homeElem = document.querySelector("#home");
    homeElem.classList.remove("hidden");
    homeElem.innerHTML = "";

    apiService
      .getGalleries()
      .then((res) => setGallery(res))
      .catch(alerts.handleError);
  };

  module.unload = function () {
    document.querySelector("#home").classList.add("hidden");
  };

  return module;
})();
