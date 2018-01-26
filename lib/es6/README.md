The source files herein use ES6 features and are loaded optimistically.

Calls that `require` them from source files in the parent directory
should be prepared for parsing to fail on EcmaScript engines.
