// import { dest, series, src, task } from 'gulp';
// import babel from 'gulp-babel';
// import del from 'gulp-clean';
// import eslint from 'gulp-eslint';
// import sourcemaps from 'gulp-sourcemaps';

const { dest, series, src/* , task */ } = require('gulp');
const babel = require('gulp-babel');
const del =  require('gulp-clean');
const eslint=  require('gulp-eslint');
const sourcemaps=  require('gulp-sourcemaps');

function build () {
	return src(['src/*.js', 'src/**/*.js'])
		.pipe(sourcemaps.init())
		.pipe(babel())
		.pipe(sourcemaps.write('.'))
		.pipe(dest('dist'))
}

function clean () {
	return src(['dist', 'reports'], { allowEmpty : true, read : false })
		.pipe(del());
}

function copy () {
	return src(['src/**/*.sh']).pipe(dest('dist'))
}

function lint () {
	return src(['gulpfile.babel.js', 'src/**/*.js', 'test/**/*.js'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
}

exports.build = series(clean, build, copy);
exports.clean = clean;
exports.default = series(clean, lint, build, copy);
exports.lint = lint;
