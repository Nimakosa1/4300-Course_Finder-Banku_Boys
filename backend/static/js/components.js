document.addEventListener("DOMContentLoaded", function () {
  const lineClampElements = document.querySelectorAll(".line-clamp-2");
  lineClampElements.forEach((element) => {
    element.style.display = "-webkit-box";
    element.style.webkitLineClamp = "2";
    element.style.webkitBoxOrient = "vertical";
    element.style.overflow = "hidden";
  });
});
