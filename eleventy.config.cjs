module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.setServerOptions({
    liveReload: false,
    domDiff: false
  });

  const pathPrefix =
    process.env.ELEVENTY_PATH_PREFIX ||
    (process.env.CI_PAGES_URL ? new URL(process.env.CI_PAGES_URL).pathname : "/");

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
