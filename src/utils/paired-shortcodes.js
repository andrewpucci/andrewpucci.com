module.exports = {

  // Perform image transformations
  card(imgURL, cardTitle, cardContent, cardURL) {
    return `<div class="card">
        ${imgURL}
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
