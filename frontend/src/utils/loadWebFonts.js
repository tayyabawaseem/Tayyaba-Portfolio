export default function loadWebFonts(families) {
  const uniqueFamilies = [...new Set(families.filter((family) => family && family !== "system-ui"))];
  if (!uniqueFamilies.length) return;
  const query = uniqueFamilies
    .map((family) => `family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@400;500;600;700;800`)
    .join("&");
  let link = document.getElementById("portfolio-custom-fonts");
  if (!link) {
    link = document.createElement("link");
    link.id = "portfolio-custom-fonts";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
