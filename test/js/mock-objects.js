var MOCK = (function () {
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

// Export the mock objects.
(function () {
	for (var key in MOCK) {
		if (MOCK[key]) {
			window[key] = MOCK[key];
		}
	}
}());