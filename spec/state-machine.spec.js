describe('StateMachine', function () {
  it('should expose a StateMachine constructor', function () {
    expect(typeof StateMachine).toBe('function');
    expect((new StateMachine()) instanceof StateMachine).toBe(true);
  });

  it('should have an initial state of "start" by default', function () {
    var sm = new StateMachine();
    expect(sm.initialState()).toBe('start');
    expect(sm.hasState('start')).toBe(true);
  });

  it('should have an initial state of "begin"', function () {
    var sm = new StateMachine('begin');
    expect(sm.initialState()).toBe('begin');
    expect(sm.hasState('begin')).toBe(true);
  });

  it('should have states after adding states to the state machine', function () {
    var sm = new StateMachine();

    sm.addState('first');
    sm.addState('second');
    sm.addState('third');

    expect(sm.hasState('first')).toBe(true);
    expect(sm.hasState('second')).toBe(true);
    expect(sm.hasState('third')).toBe(true);
  });

  it('should call state onentry and onexit when transitioning', function (done) {
    var initialStateExited = false;
    var sm = new StateMachine({
      name: 'start',
      onexit: function () {
        initialStateExited = true;
      }
    });

    sm.addState({
      name: 'first',
      onentry: function () {
        expect(initialStateExited).toBe(true);
        done();
      }
    });
    sm.addTransition({
      from: 'start',
      to: 'first',
      trigger: 'go'
    });

    sm.trigger({type: 'go', value: 'hello world'});
  });

  it('should call transition actions with the event when transitioning', function (done) {
    var firstActionCalled, secondActionCalled, thirdActionCallCount;

    var sm = new StateMachine();

    firstActionCalled = false;
    secondActionCalled = false;
    thirdActionCallCount = 0;

    sm.addState('first');
    sm.addState('second');
    sm.addState('third');

    sm.addTransition({
      from: 'start',
      to: 'first',
      trigger: 'a',
      action: function (event) {
        firstActionCalled = true;
        expect(event !== undefined).toBe(true);
        expect(event.data).toBe('hello');
        expect(secondActionCalled).toBe(false);
        expect(thirdActionCallCount).toBe(0);
      }
    });

    sm.addTransition({
      from: 'first',
      to: 'second',
      trigger: 'b',
      action: function (event) {
        secondActionCalled = true;
        expect(event !== undefined).toBe(true);
        expect(event.data).toBe('hi');
        expect(firstActionCalled).toBe(true);
        expect(thirdActionCallCount).toBe(0);
      }
    });

    sm.addTransition({
      from: 'second',
      to: 'third',
      triggers: ['b'],
      actions: [function (event) {
        expect(thirdActionCallCount).toBe(0);
        thirdActionCallCount += 1;
        expect(event !== undefined).toBe(true);
        expect(event.data).toBe('yo');
        expect(firstActionCalled).toBe(true);
        expect(secondActionCalled).toBe(true);
      }, function (event) {
        expect(thirdActionCallCount).toBe(1);
        thirdActionCallCount += 1;
        expect(event !== undefined).toBe(true);
        expect(event.data).toBe('yo');
        expect(firstActionCalled).toBe(true);
        expect(secondActionCalled).toBe(true);
        done();
      }]
    });

    sm.trigger({type: 'a', data: 'hello'});
    sm.trigger({type: 'b', data: 'hi'});
    sm.trigger({type: 'b', data: 'yo'});
  });
});
