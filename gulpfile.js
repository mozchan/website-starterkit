'use strict';

const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const browserSync = require('browser-sync').create();
const del = require('del');
const runSequence = require('run-sequence');

// EJS
const fs = require('fs');

// 開発用ディレクトリ
const src = {
  root: 'src/',
  htmlRoot: 'src/_html/',
  html: ['src/_html/**/*.ejs', '!src/_html/**/_*.ejs'],
  htmlWatch: 'src/_html/**/*.{ejs,json}'
}

// 本番用ディレクトリ
const htdocs = {
  root: 'htdocs/'
}

/*
 * HTML
 * EJS 実行タスク
 */
gulp.task('html', () => {
  const confJson = JSON.parse(fs.readFileSync(`${src.htmlRoot}_partials/conf.json`));

  return gulp.src(src.html)
  .pipe($.data((file) => {
    return {path: file.path}
  }))
  .pipe($.plumber({errorHandler: $.notify.onError('Error: <%= error.message %>')}))
  .pipe($.ejs({
    htmlRoot: `${src.htmlRoot}`,
    conf: confJson
    },{},{ext: '.html'}
  ))
  .pipe($.prettify({
    'indent-inner-html': false
  }))
  .pipe(gulp.dest(htdocs.root));
});

/*
* Browsersync
* ローカルサーバーを起動 / ライブリロードは未使用
*/
gulp.task('serve', () => {
  browserSync.init({
    server: {
      baseDir: htdocs.root
    }
  });
});

/*
 * Clean / Copy
 * `dest`内のクリーンナップ
 */
gulp.task('clean', del.bind(null, htdocs.root));
gulp.task('copy', () => {
  return gulp.src([
    `${src.root}*`,
    `!${src.root}_**/`
  ], { base: src.root })
    .pipe(gulp.dest(htdocs.root));
});

// gulp実行中に対象ファイルの変更を監視
gulp.task('watch', () => {
  gulp.watch(src.htmlWatch, ['html']);
});

// `gulp`実行時に発生
gulp.task('default', ['clean'], () => {
  runSequence(
    'copy',
    'watch',
    'html',
    'serve'
  );
});
