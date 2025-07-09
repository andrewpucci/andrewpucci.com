import { extname } from 'path';
import htmlmin from './min-html.js';
import jsmin from './min-js.js';

const minify = async (content, outputPath) => {
  if (outputPath) {
    const ext = extname(outputPath);
    switch (ext) {
      case '.html':
        return htmlmin(content, outputPath);
      case '.js':
        return jsmin(content, outputPath);
      default:
        return content;
    }
  }
  return content;
};

export default minify;
