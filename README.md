# Chordimate (Chord Animate)
*Chordimate* is a jQuery plugin to display and animate chords, modes, and
scales on a guitar fretboard.

# Requires 
[jQuery](http://jquery.com), [Raphael](http://raphaeljs.com) and 
(unfortunately) Google Chrome. It just runs too slow in Firefox and Opera.

# Usage
``` javascript
    $(function() {
        $('#fretboard').chordimate()

        // Right now the plugin pollutes the global namespace with `notes`
        var c_maj = notes.make_scale('C', 'major')
        var g_min = notes.make_scale('G', 'minor', 'desc')

        $('#cmajor').click(function() {
            $('#fretboard').chordimate('change', c_maj)
        })
        $('#gmin').click(function() {
            $('#fretboard').chordimate('change', g_min)
        })
    })
```

# Motivation
I don't claim that traditional music notation is dead, but its learning curve
is steep. Tablature is more acessable, but it's limited:

* It only notates one fret position per string at a time
* It tries to mimic traditional notation where each note is prescribed. This
  can lead to an awful ocean of numerals, wherein locating differences is
  difficult.
* It's very difficult to synthesize any scale from the notes.
* It doesn't offer a particularly good way to indicate changes.

*Chordimate* tries to solve these things and encourage improvisation even if
you don't know Myxolyidian mode or how to spell a Cmin#7b9.

The display is something like [Guitar Chord Generator]() but this project
doesn't claim to be an authority on any theory beyond the dead-simple. The idea
here is to assist the creative process, not to suggest or impose anything. The
user could, for example:

1. Write a song
2. Spell the chords
3. Fit those chords into scales or modes
4. Type those chords into *Chordimate* and line up the timing.
5. Send that score to the rest of the band



[MIT License](http://www.opensource.org/licenses/mit-license.php)

