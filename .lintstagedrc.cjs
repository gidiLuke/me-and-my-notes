module.exports = {
  "*.{js,cjs,mjs,json,css,md,njk,html,yml,yaml}": ["prettier --write"],
  "*.{js,cjs,mjs}": ["eslint --fix"],
  "*.md": ["markdownlint-cli2"],
};
