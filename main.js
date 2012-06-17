// Copyright 2012 Wes Waugh
// MIT License, see LICENSE file for details

// Requires notes.js which adds `notes` to the global object
// Requires jQuery (http://jquery.com)
// Requires Raphael (http://raphaeljs.com)
// Thanks to Mohit Muthanna Cheppudira! (http://0xfe.blogspot.com)

// Note names are case-sensitive! This means that any `b` is a
// flat, and any `B` is the pitch a step above A. If this proves
// too cumbersome for a user (the author, wearing a user's cap) to
// type, we can add another layer of interpretation.

// Add a simple line method to Raphael.
Raphael.prototype.vexLine = function(x, y, new_x, new_y) {
    return this.path("M" + x + " " + y + "L" + new_x + " " + new_y);
}

Array.prototype.diff = function(a) {
    return this.filter(function(i) { return a.indexOf(i) < 0 });
};


!function($) {
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
        },
        init: function(options) {
            var obj = $.extend({
                width: 1000,
                height: 200,
                tuning: 'e a d g b e',
                num_frets: 17,
                fret_attr: {
                    'stroke-linecap': 'round',
                    'stroke-width': 5,
                     stroke: '#444',
                },
                small_inlays: [3, 5, 7, 9, 15],
                large_inlays: [12],
                inlay_attr: {
                    stroke: '',
                    fill: '#eee'
                },
                inlay_radius: 7,
                padding_left: 30,
                padding_bottom: 0,
                font_size: 13,
                bridge_attr: {
                    'stroke-linecap': 'round',
                    'stroke-width': 10,
                },
                note_radius: 13,
                circle_start: {
                    opacity: 0, 
                    fill: '#392'
                },
                label_start: {
                    opacity: 0, 
                    fill: 'white'
                },
                animate_in: function(e) {
                    e.animate({
                        opacity: 0.7, 
                        transform: 's1,1'
                    }, 200, 'linear')
                },
                animate_out: function(e) {
                    e.animate({
                        opacity: 0, 
                        transform: 's0.2'
                    }, 200, 'linear')
                }
            }, options)

            // Don't want to store any real state in `this` because the object
            // isn't preserved between calls to jQuery. So, it goes in another
            // object which is stored and retrieved with $.data()

            obj.tuning = methods.parse_notes(obj.tuning)
            obj.string_height = (obj.height - obj.padding_bottom) / obj.tuning.length

            // d = s (1 - 2 ^ (-n/12))
            function rel_fret_position(fret_num) { 
                return 1 - Math.pow(2, -fret_num/12.0)
            }

            // Scale length is the physical length of the string. We don't
            // literally draw that dimension, but we want to fill the entire
            // width of our canvas
            // Scale length is used in the calculation for distance from the
            // bridge as a function of fret number (see fret_position)
            obj.scale_length = (obj.width - obj.padding_left) / 
                               (1 - Math.pow(2, -obj.num_frets/12))

            function fret_position(fret_num) {
                // Equation for fret position d
                return obj.scale_length * (1 - Math.pow(2, -fret_num/12))
            }

            function fret_midpoint(n) {
                // Where to place the circle
                return (fret_position(n) + fret_position(n+1)) / 2
            }

            // this[0] is the native DOM element
            obj.r = Raphael(this[0], obj.width, obj.height)

            function text(x, y, t, size) {
                return obj.r.text(x, y, t).attr('font-size', (size || 1) * obj.font_size)
            }

            // Draw static
            if (obj.bg_texture) {
                var x = obj.padding_left + fret_position(1)
                    y = obj.string_height/2,
                    w = obj.width - x
                    h = obj.height - obj.padding_bottom - obj.string_height
                obj.r.image(obj.bg_texture, x, y, w, h)
            }
                        
            // Each string
            var len = obj.tuning.length
            for (var i = 0; i < len; i++) {
                // Draw tuning labels
                var name = obj.tuning[i] 
                var string_ord = methods.note_ord(name)
                var x1 = obj.padding_left / 2
                // This math is awkward but isomorphic with anything clearar
                var y = (len - i - 0.5) * obj.string_height
                text(x1, y, name)

                // Draw the string
                // Remember fret 0 is the open string
                x1 = obj.padding_left + fret_position(1)
                var x2 = obj.width
                obj.r.vexLine(x1, y, x2, y).attr('stroke-width',
                                                 obj.string_stroke_width)
            }

            // Draw the neck bridge
            // Remember fret 0 is the open string, so the bridge goes between
            // frets 0 and 1
            var x = obj.padding_left + fret_position(1)
            var y1 = obj.string_height / 2
            var y2 = obj.height - obj.padding_bottom - obj.string_height / 2
            obj.r.vexLine(x, y1, x, y2).attr(obj.bridge_attr)

            // Draw frets 
            for (var i = 0; i < obj.num_frets; i++) {
                // Use the same y-values as the neck bridge
                var note = methods.note_name(string_ord + i)
                // Remember that fret 0 is the open string, hence the i+1
                x = obj.padding_left + fret_position(i + 1)
                obj.r.vexLine(x, y1, x, y2).attr(obj.fret_attr)
            }

            // Draw small inlays
            for (var i = 0; i < obj.small_inlays.length; i++) {
                var fret_num = obj.small_inlays[i] 
                x = obj.padding_left + fret_midpoint(fret_num)
                var y = (obj.height - obj.padding_bottom) / 2
                obj.r.circle(x, y, obj.inlay_radius).attr(obj.inlay_attr)
            }

            // Draw large inlays
            for (var i = 0; i < obj.large_inlays.length; i++) {
                var fret_num = obj.large_inlays[i] 
                x = obj.padding_left + fret_midpoint(fret_num)

                var y = (obj.height - obj.padding_bottom) / 2
                var r = obj.inlay_radius
                obj.r.circle(x, y - obj.string_height, r).attr(obj.inlay_attr)
                obj.r.circle(x, y + obj.string_height, r).attr(obj.inlay_attr)
            }

            function default_list_push(arr, key, val) {
                list = arr[key] || []
                list.push(val)
                arr[key] = list
            }

            function make_label(ord, x, y, desc) {
                var name = methods.note_name(ord, desc)
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
                var open_ord = methods.note_ord(obj.tuning[s])
                var y = (obj.height - obj.padding_bottom) * (len - s - 0.5) /
                        obj.tuning.length

                for (var f = 0; f < obj.num_frets; f++) {
                    var fret_ord = methods.interval_ord(open_ord, f)
                    var x = obj.padding_left + fret_midpoint(f)

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
            var new_ords = methods.note_ords(new_names)

            var obj = $(this).data()
            var old_names = obj.scale_names || []
            var old_ords = methods.note_ords(old_names)

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
        },
        clear: function() {
            return $(this).chordimate('change', [])
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

