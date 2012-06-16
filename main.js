// Copyright 2012 Wes Waugh
// MIT License, see LICENSE file for details

// Requires notes.js which adds `notes` to the global object
// Requires jQuery (http://jquery.com)
// Requires Raphael (http://raphaeljs.com)
// Thanks to Mohit Muthanna Cheppudira! (http://0xfe.blogspot.com)

// Add a simple line method to Raphael.
Raphael.prototype.vexLine = function(x, y, new_x, new_y) {
    return this.path("M" + x + " " + y + "L" + new_x + " " + new_y);
}

!function($) {
    var methods = {
        init: function(options) {
            var obj = $.extend({
                width: 800,
                height: 300,
                tuning: 'e a d g b e',
                frets: 13,
                small_inlays: [3, 5, 7, 9],
                large_inlays: [12],
                inlay_radius: 7,
                padding_left: 50,
                padding_bottom: 16,
                font_size: 15,
                bridge_stroke_width: 10,
                bridge_stroke_linecap: 'round',
                line_stroke_width: 2,
                note_radius: 7,
                animate_in: function(e) {
                    e.animate({opacity: 1, transform: 's1.5'}, 500, '>')
                },
                animate_out: function(e) {
                    e.animate({opacity: 0, transform: 's5'}, 500, '>',
                        function() {this.remove()})
                }
            }, options)

            obj.tuning = notes.parse_notes(obj.tuning)
            obj.string_height = (obj.height - obj.padding_bottom) / obj.tuning.length
            obj.fret_width = (obj.width - obj.padding_left) / obj.frets

            // this[0] is the native DOM element
            obj.r = Raphael(this[0], obj.width, obj.height)

            // Draw static
            // Each string
            var len = obj.tuning.length
            for (var i = 0; i < len; i++) {
                // Draw tuning labels
                var name = obj.tuning[i] 
                var string_ord = notes.note_ord(name)
                var x1 = obj.padding_left / 2
                // This math is awkward but isomorphic with anything clearar
                var y = (len - i - 0.5) * obj.string_height
                obj.r.text(x1, y, name).attr('font-size', obj.font_size)

                // Draw the string
                // Remember fret 0 is the open string
                x1 = obj.padding_left + obj.fret_width
                var x2 = obj.width
                obj.r.vexLine(x1, y, x2, y).attr('stroke-width',
                                                 obj.string_stroke_width)
            }

            // Draw the neck bridge
            // Remember fret 0 is the open string, so the bridge goes between
            // frets 0 and 1
            var x = obj.padding_left + obj.fret_width
            var y1 = obj.string_height / 2
            var y2 = obj.height - obj.padding_bottom - obj.string_height / 2
            obj.r.vexLine(x, y1, x, y2).attr('stroke-width', 
                obj.bridge_stroke_width).attr('stroke-linecap',
                obj.bridge_stroke_linecap)

            // Draw frets 
            for (var i = 0; i < obj.frets; i++) {
                // Use the same y-values as the neck bridge
                var note = notes.note_name(string_ord + i)
                // Remember that fret 0 is the open string, hence the i+1
                x = obj.padding_left + (i+1) * obj.fret_width
                obj.r.vexLine(x, y1, x, y2).attr('stroke-width',
                                                 obj.fret_stroke_width)
            }

            // Draw small inlays
            for (var i = 0; i < obj.small_inlays.length; i++) {
                x = obj.padding_left + (obj.small_inlays[i] + 0.5) *
                    obj.fret_width
                var y = obj.height - obj.padding_bottom / 2
                obj.r.circle(x, y, obj.inlay_radius).attr('fill', 'black')
            }

            // Draw large inlays
            for (var i = 0; i < obj.large_inlays.length; i++) {
                x = obj.padding_left + (obj.large_inlays[i] + 0.5) *
                    obj.fret_width
                var y = obj.height - obj.padding_bottom / 2
                var r = obj.inlay_radius
                obj.r.circle(x - r - 1, y, r).attr('fill', 'black')
                obj.r.circle(x + r + 1, y, r).attr('fill', 'black')
            }

            // Precache the x,y positions of each pitch ordinal
            // Remember that strings are drawn in reverse order so mirror about
            // the x-axis
            len = obj.tuning.length
            obj.pitch_positions = {}
            for (var s = 0; s < len; s++) {
                var open_ord = notes.note_ord(obj.tuning[s])
                var y = (obj.height - obj.padding_bottom) * (len - s - 0.5) /
                        obj.tuning.length

                for (var f = 0; f < obj.frets; f++) {
                    var fret_ord = notes.interval_ord(open_ord, f)
                    var arr = obj.pitch_positions[fret_ord] || []
                    var x = obj.padding_left + (f+0.5) * obj.fret_width
                    arr.push([x, y])
                    obj.pitch_positions[fret_ord] = arr
                }
            }

            $(this).data(obj)
            return this
        },
        change: function(names) {
            var obj = $(this).data()
            obj.displayed_notes = obj.displayed_notes || []
            $.map(obj.displayed_notes, obj.animate_out)

            $.map(names, function(name) {
                positions = obj.pitch_positions[notes.note_ord(name)]
                $.map(positions, function(pos) {
                    obj.displayed_notes.push(
                        obj.r.circle(pos[0], pos[1], obj.note_radius))
                    obj.displayed_notes.push(
                        obj.r.text(pos[0], pos[1], name))
                })
            })

            $.map(obj.displayed_notes, obj.animate_in)
            $(this).data(obj)
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

