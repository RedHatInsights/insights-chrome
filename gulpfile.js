/*global require*/

const concat = require('gulp-concat');
const gulp = require('gulp');
const pug  = require('gulp-pug');
const sass = require('gulp-sass');

gulp.task('default', ['sass:watch', 'pug:watch', 'scripts:watch']);

gulp.task('sass:watch', ['sass'], () => {
    gulp.watch('src/sass/**/*.scss', ['sass']);
});

gulp.task('pug:watch', ['pug'], () => {
    gulp.watch('src/pug/**/*.pug', ['pug']);
});

gulp.task('scripts:watch', ['scripts'], () => {
    gulp.watch('src/js/**/*.js', ['scripts']);
});

gulp.task('sass', () => {
    return gulp.src('src/sass/chrome.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest('build'));
});

gulp.task('pug', () => {
  return gulp.src('src/pug/*.pug')
        .pipe(pug())
        .pipe(gulp.dest('build/snippets'))
    ;
});

gulp.task('scripts', function () {
    return gulp.src('src/js/**/*.js')
        .pipe(concat('js/chrome.js'))
        .pipe(gulp.dest('build'))
});
