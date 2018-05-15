/*global require*/

const babel = require('gulp-babel');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const concat = require('gulp-concat');
const gulp = require('gulp');
const gutil = require('gulp-util');
const pug  = require('gulp-pug');
const sass = require('gulp-sass');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');

gulp.task('default', ['sass:watch', 'pug:watch', 'scripts:watch']);

gulp.task('sass:watch', ['sass'], () => {
    gulp.watch('src/sass/**/*.scss', ['sass']);
});

gulp.task('pug:watch', ['pug'], () => {
    gulp.watch('src/pug/**/*.pug', ['pug']);
});

gulp.task('scripts:watch', ['browserify'], () => {
    gulp.watch('src/js/**/*.js', ['browserify']);
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

gulp.task('browserify', ['bundle'], function () {
    const b = browserify({     
        entries: 'build/js/chrome.js',
        debug: true
    });

    return b
    .bundle()
    .pipe(source('chrome.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(uglify())
    .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('build/js/'));
});

gulp.task('bundle', function () {
    return gulp.src('src/js/**/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(concat('js/chrome.js'))
        .pipe(gulp.dest('build'));
});
