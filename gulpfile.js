/*global require*/

const gulp = require('gulp');
const pug  = require('gulp-pug');
const sass = require('gulp-sass');

gulp.task('sass', () => {
    return gulp.src('sass/chrome.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('build'));
});

gulp.task('pug', () => {
  return gulp.src('pug/*.pug')
        .pipe(pug())
        .pipe(gulp.dest('build/snippets'))
    ;
});
