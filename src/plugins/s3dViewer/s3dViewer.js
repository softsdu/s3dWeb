import * as THREE from "three";
import {CSS2DRenderer} from "css2dRenderer";
import {OrbitControls} from "orbitControls";
import {
	cmnPcr,
	s3dViewerStatus,
	msgBox,
	s3dOperateType,
	s3dNormalViewport,
	s3dViewLevel
} from "../../commonjs/common/static.js"
import "./s3dViewer.css"
import {TWEEN} from "tween"

//S3dWeb Viewer
let S3dViewer = function (){
	//当前对象
	const thatS3dViewer = this; 
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	//移动设备自动旋转到宽屏状态
	this.mobileAutoRotate = false;

	//xy坐标互换
	this.xyExchange = false;

	//detailLevel
	this.detailLevel = null;

	//viewLevel
	this.viewLevel = null;
	
	//状态，默认为常规
	this.status = s3dViewerStatus.normalView;	 

	//临时数据
	this.statusData = {};
		
	//被选中的object3D（多选）
	this.selectedObject3Ds = [];
	
	//所有object3D
	this.allObject3DMap = {};

	//根节点object3D
	this.rootObject3D = null;

	//根节点object3D
	this.rootTag3D = null;

	//camera椎体宽度
	this.frustumSize = 500;

	//camera初始信息
	this.cameraInfo = null;
	
	//可视化和交互相关
	this.scene = null;
	this.camera = null;
	this.renderer = null;
	this.renderer2d = null;
	this.orbitControl = null; 
	this.raycaster = null; //光投射器
	this.hemisphereLight = null;
	this.directionalLights = [];
 
	//运行环境变量
	this.backgroundColor = 0x111111;

	//是否显示相机helper
	this.showCameraHelper = false;

	//是否显示阴影
	this.showShadow = false;

	//是否可选中构件
	this.canSelectObject3D = true;

	//包含动画
	this.hasAnimation = false;

	//控制器配置
	this.orbitControlConfig = {};

	//事件日志
	this.eventLogMap = {};

	//scene控制器的限制设定
	this.controlConfig = {
		perspective: {
			minZoom: 0,
			maxZoom: Infinity,
			minPolarAngle: 0,
			maxPolarAngle: Math.PI,
			minDistance: -Infinity,
			maxDistance: Infinity,
			zoomSpeed: 1,
			panSpeed: 1,
			rotateSpeed: 1,
			enablePan: true,
			enableRotate: true,
			enableZoom: true,
			near: 0.01,
			far: 200
		},
		orthographic: {
			minZoom: 0,
			maxZoom: Infinity,
			minPolarAngle: 0,
			maxPolarAngle: Math.PI,
			minDistance: 0,
			maxDistance: Infinity,
			zoomSpeed: 1,
			panSpeed: 1,
			rotateSpeed: 1,
			enablePan: true,
			enableRotate: true,
			enableZoom: true,
			near: -200,
			far: 200
		}
	};

	//高亮显示的材质
	this.hightLightMaterial = new THREE.MeshStandardMaterial({
		color: 0x0094FF,
		transparent: true,
		opacity: 0.7,
		flatShading: true,
		side: THREE.FrontSide,
		depthTest: false
	});

	//高亮显示的line材质
	this.hightLightLineMaterial = new THREE.LineBasicMaterial({
		color: 0x0094FF,
		//transparent: true,
		//depthTest: false
	});

	//高亮resource边框材质
	this.hightLightResourceBoxEdgeMaterial = new THREE.LineBasicMaterial({
		color: 0x0094FF,
		linewidth: 1,
		opacity: 0.3,
		transparent: true,
		depthTest: false
	});

	//边框材质
	this.edgeMaterial = new THREE.LineBasicMaterial({
		color: 0x888888, 
		linewidth: 1
	});

	//line点击响应范围
	this.lineSelectThreshold = 0.1;
	
	//交互参数
	this.mouseDownPosition = null;
	this.mouseLastMovePosition = null;
	this.containerPos = {x: 0, y: 0};
	
	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dViewer.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dViewer.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dViewer.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	}
	 
	//初始化
	this.init = function(p) {
		thatS3dViewer.containerId = p.containerId;
		thatS3dViewer.manager = p.manager;
		thatS3dViewer.showShadow = p.config.showShadow;
		thatS3dViewer.mobileAutoRotate = p.config.mobileAutoRotate;
		thatS3dViewer.canSelectObject3D = p.config.canSelectObject3D == null ? true : p.config.canSelectObject3D;
		thatS3dViewer.hasAnimation = p.config.hasAnimation == null ? false : p.config.hasAnimation;
		thatS3dViewer.detailLevel = p.config.detailLevel == null ? 4 : p.config.detailLevel;
		thatS3dViewer.viewLevel = p.config.viewLevel == null ? s3dViewLevel.always : p.config.viewLevel;
		thatS3dViewer.backgroundColor = p.config.backgroundColor == null ? thatS3dViewer.backgroundColor : p.config.backgroundColor;
		thatS3dViewer.lineSelectThreshold = p.config.lineSelectThreshold == null ? thatS3dViewer.lineSelectThreshold : p.config.lineSelectThreshold;

		if(p.config.orbitControlConfig != null){
			thatS3dViewer.orbitControlConfig = p.config.orbitControlConfig;
		}

		thatS3dViewer.updateScreenRotation();

		//初始化环境
		thatS3dViewer.initHtml();
		thatS3dViewer.initScene();
		thatS3dViewer.initRender();
		thatS3dViewer.initRender2D();
		thatS3dViewer.initRaycaster();
		thatS3dViewer.initLight(p);
		thatS3dViewer.initCamera();
		thatS3dViewer.initControls();

		thatS3dViewer.animate();

		//绑定事件
		//当选中构件时
		if (p.config.onSelectChanged != null) {
			thatS3dViewer.addEventFunction("onSelectChanged", p.config.onSelectChanged);
		}

		//当scene初始化完成后
		if (p.config.afterInitScene != null) {
			thatS3dViewer.addEventFunction("afterInitScene", p.config.afterInitScene);
		}

		//当添加新构件对象后
		if (p.config.afterAddNewObject != null) {
			thatS3dViewer.addEventFunction("afterAddNewObject", p.config.afterAddNewObject);
		}

		//当初始化一个构件对象后
		if (p.config.afterInitObject != null) {
			thatS3dViewer.addEventFunction("afterInitObject", p.config.afterInitObject);
		}

		//当重新创建一个构件对象后（修改参数后，会自动参数化驱动造型，重新创建构件对象）
		if (p.config.afterRebuildObject != null) {
			thatS3dViewer.addEventFunction("afterRebuildObject", p.config.afterRebuildObject);
		}

		//当重新创建一个构件对象前（事件中可以修改参数）
		if (p.config.beforeRebuildObject != null) {
			thatS3dViewer.addEventFunction("beforeRebuildObject", p.config.beforeRebuildObject);
		}

		//当删除构件对象前
		if (p.config.beforeRemoveObjects != null) {
			thatS3dViewer.addEventFunction("beforeRemoveObjects", p.config.beforeRemoveObjects);
		}

		//当删除构件对象后
		if (p.config.afterRemoveObject != null) {
			thatS3dViewer.addEventFunction("afterRemoveObject", p.config.afterRemoveObject);
		}

		//当初始化所有构件对象完成后
		if (p.config.afterInitAllObjects != null) {
			thatS3dViewer.addEventFunction("afterInitAllObjects", p.config.afterInitAllObjects);
		}

		//当渲染时（调用非常频繁）
		if (p.config.afterAnimate != null) {
			thatS3dViewer.addEventFunction("afterAnimate", p.config.afterAnimate);
		}

		//当单击时
		if (p.config.onMouseClick != null) {
			thatS3dViewer.addEventFunction("onMouseClick", p.config.onMouseClick);
		}

		//当双击时
		if (p.config.onMouseDblClick != null) {
			thatS3dViewer.addEventFunction("onMouseDblClick", p.config.onMouseDblClick);
		}

		//当双击图层时
		if (p.config.onDblClickLayerObject != null) {
			thatS3dViewer.addEventFunction("onDblClickLayerObject", p.config.onDblClickLayerObject);
		}

		//当双击构件时
		if (p.config.onDblClickObject != null) {
			thatS3dViewer.addEventFunction("onDblClickObject", p.config.onDblClickObject);
		}

		//当单击图层时
		if (p.config.onClickLayerObject != null) {
			thatS3dViewer.addEventFunction("onClickLayerObject", p.config.onClickLayerObject);
		}

		//在图层上mouseDown时
		if (p.config.onMouseDownUserLayerObject != null) {
			thatS3dViewer.addEventFunction("onMouseDownUserLayerObject", p.config.onMouseDownUserLayerObject);
		}

		//在图层上mouseUp时
		if (p.config.onMouseUpUserLayerObject != null) {
			thatS3dViewer.addEventFunction("onMouseUpUserLayerObject", p.config.onMouseUpUserLayerObject);
		}

		//在图层上做鼠标移动时
		if (p.config.onMouseMoveUserLayerObject != null) {
			thatS3dViewer.addEventFunction("onMouseMoveUserLayerObject", p.config.onMouseMoveUserLayerObject);
		}

		//在图层上keydown时
		if (p.config.onKeyDownUserLayerObject != null) {
			thatS3dViewer.addEventFunction("onKeyDownUserLayerObject", p.config.onKeyDownUserLayerObject);
		}

		//当单击构件时
		if (p.config.onClickObject != null) {
			thatS3dViewer.addEventFunction("onClickObject", p.config.onClickObject);
		}

		//鼠标事件
		//鼠标按下
		let container = $("#" + thatS3dViewer.containerId);
		$(container).find(".viewContainer").mousedown(thatS3dViewer.onMouseDown);

		//鼠标移动
		$(container).mousemove(thatS3dViewer.onMouseMove);

		//鼠标按键抬起
		$(container).find(".viewContainer").mouseup(thatS3dViewer.onMouseUp);

		//键盘按下
		$(container).find(".viewContainer").keydown(thatS3dViewer.onKeyDown);

		//将容器设为焦点，方便触发键盘事件
		thatS3dViewer.focus();

		//当窗口缩放时
		window.addEventListener('resize', thatS3dViewer.onWindowResize, false);

		//初始化交互参数
		let viewContainer = $("#" + p.containerId).find(".viewContainer")[0];
		let viewContainerOffset = $(viewContainer).offset();
		thatS3dViewer.containerPos = {
			x: viewContainerOffset.left,
			y: viewContainerOffset.top
		};

		let allTypeUnitMap = thatS3dViewer.initAllTypeUnits();

		thatS3dViewer.initRootObject3D();
		thatS3dViewer.initRootTag3D();

		thatS3dViewer.initAllObject3Ds(allTypeUnitMap);
	}

	this.checkIsMobileDevice = function () {
		return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	}

	this.focus = function (){
		let container = $("#" + thatS3dViewer.containerId);
		$(container).find(".viewContainer").focus();
	}

	this.updateScreenRotation = function (){
		if(thatS3dViewer.mobileAutoRotate && thatS3dViewer.checkIsMobileDevice()){
			let width = $(document.body).width();
			let height = $(document.body).height();
			let container = $("#" + thatS3dViewer.containerId)[0];
			if(width < height){
				$(container).css({
					"transform-origin": "0px 0px",
					"transform": "rotate(90deg) translateY(-100%)",
					"width": height + "px",
					"height": width + "px",
				});
				thatS3dViewer.xyExchange = true;
				if(thatS3dViewer.orbitControl != null){
					thatS3dViewer.orbitControl.xyExchange = true;
				}
			}
			else{
				$(container).css({
					"transform-origin": "",
					"transform": "",
					"width": width + "px",
					"height": height + "px",
				});
				thatS3dViewer.xyExchange = false;
				if(thatS3dViewer.orbitControl != null){
					thatS3dViewer.orbitControl.xyExchange = false;
				}
			}
		}
	}

	//初始化所有构件
	this.initAllObject3Ds = function(allTypeUnitMap){
		let countInfo = {
			all: allTypeUnitMap.server.length + allTypeUnitMap.local.length,
			serverAll: allTypeUnitMap.server.length,
			serverSucceed: 0,
			localAll: allTypeUnitMap.local.length,
			localSucceed: 0
		};
		if(countInfo.localAll > 0) {
			thatS3dViewer.manager.localObjectCreator.createObject3Ds(allTypeUnitMap.local, thatS3dViewer.afterInitObject3D, countInfo);
		}
		if(countInfo.serverAll > 0) {
			thatS3dViewer.manager.serverObjectCreator.createObject3Ds(allTypeUnitMap.server, thatS3dViewer.afterInitObject3D, countInfo);
		}
		if(countInfo.all === 0){
			thatS3dViewer.afterInitAllObjects();
			thatS3dViewer.afterInitScene();
		}
	}

	//初始化cacheKey对应的Unit
	this.initAllTypeUnits = function (){
		let serverUnits = [];
		let localUnits = [];
		let internalUnits = [];
		for(let unitId in thatS3dViewer.manager.s3dObject.unitMap){
			let unitJson = thatS3dViewer.manager.s3dObject.unitMap[unitId];
			if(unitJson.gltfKey){
				internalUnits.push(unitJson);
			}
			else if(unitJson.isServer){
				serverUnits.push(unitJson);
			}
			else{
				localUnits.push(unitJson);
			}
		}
		return {
			server: serverUnits,
			local: localUnits,
			internal: internalUnits
		};
	}

	this.getUnitCacheKey = function (unitJson){
		let cacheKey;
		if(unitJson.gltfKey){
			cacheKey = unitJson.gltfKey;
		}
		else if(unitJson.isServer){
			let componentInfo = thatS3dViewer.manager.s3dObject.unitTypeMap[unitJson.code + "_" + unitJson.versionNum];
			cacheKey = thatS3dViewer.manager.serverObjectCreator.getUnitCacheKey(unitJson, thatS3dViewer.detailLevel, thatS3dViewer.viewLevel, componentInfo);
		}
		else{
			cacheKey = thatS3dViewer.manager.localObjectCreator.getUnitCacheKey(unitJson);
		}
		return cacheKey;
	}

	this.afterInitObject3D = function (p){
		thatS3dViewer.allObject3DMap[p.unitSetting.id] = p.object3D;
		thatS3dViewer.rootObject3D.add(p.object3D);
		thatS3dViewer.addTagObjectToScene(p.object3D);

		thatS3dViewer.doEventFunction("afterInitObject", {
			object3D: p.object3D
		});

		//全部初始化加载完成后
		if(p.countInfo.serverAll === p.countInfo.serverSucceed
			&& p.countInfo.localAll === p.countInfo.localSucceed) {
			thatS3dViewer.afterInitAllObjects();
			thatS3dViewer.afterInitScene();
		}
	}

	//设置相机信息
	this.setCameraInfo = function(cameraInfo){
		let needChangeCamera = cameraInfo.type != thatS3dViewer.manager.s3dObject.camera.type;
		thatS3dViewer.manager.s3dObject.camera = cameraInfo;
		if(needChangeCamera){
			thatS3dViewer.manager.s3dObject.camera = thatS3dViewer.getDefaultCameraInfo();
			thatS3dViewer.initCamera();
			thatS3dViewer.initControls();
			thatS3dViewer.setNormalViewport(s3dNormalViewport.init);
			thatS3dViewer.animate();

			if(thatS3dViewer.manager.moveHelper != null){
				thatS3dViewer.manager.moveHelper.initControl();
			}
		}
	}

	this.getDefaultCameraInfo = function (){
		let axisInfo = thatS3dViewer.manager.s3dObject.axis;
		switch (thatS3dViewer.manager.s3dObject.camera.type){
			case "Orthographic":{
				return {
					type: "Orthographic",
					target: [
						axisInfo.size.x / 2,
						axisInfo.size.y / 16,
						axisInfo.size.z / 2,
					],
					position: [
						axisInfo.size.x / 2,
						axisInfo.size.y ,
						axisInfo.size.z / 2
					],
					zoom: 100
				};
			}
			case "Perspective":
			default:{
				return {
					type: "Perspective",
					target: [
						axisInfo.size.x / 2,
						axisInfo.size.y / 16,
						axisInfo.size.z / 2,
					],
					position: [
						axisInfo.size.x / 2,
						axisInfo.size.y,
						axisInfo.size.z * 1.5
					],
					zoom: 1
				};
			}
		}
	}

	//获取相机信息
	this.getCameraInfo = function(){
		return thatS3dViewer.manager.s3dObject.camera;
	}

	//获取unit根对象
	this.initRootObject3D = function(){
		let rootObject3D = new THREE.Group();

		//打上标记
		rootObject3D.isS3dRootObject = true;
		thatS3dViewer.addObject3DToScene(rootObject3D);
		thatS3dViewer.rootObject3D = rootObject3D;
	}

	//获取Tag根对象
	this.initRootTag3D = function(){
		let rootTag3D = new THREE.Group();

		//打上标记
		rootTag3D.isS3dRootTag = true;
		thatS3dViewer.addObject3DToScene(rootTag3D);
		thatS3dViewer.rootTag3D = rootTag3D;
	}

	//当初始化所有构件对象完成后
	this.afterInitAllObjects = function(){
		thatS3dViewer.setNormalViewport(s3dNormalViewport.init);
    	thatS3dViewer.doEventFunction("afterInitAllObjects", {});
	}

	//scene初始化完成后
	this.afterInitScene = function(){
    	thatS3dViewer.doEventFunction("afterInitScene", {});
	}
	
    //初始化光投射器
    this.initRaycaster = function() { 
    	thatS3dViewer.raycaster = new THREE.Raycaster();

    	//点击感应的范围 added by ls 20221128
    	thatS3dViewer.raycaster.params.Line.threshold = thatS3dViewer.lineSelectThreshold;
    }; 
	
	//初始化html
	this.initHtml = function(){
		let html = "<div class=\"viewContainer\" tabindex=\"0\"><div class=\"viewInnerContainer\"></div></div>";
		$("#" + thatS3dViewer.containerId).append(html);
	}
	
	//测试
	this.test = function(){ 
        let boxGeometry = new THREE.BoxGeometry(10, 10, 10);
        let boxMaterial = new THREE.MeshLambertMaterial({
        	color: 0x444444
        });
        let box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(0, 0, 0); 
        thatS3dViewer.scene.add(box);  
	}
    
    //初始化Scene
    this.initScene = function() {
    	thatS3dViewer.scene = new THREE.Scene();
    }; 

    //初始化Camera
    this.initCamera = function() {
		let container = $("#" + thatS3dViewer.containerId);
        let width = $(container).find(".viewInnerContainer").width();
        let height = $(container).find(".viewInnerContainer").height();
		let aspect = width / height;
		let camera;
		let cameraType = thatS3dViewer.manager.s3dObject.camera.type;
		let controlConfig = thatS3dViewer.getControlConfig();
		let orbitControlConfig = thatS3dViewer.getOrbitControlConfig();
		let near = orbitControlConfig.near == null ? controlConfig.near : orbitControlConfig.near;
		let far = orbitControlConfig.far == null ? controlConfig.far : orbitControlConfig.far;
		switch(cameraType){
			//正交
			case "Orthographic":{
				let aspect = width / height;
				camera = new THREE.OrthographicCamera( -thatS3dViewer.frustumSize * aspect,
					thatS3dViewer.frustumSize * aspect,
					thatS3dViewer.frustumSize,
					-thatS3dViewer.frustumSize,
					near,
					far);
				camera.position.set(200, 200, 200);
				break;
			}
			//透视
			case "Perspective":
			default:{
				camera = new THREE.PerspectiveCamera(45,
					aspect,
					near,
					far);
				camera.position.set(40, 50, 60);
				break;
			}
		}
		thatS3dViewer.camera = camera;
    };

    //初始化Render
    this.initRender = function() { 
    	thatS3dViewer.renderer = new THREE.WebGLRenderer({ 
    		antialias: true,
			logarithmicDepthBuffer: true
		});
		if(thatS3dViewer.showShadow){
			thatS3dViewer.renderer.shadowMap.enabled = true;
		}
		thatS3dViewer.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

		let container = $("#" + thatS3dViewer.containerId);
        let width = $(container).find(".viewInnerContainer").width();
        let height = $(container).find(".viewInnerContainer").height();
        thatS3dViewer.renderer.setSize(width, height);
		thatS3dViewer.renderer.setPixelRatio( window.devicePixelRatio );
        thatS3dViewer.renderer.setClearColor(thatS3dViewer.backgroundColor);

        $(container).find(".viewInnerContainer").append(thatS3dViewer.renderer.domElement);
    };

    //初始化Render2D
    this.initRender2D = function() { 
    	thatS3dViewer.renderer2d = new CSS2DRenderer();
		let container = $("#" + thatS3dViewer.containerId);
        let width = $(container).find(".viewInnerContainer").width();
        let height = $(container).find(".viewInnerContainer").height();
        thatS3dViewer.renderer2d.setSize( width, height );
        thatS3dViewer.renderer2d.domElement.style.position = 'absolute';
        thatS3dViewer.renderer2d.domElement.style.top = '0px';
        thatS3dViewer.renderer2d.domElement.tabIndex = 0;
        thatS3dViewer.renderer2d.domElement.className = "viewInnerRenderer2d";
        $(container).find(".viewContainer").append(thatS3dViewer.renderer2d.domElement);
    };

    //window变化事件
    this.onWindowResize = function() {
		thatS3dViewer.updateScreenRotation();

		let container = $("#" + thatS3dViewer.containerId);
        let width = $(container).find(".viewInnerContainer").width();
        let height = $(container).find(".viewInnerContainer").height();
		let aspect = width / height; 	
		if(thatS3dViewer.camera instanceof THREE.OrthographicCamera){
			thatS3dViewer.camera.left = - thatS3dViewer.frustumSize * aspect;
			thatS3dViewer.camera.right = thatS3dViewer.frustumSize * aspect;
			thatS3dViewer.camera.top = thatS3dViewer.frustumSize;
			thatS3dViewer.camera.bottom = - thatS3dViewer.frustumSize;
		}
		else if(thatS3dViewer.camera instanceof THREE.PerspectiveCamera){
			thatS3dViewer.camera.aspect = aspect;
		}
		thatS3dViewer.camera.updateProjectionMatrix();
		thatS3dViewer.renderer.setSize(width, height);         
		thatS3dViewer.renderer2d.setSize( width, height);         	 
    };

	this.getControlConfig = function (){
		switch (thatS3dViewer.manager.s3dObject.camera.type){
			case "Perspective":{
				return thatS3dViewer.controlConfig.perspective;
			}
			case "Orthographic":
			default:{
				return thatS3dViewer.controlConfig.orthographic;
			}
		}
	}

	this.getOrbitControlConfig = function (){
		switch (thatS3dViewer.manager.s3dObject.camera.type){
			case "Perspective":{
				return thatS3dViewer.orbitControlConfig.perspective;
			}
			case "Orthographic":
			default:{
				return thatS3dViewer.orbitControlConfig.orthographic;
			}
		}
	}


    //初始化Controls
    this.initControls = function() {    	
    	let orbitControl = new OrbitControls(thatS3dViewer.camera, thatS3dViewer.renderer2d.domElement);
    	orbitControl.target = new THREE.Vector3(0, 0, 0);

		let controlConfig = thatS3dViewer.getControlConfig();
		let orbitControlConfig = thatS3dViewer.getOrbitControlConfig();
		orbitControl.minZoom = orbitControlConfig.minZoom == null ? controlConfig.minZoom : orbitControlConfig.minZoom;
		orbitControl.maxZoom = orbitControlConfig.maxZoom == null ? controlConfig.maxZoom : orbitControlConfig.maxZoom;
		orbitControl.minPolarAngle = orbitControlConfig.minPolarAngle == null ? controlConfig.minPolarAngle : orbitControlConfig.minPolarAngle;
		orbitControl.maxPolarAngle = orbitControlConfig.maxPolarAngle == null ? controlConfig.maxPolarAngle : orbitControlConfig.maxPolarAngle;
		orbitControl.minDistance = orbitControlConfig.minDistance == null ? controlConfig.minDistance : orbitControlConfig.minDistance;
		orbitControl.maxDistance = orbitControlConfig.maxDistance == null ? controlConfig.maxDistance : orbitControlConfig.maxDistance;
		orbitControl.enablePan = orbitControlConfig.enablePan == null ? controlConfig.enablePan : orbitControlConfig.enablePan;
		orbitControl.enableRotate = orbitControlConfig.enableRotate == null ? controlConfig.enableRotate : orbitControlConfig.enableRotate;
		orbitControl.enableZoom = orbitControlConfig.enableZoom == null ? controlConfig.enableZoom : orbitControlConfig.enableZoom;
		orbitControl.zoomSpeed = orbitControlConfig.zoomSpeed == null ? controlConfig.zoomSpeed : orbitControlConfig.zoomSpeed;
		orbitControl.panSpeed = orbitControlConfig.panSpeed == null ? controlConfig.panSpeed : orbitControlConfig.panSpeed;
		orbitControl.rotateSpeed = orbitControlConfig.rotateSpeed == null ? controlConfig.rotateSpeed : orbitControlConfig.rotateSpeed;

		orbitControl.xyExchange = thatS3dViewer.xyExchange;
    	orbitControl.update();     	
    	thatS3dViewer.orbitControl = orbitControl;
	};

    //初始化Light
    this.initLight = function(p) {
		let hemisphereLightIntensity = 0.8;
		if(p.config.hemisphereLight !== undefined && p.config.hemisphereLight != null){
			hemisphereLightIntensity = (p.config.hemisphereLight.intensity !== undefined && p.config.hemisphereLight.intensity !== null) ? p.config.hemisphereLight.intensity : hemisphereLightIntensity;
		}

		/*
		let ambientLight = new THREE.AmbientLight(0xFFFFFF, hemisphereLightIntensity);
		thatS3dViewer.scene.add(ambientLight);
		*/

		let hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, hemisphereLightIntensity);
		thatS3dViewer.scene.add(hemisphereLight);
		thatS3dViewer.hemisphereLight = hemisphereLight;

		let directionalLightIntensities = [0.3, 0.2, 0.1];
		if(p.config.directionalLights !== undefined && p.config.directionalLights != null){
			for(let i = 0; i < p.config.directionalLights.length; i++){
				if(i < 3) {
					let directionalLightConfig = p.config.directionalLights[i];
					directionalLightIntensities[i] = directionalLightConfig.intensity;
				}
			}
		}

		let lightSize = 100;
    	let lights = [ 
  	    	{
				x: lightSize * 0.2,
				y: lightSize * 1.0,
				z: lightSize * 0.1,
				h: 1.0,
				s: 1.0,
				l: 1.0,
	    		color: 0xFFFFFF,
	    		size: directionalLightIntensities[0],
	    		castShadow: thatS3dViewer.showShadow
	    	},
	    	{
				x: -lightSize * 3.0,
				y: -lightSize * 1.0,
				z: -lightSize * 2.0,
				h:0.1,
				s:1.0,
				l:0.95,
	    		color: 0xFFFFFF,
	    		size: directionalLightIntensities[1],
	    		castShadow: false
	    	},
	    	{
				x: lightSize,
				y: -lightSize,
				z: -lightSize / 2,
				h:0.1,
				s:1.0,
				l:0.95,
	    		color: 0xFFFFFF,
	    		size: directionalLightIntensities[2],
	    		castShadow: false
	    	}
    	];
    	for(let i = 0; i < lights.length; i++) {
    		let light = lights[i];
			let dirLight = new THREE.DirectionalLight(light.color, light.size);
			dirLight.position.set(light.x, light.y, light.z).normalize();
			dirLight.color.setHSL(light.h, light.s, light.l);

			dirLight.shadow.camera.near = 1;
			dirLight.shadow.camera.far = lightSize * 3;
			dirLight.shadow.camera.left = lightSize * 1.5;
			dirLight.shadow.camera.right = -lightSize * 1.5;
			dirLight.shadow.camera.top = lightSize * 1.5;
			dirLight.shadow.camera.bottom = -lightSize * 1.5;
			dirLight.shadow.mapSize.height = 1024 * 8;
			dirLight.shadow.mapSize.width = 1024 * 8;
			dirLight.shadow.bias = -0.001;
			dirLight.castShadow = light.castShadow;
			thatS3dViewer.scene.add(dirLight);
			if (light.castShadow && thatS3dViewer.showCameraHelper) {
				let debug = new THREE.CameraHelper(dirLight.shadow.camera);
				debug.name = "debug" + i;
				thatS3dViewer.scene.add(debug);
			}
			thatS3dViewer.directionalLights.push(dirLight);
    	} 
    };  
    
    //animate
    this.animate = function() {
		if(thatS3dViewer.hasAnimation) {
			TWEEN.update();
		}
    	thatS3dViewer.renderer.render(thatS3dViewer.scene, thatS3dViewer.camera);  
    	thatS3dViewer.renderer2d.render(thatS3dViewer.scene, thatS3dViewer.camera);    
        requestAnimationFrame(thatS3dViewer.animate);
    	thatS3dViewer.doEventFunction("afterAnimate", {});
    };
	
	//复制参数集合
	this.cloneParameters = function(paramUrl){
		let propertyJArray = thatS3dViewer.manager.s3dObject.parametersJson[paramUrl];
		let parameters = {};
		for(let i = 0; i < propertyJArray.length; i++){
			let propertyJson = propertyJArray[i];
			parameters[propertyJson.name] = propertyJson.value;
		}
		return parameters;
	}

	//设置某个构件对象的位置和旋转角度
	this.setObjectPositionRotationById = function(nodeId, useWorldPosition, position, rotation){
		let object3D = thatS3dViewer.getObject3DById(nodeId);
		object3D.userData.unitInfo.useWorldPosition = useWorldPosition;
		object3D.userData.unitInfo.position = [position.x, position.y, position.z];
		object3D.userData.unitInfo.rotation = [rotation.x, rotation.y, rotation.z];
		if(object3D.userData.unitInfo.isServer){
			thatS3dViewer.refreshObject3DPositionRotation(object3D);
		}
		else{
			thatS3dViewer.setObject3DPosition(nodeId, position);
			thatS3dViewer.setObject3DRotation(nodeId, rotation);
		}
	}

	//刷新某个构件对象（由服务器端构造）的位置和旋转角度
	this.refreshObject3DPositionRotation = function(outerObject3D){
		let useWorldPosition = outerObject3D.userData.unitInfo.useWorldPosition;
		let position = outerObject3D.userData.unitInfo.position;
		let rotation = outerObject3D.userData.unitInfo.rotation;
		let object3D = outerObject3D.children[0];
		if(useWorldPosition){
			object3D.position.set(0, 0, 0);
			outerObject3D.position.set(0, 0, 0);
			outerObject3D.rotation.set(0, 0, 0);
		}
		else {
			outerObject3D.position.set(position[0], position[1], position[2]);
			outerObject3D.rotation.set(rotation[0], rotation[1], rotation[2]);
		}

		thatS3dViewer.setTagPositionAndRotation(outerObject3D.userData.unitInfo.id);
	}
    
    //获取与根节点object3D的相对位置
    this.getPositionInRoot = function(object3D){
    	let box = new THREE.Box3().setFromObject(object3D, true);
    	let rootPos = thatS3dViewer.rootObject3D.position;
    	let pos = {
    		x: (box.min.x + box.max.x) / 2 - rootPos.x,
    		y: (box.min.y + box.max.y) / 2 - rootPos.y,
    		z: (box.min.z + box.max.z) / 2 - rootPos.z
    	};
    	return pos;
    }
    
    
    //根节点object3D
    this.getRootObject3D = function(){
    	return thatS3dViewer.rootObject3D;
    }

    //将object3D添加到scene中
    this.addObject3DToScene = function(object3D){
    	object3D.position.set(0, 0, 0);
    	thatS3dViewer.scene.add(object3D);
    }

	//获取Scene的外框
    this.getSceneBoxValues = function(){
		return new THREE.Box3().setFromObject(thatS3dViewer.rootObject3D, true);
    }

    //设置常见视角
    this.setNormalViewport = function(viewport){    	
    	let cameraPosition = thatS3dViewer.camera.position; 
    	    	
    	//取外框盒子，用于计算外框的camera
    	let axisSize = thatS3dViewer.manager.s3dObject.axis.size;
    	let xSize = axisSize.x * 2;
    	let ySize = axisSize.y * 2;
    	let zSize = axisSize.z * 2;
    	let xCenter = 0;
    	let yCenter = 0;
    	let zCenter = 0;
    	let cameraDistance = Math.sqrt(xSize * xSize + ySize * ySize + zSize * zSize);

		let controlConfig = thatS3dViewer.getControlConfig();
		if(cameraDistance === Infinity || cameraDistance < controlConfig.minCameraDistace){
			cameraDistance = controlConfig.minCameraDistace;
		}
    	
    	let position = [];
		let target = [];
		let zoom = 1;
    	switch(viewport){ 
	    	case s3dNormalViewport.init:{
				let cameraInfo = thatS3dViewer.manager.s3dObject.camera;
				position[0] = cameraInfo.position[0];
				position[1] = cameraInfo.position[1];
				position[2] = cameraInfo.position[2];
				target[0] = cameraInfo.target[0];
				target[1] = cameraInfo.target[1];
				target[2] = cameraInfo.target[2];
				zoom = cameraInfo.zoom;
	    		break;
	    	} 
	    	case s3dNormalViewport.top:{
	    		position[0] = xCenter;
	    		position[1] = cameraDistance;
	    		position[2] = zCenter; 
	    		target[0] = xCenter;
	    		target[1] = yCenter / 8;
	    		target[2] = zCenter; 
				zoom = thatS3dViewer.camera.zoom;
	    		break;
	    	} 
	    	default:{
	    		alert("Unknown viewport = " + viewport);
	    	}	    		
    	}   
    	thatS3dViewer.setViewport(target, position, zoom);  
    }
    
    //设置视角
    this.setViewport = function(target, position, zoom) {
		switch (thatS3dViewer.manager.s3dObject.camera.type) {
			case "Perspective": {
				thatS3dViewer.orbitControl.target.set(target[0], target[1], target[2]);
				thatS3dViewer.orbitControl.object.position.set(position[0], position[1], position[2]);
				thatS3dViewer.orbitControl.zoom = zoom;
				thatS3dViewer.orbitControl.update();
				break;
			}
			case "Orthographic":
			default: {
				thatS3dViewer.orbitControl.target0.set(target[0], target[1], target[2]);
				thatS3dViewer.orbitControl.position0.set(position[0], position[1], position[2]);
				thatS3dViewer.orbitControl.zoom0 = zoom;
				thatS3dViewer.orbitControl.reset();
				break;
			}
		}
	}

	//获取当前camera信息
	this.getCurrentCameraInfo = function(){
		let target = thatS3dViewer.orbitControl.target;
		let position = thatS3dViewer.camera.position; 
    	let zoom = thatS3dViewer.camera.zoom;
		return {
			target: [target.x, target.y, target.z],
			position: [position.x, position.y, position.z],
			zoom: zoom
		};
	}
    
    //设置某个object3D为中心
    this.setCenterObject = function(object3D){
		if(object3D != null){
    		let box = new THREE.Box3().setFromObject(object3D, true);
			let target = [(box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2, (box.min.z + box.max.z) / 2];
	    	thatS3dViewer.orbitControl.target0 = new THREE.Vector3(target[0], target[1], target[2]);
	    	thatS3dViewer.orbitControl.reset();
    	}     
    }

    //设置显示状态
    this.setObject3DsVisible = function(ids, isVisible){ 
    	let selectedObject3Ds = []; 
    	for(let i = 0; i < ids.length; i++){
    		let id = ids[i];
    		let object3D = thatS3dViewer.allObject3DMap[id];
    		selectedObject3Ds.push(object3D);
    	} 
    	for(let i = 0; i < selectedObject3Ds.length; i++){
    		let object3D = selectedObject3Ds[i];
    		object3D.visible = isVisible;
    	}
    }

	//根据id获取object3d
	this.getObject3DById = function(id){
		return thatS3dViewer.allObject3DMap[id];
	}

	//获取box3
	this.getObject3DBox3 = function (object3D){
		return new THREE.Box3().setFromObject(object3D, true);
	}

	//根据name获取object3d
	this.getObject3DByName = function(name){
		for(let id in thatS3dViewer.allObject3DMap){
			let object3D = thatS3dViewer.allObject3DMap[id];
			if(object3D.userData.unitInfo.name === name){
				return object3D;
			}
		}
		return null;
	}

	//根据code获取object3d
	this.getObject3DsByCode = function(code){
		let object3Ds = [];
		for(let id in thatS3dViewer.allObject3DMap){
			let object3D = thatS3dViewer.allObject3DMap[id];
			if(object3D.userData.unitInfo.code === code){
				object3Ds.push(object3D);
			}
		}
		return object3Ds;
	}

	//根据code前缀获取object3d
	this.getObject3DsByCodePrefix = function(codePrefix){
		let object3Ds = [];
		for(let id in thatS3dViewer.allObject3DMap){
			let object3D = thatS3dViewer.allObject3DMap[id];
			if(object3D.userData.unitInfo.code.startsWith(codePrefix)){
				object3Ds.push(object3D);
			}
		}
		return object3Ds;
	}

	//双击图层构件
	this.dblClickUserLayerObject = function(layerObject3D, ev, mousePosition, intersects){
		//交给外部处理，暂不实现内置响应方法
		thatS3dViewer.doEventFunction("onDblClickLayerObject", {
			layerObject3D: layerObject3D,
			event: ev,
			mousePosition: mousePosition,
			intersects: intersects
		});
	}

	//在图层构件上mouseDown
	this.mouseDownUserLayerObject = function(layerObject3D, ev, mousePosition, intersects){
		//交给外部处理，暂不实现内置响应方法
		thatS3dViewer.doEventFunction("onMouseDownUserLayerObject", {
			layerObject3D: layerObject3D,
			event: ev,
			mousePosition: mousePosition,
			intersects: intersects
		});
	}

	//在图层构件上mouseUp
	this.mouseUpUserLayerObject = function(layerObject3D, ev, mousePosition, intersects){
		//交给外部处理，暂不实现内置响应方法
		thatS3dViewer.doEventFunction("onMouseUpUserLayerObject", {
			layerObject3D: layerObject3D,
			event: ev,
			mousePosition: mousePosition,
			intersects: intersects
		});
	}

	//在图层构件上做鼠标移动时
	this.mouseMoveUserLayerObject = function(layerObject3D, ev, position, intersects){
		//交给外部处理，暂不实现内置响应方法
		thatS3dViewer.doEventFunction("onMouseMoveUserLayerObject", {
			layerObject3D: layerObject3D,
			event: ev,
			position: position,
			intersects: intersects
		});
	}

	//单击图层构件
	this.clickUserLayerObject = function(layerObject3D, ev, mousePosition, intersects){
		//交给外部处理，暂不实现内置响应方法
		thatS3dViewer.doEventFunction("onClickLayerObject", {
			layerObject3D: layerObject3D,
			event: ev,
			mousePosition: mousePosition,
			intersects: intersects
		});
	}

	//双击构件
	this.dblClickS3dObject = function(object3D, ev){
		//也执行选中
		if(object3D == null){
			//单选时，点到了没有object的地方，那么取消所有选中
			thatS3dViewer.cancelSelectObject3Ds();
		}
		else {
			if (thatS3dViewer.selectedObject3Ds.length !== 1) {
				thatS3dViewer.cancelSelectObject3Ds();
				thatS3dViewer.selectObject3D(object3D);
			} else {
				if (!object3D.isSelected) {
					thatS3dViewer.cancelSelectObject3Ds();
					thatS3dViewer.selectObject3D(object3D);
				}
			}
		}

		//交给外部处理，暂不实现内置响应方法
		thatS3dViewer.doEventFunction("onDblClickObject", {
			object3D: object3D
		});
	}

	//点击
	this.clickS3dObject = function(object3D, ev){
    	if(object3D == null){
    		if(ev.ctrlKey){
    			//多选时，点到了没有object的地方，不做处理
    		}
    		else{
    			//单选时，点到了没有object的地方，那么取消所有选中
    			thatS3dViewer.cancelSelectObject3Ds(); 
    		}
    	}
    	else {
    		if(ev.ctrlKey){
	        	if(object3D.isSelected){ 
	        		thatS3dViewer.unSelectObject3D(object3D);
	        	}
	        	else{ 
	        		thatS3dViewer.selectObject3D(object3D);
	        	}
	    	}
	    	else{
				if(thatS3dViewer.selectedObject3Ds.length !== 1){
					thatS3dViewer.cancelSelectObject3Ds(); 
					thatS3dViewer.selectObject3D(object3D);
				}
				else{
					if(!object3D.isSelected){ 
						thatS3dViewer.cancelSelectObject3Ds(); 
						thatS3dViewer.selectObject3D(object3D);
					}
				}

	    	}
    	}

		//交给外部处理
		thatS3dViewer.doEventFunction("onClickObject", {
			object3D: object3D
		});
    } 

	//获取选中的object3ds的ids
	this.getSelectedObject3DIds = function(){
		let object3Ds = thatS3dViewer.selectedObject3Ds;
		let ids = [];
		if(object3Ds != null){
			for(let i = 0; i < object3Ds.length; i++){
				let object3D = object3Ds[i];
				ids.push(object3D.userData.unitInfo.id);
			}
		}
		return ids;
	}
    
    //选中object3D
    this.selectObject3D = function(object3D){ 
		if(thatS3dViewer.canSelectObject3D){
			thatS3dViewer.addToSelectedObject3Ds(object3D);
			thatS3dViewer.highlightObject3D(object3D);
		} 
    }

    //取消选中object3D
    this.unSelectObject3D = function(object3D){
    	thatS3dViewer.removeFromSelectedObject3Ds(object3D);
    	thatS3dViewer.unHighlightObject3D(object3D);
    }

	//获取构件对象信息（与s3d里的node对应）
	this.getNodeJson = function(nodeId){
		let object3D = thatS3dViewer.allObject3DMap[nodeId];
		let unitInfo = object3D.userData.unitInfo;
		let name = unitInfo.name;
		let parameters = unitInfo.parameters;
		let materials = unitInfo.materials;
		return {
			id: nodeId,
			name: name,
			code: unitInfo.code,
			versionNum: unitInfo.versionNum,
			isServer: unitInfo.isServer,
			useWorldPosition: unitInfo.useWorldPosition,
			position: object3D.position,
			rotation: object3D.rotation,
			parameters: parameters,
			materials: materials
		};
	}
    
	//当选中对象的集合变化时
    this.onSelectChanged = function(selectedObject3Ds){
    	let nodeJArray = [];
    	for(let i = 0; i < selectedObject3Ds.length; i++){
    		let object3D = selectedObject3Ds[i];
    		let nodeId = object3D.userData.unitInfo.id;
			let nodeJson = thatS3dViewer.getNodeJson(nodeId);
    		nodeJArray.push(nodeJson);
    	}
		thatS3dViewer.doEventFunction("onSelectChanged", {
    		selectedCount: nodeJArray.length,
    		nodeJArray: nodeJArray
    	});
    }

	//根据构件对象的id，复制描述其的json
	this.cloneJsonById = function(id){
		let object3D = thatS3dViewer.getObject3DById(id);
		let parameters = {};
		for(let paramName in object3D.userData.unitInfo.parameters){
			parameters[paramName] = {
				value: object3D.userData.unitInfo.parameters[paramName].value
			};
		}
		let materials = {};
		for(let name in object3D.userData.unitInfo.materials){
			materials[name] = object3D.userData.unitInfo.materials[name];
		}
		let position = [object3D.position.x, object3D.position.y, object3D.position.z];
		let rotation = [object3D.rotation.x, object3D.rotation.y, object3D.rotation.z];
		let customInfo = thatS3dViewer.cloneCustomInfoJson(object3D.userData.unitInfo.customInfo);
		return {
			id: object3D.userData.unitInfo.id,
			name: object3D.userData.unitInfo.name,
			code: object3D.userData.unitInfo.code,
			versionNum: object3D.userData.unitInfo.versionNum,
			position: position,
			rotation: rotation,
			parameters: parameters,
			materials: materials,
			customInfo: customInfo,
			isServer: object3D.userData.unitInfo.isServer
		};
	}

	//复制用户自定义的json
	this.cloneCustomInfoJson = function(json){
		if(!json){
			return null;
		}
		else if(json instanceof Array){
			return thatS3dViewer.cloneCustomInfoJArray(json);
		}
		else{
			let childType = typeof json;
			if(childType === "object"){
				let newJson = {};		
				for(let propertyName in json){
					let childObj = json[propertyName];
					newJson[propertyName] = thatS3dViewer.cloneCustomInfoJson(childObj);
				}
				return newJson;
			}
			else{
				return json;
			}
		}
	}

	//批量复制用户自定义的json
	this.cloneCustomInfoJArray = function(jArray){
		let newArray = [];
		for(let i = 0; i < jArray.length; i++){
			let json = jArray[i];
			newArray.push(thatS3dViewer.cloneCustomInfoJson(json));
		}
		return newArray;
	} 

    //取消选中所有
    this.cancelSelectObject3Ds = function(){
    	let object3Ds = thatS3dViewer.selectedObject3Ds;
    	for(let i = 0; i < object3Ds.length; i++){
    		let object3D = object3Ds[i];
        	thatS3dViewer.unHighlightObject3D(object3D);
    	}
    	thatS3dViewer.selectedObject3Ds = [];
    	thatS3dViewer.onSelectChanged(thatS3dViewer.selectedObject3Ds);
    }

    //批量多选
    this.selectObject3Ds = function(ids){
    	thatS3dViewer.cancelSelectObject3Ds();
    	let selectedObject3Ds = []; 
    	for(let i = 0; i < ids.length; i++){
    		let id = ids[i];
    		let object3D = thatS3dViewer.allObject3DMap[id];
    		selectedObject3Ds.push(object3D);
    	}
		thatS3dViewer.selectedObject3Ds = selectedObject3Ds;
    	for(let i = 0; i < selectedObject3Ds.length; i++){
    		let object3D = selectedObject3Ds[i];
        	thatS3dViewer.highlightObject3D(object3D);
    	}
    	thatS3dViewer.onSelectChanged(thatS3dViewer.selectedObject3Ds);
    }

    //添加到选中列表
    this.addToSelectedObject3Ds = function(object3D){
    	let needAdd = true;
    	for(let i = 0; i < thatS3dViewer.selectedObject3Ds.length; i++){
    		let obj3D = thatS3dViewer.selectedObject3Ds[i];
    		if(obj3D === object3D){
    			needAdd = false;
    		}
    	}
    	if(needAdd){
    		thatS3dViewer.selectedObject3Ds.push(object3D);
        	thatS3dViewer.onSelectChanged(thatS3dViewer.selectedObject3Ds);
    	}
    } 

    //从到选中列表移除
    this.removeFromSelectedObject3Ds = function(object3D){
    	let needRemove = false;
    	let object3Ds = [];
    	for(let i = 0; i < thatS3dViewer.selectedObject3Ds.length; i++){
    		let obj3D = thatS3dViewer.selectedObject3Ds[i];
    		if(obj3D !== object3D){
    			object3Ds.push(obj3D);
    		}
    		else{
    			needRemove = true;
    		}
    	}
    	if(needRemove){
        	thatS3dViewer.selectedObject3Ds = object3Ds;
        	thatS3dViewer.onSelectChanged(thatS3dViewer.selectedObject3Ds);
    	}
    } 
    
    //高亮显示某个object3D
    this.highlightObject3D = function(object3D){
    	object3D.isSelected = true;
		if(object3D.children.length === 0){
			if(object3D.isUnitLine){
				thatS3dViewer.highlightMesh(object3D);
			}
			else {
				thatS3dViewer.highlightMesh(object3D);
				thatS3dViewer.addMeshEdges(object3D);
			}
    	}
    	else {
			//包含子构件，但是父构件也有几何的情况
			if(object3D.geometry != null){
				thatS3dViewer.highlightMesh(object3D);
			}

			//递归设置子构件
    		for(let i = 0; i < object3D.children.length; i++){
    			let childObject3D = object3D.children[i];
        		thatS3dViewer.highlightObject3D(childObject3D);
    		}
    	}    
    }

    //高亮显示某个mesh
    this.highlightMesh = function(mesh) {
		if (mesh.originalMaterial == null) {
			mesh.originalMaterial = mesh.material;
		}
		if(mesh.isResourceBoxLine){
			mesh.material = thatS3dViewer.hightLightResourceBoxEdgeMaterial;
		}
		if(mesh.isUnitLine){
			mesh.material = thatS3dViewer.hightLightLineMaterial;
		}
		else {
			if (mesh.material !== null && mesh.material !== undefined) {
				if (mesh.material.length > 0) {
					let hightLightMaterials = [];
					for (let i = 0; i < mesh.originalMaterial.length; i++) {
						hightLightMaterials.push(thatS3dViewer.hightLightMaterial);
					}
					mesh.material = hightLightMaterials;
				} else {
					mesh.material = thatS3dViewer.hightLightMaterial;
				}
			}
		}
	}
    
    //取消高亮显示
    this.unHighlightObject3D = function(object3D){
    	object3D.isSelected = false;
		if(object3D.children.length === 0){
			if(object3D.isUnitLine){
				thatS3dViewer.unHighlightMesh(object3D);
			}
			else {
				thatS3dViewer.unHighlightMesh(object3D);
				thatS3dViewer.removeMeshEdges(object3D);
			}
    	}
    	else {
			//包含子构件，但是父构件也有几何的情况
			if(object3D.geometry != null){
				thatS3dViewer.unHighlightMesh(object3D);
			}

    		for(let i = 0; i < object3D.children.length; i++){
    			let childObject3D = object3D.children[i];
        		thatS3dViewer.unHighlightObject3D(childObject3D);
    		}
    	}
    }

    //取消高亮显示某个mesh
    this.unHighlightMesh = function(mesh) {
		mesh.material = mesh.originalMaterial;

		//下一级，例如线
		for (let i = 0; i < mesh.children.length; i++) {
			let meshChild = mesh.children[i];
			if (meshChild.isUnitLine) {
				meshChild.material = meshChild.originalMaterial;
			}
		}
	}

    //添加边框
    this.addMeshEdges = function(mesh){
		if(mesh.hasGeometry && !mesh.isResourceBoxLine){
			let edges= new THREE.EdgesGeometry(mesh.geometry, 25);
			let line = new THREE.LineSegments(edges, thatS3dViewer.edgeMaterial);
			line.isEdgeLine = true; 
			mesh.add(line); 
		}
    }

    //移除边框
    this.removeMeshEdges = function(mesh){   
		if(mesh.hasGeometry && !mesh.isResourceBoxLine){
			let edgeLines = [];
			for(let i = 0; i < mesh.children.length; i++){
				let line = mesh.children[i];
				if(line.isEdgeLine){
					edgeLines.push(line);
				} 
			}
			for(let i = 0; i < edgeLines.length; i++){
				let edgeLine = edgeLines[i];
				mesh.remove(edgeLine);
			} 
		}
    }
    
    //判定是否为弹出窗口
    this.checkIsPopContainer = function(targetElement){
    	let tempElement = $(targetElement);
    	while(tempElement.length !== 0 && !$(tempElement).hasClass("viewInnerContainer")){
    		if($(tempElement).hasClass("zlpPopBox") || $(tempElement).hasClass("zlpOpacityBox")){
    			return true;
    		}
    		else{
        		tempElement = $(tempElement[0]).parent();
    		}    		
    	}
    	return !$(tempElement).hasClass("viewInnerContainer");
    }

    //鼠标按下
    this.onMouseDown = function(ev) { 
    	let targetElement = ev.target;
		let mousePosition = {
			x: ev.clientX - thatS3dViewer.containerPos.x,
			y: ev.clientY - thatS3dViewer.containerPos.y
		};
		thatS3dViewer.mouseDownPosition = mousePosition;

		switch(thatS3dViewer.status){
			case s3dViewerStatus.draw: {
				ev.preventDefault();
				let intersects = thatS3dViewer.getSceneIntersects(mousePosition);
				if(ev.button === 0){
					let layerObject3D = thatS3dViewer.getUserLayerObject3DByRaycaster(intersects);
					if(layerObject3D != null) {
						thatS3dViewer.mouseDownUserLayerObject(layerObject3D, ev, mousePosition, intersects);
					}
				}
			}
			default:{
				break;
			}
		}
    };

	//找到它属于哪个s3d object3D
	this.getS3dObject3D = function(checkObj){
		if(!checkObj.isEdgeLine){
			while(checkObj.type !== "Scene"){
				if(checkObj.parent.isS3dRootObject && checkObj.visible){
					return checkObj;
				}
				else{
					checkObj = checkObj.parent;
				}
			}
		}
		return null;
	}

	//使用射线获取s3d object
	this.getS3dObject3DByRaycaster = function(intersects) {
		if (intersects.length > 0) {
			let index = 0;
			while(index < intersects.length){
				let object3D = thatS3dViewer.getS3dObject3D(intersects[index].object);
				if(object3D != null){
					return object3D;
				}
				else{
					index++;
				}
			}
		}
		return null;
	};

	//找到是否点击了图层
	this.getUserLayerObject3D = function(checkObj){
		if(!checkObj.isEdgeLine){
			while(checkObj.type !== "Scene"){
				if(checkObj.isUserLayer && checkObj.visible){
					return checkObj;
				}
				else{
					checkObj = checkObj.parent;
				}
			}
		}
		return null;
	}

	//使用射线获取用户图层
	this.getUserLayerObject3DByRaycaster = function(intersects) {
		if (intersects.length > 0) {
			let index = 0;
			while(index < intersects.length){
				let object3D = thatS3dViewer.getUserLayerObject3D(intersects[index].object);
				if(object3D != null){
					return object3D;
				}
				else{
					index++;
				}
			}
		}
		return null;
	};

	//使用射线获取groundPlane的坐标
    this.getPositionInGroundPlaneByRaycaster = function(intersects) {  
        if (intersects.length > 0) {
        	let index = 0;
        	while(index < intersects.length){ 
				let intersect = intersects[index];
				if(intersect.object.isGroundPlane){
					return intersect.point;
				} 
        		else{
        			index++;
        		}
        	} 
        }
        return null;
    }; 
	
	//射线穿过构件，获取其穿过的3D点坐标
    this.getIntersect3DPointByRaycaster = function(intersects, excludedObject3D){ 
    	let intersect = null;
        if (intersects.length > 0) {
        	let index = 0;
        	while(index < intersects.length){
            	let intersect = intersects[index];
				if(excludedObject3D === intersect.object){
        			index++;
				}
				else if(intersect.object.isEdgeLine){
        			index++;
				}
            	else if(intersect.object.isGroundPlane){
					return {
    		    		x: intersect.point.x,
    		    		y: 0,
    		    		z: intersect.point.z
    		    	};
        		}
            	else if(thatS3dViewer.checkIsUnitObject3D(intersect.object)){
					return {
    		    		x: intersect.point.x,
    		    		y: intersect.point.y,
    		    		z: intersect.point.z
    		    	};
        		}  
        		else{
        			index++;
        		}
        	}  
        }       
    	return null; 
    }
    
	//判定是否为构件对象
    this.checkIsUnitObject3D = function(object){
    	let tempObject = object;
    	while(tempObject.type !== "Scene"){
    		if(tempObject.userData.unitInfo != null){
    			return true;
    		}
    		else{
    			tempObject = tempObject.parent;
    		}
    	}
    	return false;
    }  

	//更改状态
	this.changeStatus = function(p){
		if(thatS3dViewer.endStatus(thatS3dViewer.status)){
			return thatS3dViewer.beginStatus(p.status, p.statusData);
		}
		else{
			thatS3dViewer.manager.statusBar.refreshStatusText({
				status: thatS3dViewer.status,
				message: "无法结束当前状态"
			});
			return false;
		}
	}

	//结束状态
	this.endStatus = function(status){
		switch(status){
			case s3dViewerStatus.normalView: {
				return true;
			}
			case s3dViewerStatus.draw: {
				return true;
			}
			case s3dViewerStatus.specialView: {
				return true;
			}
			case s3dViewerStatus.disable: {
				return true;
			}
			case s3dViewerStatus.edit: {
				return true;
			}
			case s3dViewerStatus.add: {
				thatS3dViewer.manager.adder.cancelWaitAddComponent();
				return true;
			}
			case s3dViewerStatus.pop: {
				//目前仅这一种情况，后续增加弹出窗口类型后，这里要修改
				thatS3dViewer.manager.materialPicker.cancelPick();
				return true;
			}
			case s3dViewerStatus.selectPoints:{
				thatS3dViewer.manager.pointSelector.cancelPlacePoints();
				return true;
			}
			default:{
				return false;
			}
		}
	}

	//开始状态
	this.beginStatus = function(status, statusData){
		thatS3dViewer.status = status;
		thatS3dViewer.statusData = statusData;
		switch(status){
			case s3dViewerStatus.normalView: {
				thatS3dViewer.manager.statusBar.refreshStatusText({
					status: status,
					message: "转为常规状态"
				});
				break;
			}
			case s3dViewerStatus.draw: {
				thatS3dViewer.manager.statusBar.refreshStatusText({
					status: status,
					message: "转为绘制状态"
				});
				break;
			}
			case s3dViewerStatus.specialView: {
				thatS3dViewer.manager.statusBar.refreshStatusText({
					status: status,
					message: "转为特殊状态"
				});
				break;
			}
			case s3dViewerStatus.disable: {
				thatS3dViewer.manager.statusBar.refreshStatusText({
					status: status,
					message: "转为禁用状态"
				});
				break;
			}
			case s3dViewerStatus.edit: {
				thatS3dViewer.manager.statusBar.refreshStatusText({
					status: status,
					message: "正在编辑"
				});
				break;
			}
			case s3dViewerStatus.add: {
				thatS3dViewer.manager.statusBar.refreshStatusText({
					status: status,
					message: "准备新增 " + statusData.componentName + " (" + statusData.componentCode + ")"
				});
				$("#" + thatS3dViewer.containerId).find(".viewContainer").focus();
				break;
			}
			case s3dViewerStatus.selectPoints: {
				thatS3dViewer.manager.statusBar.refreshStatusText({
					status: status,
					message: "正在使用选点功能"
				});
				$("#" + thatS3dViewer.containerId).find(".viewContainer").focus();
				break;
			}
			case s3dViewerStatus.pop: {
				thatS3dViewer.manager.statusBar.refreshStatusText({
					status: status,
					message: "正在弹出窗口"
				}); 
				break;
			}
		}
		return true;
	}
    
    //按下按键
    this.onKeyDown = function(ev) {
		switch(thatS3dViewer.status){
			case s3dViewerStatus.normalView:{
				thatS3dViewer.onKeyDownInStatusNormal(ev);
				break;
			}
			case s3dViewerStatus.draw:{
				thatS3dViewer.onKeyDownInStatusDraw(ev);
				break;
			}
			case s3dViewerStatus.specialView:{
				break;
			}
			case s3dViewerStatus.disable:{
				break;
			}
			case s3dViewerStatus.edit:{
				break;
			}
			case s3dViewerStatus.pop:{
				break;
			}
			case s3dViewerStatus.add:{
				thatS3dViewer.onKeyDownInStatusAdd(ev);
				break;
			}
			case s3dViewerStatus.selectPoints:{
				thatS3dViewer.onKeyDownInStatusSelectPoints(ev);
				break;
			}
		}
	}

	//当添加状态时，按下键盘按键
	this.onKeyDownInStatusAdd = function(ev){
		switch(ev.keyCode){			
			case 27:{ // esc 
				thatS3dViewer.changeStatus({
					status: s3dViewerStatus.normalView
				}); 
				break;
			} 
		}
	}

	//当复制状态时，按下键盘按键
	this.onKeyDownInStatusCopy = function(ev){
		switch(ev.keyCode){			
			case 27:{ // esc 
				thatS3dViewer.changeStatus({
					status: s3dViewerStatus.normalView
				}); 
				break;
			} 
		}
	}

	//当选点状态时，按下键盘按键
	this.onKeyDownInStatusSelectPoints = function(ev){
		switch(ev.keyCode){			
			case 27:{ // esc 
				thatS3dViewer.manager.pointSelector.cancelPlacePoints();
				thatS3dViewer.changeStatus({
					status: s3dViewerStatus.normalView
				}); 
				break;
			}
			case 13:{ //enter
				thatS3dViewer.manager.pointSelector.endPlacePoints();
				thatS3dViewer.changeStatus({
					status: s3dViewerStatus.normalView
				}); 
				break;
			}
		}
	}

	//当普通状态时，按下键盘按键
	this.onKeyDownInStatusNormal = function(ev){
		switch(ev.keyCode){
			case 27:{ // esc 取消选择
				thatS3dViewer.cancelSelectObject3Ds();
				break;
			}
			case 46:{ //delete 删除
				if(thatS3dViewer.selectedObject3Ds.length > 0){
					let nodeIds = [];
					for(let i = 0; i < thatS3dViewer.selectedObject3Ds.length; i++){
						let selectedObject3D = thatS3dViewer.selectedObject3Ds[i];
						nodeIds.push(selectedObject3D.userData.unitInfo.id);
					}

					thatS3dViewer.removeObjects(nodeIds, true);
				}
				break;
			}
			case 70:{ //f 居中
				let object3D = thatS3dViewer.selectedObject3Ds.length === 0 ? null : thatS3dViewer.selectedObject3Ds[0];
				thatS3dViewer.setCenterObject(object3D);
				break;
			}
			case 67:{ //c 复制
				if(ev.ctrlKey && thatS3dViewer.selectedObject3Ds.length !== 0){
					thatS3dViewer.manager.copier.copy({object3Ds: thatS3dViewer.selectedObject3Ds});
				}
				break;
			}
			case 86:{ //v 复制
				if(ev.ctrlKey){
					thatS3dViewer.manager.copier.paste({});
				}
				break;
			}
		}
	}

	//在图层上keydown时
	this.onKeyDownInStatusDraw = function(ev){
		thatS3dViewer.doEventFunction("onKeyDownUserLayerObject", {
			event: ev
		});
	}

	//根据构件对象id，设置其为3D展示的中心点
    this.setCenterObjectById = function(id){
		let object3D = thatS3dViewer.getObject3DById(id);
		if(object3D != null){
			thatS3dViewer.setCenterObject(object3D);
		}
	}
	
	//将某个构件对象设置为3D展示的中心点
    this.setCenterObject = function(object3D){
		let oldTarget = thatS3dViewer.orbitControl.target0;
		let target;
		if(object3D != null){
    		let box = new THREE.Box3().setFromObject(object3D, true);
			target = [(box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2, (box.min.z + box.max.z) / 2];

    	}
		else{
			let axisInfo = thatS3dViewer.manager.s3dObject.axis;
			target = [0, axisInfo.size.y / 2, 0];
		}
		/*
		let cameraPosition = [thatS3dViewer.orbitControl.object.position.x + target[0] - oldTarget.x,
			thatS3dViewer.orbitControl.object.position.y + target[1] - oldTarget.y,
			thatS3dViewer.orbitControl.object.position.z + target[2] - oldTarget.z];
		 */
		//俯视
		let cameraPosition = [target[0],
			thatS3dViewer.orbitControl.object.position.y + target[1] - oldTarget.y,
			target[2]];
		thatS3dViewer.setViewport(target, cameraPosition, thatS3dViewer.camera.zoom);  
    }

	this.getSceneIntersects = function (mousePosition){
		let mouse = new THREE.Vector2(); //二维向量
		let viewInnerContainer = $("#" + thatS3dViewer.containerId).find(".viewInnerContainer")[0];
		mouse.x = (mousePosition.x / $(viewInnerContainer).width()) * 2 - 1;
		mouse.y = -(mousePosition.y / $(viewInnerContainer).height()) * 2 + 1;
		thatS3dViewer.raycaster.setFromCamera(mouse, thatS3dViewer.camera);
		return thatS3dViewer.raycaster.intersectObjects(thatS3dViewer.scene.children, true); //将遍历数组内的所有模型的子类，也就是深度遍历
	}

	//鼠标移动
	this.onMouseMove = function(ev){
		let mousePosition = {
			x: ev.clientX - thatS3dViewer.containerPos.x,
			y: ev.clientY - thatS3dViewer.containerPos.y
		};

		switch(thatS3dViewer.status){
			case s3dViewerStatus.selectPoints:{				  
				ev.preventDefault();
				let intersects = thatS3dViewer.getSceneIntersects(mousePosition);
				thatS3dViewer.manager.pointSelector.movePlacePoint({intersects: intersects, shiftKey: ev.shiftKey});
 				break;
			}
			case s3dViewerStatus.draw: {
				ev.preventDefault();
				let intersects = thatS3dViewer.getSceneIntersects(mousePosition);
				let layerObject3D = thatS3dViewer.getUserLayerObject3DByRaycaster(intersects);
				thatS3dViewer.mouseMoveUserLayerObject(layerObject3D, ev, {
					from: thatS3dViewer.mouseLastMovePosition,
					to: mousePosition
				}, intersects);
				break;
			}
			default:{
				break;
			}
		}
		thatS3dViewer.mouseLastMovePosition = mousePosition;
	}
    
    //鼠标抬起
    this.onMouseUp = function(ev) {
		//判断是否为双击
		let lastMouseUpLog = thatS3dViewer.eventLogMap["mouseUp"];
		let mouseUpLog = {
			eventType: "mosueUp",
			time: new Date(),
			position: {
				x: ev.clientX - thatS3dViewer.containerPos.x,
				y: ev.clientY - thatS3dViewer.containerPos.y
			}
		};
		thatS3dViewer.eventLogMap["mouseUp"] = mouseUpLog;
		let isDoubleClick = lastMouseUpLog != null
			&& (mouseUpLog.time - lastMouseUpLog.time < 400)
			&& (Math.abs(mouseUpLog.position.x - lastMouseUpLog.position.x) < 2 && Math.abs(mouseUpLog.position.y - lastMouseUpLog.position.y) < 2 );
		if (isDoubleClick) {
			//处理双击
			thatS3dViewer.onMouseDblClick(ev);
		} else {
			//处理单击
			thatS3dViewer.onMouseClick(ev);
		}
	}

	//双击时
	this.onMouseDblClick = function (ev){
		let mouseUpPosition = {
			x: ev.clientX - thatS3dViewer.containerPos.x,
			y: ev.clientY - thatS3dViewer.containerPos.y
		};
		if(ev.button === 0 || ev.button === 2){
			if(Math.abs(mouseUpPosition.x - thatS3dViewer.mouseDownPosition.x) < 2 && Math.abs(mouseUpPosition.y - thatS3dViewer.mouseDownPosition.y) < 2 ){
				ev.preventDefault();

				let intersects = thatS3dViewer.getSceneIntersects(mouseUpPosition);
				switch(thatS3dViewer.status){
					case s3dViewerStatus.normalView: {
						let object3D = thatS3dViewer.getS3dObject3DByRaycaster(intersects);
						thatS3dViewer.dblClickS3dObject(object3D, ev);
						break;
					}
					case s3dViewerStatus.draw: {
						let layerObject3D = thatS3dViewer.getUserLayerObject3DByRaycaster(intersects);
						thatS3dViewer.mouseUpUserLayerObject(layerObject3D, ev, mouseUpPosition, intersects);
						thatS3dViewer.dblClickUserLayerObject(layerObject3D, ev, mouseUpPosition, intersects);
						break;
					}
					default:{
						break;
					}
				}

				thatS3dViewer.doEventFunction("onMouseDblClick", {
					x: mouseUpPosition.x,
					y: mouseUpPosition.y,
					intersects: intersects
				});
			}
		}
	}

	//单击后
	this.onMouseClick = function (ev){
        if (thatS3dViewer.mouseDownPosition != null) {
        	let mouseUpPosition = {
        		x: ev.clientX - thatS3dViewer.containerPos.x,
        		y: ev.clientY - thatS3dViewer.containerPos.y
        	};
        	if(ev.button === 0 || ev.button === 2){
	        	if(Math.abs(mouseUpPosition.x - thatS3dViewer.mouseDownPosition.x) < 2 && Math.abs(mouseUpPosition.y - thatS3dViewer.mouseDownPosition.y) < 2 ){
	                ev.preventDefault();
	                let intersects = thatS3dViewer.getSceneIntersects(mouseUpPosition);
					switch(thatS3dViewer.status){
						case s3dViewerStatus.normalView: {
							let object3D = thatS3dViewer.getS3dObject3DByRaycaster(intersects, ev);
							thatS3dViewer.clickS3dObject(object3D, ev);
							break;
						}
						case s3dViewerStatus.draw: {
							let layerObject3D = thatS3dViewer.getUserLayerObject3DByRaycaster(intersects);
							thatS3dViewer.clickUserLayerObject(layerObject3D, ev, mouseUpPosition, intersects);
							break;
						}
						case s3dViewerStatus.add:{
							let position = thatS3dViewer.getPositionInGroundPlaneByRaycaster(intersects);
							if(position != null){
								let parameters = {};
								for(let paramName in thatS3dViewer.statusData.componentJson.parameters){
									let param = thatS3dViewer.statusData.componentJson.parameters[paramName];
									parameters[paramName] = {
										value: param.defaultValue,
										isGeo: param.isGeo
									};
								}

								let groupNodeId = thatS3dViewer.manager.treeEditor.getCurrentGroupNodeId();

								//先取消选中当前的对象，再添加
								thatS3dViewer.cancelSelectObject3Ds();
								if(thatS3dViewer.statusData.isServer){
									thatS3dViewer.addNewServerObject({
										position: [position.x, position.y, position.z],
										rotation: [0, 0, 0],
										name: thatS3dViewer.statusData.componentName,
										code: thatS3dViewer.statusData.componentCode,
										versionNum: thatS3dViewer.statusData.versionNum,
										isOnGround: true,
										needSelectAfterAdd: true,
										groupNodeId: groupNodeId,
										parameters: parameters
									});
								}
								else {
									thatS3dViewer.addNewLocalObject({
										position: [position.x, position.y, position.z],
										rotation: [0, 0, 0],
										name: thatS3dViewer.statusData.componentName,
										code: thatS3dViewer.statusData.componentCode,
										versionNum: thatS3dViewer.statusData.versionNum,
										isOnGround: true,
										needSelectAfterAdd: true,
										groupNodeId: groupNodeId,
										parameters: parameters
									});
								}
							}
							break;
						}
						case s3dViewerStatus.selectPoints:{
							thatS3dViewer.manager.pointSelector.drawLimit3DPoints({intersects: intersects});
							break;
						}
						case s3dViewerStatus.pop:{
							//不做处理
							break;
						}
		                default:{
		                	throw "暂未支持 status = " + thatS3dViewer.status;
		                }
	                }

	                thatS3dViewer.doEventFunction("onMouseClick", {
        				x: ev.clientX - thatS3dViewer.containerPos.x,
        				y: ev.clientY - thatS3dViewer.containerPos.y,
	    	       		intersects: intersects
	    	       	});
	        	}
	        	else{
	        		//移动后，松开鼠标左键，为后续做拖拽操作扩展用
	        	}
        	}
        }
    }

	//使用参数化方式调用服务器端，添加新构件
	this.addNewServerObject = function(p){
		let countInfo = {
			all: 1,
			serverAll: 1,
			serverSucceed: 0,
			localAll: 0,
			localSucceed: 0
		};
		let newIdAndName = thatS3dViewer.getNewUnitIdAndName(p.name, p.name);
		if(p.id == null){
			p.id = newIdAndName.id;
		}
		p.name = newIdAndName.name;
		thatS3dViewer.manager.serverObjectCreator.createObject3Ds([{
			id: p.id,
			code: p.code,
			versionNum: p.versionNum,
			name: p.name,
			position: p.position,
			rotation: p.rotation,
			isOnGround: p.isOnGround,
			groupNodeId: p.groupNodeId,
			parameters: p.parameters,
			needSelectAfterAdd: p.needSelectAfterAdd,
			userData: p.userData
		}], thatS3dViewer.afterAddNewObject, countInfo);
	}

	//使用参数化方式调用本地服务，添加新构件
	this.addNewLocalObject = function(p){
		let countInfo = {
			all: 1,
			serverAll: 1,
			serverSucceed: 0,
			localAll: 0,
			localSucceed: 0
		};
		let newIdAndName = thatS3dViewer.getNewUnitIdAndName(p.name, p.name);
		if(p.id == null){
			p.id = newIdAndName.id;
		}
		p.name = newIdAndName.name;
		thatS3dViewer.manager.localObjectCreator.createObject3Ds([{
			id: p.id,
			code: p.code,
			versionNum: p.versionNum,
			name: p.name,
			position: p.position,
			rotation: p.rotation,
			isOnGround: p.isOnGround,
			groupNodeId: p.groupNodeId,
			parameters: p.parameters,
			materials: p.materials,
			needSelectAfterAdd: p.needSelectAfterAdd,
			userData: p.userData
		}], thatS3dViewer.afterAddNewObject, countInfo);
	}

	//使用参数化方式调用服务器端，批量添加新构件
	this.addNewServerObjects = function(nodeJsons, afterAddNewObject){
		let newNodeJsons = [];
		let excludedNames = [];
		for(let i = 0; i < nodeJsons.length; i++){
			let nodeJson = nodeJsons[i];
			let componentInfo = thatS3dViewer.manager.serverObjectCreator.getComponentInfo(nodeJson.code, nodeJson.versionNum);
			let newIdAndName = thatS3dViewer.getNewUnitIdAndName(componentInfo.name + "_1", componentInfo.name, excludedNames);

			if(nodeJson.id == null){
				nodeJson.id = newIdAndName.id;
			}
			if(nodeJson.name == null){
				nodeJson.name = newIdAndName.name;
				excludedNames.push(newIdAndName.name);
			}

			newNodeJsons.push({
				id: nodeJson.id,
				code: nodeJson.code,
				versionNum: nodeJson.versionNum,
				name: nodeJson.name,
				position: nodeJson.position,
				rotation: nodeJson.rotation,
				parameters: nodeJson.parameters,
				groupNodeId: nodeJson.groupNodeId,
				useWorldPosition: nodeJson.useWorldPosition,
				isOnGround: nodeJson.isOnGround,
				needSelectAfterAdd: nodeJson.needSelectAfterAdd
			});
		}
		let countInfo = {
			all: newNodeJsons.length,
			serverAll: newNodeJsons.length,
			serverSucceed: 0,
			localAll: 0,
			localSucceed: 0
		};
		thatS3dViewer.manager.serverObjectCreator.createObject3Ds(newNodeJsons, afterAddNewObject == null ? thatS3dViewer.afterAddNewObject : afterAddNewObject, countInfo);
	}

	//使用参数化方式调用本地服务，批量添加新构件
	this.addNewLocalObjects = function(nodeJsons, afterAddNewObject){
		let newNodeJsons = [];
		let excludedNames = [];
		for(let i = 0; i < nodeJsons.length; i++){
			let nodeJson = nodeJsons[i];
			let componentInfo = thatS3dViewer.manager.localObjectCreator.getComponentInfo(nodeJson.code, nodeJson.versionNum);
			let newIdAndName = thatS3dViewer.getNewUnitIdAndName(componentInfo.name + "_1", componentInfo.name, excludedNames);
			if(nodeJson.id == null){
				nodeJson.id = newIdAndName.id;
			}
			if(nodeJson.name == null){
				nodeJson.name = newIdAndName.name;
				excludedNames.push(newIdAndName.name);
			}

			newNodeJsons.push({
				id: nodeJson.id,
				code: nodeJson.code,
				versionNum: nodeJson.versionNum,
				name: nodeJson.name,
				position: nodeJson.position,
				rotation: nodeJson.rotation,
				parameters: nodeJson.parameters,
				materials: nodeJson.materials,
				groupNodeId: nodeJson.groupNodeId,
				useWorldPosition: nodeJson.useWorldPosition,
				isOnGround: nodeJson.isOnGround,
				needSelectAfterAdd: nodeJson.needSelectAfterAdd,
				userData: nodeJson.userData
			});
		}
		let countInfo = {
			all: newNodeJsons.length,
			serverAll: 0,
			serverSucceed: 0,
			localAll: newNodeJsons.length,
			localSucceed: 0,
			internalAll: 0,
			internalSucceed: 0
		};
		thatS3dViewer.manager.localObjectCreator.createObject3Ds(newNodeJsons, afterAddNewObject == null ? thatS3dViewer.afterAddNewObject : afterAddNewObject, countInfo);
	}

	//静默添加构件
	this.addNewObjectsInSilence = function(nodeJsons){
		let serverUnitJsons = [];
		let serverExcludedNames = [];
		let localUnitJsons = [];
		let localExcludedNames = [];
		for(let nodeId in nodeJsons){
			let nodeJson = nodeJsons[nodeId];
			if(nodeJson.isServer){
				let componentInfo = thatS3dViewer.manager.serverObjectCreator.getComponentInfo(nodeJson.code, nodeJson.versionNum);
				let defaultName = nodeJson.name != null && nodeJson.name.length > 0 ? nodeJson.name : componentInfo.name;
				let newIdAndName = thatS3dViewer.getNewUnitIdAndName(defaultName + "_1", defaultName, serverExcludedNames);
				let parameters = {};
				for(let paramName in componentInfo.parameters){
					let param = componentInfo.parameters[paramName];
					if(param != null){
						parameters[paramName] = {
							value: nodeJson.parameters[paramName] === undefined ? null : nodeJson.parameters[paramName].value,
							isGeo: param.isGeo
						};
					}
				}
				serverUnitJsons.push({
					id: nodeJson.id,
					code: nodeJson.code,
					versionNum: nodeJson.versionNum,
					name: newIdAndName.name,
					position: nodeJson.position,
					rotation: nodeJson.rotation,
					parameters: nodeJson.parameters,
					groupNodeId: nodeJson.groupNodeId,
					useWorldPosition: nodeJson.useWorldPosition,
					isOnGround: nodeJson.isOnGround,
					needSelectAfterAdd: nodeJson.needSelectAfterAdd
				});
			}
			else{
				let componentInfo = thatS3dViewer.manager.localObjectCreator.getComponentInfo(nodeJson.code, nodeJson.versionNum);
				let defaultName = nodeJson.name != null && nodeJson.name.length > 0 ? nodeJson.name : componentInfo.name;
				let newIdAndName = thatS3dViewer.getNewUnitIdAndName(defaultName + "_1", defaultName, localExcludedNames);
				let parameters = {};
				for(let paramName in componentInfo.parameters){
					let param = componentInfo.parameters[paramName];
					if(param != null){
						parameters[paramName] = {
							value: nodeJson.parameters[paramName] === undefined ? null : nodeJson.parameters[paramName].value,
							isGeo: param.isGeo
						};
					}
				}
				localUnitJsons.push({
					id: nodeJson.id,
					code: nodeJson.code,
					versionNum: nodeJson.versionNum,
					name: newIdAndName.name,
					position: nodeJson.position,
					rotation: nodeJson.rotation,
					parameters: nodeJson.parameters,
					materials: nodeJson.materials,
					groupNodeId: nodeJson.groupNodeId,
					isOnGround: nodeJson.isOnGround,
					needSelectAfterAdd: nodeJson.needSelectAfterAdd
				});
			}
		}
		let countInfo = {
			all: serverUnitJsons.length + localUnitJsons.length,
			serverAll: serverUnitJsons.length,
			serverSucceed: 0,
			localAll: localUnitJsons.length,
			localSucceed: 0
		};
		if(serverUnitJsons.length > 0) {
			thatS3dViewer.manager.serverObjectCreator.createObject3Ds(serverUnitJsons, thatS3dViewer.afterAddNewObjectInSilence, countInfo);
		}

		if(localUnitJsons.length > 0) {
			thatS3dViewer.manager.localObjectCreator.createObject3Ds(localUnitJsons, thatS3dViewer.afterAddNewObjectInSilence, countInfo);
		}
	}

	//创建新的构件名称和id
	this.getNewUnitIdAndName = function(defaultName, namePrefix, excludedNames){
		let i = 0;
		let newName = defaultName;
		let hasSameName = true;
		while(hasSameName){
			hasSameName = false;
			for(let id in thatS3dViewer.allObject3DMap){
				let object3D = thatS3dViewer.allObject3DMap[id];
				if(object3D.userData.unitInfo.name === newName){
					hasSameName = true;
					break;
				}
			}
			if(excludedNames != null){
				for(let j = 0; j < excludedNames.length; j++){
					if(excludedNames[j] === newName){
						hasSameName = true;
						break;
					}
				}
			}
			if(hasSameName){
				i++;
				newName = namePrefix + "_" + i;
			}
		}
		return {
			id: cmnPcr.createGuid(),
			name: newName
		};
	}

	//使用服务器端添加新构件后
	this.afterAddNewObject = function(p){
		let unitInfo =  p.object3D.userData.unitInfo;
		let id = unitInfo.id;

		//开始添加到undo list
		thatS3dViewer.beginAddToUndoList(s3dOperateType.add, [id]);

		thatS3dViewer.allObject3DMap[id] = p.object3D;
		thatS3dViewer.rootObject3D.add(p.object3D);
		thatS3dViewer.addTagObjectToScene(p.object3D);

		thatS3dViewer.refreshObject3DPositionRotation(p.object3D);

		thatS3dViewer.doEventFunction("afterAddNewObject", {
			nodeJson: {
				id: id,
				name: unitInfo.name,
				code: unitInfo.code,
				parameters: unitInfo.parameters
			},
			groupNodeId: p.otherInfo.groupNodeId,
			userData: p.otherInfo.userData
		});

		//结束添加到undo list
		thatS3dViewer.endAddToUndoList(s3dViewerStatus.add, [id]);


		if(p.succeedCount === p.objectCount){
			thatS3dViewer.changeStatus({
				status: s3dViewerStatus.normalView
			});
		}

		if(p.otherInfo.needSelectAfterAdd){
			thatS3dViewer.cancelSelectObject3Ds();
			thatS3dViewer.selectObject3D(p.object3D);
		}
	}

	//使用服务器端添加新构件后
	this.afterAddNewObjectInSilence = function(p){
		let id = p.object3D.userData.unitInfo.id;
		thatS3dViewer.allObject3DMap[id] = p.object3D;
		thatS3dViewer.rootObject3D.add(p.object3D);
		thatS3dViewer.addTagObjectToScene(p.object3D);
		thatS3dViewer.refreshObject3DPositionRotation(p.object3D);
	}

	//开启添加到undo list
	this.beginAddToUndoList = function(operateType, nodeIds, otherInfo){
		let tree = null;	
		let nodeJsons = {};
		let doOtherInfo = {};
		switch(operateType){
			case s3dOperateType.transform:{
				for(let i = 0; i < nodeIds.length; i++){
					let nodeId = nodeIds[i];
					nodeJsons[nodeId] = thatS3dViewer.cloneJsonById(nodeId);
				}
				break;
			}
			case s3dOperateType.add:{
				tree = thatS3dViewer.manager.treeEditor.getTreeJson();				
				for(let i = 0; i < nodeIds.length; i++){
					let nodeId = nodeIds[i];
					nodeJsons[nodeId] = {};
				}
				break;
			}
			case s3dOperateType.delete:{
				tree = thatS3dViewer.manager.treeEditor.getTreeJson();
				for(let i = 0; i < nodeIds.length; i++){
					let nodeId = nodeIds[i];
					nodeJsons[nodeId] = thatS3dViewer.cloneJsonById(nodeId);
				}
				break;
			}
			case s3dOperateType.splitLocal:{
				tree = thatS3dViewer.manager.treeEditor.getTreeJson();
				doOtherInfo.sourceNodeJsons = {};
				doOtherInfo.sourceNodeJsons[otherInfo.sourceNodeId] = thatS3dViewer.cloneJsonById(otherInfo.sourceNodeId);
				for(let i = 0; i < nodeIds.length; i++){
					let nodeId = nodeIds[i];
					nodeJsons[nodeId] = {};
				}
				break;
			}
		} 
		thatS3dViewer.manager.statusBar.beginAddToUndoList({
			operateType: operateType,
			tree: tree,
			nodeJsons: nodeJsons,
			otherInfo: doOtherInfo
		});
	}

	//结束添加到undo list
	this.endAddToUndoList = function(operateType, nodeIds, otherInfo){
		let tree = null;	
		let nodeJsons = {};
		let doOtherInfo = {};
		switch(operateType){
			case s3dOperateType.transform:{
				for(let i = 0; i < nodeIds.length; i++){
					let nodeId = nodeIds[i];
					nodeJsons[nodeId] = thatS3dViewer.cloneJsonById(nodeId);
				}
				break;
			}
			case s3dOperateType.add:{
				tree = thatS3dViewer.manager.treeEditor.getTreeJson();				
				for(let i = 0; i < nodeIds.length; i++){
					let nodeId = nodeIds[i];
					nodeJsons[nodeId] = thatS3dViewer.cloneJsonById(nodeId);
				}
				break;
			}
			case s3dOperateType.delete:{
				tree = thatS3dViewer.manager.treeEditor.getTreeJson();
				for(let i = 0; i < nodeIds.length; i++){
					let nodeId = nodeIds[i];
					nodeJsons[nodeId] = {};
				}
				break;
			}
			case s3dOperateType.splitLocal:{
				tree = thatS3dViewer.manager.treeEditor.getTreeJson();
				for(let i = 0; i < nodeIds.length; i++){
					let nodeId = nodeIds[i];
					nodeJsons[nodeId] = thatS3dViewer.cloneJsonById(nodeId);
				}
				doOtherInfo.sourceNodeJsons = {};
				doOtherInfo.sourceNodeJsons[otherInfo.sourceNodeId] = {
					id: otherInfo.sourceNodeId
				};
				break;
			}
		} 
		thatS3dViewer.manager.statusBar.endAddToUndoList({
			operateType: operateType,
			tree: tree,
			nodeJsons: nodeJsons,
			otherInfo: doOtherInfo
		});
	}

	//批量静默删除构件对象
	this.removeObjectsInSilence = function(nodeJsons){
		for(let nodeId in nodeJsons){
			thatS3dViewer.removeObjectByIdInSilence(nodeId); 
		}
	}

	//静默删除构件对象
	this.removeObjectByIdInSilence = function(nodeId){
		let nodeObject3D = thatS3dViewer.allObject3DMap[nodeId];
		let nodeName = nodeObject3D.userData.unitInfo.name;
		delete thatS3dViewer.allObject3DMap[nodeId];
		let nodeData = nodeObject3D.userData.unitInfo;
		let parentObject3D = nodeObject3D.parent;
		parentObject3D.remove(nodeObject3D);
	}

	//批量删除构件对象
	this.removeObjects = function(nodeIds, hasConfirm, ignoreUndo){
		if(nodeIds.length === 1){
			thatS3dViewer.removeObject(nodeIds[0], hasConfirm);
		}
		else{
			if(!hasConfirm || msgBox.confirm({info: "已选择 " + nodeIds.length + " 个图元, 确定删除吗?"})){

				thatS3dViewer.cancelSelectObject3Ds();
				
				thatS3dViewer.doEventFunction("beforeRemoveObjects", {
					nodeIds: nodeIds
				}); 

				if(!ignoreUndo) {
					//开始添加到undo list
					thatS3dViewer.beginAddToUndoList(s3dOperateType.delete, nodeIds);
				}

				for(let i = 0; i < nodeIds.length; i++){
					thatS3dViewer.removeObjectById(nodeIds[i]);
				}

				if(!ignoreUndo) {
					//结束添加到undo list
					thatS3dViewer.endAddToUndoList(s3dOperateType.delete, nodeIds);
				}
			}
		}
	}

	//删除构件对象
	this.removeObject = function(nodeId, hasConfirm, ignoreUndo){
		let nodeObject3D = thatS3dViewer.allObject3DMap[nodeId];
		let nodeName = nodeObject3D.userData.unitInfo.name;
		if(!hasConfirm || msgBox.confirm({info: "确定删除 " + nodeName + " 吗?"})){

			thatS3dViewer.cancelSelectObject3Ds();
			
			thatS3dViewer.doEventFunction("beforeRemoveObjects", {
				nodeIds: [nodeId]
			});

			if(!ignoreUndo) {
				//开始添加到undo list
				thatS3dViewer.beginAddToUndoList(s3dOperateType.delete, [nodeId]);
			}

			thatS3dViewer.removeObjectById(nodeId);

			if(!ignoreUndo) {
				//结束添加到undo list
				thatS3dViewer.endAddToUndoList(s3dOperateType.delete, [nodeId]);
			}
		}
	}

	//删除构件对象
	this.removeObjectById = function(nodeId){
		let nodeObject3D = thatS3dViewer.allObject3DMap[nodeId];
		let nodeName = nodeObject3D.userData.unitInfo.name;
		delete thatS3dViewer.allObject3DMap[nodeId];
		let nodeData = nodeObject3D.userData.unitInfo;
		let parentObject3D = nodeObject3D.parent;

		thatS3dViewer.removeTagObjectToScene(nodeObject3D);
		parentObject3D.remove(nodeObject3D);
		
		thatS3dViewer.doEventFunction("afterRemoveObject", {
			nodeId: nodeData.id
		}); 
	}

	//检查是否重名
	this.checkUnitName = function(name){
		let existedName = false;
		for(let id in thatS3dViewer.allObject3DMap){
			let obj3D = thatS3dViewer.allObject3DMap[id];
			if(obj3D.userData.unitInfo.name === name){
				existedName = true;
				break;
			}
		}
		return existedName;
	}

	//更改object3D名称（唯一标识）
	this.changeObject3DName = function(nodeId, newName){
		let object3D = thatS3dViewer.allObject3DMap[nodeId];
		object3D.userData.unitInfo.name = newName;
	}

	//设置object3D位置
	this.setObject3DPosition = function(nodeId, newPosition){
		let object3D = thatS3dViewer.allObject3DMap[nodeId];
		object3D.position.set(newPosition.x, newPosition.y, newPosition.z);
	}

	//设置object3D旋转角度
	this.setObject3DRotation = function(nodeId, newRotation){
		let object3D = thatS3dViewer.allObject3DMap[nodeId];
		object3D.rotation.set(newRotation.x, newRotation.y, newRotation.z);
	}

	//设置图元属性值
	this.setObjectParameters = function(nodeId, newParameters) {
		let object3D = thatS3dViewer.getObject3DById(nodeId);
		let nodeData = object3D.userData.unitInfo;
		let componentInfo = null;
		if (nodeData.isServer) {
			componentInfo = thatS3dViewer.manager.serverObjectCreator.getComponentInfo(nodeData.code, nodeData.versionNum);
		} else {
			componentInfo = thatS3dViewer.manager.localObjectCreator.getComponentInfo(nodeData.code, nodeData.versionNum);
		}
		let parameters = {};
		for (let paramName in newParameters) {
			let comParam = componentInfo.parameters[paramName];
			parameters[paramName] = {
				value: newParameters[paramName] === undefined || newParameters[paramName] === null ? null : newParameters[paramName].value,
				isGeo: comParam.isGeo
			};
		}

		if (nodeData.isServer) {
			thatS3dViewer.rebuildServerObject({
				id: nodeData.id,
				code: nodeData.code,
				versionNum: nodeData.versionNum,
				name: nodeData.name,
				position: [object3D.position.x, object3D.position.y, object3D.position.z],
				rotation: [object3D.rotation.x, object3D.rotation.y, object3D.rotation.z],
				useWorldPosition: nodeData.useWorldPosition,
				parameters: parameters,
				needSelectAfterAdd: object3D.isSelected
			});
		}
		else {
			thatS3dViewer.rebuildLocalObject({
				id: nodeData.id,
				code: nodeData.code,
				versionNum: nodeData.versionNum,
				name: nodeData.name,
				position: [object3D.position.x, object3D.position.y, object3D.position.z],
				rotation: [object3D.rotation.x, object3D.rotation.y, object3D.rotation.z],
				useWorldPosition: nodeData.useWorldPosition,
				parameters: parameters,
				materials: nodeData.materials,
				customInfo: nodeData.customInfo,
				needSelectAfterAdd: object3D.isSelected
			});
		}
	}

	//获取scene信息
	this.getSceneInfo = function(){
		let info = {
			meshCount: 0, 
			faceCount: 0
		};
		for(let id in thatS3dViewer.allObject3DMap){
			let object = thatS3dViewer.allObject3DMap[id];
			thatS3dViewer.getObject3DInfo(object, info);
		}
		return info;
	}

	//重新构造图元
	this.rebuildServerObject = function(p){
		thatS3dViewer.rebuildServerObjects([{
			id: p.id,
			code: p.code,
			versionNum: p.versionNum,
			name: p.name,
			position: p.position,
			rotation: p.rotation,
			useWorldPosition: p.useWorldPosition,
			parameters: p.parameters,
			needSelectAfterAdd: p.needSelectAfterAdd
		}], thatS3dViewer.afterRebuildObject);
	}

	//重新构造图元
	this.rebuildLocalObject = function(p){
		thatS3dViewer.rebuildLocalObjects([{
			id: p.id,
			code: p.code,
			versionNum: p.versionNum,
			name: p.name,
			position: p.position,
			rotation: p.rotation,
			parameters: p.parameters,
			materials: p.materials,
			needSelectAfterAdd: p.needSelectAfterAdd
		}], thatS3dViewer.afterRebuildObject);
	}

	this.rebuildServerObjects = function(ps, afterRebuildObject){
		for(let i = 0; i < ps.length; i++){
			let p = ps[i];
			thatS3dViewer.beforeRebuildObject(p);
		}
		let countInfo = {
			all: ps.length,
			serverAll: ps.length,
			serverSucceed: 0,
			localAll: 0,
			localSucceed: 0,
			internalAll: 0,
			internalSucceed: 0
		};
		thatS3dViewer.manager.serverObjectCreator.createObject3Ds(ps, afterRebuildObject, countInfo);
	}

	this.rebuildLocalObjects = function(ps, afterRebuildObject){
		for(let i = 0; i < ps.length; i++){
			let p = ps[i];
			thatS3dViewer.beforeRebuildObject(p);
		}
		let countInfo = {
			all: ps.length,
			serverAll: 0,
			serverSucceed: 0,
			localAll: ps.length,
			localSucceed: 0,
			internalAll: 0,
			internalSucceed: 0
		};
		thatS3dViewer.manager.localObjectCreator.createObject3Ds(ps, afterRebuildObject, countInfo);
	}

	//重新构造构件对象前
	this.beforeRebuildObject = function(p){
		thatS3dViewer.doEventFunction("beforeRebuildObject", p);
	}

 	//重新构造构件对象后
	this.afterRebuildObject = function(p){
		let unitInfo = p.object3D.userData.unitInfo;
		let id = unitInfo.id;
		let name = unitInfo.name;
		let parameters = unitInfo.parameters;

		let oldObject3D = thatS3dViewer.allObject3DMap[id];
		thatS3dViewer.removeTagObjectToScene(oldObject3D);
		thatS3dViewer.rootObject3D.remove(oldObject3D);
		thatS3dViewer.allObject3DMap[id] = p.object3D;

		thatS3dViewer.refreshObject3DPositionRotation(p.object3D, p.isOnGround);
		thatS3dViewer.rootObject3D.add(p.object3D);
		thatS3dViewer.addTagObjectToScene(p.object3D);


		//调用propertyEditor的endAddToUndoList，结束记录到undo list
		thatS3dViewer.manager.propertyEditor.endAddToUndoList(id, parameters);

		thatS3dViewer.doEventFunction("afterRebuildObject", {
			nodeJson: {
				id: id,
				name: name,
				parameters: parameters
			}
		});

		thatS3dViewer.manager.statusBar.refreshStatusText({
			status: thatS3dViewer.status,
			message: "已重新构造 " + name
		});

		if(p.otherInfo.needSelectAfterAdd){
			thatS3dViewer.cancelSelectObject3Ds();
			thatS3dViewer.selectObject3D(p.object3D);
		}
	}

	//获取threejs对象信息（统计用）
	this.getObject3DInfo = function(object, info) {
		// only count in Mesh and Line
		if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
			info.meshCount++
			if (object.geometry instanceof THREE.BufferGeometry) {
				let geom = object.geometry;
				if (geom.index && geom.index.count) {
					info.faceCount += geom.index.count / 3;
				}
			}
		}
		else if(object instanceof THREE.Object3D){
			for(let i = 0; i < object.children.length; i++){
				let childObj = object.children[i];
				thatS3dViewer.getObject3DInfo(childObj, info);
			}
		}
	}
    
	//获取相机信息
    this.getCameraViewport = function(){
    	return {
    		zoom: thatS3dViewer.camera.zoom,
			position: [thatS3dViewer.camera.position.x, thatS3dViewer.camera.position.y, thatS3dViewer.camera.position.z],
			target: [thatS3dViewer.orbitControl.target.x, thatS3dViewer.orbitControl.target.y, thatS3dViewer.orbitControl.target.z],
			rotation: [thatS3dViewer.camera.rotation.x, thatS3dViewer.camera.rotation.y, thatS3dViewer.camera.rotation.z],
			box: thatS3dViewer.getSceneBoxValues()
    	}; 
    }

	this.getResultUnitMap = function (){
		let unitMap = {};
		for(let unitId in thatS3dViewer.allObject3DMap){
			let object3D = thatS3dViewer.allObject3DMap[unitId];
			let unitInfo = object3D.userData.unitInfo;
			let parameters = {};
			for(let paramName in unitInfo.parameters){
				let p = unitInfo.parameters[paramName];
				parameters[paramName] = {
					value: p.value
				};
			}
			let materials = {};
			for(let name in unitInfo.materials){
				let p = unitInfo.materials[name];
				materials[name] = p;
			}
			unitMap[unitId] = {
				id: unitInfo.id,
				code: unitInfo.code,
				versionNum: unitInfo.versionNum,
				name: unitInfo.name,
				position: [object3D.position.x, object3D.position.y, object3D.position.z],
				rotation: [object3D.rotation.x, object3D.rotation.y, object3D.rotation.z],
				parameters: parameters,
				materials: materials,
				userWorldPosition: unitInfo.userWorldPosition,
				isServer: unitInfo.isServer
			};
		}
		return unitMap;
	}

	this.getResultUnitTypeMap = function (){
		let unitTypeMap = {};
		for(let unitId in thatS3dViewer.allObject3DMap) {
			let object3D = thatS3dViewer.allObject3DMap[unitId];
			let unitInfo = object3D.userData.unitInfo;
			if (unitInfo.isServer) {
				let code = unitInfo.code;
				let versionNum = unitInfo.versionNum;
				let key = code + "_" + versionNum;
				if (!unitTypeMap[key]) {
					let componentInfo = thatS3dViewer.manager.serverObjectCreator.getComponentInfo(code, versionNum);
					let parameters = {};
					for (let paramName in componentInfo.parameters) {
						let p = componentInfo.parameters[paramName];
						parameters[paramName] = {
							name: p.name,
							paramType: p.paramType,
							valueType: p.valueType,
							categoryName: p.categoryName,
							groupName: p.groupName,
							indexInGroup: p.indexInGroup,
							isNullable: p.isNullable,
							maxValue: p.maxValue,
							minValue: p.minValue,
							defaultValue: p.defaultValue,
							listValues: p.listValues,
							isGeo: p.isGeo,
						};
					}
					unitTypeMap[key] = {
						code: code,
						versionNum: versionNum,
						name: componentInfo.name,
						parameters: parameters
					};
				}
			}
		}
		return unitTypeMap;
	}

	this.getResultMaterialMap = function (){
		let materialNameMap = {};
		let cacheKeyMap = {};
		for(let unitId in thatS3dViewer.allObject3DMap) {
			let object3D = thatS3dViewer.allObject3DMap[unitId];
			let unitInfo = object3D.userData.unitInfo;
			if (unitInfo.isServer) {
				let componentInfo = thatS3dViewer.manager.serverObjectCreator.getComponentInfo(unitInfo.code, unitInfo.versionNum);
				let parameters = {};
				for(let paramName in unitInfo.parameters){
					if(componentInfo.parameters[paramName]){
						parameters[paramName] = {
							value: unitInfo.parameters[paramName].value,
							isGeo: componentInfo.parameters[paramName].isGeo
						};
					}
				}
				let cacheKey = thatS3dViewer.manager.serverObjectCreator.getCacheKey(unitInfo.code, unitInfo.versionNum, parameters, unitInfo.useWorldPosition, thatS3dViewer.detailLevel, thatS3dViewer.viewLevel);
				if(!cacheKeyMap[cacheKey]) {
					cacheKeyMap[cacheKey] = true;
					let cacheInfo = thatS3dViewer.manager.object3DCache.getRefComponentObject3D(cacheKey);
					thatS3dViewer.manager.serverObjectCreator.getGeoMaterialNames(cacheInfo.geoJson, materialNameMap);
				}
			}
		}
		let materialMap = {};
		for(let materialName in materialNameMap){
			let materialInfo = js3StandardMaterials.getMaterialInfo(materialName);
			if(materialInfo != null){
				materialMap[materialName] = {
					name: materialInfo.name,
					imageAccessoryId: materialInfo.imageName,
					color: materialInfo.color,
					opacity: materialInfo.opacity,
					metalness: materialInfo.metalness
				};
			}
		}
		return materialMap;
	}

	this.removeTagObjectToScene = function (object3D){
		let tagRootObject3D = thatS3dViewer.getTagObject3D(object3D.userData.unitInfo.id);
		thatS3dViewer.rootTag3D.remove(tagRootObject3D);
	}

	this.addTagObjectToScene = function (object3D){
		if(object3D.userData.unitInfo.isServer) {
			//添加新的标注
			let cacheKey = object3D.cacheKey;
			let tag3D = thatS3dViewer.manager.serverObjectCreator.cloneTagRootObject3D(cacheKey);
			thatS3dViewer.rootTag3D.add(tag3D);
			tag3D.userData.unitId = object3D.userData.unitInfo.id;

			//根据object3D获取center造成的偏移量，并设置tagRootObject3D的偏移量
			let centerShift = object3D.centerShift;

			for (let i = 0; i < tag3D.children.length; i++) {
				let tagObj = tag3D.children[i];
				let x = tagObj.position.x + centerShift.x;
				let y = tagObj.position.y + centerShift.y;
				let z = tagObj.position.z + centerShift.z;
				tagObj.position.set(x, y, z);
			}

			//按照object3D设置tagRootObject3D的位置和旋转角度
			thatS3dViewer.setTagPositionAndRotation(tag3D.userData.unitId);
		}
	}

	this.getTagObject3D = function (unitId){
		for(let i = 0; i < thatS3dViewer.rootTag3D.children.length; i++){
			let obj3D = thatS3dViewer.rootTag3D.children[i];
			if(obj3D.isTag && obj3D.userData.unitId === unitId){
				return obj3D;
			}
		}
		return null;
	}

	//根据object3D设置tagRootObject3D的位置 added by ls 20221208
	this.setTagPositionAndRotation = function(unitId){
		let object3D = thatS3dViewer.getObject3DById(unitId);
		let tag3D = thatS3dViewer.getTagObject3D(unitId);
		if(tag3D != null) {
			tag3D.position.set(object3D.position.x, object3D.position.y, object3D.position.z);
			tag3D.rotation.set(object3D.rotation.x, object3D.rotation.y, object3D.rotation.z);
		}
	}
}
export default S3dViewer