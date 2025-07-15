// eslint-disable-next-line no-unused-vars
const apiService = (function () {
  "use strict";

  let token = localStorage.getItem("token");
  const module = {};


  /*  ******* Data types *******
    image objects must have at least the following attributes:
        - (String) imageId
        - (String) title
        - (String) author
        - (String) url
        - (Date) date

    comment objects must have the following attributes
        - (String) commentId
        - (String) imageId
        - (String) author
        - (String) content
        - (Date) date
  */

  function createRequest(
    url,
    method = "GET",
    body = {},
    contentType = "application/json",
  ) {
    const headers = {};

    if (token) headers["Authorization"] = `Authorization ${token}`;

    if (contentType === "application/json") body = JSON.stringify(body);
    if (contentType !== "multipart/form-data")
      headers["Content-Type"] = contentType;

    let promise;
    if (method !== "GET")
      promise = fetch(url, {
        headers,
        body,
        method,
      });
    else
      promise = fetch(url, {
        headers,
        method,
      });

    return promise.then((res) => {
      if (res.ok) return res.json();
      return Promise.reject({
        res,
        status: res.status,
      });
    });
  }

  // add an image to the gallery and return the newly created image id
  module.addImage = function (formData) {
    return createRequest(
      "/api/images",
      "POST",
      formData,
      "multipart/form-data",
    );
  };

  module.voidToken = function () {
    token = null;
    localStorage.removeItem("token");
  };

  // delete an image from the gallery given its imageId
  module.deleteImage = function (imageId) {
    return createRequest(`/api/images/${imageId}`, "DELETE");
  };

  // add a comment to an image
  module.addComment = function (imageId, content) {
    return createRequest(`/api/images/${imageId}/comments`, "POST", {
      content,
    });
  };

  // delete a comment to an image
  module.deleteComment = function (commentId) {
    return createRequest(`/api/comments/${commentId}`, "DELETE");
  };

  /*
   * given an image id return the data associated with it. Return null if the
   * image id is invalid
   */
  module.getImage = function (cursor, fetchPrev, id) {
    const fetchMode = fetchPrev ? "prev" : "next";

    return createRequest(
      `/api/users/${id}/images/?action=${fetchMode}&cursor=${cursor}`,
    );
  };

  /*
   * returns the comments associated with the given image id on the given page
   * where each page a number of comments specified by the given variable limit
   */
  module.getComments = function (imageId, page) {
    return createRequest(`/api/images/${imageId}/comments?page=${page}`);
  };

  module.signout = function () {
    return createRequest("/api/users/signout", "DELETE").then(
      module.voidToken
    );
  };

  module.authenticate = function (action, username, password) {
    if (["signup", "signin"].includes(action))
      return createRequest(`/api/users/${action}`, "POST", {
        username,
        password,
      }).then((res) => {
          token = res.token;
          localStorage.setItem("token", res.token);
      });
  };

  module.me = function () {
    // me
    return createRequest("/api/users/me");
  };

  module.getGalleries = function () {
    return createRequest("/api/users");
  };

  module.isSignedIn = function () {
    return token !== null && token !== undefined;
  };

  return module;
})();
