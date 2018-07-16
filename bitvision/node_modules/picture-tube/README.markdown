picture-tube
============

Render images on the terminal.

example
=======

command
-------

![picture tube robot](http://substack.net/images/screenshots/picture_tube_robot_avatar.png)

code
----

``` js
var pictureTube = require('picture-tube')
var tube = pictureTube();
tube.pipe(process.stdout);

var fs = require('fs');
fs.createReadStream('robot.png').pipe(tube);
```

usage
=====

```
Usage: picture-tube OPTIONS { file or uri }

Options:
  --cols  number of columns to use for output

```

methods
=======

``` js
var pictureTube = require('picture-tube');
```

var tube = pictureTube(opts)
----------------------------

Return a readable/writable stream that reads png image data and writes ansi
terminal codes.

Set the number of columns to display the image as with `opts.cols`.

Right now only png files work.

install
=======

To install as a library, with [npm](http://npmjs.org) do:

```
npm install picture-tube
```

To install the command-line tool, with [npm](http://npmjs.org) do:

```
npm install -g picture-tube
```

license
=======

MIT
