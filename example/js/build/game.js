(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
// The following example mimics an over simplified version of Tetris.
// This simple game consists of 5 levels where players must clear a
// certain number lines to complete each level. The game is won when a
// player has completed all 5 levels.
//
// States:
// splash - Shows the splash screen for a short duration (say 3 seconds).
// title - Shows the title screen with an OPTIONS and PLAY GAME buttons.
// loading - Shows a loading screen for the current level.
// game - Shows the main game screen with HUD.
// pause - Shows a pause modal screen over the game.
// level complete - Shows the level complete screen and score tally.
// game complete - Shows the game credits.
//
// Transitions:
// splash {SPLASH_COMPELTE}-> title
// title {CHOICE_OPTIONS}-> options
// options {OPTIONS_SAVE}-> title
// title {OPTIONS_PLAY_GAME}-> loading
// loading {LOAD_COMPLETE}-> game
// game {GAME_PAUSE}-> pause
// pause {GAME_PAUSE}-> game
// pause {GAME_QUIT}-> title
// game {GAME_CLEAR_LINE}-> level complete
// level complete {ADVANCE}-> loading (if player hasn't completed the final level)
// level complete {ADVANCE}-> game complete (if player has compelted the final level)
// game complete {ADVANCE}-> credits
// credits {ADVANCE}-> title
//
// NOTES: Where
// - {NAME} is the event type that will trigger the transition.
// - (condition) is the guard condition used to determine if transition should be invoked.
var StateMachine = require('../../state');
var MOCK = require('./mock-objects');

$(function () {
  var sm, level, score, levelCount, goal, linesCleared, options, loader, inputManager, screenManager;

  sm = new StateMachine();
  // The current level (1-based).
  level = 0;
  // The player's total score.
  score = 0;
  // The number of levels.
  levelCount = 5;
  // The goal (i.e. number of lines to clear) for each level.
  goal = [3, 3, 3, 3, 3];
  // The lines cleared for the current level.
  linesCleared = 0;
  // The options the player has set for the game.
  options = {};
  // The asset loader.
  loader = MOCK.makeLoader();
  // The input manager.
  inputManager = MOCK.makeInputManager(document);
  // The screen manager.
  screenManager = MOCK.makeScreenManager(document.body, inputManager);

  // Our screen manager takes care of displaying and rendering
  // our game screens. We set the clear colour (i.e. background) to
  // solid black and tell it to fade between screens.
  screenManager.clearColour('#000000');
  screenManager.transition('fade');

  // Our input manager takes care of interfacing with the keyboard
  // and mouse. Here we setup a hypothetical key mapping. For this
  // game the input manager will raise events with the event type
  // equalling the key pressed or the key's mapped value.
  inputManager.keyMapping({
    ESC: 'PAUSE',
    P: 'PAUSE',
    LEFT: 'LEFT',
    A: 'LEFT',
    RIGHT: 'RIGHT',
    D: 'RIGHT',
    DOWN: 'DROP',
    S: 'DROP',
    SPACE: 'ADVANCE'
  });

  // All actions from the state machine are invoked asynchronously
  // so they don't block the main thread.

  ////////////
  // States //
  ////////////

  sm.addState({
    name: 'splash',
    onentry: function () {
      screenManager.show('splash');
    }
  });

  sm.addState({
    name: 'title',
    onentry: function () {
      level = 0;
      score = 0;
      screenManager.show('title');
    }
  });

  sm.addState({
    name: 'options',
    onentry: function () {
      screenManager.show('options', options);
    }
  });

  sm.addState({
    name: 'loading',
    onentry: function () {
      level += 1;
      linesCleared = 0;
      screenManager.show('loading', {level: level});
      loader.load(level);
    }
  });

  sm.addState({
    name: 'game',
    onentry: function () {
      screenManager.show('game', {score: score});
    }
  });

  sm.addState({
    name: 'pause',
    onentry: function () {
      screenManager.showModal('pause');
    },
    onexit: function () {
      screenManager.hideModal();
    }
  });

  sm.addState({
    name: 'level complete',
    onentry: function () {
      screenManager.show('level_complete', {level: level, score: score});
    }
  });

  sm.addState({
    name: 'game complete',
    onentry: function () {
      screenManager.show('game_complete', {level: level, score: score});
    }
  });

  sm.addState({
    name: 'credits',
    onentry: function () {
      screenManager.show('credits');
    }
  });


  /////////////////
  // Transitions //
  /////////////////

  sm.addTransition({from: 'splash', to: 'title', trigger: 'SPLASH_COMPLETE'});
  sm.addTransition({from: 'title', to: 'options', trigger: 'CHOICE_OPTIONS'});
  sm.addTransition({
    from: 'options',
    to: 'title',
    trigger: 'OPTIONS_SAVE',
    action: function (event) {
      // This is where we would save our options.
      options = event.options;
    }
  });
  sm.addTransition({from: 'title', to: 'loading', trigger: 'CHOICE_PLAY_GAME'});
  sm.addTransition({from: 'loading', to: 'game', trigger: 'LOAD_COMPLETE'});
  sm.addTransition({from: 'game', to: 'pause', trigger: 'GAME_PAUSE'});
  sm.addTransition({from: 'pause', to: 'title', trigger: 'CHOICE_QUIT'});
  sm.addTransition({from: 'pause', to: 'game', trigger: 'GAME_PAUSE'});

  sm.addTransition({
    from: 'game',
    to: 'level complete',
    trigger: 'GAME_CLEAR_LINE',
    guard: function () {
      return linesCleared === goal[level - 1];
    }
  });

  sm.addTransition({
    from: 'level complete',
    to: 'loading',
    trigger: 'ADVANCE',
    guard: function () {
      return level < levelCount;
    }
  });

  sm.addTransition({
    from: 'level complete',
    to: 'game complete',
    trigger: 'ADVANCE',
    guard: function () {
      return level === levelCount;
    }
  });

  sm.addTransition({from: 'game complete', to: 'credits', trigger: 'ADVANCE'});
  sm.addTransition({from: 'credits', to: 'title', trigger: 'ADVANCE'});


  /////////////////////
  // Event Listeners //
  /////////////////////

  screenManager.addEventListener('SPLASH_COMPLETE', function () {
    sm.trigger('SPLASH_COMPLETE');
  });

  screenManager.addEventListener('CHOICE', function (event) {
    switch (event.choice) {
    case 'OPTIONS':
      sm.trigger('CHOICE_OPTIONS');
      break;
    case 'PLAY_GAME':
      sm.trigger('CHOICE_PLAY_GAME');
      break;
    case 'QUIT':
      sm.trigger('CHOICE_QUIT');
      break;
    case 'RESUME':
      sm.trigger('GAME_PAUSE');
      break;
    }
  });

  screenManager.addEventListener('OPTIONS_SAVE', function (event) {
    sm.trigger({type: 'OPTIONS_SAVE', options: event.options});
  });


  // Listen to the PROGRESS event from the loader and send a message
  // containing the load progress to the active screens in the screen manager.
  loader.addEventListener('PROGRESS', function (event) {
    screenManager.send('LOAD_PROGRESS', {progress: event.progress});
  });

  loader.addEventListener('COMPLETE', function () {
    sm.trigger('LOAD_COMPLETE');
  });


  inputManager.addEventListener('PAUSE', function () {
    sm.trigger('GAME_PAUSE');
  });

  // We allow players to advance/skip a screen by pressing the
  // 'ADVANCE' button on the keyboard (i.e. the spacebar).
  inputManager.addEventListener('ADVANCE', function () {
    switch (sm.state()) {
    case 'level complete':
    case 'game complete':
    case 'credits':
      sm.trigger('ADVANCE');
      break;
    }
  });


  screenManager.addEventListener('CLEAR_LINE', function (event) {
    linesCleared += 1;
    score = event.score;
    sm.trigger('GAME_CLEAR_LINE');
  });

  ///////////////////
  // Initial State //
  ///////////////////

  // Start the whole sequence by setting the state of the
  // state machine to be splash.
  sm.state('splash');
});

}).call(this,require("ngpmcQ"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/fake_5f2fdb6.js","/")
},{"../../state":9,"./mock-objects":2,"buffer":4,"ngpmcQ":7}],2:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
module.exports = (function () {
	function makeEventDispatcher(target) {
		var listeners = [],
			getOrCreateBucket = function (eventType) {
				var bucket = listeners[eventType];

				if (!bucket) {
					bucket = [];
					bucket.add = function (listener) {
						if (typeof listener === 'function') {
							this.push(listener);
							return listener;
						}
					};
					bucket.remove = function (listener) {
						var i,
							len = this.length;

						for (i = 0; i < len; i += 1) {
							if (this[i] === listener) {
								this.splice(i, 1);
								return listener;
							}
						}
					};
					bucket.dispatch = function (event) {
						var i,
							len = this.length;

						for (i = 0; i < len; i += 1) {
							this[i].call(target, event);
						}
					};
				}

				listeners[eventType] = bucket;

				return bucket;
			};

		target = target || this;

		return {
			addEventListener: function (eventType, listener) {
				return getOrCreateBucket(eventType).add(listener);
			},
			removeEventListener: function (eventType, listener) {
				return getOrCreateBucket(eventType).remove(listener);
			},
			dispatchEvent: function (event) {
				var bucket = getOrCreateBucket(event.type);

				if (bucket) {
					bucket.dispatch(event);
				}
			}
		};
	}

	function makeLoader() {
		var loader = makeEventDispatcher();

		function fakeLoad(duration, update) {
			var total = 0,
				id = -1;

			id = setInterval(function () {
				total += update;
				total = total > duration ? duration : total;
				loader.dispatchEvent({type: 'PROGRESS', progress: parseFloat(total / duration).toFixed(2)});

				if (total >= duration) {
					clearTimeout(id);
					setTimeout(function () {
						loader.dispatchEvent({type: 'COMPLETE'});
					}, 500);
				}
			}, update);
		}

		function range(a, b) {
			return parseInt(a + (Math.random() * (b - a)), 10);
		}

		loader.load = function (level) {
			fakeLoad(range(3000, 5000), 100);
		};

		return loader;
	}

	function makeInputManager(scope) {
		var manager = makeEventDispatcher(),
			keyMapping = {};

		scope = scope || document;

		manager.keyMapping = function (mapping) {
			keyMapping = mapping;
		};

		scope.addEventListener('keyup', function (event) {
			var name = String.fromCharCode(event.keyCode);

			switch (event.keyCode) {
			case 32:
				name = 'SPACE';
				break;
			case 27:
				name = 'ESC';
				break;
			case 37:
				name = 'LEFT';
				break;
			case 39:
				name = 'RIGHT';
				break;
			case 40:
				name = 'DOWN';
				break;
			}

			if (name && keyMapping[name]) {
				name = keyMapping[name];
			}

			manager.dispatchEvent({type: name});
		}, false);

		return manager;
	}

	function format(s) {
		var string = s === null || s === undefined ? '' : s.toString(),
			args = arguments,
			argCount = args.length,
			i = string.length,
			c = null,
			n = 0,
			k = 0,
			next = function () {
				i -= 1;
				c = string.charAt(i);
				return c;
			};

		while (next()) {
			if (c === '}') {
				k = i + 1;
				next();
				n = '';

				while (c >= '0' && c <= '9') {
					n = c + n;
					next();
				}

				if (c === '{') {
					n = parseInt(n, 10) + 1;

					if (n < argCount) {
						string = string.substring(0, i) + args[n] + string.substring(k);
					}
				}
			}
		}

		return string;
	}

	// SPLASH_SCREEN_COMPLETE
	// CHOICE
	// CLEAR_LINE
	function makeScreenManager(parent, inputManager) {
		var manager = makeEventDispatcher(),
			currentScreen = null,
			currentModal = null,
			transition = 'none',
			$display = $('<div id="screen-manager"></div>'),
			applyEffect = function ($old, $new, oncomplete) {
				if (typeof $new === 'function') {
					oncomplete = $new;
					$new = null;
				}

				switch (transition) {
				case 'fade':
					if ($old) {
						$old.fadeOut('fast', function () {
							$old.remove();

							if ($new) {
								$display.append($new);

								$new.fadeIn('fast', oncomplete);
							} else if (typeof oncomplete === 'function') {
								oncomplete();
							}
						});
					} else {
						if ($new) {
							$new.css('display', 'none');
							$display.append($new);

							$new.fadeIn('fast', oncomplete);
						} else if (typeof oncomplete === 'function') {
							oncomplete();
						}
					}
					break;
				default:
					if ($old) {
						$old.remove();
					}

					if ($new) {
						$display.append($new);
					}

					if (typeof oncomplete === 'function') {
						oncomplete();
					}
				}
			},
			makeScreenContainer = function (id, title) {
				title = title ? title : id.replace(/_/g, ' ').toUpperCase();
				var markup = format('<div class="screen" id="{0}"><strong class="title">{1}</strong><div class="pane"><div class="content"></div></div></div>', id, title);

				return $(markup);
			},
			screens = {
				// Splash screen will dispatch a 'SPLASH_COMPLETE' event after 3 seconds.
				splash: function (screenManager, data) {
					var $display = makeScreenContainer('splash'),
						$content = $('.content', $display),
						elapsed = 0,
						duration = 3,
						id;

					$content.append('<h1>Simple Tetris</h1>');
					$content.append('<span>3</span>');

					id = setInterval(function () {
						elapsed += 1;

						$('span', $content).text(duration - elapsed);

						if (elapsed === duration) {
							clearTimeout(id);
							setTimeout(function () {
								screenManager.dispatchEvent({type: 'SPLASH_COMPLETE'});
							}, 500);
						}
					}, 1000);

					return {
						id: 'splash',
						display: function () {
							return $display;
						}
					};
				},
				// Title screen will show the game's menu options.
				title: function (screenManager, data) {
					var $display = makeScreenContainer('title'),
						$content = $('.content', $display);

					$content.append('<h1>Simple Tetris</h1><ul><li><a href="#PLAY_GAME">Play Game</a></li><li><a href="#OPTIONS">Options</a></li></ul>');

					$('a', $content).click(function () {
						var choice = $(this).attr('href').substring(1);
						screenManager.dispatchEvent({type: 'CHOICE', choice: choice});
						return false;
					});

					return {
						id: 'title',
						display: function () {
							return $display;
						}
					};
				},
				options: function (screenManager, originalOptions) {
					var $display = makeScreenContainer('options'),
						$content = $('.content', $display);

					$content.append('<ul><li>Option 1</li><li>Option 2</li><li>Option 3</li></ul><p><hr/><button>Cancel</button><button>Save</button></p>');

					$('button', $content).click(function () {
						var label = $(this).text();

						switch (label) {
						case 'Cancel':
							screenManager.dispatchEvent({type: 'OPTIONS_SAVE', options: originalOptions});
							break;
						case 'Save':
							screenManager.dispatchEvent({type: 'OPTIONS_SAVE', options: {}});
							break;
						}

						return false;
					});

					return {
						id: 'options',
						display: function () {
							return $display;
						}
					};
				},
				loading: function (screenManager, data) {
					var $display = makeScreenContainer('loading', 'LOADING LEVEL ' + data.level),
						$content = $('.content', $display);

					$content.text('0 %');

					return {
						id: 'loading',
						display: function () {
							return $display;
						},
						recieve: function (messageName, data) {
							$content.text(parseInt(data.progress * 100, 10) + '%');
						}
					};
				},
				game: function (screenManager, data) {
					var $display = makeScreenContainer('game'),
						$content = $('.content', $display),
						score = data.score;

					$content.append('<div id="score">0000</div><div id="game-board"></div><button>Clear Line</button>');

					$('button', $content).click(function () {
						score += 500;
						updateScore();
						screenManager.dispatchEvent({type: 'CLEAR_LINE', score: score});
					});

					function updateScore() {
						$('#score', $content).text(score);
					}

					updateScore();

					return {
						id: 'game',
						display: function () {
							return $display;
						}
					};
				},
				pause: function (screenManager, data) {
					var $display = makeScreenContainer('pause'),
						$content = $('.content', $display);

					$content.append('<h3>Game Paused</h3><ul><li><a href="#RESUME">Resume</a></li><li><a href="#QUIT">Quit</a></li></ul>');

					$('a', $content).click(function () {
						var choice = $(this).attr('href').substring(1);
						screenManager.dispatchEvent({type: 'CHOICE', choice: choice});
						return false;
					});

					return {
						id: 'pause',
						display: function () {
							return $display;
						}
					};
				},
				level_complete: function (screenManager, data) {
					var $display = makeScreenContainer('level_complete'),
						$content = $('.content', $display);

					$content.append(format('<h3>Congratulations!</h3><p>You Completed Level {0}</p>', data.level));
					$content.append('<p>-PRESS SPACE BAR-</p>');

					return {
						id: 'level_complete',
						display: function () {
							return $display;
						}
					};
				},
				game_complete: function (screenManager, data) {
					var $display = makeScreenContainer('game_complete'),
						$content = $('.content', $display);

					$content.append(format('<h3>Congratulations!</h3><p>You Beat The Game!</p>', data.level));
					$content.append('<p>-PRESS SPACE BAR-</p>');

					return {
						id: 'game_complete',
						display: function () {
							return $display;
						}
					};
				},
				credits: function (screenManager, data) {
					var $display = makeScreenContainer('credits'),
						$content = $('.content', $display);

					$content.append('<p><strong>Producer</strong> Some Guy</p>');
					$content.append('<p><strong>Developer</strong> Darren Schnare</p>');
					$content.append('<p><strong>Artist</strong> Some Girl</p>');
					$content.append('<p><strong>Marketing</strong> Some Guy</p>');

					$content.append('<p>-PRESS SPACE BAR-</p>');

					return {
						id: 'credits',
						display: function () {
							return $display;
						}
					};
				}
			};

		manager.clearColour = function (value) {
			if (arguments.length) {
				$display.css('background-color', value);
			}

			return $display.css('background-color');
		};
		manager.transition = function (value) {
			if (arguments.length) {
				transition = value;
			}

			return transition;
		};
		manager.show = function (screenId, data) {
			var newScreen;

			if (currentScreen && screenId === currentScreen.id) {
				return;
			}

			newScreen = screens[screenId] ? screens[screenId](this, data) : null;

			if (newScreen) {

				if (currentModal) {
					this.hideModal();
				}

				if (currentScreen !== newScreen) {
					if (currentScreen) {
						applyEffect(currentScreen.display(), newScreen.display());
					} else {
						applyEffect(null, newScreen.display());
					}

					currentScreen = newScreen;
				}
			}
		};
		manager.showModal = function (modalId, data) {
			// Can only show a single modal at a time.
			if (!currentModal) {
				var newScreen = screens[modalId] ? screens[modalId](this, data) : null,
					$modal = $('<div class="screen modal"><div class="pane"><div class="content"></div></div></div>');

				$('.content', $modal).append(newScreen.display());
				applyEffect(null, $modal);

				currentModal = {
					recieve: function (messageName, data) {
						if (typeof newScreen.recieve) {
							newScreen.recieve(messageName, data);
						}
					},
					display: function () {
						return $modal;
					}
				};
			}
		};
		manager.hideModal = function () {
			if (currentModal) {
				applyEffect(currentModal.display());
				currentModal = null;
			}
		};
		manager.send = function (messageName, data) {
			if (currentModal && typeof currentModal.recieve === 'function') {
				currentModal.recieve(messageName, data);
			} else if (currentScreen && typeof currentScreen.recieve === 'function') {
				currentScreen.recieve(messageName, data);
			}
		};

		$display.css('background-color', '#ffffff');
		$(parent).append($display);

		return manager;
	}

	return {
		makeLoader: makeLoader,
		makeInputManager: makeInputManager,
		makeScreenManager: makeScreenManager
	};
}());
}).call(this,require("ngpmcQ"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/mock-objects.js","/")
},{"buffer":4,"ngpmcQ":7}],3:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
'use strict';
var ck, create, mixin,
  __slice = [].slice,
  __hasProp = {}.hasOwnProperty;

create = Object.create || function(o) {
  var F;
  F = (function() {
    function F() {
      this.constructor = F;
    }

    return F;

  })();
  F.prototype = o;
  return new F;
};

mixin = function() {
  var dest, k, obj, objs, v, _i, _len;
  dest = arguments[0], objs = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  for (_i = 0, _len = objs.length; _i < _len; _i++) {
    obj = objs[_i];
    for (k in obj) {
      if (!__hasProp.call(obj, k)) continue;
      v = obj[k];
      dest[k] = v;
    }
  }
  return dest;
};

ck = function(constructor, prototypeProperties, prototypeChain) {
  if (arguments.length === 1) {
    prototypeProperties = {};
  } else if (arguments.length === 2) {
    prototypeChain = prototypeProperties;
    prototypeProperties = {};
  }
  prototypeProperties = prototypeProperties || {};
  if (typeof prototypeChain === 'function') {
    constructor.prototype = create(prototypeChain.prototype);
    mixin(constructor.prototype, prototypeProperties);
  } else if (prototypeChain) {
    constructor.prototype = create(prototypeChain);
    mixin(constructor.prototype, prototypeProperties);
  } else {
    constructor.prototype = mixin({}, prototypeProperties);
  }
  constructor.prototype.constructor = constructor;
  return constructor;
};

ck.create = create;

ck.mixin = mixin;

ck.ck = ck;

ck.constructorKit = ck;

module.exports = ck;

}).call(this,require("ngpmcQ"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/..\\..\\node_modules\\constructor-kit\\constructor-kit.js","/..\\..\\node_modules\\constructor-kit")
},{"buffer":4,"ngpmcQ":7}],4:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * If `Buffer._useTypedArrays`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (compatible down to IE6)
 */
Buffer._useTypedArrays = (function () {
  // Detect if browser supports Typed Arrays. Supported browsers are IE 10+, Firefox 4+,
  // Chrome 7+, Safari 5.1+, Opera 11.6+, iOS 4.2+. If the browser does not support adding
  // properties to `Uint8Array` instances, then that's the same as no `Uint8Array` support
  // because we need to be able to add all the node Buffer API methods. This is an issue
  // in Firefox 4-29. Now fixed: https://bugzilla.mozilla.org/show_bug.cgi?id=695438
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() &&
        typeof arr.subarray === 'function' // Chrome 9-10 lack `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Workaround: node's base64 implementation allows for non-padded strings
  // while base64-js does not.
  if (encoding === 'base64' && type === 'string') {
    subject = stringtrim(subject)
    while (subject.length % 4 !== 0) {
      subject = subject + '='
    }
  }

  // Find the length
  var length
  if (type === 'number')
    length = coerce(subject)
  else if (type === 'string')
    length = Buffer.byteLength(subject, encoding)
  else if (type === 'object')
    length = coerce(subject.length) // assume that object is array-like
  else
    throw new Error('First argument needs to be a number, array or string.')

  var buf
  if (Buffer._useTypedArrays) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer._useTypedArrays && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    for (i = 0; i < length; i++) {
      if (Buffer.isBuffer(subject))
        buf[i] = subject.readUInt8(i)
      else
        buf[i] = subject[i]
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer._useTypedArrays && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return !!(b !== null && b !== undefined && b._isBuffer)
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'hex':
      ret = str.length / 2
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.concat = function (list, totalLength) {
  assert(isArray(list), 'Usage: Buffer.concat(list, [totalLength])\n' +
      'list should be an Array.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (typeof totalLength !== 'number') {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

// BUFFER INSTANCE METHODS
// =======================

function _hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
    buf[offset + i] = byte
  }
  Buffer._charsWritten = i * 2
  return i
}

function _utf8Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function _asciiWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function _binaryWrite (buf, string, offset, length) {
  return _asciiWrite(buf, string, offset, length)
}

function _base64Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function _utf16leWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = _asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = _binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = _base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leWrite(this, string, offset, length)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toString = function (encoding, start, end) {
  var self = this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end !== undefined)
    ? Number(end)
    : end = self.length

  // Fastpath empty strings
  if (end === start)
    return ''

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexSlice(self, start, end)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Slice(self, start, end)
      break
    case 'ascii':
      ret = _asciiSlice(self, start, end)
      break
    case 'binary':
      ret = _binarySlice(self, start, end)
      break
    case 'base64':
      ret = _base64Slice(self, start, end)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leSlice(self, start, end)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  assert(end >= start, 'sourceEnd < sourceStart')
  assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
  assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
  assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 100 || !Buffer._useTypedArrays) {
    for (var i = 0; i < len; i++)
      target[i + target_start] = this[i + start]
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

function _base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function _utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function _asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++)
    ret += String.fromCharCode(buf[i])
  return ret
}

function _binarySlice (buf, start, end) {
  return _asciiSlice(buf, start, end)
}

function _hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function _utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i+1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = clamp(start, len, 0)
  end = clamp(end, len, len)

  if (Buffer._useTypedArrays) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  return this[offset]
}

function _readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  return _readUInt16(this, offset, true, noAssert)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  return _readUInt16(this, offset, false, noAssert)
}

function _readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  return _readUInt32(this, offset, true, noAssert)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  return _readUInt32(this, offset, false, noAssert)
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  var neg = this[offset] & 0x80
  if (neg)
    return (0xff - this[offset] + 1) * -1
  else
    return this[offset]
}

function _readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt16(buf, offset, littleEndian, true)
  var neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  return _readInt16(this, offset, true, noAssert)
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  return _readInt16(this, offset, false, noAssert)
}

function _readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt32(buf, offset, littleEndian, true)
  var neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  return _readInt32(this, offset, true, noAssert)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  return _readInt32(this, offset, false, noAssert)
}

function _readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  return _readFloat(this, offset, true, noAssert)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  return _readFloat(this, offset, false, noAssert)
}

function _readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  return _readDouble(this, offset, true, noAssert)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  return _readDouble(this, offset, false, noAssert)
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= this.length) return

  this[offset] = value
}

function _writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
            (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, false, noAssert)
}

function _writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, false, noAssert)
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= this.length)
    return

  if (value >= 0)
    this.writeUInt8(value, offset, noAssert)
  else
    this.writeUInt8(0xff + value + 1, offset, noAssert)
}

function _writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, false, noAssert)
}

function _writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, false, noAssert)
}

function _writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 23, 4)
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, false, noAssert)
}

function _writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (typeof value === 'string') {
    value = value.charCodeAt(0)
  }

  assert(typeof value === 'number' && !isNaN(value), 'value is not a number')
  assert(end >= start, 'end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  assert(start >= 0 && start < this.length, 'start out of bounds')
  assert(end >= 0 && end <= this.length, 'end out of bounds')

  for (var i = start; i < end; i++) {
    this[i] = value
  }
}

Buffer.prototype.inspect = function () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer._useTypedArrays) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1)
        buf[i] = this[i]
      return buf.buffer
    }
  } else {
    throw new Error('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

// slice(start, end)
function clamp (index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce (length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F)
      byteArray.push(str.charCodeAt(i))
    else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16))
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  var pos
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 */
function verifuint (value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754 (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

}).call(this,require("ngpmcQ"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/..\\..\\node_modules\\gulp-browserify\\node_modules\\browserify\\node_modules\\buffer\\index.js","/..\\..\\node_modules\\gulp-browserify\\node_modules\\browserify\\node_modules\\buffer")
},{"base64-js":5,"buffer":4,"ieee754":6,"ngpmcQ":7}],5:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS)
			return 62 // '+'
		if (code === SLASH)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

}).call(this,require("ngpmcQ"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/..\\..\\node_modules\\gulp-browserify\\node_modules\\browserify\\node_modules\\buffer\\node_modules\\base64-js\\lib\\b64.js","/..\\..\\node_modules\\gulp-browserify\\node_modules\\browserify\\node_modules\\buffer\\node_modules\\base64-js\\lib")
},{"buffer":4,"ngpmcQ":7}],6:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
exports.read = function(buffer, offset, isLE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isLE ? (nBytes - 1) : 0,
      d = isLE ? -1 : 1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isLE ? 0 : (nBytes - 1),
      d = isLE ? 1 : -1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

}).call(this,require("ngpmcQ"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/..\\..\\node_modules\\gulp-browserify\\node_modules\\browserify\\node_modules\\buffer\\node_modules\\ieee754\\index.js","/..\\..\\node_modules\\gulp-browserify\\node_modules\\browserify\\node_modules\\buffer\\node_modules\\ieee754")
},{"buffer":4,"ngpmcQ":7}],7:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

}).call(this,require("ngpmcQ"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/..\\..\\node_modules\\gulp-browserify\\node_modules\\browserify\\node_modules\\process\\browser.js","/..\\..\\node_modules\\gulp-browserify\\node_modules\\browserify\\node_modules\\process")
},{"buffer":4,"ngpmcQ":7}],8:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
'use strict';
var noop, pk;

noop = function(v) {
  return v;
};

pk = function(descriptor) {
  var computed, get, keys, set, value, _ref, _ref1;
  if (descriptor.constructor !== Object) {
    value = descriptor;
    get = noop;
    set = function(value, newValue) {
      return newValue;
    };
    keys = {};
  } else {
    keys = {
      get: descriptor.key || ((_ref = descriptor.keys) != null ? _ref.get : void 0),
      set: descriptor.key || ((_ref1 = descriptor.keys) != null ? _ref1.set : void 0)
    };
    value = descriptor.value;
    get = descriptor.get || noop;
    set = descriptor.set || function(value, newValue) {
      return newValue;
    };
    computed = value === void 0;
  }
  return function(v, opts) {
    opts = opts || ((v != null ? v.key : void 0) != null ? v : void 0) || {};
    if (arguments.length === 0) {
      if (keys.get) {
        throw new Error('Cannot get a locked property.');
      }
      if (computed) {
        return value = get.call(this, value);
      }
      return get.call(this, value);
    } else if (arguments.length === 1) {
      if (keys.get && opts.key) {
        if (keys.get === opts.key) {
          if (computed) {
            return value = get.call(this, value);
          }
          return get.call(this, value);
        } else {
          throw new Error('Cannot get a locked property.');
        }
      } else if (keys.set) {
        throw new Error('Cannot set a locked property.');
      } else {
        if (computed) {
          value = get.call(this, value);
        }
        value = set.call(this, value, v);
        return this;
      }
    } else if (arguments.length === 2) {
      if (keys.set) {
        if (keys.set === opts.key) {
          if (computed && value === void 0) {
            value = get.call(this, value);
          }
          value = set.call(this, value, v);
          return this;
        } else {
          throw new Error('Cannot set a locked property.');
        }
      } else {
        if (computed && value === void 0) {
          value = get.call(this, value);
        }
        value = set.call(this, value, v);
        return this;
      }
    }
  };
};

pk.pk = pk;

pk.propertyKit = pk;

module.exports = pk;

}).call(this,require("ngpmcQ"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/..\\..\\node_modules\\property-kit\\property-kit.js","/..\\..\\node_modules\\property-kit")
},{"buffer":4,"ngpmcQ":7}],9:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,__filename,__dirname){
/**
* @preserve Module: statejs
* Author: Darren Schnare
* Keywords: javascript,state,machine,finite,states
* License: MIT ( http://www.opensource.org/licenses/mit-license.php )
* Repo: https://github.com/dschnare/statejs
*/
'use strict';

var ck, pk, StateMachine, State, Transition, isArray;

ck = require('constructor-kit');
pk = require('property-kit');

isArray = Array.isArray || function (o) {
  return ({}).toString.call(o) === '[object Array]';
};

// invoke(o, methodName, ...)
// invoke(fn, thisObj, ...)
function invoke(o, methodName) {
  var args = [].slice.call(arguments, 2);

  if (typeof o === 'function') {
    return args.length ? o.apply(methodName, args) : o.call(methodName);
  } else if (o && typeof o[methodName] === 'function') {
    return args.length ? o[methodName].apply(o, args) : o[methodName]();
  }
}

// async(fn)
// async(fn, ...)
function async(fn) {
  var args = [].slice.call(arguments, 1);
  StateMachine.callLater(args.length === 0 ? fn : function () {
    fn.apply(undefined, args);
  });
}

// Adapter for state objects.
State = ck(function (state) {
  this.state = pk({value: state });
}, {
  name: function () {
    return this.state() ? this.state().name : '';
  },
  onentry: function () {
    async(invoke, this.state(), 'onentry');
  },
  onexit: function () {
    async(invoke, this.state(), 'onexit');
  }
});

// Adapter for transition objects.
Transition = ck(function (transition) {
 this.transition = pk({value: transition });
}, {
  from: function () {
    return this.transition() ? this.transition().from : '';
  },
  to: function () {
    return this.transition() ? this.transition().to : '';
  },
  actions: function () {
    var transition = this.transition();

    if (transition) {
      if (isArray(transition.actions)) {
        return transition.actions;
      } else if (typeof transition.action === 'function') {
        return [transition.action];
      }
    }

    return [];
  },
  hasTrigger: function (trigger) {
    var triggers, i, len;

    triggers = this.triggers();
    len = triggers.length;

    for (i = 0; i < len; i += 1) {
      if (triggers[i] === trigger) {
        return true;
      }
    }

    return false;
  },
  triggers: function () {
    var transition, triggers;

    triggers = [];
    transition = this.transition();

    if (transition) {
      if (isArray(transition.triggers)) {
        triggers = transition.triggers;
      } else if (transition.trigger) {
        triggers = [transition.trigger];
      }
    }

    return triggers;
  },
  guard: function (event) {
    var transition, guarded;

    transition = this.transition();
    guarded = invoke(transition, 'guard', event);

    return guarded === undefined || !!guarded;
  },
  invokeActions: function (event) {
    var actions, action, i, len, transition;

    actions = this.actions();
    transition = this.transition();
    len = actions.length;

    for (i = 0; i < len; i += 1) {
      action = actions[i];

      if (typeof action === 'function') {
        async(invoke, action, transition, event);
      }
    }
  }
});

StateMachine = (function () {
  var key = {};
  return ck(function (initialState) {
    this.states = pk({value: {}, key: key});
    this.transitions = pk({value: [], key: key});
    this.initialState = pk({keys: {set: key}});
    this.state = pk({
      set: function (currentValue, newValue) {
        var states = this.states({key: key});

        if (newValue === null || newValue === undefined) {
          throw new Error('Invalid state:' + newValue);
        }

        newValue = newValue.toString();

        if (!states[newValue]) {
          throw new Error('State does not exist:' + newValue);
        }

        if (states[currentValue]) {
          states[currentValue].onexit();
        }

        states[newValue].onentry();

        return newValue;
      }
    });

    initialState = this.addState(initialState || 'start');
    this.initialState(initialState.name(), {key: key});
    this.state(initialState.name());
  }, {
    hasState: function (state) {
      return typeof this.states({key: key})[state] !== 'function';
    },
    // addState(name)
    // addState({name[, onentry, onexit]})
    addState: function (state) {
      if (!state || (typeof state !== 'string' && typeof state.name !== 'string')) {
        throw new Error('State must have a name property.');
      }

      if (typeof state === 'string') {
        state = {name: state};
      }

      return (this.states({key: key})[state.name] = new State(state));
    },
    // addTransition({from, to, [guard, [action or actions], [trigger or triggers]]})
    addTransition: function (transition) {
      if (!transition || typeof transition.from !== 'string' || typeof transition.to !== 'string') {
        throw new Error('Transition must at least have a "from" and "to" poperties."');
      }

      this.transitions({key: key}).push(new Transition(transition));
    },
    // trigger(eventType)
    // trigger({type, ...})
    trigger: function (event) {
      var states, transitions, eventType, i, len, state, toState, transition;

      if (!event || (typeof event  !== 'string' && !event.type)) {
        throw new Error('Event must either be a string or an object with a type property.');
      }

      eventType = event.type || event;
      states = this.states({key: key});
      state = states[this.state()];
      transitions = this.transitions({key: key});

      len = transitions.length;
      for (i = 0; i < len; i += 1) {
        transition = transitions[i];

        if (transition.from() === state.name() && transition.hasTrigger(eventType) && transition.guard(event)) {
          toState = states[transition.to()];

          if (toState) {
            transition.invokeActions(event);
            this.state(toState.name());
            break;
          }
        }
      }
    }
  });
}());

// callLater(fn)
StateMachine.callLater = typeof requestAnimationFrame === 'function' ?
  function (fn) {
    requestAnimationFrame(fn);
  } : function (fn) {
    setTimeout(fn, 10);
  };

module.exports = StateMachine;
}).call(this,require("ngpmcQ"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],"/..\\..\\state.js","/..\\..")
},{"buffer":4,"constructor-kit":3,"ngpmcQ":7,"property-kit":8}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImM6XFxVc2Vyc1xcZHNjaG5hcmVcXERvY3VtZW50c1xcV29ya3NwYWNlXFxKYXZhU2NyaXB0XFxzdGF0ZWpzXFxub2RlX21vZHVsZXNcXGd1bHAtYnJvd3NlcmlmeVxcbm9kZV9tb2R1bGVzXFxicm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXItcGFja1xcX3ByZWx1ZGUuanMiLCJjOi9Vc2Vycy9kc2NobmFyZS9Eb2N1bWVudHMvV29ya3NwYWNlL0phdmFTY3JpcHQvc3RhdGVqcy9leGFtcGxlL2pzL2Zha2VfNWYyZmRiNi5qcyIsImM6L1VzZXJzL2RzY2huYXJlL0RvY3VtZW50cy9Xb3Jrc3BhY2UvSmF2YVNjcmlwdC9zdGF0ZWpzL2V4YW1wbGUvanMvbW9jay1vYmplY3RzLmpzIiwiYzovVXNlcnMvZHNjaG5hcmUvRG9jdW1lbnRzL1dvcmtzcGFjZS9KYXZhU2NyaXB0L3N0YXRlanMvbm9kZV9tb2R1bGVzL2NvbnN0cnVjdG9yLWtpdC9jb25zdHJ1Y3Rvci1raXQuanMiLCJjOi9Vc2Vycy9kc2NobmFyZS9Eb2N1bWVudHMvV29ya3NwYWNlL0phdmFTY3JpcHQvc3RhdGVqcy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvaW5kZXguanMiLCJjOi9Vc2Vycy9kc2NobmFyZS9Eb2N1bWVudHMvV29ya3NwYWNlL0phdmFTY3JpcHQvc3RhdGVqcy9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9saWIvYjY0LmpzIiwiYzovVXNlcnMvZHNjaG5hcmUvRG9jdW1lbnRzL1dvcmtzcGFjZS9KYXZhU2NyaXB0L3N0YXRlanMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnVmZmVyL25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiYzovVXNlcnMvZHNjaG5hcmUvRG9jdW1lbnRzL1dvcmtzcGFjZS9KYXZhU2NyaXB0L3N0YXRlanMvbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiYzovVXNlcnMvZHNjaG5hcmUvRG9jdW1lbnRzL1dvcmtzcGFjZS9KYXZhU2NyaXB0L3N0YXRlanMvbm9kZV9tb2R1bGVzL3Byb3BlcnR5LWtpdC9wcm9wZXJ0eS1raXQuanMiLCJjOi9Vc2Vycy9kc2NobmFyZS9Eb2N1bWVudHMvV29ya3NwYWNlL0phdmFTY3JpcHQvc3RhdGVqcy9zdGF0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8vIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBtaW1pY3MgYW4gb3ZlciBzaW1wbGlmaWVkIHZlcnNpb24gb2YgVGV0cmlzLlxyXG4vLyBUaGlzIHNpbXBsZSBnYW1lIGNvbnNpc3RzIG9mIDUgbGV2ZWxzIHdoZXJlIHBsYXllcnMgbXVzdCBjbGVhciBhXHJcbi8vIGNlcnRhaW4gbnVtYmVyIGxpbmVzIHRvIGNvbXBsZXRlIGVhY2ggbGV2ZWwuIFRoZSBnYW1lIGlzIHdvbiB3aGVuIGFcclxuLy8gcGxheWVyIGhhcyBjb21wbGV0ZWQgYWxsIDUgbGV2ZWxzLlxyXG4vL1xyXG4vLyBTdGF0ZXM6XHJcbi8vIHNwbGFzaCAtIFNob3dzIHRoZSBzcGxhc2ggc2NyZWVuIGZvciBhIHNob3J0IGR1cmF0aW9uIChzYXkgMyBzZWNvbmRzKS5cclxuLy8gdGl0bGUgLSBTaG93cyB0aGUgdGl0bGUgc2NyZWVuIHdpdGggYW4gT1BUSU9OUyBhbmQgUExBWSBHQU1FIGJ1dHRvbnMuXHJcbi8vIGxvYWRpbmcgLSBTaG93cyBhIGxvYWRpbmcgc2NyZWVuIGZvciB0aGUgY3VycmVudCBsZXZlbC5cclxuLy8gZ2FtZSAtIFNob3dzIHRoZSBtYWluIGdhbWUgc2NyZWVuIHdpdGggSFVELlxyXG4vLyBwYXVzZSAtIFNob3dzIGEgcGF1c2UgbW9kYWwgc2NyZWVuIG92ZXIgdGhlIGdhbWUuXHJcbi8vIGxldmVsIGNvbXBsZXRlIC0gU2hvd3MgdGhlIGxldmVsIGNvbXBsZXRlIHNjcmVlbiBhbmQgc2NvcmUgdGFsbHkuXHJcbi8vIGdhbWUgY29tcGxldGUgLSBTaG93cyB0aGUgZ2FtZSBjcmVkaXRzLlxyXG4vL1xyXG4vLyBUcmFuc2l0aW9uczpcclxuLy8gc3BsYXNoIHtTUExBU0hfQ09NUEVMVEV9LT4gdGl0bGVcclxuLy8gdGl0bGUge0NIT0lDRV9PUFRJT05TfS0+IG9wdGlvbnNcclxuLy8gb3B0aW9ucyB7T1BUSU9OU19TQVZFfS0+IHRpdGxlXHJcbi8vIHRpdGxlIHtPUFRJT05TX1BMQVlfR0FNRX0tPiBsb2FkaW5nXHJcbi8vIGxvYWRpbmcge0xPQURfQ09NUExFVEV9LT4gZ2FtZVxyXG4vLyBnYW1lIHtHQU1FX1BBVVNFfS0+IHBhdXNlXHJcbi8vIHBhdXNlIHtHQU1FX1BBVVNFfS0+IGdhbWVcclxuLy8gcGF1c2Uge0dBTUVfUVVJVH0tPiB0aXRsZVxyXG4vLyBnYW1lIHtHQU1FX0NMRUFSX0xJTkV9LT4gbGV2ZWwgY29tcGxldGVcclxuLy8gbGV2ZWwgY29tcGxldGUge0FEVkFOQ0V9LT4gbG9hZGluZyAoaWYgcGxheWVyIGhhc24ndCBjb21wbGV0ZWQgdGhlIGZpbmFsIGxldmVsKVxyXG4vLyBsZXZlbCBjb21wbGV0ZSB7QURWQU5DRX0tPiBnYW1lIGNvbXBsZXRlIChpZiBwbGF5ZXIgaGFzIGNvbXBlbHRlZCB0aGUgZmluYWwgbGV2ZWwpXHJcbi8vIGdhbWUgY29tcGxldGUge0FEVkFOQ0V9LT4gY3JlZGl0c1xyXG4vLyBjcmVkaXRzIHtBRFZBTkNFfS0+IHRpdGxlXHJcbi8vXHJcbi8vIE5PVEVTOiBXaGVyZVxyXG4vLyAtIHtOQU1FfSBpcyB0aGUgZXZlbnQgdHlwZSB0aGF0IHdpbGwgdHJpZ2dlciB0aGUgdHJhbnNpdGlvbi5cclxuLy8gLSAoY29uZGl0aW9uKSBpcyB0aGUgZ3VhcmQgY29uZGl0aW9uIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIHRyYW5zaXRpb24gc2hvdWxkIGJlIGludm9rZWQuXHJcbnZhciBTdGF0ZU1hY2hpbmUgPSByZXF1aXJlKCcuLi8uLi9zdGF0ZScpO1xyXG52YXIgTU9DSyA9IHJlcXVpcmUoJy4vbW9jay1vYmplY3RzJyk7XHJcblxyXG4kKGZ1bmN0aW9uICgpIHtcclxuICB2YXIgc20sIGxldmVsLCBzY29yZSwgbGV2ZWxDb3VudCwgZ29hbCwgbGluZXNDbGVhcmVkLCBvcHRpb25zLCBsb2FkZXIsIGlucHV0TWFuYWdlciwgc2NyZWVuTWFuYWdlcjtcclxuXHJcbiAgc20gPSBuZXcgU3RhdGVNYWNoaW5lKCk7XHJcbiAgLy8gVGhlIGN1cnJlbnQgbGV2ZWwgKDEtYmFzZWQpLlxyXG4gIGxldmVsID0gMDtcclxuICAvLyBUaGUgcGxheWVyJ3MgdG90YWwgc2NvcmUuXHJcbiAgc2NvcmUgPSAwO1xyXG4gIC8vIFRoZSBudW1iZXIgb2YgbGV2ZWxzLlxyXG4gIGxldmVsQ291bnQgPSA1O1xyXG4gIC8vIFRoZSBnb2FsIChpLmUuIG51bWJlciBvZiBsaW5lcyB0byBjbGVhcikgZm9yIGVhY2ggbGV2ZWwuXHJcbiAgZ29hbCA9IFszLCAzLCAzLCAzLCAzXTtcclxuICAvLyBUaGUgbGluZXMgY2xlYXJlZCBmb3IgdGhlIGN1cnJlbnQgbGV2ZWwuXHJcbiAgbGluZXNDbGVhcmVkID0gMDtcclxuICAvLyBUaGUgb3B0aW9ucyB0aGUgcGxheWVyIGhhcyBzZXQgZm9yIHRoZSBnYW1lLlxyXG4gIG9wdGlvbnMgPSB7fTtcclxuICAvLyBUaGUgYXNzZXQgbG9hZGVyLlxyXG4gIGxvYWRlciA9IE1PQ0subWFrZUxvYWRlcigpO1xyXG4gIC8vIFRoZSBpbnB1dCBtYW5hZ2VyLlxyXG4gIGlucHV0TWFuYWdlciA9IE1PQ0subWFrZUlucHV0TWFuYWdlcihkb2N1bWVudCk7XHJcbiAgLy8gVGhlIHNjcmVlbiBtYW5hZ2VyLlxyXG4gIHNjcmVlbk1hbmFnZXIgPSBNT0NLLm1ha2VTY3JlZW5NYW5hZ2VyKGRvY3VtZW50LmJvZHksIGlucHV0TWFuYWdlcik7XHJcblxyXG4gIC8vIE91ciBzY3JlZW4gbWFuYWdlciB0YWtlcyBjYXJlIG9mIGRpc3BsYXlpbmcgYW5kIHJlbmRlcmluZ1xyXG4gIC8vIG91ciBnYW1lIHNjcmVlbnMuIFdlIHNldCB0aGUgY2xlYXIgY29sb3VyIChpLmUuIGJhY2tncm91bmQpIHRvXHJcbiAgLy8gc29saWQgYmxhY2sgYW5kIHRlbGwgaXQgdG8gZmFkZSBiZXR3ZWVuIHNjcmVlbnMuXHJcbiAgc2NyZWVuTWFuYWdlci5jbGVhckNvbG91cignIzAwMDAwMCcpO1xyXG4gIHNjcmVlbk1hbmFnZXIudHJhbnNpdGlvbignZmFkZScpO1xyXG5cclxuICAvLyBPdXIgaW5wdXQgbWFuYWdlciB0YWtlcyBjYXJlIG9mIGludGVyZmFjaW5nIHdpdGggdGhlIGtleWJvYXJkXHJcbiAgLy8gYW5kIG1vdXNlLiBIZXJlIHdlIHNldHVwIGEgaHlwb3RoZXRpY2FsIGtleSBtYXBwaW5nLiBGb3IgdGhpc1xyXG4gIC8vIGdhbWUgdGhlIGlucHV0IG1hbmFnZXIgd2lsbCByYWlzZSBldmVudHMgd2l0aCB0aGUgZXZlbnQgdHlwZVxyXG4gIC8vIGVxdWFsbGluZyB0aGUga2V5IHByZXNzZWQgb3IgdGhlIGtleSdzIG1hcHBlZCB2YWx1ZS5cclxuICBpbnB1dE1hbmFnZXIua2V5TWFwcGluZyh7XHJcbiAgICBFU0M6ICdQQVVTRScsXHJcbiAgICBQOiAnUEFVU0UnLFxyXG4gICAgTEVGVDogJ0xFRlQnLFxyXG4gICAgQTogJ0xFRlQnLFxyXG4gICAgUklHSFQ6ICdSSUdIVCcsXHJcbiAgICBEOiAnUklHSFQnLFxyXG4gICAgRE9XTjogJ0RST1AnLFxyXG4gICAgUzogJ0RST1AnLFxyXG4gICAgU1BBQ0U6ICdBRFZBTkNFJ1xyXG4gIH0pO1xyXG5cclxuICAvLyBBbGwgYWN0aW9ucyBmcm9tIHRoZSBzdGF0ZSBtYWNoaW5lIGFyZSBpbnZva2VkIGFzeW5jaHJvbm91c2x5XHJcbiAgLy8gc28gdGhleSBkb24ndCBibG9jayB0aGUgbWFpbiB0aHJlYWQuXHJcblxyXG4gIC8vLy8vLy8vLy8vL1xyXG4gIC8vIFN0YXRlcyAvL1xyXG4gIC8vLy8vLy8vLy8vL1xyXG5cclxuICBzbS5hZGRTdGF0ZSh7XHJcbiAgICBuYW1lOiAnc3BsYXNoJyxcclxuICAgIG9uZW50cnk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgc2NyZWVuTWFuYWdlci5zaG93KCdzcGxhc2gnKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgc20uYWRkU3RhdGUoe1xyXG4gICAgbmFtZTogJ3RpdGxlJyxcclxuICAgIG9uZW50cnk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgbGV2ZWwgPSAwO1xyXG4gICAgICBzY29yZSA9IDA7XHJcbiAgICAgIHNjcmVlbk1hbmFnZXIuc2hvdygndGl0bGUnKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgc20uYWRkU3RhdGUoe1xyXG4gICAgbmFtZTogJ29wdGlvbnMnLFxyXG4gICAgb25lbnRyeTogZnVuY3Rpb24gKCkge1xyXG4gICAgICBzY3JlZW5NYW5hZ2VyLnNob3coJ29wdGlvbnMnLCBvcHRpb25zKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgc20uYWRkU3RhdGUoe1xyXG4gICAgbmFtZTogJ2xvYWRpbmcnLFxyXG4gICAgb25lbnRyeTogZnVuY3Rpb24gKCkge1xyXG4gICAgICBsZXZlbCArPSAxO1xyXG4gICAgICBsaW5lc0NsZWFyZWQgPSAwO1xyXG4gICAgICBzY3JlZW5NYW5hZ2VyLnNob3coJ2xvYWRpbmcnLCB7bGV2ZWw6IGxldmVsfSk7XHJcbiAgICAgIGxvYWRlci5sb2FkKGxldmVsKTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgc20uYWRkU3RhdGUoe1xyXG4gICAgbmFtZTogJ2dhbWUnLFxyXG4gICAgb25lbnRyeTogZnVuY3Rpb24gKCkge1xyXG4gICAgICBzY3JlZW5NYW5hZ2VyLnNob3coJ2dhbWUnLCB7c2NvcmU6IHNjb3JlfSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHNtLmFkZFN0YXRlKHtcclxuICAgIG5hbWU6ICdwYXVzZScsXHJcbiAgICBvbmVudHJ5OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHNjcmVlbk1hbmFnZXIuc2hvd01vZGFsKCdwYXVzZScpO1xyXG4gICAgfSxcclxuICAgIG9uZXhpdDogZnVuY3Rpb24gKCkge1xyXG4gICAgICBzY3JlZW5NYW5hZ2VyLmhpZGVNb2RhbCgpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICBzbS5hZGRTdGF0ZSh7XHJcbiAgICBuYW1lOiAnbGV2ZWwgY29tcGxldGUnLFxyXG4gICAgb25lbnRyeTogZnVuY3Rpb24gKCkge1xyXG4gICAgICBzY3JlZW5NYW5hZ2VyLnNob3coJ2xldmVsX2NvbXBsZXRlJywge2xldmVsOiBsZXZlbCwgc2NvcmU6IHNjb3JlfSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHNtLmFkZFN0YXRlKHtcclxuICAgIG5hbWU6ICdnYW1lIGNvbXBsZXRlJyxcclxuICAgIG9uZW50cnk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgc2NyZWVuTWFuYWdlci5zaG93KCdnYW1lX2NvbXBsZXRlJywge2xldmVsOiBsZXZlbCwgc2NvcmU6IHNjb3JlfSk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG4gIHNtLmFkZFN0YXRlKHtcclxuICAgIG5hbWU6ICdjcmVkaXRzJyxcclxuICAgIG9uZW50cnk6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgc2NyZWVuTWFuYWdlci5zaG93KCdjcmVkaXRzJyk7XHJcbiAgICB9XHJcbiAgfSk7XHJcblxyXG5cclxuICAvLy8vLy8vLy8vLy8vLy8vL1xyXG4gIC8vIFRyYW5zaXRpb25zIC8vXHJcbiAgLy8vLy8vLy8vLy8vLy8vLy9cclxuXHJcbiAgc20uYWRkVHJhbnNpdGlvbih7ZnJvbTogJ3NwbGFzaCcsIHRvOiAndGl0bGUnLCB0cmlnZ2VyOiAnU1BMQVNIX0NPTVBMRVRFJ30pO1xyXG4gIHNtLmFkZFRyYW5zaXRpb24oe2Zyb206ICd0aXRsZScsIHRvOiAnb3B0aW9ucycsIHRyaWdnZXI6ICdDSE9JQ0VfT1BUSU9OUyd9KTtcclxuICBzbS5hZGRUcmFuc2l0aW9uKHtcclxuICAgIGZyb206ICdvcHRpb25zJyxcclxuICAgIHRvOiAndGl0bGUnLFxyXG4gICAgdHJpZ2dlcjogJ09QVElPTlNfU0FWRScsXHJcbiAgICBhY3Rpb246IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAvLyBUaGlzIGlzIHdoZXJlIHdlIHdvdWxkIHNhdmUgb3VyIG9wdGlvbnMuXHJcbiAgICAgIG9wdGlvbnMgPSBldmVudC5vcHRpb25zO1xyXG4gICAgfVxyXG4gIH0pO1xyXG4gIHNtLmFkZFRyYW5zaXRpb24oe2Zyb206ICd0aXRsZScsIHRvOiAnbG9hZGluZycsIHRyaWdnZXI6ICdDSE9JQ0VfUExBWV9HQU1FJ30pO1xyXG4gIHNtLmFkZFRyYW5zaXRpb24oe2Zyb206ICdsb2FkaW5nJywgdG86ICdnYW1lJywgdHJpZ2dlcjogJ0xPQURfQ09NUExFVEUnfSk7XHJcbiAgc20uYWRkVHJhbnNpdGlvbih7ZnJvbTogJ2dhbWUnLCB0bzogJ3BhdXNlJywgdHJpZ2dlcjogJ0dBTUVfUEFVU0UnfSk7XHJcbiAgc20uYWRkVHJhbnNpdGlvbih7ZnJvbTogJ3BhdXNlJywgdG86ICd0aXRsZScsIHRyaWdnZXI6ICdDSE9JQ0VfUVVJVCd9KTtcclxuICBzbS5hZGRUcmFuc2l0aW9uKHtmcm9tOiAncGF1c2UnLCB0bzogJ2dhbWUnLCB0cmlnZ2VyOiAnR0FNRV9QQVVTRSd9KTtcclxuXHJcbiAgc20uYWRkVHJhbnNpdGlvbih7XHJcbiAgICBmcm9tOiAnZ2FtZScsXHJcbiAgICB0bzogJ2xldmVsIGNvbXBsZXRlJyxcclxuICAgIHRyaWdnZXI6ICdHQU1FX0NMRUFSX0xJTkUnLFxyXG4gICAgZ3VhcmQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIGxpbmVzQ2xlYXJlZCA9PT0gZ29hbFtsZXZlbCAtIDFdO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICBzbS5hZGRUcmFuc2l0aW9uKHtcclxuICAgIGZyb206ICdsZXZlbCBjb21wbGV0ZScsXHJcbiAgICB0bzogJ2xvYWRpbmcnLFxyXG4gICAgdHJpZ2dlcjogJ0FEVkFOQ0UnLFxyXG4gICAgZ3VhcmQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIGxldmVsIDwgbGV2ZWxDb3VudDtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgc20uYWRkVHJhbnNpdGlvbih7XHJcbiAgICBmcm9tOiAnbGV2ZWwgY29tcGxldGUnLFxyXG4gICAgdG86ICdnYW1lIGNvbXBsZXRlJyxcclxuICAgIHRyaWdnZXI6ICdBRFZBTkNFJyxcclxuICAgIGd1YXJkOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiBsZXZlbCA9PT0gbGV2ZWxDb3VudDtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgc20uYWRkVHJhbnNpdGlvbih7ZnJvbTogJ2dhbWUgY29tcGxldGUnLCB0bzogJ2NyZWRpdHMnLCB0cmlnZ2VyOiAnQURWQU5DRSd9KTtcclxuICBzbS5hZGRUcmFuc2l0aW9uKHtmcm9tOiAnY3JlZGl0cycsIHRvOiAndGl0bGUnLCB0cmlnZ2VyOiAnQURWQU5DRSd9KTtcclxuXHJcblxyXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gIC8vIEV2ZW50IExpc3RlbmVycyAvL1xyXG4gIC8vLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG5cclxuICBzY3JlZW5NYW5hZ2VyLmFkZEV2ZW50TGlzdGVuZXIoJ1NQTEFTSF9DT01QTEVURScsIGZ1bmN0aW9uICgpIHtcclxuICAgIHNtLnRyaWdnZXIoJ1NQTEFTSF9DT01QTEVURScpO1xyXG4gIH0pO1xyXG5cclxuICBzY3JlZW5NYW5hZ2VyLmFkZEV2ZW50TGlzdGVuZXIoJ0NIT0lDRScsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgc3dpdGNoIChldmVudC5jaG9pY2UpIHtcclxuICAgIGNhc2UgJ09QVElPTlMnOlxyXG4gICAgICBzbS50cmlnZ2VyKCdDSE9JQ0VfT1BUSU9OUycpO1xyXG4gICAgICBicmVhaztcclxuICAgIGNhc2UgJ1BMQVlfR0FNRSc6XHJcbiAgICAgIHNtLnRyaWdnZXIoJ0NIT0lDRV9QTEFZX0dBTUUnKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdRVUlUJzpcclxuICAgICAgc20udHJpZ2dlcignQ0hPSUNFX1FVSVQnKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICdSRVNVTUUnOlxyXG4gICAgICBzbS50cmlnZ2VyKCdHQU1FX1BBVVNFJyk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICBzY3JlZW5NYW5hZ2VyLmFkZEV2ZW50TGlzdGVuZXIoJ09QVElPTlNfU0FWRScsIGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgc20udHJpZ2dlcih7dHlwZTogJ09QVElPTlNfU0FWRScsIG9wdGlvbnM6IGV2ZW50Lm9wdGlvbnN9KTtcclxuICB9KTtcclxuXHJcblxyXG4gIC8vIExpc3RlbiB0byB0aGUgUFJPR1JFU1MgZXZlbnQgZnJvbSB0aGUgbG9hZGVyIGFuZCBzZW5kIGEgbWVzc2FnZVxyXG4gIC8vIGNvbnRhaW5pbmcgdGhlIGxvYWQgcHJvZ3Jlc3MgdG8gdGhlIGFjdGl2ZSBzY3JlZW5zIGluIHRoZSBzY3JlZW4gbWFuYWdlci5cclxuICBsb2FkZXIuYWRkRXZlbnRMaXN0ZW5lcignUFJPR1JFU1MnLCBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgIHNjcmVlbk1hbmFnZXIuc2VuZCgnTE9BRF9QUk9HUkVTUycsIHtwcm9ncmVzczogZXZlbnQucHJvZ3Jlc3N9KTtcclxuICB9KTtcclxuXHJcbiAgbG9hZGVyLmFkZEV2ZW50TGlzdGVuZXIoJ0NPTVBMRVRFJywgZnVuY3Rpb24gKCkge1xyXG4gICAgc20udHJpZ2dlcignTE9BRF9DT01QTEVURScpO1xyXG4gIH0pO1xyXG5cclxuXHJcbiAgaW5wdXRNYW5hZ2VyLmFkZEV2ZW50TGlzdGVuZXIoJ1BBVVNFJywgZnVuY3Rpb24gKCkge1xyXG4gICAgc20udHJpZ2dlcignR0FNRV9QQVVTRScpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBXZSBhbGxvdyBwbGF5ZXJzIHRvIGFkdmFuY2Uvc2tpcCBhIHNjcmVlbiBieSBwcmVzc2luZyB0aGVcclxuICAvLyAnQURWQU5DRScgYnV0dG9uIG9uIHRoZSBrZXlib2FyZCAoaS5lLiB0aGUgc3BhY2ViYXIpLlxyXG4gIGlucHV0TWFuYWdlci5hZGRFdmVudExpc3RlbmVyKCdBRFZBTkNFJywgZnVuY3Rpb24gKCkge1xyXG4gICAgc3dpdGNoIChzbS5zdGF0ZSgpKSB7XHJcbiAgICBjYXNlICdsZXZlbCBjb21wbGV0ZSc6XHJcbiAgICBjYXNlICdnYW1lIGNvbXBsZXRlJzpcclxuICAgIGNhc2UgJ2NyZWRpdHMnOlxyXG4gICAgICBzbS50cmlnZ2VyKCdBRFZBTkNFJyk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuXHJcbiAgc2NyZWVuTWFuYWdlci5hZGRFdmVudExpc3RlbmVyKCdDTEVBUl9MSU5FJywgZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICBsaW5lc0NsZWFyZWQgKz0gMTtcclxuICAgIHNjb3JlID0gZXZlbnQuc2NvcmU7XHJcbiAgICBzbS50cmlnZ2VyKCdHQU1FX0NMRUFSX0xJTkUnKTtcclxuICB9KTtcclxuXHJcbiAgLy8vLy8vLy8vLy8vLy8vLy8vL1xyXG4gIC8vIEluaXRpYWwgU3RhdGUgLy9cclxuICAvLy8vLy8vLy8vLy8vLy8vLy8vXHJcblxyXG4gIC8vIFN0YXJ0IHRoZSB3aG9sZSBzZXF1ZW5jZSBieSBzZXR0aW5nIHRoZSBzdGF0ZSBvZiB0aGVcclxuICAvLyBzdGF0ZSBtYWNoaW5lIHRvIGJlIHNwbGFzaC5cclxuICBzbS5zdGF0ZSgnc3BsYXNoJyk7XHJcbn0pO1xyXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwibmdwbWNRXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvZmFrZV81ZjJmZGI2LmpzXCIsXCIvXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xyXG5cdGZ1bmN0aW9uIG1ha2VFdmVudERpc3BhdGNoZXIodGFyZ2V0KSB7XHJcblx0XHR2YXIgbGlzdGVuZXJzID0gW10sXHJcblx0XHRcdGdldE9yQ3JlYXRlQnVja2V0ID0gZnVuY3Rpb24gKGV2ZW50VHlwZSkge1xyXG5cdFx0XHRcdHZhciBidWNrZXQgPSBsaXN0ZW5lcnNbZXZlbnRUeXBlXTtcclxuXHJcblx0XHRcdFx0aWYgKCFidWNrZXQpIHtcclxuXHRcdFx0XHRcdGJ1Y2tldCA9IFtdO1xyXG5cdFx0XHRcdFx0YnVja2V0LmFkZCA9IGZ1bmN0aW9uIChsaXN0ZW5lcikge1xyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIGxpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdFx0dGhpcy5wdXNoKGxpc3RlbmVyKTtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gbGlzdGVuZXI7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRidWNrZXQucmVtb3ZlID0gZnVuY3Rpb24gKGxpc3RlbmVyKSB7XHJcblx0XHRcdFx0XHRcdHZhciBpLFxyXG5cdFx0XHRcdFx0XHRcdGxlbiA9IHRoaXMubGVuZ3RoO1xyXG5cclxuXHRcdFx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XHJcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXNbaV0gPT09IGxpc3RlbmVyKSB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnNwbGljZShpLCAxKTtcclxuXHRcdFx0XHRcdFx0XHRcdHJldHVybiBsaXN0ZW5lcjtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH07XHJcblx0XHRcdFx0XHRidWNrZXQuZGlzcGF0Y2ggPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGksXHJcblx0XHRcdFx0XHRcdFx0bGVuID0gdGhpcy5sZW5ndGg7XHJcblxyXG5cdFx0XHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICs9IDEpIHtcclxuXHRcdFx0XHRcdFx0XHR0aGlzW2ldLmNhbGwodGFyZ2V0LCBldmVudCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH07XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRsaXN0ZW5lcnNbZXZlbnRUeXBlXSA9IGJ1Y2tldDtcclxuXHJcblx0XHRcdFx0cmV0dXJuIGJ1Y2tldDtcclxuXHRcdFx0fTtcclxuXHJcblx0XHR0YXJnZXQgPSB0YXJnZXQgfHwgdGhpcztcclxuXHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHRhZGRFdmVudExpc3RlbmVyOiBmdW5jdGlvbiAoZXZlbnRUeXBlLCBsaXN0ZW5lcikge1xyXG5cdFx0XHRcdHJldHVybiBnZXRPckNyZWF0ZUJ1Y2tldChldmVudFR5cGUpLmFkZChsaXN0ZW5lcik7XHJcblx0XHRcdH0sXHJcblx0XHRcdHJlbW92ZUV2ZW50TGlzdGVuZXI6IGZ1bmN0aW9uIChldmVudFR5cGUsIGxpc3RlbmVyKSB7XHJcblx0XHRcdFx0cmV0dXJuIGdldE9yQ3JlYXRlQnVja2V0KGV2ZW50VHlwZSkucmVtb3ZlKGxpc3RlbmVyKTtcclxuXHRcdFx0fSxcclxuXHRcdFx0ZGlzcGF0Y2hFdmVudDogZnVuY3Rpb24gKGV2ZW50KSB7XHJcblx0XHRcdFx0dmFyIGJ1Y2tldCA9IGdldE9yQ3JlYXRlQnVja2V0KGV2ZW50LnR5cGUpO1xyXG5cclxuXHRcdFx0XHRpZiAoYnVja2V0KSB7XHJcblx0XHRcdFx0XHRidWNrZXQuZGlzcGF0Y2goZXZlbnQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIG1ha2VMb2FkZXIoKSB7XHJcblx0XHR2YXIgbG9hZGVyID0gbWFrZUV2ZW50RGlzcGF0Y2hlcigpO1xyXG5cclxuXHRcdGZ1bmN0aW9uIGZha2VMb2FkKGR1cmF0aW9uLCB1cGRhdGUpIHtcclxuXHRcdFx0dmFyIHRvdGFsID0gMCxcclxuXHRcdFx0XHRpZCA9IC0xO1xyXG5cclxuXHRcdFx0aWQgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0dG90YWwgKz0gdXBkYXRlO1xyXG5cdFx0XHRcdHRvdGFsID0gdG90YWwgPiBkdXJhdGlvbiA/IGR1cmF0aW9uIDogdG90YWw7XHJcblx0XHRcdFx0bG9hZGVyLmRpc3BhdGNoRXZlbnQoe3R5cGU6ICdQUk9HUkVTUycsIHByb2dyZXNzOiBwYXJzZUZsb2F0KHRvdGFsIC8gZHVyYXRpb24pLnRvRml4ZWQoMil9KTtcclxuXHJcblx0XHRcdFx0aWYgKHRvdGFsID49IGR1cmF0aW9uKSB7XHJcblx0XHRcdFx0XHRjbGVhclRpbWVvdXQoaWQpO1xyXG5cdFx0XHRcdFx0c2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdGxvYWRlci5kaXNwYXRjaEV2ZW50KHt0eXBlOiAnQ09NUExFVEUnfSk7XHJcblx0XHRcdFx0XHR9LCA1MDApO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSwgdXBkYXRlKTtcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiByYW5nZShhLCBiKSB7XHJcblx0XHRcdHJldHVybiBwYXJzZUludChhICsgKE1hdGgucmFuZG9tKCkgKiAoYiAtIGEpKSwgMTApO1xyXG5cdFx0fVxyXG5cclxuXHRcdGxvYWRlci5sb2FkID0gZnVuY3Rpb24gKGxldmVsKSB7XHJcblx0XHRcdGZha2VMb2FkKHJhbmdlKDMwMDAsIDUwMDApLCAxMDApO1xyXG5cdFx0fTtcclxuXHJcblx0XHRyZXR1cm4gbG9hZGVyO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gbWFrZUlucHV0TWFuYWdlcihzY29wZSkge1xyXG5cdFx0dmFyIG1hbmFnZXIgPSBtYWtlRXZlbnREaXNwYXRjaGVyKCksXHJcblx0XHRcdGtleU1hcHBpbmcgPSB7fTtcclxuXHJcblx0XHRzY29wZSA9IHNjb3BlIHx8IGRvY3VtZW50O1xyXG5cclxuXHRcdG1hbmFnZXIua2V5TWFwcGluZyA9IGZ1bmN0aW9uIChtYXBwaW5nKSB7XHJcblx0XHRcdGtleU1hcHBpbmcgPSBtYXBwaW5nO1xyXG5cdFx0fTtcclxuXHJcblx0XHRzY29wZS5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIGZ1bmN0aW9uIChldmVudCkge1xyXG5cdFx0XHR2YXIgbmFtZSA9IFN0cmluZy5mcm9tQ2hhckNvZGUoZXZlbnQua2V5Q29kZSk7XHJcblxyXG5cdFx0XHRzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcclxuXHRcdFx0Y2FzZSAzMjpcclxuXHRcdFx0XHRuYW1lID0gJ1NQQUNFJztcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAyNzpcclxuXHRcdFx0XHRuYW1lID0gJ0VTQyc7XHJcblx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdGNhc2UgMzc6XHJcblx0XHRcdFx0bmFtZSA9ICdMRUZUJztcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSAzOTpcclxuXHRcdFx0XHRuYW1lID0gJ1JJR0hUJztcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSA0MDpcclxuXHRcdFx0XHRuYW1lID0gJ0RPV04nO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAobmFtZSAmJiBrZXlNYXBwaW5nW25hbWVdKSB7XHJcblx0XHRcdFx0bmFtZSA9IGtleU1hcHBpbmdbbmFtZV07XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdG1hbmFnZXIuZGlzcGF0Y2hFdmVudCh7dHlwZTogbmFtZX0pO1xyXG5cdFx0fSwgZmFsc2UpO1xyXG5cclxuXHRcdHJldHVybiBtYW5hZ2VyO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZm9ybWF0KHMpIHtcclxuXHRcdHZhciBzdHJpbmcgPSBzID09PSBudWxsIHx8IHMgPT09IHVuZGVmaW5lZCA/ICcnIDogcy50b1N0cmluZygpLFxyXG5cdFx0XHRhcmdzID0gYXJndW1lbnRzLFxyXG5cdFx0XHRhcmdDb3VudCA9IGFyZ3MubGVuZ3RoLFxyXG5cdFx0XHRpID0gc3RyaW5nLmxlbmd0aCxcclxuXHRcdFx0YyA9IG51bGwsXHJcblx0XHRcdG4gPSAwLFxyXG5cdFx0XHRrID0gMCxcclxuXHRcdFx0bmV4dCA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRpIC09IDE7XHJcblx0XHRcdFx0YyA9IHN0cmluZy5jaGFyQXQoaSk7XHJcblx0XHRcdFx0cmV0dXJuIGM7XHJcblx0XHRcdH07XHJcblxyXG5cdFx0d2hpbGUgKG5leHQoKSkge1xyXG5cdFx0XHRpZiAoYyA9PT0gJ30nKSB7XHJcblx0XHRcdFx0ayA9IGkgKyAxO1xyXG5cdFx0XHRcdG5leHQoKTtcclxuXHRcdFx0XHRuID0gJyc7XHJcblxyXG5cdFx0XHRcdHdoaWxlIChjID49ICcwJyAmJiBjIDw9ICc5Jykge1xyXG5cdFx0XHRcdFx0biA9IGMgKyBuO1xyXG5cdFx0XHRcdFx0bmV4dCgpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aWYgKGMgPT09ICd7Jykge1xyXG5cdFx0XHRcdFx0biA9IHBhcnNlSW50KG4sIDEwKSArIDE7XHJcblxyXG5cdFx0XHRcdFx0aWYgKG4gPCBhcmdDb3VudCkge1xyXG5cdFx0XHRcdFx0XHRzdHJpbmcgPSBzdHJpbmcuc3Vic3RyaW5nKDAsIGkpICsgYXJnc1tuXSArIHN0cmluZy5zdWJzdHJpbmcoayk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHN0cmluZztcclxuXHR9XHJcblxyXG5cdC8vIFNQTEFTSF9TQ1JFRU5fQ09NUExFVEVcclxuXHQvLyBDSE9JQ0VcclxuXHQvLyBDTEVBUl9MSU5FXHJcblx0ZnVuY3Rpb24gbWFrZVNjcmVlbk1hbmFnZXIocGFyZW50LCBpbnB1dE1hbmFnZXIpIHtcclxuXHRcdHZhciBtYW5hZ2VyID0gbWFrZUV2ZW50RGlzcGF0Y2hlcigpLFxyXG5cdFx0XHRjdXJyZW50U2NyZWVuID0gbnVsbCxcclxuXHRcdFx0Y3VycmVudE1vZGFsID0gbnVsbCxcclxuXHRcdFx0dHJhbnNpdGlvbiA9ICdub25lJyxcclxuXHRcdFx0JGRpc3BsYXkgPSAkKCc8ZGl2IGlkPVwic2NyZWVuLW1hbmFnZXJcIj48L2Rpdj4nKSxcclxuXHRcdFx0YXBwbHlFZmZlY3QgPSBmdW5jdGlvbiAoJG9sZCwgJG5ldywgb25jb21wbGV0ZSkge1xyXG5cdFx0XHRcdGlmICh0eXBlb2YgJG5ldyA9PT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0b25jb21wbGV0ZSA9ICRuZXc7XHJcblx0XHRcdFx0XHQkbmV3ID0gbnVsbDtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHN3aXRjaCAodHJhbnNpdGlvbikge1xyXG5cdFx0XHRcdGNhc2UgJ2ZhZGUnOlxyXG5cdFx0XHRcdFx0aWYgKCRvbGQpIHtcclxuXHRcdFx0XHRcdFx0JG9sZC5mYWRlT3V0KCdmYXN0JywgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRcdCRvbGQucmVtb3ZlKCk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmICgkbmV3KSB7XHJcblx0XHRcdFx0XHRcdFx0XHQkZGlzcGxheS5hcHBlbmQoJG5ldyk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0JG5ldy5mYWRlSW4oJ2Zhc3QnLCBvbmNvbXBsZXRlKTtcclxuXHRcdFx0XHRcdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBvbmNvbXBsZXRlID09PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRvbmNvbXBsZXRlKCk7XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdGlmICgkbmV3KSB7XHJcblx0XHRcdFx0XHRcdFx0JG5ldy5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xyXG5cdFx0XHRcdFx0XHRcdCRkaXNwbGF5LmFwcGVuZCgkbmV3KTtcclxuXHJcblx0XHRcdFx0XHRcdFx0JG5ldy5mYWRlSW4oJ2Zhc3QnLCBvbmNvbXBsZXRlKTtcclxuXHRcdFx0XHRcdFx0fSBlbHNlIGlmICh0eXBlb2Ygb25jb21wbGV0ZSA9PT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRcdG9uY29tcGxldGUoKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0ZGVmYXVsdDpcclxuXHRcdFx0XHRcdGlmICgkb2xkKSB7XHJcblx0XHRcdFx0XHRcdCRvbGQucmVtb3ZlKCk7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0aWYgKCRuZXcpIHtcclxuXHRcdFx0XHRcdFx0JGRpc3BsYXkuYXBwZW5kKCRuZXcpO1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGlmICh0eXBlb2Ygb25jb21wbGV0ZSA9PT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdFx0XHRvbmNvbXBsZXRlKCk7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRtYWtlU2NyZWVuQ29udGFpbmVyID0gZnVuY3Rpb24gKGlkLCB0aXRsZSkge1xyXG5cdFx0XHRcdHRpdGxlID0gdGl0bGUgPyB0aXRsZSA6IGlkLnJlcGxhY2UoL18vZywgJyAnKS50b1VwcGVyQ2FzZSgpO1xyXG5cdFx0XHRcdHZhciBtYXJrdXAgPSBmb3JtYXQoJzxkaXYgY2xhc3M9XCJzY3JlZW5cIiBpZD1cInswfVwiPjxzdHJvbmcgY2xhc3M9XCJ0aXRsZVwiPnsxfTwvc3Ryb25nPjxkaXYgY2xhc3M9XCJwYW5lXCI+PGRpdiBjbGFzcz1cImNvbnRlbnRcIj48L2Rpdj48L2Rpdj48L2Rpdj4nLCBpZCwgdGl0bGUpO1xyXG5cclxuXHRcdFx0XHRyZXR1cm4gJChtYXJrdXApO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRzY3JlZW5zID0ge1xyXG5cdFx0XHRcdC8vIFNwbGFzaCBzY3JlZW4gd2lsbCBkaXNwYXRjaCBhICdTUExBU0hfQ09NUExFVEUnIGV2ZW50IGFmdGVyIDMgc2Vjb25kcy5cclxuXHRcdFx0XHRzcGxhc2g6IGZ1bmN0aW9uIChzY3JlZW5NYW5hZ2VyLCBkYXRhKSB7XHJcblx0XHRcdFx0XHR2YXIgJGRpc3BsYXkgPSBtYWtlU2NyZWVuQ29udGFpbmVyKCdzcGxhc2gnKSxcclxuXHRcdFx0XHRcdFx0JGNvbnRlbnQgPSAkKCcuY29udGVudCcsICRkaXNwbGF5KSxcclxuXHRcdFx0XHRcdFx0ZWxhcHNlZCA9IDAsXHJcblx0XHRcdFx0XHRcdGR1cmF0aW9uID0gMyxcclxuXHRcdFx0XHRcdFx0aWQ7XHJcblxyXG5cdFx0XHRcdFx0JGNvbnRlbnQuYXBwZW5kKCc8aDE+U2ltcGxlIFRldHJpczwvaDE+Jyk7XHJcblx0XHRcdFx0XHQkY29udGVudC5hcHBlbmQoJzxzcGFuPjM8L3NwYW4+Jyk7XHJcblxyXG5cdFx0XHRcdFx0aWQgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdGVsYXBzZWQgKz0gMTtcclxuXHJcblx0XHRcdFx0XHRcdCQoJ3NwYW4nLCAkY29udGVudCkudGV4dChkdXJhdGlvbiAtIGVsYXBzZWQpO1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKGVsYXBzZWQgPT09IGR1cmF0aW9uKSB7XHJcblx0XHRcdFx0XHRcdFx0Y2xlYXJUaW1lb3V0KGlkKTtcclxuXHRcdFx0XHRcdFx0XHRzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0XHRcdHNjcmVlbk1hbmFnZXIuZGlzcGF0Y2hFdmVudCh7dHlwZTogJ1NQTEFTSF9DT01QTEVURSd9KTtcclxuXHRcdFx0XHRcdFx0XHR9LCA1MDApO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9LCAxMDAwKTtcclxuXHJcblx0XHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0XHRpZDogJ3NwbGFzaCcsXHJcblx0XHRcdFx0XHRcdGRpc3BsYXk6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gJGRpc3BsYXk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH07XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHQvLyBUaXRsZSBzY3JlZW4gd2lsbCBzaG93IHRoZSBnYW1lJ3MgbWVudSBvcHRpb25zLlxyXG5cdFx0XHRcdHRpdGxlOiBmdW5jdGlvbiAoc2NyZWVuTWFuYWdlciwgZGF0YSkge1xyXG5cdFx0XHRcdFx0dmFyICRkaXNwbGF5ID0gbWFrZVNjcmVlbkNvbnRhaW5lcigndGl0bGUnKSxcclxuXHRcdFx0XHRcdFx0JGNvbnRlbnQgPSAkKCcuY29udGVudCcsICRkaXNwbGF5KTtcclxuXHJcblx0XHRcdFx0XHQkY29udGVudC5hcHBlbmQoJzxoMT5TaW1wbGUgVGV0cmlzPC9oMT48dWw+PGxpPjxhIGhyZWY9XCIjUExBWV9HQU1FXCI+UGxheSBHYW1lPC9hPjwvbGk+PGxpPjxhIGhyZWY9XCIjT1BUSU9OU1wiPk9wdGlvbnM8L2E+PC9saT48L3VsPicpO1xyXG5cclxuXHRcdFx0XHRcdCQoJ2EnLCAkY29udGVudCkuY2xpY2soZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHR2YXIgY2hvaWNlID0gJCh0aGlzKS5hdHRyKCdocmVmJykuc3Vic3RyaW5nKDEpO1xyXG5cdFx0XHRcdFx0XHRzY3JlZW5NYW5hZ2VyLmRpc3BhdGNoRXZlbnQoe3R5cGU6ICdDSE9JQ0UnLCBjaG9pY2U6IGNob2ljZX0pO1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0XHRpZDogJ3RpdGxlJyxcclxuXHRcdFx0XHRcdFx0ZGlzcGxheTogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybiAkZGlzcGxheTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fTtcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdG9wdGlvbnM6IGZ1bmN0aW9uIChzY3JlZW5NYW5hZ2VyLCBvcmlnaW5hbE9wdGlvbnMpIHtcclxuXHRcdFx0XHRcdHZhciAkZGlzcGxheSA9IG1ha2VTY3JlZW5Db250YWluZXIoJ29wdGlvbnMnKSxcclxuXHRcdFx0XHRcdFx0JGNvbnRlbnQgPSAkKCcuY29udGVudCcsICRkaXNwbGF5KTtcclxuXHJcblx0XHRcdFx0XHQkY29udGVudC5hcHBlbmQoJzx1bD48bGk+T3B0aW9uIDE8L2xpPjxsaT5PcHRpb24gMjwvbGk+PGxpPk9wdGlvbiAzPC9saT48L3VsPjxwPjxoci8+PGJ1dHRvbj5DYW5jZWw8L2J1dHRvbj48YnV0dG9uPlNhdmU8L2J1dHRvbj48L3A+Jyk7XHJcblxyXG5cdFx0XHRcdFx0JCgnYnV0dG9uJywgJGNvbnRlbnQpLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0dmFyIGxhYmVsID0gJCh0aGlzKS50ZXh0KCk7XHJcblxyXG5cdFx0XHRcdFx0XHRzd2l0Y2ggKGxhYmVsKSB7XHJcblx0XHRcdFx0XHRcdGNhc2UgJ0NhbmNlbCc6XHJcblx0XHRcdFx0XHRcdFx0c2NyZWVuTWFuYWdlci5kaXNwYXRjaEV2ZW50KHt0eXBlOiAnT1BUSU9OU19TQVZFJywgb3B0aW9uczogb3JpZ2luYWxPcHRpb25zfSk7XHJcblx0XHRcdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0XHRcdGNhc2UgJ1NhdmUnOlxyXG5cdFx0XHRcdFx0XHRcdHNjcmVlbk1hbmFnZXIuZGlzcGF0Y2hFdmVudCh7dHlwZTogJ09QVElPTlNfU0FWRScsIG9wdGlvbnM6IHt9fSk7XHJcblx0XHRcdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdHJldHVybiBmYWxzZTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0XHRcdGlkOiAnb3B0aW9ucycsXHJcblx0XHRcdFx0XHRcdGRpc3BsYXk6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gJGRpc3BsYXk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH07XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRsb2FkaW5nOiBmdW5jdGlvbiAoc2NyZWVuTWFuYWdlciwgZGF0YSkge1xyXG5cdFx0XHRcdFx0dmFyICRkaXNwbGF5ID0gbWFrZVNjcmVlbkNvbnRhaW5lcignbG9hZGluZycsICdMT0FESU5HIExFVkVMICcgKyBkYXRhLmxldmVsKSxcclxuXHRcdFx0XHRcdFx0JGNvbnRlbnQgPSAkKCcuY29udGVudCcsICRkaXNwbGF5KTtcclxuXHJcblx0XHRcdFx0XHQkY29udGVudC50ZXh0KCcwICUnKTtcclxuXHJcblx0XHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0XHRpZDogJ2xvYWRpbmcnLFxyXG5cdFx0XHRcdFx0XHRkaXNwbGF5OiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuICRkaXNwbGF5O1xyXG5cdFx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0XHRyZWNpZXZlOiBmdW5jdGlvbiAobWVzc2FnZU5hbWUsIGRhdGEpIHtcclxuXHRcdFx0XHRcdFx0XHQkY29udGVudC50ZXh0KHBhcnNlSW50KGRhdGEucHJvZ3Jlc3MgKiAxMDAsIDEwKSArICclJyk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH07XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRnYW1lOiBmdW5jdGlvbiAoc2NyZWVuTWFuYWdlciwgZGF0YSkge1xyXG5cdFx0XHRcdFx0dmFyICRkaXNwbGF5ID0gbWFrZVNjcmVlbkNvbnRhaW5lcignZ2FtZScpLFxyXG5cdFx0XHRcdFx0XHQkY29udGVudCA9ICQoJy5jb250ZW50JywgJGRpc3BsYXkpLFxyXG5cdFx0XHRcdFx0XHRzY29yZSA9IGRhdGEuc2NvcmU7XHJcblxyXG5cdFx0XHRcdFx0JGNvbnRlbnQuYXBwZW5kKCc8ZGl2IGlkPVwic2NvcmVcIj4wMDAwPC9kaXY+PGRpdiBpZD1cImdhbWUtYm9hcmRcIj48L2Rpdj48YnV0dG9uPkNsZWFyIExpbmU8L2J1dHRvbj4nKTtcclxuXHJcblx0XHRcdFx0XHQkKCdidXR0b24nLCAkY29udGVudCkuY2xpY2soZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRzY29yZSArPSA1MDA7XHJcblx0XHRcdFx0XHRcdHVwZGF0ZVNjb3JlKCk7XHJcblx0XHRcdFx0XHRcdHNjcmVlbk1hbmFnZXIuZGlzcGF0Y2hFdmVudCh7dHlwZTogJ0NMRUFSX0xJTkUnLCBzY29yZTogc2NvcmV9KTtcclxuXHRcdFx0XHRcdH0pO1xyXG5cclxuXHRcdFx0XHRcdGZ1bmN0aW9uIHVwZGF0ZVNjb3JlKCkge1xyXG5cdFx0XHRcdFx0XHQkKCcjc2NvcmUnLCAkY29udGVudCkudGV4dChzY29yZSk7XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0dXBkYXRlU2NvcmUoKTtcclxuXHJcblx0XHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0XHRpZDogJ2dhbWUnLFxyXG5cdFx0XHRcdFx0XHRkaXNwbGF5OiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuICRkaXNwbGF5O1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdH0sXHJcblx0XHRcdFx0cGF1c2U6IGZ1bmN0aW9uIChzY3JlZW5NYW5hZ2VyLCBkYXRhKSB7XHJcblx0XHRcdFx0XHR2YXIgJGRpc3BsYXkgPSBtYWtlU2NyZWVuQ29udGFpbmVyKCdwYXVzZScpLFxyXG5cdFx0XHRcdFx0XHQkY29udGVudCA9ICQoJy5jb250ZW50JywgJGRpc3BsYXkpO1xyXG5cclxuXHRcdFx0XHRcdCRjb250ZW50LmFwcGVuZCgnPGgzPkdhbWUgUGF1c2VkPC9oMz48dWw+PGxpPjxhIGhyZWY9XCIjUkVTVU1FXCI+UmVzdW1lPC9hPjwvbGk+PGxpPjxhIGhyZWY9XCIjUVVJVFwiPlF1aXQ8L2E+PC9saT48L3VsPicpO1xyXG5cclxuXHRcdFx0XHRcdCQoJ2EnLCAkY29udGVudCkuY2xpY2soZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHR2YXIgY2hvaWNlID0gJCh0aGlzKS5hdHRyKCdocmVmJykuc3Vic3RyaW5nKDEpO1xyXG5cdFx0XHRcdFx0XHRzY3JlZW5NYW5hZ2VyLmRpc3BhdGNoRXZlbnQoe3R5cGU6ICdDSE9JQ0UnLCBjaG9pY2U6IGNob2ljZX0pO1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XHJcblx0XHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0XHRpZDogJ3BhdXNlJyxcclxuXHRcdFx0XHRcdFx0ZGlzcGxheTogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybiAkZGlzcGxheTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fTtcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdGxldmVsX2NvbXBsZXRlOiBmdW5jdGlvbiAoc2NyZWVuTWFuYWdlciwgZGF0YSkge1xyXG5cdFx0XHRcdFx0dmFyICRkaXNwbGF5ID0gbWFrZVNjcmVlbkNvbnRhaW5lcignbGV2ZWxfY29tcGxldGUnKSxcclxuXHRcdFx0XHRcdFx0JGNvbnRlbnQgPSAkKCcuY29udGVudCcsICRkaXNwbGF5KTtcclxuXHJcblx0XHRcdFx0XHQkY29udGVudC5hcHBlbmQoZm9ybWF0KCc8aDM+Q29uZ3JhdHVsYXRpb25zITwvaDM+PHA+WW91IENvbXBsZXRlZCBMZXZlbCB7MH08L3A+JywgZGF0YS5sZXZlbCkpO1xyXG5cdFx0XHRcdFx0JGNvbnRlbnQuYXBwZW5kKCc8cD4tUFJFU1MgU1BBQ0UgQkFSLTwvcD4nKTtcclxuXHJcblx0XHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0XHRpZDogJ2xldmVsX2NvbXBsZXRlJyxcclxuXHRcdFx0XHRcdFx0ZGlzcGxheTogZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0XHRcdHJldHVybiAkZGlzcGxheTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fTtcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHRcdGdhbWVfY29tcGxldGU6IGZ1bmN0aW9uIChzY3JlZW5NYW5hZ2VyLCBkYXRhKSB7XHJcblx0XHRcdFx0XHR2YXIgJGRpc3BsYXkgPSBtYWtlU2NyZWVuQ29udGFpbmVyKCdnYW1lX2NvbXBsZXRlJyksXHJcblx0XHRcdFx0XHRcdCRjb250ZW50ID0gJCgnLmNvbnRlbnQnLCAkZGlzcGxheSk7XHJcblxyXG5cdFx0XHRcdFx0JGNvbnRlbnQuYXBwZW5kKGZvcm1hdCgnPGgzPkNvbmdyYXR1bGF0aW9ucyE8L2gzPjxwPllvdSBCZWF0IFRoZSBHYW1lITwvcD4nLCBkYXRhLmxldmVsKSk7XHJcblx0XHRcdFx0XHQkY29udGVudC5hcHBlbmQoJzxwPi1QUkVTUyBTUEFDRSBCQVItPC9wPicpO1xyXG5cclxuXHRcdFx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0XHRcdGlkOiAnZ2FtZV9jb21wbGV0ZScsXHJcblx0XHRcdFx0XHRcdGRpc3BsYXk6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gJGRpc3BsYXk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH07XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRjcmVkaXRzOiBmdW5jdGlvbiAoc2NyZWVuTWFuYWdlciwgZGF0YSkge1xyXG5cdFx0XHRcdFx0dmFyICRkaXNwbGF5ID0gbWFrZVNjcmVlbkNvbnRhaW5lcignY3JlZGl0cycpLFxyXG5cdFx0XHRcdFx0XHQkY29udGVudCA9ICQoJy5jb250ZW50JywgJGRpc3BsYXkpO1xyXG5cclxuXHRcdFx0XHRcdCRjb250ZW50LmFwcGVuZCgnPHA+PHN0cm9uZz5Qcm9kdWNlcjwvc3Ryb25nPiBTb21lIEd1eTwvcD4nKTtcclxuXHRcdFx0XHRcdCRjb250ZW50LmFwcGVuZCgnPHA+PHN0cm9uZz5EZXZlbG9wZXI8L3N0cm9uZz4gRGFycmVuIFNjaG5hcmU8L3A+Jyk7XHJcblx0XHRcdFx0XHQkY29udGVudC5hcHBlbmQoJzxwPjxzdHJvbmc+QXJ0aXN0PC9zdHJvbmc+IFNvbWUgR2lybDwvcD4nKTtcclxuXHRcdFx0XHRcdCRjb250ZW50LmFwcGVuZCgnPHA+PHN0cm9uZz5NYXJrZXRpbmc8L3N0cm9uZz4gU29tZSBHdXk8L3A+Jyk7XHJcblxyXG5cdFx0XHRcdFx0JGNvbnRlbnQuYXBwZW5kKCc8cD4tUFJFU1MgU1BBQ0UgQkFSLTwvcD4nKTtcclxuXHJcblx0XHRcdFx0XHRyZXR1cm4ge1xyXG5cdFx0XHRcdFx0XHRpZDogJ2NyZWRpdHMnLFxyXG5cdFx0XHRcdFx0XHRkaXNwbGF5OiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuICRkaXNwbGF5O1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9O1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fTtcclxuXHJcblx0XHRtYW5hZ2VyLmNsZWFyQ29sb3VyID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcblx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoKSB7XHJcblx0XHRcdFx0JGRpc3BsYXkuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgdmFsdWUpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gJGRpc3BsYXkuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJyk7XHJcblx0XHR9O1xyXG5cdFx0bWFuYWdlci50cmFuc2l0aW9uID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcblx0XHRcdGlmIChhcmd1bWVudHMubGVuZ3RoKSB7XHJcblx0XHRcdFx0dHJhbnNpdGlvbiA9IHZhbHVlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gdHJhbnNpdGlvbjtcclxuXHRcdH07XHJcblx0XHRtYW5hZ2VyLnNob3cgPSBmdW5jdGlvbiAoc2NyZWVuSWQsIGRhdGEpIHtcclxuXHRcdFx0dmFyIG5ld1NjcmVlbjtcclxuXHJcblx0XHRcdGlmIChjdXJyZW50U2NyZWVuICYmIHNjcmVlbklkID09PSBjdXJyZW50U2NyZWVuLmlkKSB7XHJcblx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRuZXdTY3JlZW4gPSBzY3JlZW5zW3NjcmVlbklkXSA/IHNjcmVlbnNbc2NyZWVuSWRdKHRoaXMsIGRhdGEpIDogbnVsbDtcclxuXHJcblx0XHRcdGlmIChuZXdTY3JlZW4pIHtcclxuXHJcblx0XHRcdFx0aWYgKGN1cnJlbnRNb2RhbCkge1xyXG5cdFx0XHRcdFx0dGhpcy5oaWRlTW9kYWwoKTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGlmIChjdXJyZW50U2NyZWVuICE9PSBuZXdTY3JlZW4pIHtcclxuXHRcdFx0XHRcdGlmIChjdXJyZW50U2NyZWVuKSB7XHJcblx0XHRcdFx0XHRcdGFwcGx5RWZmZWN0KGN1cnJlbnRTY3JlZW4uZGlzcGxheSgpLCBuZXdTY3JlZW4uZGlzcGxheSgpKTtcclxuXHRcdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRcdGFwcGx5RWZmZWN0KG51bGwsIG5ld1NjcmVlbi5kaXNwbGF5KCkpO1xyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdGN1cnJlbnRTY3JlZW4gPSBuZXdTY3JlZW47XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cdFx0bWFuYWdlci5zaG93TW9kYWwgPSBmdW5jdGlvbiAobW9kYWxJZCwgZGF0YSkge1xyXG5cdFx0XHQvLyBDYW4gb25seSBzaG93IGEgc2luZ2xlIG1vZGFsIGF0IGEgdGltZS5cclxuXHRcdFx0aWYgKCFjdXJyZW50TW9kYWwpIHtcclxuXHRcdFx0XHR2YXIgbmV3U2NyZWVuID0gc2NyZWVuc1ttb2RhbElkXSA/IHNjcmVlbnNbbW9kYWxJZF0odGhpcywgZGF0YSkgOiBudWxsLFxyXG5cdFx0XHRcdFx0JG1vZGFsID0gJCgnPGRpdiBjbGFzcz1cInNjcmVlbiBtb2RhbFwiPjxkaXYgY2xhc3M9XCJwYW5lXCI+PGRpdiBjbGFzcz1cImNvbnRlbnRcIj48L2Rpdj48L2Rpdj48L2Rpdj4nKTtcclxuXHJcblx0XHRcdFx0JCgnLmNvbnRlbnQnLCAkbW9kYWwpLmFwcGVuZChuZXdTY3JlZW4uZGlzcGxheSgpKTtcclxuXHRcdFx0XHRhcHBseUVmZmVjdChudWxsLCAkbW9kYWwpO1xyXG5cclxuXHRcdFx0XHRjdXJyZW50TW9kYWwgPSB7XHJcblx0XHRcdFx0XHRyZWNpZXZlOiBmdW5jdGlvbiAobWVzc2FnZU5hbWUsIGRhdGEpIHtcclxuXHRcdFx0XHRcdFx0aWYgKHR5cGVvZiBuZXdTY3JlZW4ucmVjaWV2ZSkge1xyXG5cdFx0XHRcdFx0XHRcdG5ld1NjcmVlbi5yZWNpZXZlKG1lc3NhZ2VOYW1lLCBkYXRhKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdGRpc3BsYXk6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuICRtb2RhbDtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9O1xyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cdFx0bWFuYWdlci5oaWRlTW9kYWwgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGlmIChjdXJyZW50TW9kYWwpIHtcclxuXHRcdFx0XHRhcHBseUVmZmVjdChjdXJyZW50TW9kYWwuZGlzcGxheSgpKTtcclxuXHRcdFx0XHRjdXJyZW50TW9kYWwgPSBudWxsO1xyXG5cdFx0XHR9XHJcblx0XHR9O1xyXG5cdFx0bWFuYWdlci5zZW5kID0gZnVuY3Rpb24gKG1lc3NhZ2VOYW1lLCBkYXRhKSB7XHJcblx0XHRcdGlmIChjdXJyZW50TW9kYWwgJiYgdHlwZW9mIGN1cnJlbnRNb2RhbC5yZWNpZXZlID09PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0Y3VycmVudE1vZGFsLnJlY2lldmUobWVzc2FnZU5hbWUsIGRhdGEpO1xyXG5cdFx0XHR9IGVsc2UgaWYgKGN1cnJlbnRTY3JlZW4gJiYgdHlwZW9mIGN1cnJlbnRTY3JlZW4ucmVjaWV2ZSA9PT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRcdGN1cnJlbnRTY3JlZW4ucmVjaWV2ZShtZXNzYWdlTmFtZSwgZGF0YSk7XHJcblx0XHRcdH1cclxuXHRcdH07XHJcblxyXG5cdFx0JGRpc3BsYXkuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgJyNmZmZmZmYnKTtcclxuXHRcdCQocGFyZW50KS5hcHBlbmQoJGRpc3BsYXkpO1xyXG5cclxuXHRcdHJldHVybiBtYW5hZ2VyO1xyXG5cdH1cclxuXHJcblx0cmV0dXJuIHtcclxuXHRcdG1ha2VMb2FkZXI6IG1ha2VMb2FkZXIsXHJcblx0XHRtYWtlSW5wdXRNYW5hZ2VyOiBtYWtlSW5wdXRNYW5hZ2VyLFxyXG5cdFx0bWFrZVNjcmVlbk1hbmFnZXI6IG1ha2VTY3JlZW5NYW5hZ2VyXHJcblx0fTtcclxufSgpKTtcbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwibmdwbWNRXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvbW9jay1vYmplY3RzLmpzXCIsXCIvXCIpIiwiKGZ1bmN0aW9uIChwcm9jZXNzLGdsb2JhbCxCdWZmZXIsX19hcmd1bWVudDAsX19hcmd1bWVudDEsX19hcmd1bWVudDIsX19hcmd1bWVudDMsX19maWxlbmFtZSxfX2Rpcm5hbWUpe1xuJ3VzZSBzdHJpY3QnO1xudmFyIGNrLCBjcmVhdGUsIG1peGluLFxuICBfX3NsaWNlID0gW10uc2xpY2UsXG4gIF9faGFzUHJvcCA9IHt9Lmhhc093blByb3BlcnR5O1xuXG5jcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IGZ1bmN0aW9uKG8pIHtcbiAgdmFyIEY7XG4gIEYgPSAoZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gRigpIHtcbiAgICAgIHRoaXMuY29uc3RydWN0b3IgPSBGO1xuICAgIH1cblxuICAgIHJldHVybiBGO1xuXG4gIH0pKCk7XG4gIEYucHJvdG90eXBlID0gbztcbiAgcmV0dXJuIG5ldyBGO1xufTtcblxubWl4aW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGRlc3QsIGssIG9iaiwgb2JqcywgdiwgX2ksIF9sZW47XG4gIGRlc3QgPSBhcmd1bWVudHNbMF0sIG9ianMgPSAyIDw9IGFyZ3VtZW50cy5sZW5ndGggPyBfX3NsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSA6IFtdO1xuICBmb3IgKF9pID0gMCwgX2xlbiA9IG9ianMubGVuZ3RoOyBfaSA8IF9sZW47IF9pKyspIHtcbiAgICBvYmogPSBvYmpzW19pXTtcbiAgICBmb3IgKGsgaW4gb2JqKSB7XG4gICAgICBpZiAoIV9faGFzUHJvcC5jYWxsKG9iaiwgaykpIGNvbnRpbnVlO1xuICAgICAgdiA9IG9ialtrXTtcbiAgICAgIGRlc3Rba10gPSB2O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVzdDtcbn07XG5cbmNrID0gZnVuY3Rpb24oY29uc3RydWN0b3IsIHByb3RvdHlwZVByb3BlcnRpZXMsIHByb3RvdHlwZUNoYWluKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgcHJvdG90eXBlUHJvcGVydGllcyA9IHt9O1xuICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICBwcm90b3R5cGVDaGFpbiA9IHByb3RvdHlwZVByb3BlcnRpZXM7XG4gICAgcHJvdG90eXBlUHJvcGVydGllcyA9IHt9O1xuICB9XG4gIHByb3RvdHlwZVByb3BlcnRpZXMgPSBwcm90b3R5cGVQcm9wZXJ0aWVzIHx8IHt9O1xuICBpZiAodHlwZW9mIHByb3RvdHlwZUNoYWluID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc3RydWN0b3IucHJvdG90eXBlID0gY3JlYXRlKHByb3RvdHlwZUNoYWluLnByb3RvdHlwZSk7XG4gICAgbWl4aW4oY29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b3R5cGVQcm9wZXJ0aWVzKTtcbiAgfSBlbHNlIGlmIChwcm90b3R5cGVDaGFpbikge1xuICAgIGNvbnN0cnVjdG9yLnByb3RvdHlwZSA9IGNyZWF0ZShwcm90b3R5cGVDaGFpbik7XG4gICAgbWl4aW4oY29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b3R5cGVQcm9wZXJ0aWVzKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdHJ1Y3Rvci5wcm90b3R5cGUgPSBtaXhpbih7fSwgcHJvdG90eXBlUHJvcGVydGllcyk7XG4gIH1cbiAgY29uc3RydWN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY29uc3RydWN0b3I7XG4gIHJldHVybiBjb25zdHJ1Y3Rvcjtcbn07XG5cbmNrLmNyZWF0ZSA9IGNyZWF0ZTtcblxuY2subWl4aW4gPSBtaXhpbjtcblxuY2suY2sgPSBjaztcblxuY2suY29uc3RydWN0b3JLaXQgPSBjaztcblxubW9kdWxlLmV4cG9ydHMgPSBjaztcblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJuZ3BtY1FcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLlxcXFwuLlxcXFxub2RlX21vZHVsZXNcXFxcY29uc3RydWN0b3Ita2l0XFxcXGNvbnN0cnVjdG9yLWtpdC5qc1wiLFwiLy4uXFxcXC4uXFxcXG5vZGVfbW9kdWxlc1xcXFxjb25zdHJ1Y3Rvci1raXRcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4vKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxudmFyIGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFUyA9IDUwXG5CdWZmZXIucG9vbFNpemUgPSA4MTkyXG5cbi8qKlxuICogSWYgYEJ1ZmZlci5fdXNlVHlwZWRBcnJheXNgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgVXNlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiAoY29tcGF0aWJsZSBkb3duIHRvIElFNilcbiAqL1xuQnVmZmVyLl91c2VUeXBlZEFycmF5cyA9IChmdW5jdGlvbiAoKSB7XG4gIC8vIERldGVjdCBpZiBicm93c2VyIHN1cHBvcnRzIFR5cGVkIEFycmF5cy4gU3VwcG9ydGVkIGJyb3dzZXJzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssXG4gIC8vIENocm9tZSA3KywgU2FmYXJpIDUuMSssIE9wZXJhIDExLjYrLCBpT1MgNC4yKy4gSWYgdGhlIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCBhZGRpbmdcbiAgLy8gcHJvcGVydGllcyB0byBgVWludDhBcnJheWAgaW5zdGFuY2VzLCB0aGVuIHRoYXQncyB0aGUgc2FtZSBhcyBubyBgVWludDhBcnJheWAgc3VwcG9ydFxuICAvLyBiZWNhdXNlIHdlIG5lZWQgdG8gYmUgYWJsZSB0byBhZGQgYWxsIHRoZSBub2RlIEJ1ZmZlciBBUEkgbWV0aG9kcy4gVGhpcyBpcyBhbiBpc3N1ZVxuICAvLyBpbiBGaXJlZm94IDQtMjkuIE5vdyBmaXhlZDogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4XG4gIHRyeSB7XG4gICAgdmFyIGJ1ZiA9IG5ldyBBcnJheUJ1ZmZlcigwKVxuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheShidWYpXG4gICAgYXJyLmZvbyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH1cbiAgICByZXR1cm4gNDIgPT09IGFyci5mb28oKSAmJlxuICAgICAgICB0eXBlb2YgYXJyLnN1YmFycmF5ID09PSAnZnVuY3Rpb24nIC8vIENocm9tZSA5LTEwIGxhY2sgYHN1YmFycmF5YFxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn0pKClcblxuLyoqXG4gKiBDbGFzczogQnVmZmVyXG4gKiA9PT09PT09PT09PT09XG4gKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBhcmUgYXVnbWVudGVkXG4gKiB3aXRoIGZ1bmN0aW9uIHByb3BlcnRpZXMgZm9yIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBBUEkgZnVuY3Rpb25zLiBXZSB1c2VcbiAqIGBVaW50OEFycmF5YCBzbyB0aGF0IHNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0IHJldHVybnNcbiAqIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIEJ5IGF1Z21lbnRpbmcgdGhlIGluc3RhbmNlcywgd2UgY2FuIGF2b2lkIG1vZGlmeWluZyB0aGUgYFVpbnQ4QXJyYXlgXG4gKiBwcm90b3R5cGUuXG4gKi9cbmZ1bmN0aW9uIEJ1ZmZlciAoc3ViamVjdCwgZW5jb2RpbmcsIG5vWmVybykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQnVmZmVyKSlcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihzdWJqZWN0LCBlbmNvZGluZywgbm9aZXJvKVxuXG4gIHZhciB0eXBlID0gdHlwZW9mIHN1YmplY3RcblxuICAvLyBXb3JrYXJvdW5kOiBub2RlJ3MgYmFzZTY0IGltcGxlbWVudGF0aW9uIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBzdHJpbmdzXG4gIC8vIHdoaWxlIGJhc2U2NC1qcyBkb2VzIG5vdC5cbiAgaWYgKGVuY29kaW5nID09PSAnYmFzZTY0JyAmJiB0eXBlID09PSAnc3RyaW5nJykge1xuICAgIHN1YmplY3QgPSBzdHJpbmd0cmltKHN1YmplY3QpXG4gICAgd2hpbGUgKHN1YmplY3QubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgICAgc3ViamVjdCA9IHN1YmplY3QgKyAnPSdcbiAgICB9XG4gIH1cblxuICAvLyBGaW5kIHRoZSBsZW5ndGhcbiAgdmFyIGxlbmd0aFxuICBpZiAodHlwZSA9PT0gJ251bWJlcicpXG4gICAgbGVuZ3RoID0gY29lcmNlKHN1YmplY3QpXG4gIGVsc2UgaWYgKHR5cGUgPT09ICdzdHJpbmcnKVxuICAgIGxlbmd0aCA9IEJ1ZmZlci5ieXRlTGVuZ3RoKHN1YmplY3QsIGVuY29kaW5nKVxuICBlbHNlIGlmICh0eXBlID09PSAnb2JqZWN0JylcbiAgICBsZW5ndGggPSBjb2VyY2Uoc3ViamVjdC5sZW5ndGgpIC8vIGFzc3VtZSB0aGF0IG9iamVjdCBpcyBhcnJheS1saWtlXG4gIGVsc2VcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZpcnN0IGFyZ3VtZW50IG5lZWRzIHRvIGJlIGEgbnVtYmVyLCBhcnJheSBvciBzdHJpbmcuJylcblxuICB2YXIgYnVmXG4gIGlmIChCdWZmZXIuX3VzZVR5cGVkQXJyYXlzKSB7XG4gICAgLy8gUHJlZmVycmVkOiBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIGJ1ZiA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShsZW5ndGgpKVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gVEhJUyBpbnN0YW5jZSBvZiBCdWZmZXIgKGNyZWF0ZWQgYnkgYG5ld2ApXG4gICAgYnVmID0gdGhpc1xuICAgIGJ1Zi5sZW5ndGggPSBsZW5ndGhcbiAgICBidWYuX2lzQnVmZmVyID0gdHJ1ZVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMgJiYgdHlwZW9mIHN1YmplY3QuYnl0ZUxlbmd0aCA9PT0gJ251bWJlcicpIHtcbiAgICAvLyBTcGVlZCBvcHRpbWl6YXRpb24gLS0gdXNlIHNldCBpZiB3ZSdyZSBjb3B5aW5nIGZyb20gYSB0eXBlZCBhcnJheVxuICAgIGJ1Zi5fc2V0KHN1YmplY3QpXG4gIH0gZWxzZSBpZiAoaXNBcnJheWlzaChzdWJqZWN0KSkge1xuICAgIC8vIFRyZWF0IGFycmF5LWlzaCBvYmplY3RzIGFzIGEgYnl0ZSBhcnJheVxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdWJqZWN0KSlcbiAgICAgICAgYnVmW2ldID0gc3ViamVjdC5yZWFkVUludDgoaSlcbiAgICAgIGVsc2VcbiAgICAgICAgYnVmW2ldID0gc3ViamVjdFtpXVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuICAgIGJ1Zi53cml0ZShzdWJqZWN0LCAwLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnbnVtYmVyJyAmJiAhQnVmZmVyLl91c2VUeXBlZEFycmF5cyAmJiAhbm9aZXJvKSB7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBidWZbaV0gPSAwXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ1ZlxufVxuXG4vLyBTVEFUSUMgTUVUSE9EU1xuLy8gPT09PT09PT09PT09PT1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIChiKSB7XG4gIHJldHVybiAhIShiICE9PSBudWxsICYmIGIgIT09IHVuZGVmaW5lZCAmJiBiLl9pc0J1ZmZlcilcbn1cblxuQnVmZmVyLmJ5dGVMZW5ndGggPSBmdW5jdGlvbiAoc3RyLCBlbmNvZGluZykge1xuICB2YXIgcmV0XG4gIHN0ciA9IHN0ciArICcnXG4gIHN3aXRjaCAoZW5jb2RpbmcgfHwgJ3V0ZjgnKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICAgIHJldCA9IHN0ci5sZW5ndGggLyAyXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgIHJldCA9IHV0ZjhUb0J5dGVzKHN0cikubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ3Jhdyc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBiYXNlNjRUb0J5dGVzKHN0cikubGVuZ3RoXG4gICAgICBicmVha1xuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXQgPSBzdHIubGVuZ3RoICogMlxuICAgICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmtub3duIGVuY29kaW5nJylcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiAobGlzdCwgdG90YWxMZW5ndGgpIHtcbiAgYXNzZXJ0KGlzQXJyYXkobGlzdCksICdVc2FnZTogQnVmZmVyLmNvbmNhdChsaXN0LCBbdG90YWxMZW5ndGhdKVxcbicgK1xuICAgICAgJ2xpc3Qgc2hvdWxkIGJlIGFuIEFycmF5LicpXG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoMClcbiAgfSBlbHNlIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiBsaXN0WzBdXG4gIH1cblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHRvdGFsTGVuZ3RoICE9PSAnbnVtYmVyJykge1xuICAgIHRvdGFsTGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB0b3RhbExlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKHRvdGFsTGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBpdGVtID0gbGlzdFtpXVxuICAgIGl0ZW0uY29weShidWYsIHBvcylcbiAgICBwb3MgKz0gaXRlbS5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbi8vIEJVRkZFUiBJTlNUQU5DRSBNRVRIT0RTXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PVxuXG5mdW5jdGlvbiBfaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICAvLyBtdXN0IGJlIGFuIGV2ZW4gbnVtYmVyIG9mIGRpZ2l0c1xuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuICBhc3NlcnQoc3RyTGVuICUgMiA9PT0gMCwgJ0ludmFsaWQgaGV4IHN0cmluZycpXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhciBieXRlID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGFzc2VydCghaXNOYU4oYnl0ZSksICdJbnZhbGlkIGhleCBzdHJpbmcnKVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IGJ5dGVcbiAgfVxuICBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9IGkgKiAyXG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIF91dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPVxuICAgIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiBfYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBjaGFyc1dyaXR0ZW4gPSBCdWZmZXIuX2NoYXJzV3JpdHRlbiA9XG4gICAgYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5mdW5jdGlvbiBfYmluYXJ5V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gX2FzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBfYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPVxuICAgIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxuICByZXR1cm4gY2hhcnNXcml0dGVuXG59XG5cbmZ1bmN0aW9uIF91dGYxNmxlV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICB2YXIgY2hhcnNXcml0dGVuID0gQnVmZmVyLl9jaGFyc1dyaXR0ZW4gPVxuICAgIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbiAgcmV0dXJuIGNoYXJzV3JpdHRlblxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIFN1cHBvcnQgYm90aCAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpXG4gIC8vIGFuZCB0aGUgbGVnYWN5IChzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBpZiAoIWlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIH0gZWxzZSB7ICAvLyBsZWdhY3lcbiAgICB2YXIgc3dhcCA9IGVuY29kaW5nXG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBvZmZzZXQgPSBsZW5ndGhcbiAgICBsZW5ndGggPSBzd2FwXG4gIH1cblxuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG4gIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nIHx8ICd1dGY4JykudG9Mb3dlckNhc2UoKVxuXG4gIHZhciByZXRcbiAgc3dpdGNoIChlbmNvZGluZykge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBfaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gX3V0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgICByZXQgPSBfYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiaW5hcnknOlxuICAgICAgcmV0ID0gX2JpbmFyeVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBfYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IF91dGYxNmxlV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBlbmNvZGluZycpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuXG4gIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nIHx8ICd1dGY4JykudG9Mb3dlckNhc2UoKVxuICBzdGFydCA9IE51bWJlcihzdGFydCkgfHwgMFxuICBlbmQgPSAoZW5kICE9PSB1bmRlZmluZWQpXG4gICAgPyBOdW1iZXIoZW5kKVxuICAgIDogZW5kID0gc2VsZi5sZW5ndGhcblxuICAvLyBGYXN0cGF0aCBlbXB0eSBzdHJpbmdzXG4gIGlmIChlbmQgPT09IHN0YXJ0KVxuICAgIHJldHVybiAnJ1xuXG4gIHZhciByZXRcbiAgc3dpdGNoIChlbmNvZGluZykge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgICByZXQgPSBfaGV4U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgICAgcmV0ID0gX3V0ZjhTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgICByZXQgPSBfYXNjaWlTbGljZShzZWxmLCBzdGFydCwgZW5kKVxuICAgICAgYnJlYWtcbiAgICBjYXNlICdiaW5hcnknOlxuICAgICAgcmV0ID0gX2JpbmFyeVNsaWNlKHNlbGYsIHN0YXJ0LCBlbmQpXG4gICAgICBicmVha1xuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICByZXQgPSBfYmFzZTY0U2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldCA9IF91dGYxNmxlU2xpY2Uoc2VsZiwgc3RhcnQsIGVuZClcbiAgICAgIGJyZWFrXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcignVW5rbm93biBlbmNvZGluZycpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAodGFyZ2V0LCB0YXJnZXRfc3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHNvdXJjZSA9IHRoaXNcblxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAoIXRhcmdldF9zdGFydCkgdGFyZ2V0X3N0YXJ0ID0gMFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHNvdXJjZS5sZW5ndGggPT09IDApIHJldHVyblxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgYXNzZXJ0KGVuZCA+PSBzdGFydCwgJ3NvdXJjZUVuZCA8IHNvdXJjZVN0YXJ0JylcbiAgYXNzZXJ0KHRhcmdldF9zdGFydCA+PSAwICYmIHRhcmdldF9zdGFydCA8IHRhcmdldC5sZW5ndGgsXG4gICAgICAndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIGFzc2VydChzdGFydCA+PSAwICYmIHN0YXJ0IDwgc291cmNlLmxlbmd0aCwgJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBhc3NlcnQoZW5kID49IDAgJiYgZW5kIDw9IHNvdXJjZS5sZW5ndGgsICdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKVxuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0X3N0YXJ0IDwgZW5kIC0gc3RhcnQpXG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldF9zdGFydCArIHN0YXJ0XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG5cbiAgaWYgKGxlbiA8IDEwMCB8fCAhQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICB0YXJnZXRbaSArIHRhcmdldF9zdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgfSBlbHNlIHtcbiAgICB0YXJnZXQuX3NldCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBzdGFydCArIGxlbiksIHRhcmdldF9zdGFydClcbiAgfVxufVxuXG5mdW5jdGlvbiBfYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIF91dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmVzID0gJydcbiAgdmFyIHRtcCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGlmIChidWZbaV0gPD0gMHg3Rikge1xuICAgICAgcmVzICs9IGRlY29kZVV0ZjhDaGFyKHRtcCkgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgICAgIHRtcCA9ICcnXG4gICAgfSBlbHNlIHtcbiAgICAgIHRtcCArPSAnJScgKyBidWZbaV0udG9TdHJpbmcoMTYpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJlcyArIGRlY29kZVV0ZjhDaGFyKHRtcClcbn1cblxuZnVuY3Rpb24gX2FzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKVxuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBfYmluYXJ5U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICByZXR1cm4gX2FzY2lpU2xpY2UoYnVmLCBzdGFydCwgZW5kKVxufVxuXG5mdW5jdGlvbiBfaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiBfdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyBieXRlc1tpKzFdICogMjU2KVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IGNsYW1wKHN0YXJ0LCBsZW4sIDApXG4gIGVuZCA9IGNsYW1wKGVuZCwgbGVuLCBsZW4pXG5cbiAgaWYgKEJ1ZmZlci5fdXNlVHlwZWRBcnJheXMpIHtcbiAgICByZXR1cm4gQnVmZmVyLl9hdWdtZW50KHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCkpXG4gIH0gZWxzZSB7XG4gICAgdmFyIHNsaWNlTGVuID0gZW5kIC0gc3RhcnRcbiAgICB2YXIgbmV3QnVmID0gbmV3IEJ1ZmZlcihzbGljZUxlbiwgdW5kZWZpbmVkLCB0cnVlKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpY2VMZW47IGkrKykge1xuICAgICAgbmV3QnVmW2ldID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICAgIHJldHVybiBuZXdCdWZcbiAgfVxufVxuXG4vLyBgZ2V0YCB3aWxsIGJlIHJlbW92ZWQgaW4gTm9kZSAwLjEzK1xuQnVmZmVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAob2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuZ2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy5yZWFkVUludDgob2Zmc2V0KVxufVxuXG4vLyBgc2V0YCB3aWxsIGJlIHJlbW92ZWQgaW4gTm9kZSAwLjEzK1xuQnVmZmVyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAodiwgb2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuc2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy53cml0ZVVJbnQ4KHYsIG9mZnNldClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKVxuICAgIHJldHVyblxuXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuZnVuY3Rpb24gX3JlYWRVSW50MTYgKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICB2YXIgdmFsXG4gIGlmIChsaXR0bGVFbmRpYW4pIHtcbiAgICB2YWwgPSBidWZbb2Zmc2V0XVxuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAxXSA8PCA4XG4gIH0gZWxzZSB7XG4gICAgdmFsID0gYnVmW29mZnNldF0gPDwgOFxuICAgIGlmIChvZmZzZXQgKyAxIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAxXVxuICB9XG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MTYodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MTYodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF9yZWFkVUludDMyIChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbFxuICBpZiAobGl0dGxlRW5kaWFuKSB7XG4gICAgaWYgKG9mZnNldCArIDIgPCBsZW4pXG4gICAgICB2YWwgPSBidWZbb2Zmc2V0ICsgMl0gPDwgMTZcbiAgICBpZiAob2Zmc2V0ICsgMSA8IGxlbilcbiAgICAgIHZhbCB8PSBidWZbb2Zmc2V0ICsgMV0gPDwgOFxuICAgIHZhbCB8PSBidWZbb2Zmc2V0XVxuICAgIGlmIChvZmZzZXQgKyAzIDwgbGVuKVxuICAgICAgdmFsID0gdmFsICsgKGJ1ZltvZmZzZXQgKyAzXSA8PCAyNCA+Pj4gMClcbiAgfSBlbHNlIHtcbiAgICBpZiAob2Zmc2V0ICsgMSA8IGxlbilcbiAgICAgIHZhbCA9IGJ1ZltvZmZzZXQgKyAxXSA8PCAxNlxuICAgIGlmIChvZmZzZXQgKyAyIDwgbGVuKVxuICAgICAgdmFsIHw9IGJ1ZltvZmZzZXQgKyAyXSA8PCA4XG4gICAgaWYgKG9mZnNldCArIDMgPCBsZW4pXG4gICAgICB2YWwgfD0gYnVmW29mZnNldCArIDNdXG4gICAgdmFsID0gdmFsICsgKGJ1ZltvZmZzZXRdIDw8IDI0ID4+PiAwKVxuICB9XG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MzIodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRVSW50MzIodGhpcywgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCxcbiAgICAgICAgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKVxuICAgIHJldHVyblxuXG4gIHZhciBuZWcgPSB0aGlzW29mZnNldF0gJiAweDgwXG4gIGlmIChuZWcpXG4gICAgcmV0dXJuICgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMVxuICBlbHNlXG4gICAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5mdW5jdGlvbiBfcmVhZEludDE2IChidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDEgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHJlYWQgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgdmFyIHZhbCA9IF9yZWFkVUludDE2KGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIHRydWUpXG4gIHZhciBuZWcgPSB2YWwgJiAweDgwMDBcbiAgaWYgKG5lZylcbiAgICByZXR1cm4gKDB4ZmZmZiAtIHZhbCArIDEpICogLTFcbiAgZWxzZVxuICAgIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDE2KHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRJbnQxNih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3JlYWRJbnQzMiAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAzIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byByZWFkIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIHZhciB2YWwgPSBfcmVhZFVJbnQzMihidWYsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCB0cnVlKVxuICB2YXIgbmVnID0gdmFsICYgMHg4MDAwMDAwMFxuICBpZiAobmVnKVxuICAgIHJldHVybiAoMHhmZmZmZmZmZiAtIHZhbCArIDEpICogLTFcbiAgZWxzZVxuICAgIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEludDMyKHRoaXMsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiAob2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gX3JlYWRJbnQzMih0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3JlYWRGbG9hdCAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICByZXR1cm4gaWVlZTc1NC5yZWFkKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIF9yZWFkRmxvYXQodGhpcywgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZEZsb2F0KHRoaXMsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfcmVhZERvdWJsZSAoYnVmLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICsgNyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gcmVhZCBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gIH1cblxuICByZXR1cm4gaWVlZTc1NC5yZWFkKGJ1Ziwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZERvdWJsZSh0aGlzLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiBfcmVhZERvdWJsZSh0aGlzLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCA8IHRoaXMubGVuZ3RoLCAndHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnVpbnQodmFsdWUsIDB4ZmYpXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKSByZXR1cm5cblxuICB0aGlzW29mZnNldF0gPSB2YWx1ZVxufVxuXG5mdW5jdGlvbiBfd3JpdGVVSW50MTYgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMSA8IGJ1Zi5sZW5ndGgsICd0cnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmdWludCh2YWx1ZSwgMHhmZmZmKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihsZW4gLSBvZmZzZXQsIDIpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID1cbiAgICAgICAgKHZhbHVlICYgKDB4ZmYgPDwgKDggKiAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSkpKSA+Pj5cbiAgICAgICAgICAgIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpICogOFxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVVSW50MzIgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICd0cnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmdWludCh2YWx1ZSwgMHhmZmZmZmZmZilcbiAgfVxuXG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG4gIGlmIChvZmZzZXQgPj0gbGVuKVxuICAgIHJldHVyblxuXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4obGVuIC0gb2Zmc2V0LCA0KTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9XG4gICAgICAgICh2YWx1ZSA+Pj4gKGxpdHRsZUVuZGlhbiA/IGkgOiAzIC0gaSkgKiA4KSAmIDB4ZmZcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDggPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0IDwgdGhpcy5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmc2ludCh2YWx1ZSwgMHg3ZiwgLTB4ODApXG4gIH1cblxuICBpZiAob2Zmc2V0ID49IHRoaXMubGVuZ3RoKVxuICAgIHJldHVyblxuXG4gIGlmICh2YWx1ZSA+PSAwKVxuICAgIHRoaXMud3JpdGVVSW50OCh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydClcbiAgZWxzZVxuICAgIHRoaXMud3JpdGVVSW50OCgweGZmICsgdmFsdWUgKyAxLCBvZmZzZXQsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiBfd3JpdGVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBhc3NlcnQodmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gbnVsbCwgJ21pc3NpbmcgdmFsdWUnKVxuICAgIGFzc2VydCh0eXBlb2YgbGl0dGxlRW5kaWFuID09PSAnYm9vbGVhbicsICdtaXNzaW5nIG9yIGludmFsaWQgZW5kaWFuJylcbiAgICBhc3NlcnQob2Zmc2V0ICE9PSB1bmRlZmluZWQgJiYgb2Zmc2V0ICE9PSBudWxsLCAnbWlzc2luZyBvZmZzZXQnKVxuICAgIGFzc2VydChvZmZzZXQgKyAxIDwgYnVmLmxlbmd0aCwgJ1RyeWluZyB0byB3cml0ZSBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG4gICAgdmVyaWZzaW50KHZhbHVlLCAweDdmZmYsIC0weDgwMDApXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZiAodmFsdWUgPj0gMClcbiAgICBfd3JpdGVVSW50MTYoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KVxuICBlbHNlXG4gICAgX3dyaXRlVUludDE2KGJ1ZiwgMHhmZmZmICsgdmFsdWUgKyAxLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICBfd3JpdGVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIF93cml0ZUludDMyIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDMgPCBidWYubGVuZ3RoLCAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZnNpbnQodmFsdWUsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICB9XG5cbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcbiAgaWYgKG9mZnNldCA+PSBsZW4pXG4gICAgcmV0dXJuXG5cbiAgaWYgKHZhbHVlID49IDApXG4gICAgX3dyaXRlVUludDMyKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbiAgZWxzZVxuICAgIF93cml0ZVVJbnQzMihidWYsIDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDEsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyTEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgYXNzZXJ0KHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IG51bGwsICdtaXNzaW5nIHZhbHVlJylcbiAgICBhc3NlcnQodHlwZW9mIGxpdHRsZUVuZGlhbiA9PT0gJ2Jvb2xlYW4nLCAnbWlzc2luZyBvciBpbnZhbGlkIGVuZGlhbicpXG4gICAgYXNzZXJ0KG9mZnNldCAhPT0gdW5kZWZpbmVkICYmIG9mZnNldCAhPT0gbnVsbCwgJ21pc3Npbmcgb2Zmc2V0JylcbiAgICBhc3NlcnQob2Zmc2V0ICsgMyA8IGJ1Zi5sZW5ndGgsICdUcnlpbmcgdG8gd3JpdGUgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxuICAgIHZlcmlmSUVFRTc1NCh2YWx1ZSwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgX3dyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gX3dyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGFzc2VydCh2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBudWxsLCAnbWlzc2luZyB2YWx1ZScpXG4gICAgYXNzZXJ0KHR5cGVvZiBsaXR0bGVFbmRpYW4gPT09ICdib29sZWFuJywgJ21pc3Npbmcgb3IgaW52YWxpZCBlbmRpYW4nKVxuICAgIGFzc2VydChvZmZzZXQgIT09IHVuZGVmaW5lZCAmJiBvZmZzZXQgIT09IG51bGwsICdtaXNzaW5nIG9mZnNldCcpXG4gICAgYXNzZXJ0KG9mZnNldCArIDcgPCBidWYubGVuZ3RoLFxuICAgICAgICAnVHJ5aW5nIHRvIHdyaXRlIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbiAgICB2ZXJpZklFRUU3NTQodmFsdWUsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIH1cblxuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuICBpZiAob2Zmc2V0ID49IGxlbilcbiAgICByZXR1cm5cblxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIF93cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGZpbGwodmFsdWUsIHN0YXJ0PTAsIGVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gKHZhbHVlLCBzdGFydCwgZW5kKSB7XG4gIGlmICghdmFsdWUpIHZhbHVlID0gMFxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQpIGVuZCA9IHRoaXMubGVuZ3RoXG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWx1ZSA9IHZhbHVlLmNoYXJDb2RlQXQoMClcbiAgfVxuXG4gIGFzc2VydCh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmICFpc05hTih2YWx1ZSksICd2YWx1ZSBpcyBub3QgYSBudW1iZXInKVxuICBhc3NlcnQoZW5kID49IHN0YXJ0LCAnZW5kIDwgc3RhcnQnKVxuXG4gIC8vIEZpbGwgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgYXNzZXJ0KHN0YXJ0ID49IDAgJiYgc3RhcnQgPCB0aGlzLmxlbmd0aCwgJ3N0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBhc3NlcnQoZW5kID49IDAgJiYgZW5kIDw9IHRoaXMubGVuZ3RoLCAnZW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgdGhpc1tpXSA9IHZhbHVlXG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgb3V0ID0gW11cbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBvdXRbaV0gPSB0b0hleCh0aGlzW2ldKVxuICAgIGlmIChpID09PSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTKSB7XG4gICAgICBvdXRbaSArIDFdID0gJy4uLidcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG4gIHJldHVybiAnPEJ1ZmZlciAnICsgb3V0LmpvaW4oJyAnKSArICc+J1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgYEFycmF5QnVmZmVyYCB3aXRoIHRoZSAqY29waWVkKiBtZW1vcnkgb2YgdGhlIGJ1ZmZlciBpbnN0YW5jZS5cbiAqIEFkZGVkIGluIE5vZGUgMC4xMi4gT25seSBhdmFpbGFibGUgaW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEFycmF5QnVmZmVyLlxuICovXG5CdWZmZXIucHJvdG90eXBlLnRvQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAoQnVmZmVyLl91c2VUeXBlZEFycmF5cykge1xuICAgICAgcmV0dXJuIChuZXcgQnVmZmVyKHRoaXMpKS5idWZmZXJcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KHRoaXMubGVuZ3RoKVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGJ1Zi5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSlcbiAgICAgICAgYnVmW2ldID0gdGhpc1tpXVxuICAgICAgcmV0dXJuIGJ1Zi5idWZmZXJcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdCdWZmZXIudG9BcnJheUJ1ZmZlciBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlcicpXG4gIH1cbn1cblxuLy8gSEVMUEVSIEZVTkNUSU9OU1xuLy8gPT09PT09PT09PT09PT09PVxuXG5mdW5jdGlvbiBzdHJpbmd0cmltIChzdHIpIHtcbiAgaWYgKHN0ci50cmltKSByZXR1cm4gc3RyLnRyaW0oKVxuICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxufVxuXG52YXIgQlAgPSBCdWZmZXIucHJvdG90eXBlXG5cbi8qKlxuICogQXVnbWVudCBhIFVpbnQ4QXJyYXkgKmluc3RhbmNlKiAobm90IHRoZSBVaW50OEFycmF5IGNsYXNzISkgd2l0aCBCdWZmZXIgbWV0aG9kc1xuICovXG5CdWZmZXIuX2F1Z21lbnQgPSBmdW5jdGlvbiAoYXJyKSB7XG4gIGFyci5faXNCdWZmZXIgPSB0cnVlXG5cbiAgLy8gc2F2ZSByZWZlcmVuY2UgdG8gb3JpZ2luYWwgVWludDhBcnJheSBnZXQvc2V0IG1ldGhvZHMgYmVmb3JlIG92ZXJ3cml0aW5nXG4gIGFyci5fZ2V0ID0gYXJyLmdldFxuICBhcnIuX3NldCA9IGFyci5zZXRcblxuICAvLyBkZXByZWNhdGVkLCB3aWxsIGJlIHJlbW92ZWQgaW4gbm9kZSAwLjEzK1xuICBhcnIuZ2V0ID0gQlAuZ2V0XG4gIGFyci5zZXQgPSBCUC5zZXRcblxuICBhcnIud3JpdGUgPSBCUC53cml0ZVxuICBhcnIudG9TdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9Mb2NhbGVTdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9KU09OID0gQlAudG9KU09OXG4gIGFyci5jb3B5ID0gQlAuY29weVxuICBhcnIuc2xpY2UgPSBCUC5zbGljZVxuICBhcnIucmVhZFVJbnQ4ID0gQlAucmVhZFVJbnQ4XG4gIGFyci5yZWFkVUludDE2TEUgPSBCUC5yZWFkVUludDE2TEVcbiAgYXJyLnJlYWRVSW50MTZCRSA9IEJQLnJlYWRVSW50MTZCRVxuICBhcnIucmVhZFVJbnQzMkxFID0gQlAucmVhZFVJbnQzMkxFXG4gIGFyci5yZWFkVUludDMyQkUgPSBCUC5yZWFkVUludDMyQkVcbiAgYXJyLnJlYWRJbnQ4ID0gQlAucmVhZEludDhcbiAgYXJyLnJlYWRJbnQxNkxFID0gQlAucmVhZEludDE2TEVcbiAgYXJyLnJlYWRJbnQxNkJFID0gQlAucmVhZEludDE2QkVcbiAgYXJyLnJlYWRJbnQzMkxFID0gQlAucmVhZEludDMyTEVcbiAgYXJyLnJlYWRJbnQzMkJFID0gQlAucmVhZEludDMyQkVcbiAgYXJyLnJlYWRGbG9hdExFID0gQlAucmVhZEZsb2F0TEVcbiAgYXJyLnJlYWRGbG9hdEJFID0gQlAucmVhZEZsb2F0QkVcbiAgYXJyLnJlYWREb3VibGVMRSA9IEJQLnJlYWREb3VibGVMRVxuICBhcnIucmVhZERvdWJsZUJFID0gQlAucmVhZERvdWJsZUJFXG4gIGFyci53cml0ZVVJbnQ4ID0gQlAud3JpdGVVSW50OFxuICBhcnIud3JpdGVVSW50MTZMRSA9IEJQLndyaXRlVUludDE2TEVcbiAgYXJyLndyaXRlVUludDE2QkUgPSBCUC53cml0ZVVJbnQxNkJFXG4gIGFyci53cml0ZVVJbnQzMkxFID0gQlAud3JpdGVVSW50MzJMRVxuICBhcnIud3JpdGVVSW50MzJCRSA9IEJQLndyaXRlVUludDMyQkVcbiAgYXJyLndyaXRlSW50OCA9IEJQLndyaXRlSW50OFxuICBhcnIud3JpdGVJbnQxNkxFID0gQlAud3JpdGVJbnQxNkxFXG4gIGFyci53cml0ZUludDE2QkUgPSBCUC53cml0ZUludDE2QkVcbiAgYXJyLndyaXRlSW50MzJMRSA9IEJQLndyaXRlSW50MzJMRVxuICBhcnIud3JpdGVJbnQzMkJFID0gQlAud3JpdGVJbnQzMkJFXG4gIGFyci53cml0ZUZsb2F0TEUgPSBCUC53cml0ZUZsb2F0TEVcbiAgYXJyLndyaXRlRmxvYXRCRSA9IEJQLndyaXRlRmxvYXRCRVxuICBhcnIud3JpdGVEb3VibGVMRSA9IEJQLndyaXRlRG91YmxlTEVcbiAgYXJyLndyaXRlRG91YmxlQkUgPSBCUC53cml0ZURvdWJsZUJFXG4gIGFyci5maWxsID0gQlAuZmlsbFxuICBhcnIuaW5zcGVjdCA9IEJQLmluc3BlY3RcbiAgYXJyLnRvQXJyYXlCdWZmZXIgPSBCUC50b0FycmF5QnVmZmVyXG5cbiAgcmV0dXJuIGFyclxufVxuXG4vLyBzbGljZShzdGFydCwgZW5kKVxuZnVuY3Rpb24gY2xhbXAgKGluZGV4LCBsZW4sIGRlZmF1bHRWYWx1ZSkge1xuICBpZiAodHlwZW9mIGluZGV4ICE9PSAnbnVtYmVyJykgcmV0dXJuIGRlZmF1bHRWYWx1ZVxuICBpbmRleCA9IH5+aW5kZXg7ICAvLyBDb2VyY2UgdG8gaW50ZWdlci5cbiAgaWYgKGluZGV4ID49IGxlbikgcmV0dXJuIGxlblxuICBpZiAoaW5kZXggPj0gMCkgcmV0dXJuIGluZGV4XG4gIGluZGV4ICs9IGxlblxuICBpZiAoaW5kZXggPj0gMCkgcmV0dXJuIGluZGV4XG4gIHJldHVybiAwXG59XG5cbmZ1bmN0aW9uIGNvZXJjZSAobGVuZ3RoKSB7XG4gIC8vIENvZXJjZSBsZW5ndGggdG8gYSBudW1iZXIgKHBvc3NpYmx5IE5hTiksIHJvdW5kIHVwXG4gIC8vIGluIGNhc2UgaXQncyBmcmFjdGlvbmFsIChlLmcuIDEyMy40NTYpIHRoZW4gZG8gYVxuICAvLyBkb3VibGUgbmVnYXRlIHRvIGNvZXJjZSBhIE5hTiB0byAwLiBFYXN5LCByaWdodD9cbiAgbGVuZ3RoID0gfn5NYXRoLmNlaWwoK2xlbmd0aClcbiAgcmV0dXJuIGxlbmd0aCA8IDAgPyAwIDogbGVuZ3RoXG59XG5cbmZ1bmN0aW9uIGlzQXJyYXkgKHN1YmplY3QpIHtcbiAgcmV0dXJuIChBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChzdWJqZWN0KSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChzdWJqZWN0KSA9PT0gJ1tvYmplY3QgQXJyYXldJ1xuICB9KShzdWJqZWN0KVxufVxuXG5mdW5jdGlvbiBpc0FycmF5aXNoIChzdWJqZWN0KSB7XG4gIHJldHVybiBpc0FycmF5KHN1YmplY3QpIHx8IEJ1ZmZlci5pc0J1ZmZlcihzdWJqZWN0KSB8fFxuICAgICAgc3ViamVjdCAmJiB0eXBlb2Ygc3ViamVjdCA9PT0gJ29iamVjdCcgJiZcbiAgICAgIHR5cGVvZiBzdWJqZWN0Lmxlbmd0aCA9PT0gJ251bWJlcidcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIHZhciBiID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBpZiAoYiA8PSAweDdGKVxuICAgICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkpXG4gICAgZWxzZSB7XG4gICAgICB2YXIgc3RhcnQgPSBpXG4gICAgICBpZiAoYiA+PSAweEQ4MDAgJiYgYiA8PSAweERGRkYpIGkrK1xuICAgICAgdmFyIGggPSBlbmNvZGVVUklDb21wb25lbnQoc3RyLnNsaWNlKHN0YXJ0LCBpKzEpKS5zdWJzdHIoMSkuc3BsaXQoJyUnKVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBoLmxlbmd0aDsgaisrKVxuICAgICAgICBieXRlQXJyYXkucHVzaChwYXJzZUludChoW2pdLCAxNikpXG4gICAgfVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KHN0cilcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHZhciBwb3NcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSlcbiAgICAgIGJyZWFrXG4gICAgZHN0W2kgKyBvZmZzZXRdID0gc3JjW2ldXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gZGVjb2RlVXRmOENoYXIgKHN0cikge1xuICB0cnkge1xuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoc3RyKVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZSgweEZGRkQpIC8vIFVURiA4IGludmFsaWQgY2hhclxuICB9XG59XG5cbi8qXG4gKiBXZSBoYXZlIHRvIG1ha2Ugc3VyZSB0aGF0IHRoZSB2YWx1ZSBpcyBhIHZhbGlkIGludGVnZXIuIFRoaXMgbWVhbnMgdGhhdCBpdFxuICogaXMgbm9uLW5lZ2F0aXZlLiBJdCBoYXMgbm8gZnJhY3Rpb25hbCBjb21wb25lbnQgYW5kIHRoYXQgaXQgZG9lcyBub3RcbiAqIGV4Y2VlZCB0aGUgbWF4aW11bSBhbGxvd2VkIHZhbHVlLlxuICovXG5mdW5jdGlvbiB2ZXJpZnVpbnQgKHZhbHVlLCBtYXgpIHtcbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicsICdjYW5ub3Qgd3JpdGUgYSBub24tbnVtYmVyIGFzIGEgbnVtYmVyJylcbiAgYXNzZXJ0KHZhbHVlID49IDAsICdzcGVjaWZpZWQgYSBuZWdhdGl2ZSB2YWx1ZSBmb3Igd3JpdGluZyBhbiB1bnNpZ25lZCB2YWx1ZScpXG4gIGFzc2VydCh2YWx1ZSA8PSBtYXgsICd2YWx1ZSBpcyBsYXJnZXIgdGhhbiBtYXhpbXVtIHZhbHVlIGZvciB0eXBlJylcbiAgYXNzZXJ0KE1hdGguZmxvb3IodmFsdWUpID09PSB2YWx1ZSwgJ3ZhbHVlIGhhcyBhIGZyYWN0aW9uYWwgY29tcG9uZW50Jylcbn1cblxuZnVuY3Rpb24gdmVyaWZzaW50ICh2YWx1ZSwgbWF4LCBtaW4pIHtcbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicsICdjYW5ub3Qgd3JpdGUgYSBub24tbnVtYmVyIGFzIGEgbnVtYmVyJylcbiAgYXNzZXJ0KHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGxhcmdlciB0aGFuIG1heGltdW0gYWxsb3dlZCB2YWx1ZScpXG4gIGFzc2VydCh2YWx1ZSA+PSBtaW4sICd2YWx1ZSBzbWFsbGVyIHRoYW4gbWluaW11bSBhbGxvd2VkIHZhbHVlJylcbiAgYXNzZXJ0KE1hdGguZmxvb3IodmFsdWUpID09PSB2YWx1ZSwgJ3ZhbHVlIGhhcyBhIGZyYWN0aW9uYWwgY29tcG9uZW50Jylcbn1cblxuZnVuY3Rpb24gdmVyaWZJRUVFNzU0ICh2YWx1ZSwgbWF4LCBtaW4pIHtcbiAgYXNzZXJ0KHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicsICdjYW5ub3Qgd3JpdGUgYSBub24tbnVtYmVyIGFzIGEgbnVtYmVyJylcbiAgYXNzZXJ0KHZhbHVlIDw9IG1heCwgJ3ZhbHVlIGxhcmdlciB0aGFuIG1heGltdW0gYWxsb3dlZCB2YWx1ZScpXG4gIGFzc2VydCh2YWx1ZSA+PSBtaW4sICd2YWx1ZSBzbWFsbGVyIHRoYW4gbWluaW11bSBhbGxvd2VkIHZhbHVlJylcbn1cblxuZnVuY3Rpb24gYXNzZXJ0ICh0ZXN0LCBtZXNzYWdlKSB7XG4gIGlmICghdGVzdCkgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UgfHwgJ0ZhaWxlZCBhc3NlcnRpb24nKVxufVxuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm5ncG1jUVwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uXFxcXC4uXFxcXG5vZGVfbW9kdWxlc1xcXFxndWxwLWJyb3dzZXJpZnlcXFxcbm9kZV9tb2R1bGVzXFxcXGJyb3dzZXJpZnlcXFxcbm9kZV9tb2R1bGVzXFxcXGJ1ZmZlclxcXFxpbmRleC5qc1wiLFwiLy4uXFxcXC4uXFxcXG5vZGVfbW9kdWxlc1xcXFxndWxwLWJyb3dzZXJpZnlcXFxcbm9kZV9tb2R1bGVzXFxcXGJyb3dzZXJpZnlcXFxcbm9kZV9tb2R1bGVzXFxcXGJ1ZmZlclwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbnZhciBsb29rdXAgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyc7XG5cbjsoZnVuY3Rpb24gKGV4cG9ydHMpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG4gIHZhciBBcnIgPSAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKVxuICAgID8gVWludDhBcnJheVxuICAgIDogQXJyYXlcblxuXHR2YXIgUExVUyAgID0gJysnLmNoYXJDb2RlQXQoMClcblx0dmFyIFNMQVNIICA9ICcvJy5jaGFyQ29kZUF0KDApXG5cdHZhciBOVU1CRVIgPSAnMCcuY2hhckNvZGVBdCgwKVxuXHR2YXIgTE9XRVIgID0gJ2EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFVQUEVSICA9ICdBJy5jaGFyQ29kZUF0KDApXG5cblx0ZnVuY3Rpb24gZGVjb2RlIChlbHQpIHtcblx0XHR2YXIgY29kZSA9IGVsdC5jaGFyQ29kZUF0KDApXG5cdFx0aWYgKGNvZGUgPT09IFBMVVMpXG5cdFx0XHRyZXR1cm4gNjIgLy8gJysnXG5cdFx0aWYgKGNvZGUgPT09IFNMQVNIKVxuXHRcdFx0cmV0dXJuIDYzIC8vICcvJ1xuXHRcdGlmIChjb2RlIDwgTlVNQkVSKVxuXHRcdFx0cmV0dXJuIC0xIC8vbm8gbWF0Y2hcblx0XHRpZiAoY29kZSA8IE5VTUJFUiArIDEwKVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBOVU1CRVIgKyAyNiArIDI2XG5cdFx0aWYgKGNvZGUgPCBVUFBFUiArIDI2KVxuXHRcdFx0cmV0dXJuIGNvZGUgLSBVUFBFUlxuXHRcdGlmIChjb2RlIDwgTE9XRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gTE9XRVIgKyAyNlxuXHR9XG5cblx0ZnVuY3Rpb24gYjY0VG9CeXRlQXJyYXkgKGI2NCkge1xuXHRcdHZhciBpLCBqLCBsLCB0bXAsIHBsYWNlSG9sZGVycywgYXJyXG5cblx0XHRpZiAoYjY0Lmxlbmd0aCAlIDQgPiAwKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuXHRcdH1cblxuXHRcdC8vIHRoZSBudW1iZXIgb2YgZXF1YWwgc2lnbnMgKHBsYWNlIGhvbGRlcnMpXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHR3byBwbGFjZWhvbGRlcnMsIHRoYW4gdGhlIHR3byBjaGFyYWN0ZXJzIGJlZm9yZSBpdFxuXHRcdC8vIHJlcHJlc2VudCBvbmUgYnl0ZVxuXHRcdC8vIGlmIHRoZXJlIGlzIG9ubHkgb25lLCB0aGVuIHRoZSB0aHJlZSBjaGFyYWN0ZXJzIGJlZm9yZSBpdCByZXByZXNlbnQgMiBieXRlc1xuXHRcdC8vIHRoaXMgaXMganVzdCBhIGNoZWFwIGhhY2sgdG8gbm90IGRvIGluZGV4T2YgdHdpY2Vcblx0XHR2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXHRcdHBsYWNlSG9sZGVycyA9ICc9JyA9PT0gYjY0LmNoYXJBdChsZW4gLSAyKSA/IDIgOiAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMSkgPyAxIDogMFxuXG5cdFx0Ly8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5cdFx0YXJyID0gbmV3IEFycihiNjQubGVuZ3RoICogMyAvIDQgLSBwbGFjZUhvbGRlcnMpXG5cblx0XHQvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG5cdFx0bCA9IHBsYWNlSG9sZGVycyA+IDAgPyBiNjQubGVuZ3RoIC0gNCA6IGI2NC5sZW5ndGhcblxuXHRcdHZhciBMID0gMFxuXG5cdFx0ZnVuY3Rpb24gcHVzaCAodikge1xuXHRcdFx0YXJyW0wrK10gPSB2XG5cdFx0fVxuXG5cdFx0Zm9yIChpID0gMCwgaiA9IDA7IGkgPCBsOyBpICs9IDQsIGogKz0gMykge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxOCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCAxMikgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA8PCA2KSB8IGRlY29kZShiNjQuY2hhckF0KGkgKyAzKSlcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMDAwKSA+PiAxNilcblx0XHRcdHB1c2goKHRtcCAmIDB4RkYwMCkgPj4gOClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRpZiAocGxhY2VIb2xkZXJzID09PSAyKSB7XG5cdFx0XHR0bXAgPSAoZGVjb2RlKGI2NC5jaGFyQXQoaSkpIDw8IDIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPj4gNClcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9IGVsc2UgaWYgKHBsYWNlSG9sZGVycyA9PT0gMSkge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAxMCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDEpKSA8PCA0KSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMikpID4+IDIpXG5cdFx0XHRwdXNoKCh0bXAgPj4gOCkgJiAweEZGKVxuXHRcdFx0cHVzaCh0bXAgJiAweEZGKVxuXHRcdH1cblxuXHRcdHJldHVybiBhcnJcblx0fVxuXG5cdGZ1bmN0aW9uIHVpbnQ4VG9CYXNlNjQgKHVpbnQ4KSB7XG5cdFx0dmFyIGksXG5cdFx0XHRleHRyYUJ5dGVzID0gdWludDgubGVuZ3RoICUgMywgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcblx0XHRcdG91dHB1dCA9IFwiXCIsXG5cdFx0XHR0ZW1wLCBsZW5ndGhcblxuXHRcdGZ1bmN0aW9uIGVuY29kZSAobnVtKSB7XG5cdFx0XHRyZXR1cm4gbG9va3VwLmNoYXJBdChudW0pXG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcblx0XHRcdHJldHVybiBlbmNvZGUobnVtID4+IDE4ICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDEyICYgMHgzRikgKyBlbmNvZGUobnVtID4+IDYgJiAweDNGKSArIGVuY29kZShudW0gJiAweDNGKVxuXHRcdH1cblxuXHRcdC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcblx0XHRmb3IgKGkgPSAwLCBsZW5ndGggPSB1aW50OC5sZW5ndGggLSBleHRyYUJ5dGVzOyBpIDwgbGVuZ3RoOyBpICs9IDMpIHtcblx0XHRcdHRlbXAgPSAodWludDhbaV0gPDwgMTYpICsgKHVpbnQ4W2kgKyAxXSA8PCA4KSArICh1aW50OFtpICsgMl0pXG5cdFx0XHRvdXRwdXQgKz0gdHJpcGxldFRvQmFzZTY0KHRlbXApXG5cdFx0fVxuXG5cdFx0Ly8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuXHRcdHN3aXRjaCAoZXh0cmFCeXRlcykge1xuXHRcdFx0Y2FzZSAxOlxuXHRcdFx0XHR0ZW1wID0gdWludDhbdWludDgubGVuZ3RoIC0gMV1cblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDIpXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPDwgNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gJz09J1xuXHRcdFx0XHRicmVha1xuXHRcdFx0Y2FzZSAyOlxuXHRcdFx0XHR0ZW1wID0gKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDJdIDw8IDgpICsgKHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKHRlbXAgPj4gMTApXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUoKHRlbXAgPj4gNCkgJiAweDNGKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDIpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9J1xuXHRcdFx0XHRicmVha1xuXHRcdH1cblxuXHRcdHJldHVybiBvdXRwdXRcblx0fVxuXG5cdGV4cG9ydHMudG9CeXRlQXJyYXkgPSBiNjRUb0J5dGVBcnJheVxuXHRleHBvcnRzLmZyb21CeXRlQXJyYXkgPSB1aW50OFRvQmFzZTY0XG59KHR5cGVvZiBleHBvcnRzID09PSAndW5kZWZpbmVkJyA/ICh0aGlzLmJhc2U2NGpzID0ge30pIDogZXhwb3J0cykpXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwibmdwbWNRXCIpLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSxyZXF1aXJlKFwiYnVmZmVyXCIpLkJ1ZmZlcixhcmd1bWVudHNbM10sYXJndW1lbnRzWzRdLGFyZ3VtZW50c1s1XSxhcmd1bWVudHNbNl0sXCIvLi5cXFxcLi5cXFxcbm9kZV9tb2R1bGVzXFxcXGd1bHAtYnJvd3NlcmlmeVxcXFxub2RlX21vZHVsZXNcXFxcYnJvd3NlcmlmeVxcXFxub2RlX21vZHVsZXNcXFxcYnVmZmVyXFxcXG5vZGVfbW9kdWxlc1xcXFxiYXNlNjQtanNcXFxcbGliXFxcXGI2NC5qc1wiLFwiLy4uXFxcXC4uXFxcXG5vZGVfbW9kdWxlc1xcXFxndWxwLWJyb3dzZXJpZnlcXFxcbm9kZV9tb2R1bGVzXFxcXGJyb3dzZXJpZnlcXFxcbm9kZV9tb2R1bGVzXFxcXGJ1ZmZlclxcXFxub2RlX21vZHVsZXNcXFxcYmFzZTY0LWpzXFxcXGxpYlwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbmV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sXG4gICAgICBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxLFxuICAgICAgZU1heCA9ICgxIDw8IGVMZW4pIC0gMSxcbiAgICAgIGVCaWFzID0gZU1heCA+PiAxLFxuICAgICAgbkJpdHMgPSAtNyxcbiAgICAgIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMCxcbiAgICAgIGQgPSBpc0xFID8gLTEgOiAxLFxuICAgICAgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXTtcblxuICBpICs9IGQ7XG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSk7XG4gIHMgPj49ICgtbkJpdHMpO1xuICBuQml0cyArPSBlTGVuO1xuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gZSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KTtcblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKTtcbiAgZSA+Pj0gKC1uQml0cyk7XG4gIG5CaXRzICs9IG1MZW47XG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSBtICogMjU2ICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpO1xuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhcztcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpO1xuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbik7XG4gICAgZSA9IGUgLSBlQmlhcztcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKTtcbn07XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbihidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgYyxcbiAgICAgIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDEsXG4gICAgICBlTWF4ID0gKDEgPDwgZUxlbikgLSAxLFxuICAgICAgZUJpYXMgPSBlTWF4ID4+IDEsXG4gICAgICBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMCksXG4gICAgICBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSksXG4gICAgICBkID0gaXNMRSA/IDEgOiAtMSxcbiAgICAgIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDA7XG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSk7XG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDA7XG4gICAgZSA9IGVNYXg7XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpO1xuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLTtcbiAgICAgIGMgKj0gMjtcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKTtcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKys7XG4gICAgICBjIC89IDI7XG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMDtcbiAgICAgIGUgPSBlTWF4O1xuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAodmFsdWUgKiBjIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKTtcbiAgICAgIGUgPSBlICsgZUJpYXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKTtcbiAgICAgIGUgPSAwO1xuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpO1xuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG07XG4gIGVMZW4gKz0gbUxlbjtcbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KTtcblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjg7XG59O1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm5ncG1jUVwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uXFxcXC4uXFxcXG5vZGVfbW9kdWxlc1xcXFxndWxwLWJyb3dzZXJpZnlcXFxcbm9kZV9tb2R1bGVzXFxcXGJyb3dzZXJpZnlcXFxcbm9kZV9tb2R1bGVzXFxcXGJ1ZmZlclxcXFxub2RlX21vZHVsZXNcXFxcaWVlZTc1NFxcXFxpbmRleC5qc1wiLFwiLy4uXFxcXC4uXFxcXG5vZGVfbW9kdWxlc1xcXFxndWxwLWJyb3dzZXJpZnlcXFxcbm9kZV9tb2R1bGVzXFxcXGJyb3dzZXJpZnlcXFxcbm9kZV9tb2R1bGVzXFxcXGJ1ZmZlclxcXFxub2RlX21vZHVsZXNcXFxcaWVlZTc1NFwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm5ncG1jUVwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uXFxcXC4uXFxcXG5vZGVfbW9kdWxlc1xcXFxndWxwLWJyb3dzZXJpZnlcXFxcbm9kZV9tb2R1bGVzXFxcXGJyb3dzZXJpZnlcXFxcbm9kZV9tb2R1bGVzXFxcXHByb2Nlc3NcXFxcYnJvd3Nlci5qc1wiLFwiLy4uXFxcXC4uXFxcXG5vZGVfbW9kdWxlc1xcXFxndWxwLWJyb3dzZXJpZnlcXFxcbm9kZV9tb2R1bGVzXFxcXGJyb3dzZXJpZnlcXFxcbm9kZV9tb2R1bGVzXFxcXHByb2Nlc3NcIikiLCIoZnVuY3Rpb24gKHByb2Nlc3MsZ2xvYmFsLEJ1ZmZlcixfX2FyZ3VtZW50MCxfX2FyZ3VtZW50MSxfX2FyZ3VtZW50MixfX2FyZ3VtZW50MyxfX2ZpbGVuYW1lLF9fZGlybmFtZSl7XG4ndXNlIHN0cmljdCc7XG52YXIgbm9vcCwgcGs7XG5cbm5vb3AgPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiB2O1xufTtcblxucGsgPSBmdW5jdGlvbihkZXNjcmlwdG9yKSB7XG4gIHZhciBjb21wdXRlZCwgZ2V0LCBrZXlzLCBzZXQsIHZhbHVlLCBfcmVmLCBfcmVmMTtcbiAgaWYgKGRlc2NyaXB0b3IuY29uc3RydWN0b3IgIT09IE9iamVjdCkge1xuICAgIHZhbHVlID0gZGVzY3JpcHRvcjtcbiAgICBnZXQgPSBub29wO1xuICAgIHNldCA9IGZ1bmN0aW9uKHZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgcmV0dXJuIG5ld1ZhbHVlO1xuICAgIH07XG4gICAga2V5cyA9IHt9O1xuICB9IGVsc2Uge1xuICAgIGtleXMgPSB7XG4gICAgICBnZXQ6IGRlc2NyaXB0b3Iua2V5IHx8ICgoX3JlZiA9IGRlc2NyaXB0b3Iua2V5cykgIT0gbnVsbCA/IF9yZWYuZ2V0IDogdm9pZCAwKSxcbiAgICAgIHNldDogZGVzY3JpcHRvci5rZXkgfHwgKChfcmVmMSA9IGRlc2NyaXB0b3Iua2V5cykgIT0gbnVsbCA/IF9yZWYxLnNldCA6IHZvaWQgMClcbiAgICB9O1xuICAgIHZhbHVlID0gZGVzY3JpcHRvci52YWx1ZTtcbiAgICBnZXQgPSBkZXNjcmlwdG9yLmdldCB8fCBub29wO1xuICAgIHNldCA9IGRlc2NyaXB0b3Iuc2V0IHx8IGZ1bmN0aW9uKHZhbHVlLCBuZXdWYWx1ZSkge1xuICAgICAgcmV0dXJuIG5ld1ZhbHVlO1xuICAgIH07XG4gICAgY29tcHV0ZWQgPSB2YWx1ZSA9PT0gdm9pZCAwO1xuICB9XG4gIHJldHVybiBmdW5jdGlvbih2LCBvcHRzKSB7XG4gICAgb3B0cyA9IG9wdHMgfHwgKCh2ICE9IG51bGwgPyB2LmtleSA6IHZvaWQgMCkgIT0gbnVsbCA/IHYgOiB2b2lkIDApIHx8IHt9O1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICBpZiAoa2V5cy5nZXQpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZ2V0IGEgbG9ja2VkIHByb3BlcnR5LicpO1xuICAgICAgfVxuICAgICAgaWYgKGNvbXB1dGVkKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZSA9IGdldC5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBnZXQuY2FsbCh0aGlzLCB2YWx1ZSk7XG4gICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICBpZiAoa2V5cy5nZXQgJiYgb3B0cy5rZXkpIHtcbiAgICAgICAgaWYgKGtleXMuZ2V0ID09PSBvcHRzLmtleSkge1xuICAgICAgICAgIGlmIChjb21wdXRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlID0gZ2V0LmNhbGwodGhpcywgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gZ2V0LmNhbGwodGhpcywgdmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGdldCBhIGxvY2tlZCBwcm9wZXJ0eS4nKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChrZXlzLnNldCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBzZXQgYSBsb2NrZWQgcHJvcGVydHkuJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY29tcHV0ZWQpIHtcbiAgICAgICAgICB2YWx1ZSA9IGdldC5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICB2YWx1ZSA9IHNldC5jYWxsKHRoaXMsIHZhbHVlLCB2KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAyKSB7XG4gICAgICBpZiAoa2V5cy5zZXQpIHtcbiAgICAgICAgaWYgKGtleXMuc2V0ID09PSBvcHRzLmtleSkge1xuICAgICAgICAgIGlmIChjb21wdXRlZCAmJiB2YWx1ZSA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGdldC5jYWxsKHRoaXMsIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFsdWUgPSBzZXQuY2FsbCh0aGlzLCB2YWx1ZSwgdik7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgc2V0IGEgbG9ja2VkIHByb3BlcnR5LicpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY29tcHV0ZWQgJiYgdmFsdWUgPT09IHZvaWQgMCkge1xuICAgICAgICAgIHZhbHVlID0gZ2V0LmNhbGwodGhpcywgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIHZhbHVlID0gc2V0LmNhbGwodGhpcywgdmFsdWUsIHYpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICB9XG4gIH07XG59O1xuXG5way5wayA9IHBrO1xuXG5way5wcm9wZXJ0eUtpdCA9IHBrO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHBrO1xuXG59KS5jYWxsKHRoaXMscmVxdWlyZShcIm5ncG1jUVwiKSx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30scmVxdWlyZShcImJ1ZmZlclwiKS5CdWZmZXIsYXJndW1lbnRzWzNdLGFyZ3VtZW50c1s0XSxhcmd1bWVudHNbNV0sYXJndW1lbnRzWzZdLFwiLy4uXFxcXC4uXFxcXG5vZGVfbW9kdWxlc1xcXFxwcm9wZXJ0eS1raXRcXFxccHJvcGVydHkta2l0LmpzXCIsXCIvLi5cXFxcLi5cXFxcbm9kZV9tb2R1bGVzXFxcXHByb3BlcnR5LWtpdFwiKSIsIihmdW5jdGlvbiAocHJvY2VzcyxnbG9iYWwsQnVmZmVyLF9fYXJndW1lbnQwLF9fYXJndW1lbnQxLF9fYXJndW1lbnQyLF9fYXJndW1lbnQzLF9fZmlsZW5hbWUsX19kaXJuYW1lKXtcbi8qKlxyXG4qIEBwcmVzZXJ2ZSBNb2R1bGU6IHN0YXRlanNcclxuKiBBdXRob3I6IERhcnJlbiBTY2huYXJlXHJcbiogS2V5d29yZHM6IGphdmFzY3JpcHQsc3RhdGUsbWFjaGluZSxmaW5pdGUsc3RhdGVzXHJcbiogTGljZW5zZTogTUlUICggaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5waHAgKVxyXG4qIFJlcG86IGh0dHBzOi8vZ2l0aHViLmNvbS9kc2NobmFyZS9zdGF0ZWpzXHJcbiovXHJcbid1c2Ugc3RyaWN0JztcclxuXHJcbnZhciBjaywgcGssIFN0YXRlTWFjaGluZSwgU3RhdGUsIFRyYW5zaXRpb24sIGlzQXJyYXk7XHJcblxyXG5jayA9IHJlcXVpcmUoJ2NvbnN0cnVjdG9yLWtpdCcpO1xyXG5wayA9IHJlcXVpcmUoJ3Byb3BlcnR5LWtpdCcpO1xyXG5cclxuaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKG8pIHtcclxuICByZXR1cm4gKHt9KS50b1N0cmluZy5jYWxsKG8pID09PSAnW29iamVjdCBBcnJheV0nO1xyXG59O1xyXG5cclxuLy8gaW52b2tlKG8sIG1ldGhvZE5hbWUsIC4uLilcclxuLy8gaW52b2tlKGZuLCB0aGlzT2JqLCAuLi4pXHJcbmZ1bmN0aW9uIGludm9rZShvLCBtZXRob2ROYW1lKSB7XHJcbiAgdmFyIGFyZ3MgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XHJcblxyXG4gIGlmICh0eXBlb2YgbyA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgcmV0dXJuIGFyZ3MubGVuZ3RoID8gby5hcHBseShtZXRob2ROYW1lLCBhcmdzKSA6IG8uY2FsbChtZXRob2ROYW1lKTtcclxuICB9IGVsc2UgaWYgKG8gJiYgdHlwZW9mIG9bbWV0aG9kTmFtZV0gPT09ICdmdW5jdGlvbicpIHtcclxuICAgIHJldHVybiBhcmdzLmxlbmd0aCA/IG9bbWV0aG9kTmFtZV0uYXBwbHkobywgYXJncykgOiBvW21ldGhvZE5hbWVdKCk7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBhc3luYyhmbilcclxuLy8gYXN5bmMoZm4sIC4uLilcclxuZnVuY3Rpb24gYXN5bmMoZm4pIHtcclxuICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcclxuICBTdGF0ZU1hY2hpbmUuY2FsbExhdGVyKGFyZ3MubGVuZ3RoID09PSAwID8gZm4gOiBmdW5jdGlvbiAoKSB7XHJcbiAgICBmbi5hcHBseSh1bmRlZmluZWQsIGFyZ3MpO1xyXG4gIH0pO1xyXG59XHJcblxyXG4vLyBBZGFwdGVyIGZvciBzdGF0ZSBvYmplY3RzLlxyXG5TdGF0ZSA9IGNrKGZ1bmN0aW9uIChzdGF0ZSkge1xyXG4gIHRoaXMuc3RhdGUgPSBwayh7dmFsdWU6IHN0YXRlIH0pO1xyXG59LCB7XHJcbiAgbmFtZTogZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHRoaXMuc3RhdGUoKSA/IHRoaXMuc3RhdGUoKS5uYW1lIDogJyc7XHJcbiAgfSxcclxuICBvbmVudHJ5OiBmdW5jdGlvbiAoKSB7XHJcbiAgICBhc3luYyhpbnZva2UsIHRoaXMuc3RhdGUoKSwgJ29uZW50cnknKTtcclxuICB9LFxyXG4gIG9uZXhpdDogZnVuY3Rpb24gKCkge1xyXG4gICAgYXN5bmMoaW52b2tlLCB0aGlzLnN0YXRlKCksICdvbmV4aXQnKTtcclxuICB9XHJcbn0pO1xyXG5cclxuLy8gQWRhcHRlciBmb3IgdHJhbnNpdGlvbiBvYmplY3RzLlxyXG5UcmFuc2l0aW9uID0gY2soZnVuY3Rpb24gKHRyYW5zaXRpb24pIHtcclxuIHRoaXMudHJhbnNpdGlvbiA9IHBrKHt2YWx1ZTogdHJhbnNpdGlvbiB9KTtcclxufSwge1xyXG4gIGZyb206IGZ1bmN0aW9uICgpIHtcclxuICAgIHJldHVybiB0aGlzLnRyYW5zaXRpb24oKSA/IHRoaXMudHJhbnNpdGlvbigpLmZyb20gOiAnJztcclxuICB9LFxyXG4gIHRvOiBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gdGhpcy50cmFuc2l0aW9uKCkgPyB0aGlzLnRyYW5zaXRpb24oKS50byA6ICcnO1xyXG4gIH0sXHJcbiAgYWN0aW9uczogZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHRyYW5zaXRpb24gPSB0aGlzLnRyYW5zaXRpb24oKTtcclxuXHJcbiAgICBpZiAodHJhbnNpdGlvbikge1xyXG4gICAgICBpZiAoaXNBcnJheSh0cmFuc2l0aW9uLmFjdGlvbnMpKSB7XHJcbiAgICAgICAgcmV0dXJuIHRyYW5zaXRpb24uYWN0aW9ucztcclxuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdHJhbnNpdGlvbi5hY3Rpb24gPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICByZXR1cm4gW3RyYW5zaXRpb24uYWN0aW9uXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBbXTtcclxuICB9LFxyXG4gIGhhc1RyaWdnZXI6IGZ1bmN0aW9uICh0cmlnZ2VyKSB7XHJcbiAgICB2YXIgdHJpZ2dlcnMsIGksIGxlbjtcclxuXHJcbiAgICB0cmlnZ2VycyA9IHRoaXMudHJpZ2dlcnMoKTtcclxuICAgIGxlbiA9IHRyaWdnZXJzLmxlbmd0aDtcclxuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICs9IDEpIHtcclxuICAgICAgaWYgKHRyaWdnZXJzW2ldID09PSB0cmlnZ2VyKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfSxcclxuICB0cmlnZ2VyczogZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHRyYW5zaXRpb24sIHRyaWdnZXJzO1xyXG5cclxuICAgIHRyaWdnZXJzID0gW107XHJcbiAgICB0cmFuc2l0aW9uID0gdGhpcy50cmFuc2l0aW9uKCk7XHJcblxyXG4gICAgaWYgKHRyYW5zaXRpb24pIHtcclxuICAgICAgaWYgKGlzQXJyYXkodHJhbnNpdGlvbi50cmlnZ2VycykpIHtcclxuICAgICAgICB0cmlnZ2VycyA9IHRyYW5zaXRpb24udHJpZ2dlcnM7XHJcbiAgICAgIH0gZWxzZSBpZiAodHJhbnNpdGlvbi50cmlnZ2VyKSB7XHJcbiAgICAgICAgdHJpZ2dlcnMgPSBbdHJhbnNpdGlvbi50cmlnZ2VyXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0cmlnZ2VycztcclxuICB9LFxyXG4gIGd1YXJkOiBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgIHZhciB0cmFuc2l0aW9uLCBndWFyZGVkO1xyXG5cclxuICAgIHRyYW5zaXRpb24gPSB0aGlzLnRyYW5zaXRpb24oKTtcclxuICAgIGd1YXJkZWQgPSBpbnZva2UodHJhbnNpdGlvbiwgJ2d1YXJkJywgZXZlbnQpO1xyXG5cclxuICAgIHJldHVybiBndWFyZGVkID09PSB1bmRlZmluZWQgfHwgISFndWFyZGVkO1xyXG4gIH0sXHJcbiAgaW52b2tlQWN0aW9uczogZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICB2YXIgYWN0aW9ucywgYWN0aW9uLCBpLCBsZW4sIHRyYW5zaXRpb247XHJcblxyXG4gICAgYWN0aW9ucyA9IHRoaXMuYWN0aW9ucygpO1xyXG4gICAgdHJhbnNpdGlvbiA9IHRoaXMudHJhbnNpdGlvbigpO1xyXG4gICAgbGVuID0gYWN0aW9ucy5sZW5ndGg7XHJcblxyXG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XHJcbiAgICAgIGFjdGlvbiA9IGFjdGlvbnNbaV07XHJcblxyXG4gICAgICBpZiAodHlwZW9mIGFjdGlvbiA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIGFzeW5jKGludm9rZSwgYWN0aW9uLCB0cmFuc2l0aW9uLCBldmVudCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pO1xyXG5cclxuU3RhdGVNYWNoaW5lID0gKGZ1bmN0aW9uICgpIHtcclxuICB2YXIga2V5ID0ge307XHJcbiAgcmV0dXJuIGNrKGZ1bmN0aW9uIChpbml0aWFsU3RhdGUpIHtcclxuICAgIHRoaXMuc3RhdGVzID0gcGsoe3ZhbHVlOiB7fSwga2V5OiBrZXl9KTtcclxuICAgIHRoaXMudHJhbnNpdGlvbnMgPSBwayh7dmFsdWU6IFtdLCBrZXk6IGtleX0pO1xyXG4gICAgdGhpcy5pbml0aWFsU3RhdGUgPSBwayh7a2V5czoge3NldDoga2V5fX0pO1xyXG4gICAgdGhpcy5zdGF0ZSA9IHBrKHtcclxuICAgICAgc2V0OiBmdW5jdGlvbiAoY3VycmVudFZhbHVlLCBuZXdWYWx1ZSkge1xyXG4gICAgICAgIHZhciBzdGF0ZXMgPSB0aGlzLnN0YXRlcyh7a2V5OiBrZXl9KTtcclxuXHJcbiAgICAgICAgaWYgKG5ld1ZhbHVlID09PSBudWxsIHx8IG5ld1ZhbHVlID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdGF0ZTonICsgbmV3VmFsdWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbmV3VmFsdWUgPSBuZXdWYWx1ZS50b1N0cmluZygpO1xyXG5cclxuICAgICAgICBpZiAoIXN0YXRlc1tuZXdWYWx1ZV0pIHtcclxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU3RhdGUgZG9lcyBub3QgZXhpc3Q6JyArIG5ld1ZhbHVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzdGF0ZXNbY3VycmVudFZhbHVlXSkge1xyXG4gICAgICAgICAgc3RhdGVzW2N1cnJlbnRWYWx1ZV0ub25leGl0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdGF0ZXNbbmV3VmFsdWVdLm9uZW50cnkoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ld1ZhbHVlO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBpbml0aWFsU3RhdGUgPSB0aGlzLmFkZFN0YXRlKGluaXRpYWxTdGF0ZSB8fCAnc3RhcnQnKTtcclxuICAgIHRoaXMuaW5pdGlhbFN0YXRlKGluaXRpYWxTdGF0ZS5uYW1lKCksIHtrZXk6IGtleX0pO1xyXG4gICAgdGhpcy5zdGF0ZShpbml0aWFsU3RhdGUubmFtZSgpKTtcclxuICB9LCB7XHJcbiAgICBoYXNTdGF0ZTogZnVuY3Rpb24gKHN0YXRlKSB7XHJcbiAgICAgIHJldHVybiB0eXBlb2YgdGhpcy5zdGF0ZXMoe2tleToga2V5fSlbc3RhdGVdICE9PSAnZnVuY3Rpb24nO1xyXG4gICAgfSxcclxuICAgIC8vIGFkZFN0YXRlKG5hbWUpXHJcbiAgICAvLyBhZGRTdGF0ZSh7bmFtZVssIG9uZW50cnksIG9uZXhpdF19KVxyXG4gICAgYWRkU3RhdGU6IGZ1bmN0aW9uIChzdGF0ZSkge1xyXG4gICAgICBpZiAoIXN0YXRlIHx8ICh0eXBlb2Ygc3RhdGUgIT09ICdzdHJpbmcnICYmIHR5cGVvZiBzdGF0ZS5uYW1lICE9PSAnc3RyaW5nJykpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1N0YXRlIG11c3QgaGF2ZSBhIG5hbWUgcHJvcGVydHkuJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmICh0eXBlb2Ygc3RhdGUgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgc3RhdGUgPSB7bmFtZTogc3RhdGV9O1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gKHRoaXMuc3RhdGVzKHtrZXk6IGtleX0pW3N0YXRlLm5hbWVdID0gbmV3IFN0YXRlKHN0YXRlKSk7XHJcbiAgICB9LFxyXG4gICAgLy8gYWRkVHJhbnNpdGlvbih7ZnJvbSwgdG8sIFtndWFyZCwgW2FjdGlvbiBvciBhY3Rpb25zXSwgW3RyaWdnZXIgb3IgdHJpZ2dlcnNdXX0pXHJcbiAgICBhZGRUcmFuc2l0aW9uOiBmdW5jdGlvbiAodHJhbnNpdGlvbikge1xyXG4gICAgICBpZiAoIXRyYW5zaXRpb24gfHwgdHlwZW9mIHRyYW5zaXRpb24uZnJvbSAhPT0gJ3N0cmluZycgfHwgdHlwZW9mIHRyYW5zaXRpb24udG8gIT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUcmFuc2l0aW9uIG11c3QgYXQgbGVhc3QgaGF2ZSBhIFwiZnJvbVwiIGFuZCBcInRvXCIgcG9wZXJ0aWVzLlwiJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHRoaXMudHJhbnNpdGlvbnMoe2tleToga2V5fSkucHVzaChuZXcgVHJhbnNpdGlvbih0cmFuc2l0aW9uKSk7XHJcbiAgICB9LFxyXG4gICAgLy8gdHJpZ2dlcihldmVudFR5cGUpXHJcbiAgICAvLyB0cmlnZ2VyKHt0eXBlLCAuLi59KVxyXG4gICAgdHJpZ2dlcjogZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgIHZhciBzdGF0ZXMsIHRyYW5zaXRpb25zLCBldmVudFR5cGUsIGksIGxlbiwgc3RhdGUsIHRvU3RhdGUsIHRyYW5zaXRpb247XHJcblxyXG4gICAgICBpZiAoIWV2ZW50IHx8ICh0eXBlb2YgZXZlbnQgICE9PSAnc3RyaW5nJyAmJiAhZXZlbnQudHlwZSkpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V2ZW50IG11c3QgZWl0aGVyIGJlIGEgc3RyaW5nIG9yIGFuIG9iamVjdCB3aXRoIGEgdHlwZSBwcm9wZXJ0eS4nKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZXZlbnRUeXBlID0gZXZlbnQudHlwZSB8fCBldmVudDtcclxuICAgICAgc3RhdGVzID0gdGhpcy5zdGF0ZXMoe2tleToga2V5fSk7XHJcbiAgICAgIHN0YXRlID0gc3RhdGVzW3RoaXMuc3RhdGUoKV07XHJcbiAgICAgIHRyYW5zaXRpb25zID0gdGhpcy50cmFuc2l0aW9ucyh7a2V5OiBrZXl9KTtcclxuXHJcbiAgICAgIGxlbiA9IHRyYW5zaXRpb25zLmxlbmd0aDtcclxuICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSArPSAxKSB7XHJcbiAgICAgICAgdHJhbnNpdGlvbiA9IHRyYW5zaXRpb25zW2ldO1xyXG5cclxuICAgICAgICBpZiAodHJhbnNpdGlvbi5mcm9tKCkgPT09IHN0YXRlLm5hbWUoKSAmJiB0cmFuc2l0aW9uLmhhc1RyaWdnZXIoZXZlbnRUeXBlKSAmJiB0cmFuc2l0aW9uLmd1YXJkKGV2ZW50KSkge1xyXG4gICAgICAgICAgdG9TdGF0ZSA9IHN0YXRlc1t0cmFuc2l0aW9uLnRvKCldO1xyXG5cclxuICAgICAgICAgIGlmICh0b1N0YXRlKSB7XHJcbiAgICAgICAgICAgIHRyYW5zaXRpb24uaW52b2tlQWN0aW9ucyhldmVudCk7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhdGUodG9TdGF0ZS5uYW1lKCkpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxufSgpKTtcclxuXHJcbi8vIGNhbGxMYXRlcihmbilcclxuU3RhdGVNYWNoaW5lLmNhbGxMYXRlciA9IHR5cGVvZiByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPT09ICdmdW5jdGlvbicgP1xyXG4gIGZ1bmN0aW9uIChmbikge1xyXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZuKTtcclxuICB9IDogZnVuY3Rpb24gKGZuKSB7XHJcbiAgICBzZXRUaW1lb3V0KGZuLCAxMCk7XHJcbiAgfTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU3RhdGVNYWNoaW5lO1xufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJuZ3BtY1FcIiksdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9LHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyLGFyZ3VtZW50c1szXSxhcmd1bWVudHNbNF0sYXJndW1lbnRzWzVdLGFyZ3VtZW50c1s2XSxcIi8uLlxcXFwuLlxcXFxzdGF0ZS5qc1wiLFwiLy4uXFxcXC4uXCIpIl19
