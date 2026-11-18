import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import protectAdmin from "../middleware/authMiddleware.js";

test("uses the CORS development allowlist for mutating-request origin checks", async () => {
  const previous = {
    nodeEnv: process.env.NODE_ENV,
    clientUrls: process.env.CLIENT_URLS,
    clientUrl: process.env.CLIENT_URL
  };
  process.env.NODE_ENV = "development";
  delete process.env.CLIENT_URLS;
  delete process.env.CLIENT_URL;
  const invoke = async (origin) => {
    const response = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      }
    };
    await protectAdmin({
      method: "PUT",
      get: () => origin,
      cookies: {}
    }, response, () => {
      response.nextCalled = true;
    });
    return response;
  };

  try {
    const allowed = await invoke("http://localhost:5174");
    assert.equal(allowed.statusCode, 401);
    assert.equal(allowed.body.message, "Not authorized. Please login.");
    assert.equal(allowed.nextCalled, undefined);

    const disallowed = await invoke("http://localhost:5999");
    assert.equal(disallowed.statusCode, 403);
    assert.equal(disallowed.body.message, "Request origin is not allowed.");
  } finally {
    if (previous.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous.nodeEnv;
    if (previous.clientUrls === undefined) delete process.env.CLIENT_URLS;
    else process.env.CLIENT_URLS = previous.clientUrls;
    if (previous.clientUrl === undefined) delete process.env.CLIENT_URL;
    else process.env.CLIENT_URL = previous.clientUrl;
  }
});

test("accepts a valid admin cookie from the configured development origin", async () => {
  const previous = {
    nodeEnv: process.env.NODE_ENV,
    clientUrls: process.env.CLIENT_URLS,
    clientUrl: process.env.CLIENT_URL,
    jwtSecret: process.env.JWT_SECRET
  };
  const secret = "test-only-jwt-secret-that-is-long-enough";
  process.env.NODE_ENV = "development";
  process.env.JWT_SECRET = secret;
  delete process.env.CLIENT_URLS;
  delete process.env.CLIENT_URL;
  const originalFindById = Admin.findById;
  Admin.findById = async (id) => ({ _id: id, name: "Test Administrator" });
  const request = {
    method: "PUT",
    get: () => "http://localhost:5174",
    cookies: {
      adminToken: jwt.sign({ id: "test-admin-id" }, secret, { expiresIn: "1m" })
    }
  };
  const response = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
  let nextCalled = false;

  try {
    await protectAdmin(request, response, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(request.admin._id, "test-admin-id");
    assert.equal(response.statusCode, undefined);
  } finally {
    Admin.findById = originalFindById;
    if (previous.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous.nodeEnv;
    if (previous.clientUrls === undefined) delete process.env.CLIENT_URLS;
    else process.env.CLIENT_URLS = previous.clientUrls;
    if (previous.clientUrl === undefined) delete process.env.CLIENT_URL;
    else process.env.CLIENT_URL = previous.clientUrl;
    if (previous.jwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous.jwtSecret;
  }
});
