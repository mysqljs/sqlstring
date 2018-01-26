# Unit tests for sqlstring

## Running tests on older node versions

We rely on Travis CI to check compatibility with older Node runtimes.

To locally run tests on an older runtime, for example `0.12`:

```sh
$ npm install --no-save npx
$ ./node_modules/.bin/npx node@0.12 test/run.js
```
