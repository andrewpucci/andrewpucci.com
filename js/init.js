function carouselHeight() {
    $('.carousel.carousel-slider').each(function() {
        var newHeight = $(this).find('.carousel-item img').height();
        var origStyle = $(this).attr('style');
        $(this).attr('style', origStyle+'; height: '+newHeight+'px !important');
    });
}
$(window).resize(function(){carouselHeight();});

(function($){
  $(function(){

    $('.button-collapse').sideNav();
    $('.parallax').parallax();
    $('.carousel.carousel-slider').carousel({fullWidth: true, indicators: true});
    carouselHeight();
    $('.carousel.portfolio-overview').carousel({dist: -30, padding: 20});
    $('.materialboxed').materialbox();
  }); // end of document ready
})(jQuery); // end of jQuery name space