const img = require('./image.js');

module.exports = {

  async image(imgSrc, imgAlt, imgCls, imgSizes, imgWidths) {
    return img.image(imgSrc, imgAlt, imgCls, imgSizes, imgWidths);
  },

};
