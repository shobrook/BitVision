node-here.js
============

https://github.com/cho45/node-here.js

node-here.js is here-document feature for node.js.

SYNOPSYS
========

This is implemeneted with block comment syntax.

```
var here = require('here').here;

var string = here(/*
  foo
  bar
  baz
*/);

```

DESCRIPTION
===========

## `here(/* document */)`

`here` function returns block comment on argument as string like object.

### Escape character

Any characters can be escaped by backslash `\` like following:

```
here(/*
  /\* *\/
*/); //=> '/* */'

here(/* \\ */); //=> '\\'
```

### WYSIWYG

If a here document starts with `''/*`, it is wysiwyg mode which does not translate any escape characters.

```
here(''/*
  \foo\bar\baz
*/); //=> '\\fooo\\bar\\baz'
```

In this case, string `*/` can be apeared in here document.

### Returning value

`here()` returns not string but String object. That is like following:

```
var a = here(/* foobar */);
typeof a === 'object';

a.valueOf(); //=> 'foobar'
"Hello, " + a; //=> 'Hello, foobar';
```

### Method unindent();

Returning String object hav `unindent()` utility method which removes indent in a string.

```
here(/*
  foo
    bar
  baz
*/).unindent()
```

is convert to following:

```
foo
  bar
baz
```
