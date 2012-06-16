// Copyright 2012 Wes Waugh
// MIT License, see LICENSE file for details

// Requires notes.js which adds `notes` to the global object

!function($) {
    var methods = {
        init: function(opts) {
            var data = $(this).data('chordimate')
            data.settings = $.extend({
                tuning: 'e a d g b e',
                frets: 12
            }, opts)

            settings.tuning = notes.parse_notes(settings.tuning)

            this.$table = $('<table>')
            // Add the strings as rows
            for (var i = 0; i < settings.tuning; i++) {
                var $tr = $('<tr data-string=' + i + '>')
                $tr.append($('<td>' + settings.tuning[i] + '</td>'))
                // Add the frets as columns
                for (var k = 0; k < settings.frets; k++) {
                    $tr.append($('<td data-fret=' + k + '>'))
                }
                this.$table.append($tr)
            }
            return this.append(this.$table)
        },
        change: function(notes) {
            this.$table.text(notes.join(' '))
            return this
        }
    }

    $.fn.chordimate = function(method) {
        if (methods[method]) {
            return methods[method].apply(
                this, Array.prototype.slice.call(arguments, 1))
        }
        else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments)
        }
        else {
            $.error(method + ' does not exist on jQuery.chordimate')
        }
    }
}(jQuery)

