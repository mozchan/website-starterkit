'use strict';

const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const browserSync = require('browser-sync').create();
const del = require('del');
const runSequence = require('run-sequence');

// EJS
const fs = require('fs');

// 開発用ディレクトリ
const develop = {
  root: 'develop/',
  ejsRoot: 'develop/_ejs/',
  ejs: ['develop/_ejs/**/*.ejs', '!develop/_ejs/**/_*.ejs'],
  ejsWatch: ['develop/_ejs/**/*.ejs', 'develop/_ejs/**/*.json']
}

// 本番用ディレクトリ
const htdocs = {
  root: 'htdocs/'
}

/*
 * EJS
 */
gulp.task('ejs', () => {
  const confJson = JSON.parse(fs.readFileSync(`${develop.ejsRoot}_partials/conf.json`));

  return gulp.src(develop.ejs)
  .pipe($.data((file) => {
    return {path: file.path}
  }))
  .pipe($.plumber({errorHandler: $.notify.onError('Error: <%= error.message %>')}))
  .pipe($.ejs({
    ejsRoot: `${develop.ejsRoot}`,
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
 * `htdocs`内のクリーンナップ
 */
gulp.task('clean', del.bind(null, htdocs.root));
gulp.task('copy', () => {
  return gulp.src([
    `${develop.root}*`,
    `!${develop.root}_**/`
  ], { base: develop.root })
    .pipe(gulp.dest(htdocs.root));
});

// gulp実行中に対象ファイルの変更を監視
gulp.task('watch', () => {
  gulp.watch(develop.ejsWatch, ['ejs']);
});

// `gulp`実行時に発生
gulp.task('default', ['clean'], () => {
  runSequence(
    'copy',
    'serve',
    'watch',
    'ejs'
  );
});
