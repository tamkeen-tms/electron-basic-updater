# What it is
> A NodeJs module for Electron, that handles the application updates, in the most basic way.

## How it works (Read this first)
* EBU (Electron Basic Updater) was built to handle the process of updating an Electron app in the most basic way; **it simply replaces the application files (at /resources/app/) with the new ones representing the "update"!** 
    f this is what you are looking for then I hope you like it, else please check out a more advanced tool to handle this, somthing like [electron-updater](https://www.npmjs.com/package/electron-updater). Or have a look at [this](http://electron.atom.io/docs/v0.33.0/api/auto-updater/).
* The check for "updates" must by triggered by the application. **EBU doesn't make any kind of periodic checks on its own**. You can use  something like [node-schedule](https://www.npmjs.com/package/node-schedule) for this task.
* EBU talks to an API (let's call it so) to tell it if there is a new update.
    * The API recieves a request from EBU with the client's **current version of the application (must be specified inside the application package.json file)**.
    * The API then responds with the new update, ... or simply *false* to abort.
    * If there's an update available the API should respond with the *source* for this update **.zip** file.
    * EBU then downloads the .zip file and - I am sorry for the following - extracts it directly to the application folder (/resources/app/), thus overwriting the current files, including itself!

## But why ? (use cases)
Well, right now I am working on an Electron application for me and my collegues to use at work, after finishing the application and giving them the .exe release I needed to change couple of things, so I asked myself: what to do now ?! I read [this](http://electron.atom.io/docs/v0.33.0/api/auto-updater/) but for the life of me I couldn't get it to work :( (but to be fair, I didn't give it enough time, I wanted to create this instead :) ). So I decided to create a module to handle this, in the most basic way possible. So ...
* You can use EBU when you are still building the application and have a group of people live-testing it on their machines, with you monitoring the process and pushing changes.
* Also if your application is a local thing, inside your company or work group, and you simply need to push "changes" to their copies.
* If you don't know how to get the [Squirrel](https://github.com/Squirrel) thing to work and need to roll out your application asap.


---

## Installation
```
    $ npm install --save electron-basic-updater
```
Now, inside the *main.js* file, call it like this:
```
    const Electron = require('electron');
    const Application = Electron.app;
    const EBU = require('electron-basic-updater');
    
    Application.on('ready', function(){
        // Initiate the module
        EBU.init({
            'api': 'http:// .... ' // The API EBU will talk to
        });
    });
```

That's it. Now, you can use ```EBU.check()``` to trigger the update process; EBU will first check for updates, if there was a new update, EBU will download it and extract it to the application folder. Inside a window you can use it like this:

```
    <script>
        var remote = require('remote'),
            app = remote.require('app'),
            EBU = remote.require('electron-basic-updater');
            
        function(){
            EBU.check(function(error){
                if(error){
                    alert(error);
                    return false;
                }
                
                alert('App updated successfully! Restart it please.');
                app.quit();
            });
        }
    </script>
```

---

# API

### `Init( setup )`

* **setup** (object) The module setup
    * **api** (string) The URL EBU will call to check for updates.
    * **logFile** (string) [optional] The file to log the update process updates and errors to it, pass *FALSE* to omit logging . Defaults to "updater-log.txt".
    * **requestOptions** (object) [optional] The global options for the HTTP requests EBU will make to check for updates and download them. EBU uses the cool [restler](https://github.com/danwrong/restler) for these requests, and the `requestOptions` will be used for all the requests ([the full options list](https://github.com/danwrong/restler#options)). You can use this option to pass an `accessToken` or a `username` and `password` along with the request, or even send some extra data along with the request through the `data` property.
    
        ```
            EBU.init({
                'api': 'http:// ...',
                'requestOptions': {'accessToken': ..., 'data': {'group': 'friends'}}
            });    
        ```
    * **callback** (function) [optional] The callback that will be trigger at the end of the process, whether the update was a success or not. You can set the callback here, or you can pass it directly to `check( ... )`, I use the later option, to be able to `console.log()` the error in the DevTools.
    
    ```
        EBU.init({
            'callback': function(error){ ... }
        });
    ```

### `check( callback )`

Will check for an update, if an update was found, will download it and install it! As mentioned, this method must be tirggerd, EBU wont check for updates on its own.
* **callback** The update result callback

---

## The update server
And I mean this in the most simple way possible. This server/API will recieve one request, which is the check for updates, and will send one response of :

* **New update:** `{"last": " [the new version] ", "source": " [the .zip file url] "}` **EBU wont make any version comparsions, it will simply download the `source` url and extract it**. So, you will need to handle this on your side, EBU sends (POST-type request) you the client's current version (as `current`), you can use this to send the correct update!
* **Any other value, to cancel the update**

My current *update server* (for the app I descriped above) is simple:
```
    <?php
        print json_encode([
            'last' => '1.0.1',
            'source' => 'http:// ... /update.zip'
        ]);
```

I change this manually and tell the guys to hit the "update" button, which will trigger `.check()`

---

* Please contact me with any comments or open an issue.
* The development of this module will be continued.

---

The MIT License (MIT) - 
Copyright (c) 2015 Ahmed Zain tamkeenlms@gmail.com
