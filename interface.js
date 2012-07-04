var STATEJS = {
	makeStateMachine: function () {}
};

function StateMachine() {}
StateMachine.prototype.initialState = function () {};
StateMachine.prototype.state = function () {};
StateMachine.prototype.invokeActionsAsynchronously = function () {};
StateMachine.prototype.addState = function () {};
StateMachine.prototype.addTransition = function () {};
StateMachine.prototype.trigger = function () {};

function State() {}
State.prototype.name = "";
State.prototype.onentry = function () {};
State.prototype.onexit = function () {};