(function () {
    'use strict';

    var app = angular.module('nvcheck-dict-generator', []);

    app.controller('indexCtrl', [
        '$scope',
        function indexCtrl($scope, $location, $http, rom2hira) {
            $scope.inputdict = '';
            // $scope.candidates = ...;
            // $scope.outputdict = ...;
            $scope.load = (function() {
                function isArray(obj) {
                    return Object.prototype.toString.call(obj) === '[object Array]';
                }

                var key, i = 0, j, list, words, candidates = {};
                var inputyaml = jsyaml.load($scope.inputdict);
                console.log('inputyaml = ' + angular.toJson(inputyaml));
                for (key in inputyaml) {
                    words = [];
                    if (inputyaml[key] !== null) {
                        list = [key].concat(
                            isArray(inputyaml[key]) ?
                                inputyaml[key] : [inputyaml[key]]
                        );
                    }
                    for (var j = 0; j < list.length; ++j) {
                        words.push({
                            string: list[j],
                            checked: (list[j] === key)
                        });
                    }
                    candidates['group-' + (i++)] = words;
                }
                $scope.candidates = candidates;
                $scope.outputdict = jsyaml.dump($scope.generate(candidates));
                $scope.loaded = true;
                console.log('load(): candidates = ' +
                            angular.toJson(candidates));
            });
            $scope.checkChanged = (function checkChanged(groupName, index) {
                console.log('$scope.checkChanged: ' +
                            'groupName = ' + groupName +
                            ', index = ' + index);
                var words = $scope.candidates[groupName];
                for (var i = 0; i < words.length; ++i) {
                    words[i].checked = (i == index);
                }
                $scope.outputdict =
                    jsyaml.dump($scope.generate($scope.candidates));
            });
            $scope.generate = (function generate(candidates) {
                var outputdict = {},
                    cands = angular.copy(candidates),
                    groupName, words, outwords, key;
                for (groupName in cands) {
                    words = cands[groupName];
                    outwords = [];
                    key = '';
                    // Find a selected word in a group.
                    for (var j = 0; j < words.length; ++j) {
                        if (words[j].checked) {
                            key = words[j].string;
                        } else {
                            outwords.push(words[j].string);
                        }
                    }
                    if (key === '') {
                        key = outwords[0];
                    }
                    // TODO: Check duplicated entries?
                    outputdict[key] = outwords;
                }
                console.log('$scope.generate() = ' +
                            angular.toJson(outputdict));
                return outputdict;
            });
        }
    ]);
})();
