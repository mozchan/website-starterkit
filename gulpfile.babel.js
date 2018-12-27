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
const baseDir = {
  src: 'src/',
  htdocs: 'htdocs/'
}
const paths = {
  src: {
    htmlRoot: `${baseDir.src}_html/`,
    html: [`${baseDir.src}_html/**/*.ejs`, `!${baseDir.src}_html/**/_*.ejs`],
    htmlWatch: `${baseDir.src}_html/**/*.{ejs,json}`,
    stylesRoot: `${baseDir.src}_styles/`,
    styles: `${baseDir.src}_styles/**/*.scss`,
    scriptsRoot: `${baseDir.src}_scripts/`,
    scripts: `${baseDir.src}_scripts/**/*.js`
  },
  htdocs: {
    html: `${baseDir.htdocs}**/*.html`,
    styles: `${baseDir.htdocs}css/`,
    scripts: `${baseDir.htdocs}js/`
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
  const confJson = JSON.parse(fs.readFileSync(`${paths.src.htmlRoot}_partials/conf.json`));
  const pageListJson = JSON.parse(fs.readFileSync(`${paths.src.htmlRoot}_partials/page_list.json`));

  return gulp.src(paths.src.html)
    .pipe($.data((file) => {
      const absolutePath = file.path.split(paths.src.htmlRoot)[1].split('/').length - 1;
      const relativePath = (absolutePath == 0) ? './' : '../'.repeat(absolutePath);
      return { relativePath: relativePath }
    }))
    .pipe($.ejs({
      cssPath: paths.htdocs.styles.replace(baseDir.htdocs, '/'),
      jsPath: paths.htdocs.scripts.replace(baseDir.htdocs, '/'),
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
    .pipe(gulp.dest(baseDir.htdocs));
}

/*
 * HTML hint
 * 構文チェックを実施
 */
export function htmlhint() {
  return gulp.src(paths.htdocs.html)
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

  return gulp.src(paths.src.styles, { sourcemaps: isSourcemaps })
    .pipe($.sassGlob())
    // .pipe($.postcss(plugins.scss))
    .pipe($.sass({ outputStyle: 'expanded' }).on('error', function(error) {
      onError('styles', this, error);
    }))
    .pipe($.postcss(plugins.css))
    .pipe(gulp.dest(paths.htdocs.styles, { sourcemaps: isSourcemaps }));
}

/*
 * Scripts
 * ES2015+ → ES5 に変換
 */
export function scripts() {
  return gulp.src(paths.src.scripts, { sourcemaps: isSourcemaps })
    .pipe($.babel())
    .pipe(gulp.dest(paths.htdocs.scripts, { sourcemaps: isSourcemaps }));
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
  .pipe(gulp.dest(baseDir.htdocs));
}

/*
 * Watch
 * gulp実行中の監視
 */
function watch(done) {
  const watcher = gulp.watch([paths.src.htmlRoot, paths.src.stylesRoot, paths.src.scriptsRoot]);

  gulp.watch(paths.src.htmlWatch, html);
  gulp.watch(paths.src.styles, styles);
  gulp.watch(paths.src.scripts, scripts);

  watcher.on('unlink', (path) => {
    del(path.replace(paths.src.htmlRoot, baseDir.htdocs).replace('.ejs', '.html'));
    del(path.replace(paths.src.stylesRoot, paths.htdocs.styles).replace('.scss', '.css'));
    del(path.replace(paths.src.scriptsRoot, paths.htdocs.scripts));
  });

  watcher.on('unlinkDir', (path) => {
    del(path.replace(paths.src.htmlRoot, baseDir.htdocs));
    del(path.replace(paths.src.stylesRoot, paths.htdocs.styles));
    del(path.replace(paths.src.scriptsRoot, paths.htdocs.scripts));
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
      baseDir: baseDir.htdocs
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