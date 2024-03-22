const StyleDictionary = require('style-dictionary');

StyleDictionary.registerTransform({
  name: 'name/bootstrap',
  type: 'name',
  transformer: (token) => {
    return token.path.reduce(
      (wholeName, currentValue, index) => index > 1 ? wholeName.concat(`-${currentValue}`) : wholeName, ""
    ).substring(1);
  }
});

module.exports = {
  source: [`src/site/_tokens/**/*.json`],
  platforms: {
    scss: {
      transformGroup: "scss",
      transforms: ["name/bootstrap"],
      buildPath: "src/site/assets/styles/",
      files: [{
        filter: (token) => {
          return token.path[0] == "color" ? token.path[1] == "bootstrap" : token;
        },
        destination: "_variables.scss",
        format: "scss/variables"
      }]
    }
  }
}
