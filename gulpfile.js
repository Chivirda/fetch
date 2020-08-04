const { watch, src, dest, parallel, series } = require('gulp')
const browserSync = require('browser-sync')
const del = require('del')
const sass = require('gulp-sass')
const postcss = require('gulp-postcss')
const autoprefixer = require('autoprefixer')
const cssnano = require('cssnano')
const pug = require('gulp-pug')
const imageMin = require('gulp-imagemin')
const ghPages = require('gulp-gh-pages')
const webpack = require('webpack-stream')
const ttf2woff = require('gulp-ttf2woff')
const ttf2woff2 = require('gulp-ttf2woff2')

function devServer(cb) {
  const params = {
    watch: true,
    reloadDebounce: 150,
    notify: true,
    server: { baseDir: './build'}
  }

  browserSync.create().init(params)
  cb()
}

function clearBuild() {
  return del('build/')
}

function buildPages() {
  return src('src/pages/*.pug')
        .pipe(pug())
        .pipe(dest('build/'))
}

function buildStyles() {
  return src('src/styles/style.scss', { allowEmpty: true })
        .pipe(sass())
        .pipe(postcss([
          autoprefixer(),
          cssnano()
        ]))
        .pipe(dest('build/styles/'))
}

function buildFontstoWoff() {
  return src('src/fonts/**/*.ttf')
        .pipe(ttf2woff())
        .pipe(dest('build/fonts/'))
}

function buildFontstoWoff2() {
  return src('src/fonts/**/*.ttf')
        .pipe(ttf2woff2())
        .pipe(dest('build/fonts/'))
}

function buildScripts() {
  return src('src/scripts/*.js')
        .pipe(webpack({
          mode: 'development',
          output: { filename: 'bundle.js'},
          module: {
            rules: [
              { test: /\.css$/, use: 'css-loader' }
            ]
          }
        }))
        .pipe(dest('build/scripts/'))
}

function minImages() {
  return src('src/images/**/*.*')
        .pipe(imageMin())
        .pipe(dest('build/images/'))
}

function copyVendor() {
  return src('src/vendor/**/*.*')
        .pipe(dest('build/vendor/'))
}

function watchFiles() {
  watch('src/pages/**/*.pug', buildPages)
  watch('src/styles/**/*.scss', buildStyles)
  watch('src/scripts/*.js', buildScripts)
  watch('src/images/**/*.*', minImages)
  watch('src/vendor/**/*.*', copyVendor)
  watch('src/fonts/**/*.ttf', buildFontstoWoff)
  watch('src/fonts/**/*.ttf', buildFontstoWoff2)
}

function deploy() {
  return src('build/**/*')
        .pipe(ghPages())
}

exports.default = series(
  clearBuild,
  parallel(
    devServer,
    series(
      parallel(buildPages, buildStyles, buildScripts, minImages, copyVendor, buildFontstoWoff, buildFontstoWoff2),
      watchFiles
    )
  )
)

exports.deploy = deploy