//#############################
//update two user mode room freqeuntly
//############################
function updateRoom(){
	var roomarea = $('#room');
	$.post("getRooms", function(data) {
		console.log('aaaaa');
		
		for (var i = 0; i < data.length; i++) {
			var room_id = data[i].pk;
			var alive = data[i].fields.alive;
			if ($('#' + room_id).length == 0 && alive == 1){
				// add a new room
				var label = data[i].fields.label;
				var label_length = label.length;
				var username = label.substring(0,label_length - 5);
				var newroom = "<div id=" + data[i].pk + ">" +
				"<a href=/game/join_room/" + data[i].fields.label + " class='white-text button'" + 
				" id='homebutton'>" + "Room owner: " + username +
				"</a></div><br><br><br>"

				roomarea.append(newroom);
				console.log('addOne');
				console.log(i);

			}
      if ($('#' + room_id).length == 1 && alive == 0){
        $('#'+room_id).remove();
      }
		}

});
};


$(document).ready(function () {
  // Add event-handlers

  window.setInterval(updateRoom, 1000);

  function getCookie(name) {  
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
  }
  var csrftoken = getCookie('csrftoken');
  $.ajaxSetup({
    beforeSend: function(xhr, settings) {
        xhr.setRequestHeader("X-CSRFToken", csrftoken);
    }
  });
});
