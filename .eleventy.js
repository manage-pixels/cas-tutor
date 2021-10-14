const fs = require("fs");
const Image = require("@11ty/eleventy-img");
const htmlmin = require("html-minifier");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const markdown = require("@shawnsandy/ideas/lib/markdown");
const CleanCSS = require("clean-css");
const img = require("./system/_data/hlp/sharp");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");

module.exports = function (eleventyConfig) {
  eleventyConfig.setBrowserSyncConfig({
    notify: true,
    open: true,
    callbacks: {
      ready: function (err, bs) {
        bs.addMiddleware("*", (req, res) => {
          const content_404 = fs.readFileSync("www/404.html");
          // Provides the 404 content without redirect.
          res.write(content_404);
          // Add 404 http status code in request header.
          // res.writeHead(404, { "Content-Type": "text/html" });
          res.writeHead(404);
          res.end();
        });
      },
    },
  });

  eleventyConfig.setQuietMode(true);

  eleventyConfig.addWatchTarget("./src/sass/");
  eleventyConfig.addWatchTarget("./README.md");
  eleventyConfig.addWatchTarget("./src/js/");
  eleventyConfig.addPassthroughCopy("./src/css", "www/css/");
  eleventyConfig.addPassthroughCopy("./system/dsp/assets", "www/assets/");
  eleventyConfig.addPassthroughCopy("./src/images", "./images/");
  eleventyConfig.addPassthroughCopy("./img");
  eleventyConfig.addPassthroughCopy("./src/js/min", "www/js");
  eleventyConfig.addPassthroughCopy("./src/admin");
  // eleventyConfig.addPassthroughCopy("./src/robots.txt")

  // css-min filter
  eleventyConfig.addFilter("cssmin", (code) => {
    return new CleanCSS({}).minify(code).styles;
  });

  //Minify our HTML
  eleventyConfig.addTransform("htmlmin", (content, outputPath) => {
    if (outputPath.endsWith(".html")) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      });
      return minified;
    }
    return content;
  });

  eleventyConfig.addCollection("developer", (collection) =>
    collection.getFilteredByTags("developers").sort((a, b) => {
      if (a.data.page.fileSlug > b.data.page.fileSlug) return -1;
      else if (a.data.page.fileSlug < b.data.page.fileSlug) return 1;
      else return 0;
    })
  );

  eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);

  eleventyConfig.addPlugin(require("@shawnsandy/ideas/eleventy"));

  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(markdown);

  // output the image tag
  eleventyConfig.addShortcode("img", (src = null) => {
    return img.imgSrc(src);
  });

  // outpit img scrollBehavior (to, from, savedPosition) {
  // eleventyConfig.addPlugin("imgSrc", img.img);

  // navigation
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  return {
    dir: {
      input: "src",
      output: "www",
      includes: "../system/_includes",
      data: "../system/_data",
    },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    // pathPrefix: "/",
  };
};

async function imageShortcode(src, alt = "", sizes = "50vw, 100vw") {
  let metadata = await Image(src, {
    widths: [300, 600],
    formats: ["avif", "jpeg"],
  });

  let imageAttributes = {
    alt,
    sizes,
    loading: "lazy",
    decoding: "async",
  };

  // You bet we throw an error on missing alt in `imageAttributes` (alt="" works okay)
  return Image.generateHTML(metadata, imageAttributes);
}
