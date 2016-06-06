TESTS = test/*.test.js
REPORTER = spec
TIMEOUT = 1000
MOCHA_OPTS =

install:
	@npm install

test: install
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		$(MOCHA_OPTS) \
		$(TESTS)

test-cov:
	@$(MAKE) test -s MOCHA_OPTS='--require blanket' REPORTER=html-cov | ./node_modules/.bin/cov

test-coveralls: test
	@echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@-$(MAKE) test MOCHA_OPTS='--require blanket' REPORTER=mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js

test-all: test test-cov

contributors: install
	@./node_modules/.bin/contributors -f plain -o AUTHORS

.PHONY: test
