const {
  src, dest, parallel, watch,
} = require('gulp');
const del = require('delete');
const env = require('gulp-environment');
const sourcemaps = require('gulp-sourcemaps');
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
  src(project.paths.styles.custom.src)
    .pipe(env.if.development(sourcemaps.init()))
    .pipe(sass({
      outputStyle: 'compressed',
    }).on('error', sass.logError))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(env.if.development(sourcemaps.write('.')))
    .pipe(dest(project.paths.styles.custom.dest));
  cb();
};

const cssDeps = (cb) => {
  src(project.paths.styles.deps.src)
    .pipe(env.if.development(sourcemaps.init()))
    .pipe(concat('deps.css'))
    .pipe(postcss([cssnano()]))
    .pipe(env.if.development(sourcemaps.write('.')))
    .pipe(dest(project.paths.styles.deps.dest));
  cb();
};

const scripts = (cb) => {
  src(project.paths.scripts.deps.src)
    .pipe(env.if.development(sourcemaps.init()))
    .pipe(concat('deps.js'))
    .pipe(env.if.production(terser()))
    .pipe(env.if.development(sourcemaps.write('.')))
    .pipe(dest(project.paths.scripts.deps.dest));
  cb();
};

const watcher = () => {
  watch('./src/scss/**/*.scss', { ignoreInitial: true }, css);
};

exports.clean = parallel(cleanDest, cleanStyles, cleanScripts);
exports.build = parallel(css, cssDeps, scripts);
exports.watch = watcher;
