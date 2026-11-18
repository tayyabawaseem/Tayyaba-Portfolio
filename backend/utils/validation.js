export const normalizeWebUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
};

export const isSafeActionUrl = (value, { allowAnchor = false, allowMailto = false, allowTel = false } = {}) => {
  if (typeof value !== "string") return false;
  const url = value.trim();
  if (!url) return true;
  if (allowAnchor && /^#[\w-]+$/.test(url)) return true;
  if (normalizeWebUrl(url)) return true;
  if (allowMailto && /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(url)) return true;
  if (allowTel && /^tel:\+?[0-9(). -]{5,30}$/i.test(url)) return true;
  return false;
};

export const isValidEmail = (value) =>
  typeof value === "string" &&
  value.length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
