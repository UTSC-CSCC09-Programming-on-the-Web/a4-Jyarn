/* global alerts, meact, apiService */

// eslint-disable-next-line no-unused-vars
const gallery = (function () {
  const [page, getComments, setComments] = meact.useState(null);
  const [image, getImage, setImage] = meact.useState(null);

  let userId;
  let thisUserId;
  let hideForm = false;
  let pageNo = 0;
  let imageNo = 1;

  const module = {};

  function getImageId() {
    const image = getImage();
    if (image === null) return null;
    return image.image === null ? null : image.image.id;
  }

  function fetchComments(page, setIfNull) {
    alerts.setLoadingText("Fetching comments ...");
    if (getImageId() === null) return Promise.resolve(null);
    return apiService
      .getComments(getImageId(), page)
      .then((res) => {
        if (!setIfNull && res.comments === null) return;

        pageNo = Math.max(page, 0);
        setComments(res);
      })
      .catch((err) => {
        alerts.handleError(err);
        return false;
      });
  }

  function fetchImage(next_cursor, fetchPrev, setIfNull, setImageNo = true) {
    alerts.setLoadingText("Fetching image ...");
    return apiService
      .getImage(next_cursor, fetchPrev, userId)
      .then((res) => {
        if (!setIfNull && res.image === null) {
          imageNo = 0;
          return false;
        }

        if (setImageNo) imageNo += fetchPrev ? -1 : 1;

        setImage(res);
        return true;
      })
      .catch((err) => {
        alerts.handleError(err);
        return false;
      });
  }

  function fetchCommentsAndImages(
    image_cursor,
    fetchPrev,
    setIfNull,
    setImageNo = true,
  ) {
    fetchImage(image_cursor, fetchPrev, setIfNull, setImageNo).then(() => {
      if (thisUserId)
        fetchComments(0, true).then(() => alerts.setLoadingText(""));
      else {
        pageNo = 0;
        setComments(null);
      }
    });
  }

  function CommentComponent(comment) {
    const newComment = document.createElement("div");
    const commentDate = new Date(comment.date);
    const hideDelete =
      thisUserId && (comment.userId === thisUserId || thisUserId === userId)
        ? ""
        : "hidden";

    newComment.classList.add("comment");
    newComment.classList.add("fade-in");
    newComment.innerHTML = `
        <div class="comment-info">
          <div>Posted By: ${comment.User.author}</div>
          <div class="comment-info-end">
            <div>${commentDate.toLocaleString()}</div>
            <div class="delete-comment-icon ${hideDelete}"></div>
          </div>
        </div>
        <div class="comment-body">
          ${comment.content}
        </div>
    `;

    // delete comment button
    newComment
      .querySelector(".delete-comment-icon")
      .addEventListener("click", function () {
        alerts.setLoadingText("Deleting comment ...");
        apiService
          .deleteComment(comment.id)
          .then(() => {
            fetchComments(0, true).then(() => alerts.setLoadingText(""));
          })
          .catch((err) => alerts.handleError(err));
      });

    return newComment;
  }

  module.init = function () {
    // post comment form
    document
      .querySelector("#commentForm")
      .addEventListener("submit", function (e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const formProps = Object.fromEntries(formData);

        alerts.setLoadingText("Posting comment ...");
        apiService
          .addComment(getImageId(), formProps.body)
          .then(() => {
            fetchComments(0, true).then(() => alerts.setLoadingText(""));
          })
          .catch((err) => {
            alerts.handleError(err);
          });

        document.querySelector("#commentForm").reset();
      });

    // post image form
    document
      .querySelector("#postImage")
      .addEventListener("submit", function (e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        // add image
        alerts.setLoadingText("Posting image ...");
        apiService
          .addImage(formData)
          .then(() => {
            imageNo = 1;
            fetchCommentsAndImages(-1, false, true, false);
          })
          .catch((err) => alerts.handleError(err));

        document.querySelector("#imageForm").reset();
      });

    document
      .querySelector("#postImageContainer")
      .addEventListener("click", () => {
        document.querySelector("#postImageButton").click();
      });

    document
      .querySelector("#postCommentContainer")
      .addEventListener("click", () => {
        document.querySelector("#postCommentButton").click();
      });

    document
      .querySelector("#imageUploadContainer")
      .addEventListener("click", () => {
        document.querySelector("#uploadImageInput").click();
      });

    // hide/show image form button
    document
      .querySelector("#hideImageFormButton")
      .addEventListener("click", function () {
        hideForm = !hideForm;
        document.querySelector("#imageForm").classList.toggle("hidden");

        document.querySelector("#hideImageFormButton").innerHTML = hideForm
          ? "Show"
          : "Hide";

        document.querySelector("#imageForm").reset();
      });

    meact.useEffect(
      function () {
        document.querySelector("#commentForm").classList.add("hidden");

        const commentSection = document.querySelector("#commentSection");
        commentSection.innerHTML = "";

        if (getImageId() === null) {
          alerts.setLoadingText("");
          return;
        }

        const data = getComments();
        document.querySelector("#commentForm").classList.remove("hidden");

        if (data === null) {
          alerts.setLoadingText("");
          return;
        }

        const { comments, count } = data;

        if (comments === null) return;

        // text for the showing-of element
        const showingOfText = `Showing ${Math.min(comments.length, 10).toString()} of ${count} comments. Page ${pageNo + 1}`;
        const hasNext = pageNo !== Math.ceil(count / 10) - 1 ? "" : "hidden";
        const hasPrev = pageNo !== 0 ? "" : "hidden";

        commentSection.innerHTML = `
          <div class="showing-of">${showingOfText}</div>
          <div class="row">
            <div id="prevCommentButton" class="prev-button next-button ${hasPrev}"></div>
            <div id="nextCommentButton" class="next-button ${hasNext}"></div>
          </div>
          `;

        document
          .querySelector("#prevCommentButton")
          .addEventListener("click", function () {
            fetchComments(pageNo - 1, false).then(() => {
              alerts.setLoadingText("");
            });
          });

        document
          .querySelector("#nextCommentButton")
          .addEventListener("click", function () {
            fetchComments(pageNo + 1, false).then(() => {
              alerts.setLoadingText("");
            });
          });

        comments.forEach(function (comment) {
          commentSection.append(CommentComponent(comment));
        });
      },
      [page],
    );

    meact.useEffect(
      function () {
        // get image gallery component and unhide it
        document.querySelector("#imageGallery").classList.remove("hidden");
        const imageDisplay = document.querySelector("#imageGallery");

        const data = getImage();
        if (data === null) {
          setComments(null);
          imageDisplay.innerHTML = "";
          return;
        }

        const { image, next_cursor, count } = data;
        if (image === null) {
          setComments(null);
          imageDisplay.innerHTML = "";
          return;
        }

        const imageDate = new Date(image.date);

        const hasPrev = imageNo !== 1 ? "" : "blank";
        const hasNext = imageNo !== count ? "" : "blank";
        const canDelete = thisUserId && thisUserId === userId ? "" : "blank";

        imageDisplay.innerHTML = `
          <div class="fade-in image-display">
          <!-- Image Credits -->
          <div class="message">${image.title}</div>
          <div>Date posted: ${imageDate.toLocaleString()}</div>
          <div>Image posted by: ${image.User.author}</div>

          <!-- Image Gallery -->
          <div class="image-div">
            <img src="/api/images/${image.id}/image" class="image">
          </div>

          <!-- Additional Controls -->
          <div>
            <div class="showing-of">Showing ${imageNo} of ${count} images</div>
            <div class="row">
              <div id="prevImageButton" class="prev-button next-button ${hasPrev}"></div>
              <button id="deleteImageButton" class="${canDelete}">Delete Image</button>
              <div id="nextImageButton" class="next-button ${hasNext}"></div>
            </div>
          </div>
          `;

        document
          .querySelector("#prevImageButton")
          .addEventListener("click", function () {
            fetchCommentsAndImages(next_cursor, true, false);
          });

        document
          .querySelector("#nextImageButton")
          .addEventListener("click", function () {
            fetchCommentsAndImages(next_cursor, false, false);
          });

        document
          .querySelector("#deleteImageButton")
          .addEventListener("click", function () {
            alerts.setLoadingText("Deleting image ...");
            apiService
              .deleteImage(image.id)
              .then(() => {
                fetchImage(next_cursor, true, false).then((hasBeenSet) => {
                  if (!hasBeenSet) {
                    fetchCommentsAndImages(next_cursor, false, true);
                  } else {
                    fetchComments(0, true).then(() =>
                      alerts.setLoadingText(""),
                    );
                  }
                });
              })
              .catch((err) => alerts.handleError(err));
          });
      },
      [image],
    );

    module.unload = function () {
      document.querySelector("#gallery").classList.add("hidden");
    };

    module.load = function ({ id }) {
      if (apiService.isSignedIn())
        apiService
          .me()
          .then((res) => {
            userId = id;
            thisUserId = res.id;
            imageNo = 1;
            fetchCommentsAndImages(-1, false, true, false);
            document.querySelector("#gallery").classList.remove("hidden");
            document
              .querySelector("#commentContainer")
              .classList.remove("hidden");

            if (thisUserId !== userId)
              document.querySelector("#postImage").classList.add("hidden");
            else
              document.querySelector("#postImage").classList.remove("hidden");
          })
          .catch(alerts.handleError);
      else {
        userId = id;
        thisUserId = null;
        imageNo = 1;
        fetchCommentsAndImages(-1, false, true, false);
        document.querySelector("#postImage").classList.add("hidden");
        document.querySelector("#gallery").classList.remove("hidden");
        document.querySelector("#commentContainer").classList.add("hidden");
      }
    };
  };

  return module;
})();
