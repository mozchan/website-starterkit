'use strict';

const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const browserSync = require('browser-sync').create();
const del = require('del');
const notifier = require('node-notifier');

// HTML
const fs = require('fs');
const htmlHintrc = 'htmlhintrc'

// Styles
const autoprefixer = require('autoprefixer');
const cssDeclarationSorter = require('css-declaration-sorter');
const mqpacker = require('css-mqpacker');
const stylelint = require('stylelint');

// rootディレクトリ
const root = {
  src: 'src/',
  htdocs: 'htdocs/'
}

// 開発用ディレクトリ
const src = {
  htmlRoot: `${root.src}_html/`,
  html: [`${root.src}_html/**/*.ejs`, `!${root.src}_html/**/_*.ejs`],
  htmlWatch: `${root.src}_html/**/*.{ejs,json}`,
  stylesRoot: `${root.src}_styles/`,
  styles: `${root.src}_styles/**/*.scss`,
  scriptsRoot: `${root.src}_scripts/`,
  scripts: `${root.src}_scripts/**/*.js`
}

// 本番用ディレクトリ
const htdocs = {
  html: `${root.htdocs}**/*.html`,
  styles: `${root.htdocs}css/`,
  scripts: `${root.htdocs}js/`
}

// エラー関数
function onError(task, self, err) {
  // 制御文字を使用してエラーログを赤文字で表示
  const colorError = (str) => `\u001b[31m${str}\u001b[0m`;

  console.log(colorError(err.message));
  notifier.notify({
    title: `Error!!! @${task}`,
    message: err.message
  });
  self.emit('end');
}

/*
 * HTML
 * .ejs → .html に変換
 */
function html() {
  const confJson = JSON.parse(fs.readFileSync(`${src.htmlRoot}_partials/conf.json`));
  const pageListJson = JSON.parse(fs.readFileSync(`${src.htmlRoot}_partials/page_list.json`));
  const rootPathRegExp = new RegExp(root.htdocs);

  return gulp.src(src.html)
    .pipe($.data((file) => {
      const absolutePath = file.path.split(src.htmlRoot)[1].split('/').length - 1;
      const relativePath = (absolutePath == 0) ? './' : '../'.repeat(absolutePath);
      return {relativePath: relativePath}
    }))
    .pipe($.ejs({
      cssPath: htdocs.styles.replace(rootPathRegExp, '/'),
      jsPath: htdocs.scripts.replace(rootPathRegExp, '/'),
      conf: confJson,
      pageList: pageListJson
    }, {}, { ext: '.html' }).on('error', function(err) {
      onError('html', this, err);
    }))
    .pipe($.prettify({
      'indent-inner-html': false
    }))
    .pipe(gulp.dest(root.htdocs));
}

/*
 * HTML hint
 * 構文チェックを実施
 */
function htmlhint() {
  return gulp.src(htdocs.html)
    .pipe($.htmlhint(htmlhintrc))
    .pipe($.htmlhint.reporter())
}

/*
 * Styles
 * .scss → .css に変換
 */
function styles() {
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

  return gulp.src(src.styles, { sourcemaps: true })
    .pipe($.sassGlob())
    // .pipe($.postcss(plugins.scss))
    .pipe($.sass({ outputStyle: 'expanded' }).on('error', function(error) {
      onError('styles', this, error);
    }))
    .pipe($.postcss(plugins.css))
    .pipe(gulp.dest(htdocs.styles, { sourcemaps: true }));
}

/*
 * Scripts
 * ES2015+ → ES5 に変換
 */
function scripts() {
  return gulp.src(src.scripts, { sourcemaps: true })
    .pipe($.babel())
    .pipe(gulp.dest(htdocs.scripts, { sourcemaps: true }));
}

/*
 * Browsersync
 * ローカルサーバーを起動 / ライブリロードは未使用
 */
function serve(done) {
  browserSync.init({
    server: {
      baseDir: root.htdocs
    },
    ghostMode: false,
    open: 'external',
    notify: false
  });

  done();
}

/*
 * Copy
 * gulp監視下にないファイルの移動
 */
function copy() {
  return gulp.src([
    `${root.src}*`,
    `!${root.src}_**`,
    `!${root.src}_**/`
  ])
  .pipe(gulp.dest(root.htdocs));
}

/*
 * Watch
 * gulp実行中の監視
 */
function watch(done) {
  const watcher = gulp.watch([src.htmlRoot, src.stylesRoot, src.scriptsRoot]);

  gulp.watch(src.htmlWatch, html);
  gulp.watch(src.styles, styles);
  gulp.watch(src.scripts, scripts);

  watcher.on('unlink', (path) => {
    del(path.replace(src.htmlRoot, root.htdocs).replace('.ejs', '.html'));
    del(path.replace(src.stylesRoot, htdocs.styles).replace('.scss', '.css'));
    del(path.replace(src.scriptsRoot, htdocs.scripts));
  });

  watcher.on('unlinkDir', (path) => {
    del(path.replace(src.htmlRoot, root.htdocs));
    del(path.replace(src.stylesRoot, htdocs.styles));
    del(path.replace(src.scriptsRoot, htdocs.scripts));
  });

  done();
}

/*
 * Default
 * gulp実行時の処理
 */
const build = gulp.series(
  copy,
  serve,
  gulp.parallel(
    html,
    // htmlhint,
    styles,
    scripts
  ),
  watch
);

exports.default = build;