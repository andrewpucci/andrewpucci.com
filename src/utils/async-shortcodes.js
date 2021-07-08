const img = require('./image.js');

module.exports = {

  async image(imgSrc, imgAlt, imgCls, imgSizes, imgWidths) {
    return img.image(imgSrc, imgAlt, imgCls, imgSizes, imgWidths);
  },

  async card(cardTitle, cardContent, cardURL, imgSrc, imgAlt, imgCls, imgSizes, imgWidths) {
    const cardImg = await img.image(imgSrc, imgAlt, imgCls, imgSizes, imgWidths);
    return `<div class="card">
        ${cardImg}
        <div class="card-body">
          <p class="h5 card-title">${cardTitle}</p>
          <p class="card-text">${cardContent}</p>
        </div>
        <div class="card-footer bg-white border-top-0">
          <a href="${cardURL}" class="card-link stretched-link" aria-label="Read more about ${cardTitle}">Read more</a>
        </div>
      </div>
    </div>`;
  },

};
