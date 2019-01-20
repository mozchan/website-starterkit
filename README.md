# website-starterkit
Webサイト用の開発テンプレートです。

## 使い方
### はじめに
必要なモジュールをインストールします。
```
yarn
```

### タスクの実行方法
開発に必要なGulpのタスクを実行します。
```
yarn start
```

ローカルサーバーの起動 + 開発に必要なGulpのタスクを実行します。
```
yarn serve
```

公開用データとして各種ファイルを生成します。ソースマップの削除とJSの圧縮を行います。
```
yarn deploy
```

## 使用している主なツール
* HTML：EJS
* CSS：Sass・PostCSS
* JavaScript：webpack・Bable

## Linter
* HTML: [HTMLHint](https://www.npmjs.com/package/htmlhint)
* Sass: [stylelint-prettier](https://www.npmjs.com/package/prettier-stylelint)
* JavaScript: [eslint:recommended](https://eslint.org/docs/rules/) / [eslint-plugin-prettier](https://www.npmjs.com/package/eslint-plugin-prettier)