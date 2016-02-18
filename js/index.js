(function () {
    'use strict';

    var app = angular.module('nvcheck-dict-generator', []);

    app.controller('indexCtrl', [
        '$scope',
        function indexCtrl($scope) {
            // @param array sections
            // @param object inputyaml
            // @return string outputdict
            function generate(sections, inputyaml) {
                function generateWordsSection(words) {
                    var i, strWords = [], key = '', obj;
                    words = angular.copy(words);
                    for (i = 0; i < words.length; ++i) {
                        if (words[i].checked) {
                            key = words[i].string;
                        } else {
                            strWords.push(words[i].string);
                        }
                    }
                    // TODO: Check duplicated entries?
                    return generateSection(key, strWords);
                }
                function generateSection(key, value) {
                    var obj = {};
                    if (value === null || value.length === 0) {
                        return key + ':';
                    } else {
                        obj[key] = value;
                        return jsyaml.dump(obj).
                                replace(/\n$/, '');    // chomp
                    }
                }
                function isEmptyObj(obj) {
                    var key, hasOwnProperty = Object.prototype.hasOwnProperty;
                    for (key in obj) {
                        if (hasOwnProperty.call(obj, key)) return false;
                    }
                    return true;
                }

                var outputSections = [],
                    yaml = angular.copy(inputyaml),
                    key, i, obj = {};
                // Process each section key
                for (i = 0; i < sections.length; ++i) {
                    if (sections[i].type === 'words') {
                        console.log('generate(): sections[i] = ' +
                                        angular.toJson(sections[i]));
                        outputSections.push(
                            generateWordsSection(sections[i].words)
                        );
                        if (yaml.hasOwnProperty(sections[i].key)) {
                            delete yaml[sections[i].key];
                        } else {
                            // FIXME: Parse a key correctly.
                            throw "'" + key + "'" +
                                " does not exist in inputyaml!";
                        }
                    } else {    // comment or blank
                        outputSections.push(sections[i].string);
                    }
                }
                // Output rest keys.
                // (FIXME: If 'inputyaml' is parsed correctly,
                //         simply this block will be skipped)
                if (! isEmptyObj(yaml)) {
                    outputSections.push(
                        "###########################################\n" +
                        "# Below words are not correctly parsed... #\n" +
                        "# I'm appreciate if you report an issue   #\n" +
                        "# if you see this comment.                #\n" +
                        "###########################################\n"
                    );
                    for (key in yaml) {
                        outputSections.push(
                            generateSection(key, yaml[key])
                        );
                    }
                }
                console.log('generate() = ' +
                                angular.toJson(outputSections));
                return outputSections.join("\n");
            }

            // TODO: Freeze inputdict textarea after clicking 'Load' button.
            // TODO: Add 'Reset' button to reset state (Browser Reload is enough?).

            $scope.inputdict = '';
            // $scope.sections = ...;
            // $scope.inputyaml = ...;
            // $scope.outputdict = ...;
            // $scope.loaded = ...;
            $scope.load = (function() {
                function parseSections(inputdict, inputyaml) {
                    function startsWith(str, prefix) {
                        return str.lastIndexOf(prefix, 0) === 0;
                    }
                    function buildWords(key, inputyaml) {
                        console.log('buildWords(): key = ' + key + ', inputyaml[key] = ' + angular.toJson(inputyaml[key]))
                        if (! inputyaml.hasOwnProperty(key)) {
                            // FIXME: Parse a key correctly.
                            throw "'" + key + "'" +
                                  " does not exist in inputyaml!";
                        }
                        var value = inputyaml[key];
                        var words = [], strWords = [key], i;
                        // no elements when value === null
                        if (value !== null) {
                            // 'value' is either Array or Object.
                            strWords = strWords.concat(value);
                        }
                        for (i = 0; i < strWords.length; ++i) {
                            words.push({
                                string: strWords[i],
                                checked: (strWords[i] === key)
                            });
                        }
                        return words;
                    }

                    var CMT_OR_BLNK = /^\s*#|^\s*$/;
                    var sections = [], sectionLines = [],
                        key, i, indent, groupIndex = 0;
                    var lines = inputdict.split(/\n/);
                    for (i = 0; i < lines.length; ++i) {
                        console.log('lines[' + i + '] = ' + lines[i]);
                        if (CMT_OR_BLNK.test(lines[i])) {    // comment or blank
                            console.log('found comment/blank ' +
                                        '(line ' + i + '): ' + lines[i]);
                            for (sectionLines = [];
                                 i < lines.length &&
                                    CMT_OR_BLNK.test(lines[i]);
                                 ++i) {
                                sectionLines.push(lines[i]);
                            }
                            if (i < lines.length) --i;
                            sections.push({
                                type: 'comment/blank',
                                string: sectionLines.join("\n")
                            });
                            console.log('pushed to sections: ' +
                                        angular.toJson(sections[sections.length-1]));

                        } else if (/^([^:]+):/.test(lines[i])) {    // words
                            // FIXME: Parse a key correctly
                            console.log('found words ' +
                                        '(line ' + i + '): ' + lines[i]);
                            key = RegExp.$1;
                            if (i + 1 >= lines.length) {
                                break;
                            }
                            if (! /^([ \t]+)/.test(lines[i + 1])) {
                                sections.push({
                                    type: 'words',
                                    groupName: 'group-' + (groupIndex++),
                                    key: key,
                                    words: buildWords(key, inputyaml)
                                });
                                console.log('pushed to sections: ' +
                                            angular.toJson(sections[sections.length-1]));
                                continue;    // no elements in dictionary
                            }
                            indent = RegExp.$1;
                            for (sectionLines = [lines[i]], i = i + 1;
                                 i < lines.length &&
                                    startsWith(lines[i], indent);
                                 ++i) {
                                sectionLines.push(lines[i]);
                            }
                            if (i < lines.length) --i;
                            sections.push({
                                type: 'words',
                                groupName: 'group-' + (groupIndex++),
                                key: key,
                                words: buildWords(key, inputyaml)
                            });
                            console.log('pushed to sections: ' +
                                        angular.toJson(sections[sections.length-1]));

                        } else {
                            // FIXME: Parse 'inputyaml' correctly.
                            throw 'internal error: ' +
                                  'don\'t know how to do: ' + lines[i];
                        }
                    }
                    return sections;
                }

                var key, i = 0, j, list, words, r;
                var inputyaml = jsyaml.load($scope.inputdict);
                var sections = parseSections($scope.inputdict, inputyaml);

                $scope.sections = sections;
                $scope.inputyaml = inputyaml;
                $scope.outputdict = generate(sections, inputyaml);
                $scope.loaded = true;
                console.log('load(): sections = ' +
                            angular.toJson(sections));
            });
            $scope.checkChanged = (function checkChanged(
                    groupName, sectionIndex, wordIndex) {
                console.log('$scope.checkChanged: ' +
                            'groupName = ' + groupName +
                            ', sectionIndex = ' + sectionIndex +
                            ', wordIndex = ' + wordIndex);

                var i, words = $scope.sections[sectionIndex].words;
                for (i = 0; i < words.length; ++i) {
                    words[i].checked = (i == wordIndex);
                }
                $scope.outputdict =
                    generate($scope.sections, $scope.inputyaml);
            });
        }
    ]);
})();
