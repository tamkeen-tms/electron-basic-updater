
    /**
     * Hi there,
     * Thanks for using this module, and good luck with your Electron app.
     *
     * ~ Zain
     * */
    const Application = require('app');
    const FileSystem = require('fs');
    const Utils = require('util');
    const Zip = require('adm-zip');
    const HTTP = require('restler');
    const AppPath = Application.getAppPath() + '/';

    /**
     * */
    var Updater = {
        /**
         * The setup
         * */
        'setup': {
            'api': null,
            'logFile': 'updater-log.txt',
            'requestOptions': {}
        },

        /**
         * The new update information
         * */
        'update': {'last': null, 'source': null, 'file': null},

        /**
         * Init the module
         * */
        'init': function(setup){
            if(!Utils.isObject(setup)){
                this.log('Invalid setup!');
            }

            this.setup = Utils._extend(this.setup, setup);
        },

        /**
         * Logging
         * */
        'log': function(line){
            // Log it
            Utils.log('Updater: ', line);

            // Put it into a file
            if(this.setup.logFile){
                FileSystem.appendFileSync(AppPath + this.setup.logFile, line + "\n");
            }
        },

        /**
         * Make the check for the update
         * */
        'check': function(){
            // Get the current version
            var packageInfo = require(AppPath + '/package.json');

            // If the version property not specified
            if(!packageInfo.version){
                this.log('The "version" property not defined inside the application package.json');
                return false;
            }

            var requestOptions = Utils._extend({}, this.setup.requestOptions);
            if(!requestOptions.data){
                requestOptions.data = {};
            }

            // Send the current version along with the request
            requestOptions.data.current = packageInfo.version;

            // Check for updates
            HTTP.post(this.setup.api, requestOptions)
                .on('complete', function(result){
                    // If the request failed
                    if(result instanceof Error){
                        Updater.log('Could not connect, ' + result.message);
                        return false;
                    }

                    // Connected!
                    Updater.log('Connected to ' + Updater.setup.api);

                    // Handle the response
                    try{
                        if(!result){
                            throw false;
                        }

                        // Parse the response
                        var response = JSON.parse(result);

                        // If the "last" property is not defined
                        if(!response.last){
                            throw false;
                        }

                        // Update available
                        if(response.source){
                            Updater.log('Update available: ' + response.last);

                            // Store the response
                            Updater.update = response;

                            // Download the update
                            Updater.download();

                        }else{
                            Updater.log('No updates available');
                            return false;
                        }


                    }catch(error){
                        Updater.log('API response is not valid');
                    }
                });
        },

        /**
         * Download the update file
         * */
        'download': function(){
            var url = this.update.source,
                fileName = 'update.zip';

            this.log('Downloading ' + url);

            var requestOptions = Utils._extend({}, this.setup.requestOptions);
            requestOptions.decoding = 'buffer';

            // Download the file
            HTTP.get(url, requestOptions)
                .on('complete', function(data){
                    // The request failed
                    if(data instanceof Error){
                        Updater.log('Could not find the update file.');
                        return false;
                    }

                    // The file full path
                    var updateFile = AppPath + fileName;

                    // Create the file
                    FileSystem.writeFile(updateFile, data, null, function(error){
                        if(error){
                            Updater.log('Failed to download the update to a local file.');
                            return false;
                        }

                        // Store the update file path
                        Updater.update.file = updateFile;

                        // Success
                        Updater.log('Update downloaded: ' + updateFile);

                        // Apply the update
                        Updater.apply();
                    });
                });
        },

        /**
         * Apply the update, it simply overwrites the current files!
         * */
        'apply': function(){
            try{
                this.log('Extracting the new update files.');

                var zip = new Zip(this.update.file);
                zip.extractAllTo(AppPath);

                this.log('New update files were extracted.');
                this.log('End of update.');

            }catch(error){
                this.log('Extraction error: ' + error);
            }
        }
    };

    module.exports = Updater;