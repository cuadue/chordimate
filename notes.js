// Copyright 2012 Wes Waugh
// MIT License, see LICENSE file for details

// Note names are case-sensitive! This means that any `b` is a flat, and any
// `B` is the pitch a step above A. If this proves too cumbersome for a user
// (the author, wearing a user's cap) to type, we can add another layer of
// interpretation.

notes = (function() {
    var methods = {
        note_ord: function(name, desc) {
            return (desc && desc_ords || asc_ords)[name]
        },
        note_name: function(ord, desc) {
            return (desc && desc_names || asc_names)[ord]
        },
        parse_notes: function(s) {
            // convenience function. Given 'a b cb', returns ['A', 'B', 'Cb']
            return s.split(/\s+/).map(function(t) {
                return t.slice(0, 1).toUpperCase() + t.slice(1)
            })
        },
        make_scale: function(root, mode, desc) {
            // TODO this fails if you want to make a descending scale
            // with a sharp root
            var root_ord = methods.note_ord(root, desc)
            return _modes[mode].map(function(interval) {
                // Not ideal to use asc_names here but it has the same
                // length as desc_names.
                var ord = (root_ord + interval) % asc_names.length
                return methods.note_name(ord, desc)
            })
        }
    }

    function __parse_ordinals(names) {
        // Given an array of names, returns an object {name: ordinal ...}
        var result = {}
        for (var i = 0; i < names.length; i++) {
            result[names[i]] = i
        }
        return result
    }

    // The 12-tone chromatic scale spelled ascending...
    var asc_names = methods.parse_notes('c c# d d# e f f# g g# a a# b')
    // .. and descending
    var desc_names = methods.parse_notes('c db d eb e f gb g ab a bb b')
    var asc_ords = __parse_ordinals(asc_names)
    var desc_ords = __parse_ordinals(desc_names)

    // _modes are musical modes. Values in the array are note intervals
    // relative to the root
    var _modes = {
        major: [0, 2, 4, 5, 7, 9, 11],
        minor: [0, 2, 3, 5, 7, 8, 10],
    }

    return methods
})()

