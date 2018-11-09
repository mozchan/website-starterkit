'use strict';

const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const browserSync = require('browser-sync').create();
const del = require('del');
const runSequence = require('run-sequence');
const notifier = require('node-notifier');

// HTML
const fs = require('fs');

// Styles
const autoprefixer = require('autoprefixer');
const cssDeclarationSorter = require('css-declaration-sorter');
const mqpacker = require('css-mqpacker');
const stylelint = require('stylelint');

// 開発用ディレクトリ
const src = {
  root: 'src/',
  htmlRoot: 'src/_html/',
  html: ['src/_html/**/*.ejs', '!src/_html/**/_*.ejs'],
  htmlWatch: 'src/_html/**/*.{ejs,json}',
  styles: 'src/_styles/**/*.scss'
}

// 本番用ディレクトリ
const htdocs = {
  root: 'htdocs/',
  styles: 'htdocs/css/'
}

// 制御文字を使用してエラーログを赤文字で表示
const colorError = (str) => `\u001b[31m${str}\u001b[0m`;

// エラー関数
function onError(task, self, error) {
  console.log(colorError(error.message));
  notifier.notify({
    title: `Error!!! @${task}`,
    message: error.message
  });
  self.emit('end');
}

/*
 * HTML
 * EJS 実行タスク
 */
gulp.task('html', () => {
  const confJson = JSON.parse(fs.readFileSync(`${src.htmlRoot}_partials/conf.json`));

  return gulp.src(src.html)
  .pipe($.data((file) => {
    const absolutePath = file.path.split(src.htmlRoot)[1].split('/').length - 1;
    const relativePath = (absolutePath == 0) ? './' : '../'.repeat(absolutePath);

    return {relativePath: relativePath}
  }))
  .pipe($.ejs({
    conf: confJson
  }, {}, { ext: '.html' }).on('error', function(error) {
    onError('html', this, error);
  }))
  .pipe($.prettify({
    'indent-inner-html': false
  }))
  .pipe(gulp.dest(htdocs.root));
});

/*
* Styles
*
*/
gulp.task('styles', () => {
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

  return gulp.src(src.styles)
    .pipe($.sassGlob())
    .pipe($.sourcemaps.init())
    // .pipe($.postcss(plugins.scss))
    .pipe($.sass({ outputStyle: 'expanded' }).on('error', function(error) {
      onError('styles', this, error);
    }))
    .pipe($.postcss(plugins.css))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(htdocs.styles));
});

/*
* Browsersync
* ローカルサーバーを起動 / ライブリロードは未使用
*/
gulp.task('serve', () => {
  browserSync.init({
    server: {
      baseDir: htdocs.root
    },
    callbacks: {
      ready: (err, bs) => {
        bs.addMiddleware('*', (req, res) => {
          res.writeHead(302, {
            location: '404.html'
          });
          res.end('Redirecting!');
        });
      }
    },
    ghostMode: false,
    open: 'external'
  });
});

/*
 * Build
 * 主要タスクの処理
 */
gulp.task('build', () => {
  runSequence(['html', 'styles']);
});

/*
 * Clean / Copy
 * `htdocs`内のクリーンナップ
 */
gulp.task('clean', del.bind(null, htdocs.root));
gulp.task('copy', () => {
  return gulp.src([
    `${src.root}*`,
    `!${src.root}_**/`
  ], { base: src.root })
  .pipe(gulp.dest(htdocs.root));
});

/*
 * Watch
 * gulp実行中に対象ファイルの変更を監視
 */
gulp.task('watch', () => {
  gulp.watch(src.htmlWatch, ['html']);
  gulp.watch(src.styles, ['styles']);
});

/*
 * Default
 * gulp実行時に処理
 */
gulp.task('default', ['clean'], () => {
  runSequence(
    'copy',
    'build',
    'serve',
    'watch'
  );
});
