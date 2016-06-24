// Generated by CoffeeScript 1.10.0
(function() {
  var PNG, PNGImage, zlib;

  zlib = require('zlib');

  PNG = require('png-js');

  PNGImage = (function() {
    function PNGImage(data, label) {
      this.label = label;
      this.image = new PNG(data);
      this.width = this.image.width;
      this.height = this.image.height;
      this.imgData = this.image.imgData;
      this.obj = null;
    }

    PNGImage.prototype.embed = function(document) {
      var k, len1, mask, palette, params, rgb, val, x;
      this.document = document;
      if (this.obj) {
        return;
      }
      this.obj = this.document.ref({
        Type: 'XObject',
        Subtype: 'Image',
        BitsPerComponent: this.image.bits,
        Width: this.width,
        Height: this.height,
        Filter: 'FlateDecode'
      });
      if (!this.image.hasAlphaChannel) {
        params = this.document.ref({
          Predictor: 15,
          Colors: this.image.colors,
          BitsPerComponent: this.image.bits,
          Columns: this.width
        });
        this.obj.data['DecodeParms'] = params;
        params.end();
      }
      if (this.image.palette.length === 0) {
        this.obj.data['ColorSpace'] = this.image.colorSpace;
      } else {
        palette = this.document.ref();
        palette.end(new Buffer(this.image.palette));
        this.obj.data['ColorSpace'] = ['Indexed', 'DeviceRGB', (this.image.palette.length / 3) - 1, palette];
      }
      if (this.image.transparency.grayscale) {
        val = this.image.transparency.greyscale;
        return this.obj.data['Mask'] = [val, val];
      } else if (this.image.transparency.rgb) {
        rgb = this.image.transparency.rgb;
        mask = [];
        for (k = 0, len1 = rgb.length; k < len1; k++) {
          x = rgb[k];
          mask.push(x, x);
        }
        return this.obj.data['Mask'] = mask;
      } else if (this.image.transparency.indexed) {
        return this.loadIndexedAlphaChannel();
      } else if (this.image.hasAlphaChannel) {
        return this.splitAlphaChannel();
      } else {
        return this.finalize();
      }
    };

    PNGImage.prototype.finalize = function() {
      var sMask;
      if (this.alphaChannel) {
        sMask = this.document.ref({
          Type: 'XObject',
          Subtype: 'Image',
          Height: this.height,
          Width: this.width,
          BitsPerComponent: 8,
          Filter: 'FlateDecode',
          ColorSpace: 'DeviceGray',
          Decode: [0, 1]
        });
        sMask.end(this.alphaChannel);
        this.obj.data['SMask'] = sMask;
      }
      this.obj.end(this.imgData);
      this.image = null;
      return this.imgData = null;
    };

    PNGImage.prototype.splitAlphaChannel = function() {
      var fn;
      fn = (function(_this) {
        return function(pixels) {
          var a, alphaChannel, colorByteSize, i, imgData, len, p, pixelCount;
          colorByteSize = _this.image.colors * _this.image.bits / 8;
          pixelCount = _this.width * _this.height;
          imgData = new Buffer(pixelCount * colorByteSize);
          alphaChannel = new Buffer(pixelCount);
          i = p = a = 0;
          len = pixels.length;
          while (i < len) {
            imgData[p++] = pixels[i++];
            imgData[p++] = pixels[i++];
            imgData[p++] = pixels[i++];
            alphaChannel[a++] = pixels[i++];
          }
          _this.imgData = zlib.deflateSync(imgData);
          _this.alphaChannel = zlib.deflateSync(alphaChannel);
          return _this.finalize();
        };
      })(this);
      return this.image.decodePixels(fn, true);
    };

    PNGImage.prototype.loadIndexedAlphaChannel = function() {
      var fn, transparency;
      transparency = this.image.transparency.indexed;
      fn = (function(_this) {
        return function(pixels) {
          var alphaChannel, i, j, k, ref;
          alphaChannel = new Buffer(_this.width * _this.height);
          i = 0;
          for (j = k = 0, ref = pixels.length; k < ref; j = k += 1) {
            alphaChannel[i++] = transparency[pixels[j]];
          }
          _this.alphaChannel = zlib.deflateSync(alphaChannel);
          return _this.finalize();
        };
      })(this);
      return this.image.decodePixels(fn, true);
    };

    return PNGImage;

  })();

  module.exports = PNGImage;

}).call(this);
