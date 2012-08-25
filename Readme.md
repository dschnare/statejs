# Overview

Statejs is an event-driven finite state machine implmentation for JavaScript.


# Installation

Install locally:

	npm install git://github.com/dschnare/statejs.git

Or use as a dependency:

	{
		"dependencies": {
			"statejs": "git://github.com/dschnare/statejs.git"
		}
	}

If all you want is a unminified/minified version of this script and its dependencies go to the download section.


# Support

Browsers and environments will be added to this list as testing ensues.

- Chrome
- Firefox 8+
- Opera 11+
- Safari 5+
- IE 7/8/9/10 Preview
- [Nodejs](http://nodejs.org/docs/latest/api/modules.html)/[CommonJS Module](http://wiki.commonjs.org/wiki/Modules/1.1)
- [AMD Module](https://github.com/dschnare/definejs)


# API

If not loaded using a module framework then this module exports `STATEJS` in the global namespace.

**STATEJS.makeStateMachine()**

	makeStateMachine()
	makeStateMachine(name)
	makeStateMachine({name, [onentry, onexit]})

	name - The name of the initial state (default is "start").
	onentry - The action to invoke when the initial state is entered.
	onexit - The action to invoke when the initial state is exited.

Makes a new state machine with the specified initial state with optional entry and exit actions. All state actions will be invoked with thier `this` object set to a state object with the following properties: `{name, onentry, onexit}`.

---

**StateMachine.initialState()**

	initialState()

Retrieves the name of the initial state.

**StateMachine.state()**

	state()
	state(name)

Retrieves the name of the current state. If this method is called with a state name then the state machine will attempt to explicitly transition to the specified state. This is more of a convenience method for changing states manually instead of relying on events to trigger transitions.

**StateMachine.invokeActionsAsynchronously()**

	invokeActionsAsynchronously()
	invokeActionsAsynchronously(value)

	Default is false.

This will set/get the flag that determines if state actions are invoked asynchronously or not.


**StateMachine.addState()**

	addState(name)
	addState({name, [onentry, onexit]})

	name - Is the state name.
	onentry - The action to invoke when the state is entered.
	onexit - The action to invoke when the state is exited.
	return - The state object registered.

Adds a state to the state machine.

**StateMachine.addTransition()**

	addTransition({from, to, [guard, [action or actions], [trigger or triggers]]})

	from - The state name the transition will be transitioning from.
	to - The state name the transition will be transitioning to.
	guard - The action to be called to test if the transition should be invoked.
	action - The action to have invoked when the transition is invoked.
	actions - The actions (as an array) to have invoked when the transition is invoked.
	trigger - The event name that will trigger this transition.
	triggers - The event names (as an array) that will trigger this transition.

Adds a state transition between states. The states involved in the transition should be added to the state machine either before or after the transition has been added.

All transition actions are invoked with thier `this` object set to a transition object with the following properties: `{from, to, guard, action or actions, trigger or triggers}`. Each transition action is also passed the `event` argument as passed to `trigger()` that caused the transition to be invoked.


**StateMachine.trigger()**

	trigger(eventType)
	trigger(eventObject)

	eventType - An event type as a string.
	eventObject - An object with a "type" property as a string.

Sends an event trigger to the state machine that may or may not trigger a transition. All transitions that have matching triggers will be invoked.