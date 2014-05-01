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
  loader = makeLoader();
  // The input manager.
  inputManager = makeInputManager(document);
  // The screen manager.
  screenManager = makeScreenManager(document.body, inputManager);

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
