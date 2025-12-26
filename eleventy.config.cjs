const fs = require("fs");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.setServerOptions({
    liveReload: false,
    domDiff: false
  });

  const inferGithubPrefix = () => {
    const repo = process.env.GITHUB_REPOSITORY || "";
    const [owner, name] = repo.split("/");
    if (!owner || !name) return "/";
    if (name.toLowerCase() === `${owner.toLowerCase()}.github.io`) return "/";
    return `/${name}/`;
  };

  const hasCustomDomain = () => {
    try {
      const cname = fs.readFileSync("CNAME", "utf8").trim();
      return Boolean(cname);
    } catch (err) {
      return false;
    }
  };

  const pathPrefix =
    process.env.ELEVENTY_PATH_PREFIX ||
    (process.env.CI_PAGES_URL ? new URL(process.env.CI_PAGES_URL).pathname : null) ||
    (process.env.GITHUB_PAGES && hasCustomDomain() ? "/" : null) ||
    (process.env.GITHUB_PAGES ? inferGithubPrefix() : "/");

  eleventyConfig.addGlobalData("pathPrefix", pathPrefix);

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "_site"
    },
    pathPrefix,
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"]
  };
};
