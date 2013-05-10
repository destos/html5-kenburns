#!
# * Kenburns effect implemented in HTML5 Canvas + jQuery + CoffeeScript
# * https://github.com/firmanw/html5-kenburns
# * http://labs.firmanw.com/html5-kenburns
# *
# * Licensed under MIT License http://opensource.org/licenses/mit-license.php
# * Copyright (c) 2012 Codapixa
# *
# * Version: 0.1
# * Authors: Firman W <me@firmanw.com>, Patrick Forringer <pat@forringer.com>
# 

class Kenburns 
    constructor: (@canvas, options) ->
        @options = $.extend({}, @defaults, options)
        # TODO: load images
        for image in @options.images
            @images.push
                path: image
                initialized: false
                loaded: false

        # @options.duration = duration 
        @options.fade_time = Math.min(@options.duration / 2, @options.fade_time || 1000)
        @options.solid_time = @options.duration - (@options.fade_time * 2)

        # Set the canvas dimension
        @canvas.width = @options.width
        @canvas.height = @options.height
        @context = @canvas.getContext("2d")
        @

    defaults:
        duration: 7000
        width: 940
        height: 360
        align: "random"
        zoom: 1.1
        debug: false

    canvas: null
    images: []
    interval: null
    state: "init"
    time: 0
    scale: 1
    aligns: ["top", "left", "center", "bottom", "right"] # alignments

    get_image_info: (index, load_callback) ->
        self = @
        info = @images[index]
        if not info.initialized
            image = new Image()
            info.image = image
            info.loaded = false
            info.reset_scale = ->
                @scale = 1
            info.select_alignment = ->
                if self.options.align is "random"
                    @align = self.aligns[Math.floor(Math.random() * self.aligns.length)]
                else
                    @align = self.options.align
            image.onload = =>
                info.loaded = true
                info.width = @canvas.width
                info.height = Math.floor((@canvas.width / image.width) * image.height)
                info.x = (info.width - @canvas.width) / 2 * -1
                info.y = (info.height - @canvas.height) / 2 * -1
                info.reset_scale()
                info.select_alignment()
                if load_callback
                    load_callback()

            info.initialized = true
            image.src = info.path
        return info

    _get_time: ->
        new Dat
        e().getTime() - @start_time

    _log: (msg) ->
        console.log "jQuery.kenburns > %s", msg  if @options.debug

    start: ->
        @exec()

    scaling: (info) ->
        sw = Math.floor(info.width * info.scale)
        sh = Math.floor(info.height * info.scale)
        a = @align(info.x, info.y, info.width, info.height, sw, sh, info.align)
       
        return {
            x: a.x
            y: a.y
            width: sw
            height: sh
        }

    align: (ax, ay, aw, ah, sw, sh, alignment) ->
        dx = dy = 0
        switch alignment
            when "top"
                dx = (sw - aw) / 2 * -1
            when "left"
                dy = (sh - ah) / 2 * -1
            when "bottom"
                dx = (sw - aw) / 2 * -1
                dy = (sh - ah) * -1
            when "right"
                dx = (sw - aw) * -1
                dy = (sh - ah) / 2 * -1
            else
                dx = (sw - aw) / 2 * -1
                dy = (sh - ah) / 2 * -1
        x: ax + dx
        y: ay + dy

    exec: ->
        return if @state is "animated"
       
        ctx = @context
       
        timer = (time) ->
            new Date().getTime() - time

        wrap_index = (i) =>
            (i + @images.length) % @images.length

        @time = timer(0) if @time is 0

        @state = "animated"
       
        cur_frame = null
       
        @interval = setInterval =>
            update_time = timer(@time)

            top_frame = Math.floor(update_time / (@options.duration - @options.fade_time))
            top_index = wrap_index(top_frame)
            frame_start_time = top_frame * (@options.duration - @options.fade_time)
           
            passed = update_time - frame_start_time

            if (passed < @options.fade_time)
                bottom_frame = top_frame - 1
                bottom_frame_start_time = frame_start_time - @options.duration + @options.fade_time
                bottom_passed = update_time - bottom_frame_start_time
                if not (update_time < @options.fade_time)
                    @render_image(wrap_index(bottom_frame), bottom_passed / @options.duration, 1)

            @render_image(top_index, passed / @options.duration, passed / @options.fade_time)
           
            # Pre-load the next image in the sequence, so it has loaded by the time we get to it
            if @options.frame_change and cur_frame isnt top_index
                preload_image = wrap_index(top_frame + 1)
                info = @get_image_info(preload_image)
                # reset scale and alignment
                info.reset_scale()
                info.select_alignment()
                @options.frame_change(top_index, info)
                cur_frame = top_index
        , 30

    render_image: (index, anim, fade) ->
        # Renders a frame of the effect
        return if anim > 1
        info = @get_image_info(index)
        if (info.loaded)
            transparency = Math.min(1, fade)
            if (transparency > 0)
                @context.globalAlpha = Math.min(1, transparency)
                # Count the scale
                info.scale += (Math.abs(@options.zoom - 1) / @options.duration) * 30
                s = @scaling(info)
                @context.drawImage info.image, 0, 0, info.width, info.height, s.x, s.y, s.width, s.height
                @context.save()
       
    set: (options) ->
        @options = $.extend(@options, options)

    reset: ->
        @time = 0
        @state = "reset"
        clearInterval @interval
        @start()

    pause: ->
        @state = "paused"
        clearInterval @interval

    stop: ->
        @time = 0
        @state = "stop"
        clearInterval @interval


(($) ->
    $.fn.kenburns = (arg) ->
        args = arguments
        @each ->
            instance = $(@).data("kenburns") or {}
            if instance[arg]
                instance[arg].apply instance, Array::slice.call(args, 1)
            else if typeof arg is "object" or not arg
                instance = new Kenburns(@, arg)
                $(@).data "kenburns", instance
            else
                $.error "Method " + arg + " does not exist on jQuery.kenburns"

)(jQuery)
