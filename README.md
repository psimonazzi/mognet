# Mognet — Obsessively minimal, opinionated web framework for Node.js

Mognet is an obsessively minimal, opinionated web framework for writers who love hacking or hackers who love design. It is written in Javascript for Node.js.

It was created to run the Author's personal site, but it may also be useful for those who still believe in the Do-It-Yourself Web, and don't want / can't build their own web framework. If you just want Tumblr, this is totally too much work. If you are a geek who can't sleep at night if the HTML code on their page isn't indented beautifully, you may like it.

Mognet runs as an in-memory, single-threaded server designed to run on cheap hosting services and still capable of withstanding a sudden popularity. It prefers to generate pages once and then serve them from memory without hitting the disk ever again, because hard disks are really slow. You can also use it to generate static HTML files, which you may just publish on Google Drive or Dropbox, so you don't need a web server at all.

If you have a lot of traffic keep in mind that Mognet can't do anything to save your bandwidth (except caching and compressing HTTP responses), so if you publish many images and other big static files it's probably a good idea to host them in the Cloud, and link to them from your pages.



## Package contents

* The Node.js server. This is Mognet itself.

* A template for the web pages done in HTML5 & CSS3. It features a fluid & responsive layout, an obsessive care for typographic details and absolutely no image files. [The Mognet page on Github](https://psimonazzi.github.com/mognet) is based on this. This design will also be used at the Author's personal site (coming soon).

* Deployment scripts. Used to deploy Mognet to the live server, start and stop it. They are written for a Debian-like Linux system, but nothing too specific; you should easily be able to use them in other environments. It's very basic stuff, and if you want to do things your way you can just ignore them.

* A collection of command-line tools to manage the site contents (list documents, prettify typography, etc). You don't really need them, they are just for fun and convenience.



## Super quick start if you know what you are doing

```sh
$ git clone https://github.com/psimonazzi/mognet.git
$ mkdir res static
$ cd mognet/app
$ npm install mognet
$ cd ..
$ sudo cp mognet.conf /etc/init
$ ./deploy
$ sudo start mognet
```


## Installation

You must have [Git](http://git-scm.com) and [Node.js](http://nodejs.org) installed. Clone this repository, then:

```sh
$ cd mognet/app
$ npm install mognet
```

This will download all needed Node.js modules. Mognet follows convention over configuration, so it just works and you don't need to configure anything. Ha! (But seriously, see below for some config options.)

When you are ready to run your own Mognet server, go on to Deployment.



## Deployment

### Our scenario

* You have access to a public server on the Internet: maybe an Amazon EC2 instance, a virtual host or a RaspberryPi in your kitchen.

* You need to install Mognet there; your user home dir is a nice place to put it. You can just clone the Git repository there: actually, it's a very good idea!

* Once you have the code on the server, you don't just start publishing your site: first, you have to deploy it. This two-step process avoids many crazy security holes, and enables instant updates to the running server without downtime.

### How-to

Mognet expects the following directory structure:

    + (wherever you want to put this project, i.e. /home/yourname/www/)
    |
    +-- mognet/ (this repository content)
    |
    +-- res/ (where you put the stuff you write)
    |
    +-- static/ (where you put images and other files)

So you have to create the ``res`` and ``static`` dirs at the same level of the ``mognet`` dir. They can also be symlinks to other places if you like.

* ``res/`` is where the site content will be. Posts and articles need to be in this directory so Mognet can discover them. This could be a separate repository, if you want to put under version control your content too. This directory is NOT exposed for public access from the internet, it's used by Mognet internally.

* ``static/`` is the only place in the filesystem that will be exposed for public access from the internet. Just to be clear: ANYTHING IN THIS DIRECTORY WILL BE ACCESSIBLE FROM THE INTERNET (if one knows the filename). This is where static files for the site will be: images, PDF documents, binary files and so on. You can leave this empty if you have no files, or you prefer to use a remote storage service instead (like Google Drive, Amazon S3, Dropbox...).

Once you are ready, make sure you have write access to the ``/var`` dir on your server and run this command from the ``mognet`` dir:

```sh
$ ./deploy
```

After this you will have the following structure on your filesystem:

    + /var/www/
    |
    +-- log/ (server log files: stdout.log for standard messages and stderr.log for errors)
    |
    +-- mognet/ (a symlink to the currently used mognet-X.Y.Z dir)
    |
    +-- mognet-X.Y.Z/ (the server code at the revision with tag or branch name X.Y.Z)
    |
    +-- ...
    |
    +-- res/ (a symlink to your project res/ dir)
    |
    +-- static/ (a symlink to your project static/ dir, will be accessible from the internet)

The server will always be run from ``/var/www/mognet``, which is a symlink to one of the ``/var/www/mognet-X.Y.Z`` dirs. In this way when you have a new version you can switch the live server code just by changing the symlink (which is a really fast and atomic operation), and restarting the server. Each of those dirs contains a full copy of the server code at the revision with tag or branch name ``X.Y.Z`` (usually a version number): but only the source files, without any Git repository metadata. All Node.js modules needed to run the server will be copied in each dir too, in the standard ``node_modules/`` path.

If something goes wrong, you can immediatly return to the previous working version by changing the symlink again and restarting.

Now you are ready to run the server.



## Running

Quick test run from the ``mognet/app/`` dir (quit with Ctrl-C). This command specifies a custom port ``3000``; the default port is 80, and you need to be the superuser to use it:

```sh
$ node server.js 3000
```

or

```sh
$ PORT=3000 node server.js
```

You will want to run the server as a daemon, starting at system boot and stopping on shutdown. This package includes an [Upstart](http://upstart.ubuntu.com) configuration ready to use, which creates a daemon named ``mognet``. You can run the usual commands to interact with it:

* ``start mognet``
* ``stop mognet``
* ``restart mognet``
* ``status mognet``

To install Mognet as an Upstart daemon just copy the ``mognet.conf`` file in ``/etc/init``. The server will be started automatically at system boot, and restarted immediatly if it crashes.
The daemon will print stdout and stderr to ``/dev/shm/stdout.log`` and ``/dev/shm/stderr.log``, which are in a temporary filesystem not written to disk. To save them to persistent files, you can use a periodic job like the one provided in ``crontab.txt``, which copies them to ``/var/www/log``.

By default, the server will listen on port 80 (HTTP) and will not print any log messages (not even errors) except at startup.


### Interacting with a running server

The Mognet server process listens on these standard POSIX signals:

* ``HUP (1)``: Updates the index file and reloads it in the server, clearing the content cache. Also reloads the configuration. Use this when you update the site contents, HTML templates or configuration (not needed when you update .css, .js and other static files);

* ``USR1 (10)``: Prints a JSON structure representing the current index and content cache which are stored in-memory by the server. Useful for quick debug;

* ``USR2 (12)``: Prints various info on the running server: version, configuration, memory usage, process id. 

If you have redirected the server standard output to a file, of course to see what Mognet says you will have to open that file.



## Configuration

You can change the default configuration in two ways:

* setting environment variables whose name starts with ``MOGNET_``;

* writing a JSON file named ``config.json`` in ``mognet/app/``.

These two ways can be combined: environment variables, when specified, always take precedence over the same variables in the JSON file. Env var names will be mapped to the vars used in the JSON file according to this rules: the ``MOGNET_`` prefix will be stripped; the ``_`` chars will be stripped and the words will be camelCased instead. For example, an environment variable ``MOGNET_BASE_URL`` will become the variable ``baseUrl`` in the configuration JSON and in the Mognet code.
Any variable can be passed to Mognet in these ways, even custom variables you can then use in your custom templates. The configuration variables understood by Mognet are:

* ``port``: (default: 80) Server listening port.

* ``denyDiskRead``: (default: false) If true, no files will be read from disk after the server has started. A request for content which is not already in memory and would require a disk read will fail, and the client will receive an error. Used for debugging.

* ``verbose``: (default: false) If true print log messages to stdout and stderr, otherwise no messages or errors will be printed.

* ``pageSize``: (default: 12) Number of articles displayed on each index page in the default template.

* ``baseUrl``: (default: null) The host and port of the urls served by this server, as seen from the internet. Internal urls will usually be specified in links as absolute paths (like ``/search``), but sometimes a full url is required by templates, for example in social networks metadata. The full url will be the concatenation of this value and an absolute path. Example value: ``http://example.com``.

* ``staticUrl``: (default: null) *TODO* A base url to set in any link to static resources in the template. Useful if you want to put CSS, javascript, images and so on on a remote storage service, and link to them in the template. If set, the full url of static resources will be the concatenation of this value and an absolute path. For example, if this value is ``http://googledrive.com/host/mytoken`` and the template uses a CSS file ``/css/style.css``, the link to the CSS in the template will be ``http://googledrive.com/host/mytoken/css/style.css``. If not set, urls to static resources in the template will be left as is, so they will refer to local resources. This value will affect only links in the template, not links in the documents you write.

- ``user``: (default: null) If specified, the server process will run as this user immediatly after binding to the port. Usually you will set this to an unprivileged user, so that the server will start at system boot with root privileges, bind to the default port 80, and then drop privileges and continue running as this user. The value can be a username (string) or uid (number). On Debian/Ubuntu, the first login user you create during installation has uid 1000 and group 1000 by convention, so it should be a safe value to set. This value must be set together with ``group``, otherwise it will have no effect.

- ``group``: (default: null) If specified, the server process will run as this group immediatly after binding to the port. See ``user``.

- ``googleAnalyticsAccount``: (default: null) A Google Analytics account id, used in the default template to enable Google Analytics tracking on the pages. If not set, Google Analytics will not be enabled.


### Examples

A ``config.json`` with a custom variable:

```javascript
{
    "myCustomSetting": "foo",
    "port": 3000,
    "denyDiskRead": false,
    "verbose": false,
    "locale": "en",
    "pageSize": 12,
    "baseUrl": null,
    "user": 1000,
    "group": 1000,
    "googleAnalyticsAccount": null,
    "staticUrl": null
}
```

And the corresponding environment variables (you could set them in ``/etc/environment`` so they are available to the server process at startup):

```sh
MOGNET_MY_CUSTOM_SETTING=foo
MOGNET_PORT=3000
MOGNET_DENY_DISK_READ=false
MOGNET_VERBOSE=false
MOGNET_LOCALE=en
MOGNET_PAGE_SIZE=12
MOGNET_BASE_URL=
MOGNET_USER=1000
MOGNET_GROUP=1000
MOGNET_GOOGLE_ANALYTICS_ACCOUNT=
MOGNET_STATIC_URL=
```


## Unit tests

Mognet comes with a suite of unit tests written in [Mocha](https://github.com/visionmedia/mocha). Run it with:

```sh
$ npm test
```

from the ``mognet/app`` dir.


## License

Mognet is released under the MIT License. See the ``LICENSE`` file.
