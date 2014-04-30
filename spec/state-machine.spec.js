describe('StateMachine', function () {
  it('should expose a StateMachine constructor', function () {
    expect(typeof StateMachine).toBe('function');
    expect((new StateMachine()) instanceof StateMachine).toBe(true);
  });
});
