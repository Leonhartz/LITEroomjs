/*
*  Property of LITEroom, UNSW.
*  Author: Seyha Sok (Application Developer)
*  All rights reserved.
*
*/

/*********************************************
============================================

  Update notes are at the bottom of this file.

============================================
*********************************************/

"use strict";

function $(id){
    return document.getElementById(id);
}


AFRAME.registerComponent("lite.layout", {
  schema: {
    col: {default: 1}, // number of columns
    padding_x: {default: 0.25},
    padding_y: {default: 0.25},
    
    align_h: {default: "middle"}, // how to align horizontally. Accepted values: middle, left, right
    align_v: {default: "center"}, // how to align vertically. Accepted values: center, top, bottom
  },
  init: function(){
    var ch = this.el.children;
    let sizes = []; // width and height of each element
    let offsetX = 0;
    let offsetY = 0;
    let rowHeight = []; // height of each row
    let rowWidth = []; // width of each row
    let alignOffsetX = 0, alignOffsetY = 0;
    let totalWidth = 0; // total width is the width of the widest row
    let totalHeight = 0; // total height of all the rows
    
    if(this.data.col <= 0) this.data.col = 1;
    
    let col = this.data.col;
    let self = this;
    
    // calculate width and height
    let row = 0;
    let rwidth = 0, rheight = 0;
    for(let i = 0; i < ch.length; i++){
      sizes[i] = getSize(ch[i]);
      
      // get the width of the row
      rwidth += sizes[i].width;
      
      // the height of the row is the height of the highest element
      if(sizes[i].height > rheight) rheight = sizes[i].height;
      
      // total width is the width of the widest row
      if(rwidth > totalWidth) totalWidth = rwidth;
      
      if(i % col == col - 1){
        // store the width of the row
        rowWidth[row] = rwidth;
        rwidth = 0;
        
        // store row height
        rowHeight[row] = rheight;
        
        // add row height and padding to the total height
        totalHeight += rheight + self.data.padding_y;
        rheight = 0;
        row += 1;
      }
    }
    if(rheight > 0){
      rowHeight[row] = rheight;
      rowWidth[row] = rwidth;
      totalHeight += rheight;
    }
    
    // calculate height offset
    switch(this.data.align_v){
      case "center" :
        alignOffsetY = -totalHeight / 2;
        break;
      case "bottom" :
        alignOffsetY = -totalHeight;
        break;
    }
    
    // place the elements in their rightful position
    row = -1;
    for(let i = 0; i < sizes.length; i++){
      
      if(i % col == 0){
        row += 1;
        offsetX = 0;
        offsetY += rowHeight[row] / 2;
        offsetY += row > 0 ? rowHeight[row - 1] / 2 + self.data.padding_y: self.data.padding_y;
        
        switch(this.data.align_h){
          case "middle" :
            alignOffsetX = - rowWidth[row] / 2;
            break;
          case "right" :
            alignOffsetX = -rowWidth[row];
            break;
        }

        
      }
      
      offsetX += sizes[i].width/2;
      offsetX += i % col > 0 ? sizes[i - 1].width / 2 + this.data.padding_x: 0;
      
      let x = offsetX + alignOffsetX;
      let y = -offsetY + alignOffsetY + totalHeight;
      ch[i].setAttribute("position", x + " " + y + " 0");
    }
    
    // Get the size of an element
    function getSize(el){
      let size = {width: 0, height: 0};
      let scale = self.getScale(el);
      
      switch(el.localName){
        case "a-box":
        case "a-plane": 
          
          size.width = scale.x;
          size.height = scale.y;
          break;
        case "a-sphere":
        case "a-circle":
          
          size.width = scale.x * 2;
          size.height = scale.y * 2;
          
          break;
        case "a-entity":
          
          let geo = el.getAttribute("geometry");
          if(geo !== undefined){
            let prim = geo.primitive;
            
            let w,h;
            
            switch(prim){
              case "sphere":
              case "circle":
                w = geo.radius;
                w *= 2;
                h = w
                //console.log(w);
                break;
              default:
                //console.log(geo);
                w = geo.width;
                h = geo.height;
                
            }
            
            size.width = w * scale.x;
            size.height = h * scale.y;
            
          }else{
            return {width:0, height:0};
          }
          
      }
      //console.log(size);
      return size;
    }
    
    
  },
  
  getScale: function(el){
    let scale = el.getAttribute("scale");
    if(scale === undefined){
      scale = {x:1, y:1, z:1};
    }
    return scale;
  }
  
});



/*
*  ========= 0.2.9 ========== (21/Jan/2018)
*  lite.camera-orbit
*/
AFRAME.registerComponent("lite.camera-orbit", {
  schema: {
    speed: {default: 1.0},
    inverted: {default: false},
    maxV: {default: 80},
    target: {default: "orbitTarget"},
  },
  init: function(){
    if(this.data.target === undefined || this.data.target == null || this.data.target == ""){
      console.warn("You must give the target for lite.orbit to work!");
      return;
    }
    
    let target_el = document.getElementById(this.data.target);
    if(target_el === undefined || target_el == null){
      console.warn("Could not find target element!");
      return;
    }
    
    
    let camera = this.el.sceneEl.camera;
    camera.el.setAttribute("look-controls-enabled", false);
    
    if(this.data.maxV > 89){
      this.data.maxV = 89;
    }
    
    let mousedown = false;
    let lat = 0, rlat = 0, rlon = 0, lon = 0, prev = {x: 0, y: 0}, curr = {x: 0, y: 0}, delta = {x: 0, y: 0};
    let target_pos;
    let self = this;
    
    document.addEventListener("mousedown", onmousedown);
    document.addEventListener("mouseup", onmouseup);
    document.addEventListener("mousemove", onmousemove);
    document.addEventListener("touchstart", onmousedown);
    document.addEventListener("touchend", onmouseup);
    document.addEventListener("touchmove", onmousemove);
    
    // calculate the orbit and look orientation at the start
    initialOrbit();
    
    function onmousedown(evt){
      mousedown = true;
      
      // initialize mouse values on mousedown so that it doesn't pick up old click position
      curr.x = getClientX(evt);
      curr.y = getClientY(evt);
      prev.x = curr.x;
      prev.y = curr.y;
    }
    
    function onmouseup(evt){
      mousedown = false;
    }
    
    function onmousemove(evt){
      if(!mousedown) return;
      
      // update mouse movement data
      prev.x = curr.x;
      prev.y = curr.y;
      curr.x = getClientX(evt);
      curr.y = getClientY(evt);
      
      delta.x = curr.x - prev.x;
      delta.y = curr.y - prev.y;
      
      // re-acquire the target in case it moved or user switched target
      updateTarget();
      // calculate new orbit position and orientation
      orbit();
    }
    
    
    //acquire the target position
    function updateTarget(){
      let t_pos = target_el.getAttribute("position");
      if(t_pos === undefined || t_pos == null){
        target_pos = new THREE.Vector3();
        return;
      }
      if(t_pos.x === undefined || t_pos.x == null){
        let vec = new THREE.Vector3();
        let p = t_pos.split(" ");
        vec.x = parseFloat(p[0]);
        vec.y = parseFloat(p[1]);
        vec.z = parseFloat(p[2]);
        target_pos = vec;
        
        return;
      }
      
      target_pos = t_pos;
    }
    
    // calculate the initial orbit and look orientation
    function initialOrbit(){
      let cam_pos = camera.el.getAttribute("position");
      updateTarget();
      
      let diffH = new THREE.Vector3(target_pos.x - cam_pos.x, 0, target_pos.z - cam_pos.z);
      let diffV = new THREE.Vector3(0, target_pos.y - cam_pos.y, target_pos.z - cam_pos.z);
      let forward = new THREE.Vector3(0, 0 , -1);
      lat = toDegrees(-forward.angleTo(diffV));
      lon = toDegrees(forward.angleTo(diffH));
      
      orbit();
    }
    
    // calculate new orbit position and orientation
    function orbit(){
      let cam_pos = camera.el.getAttribute("position");
      
      if(self.data.inverted){
        lon += delta.x * self.data.speed / 10;
        lat += delta.y * self.data.speed / 10;
      }else{
        lon -= delta.x * self.data.speed / 10;
        lat -= delta.y * self.data.speed / 10;
      }
      lat = lat < -self.data.maxV ? -self.data.maxV : lat > self.data.maxV ? self.data.maxV : lat;
      lon = lon > 180 ? lon - 360 : lon < -180 ? lon + 360 : lon;
      
      rlat = toRadians(lat);
      rlon = toRadians(lon);
      
      let dist = new THREE.Vector3(target_pos.x - cam_pos.x, target_pos.y - cam_pos.y, target_pos.z - cam_pos.z);
      
      let pos = new THREE.Vector3(0, 0, dist.length());
      
      let euler = new THREE.Euler(rlat, rlon, 0, "YXZ");
      pos.applyEuler(euler);
      pos.add(target_pos);
      camera.el.setAttribute("position", pos);
      
      let rot = euler.toVector3();
      toDegreesVector(rot);
      camera.el.setAttribute("rotation", rot);
    }
  },
  
});


/*
*  ========= 0.2.8 ========== (18/Jan/2018)
*  lite.camera-zoom
*/

AFRAME.registerComponent("lite.camera-zoom", {
  schema: {
    speed: {default: 1},
    fov: {default: 80},
  },
  
  init: function(){
    let self = this;
    
    document.addEventListener("wheel", onmousewheel);
    document.addEventListener("touchmove", ontouchmove);
    document.addEventListener("touchstart", ontouchstart);
    let camera = this.el.sceneEl.camera;
    
    camera.el.setAttribute("fov", this.data.fov);
    
    let touch0_x = 0,
    touch0_y = 0,
    touch1_x = 0,
    touch1_y = 0,
    ptouch0_x = 0,
    ptouch0_y = 0,
    ptouch1_x = 0,
    ptouch1_y = 0,
    delta_x = 0,
    delta_y = 0;
    
    function onmousewheel(evt){
      
      applyZoom(evt.deltaY);
    }
    
    function ontouchstart(evt){
      //alert(evt.touches.length);
      touch0_x = evt.touches[0].clientX;
      touch0_y = evt.touches[0].clientY;
      
      if(evt.touches.length > 1){
        touch1_x = evt.touches[1].clientX;
        touch1_y = evt.touches[1].clientY;
        //alert(evt.touches.length);
      }
      
      ptouch0_x = touch0_x;
      ptouch0_y = touch0_y;
      ptouch1_x = touch1_x;
      ptouch1_y = touch1_y;
      
    }
    
    function ontouchmove(evt){
      ptouch0_x = touch0_x;
      ptouch0_y = touch0_y;
      ptouch1_x = touch1_x;
      ptouch1_y = touch1_y;
      
      touch0_x = evt.touches[0].clientX;
      touch0_y = evt.touches[0].clientY;
      
      if(evt.touches.length > 1){
        touch1_x = evt.touches[1].clientX;
        touch1_y = evt.touches[1].clientY;
        
        let pdist = new THREE.Vector2();
        pdist.x = ptouch1_x - ptouch0_x;
        pdist.y = ptouch1_y - ptouch0_y;
        
        let dist = new THREE.Vector2();
        dist.x = touch1_x - touch0_x;
        dist.y = touch1_y - touch0_y;
        
        let diff = dist.length() - pdist.length();
        
        applyZoom(diff * 5);
      }
      
    }
    function applyZoom(value){
      let fov = camera.fov;
      fov -= value * self.data.speed / 100;
      fov = fov < 1 ? 1 : fov > 160 ? 160 : fov;

      camera.el.setAttribute("fov", fov);
    }
  },
});


/*
*  ========= 0.2.7 ========== (18/Jan/2018)
*  lite.rotate
*/
AFRAME.registerComponent("lite.rotate", {
  schema: {
    speed: {default: 4.0}
  },
  init: function(){
    
    let mousedown = false;
    let delta = {x:0, y:0};
    let getDelta = function(){
      var v = {x:0, y:0};
      v.x = this.curr.x - this.prev.x;
      v.y = this.curr.y - this.prev.y;
      return v;
    };
    let prev = {x:0, y:0};
    let curr = {x:0, y:0};
    
    let self = this;
    let entity = this.el.object3D;
    
    let rotateStartPoint = new THREE.Vector3(0, 0, 1);
	  let rotateEndPoint = new THREE.Vector3(0, 0, 1);
    
    //this.el.setAttribute("look-controls-enabled", false);
    document.addEventListener("mousedown", onmousedown);
    document.addEventListener("mouseup", onmouseup);
    document.addEventListener("mousemove", onmousemove);
    document.addEventListener("touchstart", onmousedown);
    document.addEventListener("touchend", onmouseup);
    document.addEventListener("touchmove", onmousemove);
    
    function onmousedown(evt){
      mousedown = true;
      curr.x = getClientX(evt);
      curr.y = getClientY(evt);
      prev.x = curr.x;
      prev.y = curr.y;
      
    }
    
    function onmouseup(evt){
      mousedown = false;
    }
    
    function onmousemove(evt){
      prev.x = curr.x;
      prev.y = curr.y;
      curr.x = getClientX(evt);
      curr.y = getClientY(evt);
      delta.x = curr.x - prev.x;
      delta.y = curr.y - prev.y;
      
      if(mousedown){
        handleRotation();
      }
    }
    
    function handleRotation(){
      
      rotateEndPoint = projectOnTrackball(delta.x, delta.y);

      var rotateQuaternion = rotateMatrix(rotateStartPoint, rotateEndPoint, self.data.speed);
      var curQuaternion = entity.quaternion;
      curQuaternion.multiplyQuaternions(rotateQuaternion, curQuaternion);
      curQuaternion.normalize();
      entity.setRotationFromQuaternion(curQuaternion);

      rotateEndPoint = rotateStartPoint;
	  };
    
  },
  
});

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

function toDegreesVector(vec){
  vec.x = toDegrees(vec.x);
  vec.y = toDegrees(vec.y);
  vec.z = toDegrees(vec.z);
}
function toRadians (angle) {
  return angle * (Math.PI / 180);
}
function toDegrees (angle) {
  return angle * (180 / Math.PI);
}

function getClientX(event){
      switch(event.type){
          case "mousedown":
          case "mouseup":
          case "mousemove":
              return event.clientX;
          
          case "touchstart":
          case "touchend":
          case "touchmove":
              return event.touches[0].clientX;
      }
  }
  
function projectOnTrackball(touchX, touchY)
	{
		var mouseOnBall = new THREE.Vector3();

		mouseOnBall.set(
			clamp(touchX / windowHalfX, -1, 1), clamp(-touchY / windowHalfY, -1, 1),
			0.0
		);

		var length = mouseOnBall.length();

		if (length > 1.0)
		{
			mouseOnBall.normalize();
		}
		else
		{
			mouseOnBall.z = Math.sqrt(1.0 - length * length);
		}

		return mouseOnBall;
	}

	function rotateMatrix(rotateStart, rotateEnd, rotationSpeed)
	{
		var axis = new THREE.Vector3(),
			quaternion = new THREE.Quaternion();

		var angle = Math.acos(rotateStart.dot(rotateEnd) / rotateStart.length() / rotateEnd.length());

		if (angle)
		{
			axis.crossVectors(rotateStart, rotateEnd).normalize();
			angle *= rotationSpeed;
			quaternion.setFromAxisAngle(axis, angle);
		}
		return quaternion;
	}

	function clamp(value, min, max)
	{
		return Math.min(Math.max(value, min), max);
	}

function getClientY(event){
    switch(event.type){
        case "mousedown":
        case "mouseup":
        case "mousemove":
            return event.clientY;

        case "touchstart":
        case "touchend":
        case "touchmove":
            return event.touches[0].clientY;
        default: 
            return 0;
    }
}
  
function getScreenX(event){
    switch(event.type){
        case "mousedown":
        case "mouseup":
        case "mousemove":
            return event.ScreenX;

        case "touchstart":
        case "touchend":
        case "touchmove":
            return event.touches[0].ScreenX;
    }
}

function getScreenY(event){
    switch(event.type){
        case "mousedown":
        case "mouseup":
        case "mousemove":
            return event.ScreenY;

        case "touchstart":
        case "touchend":
        case "touchmove":
            return event.touches[0].ScreenY;
        default: 
            return 0;
    }
}


//======================================================================
AFRAME.registerSystem('lite.videoevent',{
    
    init: function(){
        console.log("lite.videoevent: System initialized!");
    },
    registerEvent: function(evt){
        if(evt.data.vid == ""){
            console.warn("**** Video event must have a vid (video id) to register with the system! ****");
            return;
        }
        
        if(evt.data.func == ""){
            console.warn("**** Video event must have a function to register with the system! ****");
            return;
        }
        
        // Verify the vid
        let video = $(evt.data.vid);
        if(video === undefined || video.tagName.toLowerCase() != "video" ){
            console.warning("Video ID (vid) provided does not belong to a video element!");
            return;
        }

        // Set id for the component for future reference
        if(evt.systemId === undefined) evt.systemId = this.idCounter++;

        console.log("register event ======= ");
        // register the component to the events object
        if(this.events[evt.data.vid] === undefined){
            this.events[evt.data.vid] = {[evt.systemId]: evt.data};
            video.addEventListener("timeupdate", eventTrigger);
        }else{
            this.events[evt.data.vid][evt.systemId] = evt.data;
        }
        let self = this;

        // Handle triggering events based on video time
        function eventTrigger(e){
            let video = e.currentTarget;
            let events = self.events[video.id];
            let t = video.currentTime;

            // If there is no events, unsubscribe from video
            if(isEmpty(events)){
                video.removeEventListener("timeupdate", eventTrigger);
                console.log("===== events is empty, unsubscribed!");
                return;
            }
            //console.log(t);
            for(let i in events){
                // untrigger the event if the video time is before the event time
                if(t < events[i].time){
                    events[i].triggered = false;
                }else{
                    // trigger all untriggered events
                    if(!events[i].triggered){
                        events[i].triggered = true;
                        executeFunctionByName(events[i].func, window);
                    }
                }
            }
        }
    },
    unregisterEvent: function(evt){
        console.log("unregister event ======== ");
        if(this.events[evt.data.vid] !== undefined){
            delete this.events[evt.data.vid][evt.systemId];
            if(isEmpty(this.events[evt.data.vid])){
                delete this.events[evt.data.vid];
            }
        }
    },
    events:{},
    idCounter: 0,
    
});

AFRAME.registerComponent('lite.videoevent',{
    multiple: true,
    schema:{
        vid: {type: "string"}, // The id attribute of the html video element
        time: {default: 0.0}, // Time (in seconds) in the video to trigger the function
        func: {type: "string"} // The name of the function to be called. Must be declared in the global scope. No parameters allowed.
    },
    init: function(){
        this.system.registerEvent(this);
    },
    remove: function(){
        this.system.unregisterEvent(this);
    }
});

function isEmpty(obj){
    for(let o in obj){
        return false;
    }
    return true;
}

function executeFunctionByName(functionName, context /*, args */) {
  var args = Array.prototype.slice.call(arguments, 2);
  var namespaces = functionName.split(".");
  var func = namespaces.pop();
  for(var i = 0; i < namespaces.length; i++) {
    context = context[namespaces[i]];
  }
  return context[func].apply(context, args);
}


//======================================================================
function toRadians (angle) {
  return angle * (Math.PI / 180);
}
function toDegrees (angle) {
  return angle * (180 / Math.PI);
}

AFRAME.registerComponent('lite.smart-visibility',{
  schema:{
    x_angle: {default: -60}
  },
  init: function(){
    var camera = document.querySelector("a-camera");
    if(!camera){
      console.warn("Cannot find camera!");
      return;
    } 
    this.camera = camera;
    this.x_angle_rad = toRadians(this.data.x_angle);
  },
  tick: function(t){
    //console.log(this.camera.object3D.rotation);
    if(this.camera.object3D.rotation.x < this.x_angle_rad){
      this.el.setAttribute("visible", true);
    }else{
      this.el.setAttribute("visible", false);
    }
  }
});


//======================================================================
/*
*  ========= 0.2.5 ========== (19/Nov/2017)
*  ++ Added lite.trailing ++
*  
*  - Makes the entity follow the cursor as the camera rotates.
*  !! The entity must be the child of a camera !!
*
*  Example:

      <a-camera>
        <a-plane lite.trailing position="0 0 -10"></a-plane>
      </a-camera>
*/

AFRAME.registerComponent('lite.trailing',{
  schema: {
    speed: {default: 1},
    boundx: {default: 0.3},
    boundy: {default: 0.3},
    scaleToZ: {default: true} // if true, multiply speed and bound by the z value of the position
  },
  init: function(){
    this.ready = false;

    // make sure that the entity is a child of a camera
    if(this.el.object3D.parent.el.localName != "a-camera"){
      console.warn("lite.trailing must be a child of a-camera!");
      return;
    }

    this.camera = this.el.object3D.parent;
    this.pos = this.el.getAttribute("position");
    this.delta = new THREE.Vector3();
    this.last = this.camera.rotation.toVector3();
    this.cur = this.camera.rotation.toVector3();

    this.speed = this.data.scaleToZ ? this.data.speed * Math.abs(this.pos.z) : this.data.speed;
    this.boundx = this.data.scaleToZ ? this.data.boundx * Math.abs(this.pos.z) : this.data.boundx;
    this.boundy = this.data.scaleToZ ? this.data.boundy * Math.abs(this.pos.z) : this.data.boundy;

    this.ready = true;
  },
  tick: function(){
    if(!this.ready) return;

    // Calculate delta rotation
    this.cur = this.camera.rotation.toVector3();
    this.delta.subVectors(this.cur, this.last);
    
    this.pos.x = this.pos.x + this.delta.y * this.speed;
    this.pos.x = this.pos.x > this.boundx ? this.boundx : this.pos.x < -this.boundx ? -this.boundx : this.pos.x;
    
    this.pos.y = this.pos.y + - this.delta.x * this.speed;
    this.pos.y = this.pos.y > this.boundy ? this.boundy : this.pos.y < -this.boundy ? -this.boundy : this.pos.y;

    this.el.setAttribute("position", this.pos);

    this.last.copy(this.cur);
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
    txt_value: {default: "Loading..."},
    visible: {default: true}
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
    this.container = container;
    container.setAttribute("visible", this.data.visible);
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
  },
  remove: function(){
    // TODO:
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
    
    var valuechange_event = new CustomEvent("scaleValueChange", { detail: getValue });
    //this.valuechange_event = valuechange_event;
    
    this.el.object3D.getScaleValue = getValue;
    
    function getValue(){
      return self.data.value;
    }
    
    // this.el.addEventListener("scaleValueChange",function(e){
    //   console.log("value changed: " + e.detail());
    // });
    
    this.el.object3D.ScaleValueChangeCallbacks = [];
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
    
    this.value = this.data.value;
    
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
      //console.log(valuechange_event);
      self.el.dispatchEvent(valuechange_event);
      // if(self.el.object3D.ScaleValueChangeCallbacks.length > 0){
      //   for(let i = 0; i < self.el.object3D.ScaleValueChangeCallbacks.length; i++){
      //     self.el.object3D.ScaleValueChangeCallbacks[i](v);
      //   }
      // }
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
  
  tick: function(t, dt){
    
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
  }
});

/*
*  ========= 0.2.4r ========== (18/Nov/2017)
*  Added lite.show-ontop
*  - A better alternative to lite.floatobject
*  - Add this property to any primitive or entity you want to appear on top of everything else. Example, a UI.
*  - The primitive or entity must be below other objects in the html file 
*  - If used on an entity with geometry, the lite.show-ontop property must be after the geomety property
*  Example:

      <a-entity cursor="fuse: true; fuseTimeout: 500"
                      position="0 0 -1"
                      geometry="primitive: ring; radiusInner: 0.02; radiusOuter: 0.04"
                      material="color: #B02020"
                      lite.show-ontop></entity>
*/
AFRAME.registerComponent('lite.show-ontop',{
  'init': function () {
    var ch = this.el.object3D.children;
    var mesh;
    for(var i = 0; i < ch.length; i++){
      
      if(ch[i].type == "Mesh"){
        mesh = ch[i];
        break;
      }
    }
    if(!mesh) return;

    var mat = mesh.material;
    if(mat){
      mat.depthTest = false;
    }
  }
});

//======================================================================
// Deprecated!
// Use lite.show-ontop instead
AFRAME.registerComponent('lite.floatobject',{
  'init': function _init() {
    var mesh = this.el.object3D.children[0];
    
    if(mesh){
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
    
    console.log("Initialized LITEroom!");
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

/*
*  UPDATE NOTES:

========= 0.2.9 ========== (21/Jan/2018)
+++ lite.camera-orbit +++

- Allow camera to orbit a target object using click and drag

SCHEMA:

  speed: {default: 1.0},
  inverted: {default: false},
  maxV: {default: 80},
  target: {default: "orbitTarget"},

EXAMPLE:

  <a-camera position="0 0 3" lite.orbit-camera></a-camera>
  <a-box id="orbitTarget"></a-box>

========= 0.2.8 ========== (18/Jan/2018)
+++ lite.camera-zoom +++

- Allow camera to zoom using mouse scroll or touch gesture

SCHEMA:
  speed: {default: 1}
  
EXAMPLE:
  <a-camera lite.camera-zoom></a-camera>

========= 0.2.7 ========== (18/Jan/2018)
+++ lite.rotate +++

- Rotate object by click and drag anywhere on screen

SCHEMA:
  speed: {default: 4.0}

EXAMPLE:
  <a-entity geometry="primitive: box;" position="0 1 0" lite.rotate></a-entity>


  ========= 0.2.6 ========== (4/Jan/2018)
+++ lite.videoevent +++

- Attaches events to a video playback

SCHEMA:

  vid: {type: "string"}, // The id attribute of the html video element
  time: {default: 0.0}, // Time (in seconds) in the video to trigger the function
  func: {type: "string"} // The name of the function to be called. Must be declared in the global scope. No parameters allowed.
    

EXAMPLE:

  <a-assets>
    <video id="vid" src="...." autoplay></video>
  </a-assets>
  
  <a-entity lite.videoevent="vid:vid; time: 1.0; func: dummy;" lite.videoevent__2="vid:vid; time: 4.2; func: dummy2;"></a-entity>

  <script>
    function dummy(){
      console.log("dummy function");
    }
    
    function dummy2(){
      console.log("dummy2 function");
    }
  </script>

*  ========= 0.2.5 ========== (19/Nov/2017)
*  ++ Added lite.trailing ++
*  
*  - Makes the entity follow the cursor as the camera rotates.
*  !! The entity must be the child of a camera !!
*
*  Example:

      <a-camera>
        <a-plane lite.trailing position="0 0 -10"></a-plane>
      </a-camera>

*  ========= 0.2.4r ========== (18/Nov/2017)
*  ++ Added lite.show-ontop ++
*  - A better alternative to lite.floatobject
*  - Add this property to any primitive or entity you want to appear on top of everything else. Example, a UI.
*  - The primitive or entity must be below other objects in the html file 
*  - If used on an entity with geometry, the lite.show-ontop property must be after the geomety property
*  Example:

      <a-entity cursor="fuse: true; fuseTimeout: 500"
                      position="0 0 -1"
                      geometry="primitive: ring; radiusInner: 0.02; radiusOuter: 0.04"
                      material="color: #B02020"
                      lite.show-ontop></entity>

*  
*  ========= 0.2.4 ==========
*  ++ Added lite.smart-visibility ++
*  
*  - Define angle where the object should be visible (currently only checks x rotation of the camera)
*
*  ++ Added a callback event name 'scaleValueChange' to lite.input_scalebar ++
*
*  => It allows outside script to get the value of the scale bar.
*
*  USAGE: 

        entity.addEventListener("scaleValueChange", test);

        function test(e){
          console.log("value change: " + e.detail());
        }

*  ========= 0.2.3r ==========
*  Modified lite.reponsive_cursor to accept DOM reference for src. Example, #button1.


========= 0.2.3 ========== 
+++ lite.videoplayer +++

- Creates a progress bar for the video playback

SCHEMA:

    vid: {type: "string"}, // id attribute of the video html element
    width: {default: 8},
    height: {default: 0.4},
    sk_width: {default: 0.1}, // width of the seeker (the button that move along the bar to tell the current playing time)
    sk_height: {default: 0.5}, // height of the seeker (the button that move along the bar to tell the current playing time)
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
    txt_value: {default: "Loading..."},
    visible: {default: true}

EXAMPLE:

    <a-assets>
        <video id="vid" src="video.mp4" autoplay></video>
    </a-assets>

    <a-entity position="0 -2 -9" lite.videoplayer="vid: vid"></a-entity>


========= 0.2.2 ==========
+++ lite.input-scalebar +++

- Creates an input scalebar

SCHEMA:
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
    control: {default: "click"}

EXAMPLE:

    <a-entity id="scalebar" lite.input-scalebar="min: 10; max: 20; value: 18; control: hold; btn_width: 0.5; btn_height: 0.5;"></a-entity>

========= 0.2.1 ==========
+++ lite.floatobject +++

- Disable depth testing for this entity and entities below it.


========= 0.2 ==========
+++ lite.responsive_cursor +++

- Changes the color of the cursor when it hover on an object.

SCHEMA:
    color: {
        default: '#f0a000'
    },
    'cursorShrinkRate': {
        default: 0.35
    }


EXAMPLE:

    Use the default color (light blue)
    <a-entity lite.responsive_cursor geometry="primitive: plane; height: 1; width: 4" position="4.8 -1 -10"> </a-entity>

    Use custom color
    <a-entity lite.responsive_cursor="#80ff30" geometry="primitive: plane; height: 1; width: 4" position="4.8 -1 -10"> </a-entity>

*/
