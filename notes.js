// Copyright 2012 Wes Waugh
// MIT License, see LICENSE file for details

// Note names are case-sensitive! This means that any `b` is a
// flat, and any `B` is the pitch a step above A. If this proves
// too cumbersome for a user (the author, wearing a user's cap) to
// type, we can add another layer of interpretation.

notes = (function() {
    var methods = {
        note_ord: function(name) {
            return $.extend({}, desc_ords, asc_ords)[name]
        },
        note_ords: function(names) {
            return $.map(names, methods.note_ord)
        },
        note_name: function(ord, desc) {
            var names = desc && desc_names || asc_names
            return names[ord % names.length]
        },
        parse_notes: function(s) {
            //  Given 'a b cb', returns ['A', 'B', 'Cb']
            return s.split(/\s+/).map(function(t) {
                return t.slice(0, 1).toUpperCase() + t.slice(1)
            })
        },
        make_scale: function(root, mode, desc) {
            // TODO this fails if you want to make a descending
            // scale with a sharp root
            var root_ord = methods.note_ord(root, desc)
            return _modes[mode].map(function(interval) {
                return methods.note_name(root_ord + interval, desc)
            })
        },
        interval_ord: function(from, add) {
            // This is a really stupid function
            return ((from + add) + desc_names.length) % desc_names.length
        }
    }

    function __parse_ordinals(names) {
        // Given an array of names, returns {name: ordinal ...}
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

    // _modes are musical modes. Values in the array are note
    // intervals relative to the root
    var _modes = {
        major: [0, 2, 4, 5, 7, 9, 11],
        minor: [0, 2, 3, 5, 7, 8, 10],
    }

    return methods
})()

