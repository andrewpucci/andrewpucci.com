const {
  src, dest, parallel, watch,
} = require('gulp');
const del = require('delete');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const sass = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const project = require('./_project');

const cleanDest = (cb) => {
  del(project.paths.build.dest);
  cb();
};

const cleanStyles = (cb) => {
  del(project.paths.styles.custom.dest);
  cb();
};

const cleanScripts = (cb) => {
  del(project.paths.scripts.custom.dest);
  cb();
};

const css = (cb) => {
  src(project.paths.styles.custom.src, { sourcemaps: true })
    .pipe(sass({
      outputStyle: 'compressed',
    }).on('error', sass.logError))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(dest(project.paths.styles.custom.dest, { sourcemaps: '.' }));
  cb();
};

const cssDeps = (cb) => {
  src(project.paths.styles.deps.src, { sourcemaps: true })
    .pipe(concat('deps.css'))
    .pipe(postcss([cssnano()]))
    .pipe(dest(project.paths.styles.deps.dest, { sourcemaps: '.' }));
  cb();
};

const scripts = (cb) => {
  src(project.paths.scripts.deps.src, { sourcemaps: true })
    .pipe(concat('deps.js'))
    .pipe(terser())
    .pipe(dest(project.paths.scripts.deps.dest, { sourcemaps: '.' }));
  cb();
};

const watcher = () => {
  watch('./src/scss/**/*.scss', { ignoreInitial: true }, css);
};

exports.clean = parallel(cleanDest, cleanStyles, cleanScripts);
exports.build = parallel(css, cssDeps, scripts);
exports.watch = watcher;
