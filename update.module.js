var app = angular.module('updateApp', []);

app.controller("rootController", function($scope, $log, $timeout) {

    $scope.upToDate = true;
    $scope.checked = false;
    $scope.checkMsg = "";
    $scope.updateMsg = "";

    $scope.numUpdates = 0;

    $scope.$on('NOT_UP_TO_DATE', function() {
        $scope.upToDate = false;
        $timeout(function() { $scope.checkMsg = 'Looks like there are some updates!' });
        $scope.checked = true;
    });

    $scope.$on('UP_TO_DATE', function() {
        $scope.upToDate = true;
        $timeout(function() { $scope.checkMsg = 'Everything is up-to-date!' });
        $scope.checked = true;
    });

    $scope.$on('UPDATE_EXIT', function() {
        $scope.numUpdates++;

        // If all bower and
        if ($scope.numUpdates == 2)
    });

    $scope.checkUpToDate = function() {
        var local, remote;

        $timeout(function() { $scope.checkMsg = 'Checking for updates...' });

        exec('cd ..', function(error, stdout, stderr) {

            if (error != null) {
                $log.error('ERROR in exec (cd ..): ' + error);
            }
            else {

                exec('git fetch', function(error, stdout, stderr) {

                    if (error != null) {
                        $log.error('ERROR in exec (git fetch): ' + error);
                        $timeout(function() { $scope.checkedMsg = 'There was an error checking for updates.'});
                    }

                    else {
                        exec('git rev-parse @', function (error, stdout, stderr) {

                            if (error != null) {
                                console.log('ERROR in exec (git rev-parse @): ' + error);
                            }
                            else {
                                local = stdout;

                                exec('git rev-parse @', function (error, stdout, stderr) {

                                    if (error != null) {
                                        console.log('ERROR in exec (git rev-parse @{u}): ' + error);
                                    }
                                    else {
                                        remote = stdout;

                                        if (local != remote) {
                                            $log.info('Repo is not up-to-date');
                                            $scope.$broadcast('NOT_UP_TO_DATE');
                                        }
                                        else {
                                            $log.info('Repo is up-to-date');
                                            $scope.$broadcast('NOT_UP_TO_DATE');
                                        }
                                    }
                                })
                            }
                        })
                    }
                });
            }
        });
    };

    $scope.updateRepo = function() {

        var bowers = [];
        var npms = [];
        var i;
        var child1, child2;

        $scope.updateMsg = "Updating...";

        exec('cd ..', function(error) {

            if (error != null) {
                $log.error('ERROR in exec (cd ..): ' + error);
            }
            else {
                exec('git pull origin master', function (error, stdout, stderr) {

                    if (error != null) {
                        console.log('ERROR in exec (git pull): ' + error);
                    }

                    else {

                        // Do bower update(s)
                        child1 = exec("find .. -name 'bower.json' | grep -v bower_components", function(error, stdout, stderr) {

                            if (error != null) {
                                $log.error('ERROR in exec (find bower.json): ' + error);
                            }

                            bowers = stdout.split("\n");

                            for (i = 0; i < bowers.length; i++) {
                                bowers[i] = bowers[i].replace("bower.json", "");

                                if (bowers[i] != "") {
                                    exec("cd " + bowers[i] + " && bower update", function (error, stdout) {
                                        if (error != null) {
                                            $log.error("ERROR in exec (bower update): " + error);
                                        }

                                        //$log.info('stdout (bower update): ' + stdout);
                                    })
                                }
                            }
                        });

                        // Do npm update(s)
                        child2 = exec("find .. -name 'package.json' | grep -v node_modules | grep -v bower_components", function(error, stdout, stderr) {

                            if (error != null) {
                                $log.error('ERROR in exec (find package.json): ' + error);
                            }

                            //console.log('stdout (find package.json): ' + stdout);
                            //console.log('stderr (find package.json): ' + stderr);

                            npms = stdout.split("\n");

                            for (i = 0; i < npms.length; i++) {
                                npms[i] = npms[i].replace("package.json", "");

                                if (npms[i] != "") {
                                    exec("cd " + npms[i] + " && npm update", function (error, stdout) {
                                        if (error != null) {
                                            $log.error("ERROR in exec (npm update): " + error);
                                        }

                                        //$log.info('stdout (npm update): ' + stdout);
                                    })
                                }
                            }
                        });

                    }
                });
            }
        });
    };
});