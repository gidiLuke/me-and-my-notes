const site = require("./site.json");

const MAX_CHILDREN = 5;

const normalizePath = (value) => {
  const cleaned = value.trim().replace(/\/+$/g, "");
  return cleaned === "" ? "/" : cleaned;
};

const splitPath = (value) => normalizePath(value).split("/").filter(Boolean);
const getLastSegment = (value) => {
  const segments = splitPath(value);
  return segments.length > 0 ? segments[segments.length - 1] : "/";
};

module.exports = () => {
  const commands = site.commands.map((command, index) => ({
    ...command,
    _index: index
  }));

  const topLevel = commands
    .filter((command) => command.topLevel)
    .sort((a, b) => a._index - b._index)
    .map((command) => ({
      ...command,
      shortLabel: command.label,
      children: [],
      childrenDisplay: [],
      hasMore: false
    }));

  const byHref = new Map(topLevel.map((command) => [normalizePath(command.href), command]));

  commands.forEach((command) => {
    if (command.topLevel) return;
    const childSegments = splitPath(command.href);
    if (childSegments.length < 2) return;

    const parentSegments = childSegments.slice(0, childSegments.length - 1);
    const parentPath = normalizePath(`/${parentSegments.join("/")}`);
    const parent = byHref.get(parentPath);
    if (!parent) return;

    parent.children.push({
      ...command,
      shortLabel: getLastSegment(command.href)
    });
  });

  topLevel.forEach((entry) => {
    entry.childrenDisplay = entry.children.slice(0, MAX_CHILDREN);
    entry.hasMore = entry.children.length > MAX_CHILDREN;
  });

  return {
    tree: topLevel
  };
};
