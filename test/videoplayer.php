<?php
    $public = true;
    $title_text = "No Title";
    $manual_aframe_version = '<script src="/js/A-Frame/aframe_0.8.2.min.js"></script>';
    $manual_literoom_version = '<script src="/js/LITEroomJS/LITEroom_0.3.4r2.js"></script>';
	$additional_header_html = "
        <link rel='stylesheet' href='./styles.css'>
	";
	// This header will add A-Frame, LITEroom JS, and JQuery libraries
	// It also setup LTI access control
	require_once($_SERVER['DOCUMENT_ROOT']."/header.php");
    
?>
<!-- ////////////////////////////////////   -->
<!-- ////////////////////////////////////   -->
<!-- ////////////////////////////////////   -->
    <div id="sceneDiv">
    <a-scene>
        <a-assets timeout="10000">
            <video id="vid" playsinline crossorigin="anonymous" src="<?=$s3_server_root?>/360+Video+-+Solar+Farm+Canberra+(Felipe)/Final+-+on+Ground/SolarFarm03.mp4"></video>
        </a-assets>
        
        <a-entity id="camera" position="0 1.6 11">
            <a-entity id="subcamera" position="0 -1.6 0">
                <a-camera fov="60">
                    <a-entity cursor="fuse: true; fuseTimeout: 800" position="0 0 -4"
                    raycaster="objects: .clickable"
                    geometry="primitive: ring; radiusInner: 0.02; radiusOuter: 0.03"
                    material="color: #FF5050; shader: flat" ></a-entity>
                </a-camera>
            </a-entity>
        </a-entity>
        
        <a-entity id="container">
  <!--      Put all 3d objects in here. -->
            <a-video src="#vid" position="0 1 -3" width="8" height="4"></a-video>
            <a-entity lite.videoplayer="vid: vid; playBtn_width: 1; playBtn_height: 1; playBtn_pos: -3.2 0 0; progressBar_visible: true; txt_visible: true;" position="0 0 -2.98">
                
            </a-entity>
            
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
            <br/>
            <!--<progress id="progress" value="0" max="100"></progress>-->
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
        var camera = document.getElementById("camera") || document.querySelector("a-camera") || document.querySelector("a-entity[camera]");
        
        scene.addEventListener('loaded', init);
        scene.addEventListener("enter-vr", EnterVr);
        scene.addEventListener("exit-vr", ExitVr);
        // Called when scene is loaded
        function init(){
            document.querySelector("#loadDiv").style.display = "none"; // Hide the loading animation
            document.querySelector("#welcome").style.display = "flex"; // Show the scene
        }
        
        function StartExperience(){
            document.getElementById("startDiv").style.display = "none";
            document.getElementById("sceneDiv").style.display = "block";
        }
        
        // This is called when the browser is minimized or focused. Used to pause videos when window is minimized.
        document.addEventListener("visibilitychange", function() {
            if(document.hidden){
                console.log("document hidden");
            }else{
                console.log("document focused");
            }
        }, false);
        
        function EnterVr(){
            
        }
      
        function ExitVr(){
            
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
