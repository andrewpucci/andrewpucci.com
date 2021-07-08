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

  async expandableImage(imgName, imgSrc, imgAlt) {
    const thumbImage = await img.image(imgSrc, imgAlt, 'img-fluid img-thumbnail', '629', [629, 1258, null]);
    const fullImage = await img.image(imgSrc, '', 'img-fluid');

    return `<a href="#${imgName}-modal" data-bs-toggle="modal">
        ${thumbImage}
      </a>
      <div class="modal fade" id="${imgName}-modal" tabindex="-1" aria-labelledby="${imgName}-modal-title" aria-hidden="true">
        <div class="modal-dialog modal-fullscreen">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="${imgName}-modal-title">${imgAlt}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              ${fullImage}
            </div>
          </div>
        </div>
      </div>
    `;
  },

};
