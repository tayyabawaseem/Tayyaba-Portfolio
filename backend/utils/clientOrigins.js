export const getAllowedClientOrigins = (environment = process.env) => {
  const developmentOrigins = environment.NODE_ENV === "production"
    ? []
    : [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174"
    ];
  const configuredOrigins = [environment.CLIENT_URLS, environment.CLIENT_URL]
    .filter((value) => typeof value === "string" && value.trim())
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      let url;
      try {
        url = new URL(value);
      } catch {
        throw new Error("CLIENT_URL or CLIENT_URLS contains an invalid origin.");
      }
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("CLIENT_URL or CLIENT_URLS must use HTTP or HTTPS.");
      }
      return url.origin;
    });
  const allowedOrigins = [...new Set([...developmentOrigins, ...configuredOrigins])];

  if (allowedOrigins.length === 0) {
    throw new Error("CLIENT_URL or CLIENT_URLS must configure at least one allowed origin.");
  }
  return allowedOrigins;
};
