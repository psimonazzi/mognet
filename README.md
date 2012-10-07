# Mognet — Obsessively minimal, opinionated web framework for Node.js

Mognet is an obsessively minimal, opinionated web framework for technology-loving writers or design-loving hackers. It is written in Javascript for Node.js.

Born as the Author's little personal project, it could also be useful for those who still believe in the Do-It-Yourself Web, even in the cloud age, but don't want to build yet another web framework from scratch. It's completely unnecessary and totally too much work for those who just need a Tumblr. It certainly has more bugs, too. But it's dedicated with love to the geeks who can't sleep at night if the HTML code on their page isn't indented properly.

Mognet is an in-memory, single-threaded tiny demon of Speed, designed to run on cheap hosting services and still capable of withstanding a sudden popularity boost. It prefers to generate static pages once and then serve them from memory, but won't complain too much if forced to build pages dynamically on the fly. Either way, it slurps all your site pages in RAM on initialization or updates, and then it doesn't hit the disk ever again. Hard drives are too slow. Probably it's a good idea to put your images and other big static files in the Cloud, anyway: Mognet can do nothing to save your bandwidth.


## Package contents

- The Node.js server app. This is Mognet itself.

- A template for the web pages done in HTML5 & CSS3. It features a responsive layout, an obsessive care for typographic details and absolutely no image files. This design is currently used at [my personal site](http://ps.info).

- A collection of command-line tools to manage the site contents (list documents, add new ones, etc). You don't strictly need them, they are just for fun: Mognet is smart enough to update itself automagically when it senses new contents.

- Deployment scripts. Used to deploy Mognet to the live server, start and stop it. They require [Naught](https://github.com/indabamusic/naught) and a Debian-like Linux system; you should easily be able to adapt them to other environments.


## Installation

Clone this repository, then:

    npm install mognet

This will download all needed dependencies. Mognet follows convention over configuration, so it should just work and you don't need to configure anything. Ha!


## Deployment

The general idea:

- You have access to a public server on the Internet: maybe an Amazon EC2 instance, a virtual host or an old Linux box in your basement. You need to install Mognet there. Your user home dir is a nice place to put it. It's fine to just clone the Git repository there: actually, it's a very good idea!

- Once you have the code on the server, you can't just start publishing your site: first, you have to deploy it. This two-step process avoids many crazy security holes, and enables instant updates to the running server without downtime.

Mognet provides automated scripts to deploy, but it expects to find on the server the following directory structure:

    + (wherever you want to put this project, i.e. /home/yourname/www/)
    |
    \-- log/
    |
    \-- mognet/ (this repository content)
    |
    \-- res/
    |
    \-- static/

So you have to create the ``log``, ``res`` and ``static`` dirs at the same level of the ``mognet`` dir. They can also be symlinks to other places if you like.

- ``log/`` is where the server log files will be created: ``stdlog`` for standard messages and ``stderr`` for errors.

- ``res/`` is where the site content will be. Posts and documents files need to be in this directory so Mognet can discover them. This could be a separate repository, if you want to put under version control your content too. This directory is NOT exposed for public access from the internet, it's just used by Mognet internally.

- ``static/`` is the only place in the filesystem that will be exposed for public access from the internet. That's it: ANYTHING IN THIS DIRECTORY WILL BE ACCESSIBLE FROM THE INTERNET (if one knows the filename). This is where static files for the site will be: images, videos, documents, binary files and so on. You can leave this empty if you have no files, or you prefer to upload them to a remote storage server instead.

Once you are ready, run this command from the ``mognet`` dir:

    make deploy

After this you will have the following structure on your filesystem:

    + /var/www
    |
    \-- log/
    |
    \-- mognet/ (a symlink to one of the code versions in mognet-X.Y.Z)
    |
    \-- mognet-X.Y.Z/ (the server code at the revision tagged X.Y.Z, without Git repository data, tests, scripts etc.)
    |
    \-- res/ (a symlink to your project res/ dir)
    |
    \-- static/ (a symlink to your project static/ dir, will be accessible from the internet)

The server will always be run from ``/var/www/mognet``, which is a symlink to one of the ``/var/www/mognet-X.Y.Z`` dirs. In this way you can switch the live server code just by changing the symlink to point to another dir (which is a really fast and atomic operation), and restarting the server (which causes no downtime thanks to Naught).

If something goes wrong, you can immediatly return to the previous working version by changing the symlink again and restarting.

Now you are ready to run the server.


## Running

Quick test run from the server directory (quit with Ctrl-C):

    node server.js

or if you want to specify a custom port:

    PORT=3000 node server.js

To run in production (running as daemon, restarting on crash, log rotation etc.), first install Naught globally:

    sudo npm install -g naught

After deploying the desired version, start the server with:

    npm start

And to stop:

    npm stop

To run at system boot and stop on shutdown, configure an Upstart service with these start and stop commands.


## License

Mognet is released under the MIT License. See the ``LICENSE`` file.
