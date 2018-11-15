<?php
    $public = true;
    $title_text = "No Title";
    $manual_aframe_version = '<script src="/js/A-Frame/aframe_0.8.2.min.js"></script>';
    $manual_literoom_version = '<script src="/js/LITEroomJS/LITEroom_0.3.4r1.js"></script>';
	$additional_header_html = "
        <link rel='stylesheet' href='./styles.css'>
	";
	// This header will add A-Frame, LITEroom JS, and JQuery libraries
	// It also setup LTI access control
	require_once($_SERVER['DOCUMENT_ROOT']."/header.php");
    
?>
<script>
    AFRAME.registerComponent("lite.camera-spin",{
			
        schema: {
            speed: {default: 1}
        },
        tick: function(t, dt){
            var r = this.el.getAttribute("rotation");
            r.y += this.data.speed * dt / 1000;
            this.el.setAttribute("rotation", r);
            console.log(r);
            
        }
        
    });
</script>
<!-- ////////////////////////////////////   -->
<!-- ////////////////////////////////////   -->
<!-- ////////////////////////////////////   -->
    <div id="sceneDiv">
    <a-scene>
        <a-assets timeout="10000">
            
        </a-assets>
        <a-entity rotation="0 90 0" lite.camera-spin>
            <a-entity a-camera>
                <a-entity position="0 0 -8">
                    <a-cursor color="#FF5050" geometry="primitive: ring; radiusInner: 0.2; radiusOuter: 0.25;" fuse="true" fuse-timeout="1000"></a-cursor>
                </a-entity>
            </a-camera>
        </a-entity>
        
        
        <a-entity id="container">
  <!--      Put all 3d objects in here. -->
            <a-plane position="0 0 -10" color="#00f" lite.responsive_cursor></a-plane>
            <a-box position="0 0 -7"></a-box>
            <a-box position="2 0 -7"></a-box>
            <a-box position="7 0 0"></a-box>
            <a-box position="-7 0 0"></a-box>
            <a-box position="0 0 7"></a-box>
            <a-box position="-7 0 7"></a-box>
            <a-box position="7 0 -7"></a-box>
        </a-entity>
        <a-sky color="#000"></a-sky>
    </a-scene>
    </div>
    
<!-- ////////////////////////////////////   -->
<!-- ////////////////////////////////////   -->
<!-- ////////////////////////////////////   -->
    <div id="startDiv">
        <div class="welcome-section">
            <div id="welcome">
                <div>
                    <div>Welcome to ..........</div>
                    <div>Immersive Experience</div>
                    <br/>
                    <div>
                        <input class="startbtn" type="button" id="refreshment" value="Start" onclick="StartExperience()"/>
                    </div>
                </div>
              
            </div>
          
        </div>
        <div id="loadDiv" class="welcome-section">
            <div style="display: block;">
                <div>Loading...</div><br/>
                <div class="spinner"></div>
              
            </div>
          
        </div>
        <div class="credit">
            <b>Immersive Technologies</b> (LITEroom), Educational Delivery Services, PVCE, UNSW <br/> 
              
            <b> Dr. ............</b> (Academic Lead), ..........<br/>
            <b> Dr. ............</b>, ......... Educational Developer<br/>
             
            <b>Mr. Seyha Sok</b>, Lead Application Developer, Immersive Technologies <br/>
            For more information, contact <b>Luis (Carlos) Dominguez</b> (l.dominguez@unsw.edu.au), Immersive Technologies Lead
        </div>
    </div>
    <script>
      
        var scene = document.querySelector('a-scene');
        
        var camera = document.querySelector("a-camera") || document.querySelector("a-entity[camera]");
        
        var container = document.getElementById("container");
      
        scene.addEventListener('loaded', init);
        scene.addEventListener("enter-vr", EnterVr);
        scene.addEventListener("exit-vr", ExitVr);
      
        function StartExperience(){
            document.getElementById("startDiv").style.display = "none";
            document.getElementById("sceneDiv").style.display = "block";
        
        }
        
        
      
        // This is called when the browser is minimized or focused. Used to pause videos when window is minimized.
        document.addEventListener("visibilitychange", function() {
          
        }, false);
      
        function EnterVr(){
            //stereomode = scene.effect.isPresenting;
            //
            //if(stereomode){
            //    let p = camera.getAttribute("position");
            //    if(p.y === undefined){
            //        p.x = 0;
            //        p.y = 0;
            //        p.z = 0;
            //    }
            //    let y = p.y - 0.8;
            //    camera.setAttribute("position", p.x + " " + y + " " + p.z);
            //}
        }
      
        function ExitVr(){
            stereomode = false;
        }
      
        // Called when scene is loaded
        function init(){
          
            document.querySelector("#loadDiv").style.display = "none"; // Hide the loading animation
            document.querySelector("#welcome").style.display = "flex"; // Show the scene
          
        }
      
      // Function to submit analytical data
        <?php if (!$public) { ?>
          
            function updateStats(tag) {
                $.ajax({
                    type: "post",
                    url: "/config/db/db_connect.php",
                    data: {
                        "action" : "update_db_stats",
                        "tag" : tag,
                        "zid" : "<?=$_POST['ext_user_username']?>",
                        "name_given" : "<?=$_POST['lis_person_name_given']?>",
                        "name_family" : "<?=$_POST['lis_person_name_family']?>",
                        "email" : "<?=$_POST['lis_person_contact_email_primary']?>",
                        "roles" : "<?=$_POST['roles']?>",
                        "url" : window.location.href,
                        "address" : "",
                        "gender" : "",
                        "phnumber" : "",
                    },
                    success: function(data) {
                        if (data.length) {
                            //data = $.parseJSON(data);
                            console.log(data);
                        }
                    },
                });
            }
        <?php } ?>
     
    </script>
<?php require_once($_SERVER['DOCUMENT_ROOT']."/footer.php"); ?>
