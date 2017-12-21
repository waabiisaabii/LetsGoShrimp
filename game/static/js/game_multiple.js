var flag = 1;
// ready flag for guest ready
var ready_flag = 0;
// start flag for host start the game
var start_flag = 0;

// start verfiy that the audio is allowed
var start_verify = 0;
// alive flag to detec the guest into the room
var alive_flag;
// establish channel webscoket bridge
var webSocketBridge = new channels.WebSocketBridge();
// guest user location
OTHER_X = 0;
OTHER_Y = 0;


// ##################################################
// Global variable for map generation
// ##################################################
var canvas_width = 800;
var canvas_height = 600;
var myGameCharacter;
var otherGameCharacter;
var winner = 0;
var loser = 0;

// obstacles
var myGamePiece = new Array();
// special items
var myCandy = new Array();
var myBomb = new Array();

// storing game state
var gameState = {};
// cumulative_time stores the number of times of calling updateGameArea()
var cumulative_time = 0;

var TIME_SAVE_STATE = 0;
// logged in user_id in database, default: 0
var USER_ID = 0;
var ROOM_USER_ID=0;
// GRAVITY controls the falling speed of character
var GRAVITY = 7;
// SPEED_X controls the horizontally moving speed of character
var SPEED_X = -4;
// When user activates jump() action, JUMP_SPEED controls the character's speed of jumping
var JUMP_SPEED = -5

var BLOCK_COLOR = 'black';

// character block's width and height
var CHAR_WIDTH = 50;
var CHAR_HEIGHT = 50;

// initial start position of the character in the x-axis
var START_POSITION = 80;

// bonus_point stores the current cumulative scores for eating candy
var bonus_point = 0;
// when a character *eat* a candy, the score will be added by BONUS_POINT
var BONUS_POINT = 10000;

// url for retrieving character/item photo from database
// var CHAR_IMG_PATH = 'photo/1'
var CHAR_IMG_PATH = 'https://s3-us-west-1.amazonaws.com/f17-15637-hw6/image/a.png';

// var ITEM_PATH = 'photo/2'
var ITEM_PATH = 'https://s3-us-west-1.amazonaws.com/f17-15637-hw6/image/pill.png';

// var CHAR_IMG_PATH_OTHER = 'photo/3'
var CHAR_IMG_PATH_OTHER = 'https://s3-us-west-1.amazonaws.com/f17-15637-hw6/image/wangnima.png';

// var BOMB_PATH = 'photo/4'
// var BOMB_PATH = 'https://s3-us-west-1.amazonaws.com/f17-15637-hw6/image/bug.png';
var BOMB_PATH = 'https://s3-us-west-1.amazonaws.com/f17-15637-hw6/image/bee.png';
var FINAL_PATH = 'https://s3-us-west-1.amazonaws.com/f17-15637-hw6/image/final.png';

var cur_len = START_POSITION;
var MAP_LEN = 2000;
// randomly generating block, BLOCK_HEIGHT_MIN/BLOCK_HEIGHT_MAX, BLOCK_WIDTH_MIN/BLOCK_WIDTH_MAX controls the min/max size of blocks
var BLOCK_HEIGHT_MIN = canvas_height / 6;
var BLOCK_HEIGHT_MAX = BLOCK_HEIGHT_MIN + 80;
var BLOCK_WIDTH_MIN = canvas_width / 20;
var BLOCK_WIDTH_MAX = canvas_width / 2;

var csrftoken = $("[name=csrfmiddlewaretoken]")[0].content;

// the probability of whether a bomb would appear at a specific place
var bomb_exist_probability = 0.7;


// ##################################################
// start two user game 
// ##################################################
function twoUser(user_id, alive, room_id,room_user_id) {
    //user_id: the id of user who enter the room
    //alive: detect how many user in the room, 1 for one, 0 for two
    //room_id: the id of room
    //room_user_id: the id of host
    USER_ID = user_id;

    ROOM_ID = room_id;
    ROOM_USER_ID = room_user_id;
    // myscore = new score("black", canvas_width - 150, 60);
	alive_flag = alive;
    // webSocketBridge.connect();
    webSocketBridge.connect('/ws/');
    // webSocketBridge.listen("ws://" + window.location.host + "/game/");
    webSocketBridge.listen();
    webSocketBridge.demultiplex('intval', function(action, stream) {
        // console.log(action.action);
        // OTHER_X = action.data.current_location_x;
        // OTHER_Y = action.data.current_location_y;

        if(action.x!=undefined){
            OTHER_X = action.x;
            OTHER_Y = action.y;
        }
         // get the info of other user by websocket
        if(action.info_all!=undefined){
            all_info = JSON.parse(action.info_all);
            if(all_info.length == 1 && all_info[0].fields.lose ==1) {
                beforeBackhome(USER_ID, all_info[0].fields.win, all_info[0].fields.lose);
            }
            for(idx_info = 0; idx_info<all_info.length; idx_info++){
                if(all_info[idx_info].fields.player!=USER_ID){
                    OTHER_X = all_info[idx_info].fields.current_location_x;
                    OTHER_Y = all_info[idx_info].fields.current_location_y;
                    // winner = all_info[idx_info].fields.win;
                    if(all_info[idx_info].fields.win==1 || all_info[idx_info].fields.lose==1){
                        console.log('other winnnnnnnnnnnnn / loseeeeeeeeeeee');
                        myGameArea.stop();
                        beforeBackhome(USER_ID, all_info[idx_info].fields.win, all_info[idx_info].fields.lose);
                    }
                    // winner == 1: another user win
                    // loser = all_info[idx_info].fields.lose;
                    // loser == 1: another user lose

                    start_flag |= all_info[idx_info].fields.start_flag;
                    ready_flag |= all_info[idx_info].fields.ready_flag;

                    // if (alive == 0) {start_flag = all_info[idx_info].fields.start_flag;}
                    // if (alive == 1) {ready_flag = all_info[idx_info].fields.ready_flag;}
                    
                    console.log(OTHER_X, otherGameCharacter.x);
                    console.log('start', start_flag, 'ready', ready_flag);
                    // otherGameCharacter.x = OTHER_X;
                    // otherGameCharacter.y = OTHER_Y;

                    // if(otherGameCharacter.x==0){
                    //     otherGameCharacter.x = OTHER_X;
                    //     otherGameCharacter.y = OTHER_Y;
                    // }
                }
            }
        }

        
        
        // send the the user self info by websocket
        if(myGameCharacter!=undefined && webSocketBridge!=undefined){
            // console.log('readyflag', ready_flag)
            webSocketBridge.stream('intval').send({
                "user_id": USER_ID, 
                // coord_x: 2*START_POSITION- myGamePiece[0].x,
                "coord_x": myGameCharacter.x - myGamePiece[0].x + START_POSITION,
                "coord_y": myGameCharacter.y,
                "room_id": room_id, 
                "winner": winner, 
                "loser":loser,
				"ready_flag": ready_flag,
                "start_flag" :start_flag});
        }
        // else{
        //     webSocketBridge.stream('intval').send({user_id: USER_ID, 
        //         coord_x: 80, coord_y: 0,
        //         room_id: room_id})
        // }
        // }
    });

    webSocketBridge.socket.addEventListener('open', function() {
        console.log("Connected to WebSocket");
        
    })
    webSocketBridge.socket.addEventListener('close', function() {
        console.log("Disconnected");  
        
    })


    // if the host, wait guest ready 
    // if the guest, click ready
    if (user_id == room_user_id) {
        // only creator, create map
        if (alive == 1) {
            var map_status = 0;
            createMap(map_status,{},user_id);
            document.getElementById("myfilter").style.display = "block";    
        } else {
            createMap(1,{},user_id);
            document.getElementById("myfilter").style.display = "block";  
        }
        
    }else {
        // two user, start the game
        var map_status = 1;
        createMap(map_status,{},user_id);
        document.getElementById("myfilter").style.display = "block";        
        document.getElementById("myreadybutton").style.display = "block";
    }
}
// if ready, set ready_flag = 1
function ready(){
    ready_flag = 1;

}
// if start, set start flag =1
function start(){
    start_flag = 1;
   
}
// ##################################################
// TODO: genrate the game map
// ##################################################
function createMap(map_status, map_data, user_id){
  // map_status:  0 if the map needs to be regenerated
  //              1 if the map is loaded from server's database
  // map_data:    if map_status is 1, map_data contains data for stored map
  // user_id: id for logged-in user in the database

    offset = 0;
    // myscore = new score("black", canvas_width - 150, 60);
    myGameArea.start();
    myscore = new score("black", canvas_width - 150, 60);
    // otherGameCharacter = new component_static(CHAR_WIDTH, CHAR_HEIGHT, 
    //         CHAR_IMG_PATH_OTHER, OTHER_X, 
    //         OTHER_Y, 'image'); 
    otherGameCharacter = new component_dynamic(CHAR_WIDTH, CHAR_HEIGHT, 
            CHAR_IMG_PATH_OTHER, OTHER_X, 
            OTHER_Y, 'image'); 

    if(map_status==0){
        // create whole new map
        
        bomb_exist_flag = 0;
        
        cur_len = START_POSITION;
        while(cur_len<MAP_LEN){
            block_height = getRandomArbitrary(BLOCK_HEIGHT_MIN, BLOCK_HEIGHT_MAX);
            block_width = getRandomArbitrary(CHAR_WIDTH, BLOCK_WIDTH_MAX);
            myGamePiece.push(
                new component_static(block_width, 
                                    block_height, 
                                    BLOCK_COLOR, 
                                    cur_len, 
                                    canvas_height-block_height,
                                    'normal')); 

            if(Math.random()<bomb_exist_probability && bomb_exist_flag<=2 && cur_len>=(MAP_LEN/5)){
                myBomb.push(
                new component_static(block_width, 
                                    block_width, 
                                    BOMB_PATH, 
                                    cur_len, 
                                    canvas_height-block_height-3*block_width,
                                    "image"));
                bomb_exist_flag += 1;
            }

            cur_len += block_width;
            cur_len += getRandomArbitrary(CHAR_WIDTH, 3 * CHAR_WIDTH);
        }

        ///////////////////////////////////////////////////////////////////
            block_height = getRandomArbitrary(BLOCK_HEIGHT_MIN, BLOCK_HEIGHT_MAX) + canvas_height;
            block_width = getRandomArbitrary(CHAR_WIDTH, BLOCK_WIDTH_MAX);
            // myGamePiece.push(
            //     new component_static(block_width, 
            //                         block_height, 
            //                         'yellow', 
            //                         cur_len, 
            //                         canvas_height-block_height)); 
            myGamePiece.push(
                new component_static(block_width, 
                                    block_height, 
                                    FINAL_PATH, 
                                    cur_len, 
                                    canvas_height-block_height,
                                    'image')); 

         ///////////////////////////////////////////////////////////////////



        myGameCharacter = new component_dynamic(CHAR_WIDTH, CHAR_HEIGHT, 
            CHAR_IMG_PATH, START_POSITION, 
            canvas_height-myGamePiece[0].height-30 - 50, 'image');

               

        gameState.myGamePiece = myGamePiece;
        gameState.myBomb = myBomb;
        //gameState.myCandy = myCandy;
        var gameState_json = JSON.stringify(gameState);

        // ##################################################
        // TODO: post gameState_json to the server
        // ##################################################
        
        $.ajax({
                method: "post",
                url: "save_map/"+user_id,
                data: { gameState_json: gameState_json,
                        csrfmiddlewaretoken: $("[name=csrfmiddlewaretoken]")[0].content },
                async: false
            }).done(function(data){

                console.log('get map?');
            });
    } else{

        // load map from map_data
         $.ajax({
            method: "post",
            url: "load_map/"+user_id,
            data: { user_id: user_id,
                    csrfmiddlewaretoken: $("[name=csrfmiddlewaretoken]")[0].content },
            async: false
        }).done(function(json_return){
            map_data=json_return['map'];
            console.log("got_map");
        });
        // map_data.current_map
        //offset = map_data.current_location - START_POSITION;
        map = $.parseJSON(map_data.current_map);
        //console.log(map.myGamePiece);
        myGamePiece_t = map.myGamePiece;
        myBomb_t = map.myBomb;
        
        console.log(myGamePiece_t);
        
        for(i=0;i<myGamePiece_t.length; i++){
            
            // block_height = myGamePiece_t[i].height;
            // block_width = myGamePiece_t[i].width;

            cur_len = myGamePiece_t[i].x;

            myGamePiece.push(
                new component_static(myGamePiece_t[i].width, 
                                    myGamePiece_t[i].height, 
                                    myGamePiece_t[i].color, 
                                    myGamePiece_t[i].x, 
                                    myGamePiece_t[i].y,
                                    myGamePiece_t[i].type));     
        }
        for(i=0;i<myBomb_t.length; i++){

            myBomb.push(
                new component_static(myBomb_t[i].width, 
                                     myBomb_t[i].height, 
                                     myBomb_t[i].color, 
                                     myBomb_t[i].x, 
                                     myBomb_t[i].y,
                                     myBomb_t[i].type));     
        }
        console.log('load data from map_data from server');
        myGameCharacter = new component_dynamic(CHAR_WIDTH, CHAR_HEIGHT, CHAR_IMG_PATH, START_POSITION, canvas_height-myGamePiece[0].height-30 - 50, 'image');
        
    }
    return offset;
}

// ##################################################
// TODO: start the game after start_flag =1 
// ##################################################
input = new p5.AudioIn();
//input.start();
function startGame() {
    
    // input = new p5.AudioIn();
    input.start();
	start_verify=1;
    return;

    //myscore = new score("black", canvas_width - 150, 60);

    //candy_flag = false;
    //candy_p = 0.5;
    //offset = createMap(map_status, map_data, user_id);

}

// ##################################################
// TODO: generate random number
// ##################################################
function getRandomArbitrary(min, max) {
  return Math.random() * 1.5 * (max - min) + min;
}

// ##################################################
// TODO: Get volume input and link to other operation
// ##################################################
function getvolume() {
    var volume = input.getLevel();
    var threshold = 0.1;
    var jump_threshold = 0.3;
    if (volume <= threshold) {
        clearmove();
    }
    if (volume > threshold && volume < jump_threshold) {
        // forward
        run();
    }
    if (volume > jump_threshold) {
        // jump
        jump();
    }
}

// ##################################################
// TODO: user score model
// ##################################################
function score(color, x, y) {
    // color: front color
    // x, y: the location of score
    this.x = x;
    this.y = y;
    this.val = 0;
    this.bonus = 0;
    this.text = "SCORE: " + this.val
    ctx = myGameArea.context;

    ctx.fillStyle = color;
    ctx.fillText(this.text, this.x, this.y);

    this.update = function(bonus_point){
        ctx = myGameArea.context;
        ctx.fillStyle = color;
        if(bonus_point!=0)
            this.bonus = bonus_point;
        this.val = - (myGamePiece[0].x - START_POSITION) + this.bonus;
        this.text = "SCORE: " + this.val;
        ctx.font="20px Arial";
        ctx.fillText(this.text, this.x, this.y);
    }
}

// ##################################################
// TODO: map block model
// ##################################################
function component_static(width, height, color, x, y, type) {
    //width, height: the size of block
    //color: color of block,str
    // x,y: the location of block(float,float)
    this.type = type;
    if (type == "image") {
        this.image = new Image();
        this.image.src = color;
    }
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y; 
    this.speedX = 0;
    this.speedY = 0; 
    this.color = color;
    this.ctx = myGameArea.context;
    //console.log(ctx);
    // console.log(color);
    this.ctx.fillStyle = color;
    //console.log(ctx.fillStyle);
    this.ctx.fillRect(this.x, this.y, this.width, this.height);
    

    this.update = function(){
        if (type == "image") {
            this.ctx.drawImage(this.image, 
                this.x, 
                this.y,
                this.width, this.height);
        } else {
            this.ctx.fillStyle = this.color;
            this.ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        // this.x -= 5;
    }
    this.newPos = function() {
        this.x += this.speedX; 
    }
}

// ##################################################
// TODO: special item model
// ##################################################
function component_item(width, height, color, x, y, type) {
    //width, height: the size of block
    //color: color of block,str
    // x,y: the location of block(float,float)
    // type: "image", indicating that this component is loaded from an image
    this.type = type;
    if (type == "image") {
        this.image = new Image();
        this.image.src = color;
    }
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y; 
    this.speedX = 0;
    this.speedY = 0; 
    this.color = color;
    this.encounter = false;
    ctx = myGameArea.context;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    

    this.update = function(){
        ctx = myGameArea.context;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // this.x -= 5;
        if (type == "image") {
            ctx.drawImage(this.image, 
                this.x, 
                this.y,
                this.width, this.height);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
    this.newPos = function() {
        this.x += this.speedX; 
    }
}

// ##################################################
// TODO: user character model
// ##################################################
function component_dynamic(width, height, color, x, y, type) {
    //width, height: the size of block
    //color: color of block,str
    // x,y: the location of block(float,float)
    // type: "image", indicating that this component is loaded from an image
    this.type = type;
    if (type == "image") {
        this.image = new Image();
        this.image.src = color;
    }
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y; 
    this.speedX = 0;
    this.speedY = 0; 
    this.gravity = GRAVITY;
    this.gravitySpeed = 0;

    // this.interval = setInterval(characterDrop, 10);

    ctx = myGameArea.context;
    ctx.fillStyle = color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    this.update = function(){
        ctx = myGameArea.context;
        if (type == "image") {
            ctx.drawImage(this.image, 
                this.x, 
                this.y,
                this.width, this.height);
        } else {
            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        // ctx.fillStyle = color;
        // ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    this.newPos = function(bottom) {
        this.gravitySpeed = this.gravity;
        this.x += this.speedX;
        this.y += this.speedY + this.gravitySpeed; 

        if(this.y+this.height>bottom)
            this.y = bottom - this.height;
        if(this.y<0) // avoid being out of canvas (top)
            this.y = 0;
        
    }
    this.hitBottom = function(otherobj) {
        var myleft = this.x;
        var otherleft = otherobj.x;
        var otherright = otherobj.x + (otherobj.width);
        var othertop = otherobj.y;

        var hit = true;

        if(myleft>=otherleft && myleft <=otherright)
            var mybottom = this.y + (this.height);
            
            if (mybottom < othertop) {
               hit = false;
            }
        else{
            hit = false;
        }
        return hit;
    }
    this.crashWith = function(otherobj, nextOtherobj) {
        var myleft = this.x;
        var myright = this.x + (this.width);
        var mytop = this.y;
        var mybottom = this.y + (this.height);
        var otherleft = otherobj.x;
        var otherright = otherobj.x + (otherobj.width);
        var othertop = otherobj.y;
        var otherbottom = otherobj.y + (otherobj.height);

        var nextOtherleft = nextOtherobj.x;
        var nextOthertop = nextOtherobj.y;

        var crash = false;
        if ((mybottom ==  myGameArea.canvas.height) || 
                ((nextOtherleft - myright <= CHAR_WIDTH/20) && (myright<=nextOtherleft) && mybottom>nextOthertop)) {
           crash = true;
        }
        return crash;
    }
    this.crashWithFinal = function(nextOtherobj) {
        // var myleft = this.x;
        var myright = this.x + (this.width);
        // var mytop = this.y;
        // var mybottom = this.y + (this.height);
        // var otherleft = otherobj.x;
        // var otherright = otherobj.x + (otherobj.width);
        // var othertop = otherobj.y;
        // var otherbottom = otherobj.y + (otherobj.height);

        var nextOtherleft = nextOtherobj.x;
        // var nextOthertop = nextOtherobj.y;

        var crash = false;
        if (myright>=nextOtherleft) {
           crash = true;
        }
        return crash;
    }
}
// ##################################################
// TODO: Create game canvas
// ##################################################
var myGameArea = {
    canvas : document.createElement("canvas"),
    start: function() {
        this.canvas.width = canvas_width;
        this.canvas.height = canvas_height;
        this.context = this.canvas.getContext("2d");
        this.frameNo = 0;
        this.start_flag = 0;
        document.getElementById("canvascontainer").appendChild(this.canvas);

        this.interval = setInterval(updateGameArea, 20);
    },
    clear: function(){
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    stop : function() {
        clearInterval(this.interval);
        this.pause = true;
    }

};

// ##################################################
// TODO: Control character to run in game
// ##################################################
function run(e) {
    for (i = 0; i < myGamePiece.length; i += 1) {
        myGamePiece[i].speedX = SPEED_X;
        
    }
    for (i = 0; i < myCandy.length; i += 1) {
        myCandy[i].speedX = SPEED_X;
    }
    for (i = 0; i < myBomb.length; i += 1) {
        myBomb[i].speedX = SPEED_X;
    }
    myGameCharacter.image.src = CHAR_IMG_PATH;
    otherGameCharacter.speedX = SPEED_X;


}

// ##################################################
// TODO: Control character to jump in game
// ##################################################
function jump() {
    for (i = 0; i < myGamePiece.length; i += 1) {
        myGamePiece[i].speedX = SPEED_X;
    }
    for (i = 0; i < myCandy.length; i += 1) {
        myCandy[i].speedX = SPEED_X;
    }
    for (i = 0; i < myBomb.length; i += 1) {
        myBomb[i].speedX = SPEED_X;
    }
    myGameCharacter.gravity = JUMP_SPEED;
    myGameCharacter.image.src = CHAR_IMG_PATH;

    otherGameCharacter.speedX = SPEED_X;
}

// ##################################################
// TODO: clear move 
// ##################################################
function clearmove() {
    for (i = 0; i < myGamePiece.length; i += 1) {
        myGamePiece[i].speedX = 0;
    }
    for (i = 0; i < myCandy.length; i += 1) {
        myCandy[i].speedX = 0;
    }
    for (i = 0; i < myBomb.length; i += 1) {
        myBomb[i].speedX = 0;
    }
    myGameCharacter.gravity = GRAVITY;
    // otherGameCharacter.speedX = 0;
}

// ##################################################
// TODO: check wheterh char. hit special item 
// ##################################################
function char_meet_candy() {

    myCenter_y = myGameCharacter.y + myGameCharacter.height/2;
    myCenter_x = myGameCharacter.x + myGameCharacter.width/2;

    myRight = myGameCharacter.x + myGameCharacter.width;
    myLeft = myGameCharacter.x;
    myTop = myGameCharacter.y;
    myBottom = myGameCharacter.y + myGameCharacter.height;

    for(i=0;i<myCandy.length;i++){ 
        candyLeft = myCandy[i].x;
        candyRight = myCandy[i].x + myCandy[i].width;
        candyTop = myCandy[i].y;
        candyBottom = myCandy[i].y + myCandy[i].height;

        if(myCenter_y>=candyTop && myCenter_y<=candyBottom && myCenter_x>=candyLeft && myCenter_x<=candyRight){
            // character encounters the candy
            console.log('meet!')
            myCandy[i].color = 'gray';
            if(!myCandy[i].encounter){
                bonus_point += BONUS_POINT;
                myscore.update(bonus_point); 
                myCandy[i].encounter = true;   
            }            
        }
    }
}
// ##################################################
// TODO: for loser end game filter and backhome button
// ##################################################

function a_loser() {
    // for pathetic losers
    document.getElementById("myfilter").style.display = "none";
    document.getElementById("myloserbutton").style.display = "none";
    // window.location.replace("http://127.0.0.1:8000/game/home/");
    window.location.replace("home");
}
// ##################################################
// TODO: get user's cookie
// ##################################################
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
// ##################################################
// TODO: before end the game, raise the win/lose button
// send the info to database
// ##################################################
function beforeBackhome(user_id, winner, loser) {
    // user_id: user id
    // winner/loser: indicate the winnor or loser
    document.getElementById("myfilter").style.display = "block";
    document.getElementById("myreadybutton").style.display = "none";
    document.getElementById("mystartbutton").style.display = "none";
    
    // var game_score = myscore.val;
    var game_score;
    if(loser==1){
        game_score = JSON.stringify(myscore.val);
        document.getElementById("mywinbutton").style.display = "block";
    }

    else{
        game_score = JSON.stringify(0);
        document.getElementById("myloserbutton").style.display = "block";
    }

    var csrftoken = getCookie('csrftoken');
    $.ajax({
        method: "post", 
        url: 'https://radiant-anchorage-45617.herokuapp.com/game/died/' + user_id + '/',
        data: {
            game_score: game_score,  
            // csrfmiddlewaretoken: $("[name=csrfmiddlewaretoken]")[0].content,

            csrfmiddlewaretoken: csrftoken}, 
        async: false
    }).done(function(data){
        console.log('died data');
    });
    webSocketBridge = undefined;
    // window.location.replace("http://127.0.0.1:8000/game/home/");

}
// ##################################################
// TODO: back to home page after the game
// ##################################################
function backhome(user_id){
    // window.location.replace("http://127.0.0.1:8000/game/home/");
    window.location.replace("home");
    // webSocketBridge = undefined;
}

function sendMyMessages() {
    ws.send("Hi, from the client.");
    ws.send("Hi, from the client.");
}

// ##################################################
// TODO: check whether char. hit the bomb 
// ##################################################
function char_meet_bomb() {

    myCenter_y = myGameCharacter.y + myGameCharacter.height/2;
    myCenter_x = myGameCharacter.x + myGameCharacter.width/2;

    myRight = myGameCharacter.x + myGameCharacter.width;
    myLeft = myGameCharacter.x;
    myTop = myGameCharacter.y;
    myBottom = myGameCharacter.y + myGameCharacter.height;

    for(i=0;i<myBomb.length;i++){ 
        bombLeft   = myBomb[i].x;
        bombRight  = myBomb[i].x + myBomb[i].width;
        bombTop    = myBomb[i].y;
        bombBottom = myBomb[i].y + myBomb[i].height;

        if(myCenter_y>=bombTop && myCenter_y<=bombBottom && myCenter_x>=bombLeft && myCenter_x<=bombRight){
            // character encounters the candy
            console.log('meet bomb!!')
            myBomb[i].color = 'gray';

            myGameArea.stop();
            loser = 1;
            console.log('lose!');
            webSocketBridge.stream('intval').send({user_id: USER_ID, 
            coord_x: myGameCharacter.x - myGamePiece[0].x + START_POSITION,
            coord_y: myGameCharacter.y,
            room_id: ROOM_ID, 
            winner: 0, 
            loser: 1,
            ready_flag: ready_flag,
            start_flag: start_flag})
            myscore.update(0); 

            document.getElementById("myfilter").style.display = "block";
            document.getElementById("myloserbutton").style.display = "block";          
        }
    }
}



// ##################################################
// TODO: update game area
// ##################################################
function updateGameArea() {
	if(start_verify == 0) {
        if(USER_ID == ROOM_USER_ID) {
            // only creator, create map
            if (ready_flag == 1) {
                document.getElementById("mystartbutton").style.display = "block";
            }
            if(start_flag == 1) {
                document.getElementById("myfilter").style.display = "none";
                document.getElementById("mystartbutton").style.display = "none";
                startGame();
            }

        }else {
            // two user, start the game
            // console.log(ready_flag)
            if (start_flag == 1) {
                document.getElementById("myfilter").style.display = "none";
                document.getElementById("myreadybutton").style.display = "none";
                startGame();
            }
        }
    }
    var last_one = Object.keys(myGamePiece).length;
    // if(winner||loser){
    //     myGameArea.stop();
    //     backhome(USER_ID, winner, loser);
    // }


    // if (winner == 1) {
    //     a_loser();
    //     // document.getElementById("myfilter").style.display = "none";
    //     // document.getElementById("myloserbutton").style.display = "none";
    //     // window.location.replace("http://127.0.0.1:8000/game/home/");
    // }
    // if (loser == 1) {
    //     backhome(user_id);
    // }


    getvolume();

    //crashing a bomb
    char_meet_bomb();

    //whether hitting the end of the game
    if (myGameCharacter.crashWithFinal(myGamePiece[last_one - 1])) {        
        myGameArea.stop();
        winner = 1;
        webSocketBridge.stream('intval').send({user_id: USER_ID, 
                coord_x: myGameCharacter.x - myGamePiece[0].x + START_POSITION,
                coord_y: myGameCharacter.y,
                room_id: ROOM_ID, 
                winner: 1, 
                loser: 0,
                ready_flag: ready_flag,
                start_flag: start_flag})

        
        document.getElementById("myfilter").style.display = "block";
        document.getElementById("mywinbutton").style.display = "block";   
        console.log('winwinwin');
        beforeBackhome(USER_ID, 0, 1);
    }

    // check whether the character hit the block 
    for(i=0;i<myGamePiece.length - 2;i++){ 

    //     if (myGameCharacter.crashWith(myGamePiece[last_one - 2], myGamePiece[last_one - 1])) {
    //         myGameArea.stop();
    //         winner = 1;

    //         webSocketBridge.stream('intval').send({user_id: USER_ID, 
    //             coord_x: myGameCharacter.x - myGamePiece[0].x + START_POSITION,
    //             coord_y: myGameCharacter.y,
    //             room_id: ROOM_ID, 
    //             winner: 1, 
    //             loser: 0,
				// ready_flag: ready_flag,
				// start_flag: start_flag})

    //         document.getElementById("myfilter").style.display = "block";
    //         document.getElementById("mywinbutton").style.display = "block";   
    //         console.log('winwinwin');


        // } else {
        if (myGameCharacter.crashWith(myGamePiece[i], myGamePiece[i+1])){
            myGameArea.stop();
            loser = 1;
            console.log('lose!');
            webSocketBridge.stream('intval').send({user_id: USER_ID, 
            coord_x: myGameCharacter.x - myGamePiece[0].x + START_POSITION,
            coord_y: myGameCharacter.y,
            room_id: ROOM_ID, 
            winner: 0, 
            loser: 1,
			ready_flag: ready_flag,
			start_flag: start_flag})
            myscore.update(0); 

            document.getElementById("myfilter").style.display = "block";
            document.getElementById("myloserbutton").style.display = "block";

            // return;

        }
        // }


        // if (myGameCharacter.crashWith(myGamePiece[i], myGamePiece[i+1])) {
        //     myGameArea.stop();
        //     myscore.update(0); 

        //     document.getElementById("myfilter").style.display = "block";
        //     document.getElementById("mybackhomebutton").style.display = "block";

        //     return  
        // } 
    }

    
    myGameArea.clear();

    // periodically send game state to the server
    TIME_SAVE_STATE += 1;
    if(TIME_SAVE_STATE%5==0){
        // ##################################################
        // TODO: post gameState_json to the server
        // ##################################################
        
        // $.ajax({
        //         method: "post",
        //         url: "update_state/"+USER_ID,
        //         data: { life: mylife.val,
        //                 score: myscore.val,
        //                 current_location: myGamePiece[0].x,
        //                 csrfmiddlewaretoken: $("[name=csrfmiddlewaretoken]")[0].content },
        //         async: false
        //     }).done(function(data){

        //         // console.log('yeah');
        //     });

        // socket.send(JSON.stringify(
        //     {life: mylife.val,
        //     score: myscore.val,
        //     current_location: myGamePiece[0].x,
        //     csrfmiddlewaretoken: $("[name=csrfmiddlewaretoken]")[0].content }))

        // socket.send(JSON.stringify(
        //     {user_id: USER_ID,
        //     coord_x: myGameCharacter.x,
        //     coord_y: myGameCharacter.y}))
        

        // webSocketBridge.stream('intval').send({user_id: USER_ID, 
        //     coord_x: myGameCharacter.x, coord_y: myGameCharacter.y})

    }



    myGameArea.frameNo =  - (myGamePiece[0].x - 30);
    
   
    for(i=0;i<myGamePiece.length;i++){ 
        myGamePiece[i].update();
        myGamePiece[i].newPos();
    }

    for(i=0;i<myBomb.length;i++){ 
        myBomb[i].update();
        myBomb[i].newPos();
    }


    for(i=0;i<myCandy.length;i++){   
        myCandy[i].newPos();
        myCandy[i].update();
    }
    
    left = 0;
    right = myGamePiece[0].width;
    idx = -1;
    for (i = 0; i < myGamePiece.length; i += 1) {
        cur_x_l = myGameCharacter.x;
        cur_x_r = myGameCharacter.x + myGameCharacter.width;

        left = myGamePiece[i].x;
        right = left + myGamePiece[i].width;
        
        if((cur_x_l >= left && cur_x_l <= right) || (cur_x_r >= left && cur_x_r <= right)){
            idx = i;
            break;
        }
    }

    myGameCharacter.update();
    if(idx===-1){       
        myGameCharacter.newPos(canvas_height);

        myscore.update(0);  
 
    }
    else{
        if(myGameCharacter.hitBottom(myGamePiece[idx])==false){
            myGameCharacter.update();
            myGameCharacter.newPos(myGamePiece[idx].y);
            myscore.update(0);  
        }else{
            myGameCharacter.update();  
            myGameArea.stop();           

            myscore.update(0); 
            // if (mylife.val>0) {  
            //     document.getElementById("myfilter").style.display = "block";
            //     document.getElementById("myrestartbutton").style.display = "block";
            // }else {
            //     return;
            // }    
        }    
    }


    
    // otherGameCharacter.newPos();


    
    
    otherGameCharacter.x = OTHER_X + myGamePiece[0].x - START_POSITION;
    otherGameCharacter.y = OTHER_Y;
    otherGameCharacter.update();
    otherGameCharacter.newPos();
    // if(otherGameCharacter.x==0){
    //     otherGameCharacter.x += OTHER_X;
    //     otherGameCharacter.y += OTHER_Y;
    // }

    // otherGameCharacter.x += OTHER_X;
    // otherGameCharacter.y += OTHER_Y;
    // diff = otherGameCharacter.x - myGamePiece[0].x;
    // otherGameCharacter.x += myGamePiece[0].x;
    // otherGameCharacter.update();

    
}

