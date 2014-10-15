/**
 * colorpicker.js - MooTools Color Picker class
 * @version 0.0.1
 *
 * depends Mootools.js ~1.4.5
 */

var ColorPicker = new Class({

  Implements: Options,

  tpl: '<div class="colpick_color">' +
          '<div class="colpick_color_overlay1">' +
            '<div class="colpick_color_overlay2">' +
              '<div class="colpick_selector_outer">' +
               '<div class="colpick_selector_inner"></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="colpick_hue">' +
          '<div class="colpick_hue_arrs">' +
            '<div class="colpick_hue_larr"></div>' +
            '<div class="colpick_hue_rarr"></div>' +
          '</div>' +
        '</div>' +
        '<div class="colpick_hex_field">' +
          '<input type="text" />' +
        '</div>' +
        '<div class="colpick_new_color"></div>' +
        '<div class="colpick_rgb_r colpick_field">' +
          '<input type="text" maxlength="3" size="3" />' +
        '</div>' +
        '<div class="colpick_rgb_g colpick_field">' +
          '<input type="text" maxlength="3" size="3" />' +
        '</div>' +
        '<div class="colpick_rgb_b colpick_field">' +
          '<input type="text" maxlength="3" size="3" />' +
        '</div>' +
        '<div class="colpick_hsb_h colpick_field">' +
          '<input type="text" maxlength="3" size="3" />' +
        '</div>' +
        '<div class="colpick_hsb_s colpick_field">' +
          '<input type="text" maxlength="3" size="3" />' +
        '</div>' +
        '<div class="colpick_hsb_b colpick_field">' +
          '<input type="text" maxlength="3" size="3" />' +
        '</div>' +
        '<div class="colpick_submit"></div>',

  options: {
    color        : '3289c7',
    livePreview  : true,
    flat         : true,
    layout       : 'hex',
    showSubmit   : false,
    submitText   : 'OK',
    height       : 156,
    showEvent    : 'click',
    onBeforeShow : function(){},
    onShow       : function(){},
    onHide       : function(){},
    onChange     : function(){},
    onSubmit     : function(){},
  },

  initialize: function(el, options) {
    this.setOptions(options);
    this.el = el;

    //Set color
    var col = this.options.color;
    if (typeof col == 'string') {
      this.options.color = this.hexToHsb(col);
    } else if (col.r != undefined && col.g != undefined && col.b != undefined) {
      this.options.color = this.rgbToHsb(col);
    } else if (col.h != undefined && col.s != undefined && col.b != undefined) {
      this.options.color = this.fixHSB(col);
    } else {
      return this;
    }

    //If the element already have an ID
    if (el.get('data-colpicker-id')) return;

    // Generate and assign a random ID
    var id = 'colorpicker_' + parseInt(Math.random() * 1000);
    el.set('data-colpicker-id', id);

    // Set the tpl's ID and get the HTML
    var picker = this.picker = new Element('div', {
      'id': id,
      'class': 'colpick colpick_' + this.options.layout + (this.options.showSubmit ? '' : ' colpick_' + this.options.layout + '_ns'),
      'html': this.tpl
    });

    // Setup submit button
    picker.getElement('.colpick_submit').set('text', this.options.submitText).addEvent('click', this.clickSubmit.bind(this));

    // Setup input fields
    this.options.fields = picker.getElements('input').addEvents({
      focus: this.focus.bind(this),
      change: function(ev) {
        this.change.apply(ev.target, [this]);
      }.bind(this)
    });

    // Setup hue selector
    this.options.selector = picker.getElement('.colpick_color').addEvent('mousedown', this.downSelector.bind(this));
    this.options.selectorIndic = this.options.selector.getElement('.colpick_selector_outer');

    // Store parts of the plugin
    this.options.el = el;
    this.options.hue = picker.getElement('.colpick_hue_arrs');
    var huebar = this.options.hue.getParent();

    // Paint the hue bar
    var isIE = Browser.ie;
    var ngIE = isIE && Browser.version < 10;
    var stops = ['#ff0000','#ff0080','#ff00ff','#8000ff','#0000ff','#0080ff','#00ffff','#00ff80','#00ff00','#80ff00','#ffff00','#ff8000','#ff0000'];
    if (ngIE) {
      var i, div;
      for(i=0; i<=11; i++) {
        div = new Element('div', {
          styles: {
            height: '8.333333%',
            filter: 'progid:DXImageTransform.Microsoft.gradient(GradientType=0,startColorstr='+stops[i]+', endColorstr='+stops[i+1]+');',
            '-ms-filter': 'progid:DXImageTransform.Microsoft.gradient(GradientType=0,startColorstr='+stops[i]+', endColorstr='+stops[i+1]+');',
          }
        });
        huebar.grab(div);
      }
    } else {
      var stopList = stops.join(',');
      huebar.setStyle('background', '-webkit-linear-gradient(top,'+stopList+')')
            .setStyle('background', '-moz-linear-gradient(top,'+stopList+')')
            .setStyle('background', '-ms-linear-gradient(top,'+stopList+')')
            .setStyle('background', '-o-linear-gradient(top,'+stopList+')')
            .setStyle('background', 'linear-gradient(to bottom,'+stopList+')');
    }

    picker.getElement('.colpick_hue').addEvent('mousedown', this.downHue.bind(this));
    this.options.newColor = picker.getElement('.colpick_new_color');

    // Store options and fill with default color
    this.fillRGBFields(this.options.color);
    this.fillHSBFields(this.options.color);
    this.fillHexFields(this.options.color);
    this.setSelector(this.options.color);
    this.setHue(this.options.color);
    this.setColor(this.options.color);

    // Append to body if flat=false, else show in place
    if (this.options.flat) {
      picker.inject(el).setStyles({
        position: 'relative',
        display: 'block'
      });
    } else {
      picker.inject(document.body).setStyles({
        position: 'absolute'
      });
      el.addEvent(this.options.showEvent, this.show.bind(this));
    }
  },

  // Fix the values if the user enters a negative or high value
  fixHSB: function (hsb) {
    return {
      h: Math.min(360, Math.max(0, hsb.h)),
      s: Math.min(100, Math.max(0, hsb.s)),
      b: Math.min(100, Math.max(0, hsb.b))
    };
  },

  fixRGB: function (rgb) {
    return {
      r: Math.min(255, Math.max(0, rgb.r)),
      g: Math.min(255, Math.max(0, rgb.g)),
      b: Math.min(255, Math.max(0, rgb.b))
    };
  },

  fixHex: function (hex) {
    var len = 6 - hex.length;
    if (len > 0) {
      var o = [];
      for (var i=0; i<len; i++) {
        o.push('0');
      }
      o.push(hex);
      hex = o.join('');
    }
    return hex;
  },

  // Color space convertions
  hexToRgb: function (hex) {
    var hex = parseInt(((hex.indexOf('#') > -1) ? hex.substring(1) : hex), 16);
    return {r: hex >> 16, g: (hex & 0x00FF00) >> 8, b: (hex & 0x0000FF)};
  },

  hexToHsb: function (hex) {
    return this.rgbToHsb(this.hexToRgb(hex));
  },

  rgbToHsb: function (rgb) {
    var hsb = {h: 0, s: 0, b: 0};
    var min = Math.min(rgb.r, rgb.g, rgb.b);
    var max = Math.max(rgb.r, rgb.g, rgb.b);
    var delta = max - min;
    hsb.b = max;
    hsb.s = max != 0 ? 255 * delta / max : 0;
    if (hsb.s != 0) {
      if (rgb.r == max) hsb.h = (rgb.g - rgb.b) / delta;
      else if (rgb.g == max) hsb.h = 2 + (rgb.b - rgb.r) / delta;
      else hsb.h = 4 + (rgb.r - rgb.g) / delta;
    } else hsb.h = -1;
    hsb.h *= 60;
    if (hsb.h < 0) hsb.h += 360;
    hsb.s *= 100/255;
    hsb.b *= 100/255;
    return hsb;
  },

  hsbToRgb: function (hsb) {
    var rgb = {};
    var h = hsb.h;
    var s = hsb.s*255/100;
    var v = hsb.b*255/100;
    if (s == 0) {
      rgb.r = rgb.g = rgb.b = v;
    } else {
      var t1 = v;
      var t2 = (255-s)*v/255;
      var t3 = (t1-t2)*(h%60)/60;
      if(h==360) h = 0;
      if(h<60) {rgb.r=t1; rgb.b=t2; rgb.g=t2+t3}
      else if(h<120) {rgb.g=t1; rgb.b=t2; rgb.r=t1-t3}
      else if(h<180) {rgb.g=t1; rgb.r=t2; rgb.b=t2+t3}
      else if(h<240) {rgb.b=t1; rgb.r=t2; rgb.g=t1-t3}
      else if(h<300) {rgb.b=t1; rgb.g=t2; rgb.r=t2+t3}
      else if(h<360) {rgb.r=t1; rgb.g=t2; rgb.b=t1-t3}
      else {rgb.r=0; rgb.g=0; rgb.b=0}
    }
    return {r:Math.round(rgb.r), g:Math.round(rgb.g), b:Math.round(rgb.b)};
  },

  rgbToHex: function (rgb) {
    var hex = [
      rgb.r.toString(16),
      rgb.g.toString(16),
      rgb.b.toString(16)
    ];
    hex.each(function (val, nr) {
      if (val.length == 1) {
        hex[nr] = '0' + val;
      }
    });
    return hex.join('');
  },

  hsbToHex: function (hsb) {
    return this.rgbToHex(this.hsbToRgb(hsb));
  },

  //Fill the inputs of the plugin
  fillRGBFields: function (hsb) {
    var rgb = this.hsbToRgb(hsb);
    this.options.fields[1].set('value', rgb.r)
    this.options.fields[2].set('value', rgb.g)
    this.options.fields[3].set('value', rgb.b)
  },
  fillHSBFields: function (hsb) {
    this.options.fields[4].set('value', Math.round(hsb.h))
    this.options.fields[5].set('value', Math.round(hsb.s))
    this.options.fields[6].set('value', Math.round(hsb.b))
  },
  // Fill Hex input field
  fillHexFields: function (hsb) {
    this.options.fields[0].set('value', '#'+this.hsbToHex(hsb));
  },

  // Set the round selector position
  setSelector: function (hsb) {
    this.options.selector.setStyle('backgroundColor', '#' + this.hsbToHex({h: hsb.h, s: 100, b: 100}));
    this.options.selectorIndic.setStyles({
      left: parseInt(this.options.height * hsb.s/100, 10),
      top: parseInt(this.options.height * (100-hsb.b)/100, 10)
    });
  },

  // Set the hue selector position
  setHue: function (hsb) {
    this.options.hue.setStyle('top', parseInt(this.options.height - this.options.height * hsb.h/360, 10));
  },

  setColor: function (hsb) {
    this.options.newColor.setStyle('backgroundColor', '#' + this.hsbToHex(hsb));
  },

  // Called when the new color is changed
  change: function (thisClass) {
    var col;
    var className = this.getParent().className;
    if (className.indexOf('_hex') > 0) {
      thisClass.options.color = col = thisClass.hexToHsb(thisClass.fixHex(this.get('value')));
      thisClass.fillRGBFields(col);
      thisClass.fillHSBFields(col);
    } else if (className.indexOf('_hsb') > 0) {
      thisClass.options.color = col = thisClass.fixHSB({
        h: parseInt(thisClass.options.fields[4].get('value'), 10),
        s: parseInt(thisClass.options.fields[5].get('value'), 10),
        b: parseInt(thisClass.options.fields[6].get('value'), 10)
      });
      thisClass.fillRGBFields(col);
      thisClass.fillHexFields(col);
    } else {
      thisClass.options.color = col = thisClass.rgbToHsb(thisClass.fixRGB({
        r: parseInt(thisClass.options.fields[1].get('value'), 10),
        g: parseInt(thisClass.options.fields[2].get('value'), 10),
        b: parseInt(thisClass.options.fields[3].get('value'), 10)
      }));
      thisClass.fillHexFields(col);
      thisClass.fillHSBFields(col);
    }

    thisClass.setSelector(col);
    thisClass.setHue(col);
    thisClass.setColor(col);
    thisClass.options.onChange.apply(thisClass.el, [thisClass.hsbToHex(col), thisClass.hsbToRgb(col), col]);
  },

  focus: function () {
    this.options.fields[0].getParent().removeClass('colpick_focus');
    this.options.fields[0].addClass('colpick_focus');
  },

  // Hue slider functions
  downHue: function (ev) {
    var thisClass = this;
    var el = thisClass.el.getElement('.colpick_hue');
    var pageY = ev.event.pageY;

    thisClass._hueOffsetY = el.getCoordinates().top;
    thisClass._upHue = thisClass.upHue.bind(thisClass);
    thisClass._moveHue = thisClass.moveHue.bind(thisClass);

    document.addEvent('mouseup', thisClass._upHue);
    el.addEvent('mousemove', thisClass._moveHue);

    var value = parseInt(360*(thisClass.options.height - (pageY - thisClass._hueOffsetY))/thisClass.options.height, 10);
    thisClass.change.apply(
      thisClass.options.fields[4].set('value', value),
      [thisClass]
    );
    ev.stop();
  },

  moveHue: function (ev) {
    var thisClass = this;
    var pageY = ev.event.pageY;
    var value = parseInt(360*(thisClass.options.height - Math.max(0, Math.min(thisClass.options.height, (pageY - thisClass._hueOffsetY))))/thisClass.options.height, 10);
    thisClass.change.apply(
      thisClass.options.fields[4].set('value', value),
      [thisClass]
    );
    ev.stop();
  },

  upHue: function (ev) {
    var thisClass = this;
    thisClass.fillRGBFields(thisClass.options.color);
    thisClass.fillHexFields(thisClass.options.color);

    document.removeEvent('mouseup', thisClass._upHue);
    thisClass.el.getElement('.colpick_hue').removeEvent('mousemove', thisClass._moveHue);
    delete thisClass._hueOffsetY;
    ev.stop();
  },

  // Color selector functions
  downSelector: function (ev) {
    var thisClass = this;
    var el = thisClass.el.getElement('.colpick_color');
    var pos = thisClass._pos = el.getCoordinates();

    thisClass._upSelector = thisClass.upSelector.bind(thisClass);
    thisClass._moveSelector = thisClass.moveSelector.bind(thisClass);

    document.addEvent('mouseup', thisClass._upSelector);
    el.addEvent('mousemove', thisClass._moveSelector);

    var pageX = ev.event.pageX;
    var pageY = ev.event.pageY;
    thisClass.options.fields[5].set('value', parseInt(100*(pageX - pos.left)/thisClass.options.height, 10));
    thisClass.options.fields[6].set('value', parseInt(100*(thisClass.options.height - (pageY - pos.top))/thisClass.options.height, 10));

    thisClass.change.apply(
      thisClass.options.fields[5],
      [thisClass]
    );
    ev.stop();
  },

  moveSelector: function (ev) {
    var thisClass = this;
    var pageX = ev.event.pageX;
    var pageY = ev.event.pageY;
    var pos = thisClass._pos;

    thisClass.options.fields[5].set('value', parseInt(100*(Math.max(0, Math.min(thisClass.options.height, (pageX - pos.left))))/thisClass.options.height, 10));
    thisClass.options.fields[6].set('value', parseInt(100*(thisClass.options.height - Math.max(0,Math.min(thisClass.options.height, (pageY - pos.top))))/thisClass.options.height, 10));

    thisClass.change.apply(
      thisClass.options.fields[5],
      [thisClass]
    );
    ev.stop();
  },

  upSelector: function (ev) {
    var thisClass = this;
    thisClass.fillRGBFields(thisClass.options.color);
    thisClass.fillHexFields(thisClass.options.color);

    document.removeEvent('mouseup', thisClass._upSelector);
    thisClass.el.getElement('.colpick_color').removeEvent('mousemove', thisClass._moveSelector);
    ev.stop();
  },

  // Submit button
  clickSubmit: function () {
    var thisClass = this;
    var col = thisClass.options.color;
    thisClass.options.onSubmit(thisClass.hsbToHex(col), thisClass.hsbToRgb(col), col, thisClass.el);
  },

  // Show/hide the color picker
  show: function (ev) {
    // Prevent the trigger of any direct parent
    ev.stop();

    var thisClass = this;
    var el = ev.target;

    thisClass.options.onBeforeShow.apply(thisClass.el, thisClass.el);

    var pos = el.getCoordinates();
    var top = pos.top + el.offsetHeight;
    var left = pos.left;
    var viewPort = thisClass.getViewport();
    var _width = thisClass.el.getSize().x;
    if (left + _width > viewPort.l + viewPort.w) {
      left -= _width;
    }
    thisClass.el.setStyles({left: left + 'px', top: top + 'px'});
    if (thisClass.options.onShow.apply(thisClass.el, thisClass.el) != false) {
      thisClass.el.show();
    }

    thisClass._hide = thisClass.hide.bind(thisClass);

    // Hide when user clicks outside
    document.addEvent('mousedown', thisClass._hide);
    thisClass.el.addEvent('mousedown', function(ev){ ev.stopPropagation(); });
  },

  hide: function (ev) {
    var thisClass = this;
    if (thisClass.options.onHide.apply(thisClass.el, thisClass.el) != false) {
      thisClass.el.hide();
    }

    document.removeEvent('mousedown', thisClass._hide);
  },

  getViewport: function () {
    var m = document.compatMode == 'CSS1Compat';
    return {
      l : window.pageXOffset || (m ? document.documentElement.scrollLeft : document.body.scrollLeft),
      w : window.innerWidth || (m ? document.documentElement.clientWidth : document.body.clientWidth)
    };
  },

});
