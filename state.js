/**
 * @preserve Module: statejs
 * Author: Darren Schnare
 * Keywords: javascript,state,machine,finite,states
 * License: MIT ( http://www.opensource.org/licenses/mit-license.php )
 * Repo: https://github.com/dschnare/statejs
 */

/*globals 'require', 'define', 'exports', 'setTimeout', 'requestAnimationFrame' */
(function (global, constructorKit, propertyKit) {
  'use strict';

  function module(constructorKit, propertyKit) {
    var StateMachine, State, Transition, isArray, invoke, async;

    isArray = Array.isArray || function (o) {
      return ({}).toString.call(o) === '[object Array]';
    };

    // invoke(o, methodName, ...)    
    // invoke(fn, thisObj, ...)
    invoke = function (o, methodName) {
      var args = [].slice.call(arguments, 2);
      
      if (typeof o === 'function') {
        return args.length ? o.apply(methodName, args) : o.call(methodName);
      } else if (o && typeof o[methodName] === 'function') {
        return args.length ? o[methodName].apply(o, args) : o[methodName]();
      }
    };

    // async(fn)
    // async(fn, ...)
    async = (function () {
      return function (fn) {
        var args = [].slice.call(arguments, 1);
        StateMachine.callLater(args.length === 0 ? fn : function () {
          fn.apply(undefined, args);
        });
      };
    }());
    
    State = (function () {
      return constructorKit(function (state) {
        this.state = propertyKit({value: state });
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
    }());

    Transition = (function () {
      return constructorKit(function (transition) {
       this.transition = propertyKit({value: transition }); 
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
    }());

    StateMachine = (function () {
      var key = {};
      return constructorKit(function (initialState) {
        this.states = propertyKit({value: {}, key: key});
        this.transitions = propertyKit({value: [], key: key});
        this.initialState = propertyKit({keys: {set: key}});
        this.state = propertyKit({
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

    StateMachine.callLater = typeof requestAnimationFrame === 'function' ? function (fn) { requestAnimationFrame(fn); } : function (fn) { setTimeout(fn, 10); };

    return StateMachine;
  }

  if (typeof exports === 'object' && exports) {
    exports.StateMachine = module(require('constructor-kit'), require('property-kit'));
  } else if (typeof define === 'function' && define.amd) {
    define(['constructor-kit', 'property-kit'], module);
  } else {
    global.StateMachine = module(constructorKit, propertyKit);
  }
}(this, this.constructorKit, this.propertyKit));
