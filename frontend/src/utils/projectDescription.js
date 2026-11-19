const FEATURE_SECTIONS = new Set(["features", "key features"]);
const HIGHLIGHT_SECTIONS = new Set(["highlights", "key highlights", "project highlights"]);
const TECHNOLOGY_SECTIONS = new Set(["technology stack", "technologies used", "tech stack"]);
const PLAIN_HEADINGS = new Set([
  "overview", "project overview", "features", "key features", "highlights",
  "key highlights", "project highlights", "technology stack", "technologies used",
  "tech stack", "project challenge", "challenge", "solution", "project goal",
  "goal", "security & technical highlights", "technical highlights"
]);

const cleanHeading = (value) => value
  .replace(/^\*+|\*+$/g, "")
  .replace(/^#+\s*/, "")
  .replace(/\s*#+$/, "")
  .trim();

const classifyHeading = (heading) => {
  const normalized = heading.toLowerCase().replace(/\s+/g, " ").trim();
  if (normalized === "overview" || normalized === "project overview") return "overview";
  if (FEATURE_SECTIONS.has(normalized)) return "features";
  if (HIGHLIGHT_SECTIONS.has(normalized)) return "highlights";
  if (TECHNOLOGY_SECTIONS.has(normalized)) return "technologies";
  return "content";
};

const headingFromLine = (line) => {
  const markdown = line.match(/^#{1,6}\s+(.+?)\s*#*$/);
  if (markdown) return { text: cleanHeading(markdown[1]), strong: false };

  const bold = line.match(/^\*\*(.+?)(?:\*\*)?$/);
  if (bold) return { text: cleanHeading(bold[1]), strong: true };

  const plain = cleanHeading(line).replace(/:$/, "");
  if (PLAIN_HEADINGS.has(plain.toLowerCase())) return { text: plain, strong: false };
  return null;
};

const splitInlineFeatures = (text) => {
  const candidates = text.split(/\s+(?:-|–|—|•)\s+/).map((item) => item.trim()).filter(Boolean);
  return candidates.length > 1 ? candidates : [text.trim()];
};

const contentText = (item) => {
  if (typeof item === "string" || typeof item === "number") return String(item).trim();
  if (!item || typeof item !== "object") return "";
  return String(item.text ?? item.content ?? item.description ?? item.title ?? "").trim();
};

const structuredBlocks = (value, list = false) => {
  const values = Array.isArray(value) ? value : [value];
  const texts = values.map(contentText).filter(Boolean);
  if (!texts.length) return [];
  if (list) return [{ type: "list", items: texts }];
  return texts.map((text) => ({ type: "paragraph", text }));
};

function parseStructuredDescription(description) {
  const sections = [];
  const add = (heading, value, list = false, kind = classifyHeading(heading)) => {
    const blocks = structuredBlocks(value, list);
    if (blocks.length) sections.push({ heading, kind, blocks });
  };

  if (Array.isArray(description)) {
    const paragraphs = description.filter((item) => typeof item === "string");
    if (paragraphs.length) add("Project Overview", paragraphs, false, "overview");
    description.filter((item) => item && typeof item === "object").forEach((item) => {
      if (item.type === "heading") sections.push({ heading: item.text || item.title || "", kind: "content", blocks: [] });
      else if (item.type === "list" || Array.isArray(item.items)) {
        add(item.heading || item.title || "Key Features", item.items || item.content, true);
      } else if (item.text || item.content || item.description) {
        add(item.heading || item.title || "Project Overview", item.text || item.content || item.description);
      }
    });
    return sections;
  }

  if (!description || typeof description !== "object") return sections;
  add("Project Overview", description.overview, false, "overview");
  add("Key Features", description.features, true, "features");
  add("Project Highlights", description.highlights, true, "highlights");
  add("Technologies Used", description.technologiesUsed || description.technologyStack, false, "technologies");
  if (Array.isArray(description.sections)) {
    description.sections.forEach((section) => {
      if (!section || typeof section !== "object") return;
      const heading = section.heading || section.title || "Project Details";
      add(heading, section.items || section.content || section.text, Boolean(section.items || section.type === "list"));
    });
  }
  return sections;
}

export function parseProjectDescription(description) {
  if (Array.isArray(description) || (description && typeof description === "object")) {
    return parseStructuredDescription(description);
  }
  if (typeof description !== "string" || !description.trim()) return [];

  const sections = [];
  let section = { heading: "Project Overview", kind: "overview", blocks: [] };
  let paragraphLines = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length) section.blocks.push({ type: "list", items: listItems });
    listItems = [];
  };
  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    const text = paragraphLines.join("\n").trim();
    paragraphLines = [];
    if (!text) return;
    if (section.kind === "features" || section.kind === "highlights") {
      listItems.push(...splitInlineFeatures(text));
    } else {
      section.blocks.push({ type: "paragraph", text });
    }
  };
  const flushSection = () => {
    flushParagraph();
    flushList();
    if (section.blocks.length) sections.push(section);
  };

  for (const rawLine of description.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = headingFromLine(line);
    if (heading) {
      flushParagraph();
      flushList();
      if (heading.strong && section.kind === "features") {
        section.blocks.push({ type: "subheading", text: heading.text });
      } else {
        flushSection();
        section = { heading: heading.text, kind: classifyHeading(heading.text), blocks: [] };
      }
      continue;
    }

    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      listItems.push(...(section.kind === "features" || section.kind === "highlights"
        ? splitInlineFeatures(bullet[1])
        : [bullet[1].trim()]));
      continue;
    }

    if ((section.kind === "features" || section.kind === "highlights") && paragraphLines.length) {
      flushParagraph();
    }
    paragraphLines.push(line);
  }

  flushSection();
  return sections;
}
