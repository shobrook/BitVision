# sparkline [![Build Status](https://secure.travis-ci.org/shiwano/sparkline.png?branch=master)](http://travis-ci.org/shiwano/sparkline)

A JavaScript implementation of [spark](https://github.com/holman/spark).

## Usage

### Node

Install the module with: `npm install --save sparkline`

```javascript
var sparkline = require('sparkline');
sparkline([1, 5, 22, 7, 9]);
```

### Command line

Install the module globally with: `npm install -g sparkline`

```shell
$ sparkline 12 43 56 30 15
▁▅█▃▁
$ echo 21,45,6,25,19,15 | sparkline
▃█▁▄▃▂
```

### Browser

Download the script file to your server, and add the script tag to your HTML file.

```html
<script src="http://example.com/sparkline.js"></script>
<script>
  sparkline([8, 31, 5, 20, 24]);
</script>
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
 * 2015-07-17   v0.1.2   Add min/max options
 * 2013-06-01   v0.1.1   Support AMD and bower
 * 2013-05-30   v0.1.0   First release.

## License
Copyright (c) 2013 Shogo Iwano
Licensed under the MIT license.
