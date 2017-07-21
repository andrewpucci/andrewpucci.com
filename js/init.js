(function($){
  $(function(){

    $('.button-collapse').sideNav();
    $('.parallax').parallax();
    $('.carousel.carousel-slider').carousel({fullWidth: true, indicators: true});
    $('.carousel.portfolio-overview').carousel({dist: -30, padding: 20});
    $('.materialboxed').materialbox();
  }); // end of document ready
})(jQuery); // end of jQuery name space