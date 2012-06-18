// Copyright 2012 Wes Waugh
// MIT License, see LICENSE file for details

// Requires jQuery (http://jquery.com)

Array.prototype.diff = function(a) {
    return this.filter(function(i) { return a.indexOf(i) < 0 });
};

function default_list_push(arr, key, val) {
    list = arr[key] || []
    list.push(val)
    arr[key] = list
}

var music_theory = (function() {
    // Note names are case-sensitive! This means that any `b` is a
    // flat, and any `B` is the pitch a step above A. If this proves
    // too cumbersome for a user (the author, wearing a user's cap) to
    // type, we can add another layer of interpretation.
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
            desc = desc && desc || root[1] === 'b'
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
})(); // Why do I need a semicolon here?

// The chordimate jQuery plugin
(function($) {
    methods = {
        init: function(options) {
            var obj = $.extend({
                tuning: 'e a d g b e',
                num_frets: 15,
                inlays: [1, 3, 5, 7, 9, 12, 15, 19]
            }, options)

            // Want to keep all positions in % and let the DOM handle
            // everything possible

            // Don't want to store any real state in `this` because the object
            // isn't preserved between calls to jQuery. So, it goes in another
            // object which is stored and retrieved with $.data()
            obj.tuning = music_theory.parse_notes(obj.tuning)

            // String height in percent of element size
            obj.string_height = 1 / obj.tuning.length

            // d = s (1 - 2 ^ (-n/12))
            // Scale length is the physical length of the string. We don't
            // literally draw that dimension, but we want to fill the entire
            // width of the element. The number is used in the calculation for
            // distance from the bridge as a function of fret number (see
            // fret_position function)
            obj.scale_length = 1 / (1 - Math.pow(2, -(obj.num_frets)/12))
            function fret_position(fret_num) { 
                // The fret_num-1 here is for pretty display only! It shifts
                // the bridge to the element left instead of leaving a
                // great big gap.
                return obj.scale_length * (1 - Math.pow(2, -(fret_num - 1)/12.0)) *
                    100
            }
            function fret_space(fret_left, fret_right) {
                return fret_position(fret_right) - fret_position(fret_left)
            }

            // Done initializing the settings
            this.data(obj)

            this.css({ position: 'relative' })
            var $that = this

            var z_index = 1;
            function div(cls, css) {
                var $el = $('<div/>', { class: cls }).css({
                    position: 'absolute',
                    // Cargo cult: I have no good reason this would be needed
                    'z-index': z_index++
                }).css(css)
                $that.append($el)
                return $el
            }

            // Put the background texture
            div('bg', {
                left: fret_position(1) + '%',
                top: 0,
                width: fret_space(1, obj.num_frets + 1) + '%',
                height: '100%'
            })

            // Put frets 
            for (var i = 0; i < obj.num_frets; i++) {
                div('fret', {
                    // Remember that fret 0 is the open string, hence the i+1
                    left: fret_position(i + 1) + '%',
                })
            }

            // Put the neck bridge
            // Remember fret 0 is the open string, so the bridge goes between
            // frets 0 and 1
            var fret_top = obj.string_height / 2 * 100 + '%'
            var fret_height = (1 - obj.string_height) * 100 + '%'
            div('bridge', {
                left: fret_position(1) + '%',
                top: 0, 
                height: '100%'
            })

            // Put inlays
            $.map(obj.inlays, function(f) {
                if (f > obj.num_frets) return
                var w = (fret_position(f + 1) - fret_position(f)) * 0.5;
                div('inlay', {
                    left: (fret_position(f) + fret_position(f + 1) - w) / 2 + '%',
                    width: w + '%'
                })
            })
                        
            // Each guitar string
            var len = obj.tuning.length
            $.each(obj.tuning, function(i, open_name) {
                var open_ord = music_theory.note_ord(open_name)

                var y = (len - i - 0.5) * obj.string_height * 100

                // Put tuning label
                div('tuning-label', {
                    left: 0,
                    top: y + '%',
                }).text(open_name)
                
                // Rough estimate, since it's pretty subjective
                var str_h = (len - i + 1) / 3
                // Put the guitar string. Remember fret 0 is the open string
                div('string', {
                    left: fret_position(1) + '%',
                    top: (y - str_h / 2) + '%',
                    height: str_h + '%',
                    width: fret_space(1, obj.num_frets + 1) + '%',
                })

                // Create the note labels. Remember that strings are drawn in
                // reverse order so mirror the positions about the x-axis
                for (var f = 0; f < obj.num_frets; f++) {
                    // Finger just barely overlaps the fret
                    var x = fret_position(f + 1) + '%'

                    div('note-label', {
                        left: x,
                        top: y + '%',
                    }).attr({
                        'data-ordinal': music_theory.interval_ord(open_ord, f)
                    }).hide()
                }
            })

            // Put the fadeout after the last fret
            div('fadeout', {
                top: 0,
                height: '100%',
                right: 0,
                left: fret_position(obj.num_frets) + '%'
            })

            return this
        },
        change: function(new_names) {
            if (typeof new_names == 'string')
                new_names = music_theory.parse_notes(new_names)
            var obj = $(this).data()
            var old_ords = obj.scale_ords || []
            var new_ords = $.map(new_names, music_theory.note_ord)

            var that = $(this)
            function $el_with_ord(ord) {
                return that.find('[data-ordinal=' + ord + ']')
            }
            
            $.map(old_ords.diff(new_ords), function(ord) {
                $el_with_ord(ord).fadeOut()
            })

            $.map(new_ords.diff(old_ords), function(ord) {
                $el_with_ord(ord).fadeIn()
            })

            $.map(new_names, function(name) {
                $el_with_ord(music_theory.note_ord(name)).text(name)
            })


            obj.scale_ords = new_ords
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
    var asc_names = music_theory.parse_notes('c c# d d# e f f# g g# a a# b')
    // .. and descending
    var desc_names = music_theory.parse_notes('c db d eb e f gb g ab a bb b')
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
})(jQuery)

