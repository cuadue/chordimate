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

// TODO possibly draw the frets to scale:
//      https://github.com/grimmdude/Raphael-Guitar

Array.prototype.diff = function(a) {
    return this.filter(function(i) { return a.indexOf(i) < 0 });
};


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
                font_size: 20,
                bridge_stroke_width: 10,
                bridge_stroke_linecap: 'round',
                line_stroke_width: 2,
                note_radius: 15,
                circle_start: {opacity: 0, fill: '#ccc'},
                label_start: {opacity: 0, fill: 'black'},
                animate_in: function(e) {
                    e.animate({opacity: 0.7, transform: 's1,1'}, 200, 'linear')
                },
                animate_out: function(e) {
                    e.animate({opacity: 0, transform: 's0.2'}, 200, 'linear')
                }
            }, options)

            obj.tuning = notes.parse_notes(obj.tuning)
            obj.string_height = (obj.height - obj.padding_bottom) / obj.tuning.length
            obj.fret_width = (obj.width - obj.padding_left) / obj.frets

            // this[0] is the native DOM element
            obj.r = Raphael(this[0], obj.width, obj.height)

            function text(x, y, t, size) {
                return obj.r.text(x, y, t).attr('font-size', (size || 1) * obj.font_size)
            }

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
                text(x1, y, name)

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
                var y = (obj.height - obj.padding_bottom) / 2
                obj.r.circle(x, y, obj.inlay_radius).attr('fill', 'black')
            }

            // Draw large inlays
            for (var i = 0; i < obj.large_inlays.length; i++) {
                x = obj.padding_left + (obj.large_inlays[i] + 0.5) *
                    obj.fret_width
                var y = (obj.height - obj.padding_bottom) / 2
                var r = obj.inlay_radius
                obj.r.circle(x, y - obj.string_height, r).attr('fill', 'black')
                obj.r.circle(x, y + obj.string_height, r).attr('fill', 'black')
            }

            function default_list_push(arr, key, val) {
                list = arr[key] || []
                list.push(val)
                arr[key] = list
            }

            function make_label(ord, x, y, desc) {
                var name = notes.note_name(ord, desc)
                var label = text(x, y, name)
                label.attr(obj.label_start)
                default_list_push(obj.label_by_name, name, label)
            }

            // Create the dots and labels
            // Remember that strings are drawn in reverse order so mirror the
            // positions about the x-axis
            len = obj.tuning.length
            obj.dots_by_ord = {}
            obj.label_by_name = {}
            for (var s = 0; s < len; s++) {
                var open_ord = notes.note_ord(obj.tuning[s])
                var y = (obj.height - obj.padding_bottom) * (len - s - 0.5) /
                        obj.tuning.length

                for (var f = 0; f < obj.frets; f++) {
                    var fret_ord = notes.interval_ord(open_ord, f)
                    var x = obj.padding_left + (f + 0.5) * obj.fret_width

                    var dot = obj.r.circle(x, y, obj.note_radius)
                    dot.attr(obj.circle_start)
                    default_list_push(obj.dots_by_ord, fret_ord, dot)
                    
                    make_label(fret_ord, x, y)
                    make_label(fret_ord, x, y, 'desc')
                }
            }

            $(this).data(obj)
            return this
        },
        change: function(new_names) {
            var new_ords = notes.note_ords(new_names)

            var obj = $(this).data()
            var old_names = obj.scale_names || []
            var old_ords = notes.note_ords(old_names)

            function apply_diff(left, right, list, fn) {
                $.map(
                    $.map(left.diff(right), function(key) {
                        return list[key]
                    }), 
                    function(l) {
                        if ($.isArray(l))
                            $.map(l, fn)
                        else
                            fn(l)
                    })
            }
            
            apply_diff(old_names, new_names, obj.label_by_name,
                        obj.animate_out)
            apply_diff(new_names, old_names, obj.label_by_name,
                        obj.animate_in)

            apply_diff(old_ords, new_ords, obj.dots_by_ord,
                        obj.animate_out)
            apply_diff(new_ords, old_ords, obj.dots_by_ord,
                        obj.animate_in)

            obj.scale_names = new_names
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

