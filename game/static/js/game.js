// ##################################################
// Global variable for map generation
// ##################################################
var canvas_width = 800;
var canvas_height = 600;
var myGameCharacter;
var accumulated_score = 0;
// obstacles
var myGamePiece = new Array();
// special items
var myCandy = new Array();

// storing game state
var gameState = {};
// cumulative_time stores the number of times of calling updateGameArea()
var cumulative_time = 0;

var TIME_SAVE_STATE = 0;
// logged in user_id in database, default: 0
var USER_ID = 0;

// GRAVITY controls the falling speed of character
var GRAVITY = 7;
// SPEED_X controls the horizontally moving speed of character
var SPEED_X = -4;
// When user activates jump() action, JUMP_SPEED controls the character's speed of jumping
var JUMP_SPEED = -4.2

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

var FINAL_PATH = 'https://s3-us-west-1.amazonaws.com/f17-15637-hw6/image/final.png';


var cur_len = START_POSITION;
var MAP_LEN = 2000;
// randomly generating block, BLOCK_HEIGHT_MIN/BLOCK_HEIGHT_MAX, BLOCK_WIDTH_MIN/BLOCK_WIDTH_MAX controls the min/max size of blocks
var BLOCK_HEIGHT_MIN = canvas_height / 6;
var BLOCK_HEIGHT_MAX = BLOCK_HEIGHT_MIN + 80;
var BLOCK_WIDTH_MIN = canvas_width / 20;
var BLOCK_WIDTH_MAX = canvas_width / 2;


var csrftoken = $("[name=csrfmiddlewaretoken]")[0].content;


// ##################################################
// restart game before life = 0
// ##################################################
function restartGame(user_id) {
  // user_id: id for logged-in user in the database
    document.getElementById("myfilter").style.display = "none";
    document.getElementById("myrestartbutton").style.display = "none";
    myGameArea.stop();
    myGameArea.clear();
    //myGameArea = {};
    myGamePiece = new Array();
    myGameCharacter;
    myCandy = new Array();
    myscore = {}
    mylife = new life("red", canvas_width - 150, 30, mylife.val);
    //document.getElementById("canvascontainer").innerHTML = "";
    startGame(user_id, 0, {});
}

// ##################################################
// TODO: gain the user's play record
// ##################################################

function beforeStartGame(user_id){
  // user_id: id for logged-in user in the database
    USER_ID = user_id;
    $.ajax({
            method: "post",
            url: "whether_new/"+user_id,
            data: { user_id: user_id,
                    csrfmiddlewaretoken: $("[name=csrfmiddlewaretoken]")[0].content },
            async: false
        }).done(function(json_return){
            startGame(user_id, json_return['status'], json_return['loadin']);
            console.log('beforeStartGame');
        });
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
    if(map_status==0){
        // create whole new map
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
                                    'useless')); 

            // place a candy on this block
            if(candy_flag===false && Math.random()>candy_p && myGamePiece.length>2){
            // if(candy_flag===false){
                myCandy.push(
                new component_item(canvas_width / 20, 
                                    canvas_width / 20, 
                                    ITEM_PATH, 
                                    cur_len + block_width/4, 
                                    canvas_height/4,
                                    "image"));
                candy_flag = true; 
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


        // if there's still no candy, create one in the middle of the map
        if(candy_flag==false){
            console.log('no candy')
            candy_pos_x = myGamePiece[Math.floor(myGamePiece.length/2)].x;
            myCandy.push(
                new component_item(block_width/3, 
                                block_width/3, 
                                ITEM_PATH, 
                                candy_pos_x + block_width/4, 
                                canvas_height/4, 
                                "image"));
            candy_flag = true; 
        }
        myGameCharacter = new component_dynamic(CHAR_WIDTH, CHAR_HEIGHT, CHAR_IMG_PATH, START_POSITION, canvas_height-myGamePiece[0].height-30 - 50, 'image');

        gameState.myGamePiece = myGamePiece;
        gameState.myCandy = myCandy;
        var gameState_json = JSON.stringify(gameState);

        // ##################################################
        // TODO: post gameState_json to the server
        // ##################################################
        
        $.ajax({
                method: "post",
                url: "update_map/"+user_id,
                data: { gameState_json: gameState_json,
                        csrfmiddlewaretoken: $("[name=csrfmiddlewaretoken]")[0].content },
                async: false
            }).done(function(data){

                console.log('get map?');
            });
    } else{
        // load map from map_data
        
        // map_data.current_map
        offset = map_data.current_location - START_POSITION;
        retrieve_data = $.parseJSON(map_data.current_map);
        myGamePiece_t = retrieve_data.myGamePiece;
        myCandy_t = retrieve_data.myCandy;
        for(i=0;i<myGamePiece_t.length; i++){
            block_height = myGamePiece_t[i].height;
            block_width = myGamePiece_t[i].width;

            cur_len = myGamePiece_t[i].x;

            // myGamePiece.push(
            //     new component_static(myGamePiece_t[i].width, 
            //                         myGamePiece_t[i].height, 
            //                         myGamePiece_t[i].color, 
            //                         myGamePiece_t[i].x, 
            //                         myGamePiece_t[i].y)); 
            myGamePiece.push(
                new component_static(myGamePiece_t[i].width, 
                                    myGamePiece_t[i].height, 
                                    myGamePiece_t[i].color, 
                                    cur_len + offset, 
                                    canvas_height-block_height,
                                    myGamePiece_t[i].type));     
        }
        for(i=0;i<myCandy_t.length; i++){
            width = myCandy_t[i].width;
            height = myCandy_t[i].height;
            x = myCandy_t[i].x;
            y = myCandy_t[i].y;
            // place a candy on this block
            myCandy.push(
            new component_item(width, 
                                height, 
                                ITEM_PATH, 
                                x + offset, 
                                y,
                                "image"));

            // myCandy.push(
            // new component_item(myCandy_t[i].width, 
            //                     myCandy_t[i].height, 
            //                     myCandy_t[i].color, 
            //                     myCandy_t[i].x, 
            //                     myCandy_t[i].y,
            //                     myCandy_t[i].type));
        }
        console.log('load data from map_data from server');
        myGameCharacter = new component_dynamic(CHAR_WIDTH, CHAR_HEIGHT, CHAR_IMG_PATH, START_POSITION, canvas_height-myGamePiece[0].height-30 - 50, 'image');
    }
    return offset;
}



// ##################################################
// TODO: start the game base on user's play record
// ##################################################
function startGame(user_id, map_status, map_data) {
  // map_status:  0 if the map needs to be regenerated
  //              1 if the map is loaded from server's database
  // map_data:    if map_status is 1, map_data contains data for stored map
  // user_id: id for logged-in user in the database

    if (myGameArea.pause == true) {
        var val= mylife.val;
    }else {
       if (map_data.life_remain == undefined) {
        var val = 3;
       } else {
        var val = map_data.life_remain;
       }
        
       

        
    }
    myGameArea.start();
    input = new p5.AudioIn();
    input.start();



    mylife = new life("red", canvas_width - 150, 30, val);
    myscore = new score("black", canvas_width - 150, 60);

    candy_flag = false;
    candy_p = 0.5;

    offset = createMap(map_status, map_data, user_id);

}

// ##################################################
// TODO: generate random number
// ##################################################
function getRandomArbitrary(min, max) {
  return Math.random() * 1.5 * (max - min) + min;
}


// ##################################################
// TODO: User life model 
// ##################################################
function life(color, x, y, val) {
    // color: str, which controls the font color
    // x,y:   coordinates in canvas (float,float)
    // val:   int
    this.x = x;
    this.y = y;
    this.val = val
    this.text = "Life: " + this.val
    ctx = myGameArea.context;
    ctx.fillStyle = color;
    ctx.fillText(this.text, this.x, this.y);

    this.update = function(){
        this.val = this.val;
        ctx = myGameArea.context;
        ctx.fillStyle = color;
        ctx.font="20px Arial";
        ctx.fillText(this.text, this.x, this.y);
    }
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
// function final_score() {

// }


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
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x, this.y, this.width, this.height);
    

    this.update = function(){
        this.ctx = myGameArea.context;
        // this.x -= 5;
        if (type == "image") {
            this.ctx.drawImage(this.image, 
                this.x, 
                this.y,
                this.width, this.height);
        } else {
            this.ctx.fillStyle = this.color;
            this.ctx.fillRect(this.x, this.y, this.width, this.height);
        }
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
    this.ctx = myGameArea.context;
    // this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x, this.y, this.width, this.height);
    

    this.update = function(){
        this.ctx = myGameArea.context;
        // this.ctx.fillStyle = this.color;
        // this.ctx.fillRect(this.x, this.y, this.width, this.height);
        // this.x -= 5;
        if (type == "image") {
            this.ctx.drawImage(this.image, 
                this.x, 
                this.y,
                this.width, this.height);
        } else {
            this.ctx.fillStyle = this.color;
            this.ctx.fillRect(this.x, this.y, this.width, this.height);
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
    this.color = color;

    // this.interval = setInterval(characterDrop, 10);

    this.ctx = myGameArea.context;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(this.x, this.y, this.width, this.height);

    this.update = function(){
        this.ctx = myGameArea.context;
        if (type == "image") {
            this.ctx.drawImage(this.image, 
                this.x, 
                this.y,
                this.width, this.height);
        } else {
            this.ctx.fillStyle = this.color;
            this.ctx.fillRect(this.x, this.y, this.width, this.height);
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
                ((nextOtherleft - myright <= CHAR_WIDTH/10) && (myright<=nextOtherleft) && mybottom>nextOthertop)) {
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
    myGameCharacter.image.src = CHAR_IMG_PATH;


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
    myGameCharacter.gravity = JUMP_SPEED;
    myGameCharacter.image.src = CHAR_IMG_PATH;
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
    myGameCharacter.gravity = GRAVITY;
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
            myCandy[i].type = 'other';
            if(!myCandy[i].encounter){
                bonus_point += BONUS_POINT;
                myscore.update(bonus_point); 
                myCandy[i].encounter = true;   
            }            
        }
    }
}


function beforeBackhome(user_id) {
     // document.getElementById("myfilter").style.display = "none";
     // document.getElementById("mybackhomebutton").style.display = "none";
     // var game_score = myscore.val;
     // var game_score = JSON.stringify(myscore.val);
     var game_score = JSON.stringify(accumulated_score);
 
     $.ajax({
         method: "post", 
         url: "died_single/" + user_id + '/', 
         data: {game_score: game_score, csrfmiddlewaretoken: $("[name=csrfmiddlewaretoken]")[0].content}, 
         async: false
     }).done(function(data){
         console.log('died data');
     });
     // console.log('before to home');
     // console.log('before to home');
     // console.log('before to home');
     // window.location.replace("http://127.0.0.1:8000/game/home/");
 
 }
 function beforelose(user_id) {
     // document.getElementById("myfilter").style.display = "none";
     // document.getElementById("mybackhomebutton").style.display = "none";
     // var game_score = myscore.val;
     // var game_score = JSON.stringify(myscore.val);
 
    $.ajax({
                method: "post",
                url: "lose/"+USER_ID,
                data: { life: 0,
                        score: 0,
                        current_location: 0,
                        csrfmiddlewaretoken: $("[name=csrfmiddlewaretoken]")[0].content },
                async: true
            }).done(function(data){

                // console.log('yeah');
            });
     // console.log('before to home');
     // console.log('before to home');
     // console.log('before to home');
     // window.location.replace("http://127.0.0.1:8000/game/home/");
 
 }


function backhome(user_id) {
     // document.getElementById("myfilter").style.display = "none";
     // document.getElementById("mybackhomebutton").style.display = "none";
     // // var game_score = myscore.val;
     // // var game_score = JSON.stringify(myscore.val);
     // var game_score = JSON.stringify(accumulated_score);
 
     // $.ajax({
     //     method: "post", 
     //     url: "died/" + user_id + '/', 
     //     data: {game_score: game_score, csrfmiddlewaretoken: $("[name=csrfmiddlewaretoken]")[0].content}, 
     //     async: false
     // }).done(function(data){
     //     console.log('died data');
     // });
     console.log('before to home');
     console.log('before to home');
     console.log('before to home');
     // window.location.replace("http://127.0.0.1:8000/game/home/");
     window.location.replace("home");
 
 }


// ##################################################
// TODO: update game area
// ##################################################
function updateGameArea() {
    var last_one = Object.keys(myGamePiece).length;

    // if (myGameCharacter.crashWithFinal(myGamePiece[last_one - 1]) && mylife.val == 1) {
    if (myGameCharacter.crashWithFinal(myGamePiece[last_one - 1])) {        
        myGameArea.stop();
        accumulated_score += myscore.val;
        document.getElementById("myfilter").style.display = "block";
        document.getElementById("mywinbutton").style.display = "block";   
        console.log('winwinwin');
        beforeBackhome(USER_ID);
    }

    getvolume();
   // check whether the character hit the block 
    for(i=0;i<myGamePiece.length-2;i++){ 
        // if (myGameCharacter.crashWith(myGamePiece[last_one-2], myGamePiece[last_one - 1]) && mylife.val == 1) {
        //     myGameArea.stop();
        //     accumulated_score += myscore.val;
        //     document.getElementById("myfilter").style.display = "block";
        //     document.getElementById("mywinbutton").style.display = "block";   
        //     console.log('winwinwin');

        // } else {

        if (myGameCharacter.crashWith(myGamePiece[i], myGamePiece[i+1])) {

            myGameArea.stop();
            mylife.val -= 1;
            mylife.update();
            accumulated_score += myscore.val;
            myscore.update(myscore.val); 
            if (mylife.val>0) {  
                document.getElementById("myfilter").style.display = "block";
                console.log('nownownow')
                document.getElementById("myrestartbutton").style.display = "block";
                console.log(mylife.val);
                return;
            }
            else {
                 beforelose(USER_ID);
                document.getElementById("myfilter").style.display = "block";
                document.getElementById("mybackhomebutton").style.display = "block";   
            } 
        }
         // }
    }
    myGameArea.clear();

    // periodically send game state to the server
    TIME_SAVE_STATE += 1;
    if(TIME_SAVE_STATE%5==0){
        // ##################################################
        // TODO: post gameState_json to the server
        // ##################################################
        
        $.ajax({
                method: "post",
                url: "update_state/"+USER_ID,
                data: { life: mylife.val,
                        score: myscore.val,
                        current_location: myGamePiece[0].x,
                        csrfmiddlewaretoken: $("[name=csrfmiddlewaretoken]")[0].content },
                async: true
            }).done(function(data){

                // console.log('yeah');
            });

    }



    myGameArea.frameNo =  - (myGamePiece[0].x - 30);
    char_meet_candy();
   
    for(i=0;i<myGamePiece.length;i++){ 
        myGamePiece[i].update();
        myGamePiece[i].newPos();
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
        mylife.update();
        myscore.update(0);  
    }
    else{
        if(myGameCharacter.hitBottom(myGamePiece[idx])==false){
            myGameCharacter.update();
            myGameCharacter.newPos(myGamePiece[idx].y);
            mylife.update();
            myscore.update(0);  
        }else{
             myGameCharacter.update();  
            myGameArea.stop();           
            mylife.val -= 1;
            mylife.update();
            myscore.update(0); 
             if (mylife.val>0) {  
            document.getElementById("myfilter").style.display = "block";
            console.log('nownownow');
            document.getElementById("myrestartbutton").style.display = "block";
            }else {
                beforelose(USER_ID);
                document.getElementById("myfilter").style.display = "block";
                document.getElementById("mybackhomebutton").style.display = "block";

            }    
        }    
    }
    
}