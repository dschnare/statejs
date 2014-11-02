'use strict'

var gulp = require('gulp')
  , jasmine = require('gulp-jasmine')
  , browserify = require('gulp-browserify')

gulp.task('default', function () {
  gulp.start('test')
})

gulp.task('test', function () {
  return gulp.src('./spec/*.js')
    .pipe(jasmine({
      reporter: 'object',
      verbose: true,
      includeStackTrace: true
    }))
})

gulp.task('build-example', function () {
  gulp.src('./example/js/game.js')
    .pipe(browserify({
      insertGlobals : true,
      debug : true
    }))
    .pipe(gulp.dest('./example/js/build'))
})