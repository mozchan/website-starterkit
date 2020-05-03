'use strict';

import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
const $ = gulpLoadPlugins();
import del from 'del';
import fs from 'fs';
import autoprefixer from 'autoprefixer';
import cssDeclarationSorter from 'css-declaration-sorter';
import mqpacker from 'css-mqpacker';
import stylelint from 'stylelint';
import postcssScss from 'postcss-scss';
import reporter from 'postcss-reporter';
import webpackStream from 'webpack-stream';
import glob from 'glob';
const baseDir = {
  src: 'src/',
  dest: 'htdocs/'
};
const paths = {
  markup: {
    src: `${baseDir.src}_markup/`
  },
  styles: {
    src: `${baseDir.src}_styles/`,
    dest: `${baseDir.dest}css/`
  },
  scripts: {
    src: `${baseDir.src}_scripts/`,
    dest: `${baseDir.dest}js/`
  }
};

// 開発モードによるAPIの制御
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const isSourcemaps = process.env.NODE_ENV === 'development' ? true : false;

/*
 * HTML
 * .ejs → .html に変換
 */
export function html() {
  const confJson = JSON.parse(fs.readFileSync(`${paths.markup.src}_partials/conf.json`));
  const pageListJson = JSON.parse(fs.readFileSync(`${paths.markup.src}_partials/page_list.json`));

  const colorStr = (color) => (str) => `\u001b[${color}m${str}\u001b[0m`;
  const colorMap = { red: colorStr('31'), underline: colorStr('4') };
  const onError = function(err) {
    const errorTitle = err.message.split(':')[0];
    const filePath = colorMap.underline(err.message.split('\n')[0].split(__dirname)[1]);
    const title = `${colorMap.red(errorTitle)} in ${filePath}`;
    const message = err.message.split('\n\n')[1];

    console.log(`\n${title}\n${message}\n`);
    this.emit('end');
  };

  return gulp.src([`${paths.markup.src}**/*.ejs`, `!${paths.markup.src}**/_*.ejs`])
    .pipe($.data((file) => {
      const absolutePath = file.path.split(paths.markup.src)[1].split('/').length - 1;
      const relativePath = absolutePath == 0 ? './' : '../'.repeat(absolutePath);
      return { relativePath: relativePath };
    }))
    .pipe($.ejs({
      cssPath: paths.styles.dest.replace(baseDir.dest, '/'),
      jsPath: paths.scripts.dest.replace(baseDir.dest, '/'),
      conf: confJson,
      pageList: pageListJson
    }, {}, { ext: '.html' }).on('error', onError))
    .pipe($.prettify({
      'indent-inner-html': false
    }))
    .pipe(gulp.dest(baseDir.dest));
}

/*
 * HTML hint
 * 構文チェックを実施
 */
export function htmlhint() {
  return gulp.src(`${baseDir.dest}**/*.html`)
    .pipe($.htmlhint('.htmlhintrc'))
    .pipe($.htmlhint.reporter());
}

/*
 * Styles
 * .scss → .css に変換
 */
export function styles() {
  const plugins = {
    sass: [
      stylelint(),
      reporter({ clearReportedMessages: true })
    ],
    css: [
      autoprefixer(),
      cssDeclarationSorter({ order: 'smacss' }),
      mqpacker()
    ]
  };

  return gulp.src(`${paths.styles.src}**/*.scss`, { sourcemaps: isSourcemaps })
    .pipe($.postcss(plugins.sass, { syntax: postcssScss }))
    .pipe($.sassGlob())
    .pipe($.sass({ outputStyle: 'expanded' }).on('error', $.sass.logError))
    .pipe($.postcss(plugins.css))
    .pipe(gulp.dest(paths.styles.dest, { sourcemaps: isSourcemaps }));
}

/*
 * Scripts
 * ES2015+ → ES5 に変換
 */
export function scripts() {
  const entries = {};

  glob.sync(`./${paths.scripts.src}**/*.js`, {
    ignore: `./${paths.scripts.src}**/_*.js`
  }).map(function (file) {
    const key = file.replace(paths.scripts.src, '');
    entries[key] = file;
  });

  return gulp.src(`${paths.scripts.src}**/*.js`)
    .pipe(webpackStream({
      entry: entries,
      output: { filename: '[name]' },
      mode: process.env.NODE_ENV,
      module: {
        rules: [{
          test: /\.js$/,
          exclude: /node_modules/,
          use: ['babel-loader','eslint-loader']
        }]
      }
    }))
    .pipe(gulp.dest(paths.scripts.dest));
}

/*
 * Copy
 * gulp監視下にないファイルの移動
 */
export function copy() {
  return gulp.src([
    `${baseDir.src}*`,
    `!${baseDir.src}_**`
    ])
    .pipe(gulp.dest(baseDir.dest));
}

/*
 * Watch
 * gulp実行中の監視
 */
function watch(done) {
  const watchDir = gulp.watch([paths.markup.src, paths.styles.src, paths.scripts.src]);

  gulp.watch(`${paths.markup.src}**/*.{ejs,json}`, html);
  gulp.watch(`${paths.styles.src}**/*.scss`, styles);
  gulp.watch(`${paths.scripts.src}**/*.js`, scripts);

  watchDir.on('unlink', (path) => {
    del(path.replace(paths.markup.src, baseDir.dest).replace('.ejs', '.html'));
    del(path.replace(paths.styles.src, paths.styles.dest).replace('.scss', '.css'));
    del(path.replace(paths.scripts.src, paths.scripts.dest));
  });

  watchDir.on('unlinkDir', (path) => {
    del(path.replace(paths.markup.src, baseDir.dest));
    del(path.replace(paths.styles.src, paths.styles.dest));
    del(path.replace(paths.scripts.src, paths.scripts.dest));
  });

  done();
}

/*
 * Default
 * gulp実行時の処理
 */
const build = gulp.series(copy, gulp.parallel(html, htmlhint, styles, scripts));

if (process.env.NODE_ENV === 'production') {
  exports.default = build;
} else {
  exports.default = gulp.series(build, watch);
}
