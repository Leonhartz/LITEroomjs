/*
*  Property of LITEroom, UNSW.
*  Author: Seyha Sok (Application Developer)
*  All rights reserved. (Nov, 2017)
*
*/

"use strict";

//======================================================================
AFRAME.registerComponent('lite.trailing-ui',{
  init: function(){
    
  }
  
});

// factory for creating DOM elements
function CreateElement(data){
  let el = document.createElement(data.el_type);
  if(data.id && data.id != "") el.setAttribute("id", data.id);

  if(data.height) el.setAttribute("height", data.height);
  if(data.width) el.setAttribute("width", data.width);
  if (data.position && data.position != "") el.setAttribute("position", data.position);
  if (data.shader && data.shader != "") el.setAttribute("material", "shader", data.shader);
  if (data.tex && data.tex != ""){
    el.setAttribute("material", "src", data.tex);
    el.setAttribute("material", "transparent", true);
  } 
  if (data.color && data.color != "") el.setAttribute("color", data.color);
  if (data.src && data.src != "") el.setAttribute("src", data.src);
  if(data.value && data.value != "") el.setAttribute("value", data.value);

  return el;
}


//======================================================================
AFRAME.registerComponent('lite.videoplayer',{
  schema:{
    vid: {type: "string"},
    width: {default: 8},
    height: {default: 0.4},
    sk_width: {default: 0.1},
    sk_height: {default: 0.5},
    bg_color: {default: '#aaa'}, // background color
    fg_color: {default: '#f55'}, // foreground color
    bf_color: {default: '#fff'}, // buffer color
    bf_zoffset: {default: 0.01},
    fg_zoffset: {default: 0.02},
    sk_color: {default: '#aaa'}, // seeker color (the button that move along the bar to tell the current playing time)
    sk_zoffset: {default: 0.03}, 
    txt_width: {default: 13}, // width of the text. also determine the size of the letters.
    txt_pos: {default: "0 1 0"}, // position of the text
    txt_color: {default: "#f80"},
    txt_align: {default: "center"},
    txt_value: {default: "Loading..."}
  },
  init: function(){
    //console.log("video player is here!");
    var self = this;
    // try to find video element
    if(this.data.vid && this.data.vid != ""){
      
      var vid = document.getElementById(this.data.vid);
      if(vid){
        this.initialized = true;
        this.vid = vid;
      }else{
        console.warn("Cannot find element id: " + this.data.vid + ". lite.videoplayer is not initialzed.");
        return;
      }
    }else{
      console.warn("id of the video asset ('vid' property) must be provided for lite.videoplayer to work.");
      return;
    }
    // if the video element is found, we start creating the ui
    if(!vid) return;
    
    // container element
    let container = CreateElement({
      el_type: "a-entity"
    });
    this.el.appendChild(container);
    // background plane
    let bg = CreateElement({
      el_type: "a-plane",
      height: this.data.height,
      width: this.data.width,
      color: this.data.bg_color,
      shader: "flat"
    });
    container.appendChild(bg);
    
    // buffer plane
    let bf = CreateElement({
      el_type: "a-plane",
      height: this.data.height,
      width: 0.1,
      color: this.data.bf_color,
      position: "0 0 " + this.data.bf_zoffset,
      shader: "flat"
    });
    container.appendChild(bf);
    
    // foreground plane
    let fg = CreateElement({
      el_type: "a-plane",
      
      height: this.data.height,
      width: 0.1,
      color: this.data.fg_color,
      position: "0 0 " + this.data.fg_zoffset,
      shader: "flat"
    });
    container.appendChild(fg);
    
    // seeker head
    let sk = CreateElement({
      el_type: "a-plane",
      
      height: this.data.sk_height,
      width: this.data.sk_width,
      color: this.data.sk_color,
      position: "0 0 " + this.data.sk_zoffset,
      shader: "flat"
    });
    container.appendChild(sk);
    
    // loading message
    let msg = CreateElement({
      el_type: "a-text",
      
      height: this.data.height,
      width: this.data.txt_width,
      color: this.data.txt_color,
      position: "0 1 0.0",
      shader: "flat",
      value: this.data.txt_value
    });
    msg.setAttribute("align", this.data.txt_align);
    msg.setAttribute("visible", false);
    container.appendChild(msg);
    
    // Handle buffer added
    vid.addEventListener("progress", function(el){
      OnBufferAdded(el.currentTarget);
    });
    
    function OnBufferAdded(video){
      //console.log(video);
      if(video.buffered.length > 0){
        
        let w = video.buffered.end(0) / video.duration * self.data.width;
        let x = w / 2 - self.data.width / 2;
        
        bf.setAttribute("width", w);
        bf.setAttribute("position", x + " 0 " + self.data.bf_zoffset);
      }
    }
    
    // Handle waiting for buffer
    vid.addEventListener("waiting", function(el){
      OnWaiting(el.currentTarget);
    });
    
    function OnWaiting(video){
      console.log("buffering");
      msg.setAttribute("visible", true);
      
    }
    
    // Handle playing start
    vid.addEventListener("playing", function(el){
      OnPlaying(el.currentTarget);
    });
    
    function OnPlaying(video){
      console.log("playing");
      msg.setAttribute("visible", false);
      
    }
    
    // Handle time updated
    vid.addEventListener("timeupdate", function(el){
      OnTimeUpdate(el.currentTarget);
    });
    
    function OnTimeUpdate(video){
      let w = video.currentTime / video.duration * self.data.width;
      let x = w / 2 - self.data.width / 2;
      let sk_x = w - self.data.width / 2;
      fg.setAttribute("width", w);
      fg.setAttribute("position", x + " 0 " + self.data.fg_zoffset);
      sk.setAttribute("position", sk_x + " 0 " + self.data.sk_zoffset);
    }
  }
});

//======================================================================
// TODO: Add a way to get the value from this component
AFRAME.registerComponent('lite.input-scalebar',{
  schema:{
    height: {default: 0.3},
    width: {default: 5},
    bg_color: {default: '#fff'}, // background color
    fg_color: {default: '#f8e71c'}, // foreground color
    bg_src: {default: 'https://cdn.glitch.com/d03a1814-ebbc-434e-ae3b-db712f3fecf2%2Fbar_bg.png?1510611123650'}, // background texture
    fg_src: {default: 'https://cdn.glitch.com/d03a1814-ebbc-434e-ae3b-db712f3fecf2%2Fbar_process_white.png?1510611125693'}, // foreground texture
    plus_tex: {default: "https://cdn.glitch.com/d03a1814-ebbc-434e-ae3b-db712f3fecf2%2Fplus.png?1510611137813"}, // source to the texture for the plus button
    minus_tex: {default: "https://cdn.glitch.com/d03a1814-ebbc-434e-ae3b-db712f3fecf2%2Fminus.png?1510611136507"}, // source to the texture for the minus button
    plus_sel_tex: {default: "https://cdn.glitch.com/d03a1814-ebbc-434e-ae3b-db712f3fecf2%2Fplus_sel.png?1510611139999"}, // source to the texture for the plus button when selected
    minus_sel_tex: {default: "https://cdn.glitch.com/d03a1814-ebbc-434e-ae3b-db712f3fecf2%2Fminus_sel.png?1510611139539"}, // source to the texture for the minus button when selected
    plus_color: {default: "#fff"}, // color of the selected plus button
    minus_color: {default: "#fff"}, // color of the selected minus button
    plus_sel_color: {default: "#fff"}, // color of the selected plus button
    minus_sel_color: {default: "#fff"}, // color of the selected minus button
    btn_width: {default: 0}, // 0 means to take the value of the height(not width) of the background
    btn_height: {default: 0}, // 0 means to take the value of the height of the background
    // label_txt: {type: 'string', default: ""}, // if the string is empty, there won't be any label element
    // label_pos: {default: "0 0.6 0"}, // won't be used if there is no label element
    anchor: {default: "l"}, // should the foreground anchored to the left or right? accepted values: l, left, r, right
    min: {default: 0},
    max: {default: 10}, // if min is not less than max, the values will not be accepted and be set to 0 - 10.
    step: {default: 1}, // per second if control is set to "hold". Otherwise, it's per click.
    value: {default: 5}, // current value. If it's not between min and max, it will be set to min or max
    display_value: {default: true}, // display the value as text
    value_color: {default: "#000"},
    value_prefix: {default: ""}, // a string to be displayed in front of the value
    value_postfix: {default: ""}, // a string to be displayed after the value. eg. %
    value_height: {default: 0.5}, // this property seems useless :(
    value_width: {default: 8}, // determine the size of the text
    value_align: {default: "center"},
    value_decimal_place: {default: 0}, //
    responsive_cursor: {default: true}, // enable or disable responsive cursor feature
    control: {default: "click"} // there are 2 types of control scheme. "click" -> only increase/decrease on click. "hold" -> click and hold to increase/decrease.
  },
  init: function(){
    
    console.log("scale bar is here!")
    
    let self = this;
    this.clicked = "none";
    // Create scalebar container element and append it as a child to the this element
    let scalebar_con = document.createElement("a-entity");
    scalebar_con.setAttribute("id", "scalebar_con");
    this.el.appendChild(scalebar_con);
    
    // validating min, max, and value
    if(this.data.min >= this.data.max){
      this.data.min = 0;
      this.data.max = 10;
    }
    
    if(this.data.value < this.data.min){
      this.data.value = this.data.min;
    }
    
    if(this.data.value > this.data.max){
      this.data.value = this.data.max;
    }
    
    
    // Create the background bar
    let bg = CreateElement({
      el_type: "a-plane",
      id: "bg",
      height: this.data.height,
      width: this.data.width,
      color: this.data.bg_color,
      tex: this.data.bg_src,
      shader: "flat"
    });
    scalebar_con.appendChild(bg);
    
    // Create the foreground bar
    let fg = CreateElement({
      el_type: "a-plane",
      id: "fg",
      height: this.data.height,
      width: this.data.width * (this.data.value > 1 ? 1 : (this.data.value < 0 ? 0 : this.data.value)),
      color: this.data.fg_color,
      tex: this.data.fg_src,
      position: "0 0 0.01",
      shader: "flat"
    });
    fg.anchor = this.data.anchor;
    scalebar_con.appendChild(fg);
    updateFg();
    
    // create text element to display value if needed
    let vText;
    if(self.data.display_value){
      vText = CreateElement({
        el_type: "a-text",
        id: "vText",
        height: this.data.value_height,
        width: this.data.value_width,
        position: "0 0 0.02",
        color: this.data.value_color
      });
      updateValueText();
      vText.setAttribute("align", this.data.value_align);
      scalebar_con.appendChild(vText);
    }
    
    
    
    // update the foreground width and position to match the current value
    function updateFg(){
      var width = (self.data.value - self.data.min) / (self.data.max - self.data.min) * self.data.width;
      fg.setAttribute("width", width);
      
      if(fg.anchor == "l"|| fg.anchor == "left"){
        let x = width/2 - self.data.width/2;
        fg.setAttribute("position", x + " 0 0.01");
      }
      else if(fg.anchor == "r"|| fg.anchor == "right"){
        let x = self.data.width/2 - width/2;
        fg.setAttribute("position", x + " 0 0.01");
      }
    }
    
    // function to handle the foreground width and position when setting new value. MUST call this to set the value.
    this.updateValue = updateValue;
    function updateValue(v){
      self.data.value = v;
      updateFg();
      updateValueText();
    }
    
    // handle value text
    function updateValueText(){
      let v = self.data.value; 
      v = v.toFixed(self.data.value_decimal_place);
      vText.setAttribute("value", self.data.value_prefix + v + self.data.value_postfix);
    }
    
    // Create the plus button
    let plus = CreateElement({
      el_type: "a-plane",
      id: "plus",
      height: this.data.btn_height == 0 ? this.data.height : this.data.btn_height,
      width: this.data.btn_width == 0 ? this.data.height : this.data.btn_width,
      position: (this.data.width / 2 + 0.5) + " 0 0",
      shader: "flat",
      tex: this.data.plus_tex
    });
    plus.addEventListener('click', add);
    plus.addEventListener('mouseleave', leave);
    scalebar_con.appendChild(plus);
    
    // Create the minus button
    let minus = CreateElement({
      el_type: "a-plane",
      id: "minus", 
      height: this.data.btn_height == 0 ? this.data.height : this.data.btn_height,
      width: this.data.btn_width == 0 ? this.data.height : this.data.btn_width,
      position: -(this.data.width / 2 + 0.5) + " 0 0",
      shader: "flat",
      tex: this.data.minus_tex
    });
    minus.addEventListener('click', sub);
    minus.addEventListener('mouseleave', leave);
    scalebar_con.appendChild(minus);
    
    // Add lite.responsive_cursor component to the buttons if needed
    if(this.data.responsive_cursor){
      
      plus.setAttributeNode(document.createAttribute("lite.responsive_cursor"));
      minus.setAttributeNode(document.createAttribute("lite.responsive_cursor"));
      
      plus.setAttribute("lite.responsive_cursor", "btex_sel", this.data.plus_sel_tex);
      minus.setAttribute("lite.responsive_cursor", "btex_sel", this.data.minus_sel_tex);
      plus.setAttribute("lite.responsive_cursor", "tex_sel", this.data.plus_tex);
      minus.setAttribute("lite.responsive_cursor", "tex_sel", this.data.minus_tex);
      plus.setAttribute("lite.responsive_cursor", "bcolor_sel", this.data.plus_sel_color);
      minus.setAttribute("lite.responsive_cursor", "bcolor_sel", this.data.minus_sel_color);
      plus.setAttribute("lite.responsive_cursor", "bcolor", this.data.plus_color);
      minus.setAttribute("lite.responsive_cursor", "bcolor", this.data.minus_color);
    }
    
    // handle add and subtract when clicked
    this.add = add;
    function add(){
      //console.log("plus");
      
      self.clicked = "plus";
      if(self.data.control == "click"){
        self.data.value += self.data.step;
        updateValue(self.data.value > self.data.max ? self.data.max : self.data.value);
      }
    }
    this.sub = sub;
    function sub(){
      //console.log("minus");
      self.clicked = "minus";
      if(self.data.control == "click"){
        self.data.value -= self.data.step;
        updateValue(self.data.value < self.data.min ? self.data.min : self.data.value);
      }
      
    }
    
    // called when cursor leave the plus or minus button
    function leave(){
      self.clicked = "none";
      //console.log("leave");
    }
  
  },
  
  tick: function(t){
    let dt = 0;
    if(this.lastTick){
      dt = t - this.lastTick;
    }
    if(this.data.control == "hold" && this.clicked != "none"){
      let v = this.data.step * dt / 1000;
      if(this.clicked == "plus"){
        let v2 = this.data.value + v;
        v2 = v2 > this.data.max ? this.data.max : v2;
        this.updateValue(v2);
      }
      else if(this.clicked == "minus"){
        let v2 = this.data.value - v;
        v2 = v2 < this.data.min ? this.data.min : v2;
        this.updateValue(v2);
      }
      
    }
    this.lastTick = t;
  }
});

//======================================================================
AFRAME.registerComponent('lite.floatobject',{
  'init': function _init() {
    var mesh = this.el.object3D.children[0];
    
    if(mesh){
      mesh.renderOrder = 99;
      mesh.onBeforeRender = function( renderer ) { renderer.clearDepth(); };
    }
  }
});

//======================================================================
AFRAME.registerComponent('lite.responsive_cursor',{
    'schema': {
      color: {default: '#f0a000'}, // cursor's color when hover on a responsive entity
      bcolor: {default: '#fff'}, // color of this entity in normal state
      bcolor_sel: {default: '#fff'}, // color of this entity on hover state
      //btex: {default: ''}, // texture of this entity in normal state
      btex_sel: {default: ''}, // texture of this entity on hover state
      cursorShrinkRate: {default: 0.35}
    },
    'init': function() {
      //console.log(this.data);
      var cursor = document.querySelector("a-cursor");
      var data = this.data;
      var defaultColor = cursor.getAttribute("color");
      
      this.clicked = false;
      this.hover = false;
      
      this.cursorScale = cursor.getAttribute('scale');
      var cursorShrinkRate = this.data.cursorShrinkRate;
      this.cursorShrink = {x: this.cursorScale.x * cursorShrinkRate, y: this.cursorScale.y * cursorShrinkRate, z: this.cursorScale.z * cursorShrinkRate};
      this.interval = 100;
      this.curCursorScale = {x: this.cursorScale.x, y: this.cursorScale.y, z: this.cursorScale.z};
      //console.log(this.cursorShrink);
      
      // Store the original texture of the button
      let mat = this.el.getAttribute("material");
      if(mat){
        this.btex_default = mat.src;
      }
      this.bcolor_default = this.el.getAttribute("color");
      
      var self = this;
      
      this.el.addEventListener("mouseenter", function(el){
        //console.log("mouse enter");

        if(cursor){
          cursor.setAttribute("color", data.color);
        }
        // set the color of the button
        if(self.data.bcolor_sel){
          el.currentTarget.setAttribute("color", self.data.bcolor_sel);
        }
        // Set the texture of the button
        if(self.data.btex_sel && self.data.btex_sel != ""){
          el.currentTarget.setAttribute("material", "src", self.data.btex_sel);
        }
        self.hover = true;
        shrinkCursor();
      });
      
      this.el.addEventListener("mouseleave", function(el){
        //console.log("mouse leave");
        if(cursor){
          cursor.setAttribute("color", defaultColor);
        }
        
        if(self.bcolor_default){
          el.currentTarget.setAttribute("color", self.bcolor_default);
        }else{
          el.currentTarget.setAttribute("color", self.data.bcolor);
        }
        
        // Change the texture of the button to its original if it had one
        if(self.btex_default){
          el.currentTarget.setAttribute("material", "src", self.btex_default);
        }
        // Or change the texture to the one given in the schema
        else if(self.data.btex && self.data.btex != ""){
          el.currentTarget.setAttribute("material", "src", self.data.btex);
        }
        // Or remove the texture if nothing is given. this will make it use flat color
        // else{
        //   let mat = el.currentTarget.getAttribute("material");
        //   mat.src = null;
        // }
        self.hover = false;
        self.clicked = false;
        
      });
      
      this.el.addEventListener("click", function(el){
        self.clicked = true;
        
      });
      
      function shrinkCursor(){
        if(self.hover && !self.clicked){
          self.curCursorScale = {x: Math.max(self.curCursorScale.x - (self.cursorShrink.x * self.interval / 1000), 0.1),
                      y: Math.max(self.curCursorScale.y - (self.cursorShrink.y * self.interval / 1000),0.1),
                      z: Math.max(self.curCursorScale.z - (self.cursorShrink.z * self.interval / 1000),0.1)};
          cursor.setAttribute("scale", self.curCursorScale);
          setTimeout(shrinkCursor, self.interval);
          //console.log(scale);
        }else{
          deshrinkCursor();
        }
        
      }
      
      function deshrinkCursor(){
        cursor.setAttribute("scale", self.cursorScale);
        self.curCursorScale = {x: self.cursorScale.x, y: self.cursorScale.y, z: self.cursorScale.z};
      }
    }
});

//======================================================================
var LITEroom = function () {
  let lite = this;
  let _ready = false;
  let camera = {};
  let moveCon = false;
  let cam;
  
  this.hello = "hello world";
  
  this.init = function(){
    cam = document.querySelector("a-camera");
    if(!cam){
      let scene = document.querySelector("a-scene");
      cam = document.createElement("a-camera");
      scene.appendChild(cam);
    }
    camera = cam.object3D;
    update();
    
    _ready = true;
    
    console.log("Initialized LITERoom!");
  }
  
  this.enableMoveControl = function(){
    moveCon = true;
  }
  
  let gcons = document.getElementById("gcons");
  let x = 0;
  let y = 0;
  let movedir = new THREE.Vector3();
  let _x = 0;
  let _y = 0;
  let conscale = 1;
  let bound = 0.25 * conscale;
  this.curButton = "none";
  this.clicked = "none";
  
  //console.log(window.innerWidth + ' ' + window.innerHeight);
  function handleMoveControl(){
    _x = x;
    _y = y;
    _x += diff.y * conscale;
    _y -= diff.x * conscale;
    
    if(_x < bound && _x > -bound){
      x = _x;
    }
    if(_y < bound && _y > -bound){
      y = _y;
    }
    
    gcons.setAttribute("position", x+ " " + y + " 0");
    //console.log(camera.quaternion);
    if(lite.clicked == lite.curButton){
      
      if(lite.curButton == "up"){
        movedir.x = 0;
        movedir.y = 0;
        movedir.z = -1 * movespeed;
        movedir.applyQuaternion(camera.quaternion);
        let pos = cam.getAttribute("position");
        pos.x += movedir.x;
        pos.y += movedir.y;
        pos.z += movedir.z;
        
        cam.setAttribute("position", pos);
      }
      if(lite.curButton == "down"){
        movedir.x = 0;
        movedir.y = 0;
        movedir.z = 1 * movespeed;
        movedir.applyQuaternion(camera.quaternion);
        let pos = cam.getAttribute("position");
        pos.x += movedir.x;
        pos.y += movedir.y;
        pos.z += movedir.z;
        cam.setAttribute("position", pos);
      }
      if(lite.curButton == "left"){
        let pos = cam.getAttribute("position");
        movedir.z = 0;
        movedir.y = 0;
        movedir.x = 1 * movespeed;
        movedir.applyQuaternion(camera.quaternion);
        pos.x += movedir.x;
        pos.y += movedir.y;
        pos.z += movedir.z;
        cam.setAttribute("position", pos);
      }
      if(lite.curButton == "right"){
        let pos = cam.getAttribute("position");
        
        movedir.z = 0;
        movedir.y = 0;
        movedir.x = -1 * movespeed;
        movedir.applyQuaternion(camera.quaternion);
        pos.x += movedir.x;
        pos.y += movedir.y;
        pos.z += movedir.z;
        cam.setAttribute("position", pos);
      }
    }
  }
  
  let movespeed = 0.03;

  this.OnClick = function (button){
    lite.clicked = button.id;
    //console.log("curbutton: " + lite.curButton);
  }

  this.lmc_Enter = function (button){

    lite.curButton = button.id;
    console.log("curbutton: " + lite.curButton);
  }

  this.lmc_Leave = function (button){
    lite.curButton = "none";
    lite.clicked = "none";
    console.log("curbutton left: " + lite.curButton);
  }

  let update = function ()
  {
    handleCamRot();
    if(moveCon){
      handleMoveControl();
    }
    requestAnimationFrame(update);
  }

  let prevRot = new THREE.Vector3(); // previous rotation
  let diff = new THREE.Vector3(); // the difference in rotation vector from previous rotation
  let norm = new THREE.Vector3(); // diff normalized
  let verDef = 0.85; // norm.x larger than this value will be considered vertical (up or down)
  let horDef = 0.85; // norm.y larger than this value will be considered horizontal (left or right)
  let deadZone = 2.5; // rotation speed slower than this will be considered as no movement
  let dir = "none"; // Direction of head gesture. values: none, up, down, left, right, upleft, upright, downleft, downright
  let moves = []; // array of valid head movements that go into determining gesture.
  let gesture = "none"; // the current completed gesture after evaluating moves.
  let mtime = Date.now(); // time stamp of the last movement
  let ltime = Date.now(); // time stamp of the last frame. for calculating deltaTime.
  let deltaTime = 0; // how much time in second has passed since the last update.
  let dct = 300; // direction change time. E.g. to "nod up", the head must rotate up then down. the change in direction must not take longer than this duration. otherwise, the evaluation process will begin, and the move will be considered part of a new gesture.

  function handleCamRot(){
    let cur = camera.rotation.toVector3();
    diff.subVectors(cur, prevRot);
    norm.copy(diff);
    norm.normalize();
    let ctime = Date.now();
    deltaTime = (ctime - ltime) / 1000;
    
    // determine the current direction
    let curDir = dir;
    if(diff.length() / deltaTime < deadZone){
      curDir = "none";
    }
    else if(norm.x > verDef){
      curDir = "up";
    }else if(norm.x < -verDef){
      curDir = "down";
    }else if(norm.y > horDef){
      curDir = "left";
    }else if(norm.y < -horDef){
      curDir = "right";
    }else{
      curDir = "none";
    }
    
    if(curDir != "none"){
      mtime = ctime;
      // direction changed
      if(curDir != dir){
        if(dir == "none"){
          dir = curDir;
        }
        // moves does not store more than 8 items
        if(moves.length >= 8){
          moves.shift();
        }
        moves.push(curDir);
        dir = curDir;
      }
    }
    // head stop moving longer than dct, so we start evaluation process
    else if(ctime - mtime > dct){
      if(moves.length > 0){
        gesture = evaluateMoves();
        moves = []; // after evaluating, we clear the board
        dispatchHandlers();
      }
      mtime = 0;
    }
    
    ltime = ctime; // update time
    prevRot.copy(cur); // update rotation
  }

  function dispatchHandlers(){
    switch(gesture){
      case "nod_up":
      for(let f of nodUpHandlers){
        f();
      }
      break;
      case "nod_up_2":
      for(let f of nodUp2Handlers){
        f();
      }
      break;
      case "nod_down":
      for(let f of nodDownHandlers){
        f();
      }
      break;
      case "nod_down_2":
      for(let f of nodDown2Handlers){
        f();
      }
      break;
      case "shake_left":
      for(let f of shakeLeftHandlers){
        f();
      }
      break;
      case "shake_left_2":
      for(let f of shakeLeft2Handlers){
        f();
      }
      break;
      case "shake_right":
      for(let f of shakeRightHandlers){
        f();
      }
      break;
      case "shake_right_2":
      for(let f of shakeRight2Handlers){
        f();
      }
      break;
      default: break;
    }
  }

  function evaluateMoves (){
    for(let gest in gestureDefinition){
      if(gestureDefinition[gest].length <= moves.length){
        let match = true;
        for(let i = moves.length - gestureDefinition[gest].length, j = 0; i < moves.length; i++, j++){
          if(gestureDefinition[gest][j] != moves[i]){
            match = false;
            break;
          }
        }
        if(match){
          return gest;
        }
      }
    }
    return "none";
  }
  
  let gestureDefinition = {
    "nod_up_2": ["up", "down","up", "down"],
    "nod_down_2": ["down", "up", "down", "up"],
    "shake_left_2": ["left", "right", "left", "right"],
    "shake_right_2": ["right", "left", "right", "left"],
    "nod_up": ["up", "down"],
    "nod_down": ["down", "up"],
    "shake_left": ["left", "right"],
    "shake_right": ["right", "left"]
  }

  let nodUpHandlers = [];
  let nodUp2Handlers = [];
  let nodDownHandlers = [];
  let nodDown2Handlers = [];
  let shakeLeftHandlers = [];
  let shakeRightHandlers = [];
  let shakeLeft2Handlers = [];
  let shakeRight2Handlers = [];

  this.addEventListener = function(event, func){
    switch (event){
      case "nod_up": 
        nodUpHandlers.push(func);
        break;
      case "nod_up_2": 
        nodUp2Handlers.push(func);
        break;
      case "nod_down": 
        nodDownHandlers.push(func);
        break;
      case "nod_down_2": 
        nodDown2Handlers.push(func);
        break;
      case "shake_left": 
        shakeLeftHandlers.push(func);
        break;
      case "shake_left_2": 
        shakeLeft2Handlers.push(func);
        break;
      case "shake_right": 
        shakeRightHandlers.push(func);
        break;
      case "shake_right_2": 
        shakeRight2Handlers.push(func);
        break;
    }
  }

  //TODO: complete this function
  this.removeEventListener = function(event, func){
    switch (event){
      case "nod":
      break;
      case "shake":
      break;
    }
  }

  this.isReady = function(){
    return _ready;
  }

  this.props = {
    get ready(){
      return _ready;
    },

    get _deadZone(){
      return deadZone;
    },

    set _deadZone(v){
      deadZone = v;
    }
  };
};
var LITERoom = LITEroom;