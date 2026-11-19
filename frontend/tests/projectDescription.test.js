import test from "node:test";
import assert from "node:assert/strict";
import { parseProjectDescription } from "../src/utils/projectDescription.js";

test("plain descriptions become separate overview paragraphs without losing line breaks", () => {
  const sections = parseProjectDescription("First paragraph.\n\nSecond paragraph.\nA preserved line.");
  assert.equal(sections.length, 1);
  assert.equal(sections[0].heading, "Project Overview");
  assert.deepEqual(sections[0].blocks, [
    { type: "paragraph", text: "First paragraph." },
    { type: "paragraph", text: "Second paragraph.\nA preserved line." },
  ]);
});

test("markdown headings and feature bullets render as labeled sections and lists", () => {
  const sections = parseProjectDescription([
    "Overview copy.",
    "",
    "Key Features",
    "Smart scheduling - Adaptive planning - Progress tracking",
    "",
    "**Patient Portal**",
    "- Secure sign in",
    "- Appointment history",
    "",
    "### Project Highlights",
    "Improved access to care.",
  ].join("\n"));

  assert.equal(sections[0].kind, "overview");
  assert.equal(sections[1].kind, "features");
  assert.deepEqual(sections[1].blocks, [
    { type: "list", items: ["Smart scheduling", "Adaptive planning", "Progress tracking"] },
    { type: "subheading", text: "Patient Portal" },
    { type: "list", items: ["Secure sign in", "Appointment history"] },
  ]);
  assert.equal(sections[2].heading, "Project Highlights");
  assert.deepEqual(sections[2].blocks[0], { type: "list", items: ["Improved access to care."] });
});

test("legacy unbulleted feature and highlight entries become individual list items", () => {
  const sections = parseProjectDescription("Overview.\n\nKEY FEATURES\n\nCertification Programs: Show certification paths.\n\nStudent Stories: Share learner outcomes.\n\nKEY HIGHLIGHTS\n\nResponsive design\n\nAccessible course discovery");
  assert.deepEqual(sections.find((section) => section.kind === "features").blocks, [
    { type: "list", items: ["Certification Programs: Show certification paths."] },
    { type: "list", items: ["Student Stories: Share learner outcomes."] },
  ]);
  assert.deepEqual(sections.find((section) => section.kind === "highlights").blocks, [
    { type: "list", items: ["Responsive design"] },
    { type: "list", items: ["Accessible course discovery"] },
  ]);
});

test("technology stack text gets its own section and absent highlights are not invented", () => {
  const sections = parseProjectDescription("A project overview.\n\nTechnology Stack\nReact, Node.js, and MongoDB.");
  assert.equal(sections.filter((section) => section.kind === "highlights").length, 0);
  assert.equal(sections.find((section) => section.kind === "technologies").blocks[0].text, "React, Node.js, and MongoDB.");
});

test("structured description objects render overview, features, highlights, and extra sections", () => {
  const sections = parseProjectDescription({
    overview: "A structured overview.",
    features: ["Feature one", "Feature two"],
    highlights: ["Highlight one"],
    sections: [{ title: "Implementation", content: "Kept as provided." }],
  });
  assert.deepEqual(sections.map((section) => section.kind), ["overview", "features", "highlights", "content"]);
  assert.deepEqual(sections[1].blocks, [{ type: "list", items: ["Feature one", "Feature two"] }]);
  assert.equal(sections[3].blocks[0].text, "Kept as provided.");
});
