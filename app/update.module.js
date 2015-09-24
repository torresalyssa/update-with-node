var app = angular.module('updateApp', []);

app.controller("rootController", function ($scope, $log, $timeout) {

    $scope.upToDate = true;
    $scope.checked = false;
    $scope.checking = false;
    $scope.updating = false;
    $scope.checkMsg = "";
    $scope.updateMsg = "";
    $scope.bowerError = "";
    $scope.npmError = "";

    $scope.numUpdates = 0;

    $scope.projectPath = config['project-path'];
    $log.info('Running for project at ' + $scope.projectPath);

    $scope.$on('NOT_UP_TO_DATE', function () {
        $timeout(function() {
            $scope.checking = false;
            $scope.upToDate = false;
            $scope.checked = true;
        });
    });

    $scope.$on('UP_TO_DATE', function () {
        $scope.checking = false;
        $scope.upToDate = true;
        $timeout(function () {
            $scope.checkMsg = 'Everything is up-to-date!'
        });
        $scope.checked = true;
    });

    $scope.$on("UPDATING", function() {
        $timeout(function() {
            $scope.checkMsg = "";
            $scope.updating = true;
        });
    });

    $scope.$on("UPDATED", function() {
        $scope.numUpdates--;
        if ($scope.numUpdates == 0) {
            $timeout(function() {
                $scope.updating = false;
                $scope.updateMsg = "All done!"
            });
        }
    });

    $scope.checkUpToDate = function () {
        $scope.checking = true;
        var local, remote;

        $timeout(function () {
        });

        exec('cd ' + $scope.projectPath + " && git fetch", function (error, stdout, stderr) {

            if (error != null) {
                $timeout(function() {
                    $scope.checking = false;
                    $scope.checkMsg = 'There was an error checking for updates. Make sure your project has a git repository.';
                    $log.error('ERROR in exec (git fetch): ' + error);
                });
            }

            else {
                exec('cd ' + $scope.projectPath + ' && git rev-parse @', function (error, stdout, stderr) {

                    if (error != null) {
                        $log.error('ERROR in exec (git rev-parse @): ' + error);
                    }
                    else {
                        local = stdout;

                        exec('cd ' + $scope.projectPath + ' && git rev-parse @', function (error, stdout, stderr) {

                            if (error != null) {
                                $log.error('ERROR in exec (git rev-parse @{u}): ' + error);
                            }
                            else {
                                remote = stdout;

                                if (local != remote) {
                                    $log.info('Repo is not up-to-date');
                                    $scope.$broadcast('NOT_UP_TO_DATE');
                                }
                                else {
                                    $log.info('Repo is up-to-date');
                                    $scope.$broadcast('UP_TO_DATE');
                                }
                            }
                        })
                    }
                })
            }
        });
    };


    $scope.updateRepo = function () {

        var bowers = [];
        var npms = [];
        var i;

        $scope.$broadcast("UPDATING");

        exec('cd ' + $scope.projectPath + ' && git pull origin master', function (error) {

            if (error != null) {
                $log.error('ERROR in exec (git pull): ' + error);
            }
            else {

                // Find where we need bower updates
                var bowerStdout;
                var bowerFind = "find " + $scope.projectPath +
                    " -name 'bower.json' | grep -v node_modules | grep -v bower_components";

                try {
                    bowerStdout = execSync(bowerFind);
                }
                catch (err){
                    $log.error('ERROR in exec (find bower.json): ' + err);
                }

                bowers = bowerStdout.toString().split("\n");
                console.log(bowers);

                for (i = 0; i < bowers.length; i++) {
                    bowers[i] = bowers[i].replace("bower.json", "");
                    if (bowers[i] != "") {
                        $scope.numUpdates++;
                    }
                }

                //Find where we need npm updates
                var npmStdout = "";
                var npmFind = "find " + $scope.projectPath +
                    " -name 'package.json' | grep -v node_modules | grep -v bower_components";

                try {
                    npmStdout = execSync(npmFind);
                }
                catch (err) {
                    $log.error("ERROR in exec (find package.json): " + err);
                }

                npms = npmStdout.toString().split("\n");
                console.log(npms);

                for (i = 0; i < npms.length; i++) {
                    npms[i] = npms[i].replace("package.json", "");
                    if (npms[i] != "") {
                        $scope.numUpdates++;
                    }
                }

                // Do bower update(s)
                for (i = 0; i < bowers.length; i++) {
                    if (bowers[i] != "") {
                        exec("cd " + bowers[i] + " && bower update", function (error, stdout) {
                            if (error != null) {
                                $log.error("ERROR in exec (bower update): " + error);
                                $timeout(function() {$scope.bowerError = "Error in bower update."});
                            }
                            $scope.$broadcast('UPDATED');

                            //$log.info('stdout (bower update): ' + stdout);
                        })
                    }
                }

                // Do npm update(s)
                for (i = 0; i < npms.length; i++) {
                    if (npms[i] != "") {
                        exec("cd " + npms[i] + " && npm update", function (error, stdout) {
                            if (error != null) {
                                $log.error("ERROR in exec (npm update): " + error);
                                $timeout(function() {$scope.npmError = "Error in npm update."});
                            }
                            $scope.$broadcast('UPDATED');

                            //$log.info('stdout (npm update): ' + stdout);
                        })
                    }
                }
            }
        });
    };

});