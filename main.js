// Copyright 2012 Wes Waugh
// MIT License, see LICENSE file for details

// Requires notes.js which adds `notes` to the global object

!function($) {
    var methods = {
        init: function(opts) {
            var settings = $.extend({
                tuning: 'e a d g b e',
                frets: 13
            }, opts)

            settings.tuning = notes.parse_notes(settings.tuning)
            $(this).data(settings)

            var $table = $('<table>')
            // Add the strings as rows
            for (var i = settings.tuning.length-1; i >= 0; i--) {
                var name = settings.tuning[i] 
                var string_ord = notes.note_ord(name)

                var $tr = $('<tr data-string=' + name + '/>')
                $table.append($tr)
                // Add the frets as columns
                for (var k = 0; k < settings.frets; k++) {
                    var note = notes.note_name(string_ord + k)
                    var $td = $('<td>').append(
                        $('<div>').attr('data-note', note).text(note))

                    $tr.append($td)
                }
            }

            return $(this).append($table)
        },
        change: function(notes) {
            var $that = $(this)
            $that.find('[data-note]').fadeOut()
            $.each(notes, function(index, name) {
                console.log(name)
                $that.find('[data-note="' + name + '"]').fadeIn()
            })
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

