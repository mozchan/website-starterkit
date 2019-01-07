'use strict';

import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
const $ = gulpLoadPlugins();
import { create as bsCreate } from 'browser-sync';
const browserSync = bsCreate();
import del from 'del';
import notifier from 'node-notifier';
import fs from 'fs';
import autoprefixer from 'autoprefixer';
import cssDeclarationSorter from 'css-declaration-sorter';
import mqpacker from 'css-mqpacker';
import stylelint from 'stylelint';
import webpack from 'webpack-stream';
import glob from 'glob';
const baseDir = {
  src: 'src/',
  dest: 'htdocs/'
}
const paths = {
  html: {
    src: `${baseDir.src}_html/`
  },
  styles: {
    src: `${baseDir.src}_styles/`,
    dest: `${baseDir.dest}css/`
  },
  scripts: {
    src: `${baseDir.src}_scripts/`,
    dest: `${baseDir.dest}js/`
  }
}

// 開発モードによるAPIの制御
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
const isSourcemaps = process.env.NODE_ENV === 'development' ? true : false;

// 表示するエラーメッセージの制御
const colorError = (str) => `\u001b[31m${str}\u001b[0m`;
function errorMessage(error) {
  return colorError(error.message.split(__dirname)[1]);
}

// デスクトップ通知の設定
const isNotify = true; // デスクトップ通知しない場合は、`false` に変更する

function notify(error) {
  notifier.notify({
    title: `Error!!! @${error.plugin}`,
    message: errorMessage(error).split('\n')[0]
  });
}


/*
 * HTML
 * .ejs → .html に変換
 */
export function html() {
  const confJson = JSON.parse(fs.readFileSync(`${paths.html.src}_partials/conf.json`));
  const pageListJson = JSON.parse(fs.readFileSync(`${paths.html.src}_partials/page_list.json`));

  return gulp.src([`${paths.html.src}**/*.ejs`, `!${paths.html.src}**/_*.ejs`])
    .pipe($.data((file) => {
      const absolutePath = file.path.split(paths.html.src)[1].split('/').length - 1;
      const relativePath = (absolutePath == 0) ? './' : '../'.repeat(absolutePath);
      return { relativePath: relativePath }
    }))
    .pipe($.ejs({
      cssPath: paths.styles.dest.replace(baseDir.dest, '/'),
      jsPath: paths.scripts.dest.replace(baseDir.dest, '/'),
      conf: confJson,
      pageList: pageListJson
    }, {}, { ext: '.html' }).on('error', function(error) {
      console.log(errorMessage(error));
      if(isNotify) notify(error);
      this.emit('end');
    }))
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
    .pipe($.htmlhint.reporter())
}

/*
 * Styles
 * .scss → .css に変換
 */
export function styles() {
  const plugins = {
    scss: [
      stylelint()
    ],
    css: [
      autoprefixer(),
      cssDeclarationSorter({ order: 'smacss' }),
      mqpacker()
    ]
  };

  return gulp.src(`${paths.styles.src}**/*.scss`, { sourcemaps: isSourcemaps })
    .pipe($.sassGlob())
    // .pipe($.postcss(plugins.scss))
    .pipe($.sass({ outputStyle: 'expanded' }).on('error', function(error) {
      onError('styles', this, error);
    }))
    .pipe($.postcss(plugins.css))
    .pipe(gulp.dest(paths.styles.dest, { sourcemaps: isSourcemaps }));
}

/*
 * Scripts
 * ES2015+ → ES5 に変換
 */
export function scripts() {
  const entries = {}

  glob.sync(`./${paths.scripts.src}**/*.js`, {
    ignore: `./${paths.scripts.src}**/_*.js`
  }).map(function (file) {
    const key = file.replace(paths.scripts.src, '');
    entries[key] = file;
  });

  return gulp.src(`${paths.scripts.src}**/*.js`)
    .pipe(webpack({
      entry: entries,
      output: { filename: '[name]' },
      mode: process.env.NODE_ENV,
      module: {
        rules: [{
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader'
          }
        }]
      }
    }), null, function(err, stats) {})
    .pipe(gulp.dest(paths.scripts.dest));
}

/*
 * Copy
 * gulp監視下にないファイルの移動
 */
export function copy() {
  return gulp.src([
    `${baseDir.src}*`,
    `!${baseDir.src}_**`,
    `!${baseDir.src}_**/`
  ])
  .pipe(gulp.dest(baseDir.dest));
}

/*
 * Watch
 * gulp実行中の監視
 */
function watch(done) {
  const watchDir = gulp.watch([paths.html.src, paths.styles.src, paths.scripts.src]);

  gulp.watch(`${paths.html.src}**/*.{ejs,json}`, html);
  gulp.watch(`${paths.styles.src}**/*.scss`, styles);
  gulp.watch(`${paths.scripts.src}**/*.js`, scripts);

  watchDir.on('unlink', (path) => {
    del(path.replace(paths.html.src, baseDir.dest).replace('.ejs', '.html'));
    del(path.replace(paths.styles.src, paths.styles.dest).replace('.scss', '.css'));
    del(path.replace(paths.scripts.src, paths.scripts.dest));
  });

  watchDir.on('unlinkDir', (path) => {
    del(path.replace(paths.html.src, baseDir.dest));
    del(path.replace(paths.styles.src, paths.styles.dest));
    del(path.replace(paths.scripts.src, paths.scripts.dest));
  });

  done();
}

/*
 * Browsersync
 * ローカルサーバーを起動 / ライブリロードは未使用
 */
export function browsersync(done) {
  browserSync.init({
    server: {
      baseDir: baseDir.dest
    },
    ghostMode: false,
    open: 'external',
    notify: false
  });

  done();
}

/*
 * Default
 * gulp実行時の処理
 */
const build = gulp.series(
  copy,
  gulp.parallel(
    html,
    styles,
    scripts
  )
);

if(process.env.NODE_ENV === 'production') {
  exports.default = build;
} else {
  exports.default = gulp.series(build, watch);
}
export const serve = gulp.series(build, watch, browsersync);