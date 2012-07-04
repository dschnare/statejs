/**
 * @preserve Module: statejs
 * Author: Darren Schnare
 * Keywords: javascript,state,machine,finite,states
 * License: MIT ( http://www.opensource.org/licenses/mit-license.php )
 * Repo: https://github.com/dschnare/statejs
 */

/*jslint sub: true */
/*globals 'setTimeout', 'XPORT' */
(function (xport) {
	'use strict';

	// MAKE_STATE_MACHINE()
	// MAKE_STATE_MACHINE(name)
	// MAKE_STATE_MACHINE({name, [onentry, onexit]})
	function makeStateMachine(initialState) {
		var state,
			states = {},
			transitions = [],
			asyncActions = false,
			isArray = (function () {
				var toString = Object.prototype.toString;
				return function (a) {
					return toString.call(a) === '[object Array]';
				};
			}()),
			// invoke(fn, thisObj, ...)
			invoke = function (fn, thisObj) {
				var args = Array.prototype.slice.call(arguments, 2),
					call = function () {
						if (args.length) {
							fn.apply(thisObj, args);
						} else {
							fn.call(thisObj);
						}
					};

				if (asyncActions) {
					setTimeout(call, 0);
				} else {
					call();
				}
			},
			stateProxy = {
				state: null,
				name: function () {
					return this.state ? this.state["name"] : '';
				},
				onentry: function () {
					if (this.state && typeof this.state["onentry"] === 'function') {
						invoke(this.state["onentry"], this.state);
					}
				},
				onexit: function () {
					if (this.state && typeof this.state["onexit"] === 'function') {
						invoke(this.state["onexit"], this.state);
					}
				}
			},
			transitionProxy = {
				transition: null,
				from: function () {
					return this.transition ? this.transition["from"] : '';
				},
				to: function () {
					return this.transition ? this.transition["to"] : '';
				},
				actions: function () {
					if (this.transition) {
						if (isArray(this.transition["actions"])) {
							return this.transition["actions"];
						}

						if (typeof this.transition["action"] === 'function') {
							return [this.transition["action"]];
						}
					}

					return [];
				},
				triggers: function () {
					var triggers = [];

					if (this.transition) {
						if (isArray(this.transition["triggers"])) {
							triggers = this.transition["triggers"];
						} else if (this.transition["trigger"]) {
							triggers = [this.transition["trigger"]];
						}
					}

					if (typeof triggers.indexOf !== 'function') {
						triggers.indexOf = function (e, start) {
							var i = isFinite(start) ? start : 0,
								len = this.length,
								item;

							while (i < len) {
								item = this[i];

								if (item === e) {
									return i;
								}

								i += 1;
							}

							return -1;
						};
					}

					return triggers;
				},
				guard: function (event) {
					if (this.transition && typeof this.transition["guard"] === 'function') {
						return this.transition["guard"](event);
					}

					return true;
				},
				invokeActions: function (event) {
					var actions = this.actions(),
						action,
						i,
						len = actions.length,
						transition = this.transition;

					for (i = 0; i < len; i += 1) {
						action = actions[i];

						if (typeof action === 'function') {
							invoke(action, transition, event);
						}
					}
				}
			},
			self = {
				"invokeActionsAsynchronously": function (value) {
					if (arguments.length) {
						asyncActions = value;
					}

					return asyncActions;
				},
				"initialState": function () {
					return initialState.name;
				},
				"state": function (value) {
					var v;

					if (arguments.length) {
						if (value === null || value === undefined) {
							throw new Error('Invalid state value: ' + value);
						}

						v = value.toString();

						if (!states[v]) {
							throw new Error('State does not exist: ' + v);
						}

						stateProxy.state = state;
						stateProxy.onexit();

						state = states[v];
						stateProxy.state = state;
						stateProxy.onentry();
					}

					return state["name"];
				},
				// name
				// {name, [onentry, onexit]}
				"addState": function (state) {
					if (!state || (typeof state !== 'string' && !state["name"])) {
						throw new Error('State must at least have a name property.');
					}

					if (typeof state === 'string') {
						state = {"name": state};
					}

					states[state["name"]] = state;

					return state;
				},
				// {from, to, [guard, [action or actions], [trigger or triggers]]}
				"addTransition": function (transition) {
					if (!transition || !transition["from"] || !transition["to"]) {
						throw new Error('Transition must at least have a from and to property.');
					}

					transitions.push(transition);
				},
				"trigger": function (event) {
					if (!event || (typeof event !== 'string' && !event["type"])) {
						throw new Error('Event must either be a string or an object with a type property.');
					}

					var eventType = (typeof event === 'string' ? event : event.type),
						transition,
						i,
						len = transitions.length,
						toState;

					for (i = 0; i < len; i += 1) {
						transition = transitions[i];
						transitionProxy.transition = transition;

						if (transitionProxy.from() === state["name"] &&
								transitionProxy.triggers().indexOf(eventType) >= 0 &&
								transitionProxy.guard(event)) {

							toState = states[transitionProxy.to()];

							if (toState) {
								stateProxy.state = state;
								stateProxy.onexit();

								transitionProxy.invokeActions(event);

								state = toState;
								stateProxy.state = state;
								stateProxy.onentry();

								break;
							}
						}
					}
				}
			};

		if (!initialState) {
			initialState = 'start';
		}

		initialState = self["addState"](initialState);
		self["state"](initialState["name"]);

		return self;
	}

	xport.module({"makeStateMachine": makeStateMachine}, function () {
		xport('STATEJS', {"makeStateMachine": makeStateMachine});
	});
}(typeof XPORT === 'function' ? XPORT : null));