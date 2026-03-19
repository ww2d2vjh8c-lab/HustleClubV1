type BlockInput = {
  key: string;
  content?: string | string[] | null;
};

function cleanLine(line: string) {
  return line.trim();
}

function textToLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map(cleanLine)
    .filter(Boolean);
}

function parseListBlock(block: string) {
  return block
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

function trimBlock(block: string) {
  return block.replace(/^\s+|\s+$/g, "");
}

function buildBlocks(blocks: BlockInput[]) {
  const parts = blocks
    .map(({ key, content }) => {
      if (!content) return "";

      const normalized =
        typeof content === "string"
          ? trimBlock(content)
          : content.map(cleanLine).filter(Boolean).map((line) => `- ${line}`).join("\n");

      if (!normalized) return "";
      return `${key}:\n${normalized}`;
    })
    .filter(Boolean);

  return parts.join("\n\n");
}

function parseSectionMap(
  raw: string | null | undefined,
  keys: string[],
  defaultKey: string
) {
  const map: Record<string, string[]> = {};
  keys.forEach((key) => {
    map[key] = [];
  });

  if (!raw?.trim()) {
    return keys.reduce<Record<string, string>>((acc, key) => {
      acc[key] = "";
      return acc;
    }, {});
  }

  let currentKey = defaultKey;

  for (const line of raw.split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Z_]+):$/);
    if (match && keys.includes(match[1])) {
      currentKey = match[1];
      continue;
    }

    map[currentKey].push(line);
  }

  return keys.reduce<Record<string, string>>((acc, key) => {
    acc[key] = trimBlock(map[key].join("\n"));
    return acc;
  }, {});
}

export type CourseContentFields = {
  summary: string;
  whatYouWillLearn: string[];
  whoIsThisFor: string[];
  requirements: string[];
  curriculum: string[];
};

export function buildCourseDescription(fields: CourseContentFields) {
  return buildBlocks([
    { key: "SUMMARY", content: fields.summary },
    { key: "WHAT_YOU_WILL_LEARN", content: fields.whatYouWillLearn },
    { key: "WHO_IS_THIS_FOR", content: fields.whoIsThisFor },
    { key: "REQUIREMENTS", content: fields.requirements },
    { key: "CURRICULUM", content: fields.curriculum },
  ]);
}

export function parseCourseDescription(description: string | null | undefined) {
  const sections = parseSectionMap(
    description,
    [
      "SUMMARY",
      "WHAT_YOU_WILL_LEARN",
      "WHO_IS_THIS_FOR",
      "REQUIREMENTS",
      "CURRICULUM",
    ],
    "SUMMARY"
  );

  return {
    summary: sections.SUMMARY || trimBlock(description ?? ""),
    whatYouWillLearn: parseListBlock(sections.WHAT_YOU_WILL_LEARN),
    whoIsThisFor: parseListBlock(sections.WHO_IS_THIS_FOR),
    requirements: parseListBlock(sections.REQUIREMENTS),
    curriculum: parseListBlock(sections.CURRICULUM),
  };
}

export type JobContentFields = {
  overview: string;
  responsibilities: string[];
  requirements: string[];
  deliverables: string[];
  timeline: string;
  idealCandidate: string;
};

export function buildJobDescription(fields: JobContentFields) {
  return buildBlocks([
    { key: "OVERVIEW", content: fields.overview },
    { key: "RESPONSIBILITIES", content: fields.responsibilities },
    { key: "REQUIREMENTS", content: fields.requirements },
    { key: "DELIVERABLES", content: fields.deliverables },
    { key: "TIMELINE", content: fields.timeline },
    { key: "IDEAL_CANDIDATE", content: fields.idealCandidate },
  ]);
}

export function parseJobDescription(description: string | null | undefined) {
  const sections = parseSectionMap(
    description,
    [
      "OVERVIEW",
      "RESPONSIBILITIES",
      "REQUIREMENTS",
      "DELIVERABLES",
      "TIMELINE",
      "IDEAL_CANDIDATE",
    ],
    "OVERVIEW"
  );

  return {
    overview: sections.OVERVIEW || trimBlock(description ?? ""),
    responsibilities: parseListBlock(sections.RESPONSIBILITIES),
    requirements: parseListBlock(sections.REQUIREMENTS),
    deliverables: parseListBlock(sections.DELIVERABLES),
    timeline: sections.TIMELINE,
    idealCandidate: sections.IDEAL_CANDIDATE,
  };
}

export type MarketplaceContentFields = {
  highlights: string;
  conditionDetails: string;
  specifications: string[];
  shipping: string;
  whySelling: string;
};

export function buildMarketplaceDescription(fields: MarketplaceContentFields) {
  return buildBlocks([
    { key: "HIGHLIGHTS", content: fields.highlights },
    { key: "CONDITION_DETAILS", content: fields.conditionDetails },
    { key: "SPECIFICATIONS", content: fields.specifications },
    { key: "SHIPPING", content: fields.shipping },
    { key: "WHY_SELLING", content: fields.whySelling },
  ]);
}

export function parseMarketplaceDescription(description: string | null | undefined) {
  const sections = parseSectionMap(
    description,
    [
      "HIGHLIGHTS",
      "CONDITION_DETAILS",
      "SPECIFICATIONS",
      "SHIPPING",
      "WHY_SELLING",
    ],
    "HIGHLIGHTS"
  );

  return {
    highlights: sections.HIGHLIGHTS || trimBlock(description ?? ""),
    conditionDetails: sections.CONDITION_DETAILS,
    specifications: parseListBlock(sections.SPECIFICATIONS),
    shipping: sections.SHIPPING,
    whySelling: sections.WHY_SELLING,
  };
}

export function textareaToList(value: string) {
  return textToLines(value);
}

export function listToTextarea(values: string[]) {
  return values.join("\n");
}
