var OBJLoader = require('three-obj-loader');
var MTLLoader = require('three-mtl-loader');

    // THREE.JS VIEWER
            var raycaster = new THREE.Raycaster();
            var tapPoint = new THREE.Vector2();

			const WIDTH = viewer.offsetWidth;
            const HEIGHT = viewer.offsetHeight;
            var camPosScaler = 0.02;
            var YOffset = -2;
            
            var camera = new THREE.OrthographicCamera( WIDTH * camPosScaler / - 2, WIDTH * camPosScaler / 2, HEIGHT * camPosScaler / 2 + YOffset, HEIGHT * camPosScaler/ - 2 + YOffset, -1000, 1000 );
			camera.position.set(0.25045350708296965, 1.7041388793736647, 0.18216399368949676);
            camera.lookAt(0, 1.5, 0);

			// var camera = new THREE.PerspectiveCamera( 60, WIDTH / HEIGHT, 0.01, 100 );
			// camera.position.set( 5, 3, 5 );
            // camera.lookAt( 0, 1.5, 0 );
            
            // var controls = new THREE.OrbitControls( camera );

			var scene = new THREE.Scene();
			scene.background = new THREE.Color( 0x222222 );
            scene.add( new THREE.GridHelper( 10, 10 ) );
            
			var ambient = new THREE.HemisphereLight( 0xcccccc, 0xffffff, 0.85 );
            ambient.position.set( -0.5, 0.75, -1 );
            scene.add( ambient );
            
			// var light = new THREE.DirectionalLight( 0xffffff, 0.75 );
			// light.position.set( 1, 0.75, 0.5 );
            // scene.add( light );

			var renderer = new THREE.WebGLRenderer();
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.setSize( WIDTH, HEIGHT );
            viewer.appendChild( renderer.domElement );
            
			function animate(now) {
                var time = now / 5000;

                //// Turn Table Effect   
                // camera.position.x = Math.sin( time ) * 5;
				// camera.position.z = Math.cos( time ) * 5;
				// camera.lookAt( 0, 1.5, 0 );
				renderer.render( scene, camera );
				requestAnimationFrame( animate );
            }

            requestAnimationFrame( animate );
            
            indoorGlobal = new THREE.Group();

            // POLY REST API
			const API_KEY = '*** INSERT YOUR API KEY HERE ***';
			function loadAsset( id , objIdx) {
                return new Promise((res, rej) => {
                    var objUrl = `${id}.obj`;
                    var mtlUrl = `${id}.mtl`;
                    var request = new XMLHttpRequest();
                    request.open( 'GET', mtlUrl, true );
                    request.addEventListener( 'load', function ( event ) {
                        var loader = new THREE.MTLLoader();
                            loader.setCrossOrigin( true );
                            loader.setTexturePath( objUrl );
                            loader.load( mtlUrl, function ( materials ) {
                                var loader = new THREE.OBJLoader();
                                loader.setMaterials( materials );
                                loader.load( objUrl, function ( object ) {
                                    object.rotation.x = -Math.PI/2;

                                    var box = new THREE.Box3();
                                    box.setFromObject( object );

                                    // re-center
                                    var center = box.getCenter();
                                    // 박스의 중심에서 가낭 높은 지점을 기준으로 재설정
                                    center.y = box.max.y;
                                    
                                    object.position.sub( center );
                                    
                                    // scale
                                    var scaler = new THREE.Group();
                                    scaler.add( object );
                                    var scaleFactor = 6 / box.getSize().length();
                                    scaler.scale.setScalar( scaleFactor );
                                    
                                    var offsetFactor = objIdx * 1 * 50000;
                                    var offset = offsetFactor * scaleFactor;
                                    var position = scaler.position.y;
                                    scaler.position.y = position + offset;

                                    indoorGlobal.add( scaler );
                                    // scene.add( scaler );                            
                                    res({ 
                                        url: objUrl,
                                        obj: scaler,
                                        // obj: scaler,
                                        offset: offset,
                                        pos: position,
                                        initScale: scaleFactor
                                    });
                                } );
                            } );
                    } );
                    request.send( null );
                });
            }
            
            objInfo = [];

            Promise.all([
                loadAsset('../src/obj/b2', 0),
                loadAsset('../src/obj/b1', 1),
                loadAsset('../src/obj/1', 2),
                loadAsset('../src/obj/2',3),
                loadAsset('../src/obj/3', 4),
                loadAsset('../src/obj/4', 5)
            ]).then(results => {
                results.forEach((result, idx) => {
                    console.log(result, idx)
                    objInfo[idx] = result;
                    // objInfo[result.objIdx].pos = result.pos;
                    // objInfo[result.objIdx].obj = result.obj;
                    // objInfo[result.objIdx].initScale = result.initScale;
                });

                scene.add( indoorGlobal ); 

                initInteraction();
                console.log(results);
            });

            function initInteraction() {
                var Axes = eg.Axes;
                var PanInput = Axes.PanInput;

                var objPosList = objInfo.map(objItem => objItem.pos + objItem.offset);
                var posMax = Math.max.apply( Math, objPosList);
                var posMin = Math.min.apply(Math, objPosList);
                // create eg.Axes with option
                axes = new Axes({
                    y: { range: [posMin, posMax] }
                }, {
                    deceleration : 0.00005
                }, {
                    y: posMin
                });

                axes.on({
                    "change": evt => {
                        console.log("change", evt.pos.y);
                        update(evt.pos.y);
                    },
                    "release": evt => {
                        var dists = objInfo.map(objItem => {
                            return Math.abs(objItem.pos + objItem.offset - evt.destPos.y);
                        });
                        var targetFloorIdx = dists.indexOf(Math.min.apply(null, dists));
                        console.log("release", dists);
                        // if(evt.isTrusted) {
                        setTimeout(() => {
                            evt.stop();
                            goToNthFloor(targetFloorIdx, evt.duration);
                        }, 0);
                        // }
                    }
                });
                const panInput = new PanInput(document.body, {
                    scale: [0.01, 0.01]
                });
                axes.connect([null, "y"], panInput); 

                indoorGlobal.position.y = posMin;

                // console.log(axes.get("y"));
                update(axes.get().y);
            }

            function goToNthFloor(floorIdx, duration) {
                console.log("goToNthFloor", floorIdx);
                axes.setTo({"y": objInfo[floorIdx].pos + objInfo[floorIdx].offset }, duration || 300);
            } 

            function update(posY) {
                indoorGlobal.position.y = - posY;
                objInfo.forEach((objItem, objIdx) => {
                    // var offsetFactor = objIdx * 1 * 50000;
                    // offset                    
                    var direction = objItem.pos + objItem.offset - posY;
                    var dist = Math.abs(direction);
                    //  거리가 0 일때 최고,  거리가 2 이상 일때 기존 스케일 적용 
                    var scale = objItem.obj.scale.x;

                    var maxScale = 0.45;
                    var stretchScale = 1.2;
                    var scaleApplyThreshold = 2;
                    var stretchApplyThreshold = 2;
                    
                    // var maxOffset = ;
                    if (dist > stretchApplyThreshold) {
                        direction = direction > 0 ? stretchApplyThreshold : -stretchApplyThreshold;
                    }

                    if (dist > scaleApplyThreshold) {
                        dist = scaleApplyThreshold;
                    }

                    dist = 1 - dist / scaleApplyThreshold;
                    direction = direction * stretchScale;

                    scale = objItem.initScale + objItem.initScale * maxScale * dist;
                    // var x = objItem.obj.position.x; 
                    // var y = objItem.obj.position.y; 
                    // var z = objItem.obj.position.z; 

                    // // scaler.position.y = scaler.position.y + offsetFactor * scaleFactor
                    //console.log(direction, objItem.offset)
                    objItem.obj.position.set(
                        objItem.obj.position.x,
                        objItem.pos + objItem.offset + direction,//  * maxScale * dist,// + offsetFactor, 
                        objItem.obj.position.z); 
                
                    objItem.obj.scale.set(scale, scale, scale); 
                });

                function onClick( event ) {
                    // console.log("onClick", event.clientX, event.clientY );
                    tapPoint.x = ( event.clientX / window.innerWidth ) * 2 - 1;
                    tapPoint.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

                    // update the picking ray with the camera and mouse position
                    raycaster.setFromCamera( tapPoint, camera );

                    // calculate objects intersecting the picking ray
                    var intersects = raycaster.intersectObjects( objInfo.map(objItem => objItem.obj) );
                    // var intersectsMap = {};
                    


                    console.log(Object.keys(intersects).length);                  
                    // for ( var i = 0; i < intersects.length; i++ ) {
                    //     intersects[ i ].object.material.color.set( 0xff0000 );
                    // } 
                }
                document.getElementById("viewer").addEventListener( 'click', onClick, false );

            }