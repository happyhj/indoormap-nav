import Component from "@egjs/component";
import {PanInput} from "@egjs/axes";
import Axes from "@egjs/axes";

import Object3DLoader from  "./Object3DLoader";

export default class PolyFlow extends Component {
	constructor(container, options = {}) {
		super();

		this.container = container;

		this.scaleStrength = options.scaleStrength;
		this.stretchStrength = options.stretchStrength;
		this.rotationStrength = options.rotationStrength;
		this.scaleApplyThreshold = options.scaleApplyThreshold;
		this.stretchApplyThreshold = options.stretchApplyThreshold;
		this.rotationApplyThreshold = options.rotationApplyThreshold;
		
		this.resources = options.resources;
		this.objectMargin = options.objectMargin;
		this.scaleOption = options.scaleOption;
		this.preProcessToModel = options.preProcessToModel; 

		this.object3dList = [];
		this.object3DGroup = new THREE.Group();

		this.initRenderer();
		this.startRender();

		this.loadObjects()
		.then(() => {
			// init Interaction  
			this.initInteraction();	
		});
	}
	initInteraction() {
		var posList = this.object3dList.map(object3d => object3d.obj.position.y);
		var posMax = Math.max.apply(Math, posList);
		var posMin = Math.min.apply(Math, posList);
		console.log("posMin,posMax", posMin,posMax)
		// create eg.Axes with option
		const axes = this.axes = new Axes({
			y: {
				range: [posMin, posMax],
				bounce: [1, 1]
			}
		}, {
			deceleration : 0.00005
		}, {
			y: posMin
		});

		axes.on({
			"change": evt => {
				// console.log("change", evt.pos.y);
				this.update(evt.pos.y);
			},
			"release": evt => {
				var dists = this.object3dList.map((object3d, idx) => {
					return Math.abs(object3d.obj.position.y - evt.destPos.y);
				});
				var targetFloorIdx = dists.indexOf(Math.min.apply(null, dists));
				setTimeout(() => {
					evt.stop();
					this.goTo(targetFloorIdx, evt.duration);
				}, 0);
			}
		});
		const panInput = new PanInput(this.container, {
			scale: [0.01, 0.01]
		});
		axes.connect([null, "y"], panInput); 

		// indoorGlobal.position.y = posMin;
	}
	_updateAxesRange() {
		setTimeout(() => {
			var scaleFactor = 1;
	
			if( this.scaleOption.boxBound ) {
				scaleFactor = this.scaleOption.boxBound / box3.getSize().length();
			} else if( this.scaleOption.rectBound ) {
				var size = box3.getSize();
				size = Math.sqrt( size.x * size.x + size.y * size.y );
				scaleFactor = this.scaleOption.rectBound / size;
			} else if( this.scaleOption.localScale ) {
				scaleFactor = this.scaleOption.localScale;
			}

			this.object3dList = this.object3dList.map(objItem => {
				objItem.originalScale = scaleFactor;
				return objItem;
			})

			var posList = this.object3dList.map(object3d => object3d.obj.position.y);

			var posMax = Math.max.apply(Math, posList);
			var posMin = Math.min.apply(Math, posList);
			this.axes.axis.y.range = [posMin, posMax];
			if(this.axes.get().y > posMax) {
				this.axes.setTo({"y": posMax});
			} else if(this.axes.get().y < posMin) {
				this.axes.setTo({"y": posMin});
			}
		}, 0);
	}
	setScaleOption(scaleOption) {
		this.scaleOption = scaleOption;
		this._updateAxesRange();
	}
	setObjectMargin(objectMargin) {
		this.objectMargin = objectMargin;
		this._updateAxesRange();
	}
	setStretchStrength(stretchStrength) {
		this.stretchStrength = stretchStrength;
		this._updateAxesRange();
	}
	setStretchApplyThreshold(stretchApplyThreshold) {
		this.stretchApplyThreshold = stretchApplyThreshold;
		this._updateAxesRange();
	}
	setScaleStrength(scaleStrength) {
		this.scaleStrength = scaleStrength;
		this._updateAxesRange();
	}
	setScaleApplyThreshold(scaleApplyThreshold) {
		this.scaleApplyThreshold = scaleApplyThreshold;
		this._updateAxesRange();
	}
	setRotationStrength(rotationStrength) {
		this.rotationStrength = rotationStrength;
		this._updateAxesRange();
	}
	setRotationApplyThreshold(rotationApplyThreshold) {
		this.rotationApplyThreshold = rotationApplyThreshold;
		this._updateAxesRange();
	}
	
	

	goTo(idx, duration) {
		this.axes.setTo({
			"y": this._getGroupPosition(idx)
		}, duration || 300);
	} 
	update(y) {
		this.object3DGroup.position.y = - y;
		// this.object3dList.forEach((objItem, objIdx) => {
		// 	const positionY = objItem.position.y;
		// 	// var offsetFactor = objIdx * 1 * 50000;
		// 	// offset                    
		// 	var direction = positionY - y;
		// 	var dist = Math.abs(direction);
		// 	//  거리가 0 일때 최고,  거리가 2 이상 일때 기존 스케일 적용 
		// 	var scale = objItem.scale.x;

		// 	var scaleStrength = 0.45;
		// 	var stretchScale = 1.2;
		// 	var scaleApplyThreshold = 2;
		// 	var stretchApplyThreshold = 2;
			
		// 	// var maxOffset = ;
		// 	if (Math.abs(direction) > stretchApplyThreshold) {
		// 		direction = direction > 0 ? stretchApplyThreshold : -stretchApplyThreshold;
		// 	}

		// 	if (dist > scaleApplyThreshold) {
		// 		dist = scaleApplyThreshold;
		// 	}

		// 	dist = 1 - dist / scaleApplyThreshold;
		// 	direction = direction * stretchScale;

		// 	scale = objItem.initScale + objItem.initScale * scaleStrength * dist;
		// 	// var x = objItem.obj.position.x; 
		// 	// var y = objItem.obj.position.y; 
		// 	// var z = objItem.obj.position.z; 

		// 	// // scaler.position.y = scaler.position.y + offsetFactor * scaleFactor
		// 	//console.log(direction, objItem.offset)
		// 	objItem.obj.position.set(
		// 		objItem.obj.position.x,
		// 		positionY + direction,//  * scaleStrength * dist,// + offsetFactor, 
		// 		objItem.obj.position.z); 
		
		// 	objItem.obj.scale.set(scale, scale, scale); 
		// });

	}
	loadObjects() {
		return new Promise(res => {
			Object3DLoader.loadItems(this.resources).then(originalObject3dList => {
				originalObject3dList.forEach((object_, objIdx) => {
					// apply preprocess
					const object = this.preProcessToModel ? 
						this.preProcessToModel(object_) : object_;
	
					var box3 = new THREE.Box3();
					box3.setFromObject( object );
	
					// re-center model
					var center = box3.getCenter();
					center.y = box3.max.y;				
					object.position.sub( center );
					
					// apply scale to model
					var scaler = new THREE.Group();
					scaler.add( object );
	
					var scaleFactor = 1;
	
					if( this.scaleOption.boxBound ) {
						scaleFactor = this.scaleOption.boxBound / box3.getSize().length();
					} else if( this.scaleOption.rectBound ) {
						var size = box3.getSize();
						size = Math.sqrt( size.x * size.x + size.y * size.y );
						scaleFactor = this.scaleOption.rectBound / size;
					} else if( this.scaleOption.localScale ) {
						scaleFactor = this.scaleOption.localScale;
					}

					scaler.scale.setScalar( scaleFactor );

					scaler.position.y = objIdx * this.objectMargin;

					this.object3dList.push({
						obj: scaler,
						originalPositionY: scaler.position.y,
						originalScale: scaleFactor,
						originalRotation: scaler.getWorldRotation()
					});

					this.object3DGroup.add( scaler );
				})
	
				this.scene.add( this.object3DGroup ); 
				res();
			});
		});

	}
	initRenderer() {
		const WIDTH = window.innerWidth ;
		const HEIGHT = window.innerHeight;
		const camPosScaler = 0.02;
		const YOffset = 0;
//		const YOffset = -2;
		
		const camera = this.camera = new THREE.OrthographicCamera(
			WIDTH * camPosScaler / - 2,
			WIDTH * camPosScaler / 2,
			HEIGHT * camPosScaler / 2 + YOffset,
			HEIGHT * camPosScaler/ - 2 + YOffset,
			-1000,
			1000
		);
		camera.position.set(0.25045350708296965, 1.7041388793736647, 0.18216399368949676);
		camera.lookAt(0, 1.5, 0);
		
		// var controls = new THREE.OrbitControls( camera );

		const scene = this.scene = new THREE.Scene();
		scene.background = new THREE.Color( 0x222222 );
		scene.add( new THREE.GridHelper( 10, 10 ) );
		
		const ambient = new THREE.HemisphereLight( 0xcccccc, 0xffffff, 0.85 );
		ambient.position.set( -0.5, 0.75, -1 );
		scene.add( ambient );

		const renderer = this.renderer = new THREE.WebGLRenderer();
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( WIDTH, HEIGHT );

		this.container.appendChild( renderer.domElement );	
	}
	_getGroupPosition(idx) {
		return this.objectMargin * idx;
	}
	_getItemPosition(
		idx,
		objectMargin,
		groupPozY,
		stretchApplyThreshold,
		stretchStrength
	) {
		const itemOffset = idx * objectMargin;
		let direction = itemOffset + groupPozY;
		const distance = Math.abs(direction);
		// console.log(`${idx}: direction`, distance);
		// console.log(itemOffset, direction, distance, stretchStrength)
		// 간격 보정. 중심에 가까울 수록 간격이 커져야 한다.
		if (distance > stretchApplyThreshold) {
			direction = direction > 0 ? stretchApplyThreshold : -stretchApplyThreshold;
		}
		direction = direction * stretchStrength;
		return itemOffset + direction;
	}
	_getItemScale(
		idx,
		objectMargin,
		groupPozY,
		scaleApplyThreshold,
		scaleStrength
	) {
		const itemOffset = idx * objectMargin;
		let direction = itemOffset + groupPozY;
		const originalScale = this.object3dList[idx].originalScale;
		let distance = Math.abs(direction);
		if (distance > scaleApplyThreshold) {
			distance = scaleApplyThreshold;
		}
		const scaleCoefficient = 1 - distance / scaleApplyThreshold;
		const scale = originalScale + originalScale * scaleStrength * scaleCoefficient;

		//console.log(originalScale, scaleCoefficient)
		return scale;
	}
	_getItemRotation(
		idx,
		objectMargin,
		groupPozY,
		rotationApplyThreshold,
		rotationStrength,
		camera
	){
		const itemOffset = idx * objectMargin;
		let direction = itemOffset + groupPozY;
		const originalRotation = this.object3dList[idx].originalRotation;
		var originalQuat = new THREE.Quaternion();
		originalQuat.setFromEuler(originalRotation);

		let distance = Math.abs(direction);
		if (distance > rotationApplyThreshold) {
			distance = rotationApplyThreshold;
		}
		const rotationCoefficient = (1 - distance / rotationApplyThreshold) * rotationStrength;
		const cameraRotation = camera.getWorldRotation();
		var cameraQuat = new THREE.Quaternion();
		cameraQuat.setFromEuler( cameraRotation );
		var adjustQuat = new THREE.Quaternion();
		adjustQuat.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), Math.PI / 2 )
		var adjustQuat2 = new THREE.Quaternion();
		adjustQuat2.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), 3 * Math.PI / 2 )
		cameraQuat.multiply(adjustQuat);
		cameraQuat.multiply(adjustQuat2);
		const rotation = originalQuat.slerp(cameraQuat, rotationCoefficient);

		return rotation;
	}
	startRender() {
		const renderer = this.renderer;
		const scene = this.scene;
		const camera = this.camera;
		const that = this;

		function animate(now) {
			// console.log(that.objectMargin);
			// scaler.scale.setScalar( scaleFactor );
			// const posY = scaler.position.y;
			// console.log("scaler.position.y", scaler.position.y)
			// // apply offset Y to model
			// scaler.position.y =
			// 	scaler.position.y + objIdx * that.objectMargin;
			// console.log("offset", objIdx * this.objectMargin)


			that.object3dList.forEach((objItem, idx) => {
				const scaleStrength = that.scaleStrength;
				const stretchStrength = that.stretchStrength;
				const scaleApplyThreshold = that.scaleApplyThreshold;
				const obj = objItem.obj;

				// 포커스에 얼마나 가까운지 나타내는 척도
				obj.position.y = that._getItemPosition(
					idx,
					that.objectMargin,
					that.object3DGroup.position.y,
					that.stretchApplyThreshold,
					that.stretchStrength
				);

				const scale = that._getItemScale(
					idx,
					that.objectMargin,
					that.object3DGroup.position.y,
					that.scaleApplyThreshold,
					that.scaleStrength
				);

				obj.scale.set(scale, scale, scale);

				const rotation = that._getItemRotation(
					idx,
					that.objectMargin,
					that.object3DGroup.position.y,
					that.rotationApplyThreshold,
					that.rotationStrength,
					that.camera
				);

				obj.setRotationFromQuaternion(rotation);

				// obj.applyQuaternion(that.camera.quaternion);
				// obj.lookAt( that.camera.position );
				// var quaternion = new THREE.Quaternion();
				// quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI / 2 );
				// .setRotationFromAxisAngle
				

				//cameraQuat.multiply(adjustQuat3);


				// if (dist > scaleApplyThreshold) {
				// 	dist = scaleApplyThreshold;
				// }
				
				// if (dist > stretchApplyThreshold) {
				// 	direction = direction > 0 ? stretchApplyThreshold : -stretchApplyThreshold;
				// }
				// const obj = objItem.obj;
				// // obj.position.y = idx * that.objectMargin;
				// // console.log(obj.position.y + idx * that.objectMargin)

				// var stretch = dist * stretchStrength;
				// var scale = objItem.initScale + objItem.initScale * scaleStrength * dist;

				// const stretchCoefficient = 1 - dist / stretchApplyThreshold;
				// const scaleCoefficient = 1 - dist / scaleApplyThreshold;
				// scale = objItem.originalScale + objItem.originalScale * scaleStrength * scaleCoefficient;
				// objItem.obj.scale.set(scale, scale, scale);
				// obj.position.y = idx * that.objectMargin + stretchCoefficient;
				// objItem.obj.position.set(
				// 	objItem.obj.position.x,
				// 	idx * that.objectMargin + direction,//  * scaleStrength * dist,// + offsetFactor, 
				// 	objItem.obj.position.z); 

			});
			//// Turn Table Effect   
			// var time = now / 5000;
			// camera.position.x = Math.sin( time ) * 5;
			// camera.position.z = Math.cos( time ) * 5;
			// camera.lookAt( 0, 1.5, 0 );
			renderer.render( scene, camera );
			requestAnimationFrame( animate );
		}

		requestAnimationFrame( animate );

		window.addEventListener( 'resize', onWindowResize, false );

		function onWindowResize(){
			that.updateCamera();
		
			renderer.setSize( window.innerWidth, window.innerHeight );
		
		}
	}
	updateCamera() {
		const WIDTH = window.innerWidth ;
		const HEIGHT = window.innerHeight;
		const camPosScaler = 0.02;
		const YOffset = 0;
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.left = WIDTH * camPosScaler / - 2;
		this.camera.right = WIDTH * camPosScaler / 2;
		this.camera.top = HEIGHT * camPosScaler / 2 + YOffset;
		this.camera.bottom = HEIGHT * camPosScaler/ - 2 + YOffset;
		this.camera.updateProjectionMatrix();
	}
}
            