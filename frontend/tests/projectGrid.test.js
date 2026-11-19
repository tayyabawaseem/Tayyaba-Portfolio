import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const css = await readFile(new URL("../src/App.css", import.meta.url), "utf8");
const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

test("Projects uses two equal columns by default, including desktop widths", () => {
  assert.match(css, /\.projects-grid\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)[^}]*width:\s*100%[^}]*gap:\s*24px/s);
  assert.doesNotMatch(css, /\.project-grid\s*\{/);
});

test("Projects keeps two columns across tablet widths until the mobile override", () => {
  assert.doesNotMatch(css, /@media\s*\([^)]*(?:min-width:\s*768px|max-width:\s*1199px)[^)]*\)[^{]*\{[^}]*\.projects-grid\s*\{/s);
});

test("project cards use one column below 768px", () => {
  assert.match(css, /@media\s*\(max-width:\s*767px\)\s*\{[\s\S]*?\.projects-grid\s*\{[^}]*grid-template-columns:\s*1fr/s);
});

test("project thumbnails fill the image frame without cropping or distortion", () => {
  assert.match(css, /\.project-visual\s*\{[^}]*aspect-ratio:\s*16\s*\/\s*10/s);
  assert.match(css, /\.project-visual\s+img\s*\{[^}]*width:\s*100%[^}]*height:\s*100%[^}]*object-fit:\s*contain[^}]*object-position:\s*center/s);
});

test("published projects render as direct project card children of the grid", () => {
  assert.match(app, /<div className="projects-grid">\s*\{items\.map\([\s\S]*?<SiteAnimation as="article"[^>]*className="project-card"/);
  assert.match(app, /setProjects\(projectsResponse\.data\.projects\s*\|\|\s*\[\]\)/);
  assert.match(app, /api\.get\("projects"\)/);
});

test("projects heading uses the shared left-aligned section heading layout", () => {
  assert.doesNotMatch(css, /\.projects-section\s*>\s*\.section-heading\s*\{/);
  assert.match(css, /\.section-heading\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*70px\s+1fr/s);
  assert.match(app, /function SectionHeading\(\{ index, title, description \}\)/);
  assert.match(app, /<SectionHeading \{\.\.\.heading\}\s*\/>[\s\S]*?<div className="projects-grid">/);
});
