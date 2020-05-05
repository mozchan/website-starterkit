/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/_scripts/main.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/_scripts/main.js":
/*!******************************!*\
  !*** ./src/_scripts/main.js ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
eval("\n\nvar mediaQuery = window.matchMedia('(max-width: 767px)');\nwindow.addEventListener('load', function () {\n  smoothScroll();\n});\n\nvar smoothScroll = function smoothScroll() {\n  var interval = 10; //スクロール処理を繰り返す間隔\n\n  var divisor = 8; //近づく割合（数値が大きいほどゆっくり近く）\n\n  var range = divisor / 2 + 1; //どこまで近づけば処理を終了するか(無限ループにならないように divisor から算出)\n\n  var links = document.querySelectorAll('a[href^=\"#\"]');\n  var headerHight = 0;\n  var toY;\n\n  for (var i = 0; i < links.length; i++) {\n    links[i].addEventListener('click', function (e) {\n      e.preventDefault();\n      var nowY = window.pageYOffset; //現在のスクロール値\n\n      var href = e.currentTarget.getAttribute('href'); //href取得\n\n      var target = document.querySelector(href); //リンク先の要素（ターゲット）取得\n\n      var targetRect = target.getBoundingClientRect(); //ターゲットの座標取得\n\n      if (!mediaQuery.matches) {\n        // PC：固定ヘッダー分の高さを差し引く\n        headerHight = document.getElementById('globalHeader').clientHeight;\n      } else {\n        // SP：差し引く数値なし。\n        headerHight = 0;\n      }\n\n      var targetY = targetRect.top + nowY - headerHight; //現在のスクロール値 & ヘッダーの高さを踏まえた座標\n      //スクロール終了まで繰り返す処理\n\n      (function doScroll() {\n        toY = nowY + Math.round((targetY - nowY) / divisor); //次に移動する場所\n\n        window.scrollTo(0, toY); //スクロールさせる\n\n        nowY = toY; //nowY更新\n\n        if (document.body.clientHeight - window.innerHeight < toY) {\n          //最下部にスクロールしても対象まで届かない場合は下限までスクロールして強制終了\n          window.scrollTo(0, document.body.clientHeight);\n          return;\n        }\n\n        if (toY >= targetY + range || toY <= targetY - range) {\n          //+-rangeの範囲内へ近くまで繰り返す\n          window.setTimeout(doScroll, interval);\n        } else {\n          //+-range の範囲内にくれば正確な値へ移動して終了。\n          window.scrollTo(0, targetY);\n        }\n      })();\n    });\n  }\n};\n\n//# sourceURL=webpack:///./src/_scripts/main.js?");

/***/ })

/******/ });