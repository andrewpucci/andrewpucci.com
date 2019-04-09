module.exports = {

  // Some default locations
  paths: {
    build: {
      src: 'src',
      dest: 'dist',
    },
    scripts: {
      custom: {
        src: ['./src/js/**/*.js'],
        dest: ['./src/site/assets/js'],
      },
      deps: {
        src: [
          './node_modules/jquery/dist/jquery.min.js',
          './node_modules/popper.js/dist/umd/popper.min.js',
          './node_modules/bootstrap/dist/js/bootstrap.min.js',
        ],
        dest: ['./src/site/assets/js'],
      },
    },
    styles: {
      custom: {
        src: ['./src/scss/*.scss'],
        dest: ['./src/site/assets/css'],
      },
      deps: {
        src: [],
        dest: ['./src/site/assets/css'],
      },
    },
  },
};
