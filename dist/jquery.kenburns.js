var Kenburns;

Kenburns = (function() {

  function Kenburns(canvas, options) {
    var image, _i, _len, _ref;
    this.canvas = canvas;
    this.options = $.extend({}, this.defaults, options);
    _ref = this.options.images;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      image = _ref[_i];
      this.images.push({
        path: image,
        initialized: false,
        loaded: false
      });
    }
    this.options.fade_time = Math.min(this.options.duration / 2, this.options.fade_time || 1000);
    this.options.solid_time = this.options.duration - (this.options.fade_time * 2);
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    this.context = this.canvas.getContext("2d");
    this;

  }

  Kenburns.prototype.defaults = {
    duration: 7000,
    width: 940,
    height: 360,
    align: "random",
    zoom: 1.1,
    debug: false
  };

  Kenburns.prototype.canvas = null;

  Kenburns.prototype.images = [];

  Kenburns.prototype.interval = null;

  Kenburns.prototype.state = "init";

  Kenburns.prototype.time = 0;

  Kenburns.prototype.scale = 1;

  Kenburns.prototype.aligns = ["top", "left", "center", "bottom", "right"];

  Kenburns.prototype.get_image_info = function(index, load_callback) {
    var image, info, self,
      _this = this;
    self = this;
    info = this.images[index];
    if (!info.initialized) {
      image = new Image();
      info.image = image;
      info.loaded = false;
      info.reset_scale = function() {
        return this.scale = 1;
      };
      info.select_alignment = function() {
        if (self.options.align === "random") {
          return this.align = self.aligns[Math.floor(Math.random() * self.aligns.length)];
        } else {
          return this.align = self.options.align;
        }
      };
      image.onload = function() {
        info.loaded = true;
        info.width = _this.canvas.width;
        info.height = Math.floor((_this.canvas.width / image.width) * image.height);
        info.x = (info.width - _this.canvas.width) / 2 * -1;
        info.y = (info.height - _this.canvas.height) / 2 * -1;
        info.reset_scale();
        info.select_alignment();
        if (load_callback) {
          return load_callback();
        }
      };
      info.initialized = true;
      image.src = info.path;
    }
    return info;
  };

  Kenburns.prototype._get_time = function() {
    new Dat;
    return e().getTime() - this.start_time;
  };

  Kenburns.prototype._log = function(msg) {
    if (this.options.debug) {
      return console.log("jQuery.kenburns > %s", msg);
    }
  };

  Kenburns.prototype.start = function() {
    return this.exec();
  };

  Kenburns.prototype.scaling = function(info) {
    var a, sh, sw;
    sw = Math.floor(info.width * info.scale);
    sh = Math.floor(info.height * info.scale);
    a = this.align(info.x, info.y, info.width, info.height, sw, sh, info.align);
    return {
      x: a.x,
      y: a.y,
      width: sw,
      height: sh
    };
  };

  Kenburns.prototype.align = function(ax, ay, aw, ah, sw, sh, alignment) {
    var dx, dy;
    dx = dy = 0;
    switch (alignment) {
      case "top":
        dx = (sw - aw) / 2 * -1;
        break;
      case "left":
        dy = (sh - ah) / 2 * -1;
        break;
      case "bottom":
        dx = (sw - aw) / 2 * -1;
        dy = (sh - ah) * -1;
        break;
      case "right":
        dx = (sw - aw) * -1;
        dy = (sh - ah) / 2 * -1;
        break;
      default:
        dx = (sw - aw) / 2 * -1;
        dy = (sh - ah) / 2 * -1;
    }
    return {
      x: ax + dx,
      y: ay + dy
    };
  };

  Kenburns.prototype.exec = function() {
    var ctx, cur_frame, timer, wrap_index,
      _this = this;
    if (this.state === "animated") {
      return;
    }
    ctx = this.context;
    timer = function(time) {
      return new Date().getTime() - time;
    };
    wrap_index = function(i) {
      return (i + _this.images.length) % _this.images.length;
    };
    if (this.time === 0) {
      this.time = timer(0);
    }
    this.state = "animated";
    cur_frame = null;
    return this.interval = setInterval(function() {
      var bottom_frame, bottom_frame_start_time, bottom_passed, frame_start_time, info, passed, preload_image, top_frame, top_index, update_time;
      update_time = timer(_this.time);
      top_frame = Math.floor(update_time / (_this.options.duration - _this.options.fade_time));
      top_index = wrap_index(top_frame);
      frame_start_time = top_frame * (_this.options.duration - _this.options.fade_time);
      passed = update_time - frame_start_time;
      if (passed < _this.options.fade_time) {
        bottom_frame = top_frame - 1;
        bottom_frame_start_time = frame_start_time - _this.options.duration + _this.options.fade_time;
        bottom_passed = update_time - bottom_frame_start_time;
        if (!(update_time < _this.options.fade_time)) {
          _this.render_image(wrap_index(bottom_frame), bottom_passed / _this.options.duration, 1);
        }
      }
      _this.render_image(top_index, passed / _this.options.duration, passed / _this.options.fade_time);
      if (_this.options.frame_change && cur_frame !== top_index) {
        preload_image = wrap_index(top_frame + 1);
        info = _this.get_image_info(preload_image);
        info.reset_scale();
        info.select_alignment();
        _this.options.frame_change(top_index, info);
        return cur_frame = top_index;
      }
    }, 30);
  };

  Kenburns.prototype.render_image = function(index, anim, fade) {
    var info, s, transparency;
    if (anim > 1) {
      return;
    }
    info = this.get_image_info(index);
    if (info.loaded) {
      transparency = Math.min(1, fade);
      if (transparency > 0) {
        this.context.globalAlpha = Math.min(1, transparency);
        info.scale += (Math.abs(this.options.zoom - 1) / this.options.duration) * 30;
        s = this.scaling(info);
        this.context.drawImage(info.image, 0, 0, info.width, info.height, s.x, s.y, s.width, s.height);
        return this.context.save();
      }
    }
  };

  Kenburns.prototype.set = function(options) {
    return this.options = $.extend(this.options, options);
  };

  Kenburns.prototype.reset = function() {
    this.time = 0;
    this.state = "reset";
    clearInterval(this.interval);
    return this.start();
  };

  Kenburns.prototype.pause = function() {
    this.state = "paused";
    return clearInterval(this.interval);
  };

  Kenburns.prototype.stop = function() {
    this.time = 0;
    this.state = "stop";
    return clearInterval(this.interval);
  };

  return Kenburns;

})();

(function($) {
  return $.fn.kenburns = function(arg) {
    var args;
    args = arguments;
    return this.each(function() {
      var instance;
      instance = $(this).data("kenburns") || {};
      if (instance[arg]) {
        return instance[arg].apply(instance, Array.prototype.slice.call(args, 1));
      } else if (typeof arg === "object" || !arg) {
        instance = new Kenburns(this, arg);
        return $(this).data("kenburns", instance);
      } else {
        return $.error("Method " + arg + " does not exist on jQuery.kenburns");
      }
    });
  };
})(jQuery);
