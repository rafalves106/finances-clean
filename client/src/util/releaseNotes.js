export const LAST_SEEN_VERSION_KEY = "finance_last_seen_version";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const extractReleaseNotesForVersion = (changelogRaw, currentVersion) => {
  if (!changelogRaw || !currentVersion) {
    return "";
  }

  const escapedVersion = escapeRegex(currentVersion);
  const headerRegex = new RegExp(`^## \\[${escapedVersion}\\]`);
  const sectionHeaderRegex = /^## \[/;
  const lines = changelogRaw.split("\n");
  const startIndex = lines.findIndex((line) => headerRegex.test(line));

  if (startIndex === -1) {
    return "";
  }

  const sectionLines = [];

  for (let i = startIndex + 1; i < lines.length; i += 1) {
    if (sectionHeaderRegex.test(lines[i])) {
      break;
    }

    sectionLines.push(lines[i]);
  }

  return sectionLines.join("\n").trim();
};

export const parseReleaseNotes = (text) => {
  if (!text) {
    return [];
  }

  const blocks = [];
  let currentList = null;

  text.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      currentList = null;
      return;
    }

    if (line.startsWith("### ")) {
      currentList = null;
      blocks.push({ type: "heading", text: line.slice(4) });
      return;
    }

    if (line.startsWith("- ")) {
      if (!currentList) {
        currentList = { type: "list", items: [] };
        blocks.push(currentList);
      }
      currentList.items.push(line.slice(2));
      return;
    }

    currentList = null;
    blocks.push({ type: "paragraph", text: line });
  });

  return blocks;
};

export const getLastSeenVersion = () => {
  try {
    return globalThis.localStorage?.getItem(LAST_SEEN_VERSION_KEY) ?? null;
  } catch {
    return null;
  }
};

export const setLastSeenVersion = (version) => {
  if (!version) {
    return false;
  }

  try {
    globalThis.localStorage?.setItem(LAST_SEEN_VERSION_KEY, version);
    return true;
  } catch {
    return false;
  }
};
