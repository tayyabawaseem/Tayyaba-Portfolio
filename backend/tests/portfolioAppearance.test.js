import test from "node:test";
import assert from "node:assert/strict";
import {
  createProfileUpdateFields,
  getPublicProfile,
  validateAppearance,
  validateSection
} from "../controllers/portfolioController.js";
import Portfolio from "../models/Portfolio.js";

test("public profile response exposes only the public profile section", async () => {
  const originalFindOne = Portfolio.findOne;
  Portfolio.findOne = () => ({
    lean: async () => ({
      data: {
        profile: { name: "Portfolio owner", heroConfig: { titles: [] } },
        privateAdminSettings: { token: "not exposed" }
      }
    })
  });
  const response = {
    json(payload) {
      this.payload = payload;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    }
  };

  try {
    await getPublicProfile({}, response);
    assert.deepEqual(response.payload, {
      success: true,
      profile: { name: "Portfolio owner", heroConfig: { titles: [] } }
    });
  } finally {
    Portfolio.findOne = originalFindOne;
  }
});

test("accepts independent dark and light color palettes", () => {
  const result = validateAppearance({
    colors: {
      dark: { background: "#080a12", primary: "#a78bfa" },
      light: { background: "#f5f6fb", primary: "#7152df" },
    },
  });

  assert.deepEqual(result, {
    data: {
      colors: {
        dark: { background: "#080a12", primary: "#a78bfa" },
        light: { background: "#f5f6fb", primary: "#7152df" },
      },
    },
  });
});

test("continues accepting legacy flat color settings", () => {
  assert.deepEqual(validateAppearance({ colors: { backgroundLight: "#f5f6fb" } }), {
    data: { colors: { backgroundLight: "#f5f6fb" } },
  });
});

test("rejects unsupported palette fields and malformed colors", () => {
  assert.match(validateAppearance({ colors: { dark: { unknown: "#000000" } } }).error, /supported hexadecimal color/);
  assert.match(validateAppearance({ colors: { light: { background: "white" } } }).error, /supported hexadecimal color/);
});

test("validates job titles stored in the existing profile section", () => {
  assert.deepEqual(
    validateSection("profile", {
      name: "Tayyaba Waseem",
      jobTitles: [" MERN Stack Developer ", "Backend Developer"]
    }),
    {
      data: {
        name: "Tayyaba Waseem",
        jobTitles: ["MERN Stack Developer", "Backend Developer"]
      }
    }
  );
  assert.match(
    validateSection("profile", { name: "Tayyaba", jobTitles: ["Developer", 5] }).error,
    /jobTitles must be a list of text values/
  );
});

test("validates structured Hero titles, orbit settings, and accessibility controls", () => {
  const heroConfig = {
    titles: [{
      id: "title-1",
      label: "Full Stack Developer",
      enabled: true,
      order: 0,
      pauseMs: 1200
    }],
    typing: {
      enabled: true,
      typingSpeedMs: 60,
      deletingSpeedMs: 35,
      style: "type-only",
      reducedMotion: "static-first"
    },
    badges: [{
      id: "badge-1",
      label: " React.js ",
      orbit: "inner",
      order: 0,
      enabled: true,
      angle: -90
    }],
    orbit: {
      enabled: true,
      rings: [{
        name: "inner",
        enabled: true,
        size: 78,
        durationMs: 12000,
        direction: "clockwise",
        lineThickness: 1,
        color: "#a78bfa",
        glow: 25
      }]
    },
    cursor: { enabled: false, dotSize: 7, followerSize: 34 }
  };

  const validated = validateSection("profile", { heroConfig });
  assert.equal(validated.data.heroConfig.titles[0].label, "Full Stack Developer");
  assert.equal(validated.data.heroConfig.badges[0].label, "React.js");
  assert.equal(validated.data.heroConfig.badges[0].icon, "");
  assert.equal(validated.data.heroConfig.orbit.rings[0].durationMs, 12000);
  assert.match(validateSection("profile", {
    heroConfig: { titles: [{ id: "same", label: "A", enabled: true, order: 0 }, { id: "same", label: "B", enabled: true, order: 1 }] }
  }).error, /IDs must be unique/);
  assert.match(validateSection("profile", {
    heroConfig: { cursor: { enabled: true, cursorScript: "invalid" } }
  }).error, /unsupported or invalid settings/);
  assert.match(validateSection("profile", {
    heroConfig: { typing: { typingSpeedMs: 1 } }
  }).error, /Typing settings contain invalid values/);
  assert.match(validateSection("profile", {
    heroConfig: { typing: { style: "bounce" } }
  }).error, /Typing settings contain invalid values/);
});

test("validates fixed badge positions and partial responsive content layout", () => {
  const result = validateSection("profile", {
    heroConfig: {
      badges: [{
        id: "badge-fixed",
        label: "React.js",
        orbit: "inner",
        order: 0,
        enabled: true,
        angle: -90,
        position: "top",
        offsetX: 12,
        offsetY: -6
      }],
      contentLayout: {
        desktop: {
          contentGap: 500,
          elements: {
            heroContent: {
              margin: { top: 350, right: 0, bottom: 500, left: 0 },
              padding: { top: 0, right: 12, bottom: 0, left: 12 },
              width: 720,
              alignment: "left"
            },
            socialIcons: {
              iconSize: 24,
              horizontalGap: 18,
              verticalGap: 12,
              iconPadding: 8,
              borderRadius: 10,
              hoverSpacing: 4,
              hoverEffect: "lift"
            }
          }
        },
        mobile: {
          descriptionMarginTop: 36,
          descriptionLineHeight: 1.8,
          descriptionTextAlign: "center"
        }
      }
    }
  });
  assert.equal(result.data.heroConfig.badges[0].position, "top");
  assert.equal(result.data.heroConfig.contentLayout.desktop.elements.heroContent.margin.top, 350);
  assert.equal(result.data.heroConfig.contentLayout.desktop.elements.heroContent.margin.bottom, 500);
  assert.equal(result.data.heroConfig.contentLayout.desktop.elements.socialIcons.horizontalGap, 18);
  assert.equal(result.data.heroConfig.contentLayout.mobile.descriptionMarginTop, 36);
  assert.match(validateSection("profile", {
    heroConfig: {
      contentLayout: {
        mobile: { elements: { description: { margin: { left: -1 } } } }
      }
    }
  }).error, /non-negative pixel value/);
  assert.match(validateSection("profile", {
    heroConfig: {
      contentLayout: {
        tablet: { elements: { buttons: { gap: 2001 } } }
      }
    }
  }).error, /between 0 and 2000/);
  assert.match(validateSection("profile", {
    heroConfig: { badges: [{ id: "badge-invalid", label: "Node", orbit: "inner", order: 0, enabled: true, angle: 0, position: "diagonal" }] }
  }).error, /valid label, orbit, angle/);
  assert.match(validateSection("profile", {
    heroConfig: { contentLayout: { tablet: { descriptionMaxWidth: 10 } } }
  }).error, /descriptionMaxWidth is invalid/);
});

test("builds dotted profile updates so partial Hero edits preserve unrelated data", () => {
  assert.deepEqual(createProfileUpdateFields({
    name: "Tayyaba Waseem",
    heroConfig: {
      contentLayout: {
        mobile: {
          descriptionMarginTop: 36,
          elements: {
            socialIcons: { horizontalGap: 20, margin: { top: 12, right: 0, bottom: 8, left: 0 } }
          }
        }
      }
    }
  }), {
    "data.profile.name": "Tayyaba Waseem",
    "data.profile.heroConfig.contentLayout.mobile.descriptionMarginTop": 36,
    "data.profile.heroConfig.contentLayout.mobile.elements.socialIcons.horizontalGap": 20,
    "data.profile.heroConfig.contentLayout.mobile.elements.socialIcons.margin.top": 12,
    "data.profile.heroConfig.contentLayout.mobile.elements.socialIcons.margin.right": 0,
    "data.profile.heroConfig.contentLayout.mobile.elements.socialIcons.margin.bottom": 8,
    "data.profile.heroConfig.contentLayout.mobile.elements.socialIcons.margin.left": 0
  });
});

test("persists enabled state for individual custom Hero social links", () => {
  assert.deepEqual(validateSection("socials", {
    other: [{ label: "Portfolio", url: "https://example.com", enabled: false }]
  }), {
    data: {
      other: [{ label: "Portfolio", url: "https://example.com/", enabled: false }]
    }
  });
  assert.match(validateSection("socials", {
    other: [{ label: "   ", url: "https://example.com" }]
  }).error, /label and URL/);
});
