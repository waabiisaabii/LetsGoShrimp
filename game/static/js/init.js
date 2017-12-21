(function($){
  $(function(){

    $('.button-collapse').sideNav();
    $('.parallax').parallax();

    $.get('home_get_resume_flag').done(function(data){
            if(data=='0'){
            	$("#resume-button").remove();
            }
        })

  }); // end of document ready
})(jQuery); // end of jQuery name space