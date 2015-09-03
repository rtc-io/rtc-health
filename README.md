# rtc-health

rtc-health endeavours to provide monitoring and health reporting data for WebRTC peer connections that are created using [rtc-quickconnect](http://github.com/rtc-io/rtc-quickconnect). It will expose the events from the rtc-quickconnect instance, as well as providing statistical reports relating to the connection, and the various tracks/channels.

[![Build Status](https://img.shields.io/travis/rtc-io/rtc-health.svg?branch=master)](https://travis-ci.org/rtc-io/rtc-health)

## Providers

Currently, Chrome and Firefox do not implement the WebRTC.getStats API method in even remotely the same way, leading to some problems when it comes to standardizing the output of data. To get around this, rtc-health implements a provider for each browser that handles the execution and standardization of stats retrieval.

### Google Chrome

As the original implementor of the getStats method, and as such, containing a much wider array of reported metrics, Chrome is used as the baseline for the provider getStats. Standardization consists of removing 

### Mozilla Firefox

Firefox reports only basic information via it's getStats method for each MediaStreamTrack.

## Tests

This package uses [travis-multirunner][], which requires some manual setup to run tests.
First, you must set environment variables to select the browser and version to use:

    $ export BROWSER=firefox
    $ export BVER=stable

See [.travis.yml][] for the supported values of `BROWSER` and `BVER`.
Next, use `setup.sh` to download the binaries for this particular browser and version:

    $ ./node_modules/travis-multirunner/setup.sh

And finally, run the tests:

    $ npm test

[travis-multirunner]: https://www.npmjs.com/package/travis-multirunner
[.travis.yml]: ./.travis.yml

### Tests inside Docker

If you do your Node development in a Docker container, you'll need to install additional system packages in order to run headless browsers for testing.
With the standard `node` images available from Docker Hub, this is enough:

    # apt-get update && apt-get install -y xvfb libgtk-3-0-dbg libasound2 libdbus-glib-1-2 libgtk2.0-0 libgconf-2-4 libnss3 libxss1

Once you've set the appropriate environment variables, run the test commands prefixed with `xvfb-run`:

    # xvfb-run ./node_modules/travis-multirunner/setup.sh
    # xvfb-run npm test
