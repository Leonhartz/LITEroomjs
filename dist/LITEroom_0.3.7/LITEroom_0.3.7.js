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

var LITEroom_Version = "0.3.7";

console.log("LITEroom JS version " + LITEroom_Version);

function $(id){
    return document.getElementById(id);
}

function _$(id){
    return document.querySelector(id);
}

function $_(id){
    return document.querySelector(id);
}

function Disable(el){
    el.setAttribute("scale", "0 0 0");
    el.object3D.visible = false;
}
function Enable(el){
    el.setAttribute("scale", "1 1 1");
    el.object3D.visible = true;
}
/*
*  ========= 0.3.7 ========== (06/Sep/2018)
*/
AFRAME.registerComponent('lite_popup_anim',{
    schema: {
        durout: {default: 700}, // popup duration
        durin: {default: 700}, // popin duration
        popout: {default: "popout"}, // name of the event to trigger popup. ** Shouldn't need to change this
        popin: {default: "popin"}, // name of the event to trigger popin. ** Shouldn't need to change this
        
    },
    init: function(){
        var self = this;
        var popoutAnim = this.popoutAnim = document.createElement("a-entity");
        this.el.appendChild(popoutAnim);
        
        this.el.addEventListener(this.data.popout,function(evt){
            //console.log(evt.currentTarget);
            evt.stopPropagation();
            self.popinAnim.emit("popinEnd"+self.el.object3D.uuid);
            self.popoutAnim.emit("popoutBegin"+self.el.object3D.uuid);
        }, false);
        
        var popinAnim = this.popinAnim = document.createElement("a-entity");
        
        this.el.appendChild(popinAnim);
        this.el.addEventListener(this.data.popin,function(evt){
            //console.log(evt.currentTarget);
            evt.stopPropagation();
            self.popoutAnim.emit("popoutEnd"+self.el.object3D.uuid);
            self.popinAnim.emit("popinBegin"+self.el.object3D.uuid);
        },false);
    },
    update: function(){
        var self = this;
        var popoutAnim = this.popoutAnim;
        this.el.removeChild(popoutAnim);
        popoutAnim = this.popoutAnim = document.createElement("a-animation");
        //popoutAnim.addEventListener("popoutBegin",function(evt){evt.stopPropagation();});
        //popoutAnim.addEventListener("popoutEnd",function(evt){evt.stopPropagation();});
        popoutAnim.setAttribute("attribute", "scale");
        popoutAnim.setAttribute("from", "0.0 0.0 0.0");
        popoutAnim.setAttribute("to", "1 1 1");
        popoutAnim.setAttribute("dur", this.data.durout);
        popoutAnim.setAttribute("begin", "popoutBegin"+self.el.object3D.uuid);
        popoutAnim.setAttribute("end", "popoutEnd"+self.el.object3D.uuid);
        popoutAnim.setAttribute("easing", "ease-out-elastic");
        this.el.appendChild(popoutAnim);
        
        var popinAnim = this.popinAnim;
        this.el.removeChild(popinAnim);
        popinAnim = this.popinAnim = document.createElement("a-animation");
        //popinAnim.addEventListener("popinBegin",function(evt){evt.stopPropagation();});
        //popinAnim.addEventListener("popinEnd",function(evt){evt.stopPropagation();});
        popinAnim.setAttribute("attribute", "scale");
        popinAnim.setAttribute("from", "1 1 1");
        popinAnim.setAttribute("to", "0 0 0");
        popinAnim.setAttribute("dur", this.data.durin);
        popinAnim.setAttribute("begin", "popinBegin"+self.el.object3D.uuid);
        popinAnim.setAttribute("end", "popinEnd"+self.el.object3D.uuid);
        popinAnim.setAttribute("easing", "ease-out-elastic");
        this.el.appendChild(popinAnim);
    },
    remove: function(){
        this.el.removeChild(popoutAnim);
        this.popoutAnim = undefined;
    },
});

/*
*  ========= 0.3.6 ========== (23/Aug/2018)
*/
AFRAME.registerComponent('lite_animated_cursor',{ // Add this component to the camera entity
    schema: {
        size: {default: 1},
        thickness: {default: 1}, // thickness of the ring
        timerThickness: {default: 1}, // thickness of the timer ring in percentage of the thickness of the base ring
        shadowThickness: {default: 0.75}, // thickness of the black transparent ring outside the base ring in percentage of the thickness of the base ring
        position: {default: "0 0 -4.8"}, // position of the cursor
        color: {default: "#fff"}, // color of the base ring
        timerColor : {default: "#f31"}, // color of the timer ring
        fuseTimeout: {default: 800}, // how long it takes to click
        raycastClass: {default: "raycast"}, // the class of objects to be considered by the raycaster. The background of a UI should contain this class so that it blocks the cursor from clicking on things behind it
        clickableClass: {default: "clickable"}, // the class of objects that can be clicked. Only animate the cursor on these objects.
        visible: {default: true}, // show or hide
        growthMode: {default: "thin"}, // When hover, should the cursor get thicker or thinner. Thick = thick; anything else = thin
    },
    init: function(){
        var self = this;
        var el = this.container = document.createElement("a-entity");
        this.el.appendChild(el);
        
        // shadow ring. the black outer ring that is semi transparent. it improves the look.
        var shRing = this.shRing = document.createElement("a-entity");
        el.appendChild(shRing);
        
        // timer ring
        var tRing = this.tRing = document.createElement("a-entity");
        el.appendChild(tRing);
        
        // These are placeholder entities to setup the events. They will be replaced with a-animation in the update() which will be called after init()
        var animTimer = this.animTimer = document.createElement("a-entity");
        tRing.appendChild(animTimer);
        
        var animGrow = this.animGrow = document.createElement("a-entity");
        el.appendChild(animGrow);
        
        var animFill = this.animFill = document.createElement("a-entity");
        el.appendChild(animFill);
        
        el.addEventListener("raycaster-intersection", function(evt){
            var target = evt.detail.els[0];
            if(target === undefined || target == null) return;
            el.setAttribute("cursor", {fuse: target.classList.contains(self.data.clickableClass)});
        });
        
        el.addEventListener("fusing",function(evt){
            var target = evt.detail.intersectedEl;
            
            if(target === undefined || target == null) return;
            if(target.classList.contains(self.data.clickableClass)){
                tRing.setAttribute("visible", true);
                self.animTimer.emit("animate");
                self.animGrow.emit("animate");
                self.animFill.emit("animate");
            }
        });
        el.addEventListener("mouseleave",function(){
            self.animTimer.emit("stopAnimate");
            self.animGrow.emit("stopAnimate");
            self.animFill.emit("stopAnimate");
            el.setAttribute("scale", "1 1 1");
            tRing.setAttribute("geometry","thetaLength", 0);
            el.setAttribute("geometry","radiusInner", self.inner);
            tRing.setAttribute("visible", false);
        });
        el.addEventListener("click",function(evt){
            var target = evt.detail.intersectedEl;
            if(target === undefined || target == null) return;
            if(target.classList.contains(self.data.clickableClass)){
                tRing.setAttribute("visible", false);
                el.setAttribute("scale", "1.2 1.2 1.2");
            }
        });
    },
    update: function(oldData){
        var data = this.data;
        var thicc = data.thickness * 0.025;
        var inner = this.inner = data.size * 0.07, outer = this.outer = inner + thicc;
        var el = this.container;
        el.setAttribute("cursor", {fuse: true, fuseTimeout: data.fuseTimeout});
        el.setAttribute("geometry", {primitive: "ring", radiusInner: inner, radiusOuter: outer});
        el.setAttribute("material",{color: data.color, shader: "flat"});
        el.setAttribute("raycaster",{objects: "."+this.data.raycastClass});
        el.setAttribute("position", data.position);
        el.setAttribute("rotation", "0 0 0");
        el.setAttribute("visible", data.visible);
        
        var shRing = this.shRing;
        shRing.setAttribute("geometry", {primitive: "ring", radiusInner: outer, radiusOuter: outer + thicc * data.shadowThickness});
        shRing.setAttribute("material",{color: "#000", shader: "flat", opacity: 0.2,});
        shRing.setAttribute("position","0 0 -0.005");
        
        var tRing = this.tRing;
        var tInner = outer * 1.1, tOuter = tInner + thicc * data.timerThickness;
        tRing.setAttribute("geometry", {primitive: "ring", radiusInner: tInner, radiusOuter: tOuter});
        tRing.setAttribute("material",{color: data.timerColor, shader: "flat"});
        tRing.setAttribute("geometry","thetaLength", 0);
        tRing.setAttribute("visible", false);
        //
        // a-animation's don't dynamically update upon setAttribute. Must replace them with new ones.
        // TODO: Optimize by replacing only the ones that are changed
        if(oldData.growthMode) return;
        
        var animTimer = this.animTimer;
        const growDur = 300, endpad = 100, delay = 200;
        tRing.removeChild(animTimer);
        animTimer = this.animTimer = document.createElement("a-animation");
        animTimer.setAttribute("attribute", "geometry.thetaLength");
        animTimer.setAttribute("dur", Math.max(200, (data.fuseTimeout- delay - endpad)));
        animTimer.setAttribute("from", 0);
        animTimer.setAttribute("to", 360);
        animTimer.setAttribute("delay", delay);
        animTimer.setAttribute("easing", "linear");
        animTimer.setAttribute("begin", "animate");
        
        animTimer.setAttribute("end", "stopAnimate");
        tRing.appendChild(animTimer);
        
        var animGrow = this.animGrow;
        el.removeChild(animGrow);
        animGrow = this.animGrow = document.createElement("a-animation");
        animGrow.setAttribute("attribute", "scale");
        animGrow.setAttribute("dur", growDur);
        animGrow.setAttribute("from", "1 1 1");
        animGrow.setAttribute("to", "1.1 1.1 1.1");
        animGrow.setAttribute("begin", "animate");
        animGrow.setAttribute("end", "stopAnimate");
        el.appendChild(animGrow);
        
        var animFill = this.animFill;
        el.removeChild(animFill); 
        animFill = this.animFill = document.createElement("a-animation");
        animFill.setAttribute("attribute", "geometry.radiusInner");
        animFill.setAttribute("dur", growDur);
        animFill.setAttribute("from", inner);
        animFill.setAttribute("to", data.growthMode == "thick" ? inner * 0.7 : inner + (outer - inner) * 0.7);
        animFill.setAttribute("begin", "animate");
        animFill.setAttribute("end", "stopAnimate");
        animFill.setAttribute("fill", "backwards");
        el.appendChild(animFill);
        
    },
    remove: function(){
        this.el.removeChild(this.container);
        // Remove all references to avoid memory leak
        this.container = undefined;
        this.shRing = undefined;
        this.tRing = undefined;
        this.animTimer = undefined;
        this.animGrow = undefined;
        this.animFill = undefined;
        this.inner = undefined;
        this.outer = undefined;
    }
});

/*
*  ========= 0.3.5 ========== (21/Aug/2018)
*  
*/

// TODO: Add 'selected' status where the button has different color
AFRAME.registerComponent('lite_button',{
    schema: {
        bgColor: {default: "#ffffff"}, // background color
        fgColor: {default: "#33333f"}, // foreground color
        hoverColor: {default: "#2255ff"},// background color when hovered
        inactiveFgColor: {default: "#cccccc"}, // foreground color when the button is deactivated
        inactiveBgColor: {default: "#555555"}, // background color when the button is deactivated
        active: {default: true}, // Active buttons have normal color, and can be clicked or hovered depending on the settings of clickable and hoverable
        visible: {default: true}, // show or hide the button
        width: {default: 0.6},
        height: {default: 0.3},
        margin: {default: 0.05}, // how much smaller the foreground is to the background (to make it looks like a frame).
        label: {default: "Button"}, // the text on the button
        labelSize: {default: "1"},  // Determines the size of the label
        labelColor: {default: "#ffffff"},
        labelType : {default: "text"}, // text or image
        raycastClass: {default: "raycast"}, // the class of objects to be considered by the raycaster. The background of a UI should contain this class so that it blocks the cursor from clicking on things behind it
        clickable: {default: true}, // Can the button be clicked?
        clickableClass: {default: "clickable"}, // The class of objects to trigger onclick event when clicked. Cursor will still click on things with raycastClass but the component won't call the click event if it doesn't have clickableClass
        hoverable: {default: true}, // Can the button be hovered?
        hoverableClass: {default: "hoverable"}, // The class of objects to trigger onmouseenter event when hovered.
        onclick:{default: ""}, //*** Event to trigger on click
        onmouseenter: {default: ""}, //*** Event to trigger when mouse over
        flatShader: {default: true},
    },
    init: function(){
        var self = this;
        var container = this.container = document.createElement("a-entity");
        this.el.appendChild(container);
        this.el.getSize = function(){
            return self.getSize();
        };
        this.clickFunc = new Function(this.data.onclick);
        this.hoverFunc = new Function(this.data.onmouseenter);
        
        var bg = this.bg = document.createElement("a-plane");
        bg.addEventListener("mouseenter", function (){
            // Set the color if the button is active. Doesn't care about hoverable
            if(self.data.active){
                bg.setAttribute("material","color", self.data.hoverColor);
            }
            //*** Trigger the hover event using self.el as context so that 'this' refers to the element with the component attached
            if(self.data.hoverable){
                self.hoverFunc.call(self.el);
            }
        });
        bg.addEventListener("mouseleave", function (){
            bg.setAttribute("material","color", self.data.bgColor);
        });
        //*** Trigger the onclick using self.el as context so that 'this' refers to the element with the component attached
        bg.addEventListener("click",function(){
            if(self.data.active && self.data.clickable){
                self.clickFunc.call(self.el);
            }
        });
        container.appendChild(bg);
        
        var fg = this.fg = document.createElement("a-plane");
        container.appendChild(fg);
        
        var label = this.label;
        if (self.data.labelType == "image") 
            label = this.label = document.createElement("a-plane"); 
        else
            label = this.label = document.createElement("a-text");
        container.appendChild(label);
    },
    // TODO: optimize by only update what is changed
    update: function(oldData){
        var data = this.data;
        
        var bg = this.bg;
        bg.setAttribute("material", {color: data.active ? data.bgColor : data.inactiveBgColor, transparent: true, flatShading: data.flatShader,});
        bg.setAttribute("geometry", {width: data.width, height: data.height});
        
        // Setup the classes so that the cursor behaves accordingly
        bg.setAttribute("class", data.raycastClass);
        if(data.active){
            if(data.clickable) bg.classList.add(data.clickableClass);
            if(data.hoverable) bg.classList.add(data.hoverableClass);
        }
        
        var fg = this.fg;
        fg.setAttribute("material", {color: data.active ? data.fgColor : data.inactiveFgColor, transparent: true, flatShading: data.flatShader,});
        fg.setAttribute("geometry", {width: data.width - data.margin, height: data.height - data.margin});
        fg.setAttribute("position", "0 0 0.005");
        
        var label = this.label;
        if (data.labelType == "image") {
            label.setAttribute("material", {src: data.label, transparent: true});
            label.setAttribute("geometry", {width: data.width - data.margin, height: data.height - data.margin});
        } else {
            var wrapCount = data.width / data. height * 5.0 / data.labelSize;
            label.setAttribute("text", {value: data.label, align: "center", color: data.labelColor, width: data.width - data.margin, wrapCount: wrapCount});
        }
        label.setAttribute("position", "0 0 0.01");
        if(data.visible){
            Enable(this.container);
        }else{
            Disable(this.container);
        }
        if(oldData.onclick != this.data.onclick) this.clickFunc = new Function(this.data.onclick);
        if(oldData.onmouseenter != this.data.onmouseenter) this.hoverFunc = new Function(this.data.onmouseenter);
    },
    remove: function(){
        this.el.removeChild(this.container);
        this.container = undefined;
        this.bg = undefined;
        this.fg = undefined;
        this.label = undefined;
    },
    getSize: function(){
        return {width: this.data.width, height: this.data.height};
    }
});

AFRAME.registerComponent('lite_round_button',{
    // Adapted from lite_button
    schema: {
        bgColor: {default: "#ffffff"}, // background color
        fgColor: {default: "#33333f"}, // foreground color
        bgOpacity: {default: 0.5},
        fgOpacity: {default: 1},
        hoverColor: {default: "#2255ff"},// background color when hovered
        inactiveFgColor: {default: "#888888"}, // foreground color when the button is deactivated
        inactiveBgColor: {default: "#555555"}, // background color when the button is deactivated
        active: {default: true}, // an inactive button doesn't response to click or hover events
        visible: {default: true}, // show or hide the button
        radius: {default: 0.3},
        margin: {default: 0.05}, // how much smaller the foreground is to the background (to make it look like a frame).
        label: {default: "A"}, // the text on the button
        labelSize: {default: 1},  // Determines the size of the label.
        labelType: {default: "text"}, // Can have a text or image
        labelColor:{default: "#ffffff"},
        raycastClass: {default: "raycast"}, // the class of objects to be considered by the raycaster. The background of a UI should contain this class so that it blocks the cursor from clicking on things behind it
        clickable: {default: true}, // Can the button be clicked? only applicable if active = true
        clickableClass: {default: "clickable"}, // The class of objects to trigger onclick event when clicked. Cursor will still click on things with raycastClass but the component won't call the click event if it doesn't have clickableClass
        hoverable: {default: true}, // Can the button be hovered? only applicable if active = true
        hoverableClass: {default: "hoverable"}, // The class of objects to trigger onmouseenter event when hovered.
        onclick: {default: ""},
        onmouseenter: {default: ""},
        flatShader: {default: true},
    },
    init: function(){
        var self = this;
        var container = this.container = document.createElement("a-entity");
        this.el.appendChild(container);
        
        //*** Construct functions from the string. There's no security risk because they are not user inputs.
        // This should be better than using a hidden entity. Events on a hidden entity can still be triggered directly from outside script.
        this.clickFunc = new Function(this.data.onclick);
        this.hoverFunc = new Function(this.data.onmouseenter);
        
        var bg = this.bg = document.createElement("a-circle");
        
        bg.addEventListener("mouseenter", function (){
            // Set the color if the button is active. Doesn't care about hoverable
            if(self.data.active){
                bg.setAttribute("material","color", self.data.hoverColor);
            }
            //*** Trigger the hover event using self.el as context so that 'this' refers to the element with the component attached
            if(self.data.hoverable){
                self.hoverFunc.call(self.el);
            }
        });
        bg.addEventListener("mouseleave", function (){
            bg.setAttribute("material","color", self.data.active ? self.data.bgColor : self.data.inactiveBgColor);
        });
        //*** Trigger the onclick using self.el as context so that 'this' refers to the element with the component attached
        bg.addEventListener("click",function(){
            if(self.data.active && self.data.clickable){
                self.clickFunc.call(self.el);
            }
        });
        container.appendChild(bg);
        
        var fg = this.fg = document.createElement("a-circle");
        container.appendChild(fg);

        var label = this.label;
        if (self.data.labelType == "image") 
            label = this.label = document.createElement("a-circle"); 
        else
            label = this.label = document.createElement("a-text");
        
        container.appendChild(label);
    },
    // TODO: optimize by only updating what is changed
    update: function(oldData){
        var data = this.data;
        
        var bg = this.bg;
        bg.setAttribute("material", {color: data.active ? data.bgColor : data.inactiveBgColor, opacity: data.bgOpacity, transparent: true, flatShading: data.flatShader});
        bg.setAttribute("geometry", {radius: data.radius});
        
        // Setup the classes so that the cursor behaves accordingly
        bg.setAttribute("class", data.raycastClass);
        if(data.active){
            if(data.clickable) bg.classList.add(data.clickableClass);
            if(data.hoverable) bg.classList.add(data.hoverableClass);
        }
        
        var fg = this.fg;
        fg.setAttribute("material",{color: data.active ? data.fgColor : data.inactiveFgColor, opacity: data.fgOpacity, transparent: true, flatShading: data.flatShader});
        
        fg.setAttribute("geometry", {radius: data.radius - data.margin});
        fg.setAttribute("position", "0 0 0.005");
        
        var label = this.label;
        if (data.labelType == "image") {
            label.setAttribute("material", {src: data.label, transparent: true});
            label.setAttribute("geometry", {radius: (data.radius - data.margin)*data.labelSize});
        } else {
            var wrapCount = 2 / data.labelSize;
            label.setAttribute("text", {value: data.label, align: "center", color: data.labelColor,  width: data.radius * 2 - data.margin, wrapCount: wrapCount});
        }
        label.setAttribute("position", "0 0 0.01");
        if(data.visible){
            Enable(this.container);
        }else{
            Disable(this.container);
        }
        
        if(oldData.onclick != this.data.onclick) this.clickFunc = new Function(this.data.onclick);
        if(oldData.onmouseenter != this.data.onmouseenter) this.hoverFunc = new Function(this.data.onmouseenter);
    },
    remove: function(){
        this.el.removeChild(this.container);
        this.container = undefined;
        this.bg = undefined;
        this.fg = undefined;
        this.label = undefined;
    },
    getSize: function(){
        return {radius: this.data.radius};
    }
});

/*
*  ========= 0.3.7 ========== (19/Sep/2018)
*  
*/
AFRAME.registerComponent('lite_icon_button',{
    schema: {
        bgColor: {default: "#ffffff"}, // background color
        fgColor: {default: "#33333f"}, // foreground color
        hoverColor: {default: "#2255ff"},// background color when hovered
        inactiveFgColor: {default: "#cccccc"}, // foreground color when the button is deactivated
        inactiveBgColor: {default: "#555555"}, // background color when the button is deactivated
        active: {default: true}, // Active buttons have normal color, and can be clicked or hovered depending on the settings of clickable and hoverable
        visible: {default: true}, // show or hide the button
        width: {default: 0.6},
        height: {default: 0.3},
        margin: {default: 0.025}, // how much smaller the foreground is to the background (to make it looks like a frame).
        label: {default: "Button"}, // the text on the button
        labelSize: {default: "1"},  // Determines the size of the label
        labelColor: {default: "#ffffff"},
        labelType : {default: "text"}, // text or image
        raycastClass: {default: "raycast"}, // the class of objects to be considered by the raycaster. The background of a UI should contain this class so that it blocks the cursor from clicking on things behind it
        clickable: {default: true}, // Can the button be clicked?
        clickableClass: {default: "clickable"}, // The class of objects to trigger onclick event when clicked. Cursor will still click on things with raycastClass but the component won't call the click event if it doesn't have clickableClass
        hoverable: {default: true}, // Can the button be hovered?
        hoverableClass: {default: "hoverable"}, // The class of objects to trigger onmouseenter event when hovered.
        onclick:{default: ""}, //*** Event to trigger on click
        onmouseenter: {default: ""}, //*** Event to trigger when mouse over
        flatShader: {default: true},
        iconShape: {default: "square"}, // square or circle
        iconType: {default: "image"}, // image or text
        icon: {default: ""}, // if iconType is image, put the src here. if text, just type the text
        iconTransparent: {default: true}, // mostly applied to image type
        iconColor: {default: "#ffffff"},
        iconBgColor: {default: "#ff5555"}, // icon background color
        inactiveIconBgColor: {default: "#555555"}, // icon background color when the button is deactivated
        iconMargin: {default: 0.025}, // the space between the icon and the button's foreground. bigger margin makes the icon smaller
    },
    init: function(){
        var self = this;
        var container = this.container = document.createElement("a-entity");
        this.el.appendChild(container);
        this.el.getSize = function(){
            return self.getSize();
        };
        this.clickFunc = new Function(this.data.onclick);
        this.hoverFunc = new Function(this.data.onmouseenter);
        
        var bg = this.bg = document.createElement("a-plane");
        bg.addEventListener("mouseenter", function (){
            // Set the color if the button is active. Doesn't care about hoverable
            if(self.data.active){
                bg.setAttribute("material","color", self.data.hoverColor);
            }
            // Trigger the hover event using self.el as context so that 'this' refers to the element with the component attached
            if(self.data.hoverable){
                self.hoverFunc.call(self.el);
            }
        });
        bg.addEventListener("mouseleave", function (){
            bg.setAttribute("material","color", self.data.bgColor);
        });
        // Trigger the onclick using self.el as context so that 'this' refers to the element with the component attached
        bg.addEventListener("click",function(){
            if(self.data.active && self.data.clickable){
                self.clickFunc.call(self.el);
            }
        });
        container.appendChild(bg);
        
        var fg = this.fg = document.createElement("a-plane");
        container.appendChild(fg);
        
        var label = this.label;
        if (self.data.labelType == "image") 
            label = this.label = document.createElement("a-plane"); 
        else
            label = this.label = document.createElement("a-text");
        container.appendChild(label);
        
        var icbg = this.icbg = this.data.iconShape == "square" ? document.createElement("a-plane") : document.createElement("a-circle");
        container.appendChild(icbg);
        
        var iclabel;
        if(self.data.iconType == "image"){
            iclabel = this.data.iconShape == "square" ? document.createElement("a-plane") : document.createElement("a-circle");
        }else{
            iclabel = document.createElement("a-text");
        }
        
        this.iclabel = iclabel;
        container.appendChild(iclabel);
    },
    // TODO: optimize by only update what is changed
    update: function(oldData){
        var data = this.data;
        
        var bg = this.bg;
        bg.setAttribute("material", {color: data.active ? data.bgColor : data.inactiveBgColor, transparent: true, flatShading: data.flatShader,});
        bg.setAttribute("geometry", {width: data.width, height: data.height});
        
        // Setup the classes so that the cursor behaves accordingly
        bg.setAttribute("class", data.raycastClass);
        if(data.active){
            if(data.clickable) bg.classList.add(data.clickableClass);
            if(data.hoverable) bg.classList.add(data.hoverableClass);
        }
        
        var fg = this.fg;
        var fgWidth = data.width - data.margin * 2;
        var fgHeight = data.height - data.margin * 2;
        fg.setAttribute("material", {color: data.active ? data.fgColor : data.inactiveFgColor, transparent: true, flatShading: data.flatShader,});
        fg.setAttribute("geometry", {width: fgWidth, height: fgHeight});
        fg.setAttribute("position", "0 0 0.005");
        
        var icbg = this.icbg;
        var iconHeight = fgHeight - data.iconMargin * 2;
        var iconXOffset = iconHeight / 2 - data.width / 2 + data.margin + data.iconMargin;
        icbg.setAttribute("material",{color: data.active ? data.iconBgColor : data.inactiveIconBgColor, flatShading: data.flatShader});
        icbg.setAttribute("geometry", this.data.iconShape == "square" ? {width: iconHeight, height: iconHeight} : {radius: iconHeight / 2});
        icbg.setAttribute("position", iconXOffset + " 0 0.01");
        
        var iclabel = this.iclabel;
        if(data.iconType == "image"){
            iclabel.setAttribute("geometry",  this.data.iconShape == "square" ? {width: iconHeight, height: iconHeight} : {radius: iconHeight / 2});
            iclabel.setAttribute("material",{src: data.icon, flatShading: data.flatShader, transparent: data.iconTransparent});
        }else{
            iclabel.setAttribute("text", {value: data.icon, width: iconHeight, wrapCount: 1, align: "center"});
        }
        iclabel.setAttribute("material", {color: data.iconColor});
        iclabel.setAttribute("position", iconXOffset + " 0 0.012");
        
        var label = this.label;
        var labelWidth = data.width - data.margin * 2 - iconHeight - data.iconMargin * 2;
        var labelHeight = data.height - data.margin * 2;
        if (data.labelType == "image") {
            label.setAttribute("material", {src: data.label, transparent: true});
            label.setAttribute("geometry", {width: labelWidth, height: labelHeight});
        } else {
            var wrapCount = labelWidth / labelHeight * 5.0 / data.labelSize;
            label.setAttribute("text", {value: data.label, align: "center", color: data.labelColor, width: labelWidth, wrapCount: wrapCount});
        }
        var lblXOffset = iconXOffset + iconHeight / 2 + data.iconMargin + labelWidth / 2;
        label.setAttribute("position", lblXOffset + " 0 0.01");
        if(data.visible){
            Enable(this.container);
        }else{
            Disable(this.container);
        }
        if(oldData.onclick != this.data.onclick) this.clickFunc = new Function(this.data.onclick);
        if(oldData.onmouseenter != this.data.onmouseenter) this.hoverFunc = new Function(this.data.onmouseenter);
        
    },
    remove: function(){
        this.el.removeChild(this.container);
        this.container = undefined;
        this.bg = undefined;
        this.fg = undefined;
        this.label = undefined;
        this.iclabel = undefined;
        this.icbg = undefined;
    },
    getSize: function(){
        return {width: this.data.width, height: this.data.height};
    }
    
});

/*
*  ========= 0.3.4 ========== (18/May/2018)
*  
*/
AFRAME.registerComponent('lite_fly_here',{
    schema: {
        ignore_y: {default: true}, // When this is true, the y value of the destination will be ignored, so the camera only move on the xz plane.
        offset_y: {default: 0}, // Usually to compensate for the user height.
        speed: {default: 1.0}, // Speed of the movement
        allow_interrupt: {default: false}, // If false, other components cannot trigger movement until this component reached its destination.
        disable_click:{default: false}, // If true, it won't be triggered by mouse click.
    },
    init: function(){
        var self = this;
        if(!this.data.disable_click)
          this.el.addEventListener("click", function(){self.system.fly(self);});
    },
    trigger: function(){
        this.system.fly(this);
    },
    onBeforeMoveStart : new CustomEvent("onBeforeMoveStart"), // Invoked before the camera is first moved
    onAfterMoveStart : new CustomEvent("onAfterMoveStart"), // Invoked after the camera is first moved
    onBeforeMoveEnd : new CustomEvent("onBeforeMoveEnd"), // Invoked right before the camera reaches the destination
    onAfterMoveEnd : new CustomEvent("onAfterMoveEnd"), // Invoked after the camera has reached the destination
    onBeforeMoving : new CustomEvent("onBeforeMoving"), // Invoked every frame before moving the camera
    onAfterMoving : new CustomEvent("onAfterMoving"), // Invoked every frame after moving the camera
});

AFRAME.registerSystem('lite_fly_here',{
    init: function(){
        console.log("lite_fly_here is available.");
    },
    fly: function(comp){
        // if the current job doesn't allow interrupt, we don't do anything.
        if(this.moving && !this.current_job.data.allow_interrupt) return;
        
        var self = this;
        this.camera = document.getElementById("camera") || document.querySelector("a-camera") || document.querySelector("a-entity[camera]");
        
        if(this.camera === undefined || this.camera === null){
            alert("lite_fly_here system: Cannot find the camera!")
            return;
        }
        
        var camPos = this.camera.getAttribute("position");
        self.dest = comp.el.getAttribute("position");
        self.to = new THREE.Vector3(self.dest.x, self.dest.y, self.dest.z);
        if(comp.data.ignore_y){
            self.to.y = camPos.y;
        }else if(comp.data.offset_y !== undefined){
            self.to.y = self.dest.y + comp.data.offset_y;
        }
        self.moving = true;
        self.current_job = comp;
        self.current_job.el.dispatchEvent(self.current_job.onBeforeMoveStart);
        Update();
        self.current_job.el.dispatchEvent(self.current_job.onAfterMoveStart);
        
        function Update(){
          
            if(self.moving === false){
              if(self.moveEnded) self.current_job = null;
              return;
            }
		
            // tell the browser to run this function again next update
            window.requestAnimationFrame(Update);
            
            let p = self.camera.getAttribute("position");
            let curpos = new THREE.Vector3(p.x, p.y, p.z); // current position
            let dist = curpos.distanceTo(self.to); // calculate remaining distance toward destination
            
            if(dist < 0.005){
                self.current_job.el.dispatchEvent(self.current_job.onBeforeMoveEnd);
                curpos = self.to;
                
            }else{
                curpos.lerp(self.to, 0.1 * self.current_job.data.speed); // calculate smooth movement toward the destination
            }
            self.current_job.el.dispatchEvent(self.current_job.onBeforeMoving);
            
            self.camera.setAttribute("position", curpos);
            self.current_job.el.dispatchEvent(self.current_job.onAfterMoving);
            if(curpos === self.to){
                self.moving = false;
                
                self.current_job.el.dispatchEvent(self.current_job.onAfterMoveEnd);
                
            }
        }
    },
    to: new THREE.Vector3(),
    dest: new THREE.Vector3(),
    moving: false,
    current_job: null,
});

/*
*  ========= 0.3.3 ========== (17/May/2018)
*  Hide cursor when the object is hovered, and show when cursor left
*/
AFRAME.registerComponent('lite.hide-cursor-on-hover',{
    init: function(){
        var cursor = _$("a-cursor") || _$("a-entity[cursor]");
        if(cursor === undefined || cursor === null){
            console.warn("lite.hide-cursor-on-hove: Could not find the cursor!");
            return;
        }
        var defaultVis = true;
        
        this.el.addEventListener("mouseenter", function(el){
            defaultVis = cursor.getAttribute("visible");
            if(defaultVis === undefined || defaultVis === null){
                defaultVis = true;
            }
            cursor.setAttribute("visible", false);
        });
        
        this.el.addEventListener("mouseleave", function(el){
            cursor.setAttribute("visible", defaultVis);
        });
    },
});

/*
*  ========= 0.3.1 ========== (05/Apr/2018)
*  
*/
AFRAME.registerComponent("lite.follow-camera-rotation", {
  schema:{
    x: {default: false},
    y: {default: true},
    z: {default: false},
    enabled: {default: true},
  },
  init: function(){
    this.camEl = document.querySelector("a-camera") || document.querySelector("a-entity[camera]");

    if(this.camEl === undefined){
      return;
    }
    this.ready = true;
  },
  tick: function(){
    if(!this.ready || !this.data.enabled) return;
    
    let rot = this.el.getAttribute("rotation");
    if(rot === undefined){
      this.el.setAttribute("rotation", "0 0 0");
    }
    if(rot.x === undefined) return;

    let x,y,z;
    let camrot = this.camEl.getAttribute("rotation");
    if(camrot.x === undefined) return;

    if(this.data.x){
      x = camrot.x;
    }else{
      x = rot.x;
    }

    if(this.data.y){
      y = camrot.y;
    }else{
      y = rot.y;
    }

    if(this.data.z){
      z = camrot.z;
    }else{
      z = rot.z;
    }
    this.el.setAttribute("rotation", x + " " + y + " " + z);
  }
});

/*
*  ========= 0.3.4r1 ========== (26/Jun/2018)
*  
*/
AFRAME.registerComponent("lite_layout", {
  schema: {
    col: {default: 1}, // number of columns
    padding_x: {default: 0.25},
    padding_y: {default: 0.25},
    
    align_h: {default: "middle"}, // how to align horizontally. Accepted values: middle, left, right
    align_v: {default: "center"}, // how to align vertically. Accepted values: center, top, bottom
  },
  trigger: function(){
    //console.log("________________________update");
    this.init();
    this.data.update = false;
  },
  init: function(){
    var ch = this.el.children;
    //console.log('children length: ' + ch.length);
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
        //console.log(self.data.padding_y + "  " + offsetY);
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
          let w = self.getWidth(el);
          let h = self.getHeight(el);
          size.width = scale.x * w;
          size.height = scale.y * h;
          break;
        case "a-sphere":
        case "a-circle":
          let r = self.getRadius(el);
          size.width = scale.x * r * 2;
          size.height = scale.y * r * 2;
          
          break;
        case "a-entity":
          
          let geo = el.getAttribute("geometry");
          
          if(el.getSize !== undefined){
            return el.getSize();
          }
          else if(geo){
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
    if(scale === undefined || scale === null){
      scale = {x:1, y:1, z:1};
    }
    return scale;
  },
  getWidth: function(el){
    let w = el.getAttribute("width");
    if(w === undefined){
      w = 1;
    }
    return w;
  },
  getHeight: function(el){
    let h = el.getAttribute("height");
    if(h === undefined){
      h = 1;
    }
    return h;
  },
  getRadius: function(el){
    let r = el.getAttribute("radius");
    if(r === undefined){
      r = 1;
    }
    return r;
  },
});

/*
*  ========= 0.3.0 ========== (20/Feb/2018)
*  
*/

AFRAME.registerComponent("lite.layout", {
  schema: {
    col: {default: 1}, // number of columns
    padding_x: {default: 0.25},
    padding_y: {default: 0.25},
    
    align_h: {default: "middle"}, // how to align horizontally. Accepted values: middle, left, right
    align_v: {default: "center"}, // how to align vertically. Accepted values: center, top, bottom

  },
  trigger: function(){
    this.init();
    this.data.update = false;
  },
  init: function(){
    var ch = this.el.children;
    //console.log('children length: ' + ch.length);
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
        //console.log(self.data.padding_y + "  " + offsetY);
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
          let w = self.getWidth(el);
          let h = self.getHeight(el);
          size.width = scale.x * w;
          size.height = scale.y * h;
          break;
        case "a-sphere":
        case "a-circle":
          let r = self.getRadius(el);
          size.width = scale.x * r * 2;
          size.height = scale.y * r * 2;
          
          break;
        case "a-entity":
          
          let geo = el.getAttribute("geometry");
          
          if(el.getSize !== undefined){
            return el.getSize();
          }
          else if(geo){
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
    if(scale === undefined || scale == null){
      scale = {x:1, y:1, z:1};
    }
    return scale;
  },
  getWidth: function(el){
    let w = el.getAttribute("width");
    if(w === undefined || w == null){
      w = 1;
    }
    return w;
  },
  getHeight: function(el){
    let h = el.getAttribute("height");
    if(h === undefined || h == null){
      h = 1;
    }
    return h;
  },
  getRadius: function(el){
    let r = el.getAttribute("radius");
    if(r === undefined || r == null){
      r = 1;
    }
    return r;
  },
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
      
      if(evt.touches !== undefined && evt.touches.length > 1) return;
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
      if(evt.touches !== undefined && evt.touches.length > 1) return;
      
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
    x_angle: {default: -60},
    enabled: {default: true},
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
    if(!this.data.enabled) return;
    //console.log(this.camera.object3D.rotation);
    if(this.camera.object3D.rotation.x < this.x_angle_rad){
      this.el.setAttribute("visible", true);
    }else{
      this.el.setAttribute("visible", false);
    }
  },
  
  update: function(){
    if(!this.data.enabled){
      this.el.setAttribute("visible", true);
    }
  },
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
    el.setAttribute("crossorigin", "anonymous");
    el.setAttribute("material", "src", data.tex);
    el.setAttribute("material", "transparent", true);
  } 
  if (data.color && data.color != "") el.setAttribute("color", data.color);
  if (data.src && data.src != "") el.setAttribute("src", data.src);
  if(data.value && data.value != "") el.setAttribute("value", data.value);
  if(data.class && data.class != "") el.setAttribute("class", data.class);
  if(data.align && data.align != "") el.setAttribute("align", data.align);
  
  return el;
}

//======================================================================
// 0.3.4r2 (14/Aug/2018)
// Added play button and seek functionality (can click on the progress bar to jump to different time)
//======================================================================
AFRAME.registerComponent('lite.videoplayer',{
  schema:{
    vid: {type: "string"},
    width: {default: 5},
    height: {default: 0.1},
    sk_width: {default: 0.1},
    sk_height: {default: 0.12},
    bg_color: {default: '#ccc'}, // background color
    fg_color: {default: '#f55'}, // foreground color
    bf_color: {default: '#fff'}, // buffer color
    bf_zoffset: {default: 0.01},
    fg_zoffset: {default: 0.02},
    sk_color: {default: '#faa'}, // seeker color (the button that move along the bar to tell the current playing time)
    sk_zoffset: {default: 0.03},
    progressBar_visible: {default: true}, // show or hide progress bar
    txt_width: {default: 5}, // width of the text. also determine the size of the letters.
    txt_pos: {default: "0 1 0"}, // position of the text
    txt_color: {default: "#f80"},
    txt_align: {default: "center"},
    txt_value: {default: "Loading..."},
    txt_visible: {default: true}, // show or hide loading text
    visible: {default: true}, // show or hide this component
    playBtn_visible: {default: true}, // show or hide play button
    playBtn_pos: {default: "-2.8 0 0.01"},
    btn_color: {default: "#fff"},
    btn_selColor: {default: "#ff0"},
    playBtn_width: {default: 0.5},
    playBtn_height: {default: 0.5},
    playBtn_src: {default: "/dev/shared/icons/icons8-circled-play-80.png"}, // texture file for play button
    pauseBtn_src: {default: "/dev/shared/icons/icons8-pause-button-80.png"}, // texture file for pause button
    responsive_cursor: {default: true},
  },
  init: function(){
    //console.log("video player is here!");
    var self = this;
    var vid;
    // try to find video element
    if(this.data.vid && this.data.vid != ""){
      
      vid = document.getElementById(this.data.vid);
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
      el_type: "a-entity",
    });
    this.el.appendChild(container);
    this.container = container;
    container.setAttribute("visible", this.data.visible);
    
    // progress bar container
    let progressBar_cont = CreateElement({
      el_type: "a-entity",
    });
    container.appendChild(progressBar_cont);
    // background plane
    let bg = CreateElement({
      el_type: "a-plane",
      height: this.data.height,
      width: this.data.width,
      color: this.data.bg_color,
      shader: "flat",
      class: "raycast clickable"
    });
    progressBar_cont.appendChild(bg);
    
    // buffer plane
    let bf = CreateElement({
      el_type: "a-plane",
      height: this.data.height,
      width: 0.1,
      color: this.data.bf_color,
      position: "0 0 " + this.data.bf_zoffset,
      shader: "flat"
    });
    progressBar_cont.appendChild(bf);
    
    // foreground plane
    let fg = CreateElement({
      el_type: "a-plane",
      
      height: this.data.height,
      width: 0.1,
      color: this.data.fg_color,
      position: "0 0 " + this.data.fg_zoffset,
      shader: "flat"
    });
    progressBar_cont.appendChild(fg);
    
    // seeker head
    let sk = CreateElement({
      el_type: "a-plane",
      
      height: this.data.sk_height,
      width: this.data.sk_width,
      color: this.data.sk_color,
      position: "0 0 " + this.data.sk_zoffset,
      shader: "flat"
    });
    progressBar_cont.appendChild(sk);
    
    if(!self.data.progressBar_visible) Disable(progressBar_cont);
    
    // loading message container
    let msg_cont = CreateElement({
      el_type: "a-entity",
    });
    container.appendChild(msg_cont);
    // loading message
    let msg = CreateElement({
      el_type: "a-text",
      
      height: this.data.height,
      width: this.data.txt_width,
      color: this.data.txt_color,
      position: this.data.txt_pos,
      shader: "flat",
      value: this.data.txt_value
    });
    msg.setAttribute("align", this.data.txt_align);
    msg.setAttribute("visible", false);
    msg_cont.appendChild(msg);
    if(!self.data.txt_visible){
      Disable(msg_cont);
    }
    
    // container for the play/pause buttons
    let playBtn_cont = CreateElement({
      el_type: "a-entity",
      position: self.data.playBtn_pos,
    });
    container.appendChild(playBtn_cont);
    
    // Play button
    let playBtn = CreateElement({
      el_type:"a-plane",
      width: self.data.playBtn_width,
      height: self.data.playBtn_height,
      color: self.data.btn_color,
      class: "raycast clickable",
      shader: "flat",
      tex: self.data.playBtn_src,
    });
    playBtn.addEventListener("click", function(){
      
      if(self.status == "playing"){
        vid.pause();
      }else if(self.status == "pausing"){
        vid.play();
      }
    });
    
    if(self.data.responsive_cursor){
        playBtn.setAttribute("lite.responsive_cursor",{bcolor: self.data.btn_color, bcolor_sel: self.data.btn_selColor});
    }
    
    playBtn_cont.appendChild(playBtn);
    
    // Pause button
    let pauseBtn = CreateElement({
      el_type:"a-plane",
      width: self.data.playBtn_width,
      height: self.data.playBtn_height,
      color: self.data.btn_color,
      class: "clickable",
      shader: "flat",
      tex: self.data.pauseBtn_src,
    });
    pauseBtn.addEventListener("click", function(){
      
      if(self.status == "playing"){
        vid.pause();
      }else if(self.status == "pausing"){
        vid.play();
      }
    });
    if(self.data.responsive_cursor){
        pauseBtn.setAttribute("lite.responsive_cursor",{bcolor: self.data.btn_color, bcolor_sel: self.data.btn_selColor});
    }
    pauseBtn.setAttribute("visible", false);
    playBtn_cont.appendChild(pauseBtn);
    
    if(!self.data.playBtn_visible) Disable(playBtn_cont);
    
    bg.addEventListener("click",function(el){
      var cursor = document.querySelector("a-cursor") || document.querySelector("a-entity[cursor]");
      var point = cursor.components.raycaster.raycaster.intersectObject(this.object3D, true)[0].point;
      var x_offset = this.object3D.worldToLocal(point).x;
      var unit_offset = (x_offset/self.data.width)+0.5;
      if(vid.readyState > 0) {
          vid.currentTime = unit_offset * vid.duration;
      }
    });
    
    // Handle pausing
    vid.addEventListener("pause", function(el){
      Enable(playBtn);
      Disable(pauseBtn);
      self.status = "pausing";
    });

    // Handle playing
    vid.addEventListener("play", function(el){
      Disable(playBtn);
      Enable(pauseBtn);
      self.status = "playing";
      
    });
    
    // Handle end
    vid.addEventListener("ended", function(el){
      Enable(playBtn);
      Disable(pauseBtn);
      self.status = "pausing";
    });
    
    // Handle buffer added
    vid.addEventListener("progress", function(el){
      OnBufferAdded(el.currentTarget);
    });
    OnBufferAdded(vid);
    function OnBufferAdded(video){
      //console.log(video);
      if(video.buffered.length > 0){
        RefreshBufferBar();
      }
    }
    
    function RefreshBufferBar(){
      let w = vid.buffered.end(0) / vid.duration * self.data.width;
      if(w == 0) w = 0.001;
      let x = w / 2 - self.data.width / 2;
      
      bf.setAttribute("width", w);
      bf.setAttribute("position", x + " 0 " + self.data.bf_zoffset);
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
      self.status = "playing";
      //playBtn_text.setAttribute("value", "Pause");
    }
    
    // Handle time updated
    vid.addEventListener("timeupdate", function(el){
      OnTimeUpdate(el.currentTarget);
    });
    
    function OnTimeUpdate(video){
      let w = video.currentTime / video.duration * self.data.width;
      if (w == 0) w = 0.001;
      let x = w / 2 - self.data.width / 2;
      let sk_x = w - self.data.width / 2;
      fg.setAttribute("width", w);
      fg.setAttribute("position", x + " 0 " + self.data.fg_zoffset);
      sk.setAttribute("position", sk_x + " 0 " + self.data.sk_zoffset);
      //RefreshBufferBar();
    }
  },
  status: "pausing",
  remove: function(){
    // TODO:
  }
});

//======================================================================
// 0.3.6 beta (27/Aug/2018)
// Added new attributes: btn_gap, and use_tex
// Added class "clickable fuse" to the buttons to make it compatible with animated_cursor
// TODO: Not fully compatible with animated_cursor yet. The buttons don't change color on hover

AFRAME.registerComponent('lite.input-scalebar',{
  schema:{
    thickness: {default: 0.3}, // the thickness of the bars
    length: {default: 5}, // the length of the bars
    bg_color: {default: '#fff'}, // background color
    fg_color: {default: '#f8e71c'}, // foreground color
    bg_src: {default: '/images/ophthal_buttons/bar_bg.png'}, // background texture
    fg_src: {default: '/images/ophthal_buttons/bar_process_white.png'}, // foreground texture
    plus_tex: {default: "/images/ophthal_buttons/plus.png"}, // source to the texture for the plus button
    minus_tex: {default: "/images/ophthal_buttons/minus.png"}, // source to the texture for the minus button
    plus_sel_tex: {default: "/images/ophthal_buttons/plus_sel.png"}, // source to the texture for the plus button when selected
    minus_sel_tex: {default: "/images/ophthal_buttons/minus_sel.png"}, // source to the texture for the minus button when selected
    use_tex: {default: true}, // enable or disable texture
    plus_color: {default: "#fff"}, // color of the selected plus button
    minus_color: {default: "#fff"}, // color of the selected minus button
    plus_sel_color: {default: "#fff"}, // color of the selected plus button
    minus_sel_color: {default: "#fff"}, // color of the selected minus button
    btn_width: {default: 0}, // 0 means to take the value of the height(not width) of the background
    btn_height: {default: 0}, // 0 means to take the value of the height of the background
    btn_gap: {default: 0.5}, // the gap between the buttons and the bar
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
    value_position: {default: "0 0 0.005"},
    value_decimal_place: {default: 0}, //
    responsive_cursor: {default: true}, // enable or disable responsive cursor feature
    control: {default: "click"}, // there are 2 types of control scheme. "click" -> only increase/decrease on click. "hold" -> click and hold to increase/decrease.
    layout: {default: "horizontal"}, // horizontal or vertical layout
  },
  init: function(){
    
    //console.log("scale bar is here!")
    
    let self = this;
    
    var valuechange_event = new CustomEvent("scaleValueChange", { detail: getValue });
    //this.valuechange_event = valuechange_event;
    
    this.el.object3D.getScaleValue = getValue;
    
    function getValue(){
      return self.data.value;
    }
    
    this.el.object3D.ScaleValueChangeCallbacks = [];
    this.clicked = "none";
    // Create scalebar container element and append it as a child to the this element
    let scalebar_con = document.createElement("a-entity");
    scalebar_con.setAttribute("id", "scalebar_con");
    this.el.appendChild(scalebar_con);
    
    if(this.data.anchor != "l" && this.data.anchor != "left" && this.data.anchor != "r" && this.data.anchor != "right"){
      this.data.anchor = "l"; 
    }
    
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
    
    let barcontainer = CreateElement({
      el_type: "a-entity",
      id: "barcontainer",
      position: "0 0 0",
    });
    scalebar_con.appendChild(barcontainer);
    // Create the background bar
    let bg = CreateElement({
      el_type: "a-plane",
      id: "bg",
      height: this.data.thickness,
      width: this.data.length,
      color: this.data.bg_color,
      tex: this.data.use_tex?this.data.bg_src:undefined,
      shader: "flat"
    });
    //scalebar_con.appendChild(bg);
    
    // Create the foreground bar
    let fg = CreateElement({
      el_type: "a-plane",
      id: "fg",
      height: this.data.thickness,
      width: this.data.length * (this.data.value > 1 ? 1 : (this.data.value < 0 ? 0 : this.data.value)),
      color: this.data.fg_color,
      tex: this.data.use_tex?this.data.fg_src:undefined,
      position: "0 0 0.003",
      shader: "flat"
    });
    
    barcontainer.appendChild(bg);
    barcontainer.appendChild(fg);
  
    if(self.data.layout == "vertical"){
      barcontainer.setAttribute("rotation", "0 0 90");
      //bg.setAttribute("rotation", "0 0 90");
    }
    
    fg.anchor = this.data.anchor;
    //scalebar_con.appendChild(fg);
    updateFg();
    
    // create text element to display value if needed
    let vText;
    if(self.data.display_value){
      vText = CreateElement({
        el_type: "a-text",
        id: "vText",
        height: this.data.value_height,
        width: this.data.value_width,
        position: this.data.value_position,
        color: this.data.value_color
      });
      updateValueText();
      vText.setAttribute("align", this.data.value_align);
      scalebar_con.appendChild(vText);
    }
    
    // update the foreground length and position to match the current value
    function updateFg(){
      var length = (self.data.value - self.data.min + 0.01) / (self.data.max - self.data.min) * self.data.length;
      fg.setAttribute("width", length);
      
      if(fg.anchor == "l"|| fg.anchor == "left"){
        let x = length/2 - self.data.length/2;
        fg.setAttribute("position", x + " 0 0.003");
      }
      else if(fg.anchor == "r"|| fg.anchor == "right"){
        let x = self.data.length/2 - length/2;
        fg.setAttribute("position", x + " 0 0.003");
      }
    }
    
    // function to handle the foreground length and position when setting new value. MUST call this to set the value.
    this.updateValue = updateValue;
    function updateValue(v){
      
      self.data.value = v;
      updateFg();
      updateValueText();
      
      self.el.dispatchEvent(valuechange_event);
      
    }
    
    // handle value text
    function updateValueText(){
      let v = self.data.value; 
      v = v.toFixed(self.data.value_decimal_place);
      vText.setAttribute("value", self.data.value_prefix + v + self.data.value_postfix);
    }
    
    // Create the plus button
    let pos_p, pos_s;
    if(self.data.layout == "vertical"){
      if(self.data.anchor == "r" || self.data.anchor == "right"){
        pos_p = "0 " + (-this.data.length / 2 - this.data.btn_gap) + " 0";
        pos_s = "0 " + (this.data.length / 2 + this.data.btn_gap) + " 0";
      }else{
        pos_p = "0 " + (this.data.length / 2 + this.data.btn_gap) + " 0";
        pos_s = "0 " + (- this.data.length / 2 - this.data.btn_gap) + " 0";
      }
      
    }else{
      if(self.data.anchor == "r" || self.data.anchor == "right"){
        pos_s = (this.data.length / 2 + this.data.btn_gap) + " 0 0";
        pos_p = (- this.data.length / 2 - this.data.btn_gap) + " 0 0";
      }else{
        pos_p = (this.data.length / 2 + this.data.btn_gap) + " 0 0";
        pos_s = (- this.data.length / 2 - this.data.btn_gap) + " 0 0";
      }
      
    }
    
    let plus = CreateElement({
      el_type: "a-plane",
      id: "plus",
      height: this.data.btn_height == 0 ? this.data.thickness : this.data.btn_height,
      width: this.data.btn_width == 0 ? this.data.thickness : this.data.btn_width,
      position: pos_p,
      shader: "flat",
      class: "raycast clickable",
      tex: this.data.plus_tex
    });
    plus.addEventListener('click', add);
    plus.addEventListener('mouseleave', leave);
    scalebar_con.appendChild(plus);
    
    // Create the minus button
    let minus = CreateElement({
      el_type: "a-plane",
      id: "minus", 
      height: this.data.btn_height == 0 ? this.data.thickness : this.data.btn_height,
      width: this.data.btn_width == 0 ? this.data.thickness : this.data.btn_width,
      position: pos_s,
      shader: "flat",
      class: "raycast clickable",
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
      cursorShrinkRate: {default: 0.35},
      cursorId: {default: 'cursor'},
    },
    'init': function() {
      //console.log(this.data);
      var cursor = document.getElementById(this.data.cursorId);
      
      if(cursor === null || cursor === undefined){
        cursor = document.querySelector("a-cursor") || document.querySelector("a-entity[cursor]");
      }
      if(cursor === null) return;
      this.cursor = cursor;
      var data = this.data;
      var defaultColor = cursor.getAttribute("color");
      
      this.clicked = false;
      this.hover = false;
      
      var _scale = cursor.getAttribute('scale');
      this.cursorScale = {x: _scale.x,y: _scale.y,z: _scale.z};
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
      this.bcolor_default = this.el.getAttribute("color") || this.el.getAttribute("material", "color");
      
      var self = this;
      self.mouseLeft = true;
      self.stopTick = true;
      
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
        self.mouseLeft = false;
      });
      
      this.el.addEventListener("mouseleave", function(el){
        //console.log("mouse leave");
        if(cursor){
          cursor.setAttribute("color", defaultColor);
        }
        
        if(self.bcolor_default){
          el.currentTarget.setAttribute("color", self.bcolor_default.color || self.bcolor_default);
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
        self.mouseLeft = true;
      });
      
      this.el.addEventListener("click", function(el){
        self.clicked = true;
        
      });

    },
    tick: function(t, dt){
        
        if(!this.mouseLeft) this.stopTick = false;
        if(this.stopTick) return;
        if(this.cursor === undefined || this.cursor == null) return;
        var self = this;
        var cursor = this.cursor;
        
        if(self.hover && !self.clicked){
            
            self.curCursorScale = {x: Math.max(self.curCursorScale.x - (self.cursorShrink.x * dt / 1000), 0.1),
                        y: Math.max(self.curCursorScale.y - (self.cursorShrink.y * dt / 1000),0.1),
                        z: Math.max(self.curCursorScale.z - (self.cursorShrink.z * dt / 1000),0.1)};
            cursor.setAttribute("scale", self.curCursorScale);
          
        }else if(!self.hover || self.clicked){
            
            cursor.setAttribute("scale", self.cursorScale);
            self.curCursorScale = {x: self.cursorScale.x, y: self.cursorScale.y, z: self.cursorScale.z};
        }
        
        if(self.mouseLeft) self.stopTick = true;
    },
});

// version 0.3.2
function getMobileOperatingSystem() {
    var userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
        // Windows Phone must come first because its UA also contains "Android"
      if (/windows phone/i.test(userAgent)) {
          return "Windows Phone";
      }
    
      if (/android/i.test(userAgent)) {
          return "Android";
      }
    
      // iOS detection from: http://stackoverflow.com/a/9039885/177710
      if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
          return "iOS";
      }
    
      return "unknown";
}
// version 0.3.4r1
function IsMobile(){
  return getMobileOperatingSystem() != "unknown";
}

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
*

========= 0.3.4r2 ========== (14/Aug/2018)
 Added play button and seek functionality on lite.videoplayer (can click on the progress bar to jump to different time)

========= 0.3.4r1 ========== (14/Jun/2018)
- Fix an issue where lite.responsive_cursor does not reset the cursor scale properly when used with AFrame 0.8.2

========= 0.3.4 ========== (18/May/2018)
- Added lite_fly_here
- lite.responsive_cursor now look for entity with id "cursor" by default before looking for <a-cursor> or <a-entity cursor>

========= 0.3.3 =========== (17/May/2018)

- Added lite.hide-cursor-on-hover

========= 0.3.2 =========== (20/Apr/2018)

- Added getMobileOperatingSystem()

========= 0.3.1r ========== (14/Apr/2018)

- Change lite.responsive_cursor to using tick instead of settimeout to shrink cursor

========= 0.3.1 ========== (05/Apr/2018)

- Added lite.follow-camera-rotation

========= 0.3.0r3 ========== (20/Feb/2018)

- Added vertical layout for lite.input_scalebar
- Added enabled property for lite.smart-visibility to allow turn the component on or off

========= 0.3.0r1 ========== (05/Feb/2018)

- lite.camera-orbit and lite.rotate will ignore input when there's more than 1 touches.
This is so that user can zoom without rotating the object.


========= 0.3.0 ========== (29/Jan/2018)


- Position children entity in a grid layout. Useful for simple UI.

SCHEMA:

  col: {default: 0}, // 0 means no limit
  padding_x: {default: 0.25},
  padding_y: {default: 0.25},

  align_h: {default: ""middle""}, // how to align horizontally. Accepted values: middle, left, right
  align_v: {default: ""center""}, // how to align vertically. Accepted values: center, top, bottom"

EXAMPLE:

  <a-camera position=""0 0 3"" lite.orbit-camera=""target: orbitTarget""></a-camera>
  <a-box id=""orbitTarget""></a-box>"

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

