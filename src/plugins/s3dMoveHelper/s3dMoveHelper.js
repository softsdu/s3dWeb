import * as THREE from "three";
import {TransformControls} from "transformControls";
import {cmnPcr, s3dOperateType} from "../../commonjs/common/static.js"
import "./s3dMoveHelper.css"

//S3dWeb 移动helper
let S3dMoveHelper = function (){
	//当前对象
	const thatS3dMoveHelper = this;

	//containerId
	this.containerId = null;

	this.manager = null;

	this.transformControl = null;

	//吸附目标
	this.attachLines = null;

	//吸附线配置
	this.attachHelpLines = {
		color: 0xFF6600, //吸附辅助帮助线的颜色
		opacity: 1,
		xLine: null, 
		zLine: null,
		yPlane: null
	};

	//吸附距离
	this.attachDistance = 0.01;

	//当前构件对象
	this.currentObject3D = null;

	//Y轴零点的离地高度（为了防止面重合）
	this.gridYZero = -0.0001;

	//正在改变位置
	this.dragging = false;

	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dMoveHelper.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dMoveHelper.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dMoveHelper.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	}
	this.doEventFunctionWithResult = function(eventName, p){
		let allFuncs = thatS3dMoveHelper.eventFunctions[eventName]; 
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				if(!func(p)){
					return false;
				}
			}
		} 
		return true;
	}

	//初始化
	this.init = function(p){
		thatS3dMoveHelper.containerId = p.containerId;
		thatS3dMoveHelper.manager = p.manager;
		thatS3dMoveHelper.initControl();
		thatS3dMoveHelper.initAttachHelpLines();


		thatS3dMoveHelper.manager.viewer.orbitControl.addEventListener("zoom", thatS3dMoveHelper.onZoom);

		//绑定事件
        if(p.config.onObject3DPositionChanged != null){
        	thatS3dMoveHelper.addEventFunction("onObject3DPositionChanged", p.config.onObject3DPositionChanged); 
        } 
        if(p.config.onDragTransformControl != null){
        	thatS3dMoveHelper.addEventFunction("onDragTransformControl", p.config.onDragTransformControl); 
        } 
        if(p.config.afterObject3DPositionChanged != null){
        	thatS3dMoveHelper.addEventFunction("afterObject3DPositionChanged", p.config.afterObject3DPositionChanged); 
        } 
	}


	this.onZoom = function(ev){
		if(ev.type === "zoom"){
			thatS3dMoveHelper.autoRefreshAttachDistance();
		}
	}

	//自动更新吸附距离，动态的，根据界面宽度计算
	this.autoRefreshAttachDistance = function(){
		let leftPosition = new THREE.Vector2(-0.99, 0);
		let rightPosition = new THREE.Vector2(0.99, 0);

		//计算显示出来groundPlane宽度
		let leftIntersectPoint = thatS3dMoveHelper.getGroundPlaneRaycasterPoint(leftPosition);
		let rightIntersectPoint = thatS3dMoveHelper.getGroundPlaneRaycasterPoint(rightPosition);
		if(leftIntersectPoint != null && rightIntersectPoint != null){
			let viewWidth = Math.sqrt((rightIntersectPoint.x - leftIntersectPoint.x) * (rightIntersectPoint.x - leftIntersectPoint.x)
				+ (rightIntersectPoint.y - leftIntersectPoint.y) * (rightIntersectPoint.y - leftIntersectPoint.y)
				+ (rightIntersectPoint.z - leftIntersectPoint.z) * (rightIntersectPoint.z - leftIntersectPoint.z));
			//更改吸附距离
			thatS3dMoveHelper.attachDistance = viewWidth / 50;

			//更改点击感应的范围 added by ls 20231204
			thatS3dMoveHelper.manager.viewer.raycaster.params.Line.threshold = thatS3dMoveHelper.attachDistance / 10;
		}
		else{
			//更改吸附距离
			let axisInfo = thatS3dMoveHelper.manager.s3dObject.axis;
			thatS3dMoveHelper.attachDistance = axisInfo.gridSpace / 10;

			//更改点击感应的范围 added by ls 20231204
			thatS3dMoveHelper.manager.viewer.raycaster.params.Line.threshold = thatS3dMoveHelper.attachDistance / 10;
		}
	}

	//计算射线与groundPlane的交点
	this.getGroundPlaneRaycasterPoint = function(position){
		let distanceRaycaster = new THREE.Raycaster();
		distanceRaycaster.setFromCamera(position, thatS3dMoveHelper.manager.viewer.camera);
		let intersects = distanceRaycaster.intersectObjects(thatS3dMoveHelper.manager.viewer.scene.children, true);
		for(let i = 0; i < intersects.length; i++){
			let intersect = intersects[i];
			if(intersect.object.isGroundPlane){
				return intersect.point;
			}
		}
		return null;
	}

	//初始化控制器
	this.initControl = function(p){
		if(thatS3dMoveHelper.transformControl != null){
			thatS3dMoveHelper.detach();
		}
		let control = new TransformControls(thatS3dMoveHelper.manager.viewer.camera, thatS3dMoveHelper.manager.viewer.renderer2d.domElement);
		control.addEventListener("mouseUp", thatS3dMoveHelper.transformMouseUp); 
		control.addEventListener("objectChange", thatS3dMoveHelper.transformDrag); 
		control.addEventListener("attachChange", thatS3dMoveHelper.transformAttachChange);  
		control.addEventListener('dragging-changed', thatS3dMoveHelper.draggingChanged);
		thatS3dMoveHelper.manager.viewer.scene.add(control);
		thatS3dMoveHelper.transformControl = control;
	}

	//当拖拽时
	this.draggingChanged = function(event){
		thatS3dMoveHelper.manager.viewer.orbitControl.enabled = ! event.value;
	}

	//初始化吸附线
    this.initAttachHelpLines = function(){
		thatS3dMoveHelper.addDrawHelpLine();
		thatS3dMoveHelper.addAttachHelpLine();

		let axisInfo = thatS3dMoveHelper.manager.s3dObject.axis;
		 
		let geometryX = new THREE.BufferGeometry();
		let positionsX = [];  
		positionsX.push(0, thatS3dMoveHelper.gridYZero, -axisInfo.size.z * 5/ 4);
		positionsX.push(0, thatS3dMoveHelper.gridYZero, axisInfo.size.z * 5 / 4);
		geometryX.setAttribute("position", new THREE.Float32BufferAttribute(positionsX, 3)); 
		let lineX = new THREE.Line(geometryX, new THREE.LineBasicMaterial({
			color: thatS3dMoveHelper.attachHelpLines.color,
			transparent: true,
			opacity: thatS3dMoveHelper.attachHelpLines.opacity,
			depthTest: false
		}));
		lineX.isAttachHelpLine = true;
		lineX.visible = false;
		thatS3dMoveHelper.attachHelpLines.xLine = lineX;
		thatS3dMoveHelper.manager.viewer.scene.add(lineX);
		
		let geometryZ = new THREE.BufferGeometry(); 
		let positionsZ = [];  
		positionsZ.push(-axisInfo.size.x * 5 / 4, thatS3dMoveHelper.gridYZero, 0);
		positionsZ.push(axisInfo.size.x * 5 / 4, thatS3dMoveHelper.gridYZero, 0);
		geometryZ.setAttribute("position", new THREE.Float32BufferAttribute(positionsZ, 3)); 
		let lineZ = new THREE.Line(geometryZ, new THREE.LineBasicMaterial({
			color: thatS3dMoveHelper.attachHelpLines.color,
			transparent: true,
			opacity: thatS3dMoveHelper.attachHelpLines.opacity,
			depthTest: false
		}));
		lineZ.isAttachHelpLine = true;
		lineZ.visible = false;
		thatS3dMoveHelper.attachHelpLines.zLine = lineZ;
		thatS3dMoveHelper.manager.viewer.scene.add(lineZ);

		let sizeX = axisInfo.size.x * 2;
		let sizeZ = axisInfo.size.z * 2;
		let xCenter = 0;
		let zCenter = 0;
		let planeGeometryY = new THREE.PlaneGeometry(sizeX, sizeZ);
		let planeMaterialY = new THREE.MeshLambertMaterial({
			color: thatS3dMoveHelper.attachHelpLines.color, 
			transparent: true, 
			opacity: thatS3dMoveHelper.attachHelpLines.opacity
		});
		let planeY = new THREE.Mesh(planeGeometryY, planeMaterialY);
		planeY.rotation.x = -0.5 * Math.PI; 
		planeY.position.y = thatS3dMoveHelper.gridYZero;
		planeY.position.x = xCenter;
		planeY.position.z = zCenter;
		planeY.isAttachHelpPlane = true;
		planeY.visible = false;
		thatS3dMoveHelper.manager.viewer.scene.add(planeY);
		thatS3dMoveHelper.attachHelpLines.yPlane = planeY;  
    } 
     
	//绑定控制器
    this.attach = function(unitJArray){
		if(unitJArray == null || unitJArray.length === 0 || unitJArray.length > 1){
			thatS3dMoveHelper.detach();
		}
		else{
			thatS3dMoveHelper.attachLines = null;
			let unitJson = unitJArray[0];			
			let object3D = thatS3dMoveHelper.manager.viewer.getObject3DById(unitJson.id);
			thatS3dMoveHelper.currentObject3D = object3D;
			if(!object3D.userData.unitInfo.useWorldPosition) {
				thatS3dMoveHelper.transformControl.attach(object3D);
				thatS3dMoveHelper.refreshTransformControl();
			}
		}
    } 
    
	//结束绑定控制器
    this.detach = function(){  
		thatS3dMoveHelper.transformControl.detach(); 
    } 

	//静默移动
	this.transformObjectInSilence = function(nodeJsons){
		for(let nodeId in nodeJsons){
			let nodeJson = nodeJsons[nodeId];
			let object3D = thatS3dMoveHelper.manager.viewer.getObject3DById(nodeId);
			object3D.position.set(nodeJson.position[0], nodeJson.position[1], nodeJson.position[2]);
			object3D.rotation.set(nodeJson.rotation[0], nodeJson.rotation[1], nodeJson.rotation[2]);

			thatS3dMoveHelper.manager.viewer.setTagPositionAndRotation(object3D.userData.unitInfo.id);
		}
	}
	
	//开启添加到undo list
	this.beginAddToUndoList = function(nodeId){
		let nodeJsons = {};
		nodeJsons[nodeId] = thatS3dMoveHelper.manager.viewer.cloneJsonById(nodeId);
		thatS3dMoveHelper.manager.statusBar.beginAddToUndoList({
			operateType: s3dOperateType.transform,
			nodeJsons: nodeJsons
		});
	}

	//结束添加到undo list
	this.endAddToUndoList = function(nodeId){
		let nodeJsons = {};
		nodeJsons[nodeId] = thatS3dMoveHelper.manager.viewer.cloneJsonById(nodeId);
		thatS3dMoveHelper.manager.statusBar.endAddToUndoList({
			operateType: s3dOperateType.transform,
			nodeJsons: nodeJsons
		});
	}

	//取消开始添加到undo list
	this.cancelAddToUndoList = function(){ 
		thatS3dMoveHelper.manager.statusBar.cancelAddToUndoList({});
	}
	
	//获取构件对象其他信息，中心点、大小、范围坐标等
    this.getOtherPropertyValues = function(object3D){
        let box = new THREE.Box3().setFromObject(object3D, true);
        let lenX = Math.abs(box.min.x - box.max.x);
        let lenY = Math.abs(box.min.y - box.max.y);
        let lenZ = Math.abs(box.min.z - box.max.z);

        let centerX = (box.min.x + box.max.x) / 2; 
        let centerY = (box.min.y + box.max.y) / 2; 
        let centerZ = (box.min.z + box.max.z) / 2; 
    	
    	let otherPropertyValues = {
			lenX: lenX,
			lenY: lenY,
			lenZ: lenZ,
			minX: box.min.x,
			maxX: box.max.x,
			minY: box.min.y,
			maxY: box.max.y,
			minZ: box.min.z,
			maxZ: box.max.z,
			centerX: centerX,
			centerY: centerY,
			centerZ: centerZ
    	};
    	return otherPropertyValues;
    }  
    
    //获取可吸附的点
    this.getAttachLines = function(object3D){    
    	let attachLines = {x: [], y: [], z: []};

    	//所有的图元和辅助点
		for(let id in thatS3dMoveHelper.manager.viewer.allObject3DMap){
			let childObj3D = thatS3dMoveHelper.manager.viewer.allObject3DMap[id]; 
			if(object3D !== childObj3D){
				let pointInfos = thatS3dMoveHelper.getOtherPropertyValues(childObj3D);
				thatS3dMoveHelper.addAttachLineValue(attachLines.x, pointInfos.minX);
				thatS3dMoveHelper.addAttachLineValue(attachLines.x, pointInfos.maxX);
				thatS3dMoveHelper.addAttachLineValue(attachLines.y, pointInfos.minY);
				thatS3dMoveHelper.addAttachLineValue(attachLines.y, pointInfos.maxY);
				thatS3dMoveHelper.addAttachLineValue(attachLines.z, pointInfos.minZ);
				thatS3dMoveHelper.addAttachLineValue(attachLines.z, pointInfos.maxZ);
				
				//位置
				thatS3dMoveHelper.addAttachLineValue(attachLines.x, childObj3D.position.x);
				thatS3dMoveHelper.addAttachLineValue(attachLines.y, childObj3D.position.y);
				thatS3dMoveHelper.addAttachLineValue(attachLines.z, childObj3D.position.z); 
			}
   	 	}

		//Y方向的零点
		thatS3dMoveHelper.addAttachLineValue(attachLines.y, 0);

		//轴网
		let axisInfo = thatS3dMoveHelper.manager.s3dObject.axis;
		let spaceSizeM = axisInfo.gridSpace;
		let minX = -axisInfo.size.x;
		let minZ = -axisInfo.size.z;
		let maxX = axisInfo.size.x;
		let maxZ = axisInfo.size.z;
		let xCount = Math.ceil(Number((maxX / spaceSizeM).toFixed(3)));
		let zCount = Math.ceil(Number((maxZ / spaceSizeM).toFixed(3)));
		for(let i = -xCount; i <= xCount; i++){
			let x = Number((i * spaceSizeM).toFixed(3));
			if(x <= maxX) {
				thatS3dMoveHelper.addAttachLineValue(attachLines.x, x);
			}
		}
		for(let i = -zCount; i <= zCount; i++){
			let z = Number((i * spaceSizeM).toFixed(3));
			if(z <= maxZ) {
				thatS3dMoveHelper.addAttachLineValue(attachLines.z, z);
			}
		}  
		
		return attachLines;
    }

	//添加某个坐标轴的吸附目标
    this.addAttachLineValueByAxis = function(axisName, value){
		let valueArray = thatS3dMoveHelper.attachLines[axisName];
		thatS3dMoveHelper.addAttachLineValue(valueArray, value);
    }

	//添加吸附目标
    this.addAttachLineValue = function(valueArray, value){
    	let newValue = Math.round(value * 1000) / 1000;
    	if(!valueArray.contains(newValue)){
    		valueArray.push(newValue);
    	}
    }
    
	//计算最近的吸附目标
    this.calcNearestCenterValueByAxis = function(axisName, minValue, centerValue, maxValue){
		let valueArray = thatS3dMoveHelper.attachLines[axisName];
		return thatS3dMoveHelper.calcNearestCenterValue(valueArray, minValue, centerValue, maxValue);
    }
    
	//计算最近的目标值
    this.calcNearestCenterValue = function(valueArray, minValue, centerValue, maxValue){
    	let nearestValue = Number.MAX_VALUE; 
    	let helpLineValue = Number.MAX_VALUE;
    	if(minValue != null){
        	for(let i = 0; i < valueArray.length; i++){
        		let value = valueArray[i];
        		if(Math.abs(value - minValue) < Math.abs(nearestValue)){
        			nearestValue = value - minValue; 
        			helpLineValue = value;
        		}
        	}
    	}
    	if(centerValue != null){
	    	for(let i = 0; i < valueArray.length; i++){
	    		let value = valueArray[i];
	    		if(Math.abs(value - centerValue) < Math.abs(nearestValue)){
	    			nearestValue = value - centerValue; 
	    			helpLineValue = value;
	    		}
	    	}
    	}
    	if(maxValue != null){
	    	for(let i = 0; i < valueArray.length; i++){
	    		let value = valueArray[i];
	    		if(Math.abs(value - maxValue) < Math.abs(nearestValue)){
	    			nearestValue = value - maxValue; 
	    			helpLineValue = value;
	    		}
	    	}    
    	}	  
    	let newCenterValue = Math.abs(nearestValue) > thatS3dMoveHelper.attachDistance ? null : (nearestValue + centerValue);
    	return {newValue: newCenterValue, helpLineValue: ( newCenterValue == null ? null : helpLineValue)};    	
    } 
    
	//使用控制器抬起鼠标时触发事件
    this.transformMouseUp = function(upEv){
		if(thatS3dMoveHelper.dragging){
			thatS3dMoveHelper.dragging = false;

			let object3D = thatS3dMoveHelper.currentObject3D;
			let nodeId = object3D.userData.unitInfo.id;
			
			//开始记录到undo list
			thatS3dMoveHelper.endAddToUndoList(nodeId);

			thatS3dMoveHelper.afterObject3DPositionChanged({
				object3D: object3D
			});
		}
		thatS3dMoveHelper.refreshAttachHelpLine();
    }

	//刷新吸附目标
	this.refreshAttachLines = function(object3D){
		thatS3dMoveHelper.attachLines = thatS3dMoveHelper.getAttachLines(object3D);
	}    

	//拖动控制器触发事件
    this.transformDrag = function(transformEv){  
		
    	let object3D = thatS3dMoveHelper.currentObject3D;
		let nodeId = object3D.userData.unitInfo.id;

		if(!thatS3dMoveHelper.dragging){
			thatS3dMoveHelper.dragging = true;

			//开始记录到undo list
			thatS3dMoveHelper.beginAddToUndoList(nodeId);
		}

		let sysEv = transformEv.sysEvent;
		//sysEv.bubbles = false;
		sysEv.cancelBubble = true;
		let currentPointInfos = thatS3dMoveHelper.getOtherPropertyValues(object3D);
		
		if(!sysEv.shiftKey){	
			//如果事件onDragTransformControl返回false，那么代表外部程序处理了此drag事件，否则运行系统默认的处理方法
			if(thatS3dMoveHelper.onDragTransformControl({
				object3D: object3D,
				pointInfos: currentPointInfos,
				axis: transformEv.target.axis
			})){    	
				if(thatS3dMoveHelper.attachLines == null){
					thatS3dMoveHelper.attachLines = thatS3dMoveHelper.getAttachLines(object3D);
				}
				
				if(transformEv.target.axis === "X"){
					let attachValueObj = thatS3dMoveHelper.calcNearestCenterValue(thatS3dMoveHelper.attachLines.x, currentPointInfos.minX, currentPointInfos.centerX, currentPointInfos.maxX);
					if(attachValueObj.newValue != null){
						object3D.position.set(attachValueObj.newValue, object3D.position.y, object3D.position.z); 
					}
					thatS3dMoveHelper.refreshAttachHelpLine({x: attachValueObj.helpLineValue});
				}
				else if(transformEv.target.axis === "Y"){
					let attachValueObj = thatS3dMoveHelper.calcNearestCenterValue(thatS3dMoveHelper.attachLines.y, currentPointInfos.minY, currentPointInfos.centerY, currentPointInfos.maxY);
					if(attachValueObj.newValue != null){
						object3D.position.set(object3D.position.x, attachValueObj.newValue, object3D.position.z);
					}
					thatS3dMoveHelper.refreshAttachHelpLine({y: attachValueObj.helpLineValue});
				}
				else if(transformEv.target.axis === "Z" ){
					let attachValueObj = thatS3dMoveHelper.calcNearestCenterValue(thatS3dMoveHelper.attachLines.z, currentPointInfos.minZ, currentPointInfos.centerZ, currentPointInfos.maxZ);
					if(attachValueObj.newValue != null){
						object3D.position.set(object3D.position.x, object3D.position.y, attachValueObj.newValue);
					}   
					thatS3dMoveHelper.refreshAttachHelpLine({z: attachValueObj.helpLineValue});
				} 
				else if(transformEv.target.axis === "XZ"){
					let attachValueObjX = thatS3dMoveHelper.calcNearestCenterValue(thatS3dMoveHelper.attachLines.x, currentPointInfos.minX, currentPointInfos.centerX, currentPointInfos.maxX);
					let attachValueObjZ = thatS3dMoveHelper.calcNearestCenterValue(thatS3dMoveHelper.attachLines.z, currentPointInfos.minZ, currentPointInfos.centerZ, currentPointInfos.maxZ);
					if(attachValueObjX.newValue != null && attachValueObjZ.newValue != null){
						object3D.position.set(attachValueObjX.newValue, object3D.position.y, attachValueObjZ.newValue);
						thatS3dMoveHelper.refreshAttachHelpLine();
					}
					else {
						if (attachValueObjX.newValue != null) {
							object3D.position.set(attachValueObjX.newValue, object3D.position.y, object3D.position.z);
						}
						if (attachValueObjZ.newValue != null) {
							object3D.position.set(object3D.position.x, object3D.position.y, attachValueObjZ.newValue);
						}
					}
					thatS3dMoveHelper.refreshAttachHelpLine({
						x: attachValueObjX.helpLineValue,
						z: attachValueObjZ.helpLineValue
					});
				}
			}
		}
		else{
			thatS3dMoveHelper.refreshAttachHelpLine();
		} 

		let newPosition = [object3D.position.x, object3D.position.y, object3D.position.z]; 
		object3D.position.set(newPosition[0], newPosition[1], newPosition[2]);
		object3D.userData.unitInfo.position = [newPosition[0], newPosition[1], newPosition[2]];

		thatS3dMoveHelper.manager.viewer.setTagPositionAndRotation(object3D.userData.unitInfo.id);

		//取消显示辅助线
    	//thatS3dMoveHelper.refreshAttachHelpLine2d();

		thatS3dMoveHelper.onObject3DPositionChanged({
			object3D: object3D
		});
    }	

	//当构件对象位置变化时触发事件
	this.onObject3DPositionChanged = function(p){		
    	thatS3dMoveHelper.doEventFunction("onObject3DPositionChanged", {
			unitJson: thatS3dMoveHelper.manager.viewer.getNodeJson(p.object3D.userData.unitInfo.id)
		});
	}

	//当构件对象位置变化后触发事件 added by ls 20220920
	this.afterObject3DPositionChanged = function(p){		
    	thatS3dMoveHelper.doEventFunction("afterObject3DPositionChanged", {
			unitJson: thatS3dMoveHelper.manager.viewer.getNodeJson(p.object3D.userData.unitInfo.id)
		});
	}

	//当拖动控制器时触发事件
	this.onDragTransformControl = function(p){		
    	return thatS3dMoveHelper.doEventFunctionWithResult("onDragTransformControl", {
			nodeId: p.object3D.userData.unitInfo.id,
			pointInfos: p.pointInfos,
			axis: p.axis
		});
	}

	//根据3D坐标获取当前屏幕上的2D坐标
    this.get2DPosition = function(vec3d){
		let vec = new THREE.Vector3(vec3d.x, vec3d.y, vec3d.z);
    	vec.project(thatS3dMoveHelper.manager.viewer.camera);
		let container = $("#" + thatS3dMoveHelper.containerId);
        let canvasWidth = $(container).width() ;
        let canvasHeight = $(container).height() ;
		return {
			x: Math.round((0.5 + vec.x / 2) * (canvasWidth / window.devicePixelRatio)),
			y: Math.round((0.5 - vec.y / 2) * (canvasHeight / window.devicePixelRatio))
		};
    }
	
	//刷新吸附线
    this.refreshAttachHelpLine2d = function(){
		let container = $("#" + thatS3dMoveHelper.containerId);
		if(thatS3dMoveHelper.currentObject3D != null){
			let textRectWidth = 40;
			let textRectHeight = 18;
			let propertyValues = thatS3dMoveHelper.getOtherPropertyValues(thatS3dMoveHelper.currentObject3D);    	
			let posXLine = $(container).find(".attachHelpLine[name='posX']")[0];
			let posXPA = thatS3dMoveHelper.get2DPosition(new THREE.Vector3(0, 0, propertyValues.minZ));   
			let posXPB = thatS3dMoveHelper.get2DPosition(new THREE.Vector3(propertyValues.minX, 0, propertyValues.minZ));  
			posXLine.setAttribute("x1", posXPA.x);
			posXLine.setAttribute("y1", posXPA.y);
			posXLine.setAttribute("x2", posXPB.x);
			posXLine.setAttribute("y2", posXPB.y); 
			$(posXLine).css({display: "block"});
			
			let posZLine = $(container).find(".attachHelpLine[name='posZ']")[0];
			let posZPA = thatS3dMoveHelper.get2DPosition(new THREE.Vector3(propertyValues.minX, 0, 0));   
			let posZPB = thatS3dMoveHelper.get2DPosition(new THREE.Vector3(propertyValues.minX, 0, propertyValues.minZ));  
			posZLine.setAttribute("x1", posZPA.x);
			posZLine.setAttribute("y1", posZPA.y);
			posZLine.setAttribute("x2", posZPB.x);
			posZLine.setAttribute("y2", posZPB.y); 
			$(posZLine).css({display: "block"});
	
			let lenXLine = $(container).find(".attachHelpLine[name='lenX']")[0];
			let lenXPA = thatS3dMoveHelper.get2DPosition(new THREE.Vector3(propertyValues.minX, 0, propertyValues.minZ));   
			let lenXPB = thatS3dMoveHelper.get2DPosition(new THREE.Vector3(propertyValues.maxX, 0, propertyValues.minZ));  
			lenXLine.setAttribute("x1", lenXPA.x);
			lenXLine.setAttribute("y1", lenXPA.y);
			lenXLine.setAttribute("x2", lenXPB.x);
			lenXLine.setAttribute("y2", lenXPB.y); 
			$(lenXLine).css({display: "block"});
	
			let lenZLine = $(container).find(".attachHelpLine[name='lenZ']")[0];
			let lenZPA = thatS3dMoveHelper.get2DPosition(new THREE.Vector3(propertyValues.minX, 0, propertyValues.minZ));   
			let lenZPB = thatS3dMoveHelper.get2DPosition(new THREE.Vector3(propertyValues.minX, 0, propertyValues.maxZ));  
			lenZLine.setAttribute("x1", lenZPA.x);
			lenZLine.setAttribute("y1", lenZPA.y);
			lenZLine.setAttribute("x2", lenZPB.x);
			lenZLine.setAttribute("y2", lenZPB.y); 
			$(lenZLine).css({display: "block"}); 
	
			let maxXLine = $(container).find(".attachHelpLine[name='maxX']")[0];
			let maxXPA = thatS3dMoveHelper.get2DPosition(new THREE.Vector3(propertyValues.minX, 0, propertyValues.maxZ));   
			let maxXPB = thatS3dMoveHelper.get2DPosition(new THREE.Vector3(propertyValues.maxX, 0, propertyValues.maxZ));  
			maxXLine.setAttribute("x1", maxXPA.x);
			maxXLine.setAttribute("y1", maxXPA.y);
			maxXLine.setAttribute("x2", maxXPB.x);
			maxXLine.setAttribute("y2", maxXPB.y); 
			$(maxXLine).css({display: "block"});
	
			let maxZLine = $(container).find(".attachHelpLine[name='maxZ']")[0];
			let maxZPA = thatS3dMoveHelper.get2DPosition(new THREE.Vector3(propertyValues.maxX, 0, propertyValues.minZ));   
			let maxZPB = thatS3dMoveHelper.get2DPosition(new THREE.Vector3(propertyValues.maxX, 0, propertyValues.maxZ));  
			maxZLine.setAttribute("x1", maxZPA.x);
			maxZLine.setAttribute("y1", maxZPA.y);
			maxZLine.setAttribute("x2", maxZPB.x);
			maxZLine.setAttribute("y2", maxZPB.y); 
			$(maxZLine).css({display: "block"}); 

			let posXLineLen = Math.sqrt((posXPB.x - posXPA.x) * (posXPB.x - posXPA.x) + (posXPB.y - posXPA.y) * (posXPB.y - posXPA.y));
			let posXTextCenter = {
				x: (posXPB.x + posXPA.x) / 2,
				y: (posXPB.y + posXPA.y) / 2
			};    	
			let posXArc = posXLineLen === 0 ? 0 : ((posXPB.x > posXPA.x ) ? (Math.asin((posXPB.y - posXPA.y) / posXLineLen) * 180 / Math.PI) : (Math.asin((posXPA.y - posXPB.y) / posXLineLen) * 180 / Math.PI));
			let posXText = $(container).find(".attachHelpText[name='posX']")[0];
			$(posXText).css({display: posXLineLen > textRectWidth ? "block" : "none"});
			posXText.setAttribute("x", posXTextCenter.x );
			posXText.setAttribute("y", posXTextCenter.y );
			posXText.setAttribute("transform", "rotate("+posXArc+","+posXTextCenter.x+","+posXTextCenter.y+")");
			posXText.textContent = thatS3dMoveHelper.getDisplayValueStr(propertyValues.minX);

			let posZLineLen = Math.sqrt((posZPB.x - posZPA.x) * (posZPB.x - posZPA.x) + (posZPB.y - posZPA.y) * (posZPB.y - posZPA.y));
			let posZTextCenter = {
				x: (posZPB.x + posZPA.x) / 2,
				y: (posZPB.y + posZPA.y) / 2
			};    	
			let posZArc = posZLineLen === 0 ? 0: ((posZPB.x > posZPA.x ) ? (Math.asin((posZPB.y - posZPA.y) / posZLineLen) * 180 / Math.PI) : (Math.asin((posZPA.y - posZPB.y) / posZLineLen) * 180 / Math.PI));
			let posZText = $(container).find(".attachHelpText[name='posZ']")[0];
			$(posZText).css({display: posZLineLen > textRectWidth ? "block" : "none"});
			posZText.setAttribute("x", posZTextCenter.x );
			posZText.setAttribute("y", posZTextCenter.y ); 
			posZText.setAttribute("transform", "rotate("+posZArc+","+posZTextCenter.x+","+posZTextCenter.y+")");
			posZText.textContent = thatS3dMoveHelper.getDisplayValueStr(propertyValues.minZ);

			let lenXLineLen = Math.sqrt((lenXPB.x - lenXPA.x) * (lenXPB.x - lenXPA.x) + (lenXPB.y - lenXPA.y) * (lenXPB.y - lenXPA.y));
			let lenXTextCenter = {
				x: (lenXPB.x + lenXPA.x) / 2,
				y: (lenXPB.y + lenXPA.y) / 2
			};    	
			let lenXArc = lenXLineLen === 0 ? 0 : ((lenXPB.x > lenXPA.x ) ? (Math.asin((lenXPB.y - lenXPA.y) / lenXLineLen) * 180 / Math.PI) : (Math.asin((lenXPA.y - lenXPB.y) / lenXLineLen) * 180 / Math.PI));
			let lenXText = $(container).find(".attachHelpText[name='lenX']")[0];
			$(lenXText).css({display: lenXLineLen > textRectWidth ? "block" : "none"});
			lenXText.setAttribute("x", lenXTextCenter.x );
			lenXText.setAttribute("y", lenXTextCenter.y );
			lenXText.setAttribute("transform", "rotate("+lenXArc+","+lenXTextCenter.x+","+ lenXTextCenter.y+")");
			lenXText.textContent = thatS3dMoveHelper.getDisplayValueStr(propertyValues.lenX);

			let lenZLineLen = Math.sqrt((lenZPB.x - lenZPA.x) * (lenZPB.x - lenZPA.x) + (lenZPB.y - lenZPA.y) * (lenZPB.y - lenZPA.y));
			let lenZTextCenter = {
				x: (lenZPB.x + lenZPA.x) / 2,
				y: (lenZPB.y + lenZPA.y) / 2
			};    	
			let lenZArc = lenZLineLen === 0 ? 0 : ((lenZPB.x > lenZPA.x ) ? (Math.asin((lenZPB.y - lenZPA.y) / lenZLineLen) * 180 / Math.PI) : (Math.asin((lenZPA.y - lenZPB.y) / lenZLineLen) * 180 / Math.PI));
			let lenZText = $(container).find(".attachHelpText[name='lenZ']")[0];
			$(lenZText).css({display: lenZLineLen > textRectWidth ? "block" : "none"});
			lenZText.setAttribute("x", lenZTextCenter.x );
			lenZText.setAttribute("y", lenZTextCenter.y );
			lenZText.setAttribute("transform", "rotate("+lenZArc+","+lenZTextCenter.x+","+ lenZTextCenter.y+")");
			lenZText.textContent = thatS3dMoveHelper.getDisplayValueStr(propertyValues.lenZ);
			
			let posXRect = $(container).find(".attachHelpRect[name='posX']")[0];
			$(posXRect).css({display: posXLineLen > textRectWidth ? "block" : "none"}); 
			posXRect.setAttribute("x", posXTextCenter.x - textRectWidth /2 );
			posXRect.setAttribute("y", posXTextCenter.y - textRectHeight /2 ); 
			posXRect.setAttribute("transform", "rotate("+posXArc+","+posXTextCenter.x+","+posXTextCenter.y+")");
			
			let posZRect = $(container).find(".attachHelpRect[name='posZ']")[0];
			$(posZRect).css({display: posZLineLen > textRectWidth ? "block" : "none"}); 
			posZRect.setAttribute("x", posZTextCenter.x - textRectWidth /2 );
			posZRect.setAttribute("y", posZTextCenter.y - textRectHeight /2 ); 
			posZRect.setAttribute("transform", "rotate("+posZArc+","+posZTextCenter.x+","+posZTextCenter.y+")");
	
			let lenXRect = $(container).find(".attachHelpRect[name='lenX']")[0];
			$(lenXRect).css({display: lenXLineLen > textRectWidth ? "block" : "none"}); 
			lenXRect.setAttribute("x", lenXTextCenter.x - textRectWidth /2 );
			lenXRect.setAttribute("y", lenXTextCenter.y - textRectHeight /2 ); 
			lenXRect.setAttribute("transform", "rotate("+lenXArc+","+lenXTextCenter.x+","+lenXTextCenter.y+")");
	
			let lenZRect = $(container).find(".attachHelpRect[name='lenZ']")[0];
			$(lenZRect).css({display: lenZLineLen > textRectWidth ? "block" : "none"}); 
			lenZRect.setAttribute("x", lenZTextCenter.x - textRectWidth /2 );
			lenZRect.setAttribute("y", lenZTextCenter.y - textRectHeight /2 ); 
			lenZRect.setAttribute("transform", "rotate("+lenZArc+","+lenZTextCenter.x+","+lenZTextCenter.y+")");
		}
		else{
			let posXLine = $(container).find(".attachHelpLine[name='posX']")[0];
			$(posXLine).css({display: "none"});
			
			let posZLine = $(container).find(".attachHelpLine[name='posZ']")[0];
			$(posZLine).css({display: "none"});
	
			let lenXLine = $(container).find(".attachHelpLine[name='lenX']")[0];
			$(lenXLine).css({display: "none"});
	
			let lenZLine = $(container).find(".attachHelpLine[name='lenZ']")[0];
			$(lenZLine).css({display: "none"});   
	
			let maxXLine = $(container).find(".attachHelpLine[name='maxX']")[0];
			$(maxXLine).css({display: "none"});
	
			let maxZLine = $(container).find(".attachHelpLine[name='maxZ']")[0];
			$(maxZLine).css({display: "none"});   

			let posXText = $(container).find(".attachHelpText[name='posX']")[0];
			$(posXText).css({display: "none"});
			
			let posZText = $(container).find(".attachHelpText[name='posZ']")[0];
			$(posZText).css({display: "none"});
	
			let lenXText = $(container).find(".attachHelpText[name='lenX']")[0];
			$(lenXText).css({display: "none"});
	
			let lenZText = $(container).find(".attachHelpText[name='lenZ']")[0];
			$(lenZText).css({display: "none"});    

			let posXRect = $(container).find(".attachHelpRect[name='posX']")[0];
			$(posXRect).css({display: "none"});
			
			let posZRect = $(container).find(".attachHelpRect[name='posZ']")[0];
			$(posZRect).css({display: "none"});
	
			let lenXRect = $(container).find(".attachHelpRect[name='lenX']")[0];
			$(lenXRect).css({display: "none"});
	
			let lenZRect = $(container).find(".attachHelpRect[name='lenZ']")[0];
			$(lenZRect).css({display: "none"});   
		}
    }
    
	//刷新吸附线
    this.refreshAttachHelpLine = function(axisHelpInfos){
		if(axisHelpInfos == null){
			thatS3dMoveHelper.attachHelpLines.xLine.visible = false; 
			thatS3dMoveHelper.attachHelpLines.zLine.visible = false;  
			thatS3dMoveHelper.attachHelpLines.yPlane.visible = false; 
		}
		else{
			let axisNames =  ["x", "y", "z"];
			for(let i = 0 ; i < axisNames.length; i++) {
				let axisName = axisNames[i];
				let newValue = axisHelpInfos[axisName];
				switch (axisName) {
					case "x": {
						if(newValue == null){
							thatS3dMoveHelper.attachHelpLines.xLine.visible = false;
						}
						else {
							thatS3dMoveHelper.attachHelpLines.xLine.position.set(newValue, thatS3dMoveHelper.gridYZero, 0);
							thatS3dMoveHelper.attachHelpLines.xLine.visible = true;
						}
						break;
					}
					case "z": {
						if(newValue == null){
							thatS3dMoveHelper.attachHelpLines.zLine.visible = false;
						}
						else {
							thatS3dMoveHelper.attachHelpLines.zLine.position.set(0, thatS3dMoveHelper.gridYZero, newValue);
							thatS3dMoveHelper.attachHelpLines.zLine.visible = true;
						}
						break;
					}
					case "y": {
						if(newValue == null){
							thatS3dMoveHelper.attachHelpLines.yPlane.visible = false;
						}
						else {
							let sizeX = thatS3dMoveHelper.manager.s3dObject.axis.size.x;
							let sizeZ = thatS3dMoveHelper.manager.s3dObject.axis.size.z;
							let xCenter = 0;
							let zCenter = 0;
							thatS3dMoveHelper.attachHelpLines.yPlane.geometry.parameters.height = sizeZ;
							thatS3dMoveHelper.attachHelpLines.yPlane.geometry.parameters.width = sizeX;
							thatS3dMoveHelper.attachHelpLines.yPlane.position.set(xCenter, newValue, zCenter);
							thatS3dMoveHelper.attachHelpLines.yPlane.visible = true;
						}
						break;
					}
				}
			}
		}  
    }
 
	//获取标记信息
    this.getDisplayValueStr = function(sourceValue, fixNum){
    	fixNum = fixNum == null ? 1 : fixNum;
    	let tempValue = parseFloat(sourceValue);
    	return cmnPcr.decimalToStr(common3DFunction.m2mm(sourceValue), false, fixNum, true);
    }

	//当控制器绑定对象切换时
	this.transformAttachChange = function(p){
		
	}

	//刷新控制器
	this.refreshTransformControl = function(){

	}	
    
    //创建位置显示控件
    this.addAttachHelpLine = function() {  
		let attachHelpDiv = document.createElement("div");
		attachHelpDiv.className = "attachHelpLineContainer";
		thatS3dMoveHelper.manager.viewer.renderer2d.domElement.appendChild( attachHelpDiv ); 
		thatS3dMoveHelper.initAttachHelpLine2dHtml(attachHelpDiv);  
    }; 	

	//显示提示信息
	this.showMessageText = function(message, point){
		let messageText = $("#" + thatS3dMoveHelper.containerId).find(".attachHelpText[name='message']")[0];
		if(message == null || message.length === 0){
			$(messageText).css("display", "none");
		}
		else{
			$(messageText).css("display", "block");
			messageText.setAttribute("x", point.x );
			messageText.setAttribute("y", point.y );
			messageText.textContent = message;
		}
	}

	//初始化吸附线2d的html
    this.initAttachHelpLine2dHtml = function(containerElement){
    	let svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svgElement.setAttribute("version", "1.1");
		svgElement.setAttribute("width", "100%");
		svgElement.setAttribute("height", "100%");
		svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    	
    	let linePosXDom = document.createElementNS("http://www.w3.org/2000/svg", "line"); 
    	linePosXDom.setAttribute("name", "posX");
    	linePosXDom.setAttribute("x1", 0);
    	linePosXDom.setAttribute("y1", 0);
    	linePosXDom.setAttribute("x2", 300);
    	linePosXDom.setAttribute("y2", 300); 
    	linePosXDom.setAttribute("class", "attachHelpLine"); 
    	svgElement.appendChild(linePosXDom);   
    	
    	let linePosZDom = document.createElementNS("http://www.w3.org/2000/svg", "line"); 
    	linePosZDom.setAttribute("name", "posZ");
    	linePosZDom.setAttribute("x1", 0);
    	linePosZDom.setAttribute("y1", 0);
    	linePosZDom.setAttribute("x2", 300);
    	linePosZDom.setAttribute("y2", 300); 
    	linePosZDom.setAttribute("class", "attachHelpLine"); 
    	svgElement.appendChild(linePosZDom);   
    	
    	let lineLenXDom = document.createElementNS("http://www.w3.org/2000/svg", "line"); 
    	lineLenXDom.setAttribute("name", "lenX");
    	lineLenXDom.setAttribute("x1", 0);
    	lineLenXDom.setAttribute("y1", 0);
    	lineLenXDom.setAttribute("x2", 300);
    	lineLenXDom.setAttribute("y2", 300); 
    	lineLenXDom.setAttribute("class", "attachHelpLine"); 
    	svgElement.appendChild(lineLenXDom);   
    	
    	let lineLenZDom = document.createElementNS("http://www.w3.org/2000/svg", "line"); 
    	lineLenZDom.setAttribute("name", "lenZ");
    	lineLenZDom.setAttribute("x1", 0);
    	lineLenZDom.setAttribute("y1", 0);
    	lineLenZDom.setAttribute("x2", 300);
    	lineLenZDom.setAttribute("y2", 300);
    	lineLenZDom.setAttribute("class", "attachHelpLine") 
    	svgElement.appendChild(lineLenZDom);  
    	
    	let lineMaxXDom = document.createElementNS("http://www.w3.org/2000/svg", "line"); 
    	lineMaxXDom.setAttribute("name", "maxX");
    	lineMaxXDom.setAttribute("x1", 0);
    	lineMaxXDom.setAttribute("y1", 0);
    	lineMaxXDom.setAttribute("x2", 300);
    	lineMaxXDom.setAttribute("y2", 300); 
    	lineMaxXDom.setAttribute("class", "attachHelpLine"); 
    	svgElement.appendChild(lineMaxXDom);   
    	
    	let lineMaxZDom = document.createElementNS("http://www.w3.org/2000/svg", "line"); 
    	lineMaxZDom.setAttribute("name", "maxZ");
    	lineMaxZDom.setAttribute("x1", 0);
    	lineMaxZDom.setAttribute("y1", 0);
    	lineMaxZDom.setAttribute("x2", 300);
    	lineMaxZDom.setAttribute("y2", 300);
    	lineMaxZDom.setAttribute("class", "attachHelpLine") 
    	svgElement.appendChild(lineMaxZDom);   
    	
    	let rectPosXDom = document.createElementNS("http://www.w3.org/2000/svg", "rect"); 
    	rectPosXDom.setAttribute("name", "posX");
    	rectPosXDom.setAttribute("x", 100);
    	rectPosXDom.setAttribute("y", 100);   
    	rectPosXDom.setAttribute("class", "attachHelpRect");     
    	rectPosXDom.setAttribute("is2D", "true");      
    	rectPosXDom.textContent = "";     	
    	svgElement.appendChild(rectPosXDom);   
    	
    	let rectPosZDom = document.createElementNS("http://www.w3.org/2000/svg", "rect"); 
    	rectPosZDom.setAttribute("name", "posZ");
    	rectPosZDom.setAttribute("x", 100);
    	rectPosZDom.setAttribute("y", 100);  
    	rectPosZDom.setAttribute("class", "attachHelpRect");    
    	rectPosZDom.setAttribute("is2D", "true");       
    	rectPosZDom.textContent = "";     	
    	svgElement.appendChild(rectPosZDom);   
    	
    	let rectLenXDom = document.createElementNS("http://www.w3.org/2000/svg", "rect"); 
    	rectLenXDom.setAttribute("name", "lenX");
    	rectLenXDom.setAttribute("x", 100);
    	rectLenXDom.setAttribute("y", 100);  
    	rectLenXDom.setAttribute("class", "attachHelpRect attachHelpReadonlyRect");   
    	rectLenXDom.textContent = "";     	
    	svgElement.appendChild(rectLenXDom);   
    	
    	let rectLenZDom = document.createElementNS("http://www.w3.org/2000/svg", "rect"); 
    	rectLenZDom.setAttribute("name", "lenZ");
    	rectLenZDom.setAttribute("x", 100);
    	rectLenZDom.setAttribute("y", 100);  
    	rectLenZDom.setAttribute("class", "attachHelpRect attachHelpReadonlyRect");   
    	rectLenZDom.textContent = "";     	
    	svgElement.appendChild(rectLenZDom);  
    	
    	let textPosXDom = document.createElementNS("http://www.w3.org/2000/svg", "text"); 
    	textPosXDom.setAttribute("name", "posX");
    	textPosXDom.setAttribute("x", 100);
    	textPosXDom.setAttribute("y", 100);  
    	textPosXDom.setAttribute("class", "attachHelpText");  
    	textPosXDom.setAttribute("is2D", "true");            
    	textPosXDom.textContent = "";     	
    	svgElement.appendChild(textPosXDom);   
    	
    	let textPosZDom = document.createElementNS("http://www.w3.org/2000/svg", "text"); 
    	textPosZDom.setAttribute("name", "posZ");
    	textPosZDom.setAttribute("x", 100);
    	textPosZDom.setAttribute("y", 100); 
    	textPosZDom.setAttribute("class", "attachHelpText"); 
    	textPosZDom.setAttribute("is2D", "true");             
    	textPosZDom.textContent = "";     	
    	svgElement.appendChild(textPosZDom);   
    	
    	let textLenXDom = document.createElementNS("http://www.w3.org/2000/svg", "text"); 
    	textLenXDom.setAttribute("name", "lenX");
    	textLenXDom.setAttribute("x", 100);
    	textLenXDom.setAttribute("y", 100); 
    	textLenXDom.setAttribute("class", "attachHelpText attachHelpReadonlyText");  
    	textLenXDom.textContent = "";     	
    	svgElement.appendChild(textLenXDom);   
    	
    	let textLenZDom = document.createElementNS("http://www.w3.org/2000/svg", "text"); 
    	textLenZDom.setAttribute("name", "lenZ");
    	textLenZDom.setAttribute("x", 100);
    	textLenZDom.setAttribute("y", 100); 
    	textLenZDom.setAttribute("class", "attachHelpText attachHelpReadonlyText");   
    	textLenZDom.textContent = "";     	
    	svgElement.appendChild(textLenZDom);  
    	
    	let textMessageDom = document.createElementNS("http://www.w3.org/2000/svg", "text"); 
    	textMessageDom.setAttribute("name", "message");
    	textMessageDom.setAttribute("x", 100);
    	textMessageDom.setAttribute("y", 100); 
    	textMessageDom.setAttribute("class", "attachHelpText attachHelpReadonlyText");   
    	textMessageDom.textContent = "";     	
    	svgElement.appendChild(textMessageDom);  

    	containerElement.appendChild(svgElement);

		//隐藏消息提示		
		$(textMessageDom).css({display: "none"}); 


    	$("#" + thatS3dMoveHelper.containerId).find(".popPosSettingBackground").click(function(){
			thatS3dMoveHelper.closePopPosEditor();
    	});
    	$("#" + thatS3dMoveHelper.containerId).find(".popPosSettingInput").keydown(function(ev){
    		switch(ev.keyCode){
	    		case 13:{
	    			if(thatS3dMoveHelper.selectedUnitObject3D != null){
		    			if(thatS3dMoveHelper.unitPopChangePos()){
		        			thatS3dMoveHelper.closePopPosEditor();
		    			}
	    			}
	    			else if(thatS3dMoveHelper.pointCtrlProcessor.selectedPointCtrlObject3D != null){
		    			if(thatS3dMoveHelper.pointCtrlProcessor.pointCtrlPopChangePos()){
		        			thatS3dMoveHelper.closePopPosEditor();
		    			}
	    			}
	        		break;
	    		}
	    		case 27:{
	    			thatS3dMoveHelper.closePopPosEditor();
	    			break;
	    		}
			}
    	});

    	$("#" + thatS3dMoveHelper.containerId).find(".popLengthSettingBackground").click(function(){
			thatS3dMoveHelper.closePopLengthEditor();
    	});
    	$("#" + thatS3dMoveHelper.containerId).find(".popLengthSettingInput").keydown(function(ev){
    		switch(ev.keyCode){
	    		case 13:{
	    			if(thatS3dMoveHelper.popChangeLength()){
	        			thatS3dMoveHelper.closePopLengthEditor();
	    			}
	        		break;
	    		}
	    		case 27:{
	    			thatS3dMoveHelper.closePopLengthEditor();
	    			break;
	    		}
			}
    	});
    }

    //创建画线标尺显示控件
    this.addDrawHelpLine = function() {  
		let drawHelpDiv = document.createElement("div");
		drawHelpDiv.className = "drawHelpLineContainer";
		thatS3dMoveHelper.manager.viewer.renderer2d.domElement.appendChild( drawHelpDiv ); 
		thatS3dMoveHelper.initDrawHelpLine2dHtml(drawHelpDiv);  
    }

	//初始化辅助线2d的html
    this.initDrawHelpLine2dHtml = function(containerElement){
    	let svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svgElement.setAttribute("version", "1.1");
		svgElement.setAttribute("width", "100%");
		svgElement.setAttribute("height", "100%");
		svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg"); 
    	
		//长度
    	let rectLengthDom = document.createElementNS("http://www.w3.org/2000/svg", "rect"); 
    	rectLengthDom.setAttribute("name", "lineLength");
    	rectLengthDom.setAttribute("x", 100);
    	rectLengthDom.setAttribute("y", 100);   
    	rectLengthDom.setAttribute("class", "drawHelpRect");     
    	rectLengthDom.setAttribute("is2D", "true");      
    	rectLengthDom.textContent = "";     	
    	svgElement.appendChild(rectLengthDom);    	
    	let textLengthDom = document.createElementNS("http://www.w3.org/2000/svg", "text"); 
    	textLengthDom.setAttribute("name", "lineLength");
    	textLengthDom.setAttribute("x", 100);
    	textLengthDom.setAttribute("y", 100);  
    	textLengthDom.setAttribute("class", "drawHelpText");  
    	textLengthDom.setAttribute("is2D", "true");            
    	textLengthDom.textContent = "";     	
    	svgElement.appendChild(textLengthDom); 
    	
    	//弧度 
    	let rectArcDom = document.createElementNS("http://www.w3.org/2000/svg", "rect"); 
    	rectArcDom.setAttribute("name", "arcDegree");
    	rectArcDom.setAttribute("x", 100);
    	rectArcDom.setAttribute("y", 100);   
    	rectArcDom.setAttribute("class", "drawHelpArcRect");     
    	rectArcDom.setAttribute("is2D", "true");      
    	rectArcDom.textContent = "";     	
    	svgElement.appendChild(rectArcDom); 
    	let textArcDom = document.createElementNS("http://www.w3.org/2000/svg", "text"); 
    	textArcDom.setAttribute("name", "arcDegree");
    	textArcDom.setAttribute("x", 100);
    	textArcDom.setAttribute("y", 100);  
    	textArcDom.setAttribute("class", "drawHelpArcText");  
    	textArcDom.setAttribute("is2D", "true");            
    	textArcDom.textContent = "";     	
    	svgElement.appendChild(textArcDom);  	

    	containerElement.appendChild(svgElement);
    }
    
	//刷新夹角信息
    this.refreshDrawHelpArc2D = function(fromPoint, crossPoint, toPoint){ 
    	if(fromPoint != null && crossPoint != null){   
    		let textRectWidth = 40;
    		let textRectHeight = 18; 
    		
    		let angleDegree = thatS3dMoveHelper.getAngleByThreePoints(fromPoint, crossPoint, toPoint);

	    	let fromPoint2D = thatS3dMoveHelper.get2DPosition(new THREE.Vector3(fromPoint.x, fromPoint.y, fromPoint.z)); 
	    	let crossPoint2D = thatS3dMoveHelper.get2DPosition(new THREE.Vector3(crossPoint.x, crossPoint.y, crossPoint.z)); 
	    	let toPoint2D = thatS3dMoveHelper.get2DPosition(new THREE.Vector3(toPoint.x, toPoint.y, toPoint.z));   

 	    	let arc2DRect = $("#" + thatS3dMoveHelper.containerId).find(".drawHelpArcRect[name='arcDegree']")[0]; 
	    	$(arc2DRect).css({display: Math.round(angleDegree) > 0 ? "block" : "none"});
	    	arc2DRect.setAttribute("x", crossPoint2D.x - textRectWidth /2 );
	    	arc2DRect.setAttribute("y", crossPoint2D.y - textRectHeight /2 ); 
 	    	let arc2DText = $("#" + thatS3dMoveHelper.containerId).find(".drawHelpArcText[name='arcDegree']")[0]; 
	    	$(arc2DText).css({display: Math.round(angleDegree) > 0 ? "block" : "none"});
	    	arc2DText.setAttribute("x", crossPoint2D.x );
	    	arc2DText.setAttribute("y", crossPoint2D.y ); 
	    	arc2DText.textContent = angleDegree + "°"; 
    	}
    	else{   		    	
    		let arc2DRect = $("#" + thatS3dMoveHelper.containerId).find(".drawHelpArcRect[name='arcDegree']")[0]; 
	    	$(arc2DRect).css({display: "none"}); 
    		let arc2DText = $("#" + thatS3dMoveHelper.containerId).find(".drawHelpArcText[name='arcDegree']")[0]; 
	    	$(arc2DText).css({display: "none"}); 
    	} 
    }
    
	//刷新标记信息
    this.refreshDrawHelpLine2D = function(fromPoint, toPoint){ 
    	if(fromPoint != null){   
    		let textRectWidth = 40;
    		let textRectHeight = 18; 
	    	let fromPoint2D = thatS3dMoveHelper.get2DPosition(new THREE.Vector3(fromPoint.x, fromPoint.y, fromPoint.z));   
	    	let toPoint2D = thatS3dMoveHelper.get2DPosition(new THREE.Vector3(toPoint.x, toPoint.y, toPoint.z));   

	    	let line3DLen = Math.sqrt((toPoint.x - fromPoint.x) * (toPoint.x - fromPoint.x) + (toPoint.y - fromPoint.y) * (toPoint.y - fromPoint.y) + (toPoint.z - fromPoint.z) * (toPoint.z - fromPoint.z));
	    	let line2DLen = Math.sqrt((toPoint2D.x - fromPoint2D.x) * (toPoint2D.x - fromPoint2D.x) + (toPoint2D.y - fromPoint2D.y) * (toPoint2D.y - fromPoint2D.y));
	    	let lineTextCenter = {
    			x: (toPoint2D.x + fromPoint2D.x) / 2,
    			y: (toPoint2D.y + fromPoint2D.y) / 2
	    	};    	
	    	let line2DArc = line2DLen == 0 ? 0 : ((toPoint2D.x > fromPoint2D.x ) ? (Math.asin((toPoint2D.y - fromPoint2D.y) / line2DLen) * 180 / Math.PI) : (Math.asin((fromPoint2D.y - toPoint2D.y) / line2DLen) * 180 / Math.PI));
	    	let lineLengthText = $("#" + thatS3dMoveHelper.containerId).find(".drawHelpText[name='lineLength']")[0]; 
	    	$(lineLengthText).css({display: line2DLen > textRectWidth ? "block" : "none"});
	    	lineLengthText.setAttribute("x", lineTextCenter.x );
	    	lineLengthText.setAttribute("y", lineTextCenter.y );
	    	lineLengthText.setAttribute("transform", "rotate(" + line2DArc + "," + lineTextCenter.x + "," + lineTextCenter.y + ")");
	    	lineLengthText.textContent = thatS3dMoveHelper.getDisplayValueStr(line3DLen);
   
	    	let line2DRect = $("#" + thatS3dMoveHelper.containerId).find(".drawHelpRect[name='lineLength']")[0];  
	    	$(line2DRect).css({display: line2DLen > textRectWidth ? "block" : "none"}); 
	    	line2DRect.setAttribute("x", lineTextCenter.x - textRectWidth /2 );
	    	line2DRect.setAttribute("y", lineTextCenter.y - textRectHeight /2 ); 
	    	line2DRect.setAttribute("transform", "rotate(" + line2DArc + "," + lineTextCenter.x + "," + lineTextCenter.y + ")"); 
    	}
    	else{   		    	
    		let lineLengthText = $("#" + thatS3dMoveHelper.containerId).find(".drawHelpText[name='lineLength']")[0]; 
	    	$(lineLengthText).css({display: "none"});

	    	let line2DRect = $("#" + thatS3dMoveHelper.containerId).find(".drawHelpRect[name='lineLength']")[0]; 
	    	$(line2DRect).css({display: "none"});  
    	} 
    }
    
	//获取3D空间里两条线的夹角
    this.getAngleByThreePoints = function(fromPoint, crossPoint, toPoint){
        let abx = fromPoint.x - crossPoint.x;
        let abz = fromPoint.z - crossPoint.z;
        let cbx = toPoint.x - crossPoint.x;
        let cbz = toPoint.z - crossPoint.z;
        let abMulCb = abx * cbx + abz * cbz;
        let distAb = Math.sqrt(abx * abx + abz * abz);
        let distCd = Math.sqrt(cbx * cbx + cbz * cbz);
        let cosValue = abMulCb / (distAb * distCd);
        return Math.round(Math.acos(cosValue) * 180 * 100 / Math.PI) / 100;
    }
}
export default S3dMoveHelper