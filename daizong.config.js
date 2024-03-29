export default {
  // Starts the development mode, which watches and compiles all source files including tests files.
  dev: {
    run: ['#clean', 'tsc -b tests -w'],
    envGroups: ['development'],
  },

  // Runs tests (you need to build the project first).
  t: {
    run: 'mocha --parallel --require source-map-support/register --reporter dot dist_tests/**/*.test.js',
  },

  // Cleans, lints, compiles sources and runs tests.
  build: {
    run: ['#clean', 'tsc -b tests', '#lint', '#t'],
    envGroups: ['production'],
  },

  // Deletes compiled files, auto triggered by `yarn r dev` or `yarn r build`.
  clean: {
    run: {
      del: ['dist', 'dist_tests'],
    },
  },

  // Lints the project using ESLint, auto triggered by `yarn r build`.
  lint: {
    run: 'eslint --max-warnings 0 --ext .ts src/ tests/',
  },

  _: {
    envGroups: {
      production: {
        NODE_ENV: 'production',
      },
      development: {
        NODE_ENV: 'development',
      },
    },
  },
};
