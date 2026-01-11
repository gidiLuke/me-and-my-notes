const config = {
  plugins: ["prettier-plugin-jinja-template"],
  printWidth: 80,
  proseWrap: "always",
  overrides: [
    {
      files: ["*.njk"],
      options: {
        parser: "jinja-template",
      },
    },
  ],
};

export default config;
