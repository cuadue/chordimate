// Copyright 2012 Wes Waugh
// MIT License, see LICENSE file for details
!function($) {
    var up_count = ['C', 'C#', 'D', 'D#', 'E', 'F', 
                    'F#', 'G', 'G#', 'A', 'A#', 'B'],
        dn_count = ['C', 'Db', 'D', 'Eb', 'E', 'F', 
                    'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

    function unspell(note_name) {
        var ord = up_count.indexOf(note_name.toLowerCase())
        if(ord > -1) return ord
        var ord = dn_count.indexOf(note_name.toLowerCase())
        if(ord > -1) return ord
        return -1
    }

    function spell(ord, up) {
        return (up && up_count || dn_count)[ord]
    }

    methods = {
        init: function(opts) {
            var settings = $.extend({
            }, opts)
            return this
        },
        change: function(notes) {

            return this
        }
    }
    $.fn.chordimate = function(method) {
        if(methods[method]) {
            return methods[method].apply(
                this, Array.prototype.slice.call(arguments, 1))
        }
        else if(typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments)
        }
        else {
            $.error(method + ' does not exist on jQuery.chordimate')
        }
    }
}(jQuery)

