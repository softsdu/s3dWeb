import * as THREE from "three";
import "./s3dPathDrawingTool.css"
import {FontLoader} from "fontLoader";
import {TextGeometry} from "textGeometry";
import {cmnPcr, msgBox, s3dViewerStatus} from "../../commonjs/common/static.js"

//S3dWeb 绘制路径工具
let S3dPathDrawingTool = function (){
	//当前对象
	const thatS3dPathDrawingTool = this;

	this.manager = null;

	this.containerId = null;

	//忽略的误差，单位为m
	this.ignoreSize = 0.00001;
	this.ignoreAngle = 0.1;

	//保留小数位数
	this.positionFixNum = 0;
	this.angleFixNum = 1;

	//吸附距离
	this.attachSize = 0.1;

	//距离约束的标记的尺寸
	this.constraintMarkSize = 0.1;

	this.creatingInfo = {
		//包括segment、arc、point
		type: null,
		fromObject: null,
		toObject: null,
		lineObject: null
	};

	this.sourceInfo = {
		id: null,
		pointStr: null,
		lineStr: null,
		constraintStr: null,
		pathStr: null,
	}

	this.pathInfo = {
		id: null,
		pointMap: {},
		lineMap: {},
		angleMap: {},
		constraintMap: {}
	};

	this.undoList = [];

	this.redoList = [];

	this.pointSize = 0.08;

	this.planeZero = 5;

	this.unitZero = 5.1;

	this.rootObject3D = null;

	this.s3dUI2DVisibilities = null;

	this.fontUrl = null;

	this.fontConfig = {
		font: null,
		size: this.constraintMarkSize * 3 / 4, // 文本大小
		height: 0.01, // 文本厚度
	};

	this.selectedPointMaterial  = new THREE.MeshStandardMaterial({
		color: 0xFF0000,
		depthTest: false,
		flatShading: false,
		side: THREE.FrontSide,
		transparent: true,
		roughness: 1,
		metalness: 0
	});

	this.pointMaterial = new THREE.MeshStandardMaterial({
		color: 0x00FF00,
		depthTest: false,
		flatShading: false,
		side: THREE.FrontSide,
		transparent: true,
		roughness: 1,
		metalness: 0
	});

	this.selectedLineMaterial = new THREE.LineBasicMaterial({
		color: 0xFF0000
	});

	this.lineMaterial = new THREE.LineBasicMaterial({ 
		color: 0xEEEEEE
	});

	this.planeMaterial = new THREE.LineBasicMaterial({
		color: 0x888888,
		side: THREE.DoubleSide,
		opacity: 0.75,
		transparent: true
	});

	this.constraintTextMaterial = new THREE.MeshBasicMaterial({
		color: 0xFF00FF
	});

	this.constraintLineMaterial = new THREE.LineBasicMaterial({
		color: 0xFF00FF
	});

	this.tagTextMaterial = new THREE.MeshBasicMaterial({
		color: 0xFFE97F
	});

	this.tagLineMaterial = new THREE.LineDashedMaterial({
		color: 0xFFE97F,
		dashSize: this.constraintMarkSize,
		gapSize: this.constraintMarkSize
	});

	this.init = function(p){
		thatS3dPathDrawingTool.manager = p.manager;
		thatS3dPathDrawingTool.containerId = p.containerId;
		thatS3dPathDrawingTool.fontUrl = p.config.fontUrl;
		thatS3dPathDrawingTool.pointSize = p.config.pointSize == null ? thatS3dPathDrawingTool.pointSize : p.config.pointSize;
	}

	this.loadFont = function(){
		let textLoad = new FontLoader();
		textLoad.load(thatS3dPathDrawingTool.fontUrl, function(font){
			thatS3dPathDrawingTool.fontConfig.font = font;

			thatS3dPathDrawingTool.hideS3d2DUIs();
			thatS3dPathDrawingTool.initOperation();
			thatS3dPathDrawingTool.initToolbar();

			thatS3dPathDrawingTool.initDrawingPlane();
			thatS3dPathDrawingTool.initRootObject3D();
			thatS3dPathDrawingTool.initLayout(thatS3dPathDrawingTool.pathInfo);
		});
	}

	this.show = function (sourceInfo){
		thatS3dPathDrawingTool.sourceInfo = sourceInfo;
		thatS3dPathDrawingTool.pathInfo = thatS3dPathDrawingTool.sourceToPathInfo(sourceInfo);
		thatS3dPathDrawingTool.loadFont();
	}

	this.initToolbar = function (){
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		$(container).find(".pathDrawingToolToolbarContainer").remove();
		let html = thatS3dPathDrawingTool.getToolbarHtml();
		$(container).append(html);

		//事件
		$(container).find(".pathDrawingToolToolbarBtnContainer").click(function(){
			let btnName = $(this).attr("name");
			thatS3dPathDrawingTool.manager.viewer.focus();
			switch(btnName){
				case "point":
				case "segment":
				case "arc":{
					thatS3dPathDrawingTool.beginCreating(btnName, {
						x: 0,
						y: 0
					});
					break;
				}
				case "distance":{
					thatS3dPathDrawingTool.addConstraintDistance();
					break;
				}
				case "horizontal":{
					thatS3dPathDrawingTool.addConstraintHorizontal();
					break;
				}
				case "vertical":{
					thatS3dPathDrawingTool.addConstraintVertical();
					break;
				}
				case "angle":{
					thatS3dPathDrawingTool.addConstraintAngle();
					break;
				}
				case "parallel":{
					thatS3dPathDrawingTool.addConstraintParallel();
					break;
				}
				default:{
					break;
				}

			}
		});
	}

	this.getSelectedSegmentNames = function (){
		let allLineObjectMap = thatS3dPathDrawingTool.getPathObjectMap("line");
		let lineNames = [];
		for(let name in allLineObjectMap){
			let lineObject = allLineObjectMap[name];
			if(lineObject.isSelected) {
				let lineInfo = lineObject.userData.info.lineInfo;
				if (lineInfo.lineType === "segment") {
					lineNames.push(name);
				}
			}
		}
		return lineNames;
	}

	this.addConstraintDistance = function (){
		let lineNames = thatS3dPathDrawingTool.getSelectedSegmentNames();
		if(lineNames.length !== 1){
			msgBox.alert({info: "请选中一条线"});
		}
		else {
			let pathInfo = thatS3dPathDrawingTool.pathInfo;
			let lineName = lineNames[0];
			let existConstraintName = thatS3dPathDrawingTool.getConstraintName("distance", lineName, null);
			if(existConstraintName != null){
				msgBox.alert({info: "已定义距离约束: " + existConstraintName});
			}
			else{
				let lineInfo = pathInfo.lineMap[lineName];
				let fromPointInfo = pathInfo.pointMap[lineInfo.from]
				let toPointInfo = pathInfo.pointMap[lineInfo.to]
				let length = common2DLine.getLength(fromPointInfo, toPointInfo);
				thatS3dPathDrawingTool.addNewConstraint("distance", lineName, null, length, pathInfo);
			}
		}
	}

	this.addConstraintParallel = function (){
		let lineNames = thatS3dPathDrawingTool.getSelectedSegmentNames();
		if(lineNames.length !== 2){
			msgBox.alert({info: "请选中两条线"});
		}
		else {
			let pathInfo = thatS3dPathDrawingTool.pathInfo;
			let fromLineName = lineNames[0];
			let toLineName = lineNames[1];
			let existConstraintName = thatS3dPathDrawingTool.getConstraintName("parallel", fromLineName, toLineName);
			if(existConstraintName != null){
				msgBox.alert({info: "已定义距离约束: " + existConstraintName});
			}
			else{
				thatS3dPathDrawingTool.addNewConstraint("parallel", fromLineName, toLineName, null, pathInfo);

				//执行平行
				let fromLineInfo = pathInfo.lineMap[fromLineName];
				let affectedPointInfo = thatS3dPathDrawingTool.calcAffectedPointInfoByConstraintParallel(fromLineInfo.from, fromLineInfo.to, toLineName);
				thatS3dPathDrawingTool.movePointByName(affectedPointInfo.name, common3DFunction.m2mm(affectedPointInfo.x), common3DFunction.m2mm(affectedPointInfo.y));
			}
		}
	}

	this.addConstraintAngle = function (){
		let lineNames = thatS3dPathDrawingTool.getSelectedSegmentNames();
		if(lineNames.length !== 2){
			msgBox.alert({info: "请选中两条线"});
		}
		else {
			let pathInfo = thatS3dPathDrawingTool.pathInfo;
			let fromLineName = lineNames[0];
			let toLineName = lineNames[1];
			let existConstraintName = thatS3dPathDrawingTool.getConstraintName("angle", fromLineName, toLineName);
			if (existConstraintName != null) {
				msgBox.alert({info: "已定义距离约束: " + existConstraintName});
			} else {
				let anglePointInfo = thatS3dPathDrawingTool.getAnglePointsByTwoLines(fromLineName, toLineName, pathInfo);
				if (anglePointInfo.center === null) {
					msgBox.alert({info: "不是相邻的两条边"});
				} else {
					let angle = thatS3dPathDrawingTool.getAngleByThreePoints(anglePointInfo.from, anglePointInfo.to, anglePointInfo.center);

					thatS3dPathDrawingTool.addNewConstraint("angle", fromLineName, toLineName, angle * 180 / Math.PI, pathInfo);
				}
			}
		}
	}

	this.getAngleByThreePoints = function(fromPoint, toPoint, centerPoint){
		let endAngle = common2DLine.getAngle(
			{x: 1, y: 0},
			{x: fromPoint.x - centerPoint.x, y: fromPoint.y - centerPoint.y});
		let startAngle = common2DLine.getAngle(
			{x: 1, y: 0},
			{x: toPoint.x - centerPoint.x, y: toPoint.y - centerPoint.y});
		if(startAngle > endAngle){
			endAngle += 2 * Math.PI;
		}
		return Math.PI * 2 - (endAngle - startAngle);
	}

	this.addConstraintHorizontal = function (){
		let lineNames = thatS3dPathDrawingTool.getSelectedSegmentNames();
		let pathInfo = thatS3dPathDrawingTool.pathInfo;
		if(lineNames.length !== 1){
			msgBox.alert({info: "请选中一条线"});
		}
		else {
			let lineName = lineNames[0];
			let existConstraintName = thatS3dPathDrawingTool.getConstraintName("horizontal", lineName, null);
			if(existConstraintName != null){
				msgBox.alert({info: "已定义距离约束: " + existConstraintName});
			}
			else{
				thatS3dPathDrawingTool.addNewConstraint("horizontal", lineName, null, null, pathInfo);

				//执行保持水平
				let lineInfo = pathInfo.lineMap[lineName];
				let affectedPointInfo = thatS3dPathDrawingTool.calcAffectedPointInfoByConstraintHorizontal(lineInfo.from, lineInfo.to);
				thatS3dPathDrawingTool.movePointByName(affectedPointInfo.name, common3DFunction.m2mm(affectedPointInfo.x), common3DFunction.m2mm(affectedPointInfo.y));
			}
		}
	}

	this.addConstraintVertical = function (){
		let lineNames = thatS3dPathDrawingTool.getSelectedSegmentNames();
		let pathInfo = thatS3dPathDrawingTool.pathInfo;
		if(lineNames.length !== 1){
			msgBox.alert({info: "请选中一条线"});
		}
		else {
			let lineName = lineNames[0];
			let existConstraintName = thatS3dPathDrawingTool.getConstraintName("vertical", lineName, null);
			if(existConstraintName != null){
				msgBox.alert({info: "已定义距离约束: " + existConstraintName});
			}
			else{
				thatS3dPathDrawingTool.addNewConstraint("vertical", lineName, null, null, pathInfo);

				//执行保持竖直
				let lineInfo = pathInfo.lineMap[lineName];
				let affectedPointInfo = thatS3dPathDrawingTool.calcAffectedPointInfoByConstraintVertical(lineInfo.from, lineInfo.to);
				thatS3dPathDrawingTool.movePointByName(affectedPointInfo.name, common3DFunction.m2mm(affectedPointInfo.x), common3DFunction.m2mm(affectedPointInfo.y));
			}
		}
	}

	this.getConstraintName = function(constraintType, from, to){
		let allConstraintObjectMap = thatS3dPathDrawingTool.getPathObjectMap("constraint");
		for(let name in allConstraintObjectMap){
			let constraintObject = allConstraintObjectMap[name];
			let constraintInfo = constraintObject.userData.info.constraintInfo;
			if(constraintInfo.constraintType === constraintType){
				switch(constraintType){
					case "distance":
					case "horizontal":
					case "vertical":{
						if(from === constraintInfo.from){
							return name;
						}
						break;
					}
					case "angle":
					case "parallel":{
						if((from === constraintInfo.from && to === constraintInfo.to) || (from === constraintInfo.to && to === constraintInfo.from)){
							return name;
						}
						break;
					}
				}
			}
		}
		return null;
	}

	this.initOperation = function (){
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		$(container).find(".pathDrawingToolOperationContainer").remove();
		let html = thatS3dPathDrawingTool.getOperationHtml();
		$(container).append(html);

		//事件
		$(container).find(".pathDrawingToolOperationBtnContainer").click(function(){
			let btnName = $(this).attr("name");
			switch(btnName){
				case "cancel":{
					thatS3dPathDrawingTool.cancelAndClose();
					break;
				}
				case "ok":{
					thatS3dPathDrawingTool.saveAndClose();
					break;
				}
			}
		});
	}

	this.removeCreatingObject = function (){
		let fromObject = thatS3dPathDrawingTool.creatingInfo.fromObject;
		if(fromObject != null){
			thatS3dPathDrawingTool.rootObject3D.remove(fromObject);
		}
		let lineObject = thatS3dPathDrawingTool.creatingInfo.lineObject;
		if(lineObject != null){
			thatS3dPathDrawingTool.rootObject3D.remove(lineObject);
		}
		let toObject = thatS3dPathDrawingTool.creatingInfo.toObject;
		if(toObject != null){
			thatS3dPathDrawingTool.rootObject3D.remove(toObject);
		}
	}

	this.addCreatingFromObject = function (fromPosition) {
		let pointGeometry = new THREE.BoxGeometry(thatS3dPathDrawingTool.pointSize, thatS3dPathDrawingTool.pointSize, thatS3dPathDrawingTool.pointSize);
		let pointObject3D = new THREE.Mesh(pointGeometry, thatS3dPathDrawingTool.selectedPointMaterial);
		pointObject3D.position.set(fromPosition.x, thatS3dPathDrawingTool.unitZero, fromPosition.y);
		pointObject3D.isCreatingObject = true;
		thatS3dPathDrawingTool.rootObject3D.add(pointObject3D);
		thatS3dPathDrawingTool.creatingInfo.fromObject = pointObject3D;
	}

	this.addCreatingToObject = function (toPosition) {
		let pointGeometry = new THREE.BoxGeometry(thatS3dPathDrawingTool.pointSize, thatS3dPathDrawingTool.pointSize, thatS3dPathDrawingTool.pointSize);
		let pointObject3D = new THREE.Mesh(pointGeometry, thatS3dPathDrawingTool.selectedPointMaterial);
		pointObject3D.position.set(toPosition.x, thatS3dPathDrawingTool.unitZero, toPosition.y);
		pointObject3D.isCreatingObject = true;
		thatS3dPathDrawingTool.rootObject3D.add(pointObject3D);
		thatS3dPathDrawingTool.creatingInfo.toObject = pointObject3D;
	}

	this.addCreatingLineObject = function (lineType, fromPosition, toPosition) {
		let lineObject3D = null;
		switch(lineType){
			case "segment":{
				let points = thatS3dPathDrawingTool.calcSegmentPoints(fromPosition, toPosition);
				let geometry = new THREE.BufferGeometry().setFromPoints(points);
				lineObject3D = new THREE.Line(geometry, thatS3dPathDrawingTool.selectedLineMaterial);
				break;
			}
			case "arc":{
				let centerPosition = {
					x: (fromPosition.x + toPosition.x) / 2,
					y: (fromPosition.y + toPosition.y) / 2
				};
				let point3Ds = thatS3dPathDrawingTool.calcArcPoint3Ds(fromPosition, toPosition, centerPosition);
				let geometry = new THREE.BufferGeometry().setFromPoints(point3Ds);
				lineObject3D = new THREE.Line(geometry, thatS3dPathDrawingTool.lineMaterial);
				break;
			}
			default:{
				throw "未知的类型. type=" + lineType
			}
		}
		lineObject3D.isCreatingObject = true;
		thatS3dPathDrawingTool.rootObject3D.add(lineObject3D);
		thatS3dPathDrawingTool.creatingInfo.lineObject = lineObject3D;
	}

	this.clearCreatingInfo = function (){
		thatS3dPathDrawingTool.creatingInfo = {
			type: null,
			fromObject: null,
			toObject: null,
			lineObject: null
		};
	}

	this.cancelCreating = function (){
		thatS3dPathDrawingTool.removeCreatingObject();
		thatS3dPathDrawingTool.clearCreatingInfo();
	}

	this.beginCreating = function (createType, fromPosition){
		thatS3dPathDrawingTool.creatingInfo.type = createType;
		thatS3dPathDrawingTool.addCreatingFromObject({
			x: fromPosition.x,
			y: fromPosition.y
		});
	}

	this.endCreating = function (){
		let newObjectName = null;
		switch(thatS3dPathDrawingTool.creatingInfo.type){
			case "point":{
				let fromPointName = thatS3dPathDrawingTool.getPointNameByPosition3D(thatS3dPathDrawingTool.creatingInfo.fromObject.position);
				if(fromPointName == null){
					fromPointName = thatS3dPathDrawingTool.addNewPoint(thatS3dPathDrawingTool.creatingInfo.fromObject.position);
				}
				newObjectName =  fromPointName;
				break;
			}
			case "segment":{
				let fromPointName = thatS3dPathDrawingTool.getPointNameByPosition3D(thatS3dPathDrawingTool.creatingInfo.fromObject.position);
				if(fromPointName == null){
					fromPointName = thatS3dPathDrawingTool.addNewPoint(thatS3dPathDrawingTool.creatingInfo.fromObject.position);
				}
				let toPointName = thatS3dPathDrawingTool.getPointNameByPosition3D(thatS3dPathDrawingTool.creatingInfo.toObject.position);
				if(toPointName == null){
					toPointName = thatS3dPathDrawingTool.addNewPoint(thatS3dPathDrawingTool.creatingInfo.toObject.position);
				}
				let lineName = thatS3dPathDrawingTool.getSegmentNameByPointNames(fromPointName, toPointName);
				if(lineName == null){
					lineName = thatS3dPathDrawingTool.addNewSegmentLine(fromPointName, toPointName);
				}
				newObjectName =  lineName;
				break;
			}
			case "arc":{
				let fromPointName = thatS3dPathDrawingTool.getPointNameByPosition3D(thatS3dPathDrawingTool.creatingInfo.fromObject.position);
				if(fromPointName == null){
					fromPointName = thatS3dPathDrawingTool.addNewPoint(thatS3dPathDrawingTool.creatingInfo.fromObject.position);
				}
				let toPointName = thatS3dPathDrawingTool.getPointNameByPosition3D(thatS3dPathDrawingTool.creatingInfo.toObject.position);
				if(toPointName == null){
					toPointName = thatS3dPathDrawingTool.addNewPoint(thatS3dPathDrawingTool.creatingInfo.toObject.position);
				}
				let centerPosition = {
					x: (thatS3dPathDrawingTool.creatingInfo.fromObject.position.x + thatS3dPathDrawingTool.creatingInfo.toObject.position.x) / 2,
					y: (thatS3dPathDrawingTool.creatingInfo.fromObject.position.y + thatS3dPathDrawingTool.creatingInfo.toObject.position.y) / 2,
					z: (thatS3dPathDrawingTool.creatingInfo.fromObject.position.z + thatS3dPathDrawingTool.creatingInfo.toObject.position.z) / 2,
				};
				let centerPointName = thatS3dPathDrawingTool.getPointNameByPosition3D(centerPosition);
				if(centerPointName == null){
					centerPointName = thatS3dPathDrawingTool.addNewPoint(centerPosition);
				}
				let lineName = thatS3dPathDrawingTool.getArcNameByPointNames(fromPointName, toPointName, centerPointName);
				if(lineName == null){
					lineName = thatS3dPathDrawingTool.addNewArcLine(fromPointName, toPointName, centerPointName);
				}
				newObjectName =  lineName;
				break;
			}
			default:{
				break;
			}
		}

		//删除creatingObject
		thatS3dPathDrawingTool.removeCreatingObject();
		thatS3dPathDrawingTool.clearCreatingInfo();

		return newObjectName;
	}

	//约束值改变时
	this.changeConstraintValue = function(name, value){
		let pathInfo = thatS3dPathDrawingTool.pathInfo;
		let constraintObject = thatS3dPathDrawingTool.getPathObjectByName(name);
		let constraintInfo = constraintObject.userData.info.constraintInfo;

		switch(constraintInfo.constraintType){
			case "distance":{
				let distance = common3DFunction.mm2m(value);
				let lineName = constraintInfo.from;
				let lineInfo = pathInfo.lineMap[lineName];
				let fromPointName = lineInfo.from;
				let toPointName = lineInfo.to;
				constraintInfo.value = distance;

				thatS3dPathDrawingTool.changePointDistanceByConstraint(fromPointName, toPointName, distance);
				break;
			}
			case "angle":{
				let angle = value;
				let fromLineName = constraintInfo.from;
				let toLineName = constraintInfo.to;
				constraintInfo.value = angle;

				thatS3dPathDrawingTool.changeLineAngleByConstraint(fromLineName, toLineName, angle * Math.PI / 180);
				break;
			}
			case "horizontal":
			case "vertical":
			case "parallel":
			default:{
				break;
			}
		}
	}

	//根据水平约束计算新的点坐标
	this.calcAffectedPointInfoByConstraintHorizontal = function(fromPointName, toPointName){
		let pathInfo = thatS3dPathDrawingTool.pathInfo;
		let fromPointInfo = pathInfo.pointMap[fromPointName];
		let toPointInfo = pathInfo.pointMap[toPointName];
		let length = common2DLine.getLength(fromPointInfo, toPointInfo);
		return {
			name: toPointName,
			x: (toPointInfo.x > fromPointInfo.x ? fromPointInfo.x + length : fromPointInfo.x - length),
			y: fromPointInfo.y
		};
	}

	//根据竖直约束计算新的点坐标
	this.calcAffectedPointInfoByConstraintVertical = function(fromPointName, toPointName){
		let pathInfo = thatS3dPathDrawingTool.pathInfo;
		let fromPointInfo = pathInfo.pointMap[fromPointName];
		let toPointInfo = pathInfo.pointMap[toPointName];
		let length = common2DLine.getLength(fromPointInfo, toPointInfo);
		return {
			name: toPointName,
			x: fromPointInfo.x,
			y: (toPointInfo.y > fromPointInfo.y ? fromPointInfo.y + length : fromPointInfo.y - length)
		};
	}

	//根据平行约束计算新的点坐标
	this.calcAffectedPointInfoByConstraintParallel = function(fromPointName, toPointName, parallelLineName){
		let pathInfo = thatS3dPathDrawingTool.pathInfo;
		let fromPointInfo = pathInfo.pointMap[fromPointName];
		let toPointInfo = pathInfo.pointMap[toPointName];
		let parallelLineInfo = pathInfo.lineMap[parallelLineName];
		let parallelLineFromPointInfo = pathInfo.pointMap[parallelLineInfo.from];
		let parallelLineToPointInfo = pathInfo.pointMap[parallelLineInfo.to];

		let lineLength = common2DLine.getLength(parallelLineFromPointInfo, parallelLineToPointInfo);
		let mirrorFromPosition = common2DLine.mirrorPointAcrossLine(parallelLineFromPointInfo, fromPointInfo, toPointInfo);

		let newToPoint = null;
		if(common2DLine.getDirectionByLine(parallelLineToPointInfo, mirrorFromPosition, parallelLineFromPointInfo)){
			//左侧
			newToPoint = common2DLine.getRightPoint(parallelLineFromPointInfo, mirrorFromPosition, parallelLineFromPointInfo, lineLength);
		}
		else{
			//右侧
			newToPoint = common2DLine.getRightPoint(mirrorFromPosition, parallelLineFromPointInfo, parallelLineFromPointInfo, lineLength);
		}
		if(newToPoint == null){
			return {
				name: parallelLineToPointInfo.name,
				x: parallelLineFromPointInfo.x,
				y: parallelLineFromPointInfo.y
			};
		}
		else {
			return {
				name: parallelLineToPointInfo.name,
				x: newToPoint.x,
				y: newToPoint.y
			};
		}
	}

	//修改角度约束的值
	this.changeLineAngleByConstraint = function (fromLineName, toLineName, angle){
		let affectedPointInfo = thatS3dPathDrawingTool.calcAffectedPointInfoByConstraintAngle(fromLineName, toLineName, angle);
		if(affectedPointInfo != null) {
			thatS3dPathDrawingTool.movePointByName(affectedPointInfo.name, common3DFunction.m2mm(affectedPointInfo.x), common3DFunction.m2mm(affectedPointInfo.y));
		}
	}

	//根据角度约束计算新的点坐标
	this.calcAffectedPointInfoByConstraintAngle = function(fromLineName, toLineName, angle){
		let pathInfo = thatS3dPathDrawingTool.pathInfo;
		let anglePointNames = thatS3dPathDrawingTool.getAnglePointNamesByTwoLines(fromLineName, toLineName, pathInfo);
		if(anglePointNames.center == null) {
			return null;
		}
		else{
			let angleFromPointInfo = pathInfo.pointMap[anglePointNames.from];
			let angleToPointInfo = pathInfo.pointMap[anglePointNames.to];
			let anglePointInfo = pathInfo.pointMap[anglePointNames.center];

			let fromLineLength = common2DLine.getLength(anglePointInfo, angleFromPointInfo);
			let toLineLength = common2DLine.getLength(anglePointInfo, angleToPointInfo);
			if(fromLineLength === 0){
				return {
					name: angleToPointInfo.name,
					x: angleToPointInfo.x,
					y: angleToPointInfo.y
				};
			}
			else {
				let toNormalPoint = commonRotate.rotatePoint2D({
					x: (angleFromPointInfo.x - anglePointInfo.x) / fromLineLength,
					y: (angleFromPointInfo.y - anglePointInfo.y) / fromLineLength
				}, -angle * Math.PI / 180);
				let toLenPoint = common2DLine.getPointInLine({x: 0, y: 0}, toNormalPoint, toLineLength);
				return {
					name: angleToPointInfo.name,
					x: anglePointInfo.x + toLenPoint.x,
					y: anglePointInfo.y + toLenPoint.y
				};
			}
		}
	}

	//修改距离约束的值
	this.changePointDistanceByConstraint = function (fromPointName, toPointName, distance){
		let affectedPointInfo = thatS3dPathDrawingTool.calcAffectedPointInfoByConstraintDistance(fromPointName, toPointName, distance);
		thatS3dPathDrawingTool.movePointByName(affectedPointInfo.name, common3DFunction.m2mm(affectedPointInfo.x), common3DFunction.m2mm(affectedPointInfo.y));
	}

	//根据距离约束计算新的点坐标
	this.calcAffectedPointInfoByConstraintDistance = function(fromPointName, toPointName, distance){
		let pathInfo = thatS3dPathDrawingTool.pathInfo;
		let fromPointInfo = pathInfo.pointMap[fromPointName];
		let toPointInfo = pathInfo.pointMap[toPointName];
		if(common2DLine.checkSamePoint(fromPointInfo, toPointInfo, thatS3dPathDrawingTool.ignoreSize)){
			return {
				name: toPointName,
				x: toPointInfo.x,
				y: toPointInfo.y
			};
		}
		else {
			let position = common2DLine.getPointInLine(fromPointInfo, toPointInfo, distance);
			return {
				name: toPointName,
				x: position.x,
				y: position.y
			};
		}
	}

	//删除选中的构件
	this.removeSelectedPathObject = function (){
		let names = thatS3dPathDrawingTool.getAllSelectedPathObjectNames();
		if(names.length > 0){
			thatS3dPathDrawingTool.removePathObjects(names, false);
		}
	}

	//删除
	this.removePathObjects = function (names, withoutConfirm) {
		if (!withoutConfirm && !msgBox.confirm({info: "确定删除吗?"})) {
			return;
		}
		let allNeedRemovePointNameMap = {};
		let allNeedRemoveLineNameMap = {};
		let allNeedRemoveConstraintNameMap = {};

		let allPointObjectMap = thatS3dPathDrawingTool.getPathObjectMap("point");
		let allLineObjectMap = thatS3dPathDrawingTool.getPathObjectMap("line");
		let allConstraintObjectMap = thatS3dPathDrawingTool.getPathObjectMap("constraint");
		let allTagObjectMap = thatS3dPathDrawingTool.getTagObjectMap();
		let pathInfo = thatS3dPathDrawingTool.pathInfo;

		//获取所有关联的line和point
		for (let i = 0; i < names.length; i++) {
			let name = names[i];
			let pointObject3D = allPointObjectMap[name];
			if(pointObject3D != null){
				allNeedRemovePointNameMap[name] = true;
				let lineNames = thatS3dPathDrawingTool.getRelatedLineNames(pointObject3D, allLineObjectMap);
				for(let j = 0; j < lineNames.length; j++){
					let lineName = lineNames[j];
					allNeedRemoveLineNameMap[lineName] = true;
				}
			}

			let lineObject3D = allLineObjectMap[name];
			if(lineObject3D != null){
				allNeedRemoveLineNameMap[name] = true;
			}

			let constraintObject3D = allConstraintObjectMap[name];
			if(constraintObject3D != null){
				allNeedRemoveConstraintNameMap[name] = true;
			}
		}

		//line又关联了其他point，如果point没有被其他line引用，那么也要删除
		for(let lineName in allNeedRemoveLineNameMap){
			let lineObject3D = allLineObjectMap[lineName];
			let relatedPointNames = thatS3dPathDrawingTool.getRelatedPointNamesByLineName(lineName, pathInfo);
			let lineInfo = lineObject3D.userData.info.lineInfo;
			for(let i = 0; i < relatedPointNames.length; i++){
				let pointName = relatedPointNames[i];
				let pointObject3D = allPointObjectMap[pointName];
				let lns = thatS3dPathDrawingTool.getRelatedLineNames(pointObject3D, allLineObjectMap);
				let isAllLineInRemoveList = true;
				for(let j = 0; j < lns.length; j++){
					let l = lns[j];
					if(!allNeedRemoveLineNameMap[l]){
						isAllLineInRemoveList = false;
						break;
					}
				}
				if(isAllLineInRemoveList){
					allNeedRemovePointNameMap[pointName] = true;
				}
			}
		}

		//删除object3d
		for(let pointName in allNeedRemovePointNameMap){
			let pointObject3D = allPointObjectMap[pointName];
			delete pathInfo.pointMap[pointName];
			thatS3dPathDrawingTool.rootObject3D.remove(pointObject3D);

			let tagObject3D = allTagObjectMap[pointName];
			if(tagObject3D != null){
				thatS3dPathDrawingTool.rootObject3D.remove(tagObject3D);
			}
		}
		for(let lineName in allNeedRemoveLineNameMap){
			let lineObject3D = allLineObjectMap[lineName];
			delete pathInfo.lineMap[lineName];
			thatS3dPathDrawingTool.rootObject3D.remove(lineObject3D);

			let tagObject3D = allTagObjectMap[lineName];
			if(tagObject3D != null){
				thatS3dPathDrawingTool.rootObject3D.remove(tagObject3D);
			}
		}


		//找到影响到的约束
		let needRemoveConstraintNameMap = thatS3dPathDrawingTool.getRelatedConstraintNameMap(allNeedRemoveLineNameMap, allConstraintObjectMap);
		for(let name in needRemoveConstraintNameMap){
			allNeedRemoveConstraintNameMap[name] = true;
		}
		for(let constraintName in allNeedRemoveConstraintNameMap){
			let constraintObject3D = allConstraintObjectMap[constraintName];
			delete pathInfo.constraintMap[constraintName];
			thatS3dPathDrawingTool.rootObject3D.remove(constraintObject3D);
		}

		//删除html里对应的行
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		for(let pointName in allNeedRemovePointNameMap){
			$(container).find(".pathDrawingToolPointContainer").find(".pathDrawingTableRow[name='" + pointName + "']").remove();
		}
		for(let lineName in allNeedRemoveLineNameMap){
			$(container).find(".pathDrawingToolLineContainer").find(".pathDrawingTableRow[name='" + lineName + "']").remove();
		}
		for(let constraintName in allNeedRemoveConstraintNameMap){
			$(container).find(".pathDrawingToolConstraintContainer").find(".pathDrawingTableRow[name='" + constraintName + "']").remove();
		}

		thatS3dPathDrawingTool.refreshInfoItemCount(thatS3dPathDrawingTool.pathInfo);
	}

	this.getRelatedPointNamesByLineName = function(lineName, pathInfo){
		let lineInfo = pathInfo.lineMap[lineName];
		let relatedPointNames = [];
		switch (lineInfo.lineType){
			case "segment":{
				relatedPointNames.push(lineInfo.from);
				relatedPointNames.push(lineInfo.to);
				break;
			}
			case "arc":{
				relatedPointNames.push(lineInfo.from);
				relatedPointNames.push(lineInfo.to);
				relatedPointNames.push(lineInfo.center);
				break;
			}
		}
		return relatedPointNames;
	}

	this.getRelatedConstraintNameMapByPointName = function (pointName){
		let lineNames = thatS3dPathDrawingTool.getRelatedLineNamesByPointName(pointName);
		let lineNameMap = {};
		for(let i = 0; i < lineNames.length; i++){
			let lineName = lineNames[i];
			lineNameMap[lineName] = true;
		}
		let allConstraintObjectMap = thatS3dPathDrawingTool.getPathObjectMap("constraint");
		return thatS3dPathDrawingTool.getRelatedConstraintNameMap(lineNameMap, allConstraintObjectMap);
	}

	this.getRelatedConstraintNameMap = function (lineNameMap, allConstraintObjectMap){
		let relatedConstraintNameMap = {};
		for(let lineName in lineNameMap) {
			for(let constraintName in allConstraintObjectMap) {
				let constraintObject3D = allConstraintObjectMap[constraintName];
				let constraintInfo = constraintObject3D.userData.info.constraintInfo;
				if (constraintInfo.from === lineName || constraintInfo.to === lineName) {
					relatedConstraintNameMap[constraintName] = true;
				}
			}
		}
		return relatedConstraintNameMap;
	}

	this.getRelatedLineNamesByPointName = function (pointName){
		let allLineObjectMap = thatS3dPathDrawingTool.getPathObjectMap("line");
		let pointObject3D = thatS3dPathDrawingTool.getPathObjectByName(pointName);
		return thatS3dPathDrawingTool.getRelatedLineNames(pointObject3D, allLineObjectMap);
	}

	this.getRelatedLineNames = function (pointObject3D, allLineObjectMap){
		let lineNames = [];
		let pointName = pointObject3D.userData.info.name;
		for(let lineName in allLineObjectMap){
			let lineObject = allLineObjectMap[lineName];
			switch(lineObject.userData.info.lineInfo.lineType){
				case "segment":{
					if(lineObject.userData.info.lineInfo.from === pointName
						|| lineObject.userData.info.lineInfo.to === pointName){
						lineNames.push(lineName);
					}
					break;
				}
				case "arc":{
					if(lineObject.userData.info.lineInfo.from === pointName
						|| lineObject.userData.info.lineInfo.to === pointName
						|| lineObject.userData.info.lineInfo.center === pointName){
						lineNames.push(lineName);
					}
					break;
				}
			}
		}
		return lineNames;
	}

	this.addNewPoint = function (position3D){
		let allPointObjectMap = thatS3dPathDrawingTool.getPathObjectMap("point");
		let hasSame = true;
		let index = 1;
		let newName = null;
		while(hasSame){
			hasSame = false;
			newName = "p" + index;
			for(let name in allPointObjectMap){
				if(name === newName){
					hasSame = true;
					break;
				}
			}
			index++;
		}
		let pointInfo = {
			name: newName,
			x: position3D.x,
			y: position3D.z
		};

		thatS3dPathDrawingTool.pathInfo.pointMap[pointInfo.name] = pointInfo;
		let object3D = thatS3dPathDrawingTool.createPointObject3D(pointInfo);
		thatS3dPathDrawingTool.rootObject3D.add(object3D);

		thatS3dPathDrawingTool.addToPointTable(pointInfo);

		return pointInfo.name;
	}

	this.addNewConstraint = function(constraintType, from, to, value, pathInfo){
		let allConstraintObjectMap = thatS3dPathDrawingTool.getPathObjectMap("constraint");
		let hasSame = true;
		let index = 1;
		let newName = null;
		while(hasSame){
			hasSame = false;
			newName = "c" + index;
			for(let name in allConstraintObjectMap){
				if(name === newName){
					hasSame = true;
					break;
				}
			}
			index++;
		}
		let constraintInfo = {
			name: newName,
			constraintType: constraintType,
			from: from,
			to: to,
			value: value
		};

		pathInfo.constraintMap[constraintInfo.name] = constraintInfo;
		let object3D = thatS3dPathDrawingTool.createConstraintObject3D(constraintInfo, pathInfo);
		thatS3dPathDrawingTool.rootObject3D.add(object3D);

		thatS3dPathDrawingTool.addToConstraintTable(constraintInfo);

		return constraintInfo.name;
	}

	this.addNewSegmentLine = function (fromPointName, toPointName){
		let allLineObjectMap = thatS3dPathDrawingTool.getPathObjectMap("line");
		let hasSame = true;
		let index = 1;
		let newName = null;
		while(hasSame){
			hasSame = false;
			newName = "l" + index;
			for(let name in allLineObjectMap){
				if(name === newName){
					hasSame = true;
					break;
				}
			}
			index++;
		}
		let lineInfo = {
			name: newName,
			lineType: "segment",
			from: fromPointName,
			to: toPointName
		};

		thatS3dPathDrawingTool.pathInfo.lineMap[lineInfo.name] = lineInfo;
		let object3D = thatS3dPathDrawingTool.createSegmentObject3D(lineInfo, thatS3dPathDrawingTool.pathInfo);
		thatS3dPathDrawingTool.rootObject3D.add(object3D);

		thatS3dPathDrawingTool.addToLineTable(lineInfo);

		return lineInfo.name;
	}

	this.addNewArcLine = function (fromPointName, toPointName, centerPointName){
		let allLineObjectMap = thatS3dPathDrawingTool.getPathObjectMap("line");
		let hasSame = true;
		let index = 1;
		let newName = null;
		while(hasSame){
			hasSame = false;
			newName = "l" + index;
			for(let name in allLineObjectMap){
				if(name === newName){
					hasSame = true;
					break;
				}
			}
			index++;
		}
		let lineInfo = {
			name: newName,
			lineType: "arc",
			from: fromPointName,
			to: toPointName,
			center: centerPointName,
			middlePoint: null
		};

		thatS3dPathDrawingTool.pathInfo.lineMap[lineInfo.name] = lineInfo;
		let object3D = thatS3dPathDrawingTool.createArcObject3D(lineInfo, thatS3dPathDrawingTool.pathInfo);
		thatS3dPathDrawingTool.rootObject3D.add(object3D);
		let tagObject3D = thatS3dPathDrawingTool.createArcTagObject3D(lineInfo, thatS3dPathDrawingTool.pathInfo);
		thatS3dPathDrawingTool.rootObject3D.add(tagObject3D);

		thatS3dPathDrawingTool.addToLineTable(lineInfo);

		return lineInfo.name;
	}

	this.getPointNameByPosition3D = function (position3D){
		let allPointObjectMap = thatS3dPathDrawingTool.getPathObjectMap("point");
		for(let name in allPointObjectMap){
			let pointObject = allPointObjectMap[name];
			if(common3DFunction.checkSamePoint(pointObject.position, position3D, thatS3dPathDrawingTool.ignoreSize)){
				return name;
			}
		}
		return null;
	}

	this.getSegmentNameByPointNames = function (fromPointName, toPointName){
		let allLineObjectMap = thatS3dPathDrawingTool.getPathObjectMap("line");
		for(let name in allLineObjectMap){
			let lineObject = allLineObjectMap[name];
			let lineInfo = lineObject.userData.info.lineInfo;
			if(lineInfo.lineType === "segment"
				&& ((lineInfo.from === fromPointName && lineInfo.to === toPointName)
					|| (lineInfo.from === toPointName && lineInfo.to === fromPointName))) {
				return name;
			}
		}
		return null;
	}

	this.getArcNameByPointNames = function (fromPointName, toPointName, centerPointName){
		let allLineObjectMap = thatS3dPathDrawingTool.getPathObjectMap("line");
		for(let name in allLineObjectMap){
			let lineObject = allLineObjectMap[name];
			let lineInfo = lineObject.userData.info.lineInfo;
			if(lineInfo.lineType === "arc"
				&& lineInfo.from === fromPointName
				&& lineInfo.center === centerPointName
				&& lineInfo.to === toPointName) {
				return name;
			}
		}
		return null;
	}

	this.getToolbarHtml = function (){
		let html = "<div class=\"pathDrawingToolContainer pathDrawingToolToolbarContainer\">"
			+ "<div class=\"pathDrawingToolBackground\"></div>"
			+ "<div class=\"pathDrawingToolHeader\"><div class=\"pathDrawingToolTitle\">工具箱</div></div>"
			+ "<div class=\"pathDrawingToolInnerContainer pathDrawingToolInnerPathContainer\">"
			+ "<div class=\"pathDrawingToolToolbarBtnContainer pathDrawingToolToolbarBtnPoint\" name=\"point\" title=\"点\">"
			+ "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"pathDrawingToolToolbarBtnSvg\" width=\"32\" height=\"32\"><rect x=\"12\" y=\"12\" width=\"6\" height=\"6\" fill=\"#00FF00\" shape-rendering=\"crispEdges\"/></svg>"
			+ "</div>"
			+ "<div class=\"pathDrawingToolToolbarBtnContainer pathDrawingToolToolbarBtnSegment\" name=\"segment\" title=\"线\">"
			+ "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"pathDrawingToolToolbarBtnSvg\" width=\"32\" height=\"32\"><rect x=\"5\" y=\"5\" width=\"6\" height=\"6\" fill=\"#00FF00\" shape-rendering=\"crispEdges\"/><rect x=\"19\" y=\"19\" width=\"6\" height=\"6\" fill=\"#00FF00\" shape-rendering=\"crispEdges\"/><line x1=\"8\" y1=\"8\" x2=\"22\" y2=\"22\" stroke=\"#FFFFFF\" stroke-width=\"1\" shape-rendering=\"crispEdges\"/></svg>"
			+ "</div>"
			+ "<div class=\"pathDrawingToolToolbarBtnContainer pathDrawingToolToolbarBtnArc\" name=\"arc\" title=\"弧\">"
			+ "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"pathDrawingToolToolbarBtnSvg\" width=\"32\" height=\"32\"><rect x=\"5\" y=\"5\" width=\"6\" height=\"6\" fill=\"#00FF00\" shape-rendering=\"crispEdges\"/><rect x=\"19\" y=\"19\" width=\"6\" height=\"6\" fill=\"#00FF00\" shape-rendering=\"crispEdges\"/><path d=\"M8,8 A14,14 0 0 1 22,22\" stroke=\"#FFFFFF\" stroke-width=\"1\" fill=\"none\" shape-rendering=\"crispEdges\"/></svg>"
			+ "</div>"
			+ "</div>"
			+ "<div class=\"pathDrawingToolInnerContainer pathDrawingToolInnerConstraintContainer\">"
			+ "<div class=\"pathDrawingToolToolbarBtnContainer pathDrawingToolToolbarBtnPoint\" name=\"horizontal\" title=\"水平约束\">"
			+ "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"pathDrawingToolToolbarBtnSvg\" width=\"32\" height=\"32\"><text x=\"15\" y=\"18\" class=\"toolbarText\" stroke=\"#FF00FF\" text-anchor=\"middle\" dominant-baseline=\"central\" shape-rendering=\"crispEdges\">H</text><line x1=\"5\" y1=\"10\" x2=\"25\" y2=\"10\" stroke=\"#FFFFFF\" stroke-width=\"1\" shape-rendering=\"crispEdges\"/></svg>"
			+ "</div>"
			+ "<div class=\"pathDrawingToolToolbarBtnContainer pathDrawingToolToolbarBtnPoint\" name=\"vertical\" title=\"竖直约束\">"
			+ "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"pathDrawingToolToolbarBtnSvg\" width=\"32\" height=\"32\"><text x=\"12\" y=\"15\" class=\"toolbarText\" stroke=\"#FF00FF\" text-anchor=\"middle\" dominant-baseline=\"central\" shape-rendering=\"crispEdges\">V</text><line x1=\"20\" y1=\"5\" x2=\"20\" y2=\"25\" stroke=\"#FFFFFF\" stroke-width=\"1\" shape-rendering=\"crispEdges\"/></svg>"
			+ "</div>"
			+ "<div class=\"pathDrawingToolToolbarBtnContainer pathDrawingToolToolbarBtnPoint\" name=\"distance\" title=\"距离约束\">"
			+ "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"pathDrawingToolToolbarBtnSvg\" width=\"32\" height=\"32\"><text x=\"16\" y=\"12\" class=\"toolbarText\" stroke=\"#FF00FF\" text-anchor=\"middle\" dominant-baseline=\"central\" shape-rendering=\"crispEdges\">50</text><line x1=\"5\" y1=\"20\" x2=\"25\" y2=\"20\" stroke=\"#FFFFFF\" stroke-width=\"1\" shape-rendering=\"crispEdges\"/></svg>"
			+ "</div>"
			+ "<div class=\"pathDrawingToolToolbarBtnContainer pathDrawingToolToolbarBtnPoint\" name=\"parallel\" title=\"平行约束\">"
			+ "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"pathDrawingToolToolbarBtnSvg\" width=\"32\" height=\"32\"><line x1=\"4\" y1=\"12\" x2=\"19\" y2=\"27\" stroke=\"#FFFFFF\" stroke-width=\"1\" shape-rendering=\"crispEdges\"/><line x1=\"12\" y1=\"4\" x2=\"27\" y2=\"19\" stroke=\"#FFFFFF\" stroke-width=\"1\" shape-rendering=\"crispEdges\"/></svg>"
			+ "</div>"
			+ "<div class=\"pathDrawingToolToolbarBtnContainer pathDrawingToolToolbarBtnPoint\" name=\"angle\" title=\"角度约束\">"
			+ "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"pathDrawingToolToolbarBtnSvg\" width=\"32\" height=\"32\"><text x=\"20\" y=\"17\" class=\"toolbarText\" stroke=\"#FF00FF\" text-anchor=\"middle\" dominant-baseline=\"central\" shape-rendering=\"crispEdges\">60°</text><line x1=\"5\" y1=\"25\" x2=\"25\" y2=\"25\" stroke=\"#FFFFFF\" stroke-width=\"1\" shape-rendering=\"crispEdges\"/><line x1=\"5\" y1=\"25\" x2=\"15\" y2=\"5\" stroke=\"#FFFFFF\" stroke-width=\"1\" shape-rendering=\"crispEdges\"/></svg>"
			+ "</div>"
			+ "</div>"
			+ "</div>";
		return html;
	}

	this.getOperationHtml = function (){
		let html = "<div class=\"pathDrawingToolContainer pathDrawingToolOperationContainer\">"
			+ "<div class=\"pathDrawingToolBackground\"></div>"
			+ "<div class=\"pathDrawingToolHeader\"><div class=\"pathDrawingToolTitle\">操作</div></div>"
			+ "<div class=\"pathDrawingToolInnerContainer pathDrawingToolInnerOperationContainer\">"
			+ "<div class=\"pathDrawingToolOperationBtnContainer\" name=\"cancel\" title=\"取消编辑\">取消</div>"
			+ "<div class=\"pathDrawingToolOperationBtnContainer\" name=\"ok\" title=\"确定返回结果\">确定</div>"
			+ "</div>"
			+ "</div>";
		return html;
	}

	this.hideS3d2DUIs = function (){
		thatS3dPathDrawingTool.s3dUI2DVisibilities = thatS3dPathDrawingTool.manager.getUI2DPlugVisibilities();
		let needChangeVisibilities = [];
		for(let i = 0; i < thatS3dPathDrawingTool.s3dUI2DVisibilities.length; i++){
			let visibility = thatS3dPathDrawingTool.s3dUI2DVisibilities[i];
			if(visibility.visible){
				needChangeVisibilities.push({
					name: visibility.name,
					visible: false
				});
			}
		}
		thatS3dPathDrawingTool.manager.setUI2DPlugVisibilities(needChangeVisibilities);
	}

	this.showS3d2DUIs = function (){
		let needChangeVisibilities = [];
		for(let i = 0; i < thatS3dPathDrawingTool.s3dUI2DVisibilities.length; i++){
			let visibility = thatS3dPathDrawingTool.s3dUI2DVisibilities[i];
			if(visibility.visible){
				needChangeVisibilities.push({
					name: visibility.name,
					visible: true
				});
			}
		}
		thatS3dPathDrawingTool.manager.setUI2DPlugVisibilities(needChangeVisibilities);
	}

	this.cancelAndClose = function (){
		if(msgBox.confirm({info: "确定取消编辑吗?"})){
			thatS3dPathDrawingTool.close();
		}
	}

	this.saveAndClose = function (){
		let pathInfo = thatS3dPathDrawingTool.pathInfo;
		let checked = thatS3dPathDrawingTool.checkIsLoop(pathInfo);
		if(!checked) {
			msgBox.alert({info: "请形成一个封闭的区域"});
		}
		else{
			thatS3dPathDrawingTool.close();

			//更新编辑后的值
			let destInfo = thatS3dPathDrawingTool.pathToDestInfo(pathInfo);
			let newParameters = {
				"点": {
					value: destInfo.pointStr
				},
				"线": {
					value: destInfo.lineStr
				},
				"约束": {
					value: destInfo.constraintStr
				},
				"路径": {
					value: destInfo.pathStr
				}
			};
			thatS3dPathDrawingTool.manager.propertyEditor.beginAddToUndoList(destInfo.id);
			thatS3dPathDrawingTool.manager.viewer.setObjectParameters(destInfo.id, newParameters);
		}
	}

	this.close = function (){
		thatS3dPathDrawingTool.removeDrawingPlane();
		thatS3dPathDrawingTool.removeRootObject3D();
		thatS3dPathDrawingTool.removeHtml();
		thatS3dPathDrawingTool.showS3d2DUIs();

		//转为normal状态
		thatS3dPathDrawingTool.manager.viewer.changeStatus({
			status: s3dViewerStatus.normalView
		});
	}

	this.sourceToPathInfo = function (sourceInfo){
		let pathInfo = {
			id: sourceInfo.id
		};

		//点
		let pointMap = {};
		if(sourceInfo.pointStr != null) {
			let pStrs = sourceInfo.pointStr.split(";");
			for (let i = 0; i < pStrs.length; i++) {
				let pStr = pStrs[i];
				let strs = pStr.split(",");
				let name = strs[0];
				let x = common3DFunction.mm2m(parseFloat(strs[1]));
				let y = common3DFunction.mm2m(parseFloat(strs[2]));
				pointMap[name] = {
					name: name,
					x: x,
					y: y
				};
			}
		}
		pathInfo.pointMap = pointMap;

		//线
		let lineMap = {};
		if(sourceInfo.lineStr != null) {
			let lStrs = sourceInfo.lineStr.split(";");
			for (let i = 0; i < lStrs.length; i++) {
				let lStr = lStrs[i];
				let strs = lStr.split(",");
				let name = strs[0];
				let lineType = strs[1];
				switch (lineType) {
					case "segment": {
						let from = strs[2];
						let to = strs[3];
						lineMap[name] = {
							name: name,
							lineType: lineType,
							from: from,
							to: to
						};
						break;
					}
					case "arc": {
						let from = strs[2];
						let to = strs[3];
						let center = strs[4];
						lineMap[name] = {
							name: name,
							lineType: lineType,
							from: from,
							to: to,
							center: center,
							middlePoint: null
						};
						break;
					}
				}
			}
		}
		pathInfo.lineMap = lineMap;

		//约束
		let constraintMap = {};
		if(sourceInfo.constraintStr != null) {
			let constraintStrs = sourceInfo.constraintStr.split(";");
			for (let i = 0; i < constraintStrs.length; i++) {
				let cStr = constraintStrs[i];
				let strs = cStr.split(",");
				let name = strs[0];
				let constraintType = strs[1];
				let from = strs[2];
				let to = strs[3];
				let value = null;
				switch (constraintType) {
					case "distance": {
						value = common3DFunction.mm2m(parseFloat(strs[4]));
						break;
					}
					case "angle": {
						value = 180 * parseFloat(strs[4]) / Math.PI;
						break;
					}
					case "parallel": {
						break;
					}
				}
				constraintMap[name] = {
					name: name,
					constraintType: constraintType,
					from: from,
					to: to,
					value: value
				};
			}
		}
		pathInfo.constraintMap = constraintMap;

		return pathInfo;
	}

	this.pathToDestInfo = function (pathInfo){
		return {
			id: pathInfo.id,
			pointStr: thatS3dPathDrawingTool.pointMapToStr(pathInfo),
			lineStr: thatS3dPathDrawingTool.lineMapToStr(pathInfo),
			constraintStr: thatS3dPathDrawingTool.constraintMapToStr(pathInfo),
			pathStr:  thatS3dPathDrawingTool.pathInfoToStr(pathInfo)
		};
	}

	this.initDrawingPlane = function (){
		//比原有尺寸扩大倍数
		let planeScale = 2.5;
		let axisInfo = thatS3dPathDrawingTool.manager.s3dObject.axis;
		let xCenter = 0;
		let zCenter = 0;
		let sizeX = axisInfo.size.x;
		let sizeZ = axisInfo.size.z;
		let planeGeometry = new THREE.PlaneGeometry(sizeX * planeScale, sizeZ * planeScale);
		let plane = new THREE.Mesh(planeGeometry, thatS3dPathDrawingTool.planeMaterial);
		plane.rotation.x = -0.5 * Math.PI;
		plane.position.set(xCenter, thatS3dPathDrawingTool.planeZero, zCenter);

		plane.receiveShadow = false;
		plane.isDrawingToolPlane = true;
		plane.isUserLayer = true;
		thatS3dPathDrawingTool.manager.viewer.scene.add(plane);
	}

	this.initRootObject3D = function(){
		let rootObject3D = new THREE.Group();
		rootObject3D.isPathRootObject = true;
		rootObject3D.position.set(0, 0, 0);
		thatS3dPathDrawingTool.manager.viewer.scene.add(rootObject3D);
		thatS3dPathDrawingTool.rootObject3D = rootObject3D;
	}

	this.removeDrawingPlane = function (){
		let viewer = thatS3dPathDrawingTool.manager.viewer;
		let oldPlane = null;
		for(let i = 0; i <  viewer.scene.children.length; i++){
			let object3D = viewer.scene.children[i];
			if(object3D.isDrawingToolPlane){
				oldPlane = object3D;
			}
		}
		if(oldPlane != null){
			viewer.scene.remove(oldPlane);
		}
	}

	this.removeRootObject3D = function (){
		let viewer = thatS3dPathDrawingTool.manager.viewer;
		let rootObject3D = null;
		for(let i = 0; i <  viewer.scene.children.length; i++){
			let object3D = viewer.scene.children[i];
			if(object3D.isPathRootObject){
				rootObject3D = object3D;
			}
		}
		if(rootObject3D != null){
			viewer.scene.remove(rootObject3D);
		}
	}

	this.initLayout = function (pathInfo){
		thatS3dPathDrawingTool.initGraph(pathInfo);
		thatS3dPathDrawingTool.initTable(pathInfo);
	}

	this.initGraph = function(pathInfo){
		thatS3dPathDrawingTool.initPointGraph(pathInfo);
		thatS3dPathDrawingTool.initLineGraph(pathInfo);
		thatS3dPathDrawingTool.initConstraintGraph(pathInfo);
	}

	this.initPointGraph = function (pathInfo){
		for(let id in pathInfo.pointMap){
			let pointInfo = pathInfo.pointMap[id];
			let object3D = thatS3dPathDrawingTool.createPointObject3D(pointInfo);
			thatS3dPathDrawingTool.rootObject3D.add(object3D);
		}
	}

	this.createPointObject3D = function (pointInfo){
		let pointGeometry = new THREE.BoxGeometry(thatS3dPathDrawingTool.pointSize, thatS3dPathDrawingTool.pointSize, thatS3dPathDrawingTool.pointSize);
		let pointObject3D = new THREE.Mesh(pointGeometry, thatS3dPathDrawingTool.pointMaterial);
		pointObject3D.position.set(pointInfo.x, thatS3dPathDrawingTool.unitZero, pointInfo.y);
		pointObject3D.userData.info = {
			name: pointInfo.name,
			type: "point",
			pointInfo: pointInfo
		};
		return pointObject3D;
	}

	this.initLineGraph = function (pathInfo){
		for(let id in pathInfo.lineMap){
			let lineInfo = pathInfo.lineMap[id];
			let object3D = thatS3dPathDrawingTool.createLineObject3D(lineInfo, pathInfo);
			thatS3dPathDrawingTool.rootObject3D.add(object3D);

			let tagObject3D = thatS3dPathDrawingTool.createLineTagObject3D(lineInfo, pathInfo);
			if(tagObject3D != null) {
				thatS3dPathDrawingTool.rootObject3D.add(tagObject3D);
			}

		}
	}

	this.createLineObject3D = function (lineInfo, pathInfo){
		let lineObject3D = null;
		switch(lineInfo.lineType){
			case "segment":{
				lineObject3D = thatS3dPathDrawingTool.createSegmentObject3D(lineInfo, pathInfo);
				break;
			}
			case "arc":{
				lineObject3D = thatS3dPathDrawingTool.createArcObject3D(lineInfo, pathInfo);
				break;
			}
			default:{
				throw "未知的线类型: " + lineInfo.lineType
			}
		}
		return lineObject3D;
	}

	this.calcSegmentPoints = function (fromPointInfo, toPointInfo){
		let points = [];
		points.push( new THREE.Vector3(fromPointInfo.x, thatS3dPathDrawingTool.unitZero, fromPointInfo.y));
		points.push( new THREE.Vector3(toPointInfo.x, thatS3dPathDrawingTool.unitZero, toPointInfo.y));
		return points;
	}

	this.createSegmentObject3D = function (lineInfo, pathInfo){
		let fromPointInfo = pathInfo.pointMap[lineInfo.from];
		let toPointInfo = pathInfo.pointMap[lineInfo.to];
		let points = thatS3dPathDrawingTool.calcSegmentPoints(fromPointInfo, toPointInfo);
		let geometry = new THREE.BufferGeometry().setFromPoints(points);
		let object3D = new THREE.Line(geometry, thatS3dPathDrawingTool.lineMaterial);
		object3D.userData.info = {
			name: lineInfo.name,
			type: "line",
			lineInfo: lineInfo
		};
		return object3D;
	}

	this.calcArcPoint3Ds = function (fromPointInfo, toPointInfo, centerPointInfo){
		if(fromPointInfo == null || toPointInfo == null){
			return [{
				x: centerPointInfo.x,
				y: thatS3dPathDrawingTool.unitZero,
				z: centerPointInfo.y
			}];
		}
		else {
			//因为坐标系问题，开始和结束互换
			let endAngle = common2DLine.getAngle(
				{x: 1, y: 0},
				{x: fromPointInfo.x - centerPointInfo.x, y: fromPointInfo.y - centerPointInfo.y});
			let startAngle = common2DLine.getAngle(
				{x: 1, y: 0},
				{x: toPointInfo.x - centerPointInfo.x, y: toPointInfo.y - centerPointInfo.y});
			if (startAngle > endAngle) {
				endAngle += 2 * Math.PI;
			}

			let radius = common2DLine.getLength(fromPointInfo, centerPointInfo);
			let arcCurve = new THREE.EllipseCurve(centerPointInfo.x, centerPointInfo.y, radius, radius, startAngle, endAngle, true, 0);
			let points = arcCurve.getPoints(100);
			let point3Ds = [];
			for (let i = 0; i < points.length; i++) {
				let point = points[i];
				let point3D = new THREE.Vector3(point.x, thatS3dPathDrawingTool.unitZero, point.y);
				point3Ds.push(point3D);
			}
			return point3Ds;
		}
	}

	this.calcArcRadiusPoints = function (centerPointInfo, arcCenterPoint){
		let points = [];
		points.push(new THREE.Vector3(centerPointInfo.x, thatS3dPathDrawingTool.unitZero, centerPointInfo.y));
		points.push(new THREE.Vector3(arcCenterPoint.x, thatS3dPathDrawingTool.unitZero, arcCenterPoint.y));
		return points;
	}

	this.calcArcRadiusTextPoint = function (centerPointInfo, arcCenterPoint){
		let points = common2DLine.getRightLine(centerPointInfo, arcCenterPoint, thatS3dPathDrawingTool.constraintMarkSize);
		let fromPoint = points[0];
		let toPoint = points[1];
		if(fromPoint == null || toPoint == null){
			return {
				x: centerPointInfo.x,
				y: centerPointInfo.y
			}
		}
		else {
			return {
				x: (fromPoint.x + toPoint.x) / 2,
				y: (fromPoint.y + toPoint.y) / 2,
			};
		}
	}

	this.createArcObject3D = function (lineInfo, pathInfo){
		let fromPointInfo = pathInfo.pointMap[lineInfo.from];
		let toPointInfo = pathInfo.pointMap[lineInfo.to];
		let centerPointInfo = pathInfo.pointMap[lineInfo.center];
		let arcPoint3Ds = thatS3dPathDrawingTool.calcArcPoint3Ds(fromPointInfo, toPointInfo, centerPointInfo);
		let arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoint3Ds);
		let object3D = new THREE.Line(arcGeometry, thatS3dPathDrawingTool.lineMaterial);

		object3D.userData.info = {
			type: "line",
			name: lineInfo.name,
			lineInfo: lineInfo
		};
		return object3D;
	}

	this.createLineTagObject3D = function (lineInfo, pathInfo){
		switch(lineInfo.lineType){
			case "arc":{
				return thatS3dPathDrawingTool.createArcTagObject3D(lineInfo, pathInfo);
				break;
			}
			case "segment":
			default:{
				return null;
			}
		}
	}

	this.createArcTagObject3D = function (lineInfo, pathInfo){
		let fromPointInfo = pathInfo.pointMap[lineInfo.from];
		let toPointInfo = pathInfo.pointMap[lineInfo.to];
		let centerPointInfo = pathInfo.pointMap[lineInfo.center];
		let arcPoint3Ds = thatS3dPathDrawingTool.calcArcPoint3Ds(fromPointInfo, toPointInfo, centerPointInfo);

		let arcCenterPoint3D = arcPoint3Ds[Math.floor(arcPoint3Ds.length / 2)];
		let arcCenterPosition = {
			x: arcCenterPoint3D.x,
			y: arcCenterPoint3D.z
		};
		let radiusLinePoints = thatS3dPathDrawingTool.calcArcRadiusPoints(centerPointInfo, arcCenterPosition);
		let radiusLineGeometry = new THREE.BufferGeometry().setFromPoints(radiusLinePoints);
		let radiusLineObject3D = new THREE.Line(radiusLineGeometry, thatS3dPathDrawingTool.tagLineMaterial);

		let radiusValue = common2DLine.getLength(fromPointInfo, centerPointInfo);
		let textPosition = thatS3dPathDrawingTool.calcArcRadiusTextPoint(centerPointInfo, arcCenterPosition);
		let textYRotation = thatS3dPathDrawingTool.getTextYRotation(centerPointInfo, arcCenterPosition)
		let radiusText = "R:" + cmnPcr.decimalToStr(common3DFunction.m2mm(radiusValue), false, thatS3dPathDrawingTool.positionFixNum);
		let textGeometry = new TextGeometry(radiusText, thatS3dPathDrawingTool.fontConfig);
		let textObject3D = new THREE.Mesh(textGeometry, thatS3dPathDrawingTool.tagTextMaterial);
		textObject3D.rotation.set(-Math.PI / 2, 0, 0);
		let radiusTextObject3D = new THREE.Object3D();
		radiusTextObject3D.add(textObject3D);
		radiusTextObject3D.position.set(textPosition.x, thatS3dPathDrawingTool.unitZero, textPosition.y);
		radiusTextObject3D.rotation.set(0, textYRotation, 0);

		let object3D = new THREE.Object3D();
		object3D.add(radiusLineObject3D);
		object3D.add(radiusTextObject3D);

		object3D.userData.info = {
			isTag: true,
			name: lineInfo.name
		};
		return object3D;
	}

	this.initConstraintGraph = function (pathInfo){
		for(let id in pathInfo.constraintMap){
			let constraintInfo = pathInfo.constraintMap[id];
			let object3D = thatS3dPathDrawingTool.createConstraintObject3D(constraintInfo, pathInfo);
			thatS3dPathDrawingTool.rootObject3D.add(object3D);
		}
	}

	this.createConstraintObject3D = function(constraintInfo, pathInfo){
		let constraintObject3D = null;
		switch(constraintInfo.constraintType){
			case "distance":{
				constraintObject3D = thatS3dPathDrawingTool.createConstraintDistanceObject3D(constraintInfo, pathInfo);
				break;
			}
			case "horizontal":{
				constraintObject3D = thatS3dPathDrawingTool.createConstraintHorizontalObject3D(constraintInfo, pathInfo);
				break;
			}
			case "vertical":{
				constraintObject3D = thatS3dPathDrawingTool.createConstraintVerticalObject3D(constraintInfo, pathInfo);
				break;
			}
			case "angle":{
				constraintObject3D = thatS3dPathDrawingTool.createConstraintAngleObject3D(constraintInfo, pathInfo);
				break;
			}
			case "parallel":{
				constraintObject3D = thatS3dPathDrawingTool.createConstraintParallelObject3D(constraintInfo, pathInfo);
				break;
			}
			default:{
				throw "未知的约束类型: " + constraintInfo.constraintType
			}
		}
		return constraintObject3D;
	}

	this.getConstraintDistancePositions = function (constraintInfo, pathInfo){
		let lineInfo = pathInfo.lineMap[constraintInfo.from];
		let fromPointObject3D = thatS3dPathDrawingTool.getPathObjectByName(lineInfo.from);
		let toPointObject3D = thatS3dPathDrawingTool.getPathObjectByName(lineInfo.to);

		let positions = common2DLine.getRightLine({
			x: fromPointObject3D.position.x,
			y: fromPointObject3D.position.z
		},{
			x: toPointObject3D.position.x,
			y: toPointObject3D.position.z
		}, thatS3dPathDrawingTool.constraintMarkSize);

		if(positions[0] == null && positions[1] == null){
			positions = [{
				x: fromPointObject3D.position.x,
				y: fromPointObject3D.position.z
			},{
				x: toPointObject3D.position.x,
				y: toPointObject3D.position.z
			}];
		}
		return positions;
	}

	this.getConstraintHVPositions = function (constraintInfo, pathInfo){
		let lineInfo = pathInfo.lineMap[constraintInfo.from];
		let fromPointObject3D = thatS3dPathDrawingTool.getPathObjectByName(lineInfo.from);
		let toPointObject3D = thatS3dPathDrawingTool.getPathObjectByName(lineInfo.to);

		let positions = common2DLine.getRightLine({
			x: fromPointObject3D.position.x,
			y: fromPointObject3D.position.z
		},{
			x: toPointObject3D.position.x,
			y: toPointObject3D.position.z
		}, -thatS3dPathDrawingTool.constraintMarkSize);

		if(positions[0] == null && positions[1] == null){
			positions = [{
				x: fromPointObject3D.position.x,
				y: fromPointObject3D.position.z
			},{
				x: toPointObject3D.position.x,
				y: toPointObject3D.position.z
			}];
		}
		return positions;
	}

	this.getConstraintParallelPositions = function (constraintInfo, pathInfo){
		let fromLineInfo = pathInfo.lineMap[constraintInfo.from];
		let fromLineFromPointObject3D = thatS3dPathDrawingTool.getPathObjectByName(fromLineInfo.from);
		let fromLineToObject3D = thatS3dPathDrawingTool.getPathObjectByName(fromLineInfo.to);

		let toLineInfo = pathInfo.lineMap[constraintInfo.to];
		let toLineFromPointObject3D = thatS3dPathDrawingTool.getPathObjectByName(toLineInfo.from);
		let toLineToObject3D = thatS3dPathDrawingTool.getPathObjectByName(toLineInfo.to);
		return  [{
			x: fromLineFromPointObject3D.position.x,
			y: fromLineFromPointObject3D.position.z
		},{
			x: fromLineToObject3D.position.x,
			y: fromLineToObject3D.position.z
		},{
			x: toLineFromPointObject3D.position.x,
			y: toLineFromPointObject3D.position.z
		},{
			x: toLineToObject3D.position.x,
			y: toLineToObject3D.position.z
		}];
	}

	this.getTextYRotation = function(fromPosition, toPosition){
		let yRotate = common2DLine.getAngle(
			{x: 1, y: 0},
			{x: toPosition.x - fromPosition.x, y: toPosition.y - fromPosition.y}
		);
		if(yRotate > Math.PI * 3 / 2){
			yRotate = -yRotate;
		}
		else if(yRotate > Math.PI){
			yRotate = Math.PI - yRotate;
		}
		else if(yRotate >= Math.PI / 2){
			yRotate = Math.PI - yRotate;
		}
		else{
			yRotate = -yRotate;
		}
		return yRotate;
	}

	this.createConstraintDistanceObject3D = function (constraintInfo, pathInfo){
		let text = cmnPcr.decimalToStr(common3DFunction.m2mm(constraintInfo.value), false, thatS3dPathDrawingTool.positionFixNum);
		let textGeometry = new TextGeometry(text, thatS3dPathDrawingTool.fontConfig);
		let textObject3D = new THREE.Mesh(textGeometry, thatS3dPathDrawingTool.constraintTextMaterial);
		textObject3D.rotation.set(-Math.PI / 2, 0, 0);

		let textBox = new THREE.Box3().setFromObject(textObject3D);
		textObject3D.position.set(-(textBox.max.x + textBox.min.x) / 2, -(textBox.max.y + textBox.min.y) / 2, -(textBox.max.z + textBox.min.z) / 2);
		let object3D = new THREE.Object3D();
		object3D.add(textObject3D);

		let positions = thatS3dPathDrawingTool.getConstraintDistancePositions(constraintInfo, pathInfo);
		let fromPosition = positions[0];
		let toPosition = positions[1];
		object3D.position.set((fromPosition.x + toPosition.x) / 2, thatS3dPathDrawingTool.unitZero, (fromPosition.y + toPosition.y) / 2);

		let yRotate = thatS3dPathDrawingTool.getTextYRotation(fromPosition, toPosition);
		object3D.rotation.set(0, yRotate, 0);

		object3D.userData.info = {
			name: constraintInfo.name,
			type: "constraint",
			constraintInfo: constraintInfo
		};
		return object3D;
	}

	this.createConstraintHorizontalObject3D = function (constraintInfo, pathInfo){
		let text = "H";
		let textGeometry = new TextGeometry(text, thatS3dPathDrawingTool.fontConfig);
		let textObject3D = new THREE.Mesh(textGeometry, thatS3dPathDrawingTool.constraintTextMaterial);
		textObject3D.rotation.set(-Math.PI / 2, 0, 0);

		let textBox = new THREE.Box3().setFromObject(textObject3D);
		textObject3D.position.set(-(textBox.max.x + textBox.min.x) / 2, -(textBox.max.y + textBox.min.y) / 2, -(textBox.max.z + textBox.min.z) / 2);
		let object3D = new THREE.Object3D();
		object3D.add(textObject3D);

		let positions = thatS3dPathDrawingTool.getConstraintHVPositions(constraintInfo, pathInfo);
		let fromPosition = positions[0];
		let toPosition = positions[1];
		object3D.position.set((fromPosition.x + toPosition.x) / 2, thatS3dPathDrawingTool.unitZero, (fromPosition.y + toPosition.y) / 2);

		object3D.userData.info = {
			name: constraintInfo.name,
			type: "constraint",
			constraintInfo: constraintInfo
		};
		return object3D;
	}


	this.createConstraintVerticalObject3D = function (constraintInfo, pathInfo){
		let text = "V";
		let textGeometry = new TextGeometry(text, thatS3dPathDrawingTool.fontConfig);
		let textObject3D = new THREE.Mesh(textGeometry, thatS3dPathDrawingTool.constraintTextMaterial);
		textObject3D.rotation.set(-Math.PI / 2, 0, 0);

		let textBox = new THREE.Box3().setFromObject(textObject3D);
		textObject3D.position.set(-(textBox.max.x + textBox.min.x) / 2, -(textBox.max.y + textBox.min.y) / 2, -(textBox.max.z + textBox.min.z) / 2);
		let object3D = new THREE.Object3D();
		object3D.add(textObject3D);

		let positions = thatS3dPathDrawingTool.getConstraintHVPositions(constraintInfo, pathInfo);
		let fromPosition = positions[0];
		let toPosition = positions[1];
		object3D.position.set((fromPosition.x + toPosition.x) / 2, thatS3dPathDrawingTool.unitZero, (fromPosition.y + toPosition.y) / 2);

		object3D.userData.info = {
			name: constraintInfo.name,
			type: "constraint",
			constraintInfo: constraintInfo
		};
		return object3D;
	}

	this.getAnglePointsByTwoLines = function (fromLineName, toLineName, pathInfo){
		let fromLineInfo = pathInfo.lineMap[fromLineName];
		let toLineInfo = pathInfo.lineMap[toLineName];
		let fromLineFromPointObject3D = thatS3dPathDrawingTool.getPathObjectByName(fromLineInfo.from);
		let fromLineToPointObject3D = thatS3dPathDrawingTool.getPathObjectByName(fromLineInfo.to);
		let toLineFromPointObject3D = thatS3dPathDrawingTool.getPathObjectByName(toLineInfo.from);
		let toLineToPointObject3D = thatS3dPathDrawingTool.getPathObjectByName(toLineInfo.to);

		let centerPoint = null;
		let lineAPoint = null;
		let lineBPoint = null;

		if(common3DFunction.checkSamePoint(fromLineFromPointObject3D.position, toLineFromPointObject3D.position)){
			centerPoint = {
				x: fromLineFromPointObject3D.position.x,
				y: fromLineFromPointObject3D.position.z,
			};
			lineAPoint = {
				x: fromLineToPointObject3D.position.x,
				y: fromLineToPointObject3D.position.z,
			};
			lineBPoint = {
				x: toLineToPointObject3D.position.x,
				y: toLineToPointObject3D.position.z,
			};
		}
		else if(common3DFunction.checkSamePoint(fromLineToPointObject3D.position, toLineFromPointObject3D.position)){
			centerPoint = {
				x: fromLineToPointObject3D.position.x,
				y: fromLineToPointObject3D.position.z,
			};
			lineAPoint = {
				x: fromLineFromPointObject3D.position.x,
				y: fromLineFromPointObject3D.position.z,
			};
			lineBPoint = {
				x: toLineToPointObject3D.position.x,
				y: toLineToPointObject3D.position.z,
			};
		}
		else if(common3DFunction.checkSamePoint(fromLineToPointObject3D.position, toLineToPointObject3D.position)){
			centerPoint = {
				x: fromLineToPointObject3D.position.x,
				y: fromLineToPointObject3D.position.z,
			};
			lineAPoint = {
				x: fromLineFromPointObject3D.position.x,
				y: fromLineFromPointObject3D.position.z,
			};
			lineBPoint = {
				x: toLineFromPointObject3D.position.x,
				y: toLineFromPointObject3D.position.z,
			};
		}
		else if(common3DFunction.checkSamePoint(fromLineFromPointObject3D.position, toLineToPointObject3D.position)){
			centerPoint = {
				x: fromLineFromPointObject3D.position.x,
				y: fromLineFromPointObject3D.position.z,
			};
			lineAPoint = {
				x: fromLineToPointObject3D.position.x,
				y: fromLineToPointObject3D.position.z,
			};
			lineBPoint = {
				x: toLineFromPointObject3D.position.x,
				y: toLineFromPointObject3D.position.z,
			};
		}
		else{
			centerPoint = null;
			lineAPoint = null;
			lineBPoint = null;
		}
		if(centerPoint == null){
			return {
				center: centerPoint,
				from: lineAPoint,
				to: lineBPoint
			};
		}
		else {
			return {
				center: centerPoint,
				from: common2DLine.getPointInLine(centerPoint, lineAPoint, thatS3dPathDrawingTool.constraintMarkSize),
				to: common2DLine.getPointInLine(centerPoint, lineBPoint, thatS3dPathDrawingTool.constraintMarkSize)
			};
		}
	}

	this.getAnglePointNamesByTwoLines = function (fromLineName, toLineName, pathInfo){
		let fromLineInfo = pathInfo.lineMap[fromLineName];
		let toLineInfo = pathInfo.lineMap[toLineName];
		let fromLineFromPointInfo = pathInfo.pointMap[fromLineInfo.from];
		let fromLineToPointInfo = pathInfo.pointMap[fromLineInfo.to];
		let toLineFromPointInfo = pathInfo.pointMap[toLineInfo.from];
		let toLineToPointInfo = pathInfo.pointMap[toLineInfo.to];

		let centerPointName = null;
		let lineAPointName = null;
		let lineBPointName = null;

		if(common3DFunction.checkSamePoint(fromLineFromPointInfo, toLineFromPointInfo)){
			centerPointName = fromLineFromPointInfo.name;
			lineAPointName = fromLineToPointInfo.name;
			lineBPointName = toLineToPointInfo.name;
		}
		else if(common3DFunction.checkSamePoint(fromLineToPointInfo, toLineFromPointInfo)){
			centerPointName = fromLineToPointInfo.name;
			lineAPointName = fromLineFromPointInfo.name;
			lineBPointName = toLineToPointInfo.name;
		}
		else if(common3DFunction.checkSamePoint(fromLineToPointInfo, toLineToPointInfo)){
			centerPointName = fromLineToPointInfo.name;
			lineAPointName = fromLineFromPointInfo.name;
			lineBPointName = toLineFromPointInfo.name;
		}
		else if(common3DFunction.checkSamePoint(fromLineFromPointInfo, toLineToPointInfo)){
			centerPointName = fromLineFromPointInfo.name;
			lineAPointName = fromLineToPointInfo.name;
			lineBPointName = toLineFromPointInfo.name;
		}
		else{
			centerPointName = null;
			lineAPointName = null;
			lineBPointName = null;
		}
		return {
			center: centerPointName,
			from: lineAPointName,
			to: lineBPointName
		};
	}

	this.getConstraintAngleTextPosition = function (anglePointInfo, angleArcPoint3Ds){
		let arcCenterPoint3D = angleArcPoint3Ds[Math.floor(angleArcPoint3Ds.length / 2)];
		if(common2DLine.checkSamePoint(anglePointInfo.center, {
			x: arcCenterPoint3D.x,
			y: arcCenterPoint3D.z
		})){
			return {
				x: anglePointInfo.x,
				y: anglePointInfo.y
			};
		}
		else {
			return common2DLine.getPointInLine(anglePointInfo.center, {
				x: arcCenterPoint3D.x,
				y: arcCenterPoint3D.z
			}, thatS3dPathDrawingTool.constraintMarkSize * 2);
		}
	}


	this.createConstraintAngleObject3D = function (constraintInfo, pathInfo){
		let anglePointInfo = thatS3dPathDrawingTool.getAnglePointsByTwoLines(constraintInfo.from, constraintInfo.to, pathInfo);
		let angleArcPoint3Ds = thatS3dPathDrawingTool.calcArcPoint3Ds(anglePointInfo.from, anglePointInfo.to, anglePointInfo.center);
		let angleArcGeometry = new THREE.BufferGeometry().setFromPoints(angleArcPoint3Ds);
		let angleArcObject3D = new THREE.Line(angleArcGeometry, thatS3dPathDrawingTool.constraintLineMaterial);

		let text = cmnPcr.decimalToStr(constraintInfo.value, false, thatS3dPathDrawingTool.angleFixNum) + "°";
		let textGeometry = new TextGeometry(text, thatS3dPathDrawingTool.fontConfig);
		let textObject3D = new THREE.Mesh(textGeometry, thatS3dPathDrawingTool.constraintTextMaterial);
		textObject3D.rotation.set(-Math.PI / 2, 0, 0);
		let textBox = new THREE.Box3().setFromObject(textObject3D);
		textObject3D.position.set(-(textBox.max.x + textBox.min.x) / 2, -(textBox.max.y + textBox.min.y) / 2, -(textBox.max.z + textBox.min.z) / 2);

		let angleTextObject3D = new THREE.Object3D();
		angleTextObject3D.add(textObject3D);
		let angleTextPosition = thatS3dPathDrawingTool.getConstraintAngleTextPosition(anglePointInfo, angleArcPoint3Ds);
		angleTextObject3D.position.set(angleTextPosition.x, thatS3dPathDrawingTool.unitZero, angleTextPosition.y);


		let object3D = new THREE.Object3D();
		object3D.add(angleTextObject3D);
		object3D.add(angleArcObject3D);

		object3D.userData.info = {
			name: constraintInfo.name,
			type: "constraint",
			constraintInfo: constraintInfo
		};
		return object3D;
	}

	this.createConstraintParallelObject3D = function (constraintInfo, pathInfo){
		let text ="—";
		let textGeometry = new TextGeometry(text, thatS3dPathDrawingTool.fontConfig);
		let textObject3D = new THREE.Mesh(textGeometry, thatS3dPathDrawingTool.constraintTextMaterial);
		textObject3D.rotation.set(-Math.PI / 2, 0, 0);

		let textBox = new THREE.Box3().setFromObject(textObject3D);
		let textUpObject3D = textObject3D;
		let textDownObject3D = textObject3D.clone();
		textUpObject3D.position.set(-(textBox.max.x + textBox.min.x) / 2, -(textBox.max.y + textBox.min.y) / 2, -(textBox.max.z + textBox.min.z) / 2 - thatS3dPathDrawingTool.constraintMarkSize / 4);
		textDownObject3D.position.set(-(textBox.max.x + textBox.min.x) / 2, -(textBox.max.y + textBox.min.y) / 2, -(textBox.max.z + textBox.min.z) / 2 + thatS3dPathDrawingTool.constraintMarkSize / 4);
		let parallelFromObject3D = new THREE.Object3D();
		parallelFromObject3D.add(textUpObject3D);
		parallelFromObject3D.add(textDownObject3D);

		let positions = thatS3dPathDrawingTool.getConstraintParallelPositions(constraintInfo, pathInfo);
		let fromTopPosition = positions[0];
		let toTopPosition = positions[1];
		parallelFromObject3D.position.set((fromTopPosition.x + toTopPosition.x) / 2, thatS3dPathDrawingTool.unitZero, (fromTopPosition.y + toTopPosition.y) / 2);
		let yFromRotate = -common2DLine.getAngle(
			{x: 1, y: 0},
			{x: fromTopPosition.x - toTopPosition.x, y: fromTopPosition.y - toTopPosition.y}
		);
		parallelFromObject3D.rotation.set(0, yFromRotate, 0);

		let parallelToObject3D = parallelFromObject3D.clone();
		let fromBottomPosition = positions[2];
		let toBottomPosition = positions[3];
		parallelToObject3D.position.set((fromBottomPosition.x + toBottomPosition.x) / 2, thatS3dPathDrawingTool.unitZero, (fromBottomPosition.y + toBottomPosition.y) / 2);
		let yToRotate = -common2DLine.getAngle(
			{x: 1, y: 0},
			{x: fromBottomPosition.x - toBottomPosition.x, y: fromBottomPosition.y - toBottomPosition.y}
		);
		parallelToObject3D.rotation.set(0, yToRotate, 0);

		let object3D = new THREE.Object3D();
		object3D.add(parallelFromObject3D);
		object3D.add(parallelToObject3D);

		object3D.userData.info = {
			name: constraintInfo.name,
			type: "constraint",
			constraintInfo: constraintInfo
		};
		return object3D;
	}

	this.refreshPointTable = function (){
		let pathInfo = thatS3dPathDrawingTool.pathInfo;
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		let pointContainer = $(container).find(".pathDrawingToolPointContainer .pathDrawingToolInnerContainer")[0];
		for(let name in pathInfo.pointMap){
			let pointInfo = pathInfo.pointMap[name];
			let item = $(pointContainer).find(".pathDrawingTableRow[name='" + name + "']")[0];
			$(item).find(".pathDrawingCellInputNumber[name='x']").val(cmnPcr.decimalToStr(common3DFunction.m2mm(pointInfo.x),false, thatS3dPathDrawingTool.positionFixNum));
			$(item).find(".pathDrawingCellInputNumber[name='y']").val(cmnPcr.decimalToStr(common3DFunction.m2mm(pointInfo.y),false, thatS3dPathDrawingTool.positionFixNum));
		}
	}

	this.initTable = function (pathInfo){
		let html = thatS3dPathDrawingTool.getAllTableHtml(pathInfo);
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		$(container).append(html);
		thatS3dPathDrawingTool.refreshInfoItemCount(pathInfo);

		$(container).find(".pathDrawingToolContainer").mousemove(function(ev){
			ev.stopPropagation();
		});

		//绑定事件：点
		for(let name in pathInfo.pointMap){
			thatS3dPathDrawingTool.bindPointItemEvent(name);
		}

		//绑定事件：线
		for(let name in pathInfo.lineMap){
			thatS3dPathDrawingTool.bindLineItemEvent(name);
		}

		//绑定事件：约束
		for(let name in pathInfo.constraintMap){
			thatS3dPathDrawingTool.bindConstraintItemEvent(name);
		}
	}

	this.bindPointItemEvent = function (name){
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		let item = $(container).find(".pathDrawingToolPointContainer").find(".pathDrawingTableRow[name='" + name + "']")[0];

		//按钮事件：删除
		$(item).find(".pathDrawingCellBtn").click(function(){
			let name = $(this).parent().attr("name");
			thatS3dPathDrawingTool.removePathObjects([name], false);
		});

		//编辑坐标
		let positionELements = $(item).find(".pathDrawingCellInputNumber[name='x'], .pathDrawingCellInputNumber[name='y']");
		$(positionELements).focus(function(){
			let item = $(this).parent();
			let name = $(item).attr("name");

			let allPathObjectMap = thatS3dPathDrawingTool.getPathObjectMap();
			for (let objectName in allPathObjectMap) {
				let pathObject = allPathObjectMap[objectName];
				if(name === objectName){
					if(!pathObject.isSelected) {
						thatS3dPathDrawingTool.selectPathObject3D(pathObject);
					}
				}
				else{
					if(pathObject.isSelected) {
						thatS3dPathDrawingTool.unSelectPathObject3D(pathObject);
					}
				}
			}
		});
		$(positionELements).change(function(){
			let item = $(this).parent();
			let name = $(item).attr("name");
			let xValue = cmnPcr.strToDecimal($(item).find(".pathDrawingCellInputNumber[name='x']").val());
			let yValue = cmnPcr.strToDecimal($(item).find(".pathDrawingCellInputNumber[name='y']").val());
			thatS3dPathDrawingTool.movePointByName(name, xValue, yValue);
		});
	}

	//高亮显示线item里的point
	this.highLightLineItemPointByNames = function(pointNameMap){
		let lineNameMap = {};
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		let pathInfo = thatS3dPathDrawingTool.pathInfo;
		for(let lineName in pathInfo.lineMap) {
			let lineInfo = pathInfo.lineMap[lineName];
			let itemRow = $(container).find(".pathDrawingToolLineContainer").find(".pathDrawingTableRow[name='" + lineName + "']")[0];

			let fromCell = $(itemRow).find(".pathDrawingCell[name='from']")[0];
			if(pointNameMap[lineInfo.from]) {
				$(fromCell).addClass("pathDrawingCellNameSelected");
				lineNameMap[lineName] = true;
			}
			else{
				$(fromCell).removeClass("pathDrawingCellNameSelected");
			}

			let toCell = $(itemRow).find(".pathDrawingCell[name='to']")[0];
			if(pointNameMap[lineInfo.to]){
				$(toCell).addClass("pathDrawingCellNameSelected");
				lineNameMap[lineName] = true;
			}
			else{
				$(toCell).removeClass("pathDrawingCellNameSelected");
			}
		}
		return lineNameMap;
	}

	//高亮显示线item里的point
	this.highLightConstraintItemLineByNames = function(lineNameMap){
		let constraintNameMap = {};
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		let pathInfo = thatS3dPathDrawingTool.pathInfo;
		for(let constraintName in pathInfo.constraintMap) {
			let constraintInfo = pathInfo.constraintMap[constraintName];
			let itemRow = $(container).find(".pathDrawingToolConstraintContainer").find(".pathDrawingTableRow[name='" + constraintName + "']")[0];

			let fromCell = $(itemRow).find(".pathDrawingCell[name='from']")[0];
			if(lineNameMap[constraintInfo.from]) {
				$(fromCell).addClass("pathDrawingCellNameSelected");
				constraintNameMap[constraintName] = true;
			}
			else{
				$(fromCell).removeClass("pathDrawingCellNameSelected");
			}

			let toCell = $(itemRow).find(".pathDrawingCell[name='to']")[0];
			if(lineNameMap[constraintInfo.to]){
				$(toCell).addClass("pathDrawingCellNameSelected");
				constraintNameMap[constraintName] = true;
			}
			else{
				$(toCell).removeClass("pathDrawingCellNameSelected");
			}
		}
		return constraintNameMap;
	}

	this.bindLineItemEvent = function (name){
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		let item = $(container).find(".pathDrawingToolLineContainer").find(".pathDrawingTableRow[name='" + name + "']")[0];

		//按钮事件：删除
		$(item).find(".pathDrawingCellBtn").click(function(){
			let name = $(this).parent().attr("name");
			thatS3dPathDrawingTool.removePathObjects([name], false);
		});
	}

	this.bindConstraintItemEvent = function (name){
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		let item = $(container).find(".pathDrawingToolConstraintContainer").find(".pathDrawingTableRow[name='" + name + "']")[0];

		//按钮事件：删除
		$(item).find(".pathDrawingCellBtn").click(function(){
			let name = $(this).parent().attr("name");
			thatS3dPathDrawingTool.removePathObjects([name], false);
		});

		//编辑约束值
		$(item).find(".pathDrawingCellInputNumber[name='value']").change(function(){
			let item = $(this).parent();
			let name = $(item).attr("name");
			let value = cmnPcr.strToDecimal($(item).find(".pathDrawingCellInputNumber[name='value']").val());
			thatS3dPathDrawingTool.changeConstraintValue(name, value);
		});
	}

	this.addToPointTable = function(pointInfo){
		let html = thatS3dPathDrawingTool.getPointHtml(pointInfo);
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		$(container).find(".pathDrawingToolPointContainer .pathDrawingToolInnerContainer").append(html);
		thatS3dPathDrawingTool.bindPointItemEvent(pointInfo.name);
	}

	this.addToLineTable = function(lineInfo){
		let html = thatS3dPathDrawingTool.getLineHtml(lineInfo);
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		$(container).find(".pathDrawingToolLineContainer .pathDrawingToolInnerContainer").append(html);
		thatS3dPathDrawingTool.bindLineItemEvent(lineInfo.name);
	}

	this.addToConstraintTable = function(constraintInfo){
		let html = thatS3dPathDrawingTool.getConstraintHtml(constraintInfo);
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		$(container).find(".pathDrawingToolConstraintContainer .pathDrawingToolInnerContainer").append(html);
		thatS3dPathDrawingTool.bindConstraintItemEvent(constraintInfo.name);
	}

	this.refreshInfoItemCount = function (pathInfo){
		let pointCount = 0;
		for(let name in pathInfo.pointMap){
			pointCount++;
		}
		let lineCount = 0;
		for(let name in pathInfo.lineMap){
			lineCount++;
		}
		let constraintCount = 0;
		for(let name in pathInfo.constraintMap){
			constraintCount++;
		}

		let container = $("#" + thatS3dPathDrawingTool.containerId);
		$(container).find(".pathDrawingToolPointContainer").find(".pathDrawingItemCount").text("(" + pointCount + ")");
		$(container).find(".pathDrawingToolLineContainer").find(".pathDrawingItemCount").text("(" + lineCount + ")");
		$(container).find(".pathDrawingToolConstraintContainer").find(".pathDrawingItemCount").text("(" + constraintCount + ")");
	}

	this.getAllTableHtml = function (pathInfo){
		let html = "<div class=\"pathDrawingToolContainer pathDrawingToolPointContainer\" name=\"point\">"
			+ "<div class=\"pathDrawingToolBackground\"></div>"
			+ "<div class=\"pathDrawingToolHeader\"><div class=\"pathDrawingToolTitle\">点&nbsp;<span class=\"pathDrawingItemCount\"></span></div></div>"
			+ "<div class=\"pathDrawingToolInnerContainer\">"
			+ thatS3dPathDrawingTool.getAllPointHtml(pathInfo)
			+ "</div>"
			+ "</div>"
			+ "<div class=\"pathDrawingToolContainer pathDrawingToolLineContainer\" name=\"line\">"
			+ "<div class=\"pathDrawingToolBackground\"></div>"
			+ "<div class=\"pathDrawingToolHeader\"><div class=\"pathDrawingToolTitle\">线&nbsp;<span class=\"pathDrawingItemCount\"></span></div></div>"
			+ "<div class=\"pathDrawingToolInnerContainer\">"
			+ thatS3dPathDrawingTool.getAllLineHtml(pathInfo)
			+ "</div>"
			+ "</div>"
			+ "<div class=\"pathDrawingToolContainer pathDrawingToolConstraintContainer\" name=\"constraint\">"
			+ "<div class=\"pathDrawingToolBackground\"></div>"
			+ "<div class=\"pathDrawingToolHeader\"><div class=\"pathDrawingToolTitle\">约束&nbsp;<span class=\"pathDrawingItemCount\"></span></div></div>"
			+ "<div class=\"pathDrawingToolInnerContainer\">"
			+ thatS3dPathDrawingTool.getAllConstraintHtml(pathInfo)
			+ "</div>"
			+ "</div>";
		return html;
	}

	this.getAllPointHtml = function (pathInfo){
		let html = "<div class=\"pathDrawingTableHeader\">"
			+ "<div class=\"pathDrawingCell pathDrawingCellName\">名称</div>"
			+ "<div class=\"pathDrawingCell pathDrawingCellString\" style=\"width:74px\">横坐标</div>"
			+ "<div class=\"pathDrawingCell pathDrawingCellString\" style=\"width:74px\">纵坐标</div>"
			+ "<div class=\"pathDrawingCell pathDrawingCellBtnHeader\">操作</div>"
			+ "</div>";
		for(let name in pathInfo.pointMap){
			let pointInfo = pathInfo.pointMap[name];
			html += thatS3dPathDrawingTool.getPointHtml(pointInfo);
		}
		return html;
	}

	this.getPointHtml = function (pointInfo){
		let xValue = cmnPcr.toFixed(common3DFunction.m2mm(pointInfo.x), thatS3dPathDrawingTool.positionFixNum);
		let yValue = cmnPcr.toFixed(common3DFunction.m2mm(pointInfo.y), thatS3dPathDrawingTool.positionFixNum);
		return "<div class=\"pathDrawingTableRow\" name=\"" + pointInfo.name + "\">"
			+ "<div class=\"pathDrawingCell pathDrawingCellName\">" + pointInfo.name + "</div>"
			+ "<input class=\"pathDrawingCell pathDrawingCellInputNumber\" type=\"number\" name=\"x\" value=\"" + xValue + "\"/>"
			+ "<input class=\"pathDrawingCell pathDrawingCellInputNumber\" type=\"number\" name=\"y\" value=\"" + yValue + "\"/>"
			+ "<div class=\"pathDrawingCell pathDrawingCellBtn\" name=\"remove\">×</div>"
			+ "</div>";
	}

	this.getAllLineHtml = function (pathInfo){
		let html = "<div class=\"pathDrawingTableHeader\">"
			+ "<div class=\"pathDrawingCell pathDrawingCellName\">名称</div>"
			+ "<div class=\"pathDrawingCell pathDrawingCellString\">类型</div>"
			+ "<div class=\"pathDrawingCell pathDrawingCellString\">点A</div>"
			+ "<div class=\"pathDrawingCell pathDrawingCellString\">点B</div>"
			+ "<div class=\"pathDrawingCell pathDrawingCellString\">点C</div>"
			+ "<div class=\"pathDrawingCell pathDrawingCellBtnHeader\">操作</div>"
			+ "</div>";
		for(let name in pathInfo.lineMap){
			let lineInfo = pathInfo.lineMap[name];
			html += thatS3dPathDrawingTool.getLineHtml(lineInfo);
		}
		return html;
	}

	this.getLineHtml = function (lineInfo){
		return "<div class=\"pathDrawingTableRow\" name=\"" + lineInfo.name + "\">"
			+ "<div class=\"pathDrawingCell pathDrawingCellName\">" + lineInfo.name + "</div>"
			+ "<div class=\"pathDrawingCell pathDrawingCellString\" name=\"lineType\">" + thatS3dPathDrawingTool.getLineTypeText(lineInfo.lineType) + "</div>"
			+ "<div class=\"pathDrawingCell pathDrawingCellString\" name=\"from\">" + lineInfo.from + "</div>"
			+ "<div class=\"pathDrawingCell pathDrawingCellString\" name=\"to\">" + lineInfo.to + "</div>"
			+ "<div class=\"pathDrawingCell pathDrawingCellString\" name=\"center\">" + (lineInfo.center == null ? "-" : lineInfo.center) + "</div>"
			+ "<div class=\"pathDrawingCell pathDrawingCellBtn\" name=\"remove\">×</div>"
			+ "</div>";
	}

	this.getLineTypeText = function (lineType){
		switch (lineType){
			case "segment":{
				return "线段";
			}
			case "arc":{
				return "弧线";
			}
			default:{
				return "未知";
			}
		}
	}

	this.getAllConstraintHtml = function (pathInfo){
		let html = "<div class=\"pathDrawingTableHeader\">"
			+ "<div class=\"pathDrawingCell pathDrawingCellName\">名称</div>"
			+ "<div class=\"pathDrawingCell pathDrawingCellString\">类型</div>"
			+ "<div class=\"pathDrawingCell pathDrawingCellString\">相关A</div>"
			+ "<div class=\"pathDrawingCell pathDrawingCellString\">相关B</div>"
			+ "<div class=\"pathDrawingCell pathDrawingCellString\" style=\"width:60px\">值</div>"
			+ "<div class=\"pathDrawingCell pathDrawingCellBtnHeader\">操作</div>"
			+ "</div>";
		for(let name in pathInfo.constraintMap){
			let constraintInfo = pathInfo.constraintMap[name];
			html += thatS3dPathDrawingTool.getConstraintHtml(constraintInfo);
		}
		return html;
	}

	this.getConstraintHtml = function (constraintInfo) {
		let value = "";
		switch (constraintInfo.constraintType) {
			case "distance": {
				value = cmnPcr.decimalToStr(common3DFunction.m2mm(constraintInfo.value), false, thatS3dPathDrawingTool.positionFixNum);
				break;
			}
			case "angle": {
				value = cmnPcr.decimalToStr(constraintInfo.value, false, thatS3dPathDrawingTool.angleFixNum);
				break;
			}
			case "parallel":
			default: {
				break;
			}
		}
		let html = "<div class=\"pathDrawingTableRow\" name=\"" + constraintInfo.name + "\">"
		+ "<div class=\"pathDrawingCell pathDrawingCellName\">" + constraintInfo.name + "<span class=\"pathDrawingCellNoneError\">?</span></div>"
		+ "<div class=\"pathDrawingCell pathDrawingCellString\" name=\"constraintType\">" + thatS3dPathDrawingTool.getConstraintTypeText(constraintInfo.constraintType) + "</div>"
		+ "<div class=\"pathDrawingCell pathDrawingCellString\" name=\"from\">" + constraintInfo.from + "</div>"
		+ "<div class=\"pathDrawingCell pathDrawingCellString\" name=\"to\">" + (constraintInfo.to == null ? "-" : constraintInfo.to) + "</div>";

		switch (constraintInfo.constraintType) {
			case "distance": {
				html += ("<input class=\"pathDrawingCell pathDrawingCellInputNumber\" style=\"width:60px\" type=\"number\" name=\"value\" value=\"" + value + "\"/>");
				break;
			}
			case "angle": {
				html += ("<input class=\"pathDrawingCell pathDrawingCellInputNumber\" style=\"width:60px\" type=\"number\" name=\"value\" value=\"" + value + "\"/>");
				break;
			}
			case "horizontal":
			case "vertical":
			case "parallel":
			default: {
				html += ("<div class=\"pathDrawingCell pathDrawingCellString\" name=\"value\" style=\"width:60px\">-</div>");
				break;
			}
		}
		html += ("<div class=\"pathDrawingCell pathDrawingCellBtn\" name=\"remove\">×</div>"
			+ "</div>");
		return html;
	}

	this.getConstraintTypeText = function (constraintType){
		switch (constraintType){
			case "distance":{
				return "长度";
			}
			case "angle":{
				return "角度";
			}
			case "parallel":{
				return "平行";
			}
			case "horizontal":{
				return "水平";
			}
			case "vertical":{
				return "竖直";
			}
			default:{
				return "未知";
			}
		}
	}

	this.clearGraph = function (){
		thatS3dPathDrawingTool.clearPointGraph();
		thatS3dPathDrawingTool.clearLineGraph();
		thatS3dPathDrawingTool.clearConstraintGraph();
	}

	this.clearPointGraph = function (){

	}

	this.clearLineGraph = function (){

	}

	this.clearConstraintGraph = function (){

	}

	this.removeHtml = function (){
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		$(container).find(".pathDrawingToolContainer").remove();
	}

	this.clearTable = function (){
		thatS3dPathDrawingTool.clearPointTable();
		thatS3dPathDrawingTool.clearLineTable();
		thatS3dPathDrawingTool.clearConstraintTable();
	}

	this.clearPointTable = function (){
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		$(container).find(".pathDrawingToolPointContainer .pathDrawingToolInnerContainer").empty();
	}

	this.clearLineTable = function (){
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		$(container).find(".pathDrawingToolLineContainer .pathDrawingToolInnerContainer").empty();
	}

	this.clearConstraintTable = function (){
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		$(container).find(".pathDrawingToolConstraintContainer .pathDrawingToolInnerContainer").empty();
	}

	//找到是否穿透了点或线
	this.getPathObject = function(checkObj){
		while(checkObj.type !== "Scene"){
			if(checkObj.parent.isPathRootObject){
				if(checkObj.visible
				&& checkObj.userData.info != null
				&& (checkObj.userData.info.type === "line" || checkObj.userData.info.type === "point")) {
					return checkObj;
				}
				else{
					return null;
				}
			}
			else{
				checkObj = checkObj.parent;
			}
		}
		return null;
	}

	//使用射线获取穿透的点或线
	this.getPathObjectByRaycaster = function(intersects) {
		if (intersects.length > 0) {
			let index = 0;
			while(index < intersects.length){
				let object3D = thatS3dPathDrawingTool.getPathObject(intersects[index].object);
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

	this.selectPathObject3D = function (object3D){
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		switch(object3D.userData.info.type){
			case "line":{
				object3D.isSelected = true;
				object3D.material = thatS3dPathDrawingTool.selectedLineMaterial;
				break;
			}
			case "point":{
				object3D.isSelected = true;
				object3D.material = thatS3dPathDrawingTool.selectedPointMaterial;
				break;
			}
			case "constraint":
			default: {
				break;
			}
		}
		thatS3dPathDrawingTool.highLightSelectedAndRelated();
	}

	this.unSelectPathObject3D = function (object3D){
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		switch(object3D.userData.info.type){
			case "line":{
				object3D.isSelected = false;
				object3D.material = thatS3dPathDrawingTool.lineMaterial;
				break;
			}
			case "point":{
				object3D.isSelected = false;
				object3D.material = thatS3dPathDrawingTool.pointMaterial;
				break;
			}
			case "constraint":
			default: {
				break;
			}
		}
		thatS3dPathDrawingTool.highLightSelectedAndRelated();
	}

	this.getSelectedLineNameMap = function (){
		let objectMaps = thatS3dPathDrawingTool.getPathObjectMap("line");
		let lineNameMap = {};
		for(let name in objectMaps){
			let pathObject = objectMaps[name];
			if(pathObject.isSelected){
				lineNameMap[name] = true;
			}
		}
		return lineNameMap;
	}

	this.getSelectedPointNameMap = function (){
		let objectMaps = thatS3dPathDrawingTool.getPathObjectMap("point");
		let pointNameMap = {};
		for(let name in objectMaps){
			let pathObject = objectMaps[name];
			if(pathObject.isSelected){
				pointNameMap[name] = true;
			}
		}
		return pointNameMap;
	}

	this.highLightSelectedAndRelated = function () {
		let pathInfo = thatS3dPathDrawingTool.pathInfo;
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		let pointNameMap = thatS3dPathDrawingTool.getSelectedPointNameMap();
		let lineNameMap = thatS3dPathDrawingTool.getSelectedLineNameMap();

		let pointContainer = $(container).find(".pathDrawingToolPointContainer")[0];
		for (let pointName in pathInfo.pointMap) {
			if (pointNameMap[pointName]) {
				$(pointContainer).find(".pathDrawingTableRow[name='" + pointName + "'] .pathDrawingCellName").addClass("pathDrawingCellNameSelected");
			} else {
				$(pointContainer).find(".pathDrawingTableRow[name='" + pointName + "'] .pathDrawingCellName").removeClass("pathDrawingCellNameSelected");
			}
		}

		let lineContainer = $(container).find(".pathDrawingToolLineContainer")[0];
		for (let lineName in pathInfo.lineMap) {
			if (lineNameMap[lineName]) {
				$(lineContainer).find(".pathDrawingTableRow[name='" + lineName + "'] .pathDrawingCellName").addClass("pathDrawingCellNameSelected");
			} else {
				$(lineContainer).find(".pathDrawingTableRow[name='" + lineName + "'] .pathDrawingCellName").removeClass("pathDrawingCellNameSelected");
			}
		}

		thatS3dPathDrawingTool.highLightLineItemPointByNames(pointNameMap);

		thatS3dPathDrawingTool.highLightConstraintItemLineByNames(lineNameMap);
	}

	this.getTagObjectMap = function (){
		let allTagObjectMap = {};
		for(let i = 0; i < thatS3dPathDrawingTool.rootObject3D.children.length; i++){
			let object3D = thatS3dPathDrawingTool.rootObject3D.children[i];
			if(object3D.userData.info != null && object3D.userData.info.isTag) {
				allTagObjectMap[object3D.userData.info.name] = object3D;
			}
		}
		return allTagObjectMap;
	}

	this.getPathObjectMap = function (type){
		let allPathObjectMap = {};
		for(let i = 0; i < thatS3dPathDrawingTool.rootObject3D.children.length; i++){
			let object3D = thatS3dPathDrawingTool.rootObject3D.children[i];
			if(object3D.userData.info != null && object3D.userData.info.type != null) {
				if (type == null || object3D.userData.info.type === type) {
					allPathObjectMap[object3D.userData.info.name] = object3D;
				}
			}
		}
		return allPathObjectMap;
	}

	this.getPathObjectByName = function (name){
		for(let i = 0; i < thatS3dPathDrawingTool.rootObject3D.children.length; i++){
			let object3D = thatS3dPathDrawingTool.rootObject3D.children[i];
			if(object3D.userData.info != null) {
				if (object3D.userData.info.name === name) {
					return object3D;
				}
			}
		}
		return null;
	}

	this.onMouseDown = function (p){
		//设置焦点
		thatS3dPathDrawingTool.manager.viewer.focus();

		//判断是否在绘制
		if(thatS3dPathDrawingTool.checkIsCreating()){
			switch (thatS3dPathDrawingTool.creatingInfo.type){
				case "point":{
					thatS3dPathDrawingTool.endCreating();
					break;
				}
				case "segment":{
					let position3D = thatS3dPathDrawingTool.getPositionOnPlane(p.mousePosition);

					position3D = thatS3dPathDrawingTool.getNearestPosition(position3D, p.event.ctrlKey);

					if(thatS3dPathDrawingTool.creatingInfo.toObject != null){
						//如果这次是确定了终点，那么先完成当前这个线段的绘制
						thatS3dPathDrawingTool.endCreating();

						//再开始绘制下一段线，即连续绘制
						thatS3dPathDrawingTool.beginCreating("segment", {
							x: position3D.x,
							y: position3D.z
						});
					}

					if(thatS3dPathDrawingTool.creatingInfo.toObject == null){
						thatS3dPathDrawingTool.addCreatingToObject({
							x: position3D.x,
							y: position3D.z
						});
						thatS3dPathDrawingTool.addCreatingLineObject(thatS3dPathDrawingTool.creatingInfo.type, {
							x: thatS3dPathDrawingTool.creatingInfo.fromObject.position.x,
							y: thatS3dPathDrawingTool.creatingInfo.fromObject.position.z
						},{
							x: thatS3dPathDrawingTool.creatingInfo.toObject.position.x,
							y: thatS3dPathDrawingTool.creatingInfo.toObject.position.z
						})
					}
					break;
				}
				case "arc":{
					if(thatS3dPathDrawingTool.creatingInfo.toObject == null){
						let position3D = thatS3dPathDrawingTool.getPositionOnPlane(p.mousePosition);
						position3D = thatS3dPathDrawingTool.getNearestPosition(position3D, p.event.ctrlKey);
						thatS3dPathDrawingTool.addCreatingToObject({
							x: position3D.x,
							y: position3D.z
						});
						thatS3dPathDrawingTool.addCreatingLineObject(thatS3dPathDrawingTool.creatingInfo.type, {
							x: thatS3dPathDrawingTool.creatingInfo.fromObject.position.x,
							y: thatS3dPathDrawingTool.creatingInfo.fromObject.position.z
						},{
							x: thatS3dPathDrawingTool.creatingInfo.toObject.position.x,
							y: thatS3dPathDrawingTool.creatingInfo.toObject.position.z
						})
					}
					else{
						thatS3dPathDrawingTool.endCreating();
					}
					break;
				}
			}
		}
		else {
			let object3D = thatS3dPathDrawingTool.getPathObjectByRaycaster(p.intersects);
			if (object3D != null) {
				//如果穿透点或者线，那么执行选中或者取消选中此点
				if (p.event.ctrlKey) {
					if (object3D.isSelected) {
						thatS3dPathDrawingTool.unSelectPathObject3D(object3D);
					} else {
						thatS3dPathDrawingTool.selectPathObject3D(object3D);
					}
				} else {
					if (!object3D.isSelected) {
						let allPathObjectMap = thatS3dPathDrawingTool.getPathObjectMap();
						for (let id in allPathObjectMap) {
							let pathObject = allPathObjectMap[id];
							thatS3dPathDrawingTool.unSelectPathObject3D(pathObject);
						}
						thatS3dPathDrawingTool.selectPathObject3D(object3D);
					}
				}
			}
			else {
				//如果没有穿透任何点或者线，那么取消哦所有选中
				let allPathObjectMap = thatS3dPathDrawingTool.getPathObjectMap();
				for (let id in allPathObjectMap) {
					let pathObject = allPathObjectMap[id];
					thatS3dPathDrawingTool.unSelectPathObject3D(pathObject);
				}
			}
		}
	}

	//获取被选中的构件
	this.getAllSelectedPathObjectNames = function (){
		let names = [];
		let allPathObjectMap = thatS3dPathDrawingTool.getPathObjectMap();
		for (let id in allPathObjectMap) {
			let pathObject = allPathObjectMap[id];
			if(pathObject.isSelected){
				names.push(pathObject.userData.info.name);
			}
		}
		return names;
	}

	//判断是否为新增状态
	this.checkIsCreating = function (){
		return thatS3dPathDrawingTool.creatingInfo.type != null;
	}

	this.onKeyDown = function (p){
		switch(p.event.keyCode){
			case 27:{
				// esc 取消绘制
				thatS3dPathDrawingTool.cancelCreating();
				break;
			}
			case 46:{
				//delete 删除
				thatS3dPathDrawingTool.removeSelectedPathObject();
				break;
			}
		}
	}

	//找到最近的位置
	this.getNearestPosition = function (position3D, ctrlKey, withoutPointName){
		if(ctrlKey){
			return position3D;
		}
		else {
			//先找最近的点
			let allPointObjectMap = thatS3dPathDrawingTool.getPathObjectMap("point");
			let nearestPosition = null;
			let nearestDistance = Number.MAX_VALUE;
			for (let name in allPointObjectMap) {
				if(name !== withoutPointName) {
					let pointObject = allPointObjectMap[name];
					let distance = common2DLine.getLength({
						x: position3D.x,
						y: position3D.z
					}, {
						x: pointObject.position.x,
						y: pointObject.position.z
					});
					if (distance < thatS3dPathDrawingTool.attachSize && nearestDistance > distance) {
						nearestPosition = {
							x: pointObject.position.x,
							y: thatS3dPathDrawingTool.unitZero,
							z: pointObject.position.z
						};
						nearestDistance = distance;
					}
				}
			}

			if (nearestPosition != null) {
				return nearestPosition;
			}
			else {
				//没有找到最近的点，那么根据横纵坐标，分别找x、y的值
				nearestPosition = {
					x: position3D.x,
					y: thatS3dPathDrawingTool.unitZero,
					z: position3D.z
				};
				let nearestXDistance = Number.MAX_VALUE;
				let nearestZDistance = Number.MAX_VALUE;
				if (thatS3dPathDrawingTool.creatingInfo.fromObject != null) {
					let xDistance = Math.abs(thatS3dPathDrawingTool.creatingInfo.fromObject.position.x - position3D.x);
					if (xDistance < thatS3dPathDrawingTool.attachSize && xDistance < nearestXDistance) {
						nearestXDistance = xDistance;
						nearestPosition.x = thatS3dPathDrawingTool.creatingInfo.fromObject.position.x;
					}
					let zDistance = Math.abs(thatS3dPathDrawingTool.creatingInfo.fromObject.position.z - position3D.z);
					if (zDistance < thatS3dPathDrawingTool.attachSize && zDistance < nearestZDistance) {
						nearestZDistance = zDistance;
						nearestPosition.z = thatS3dPathDrawingTool.creatingInfo.fromObject.position.z;
					}
				}

				for (let name in allPointObjectMap) {
					if(name !== withoutPointName) {
						let pointObject = allPointObjectMap[name];
						let xDistance = Math.abs(pointObject.position.x - position3D.x);
						if (xDistance < thatS3dPathDrawingTool.attachSize && xDistance < nearestXDistance) {
							nearestXDistance = xDistance;
							nearestPosition.x = pointObject.position.x;
						}
						let zDistance = Math.abs(pointObject.position.z - position3D.z);
						if (zDistance < thatS3dPathDrawingTool.attachSize && zDistance < nearestZDistance) {
							nearestZDistance = zDistance;
							nearestPosition.z = pointObject.position.z;
						}
					}
				}

				return nearestPosition;
			}
		}
	}

	this.onMouseMove = function (p) {
		if (p.event.buttons & 1) { // 使用位与运算检查左键是否被按下
			thatS3dPathDrawingTool.onMouseDrag(p);
		}
		else{
			if(thatS3dPathDrawingTool.checkIsCreating()){
				let position3D = thatS3dPathDrawingTool.getPositionOnPlane(p.position.to);

				position3D = thatS3dPathDrawingTool.getNearestPosition(position3D, p.event.ctrlKey);

				//正在绘制新的点/线
				switch (thatS3dPathDrawingTool.creatingInfo.type){
					case "point":{
						//正在绘制点
						thatS3dPathDrawingTool.moveCreatingPoint(position3D);
						break;
					}
					case "segment":{
						if(thatS3dPathDrawingTool.creatingInfo.toObject == null){
							//起点还未确定
							thatS3dPathDrawingTool.moveCreatingSegmentFromPoint(position3D);
						}
						else{
							//终点还未确定位置
							thatS3dPathDrawingTool.moveCreatingSegmentToPoint(position3D);
						}
						break;
					}
					case "arc":{
						if(thatS3dPathDrawingTool.creatingInfo.toObject == null){
							//起点还未确定
							thatS3dPathDrawingTool.moveCreatingArcFromPoint(position3D);
						}
						else{
							//终点还未确定位置
							thatS3dPathDrawingTool.moveCreatingArcToPoint(position3D);
						}
						break;
					}
				}
			}
		}
	}

	//移动正在创建的点
	this.moveCreatingPoint = function (position3D){
		thatS3dPathDrawingTool.creatingInfo.fromObject.position.set(position3D.x, thatS3dPathDrawingTool.unitZero, position3D.z);
	}

	//移动正在创建的线段的起点
	this.moveCreatingSegmentFromPoint = function (position3D){
		thatS3dPathDrawingTool.creatingInfo.fromObject.position.set(position3D.x, thatS3dPathDrawingTool.unitZero, position3D.z);
	}

	//移动正在创建的线段的终点和线段
	this.moveCreatingSegmentToPoint = function (position3D) {
		thatS3dPathDrawingTool.creatingInfo.toObject.position.set(position3D.x, thatS3dPathDrawingTool.unitZero, position3D.z);

		let fromPosition3D = thatS3dPathDrawingTool.creatingInfo.fromObject.position;
		let points = thatS3dPathDrawingTool.calcSegmentPoints({
			x: fromPosition3D.x,
			y: fromPosition3D.z
		}, {
			x: position3D.x,
			y: position3D.z
		})
		thatS3dPathDrawingTool.creatingInfo.lineObject.geometry = new THREE.BufferGeometry().setFromPoints(points);
	}

	//移动正在创建的弧线的起点
	this.moveCreatingArcFromPoint = function (position3D){
		thatS3dPathDrawingTool.creatingInfo.fromObject.position.set(position3D.x, thatS3dPathDrawingTool.unitZero, position3D.z);
	}

	//移动正在创建的弧线的终点和弧线（半圆）
	this.moveCreatingArcToPoint = function (position3D){
		thatS3dPathDrawingTool.creatingInfo.toObject.position.set(position3D.x, thatS3dPathDrawingTool.unitZero, position3D.z);

		let fromPosition3D = thatS3dPathDrawingTool.creatingInfo.fromObject.position;
		let points = thatS3dPathDrawingTool.calcArcPoint3Ds({
			x: fromPosition3D.x,
			y: fromPosition3D.z
		}, {
			x: position3D.x,
			y: position3D.z
		}, {
			x: (fromPosition3D.x + position3D.x) / 2,
			y: (fromPosition3D.z + position3D.z) / 2
		})
		thatS3dPathDrawingTool.creatingInfo.lineObject.geometry = new THREE.BufferGeometry().setFromPoints(points);
	}

	this.onMouseDrag = function (p) {
		let ctrlKey = p.event.ctrlKey;
		let allPointObjectMap = thatS3dPathDrawingTool.getPathObjectMap("point");
		let allLineObjectMap = thatS3dPathDrawingTool.getPathObjectMap("line");
		let fromPos = thatS3dPathDrawingTool.getPositionOnPlane(p.position.from);
		let toPos = thatS3dPathDrawingTool.getPositionOnPlane(p.position.to);
		let shiftX = toPos.x - fromPos.x;
		let shiftZ = toPos.z - fromPos.z;

		let absoluteX = null;
		let absoluteZ = null;

		if(!ctrlKey) {
			let movePointCount = 0;
			let moveLineCount = 0;
			let movePointObject = null;
			for (let name in allPointObjectMap) {
				let pointObject = allPointObjectMap[name];
				if (pointObject.isSelected) {
					movePointCount++;
					movePointObject= pointObject;
				}
			}
			for (let name in allLineObjectMap) {
				let lineObject = allLineObjectMap[name];
				if (lineObject.isSelected) {
					moveLineCount++;
				}
			}

			//只移动一个点，没有选中其他的
			if(movePointCount === 1 && moveLineCount === 0) {
				let position3D = thatS3dPathDrawingTool.getPositionOnPlane(p.position.to);

				position3D = thatS3dPathDrawingTool.getNearestPosition(position3D, false, movePointObject.userData.info.name);
				if (position3D != null) {
					absoluteX = position3D.x
					absoluteZ = position3D.z;
				}
			}
		}
		let selectedNameMap = {};
		for(let name in allPointObjectMap) {
			let pointObject = allPointObjectMap[name];
			if (pointObject.isSelected) {
				selectedNameMap[name] = true;
			}
		}
		for(let name in allLineObjectMap) {
			let lineObject = allLineObjectMap[name];
			if (lineObject.isSelected) {
				selectedNameMap[name] = true;
			}
		}

		thatS3dPathDrawingTool.movePath(selectedNameMap, shiftX, shiftZ, absoluteX, absoluteZ, {});
	}

	this.movePointByName = function(pointName, newXmm, newYmm, affectedPointNameMap){
		let selectedNameMap = {};
		selectedNameMap[pointName] = true;
		let object3D = thatS3dPathDrawingTool.getPathObjectByName(pointName);
		let shiftX = common3DFunction.mm2m(newXmm) - object3D.position.x;
		let shiftY = common3DFunction.mm2m(newYmm) - object3D.position.z;
		if(affectedPointNameMap == null){
			affectedPointNameMap = {};
		}
		thatS3dPathDrawingTool.movePath(selectedNameMap, shiftX, shiftY, null ,null, affectedPointNameMap);
	}

	this.movePath = function(selectedNameMap, shiftX, shiftZ, absoluteX, absoluteZ, affectedPointNameMap){
		//获取所有被拖动的点
		let allNeedMovePointMap = {};
		let pathInfo = thatS3dPathDrawingTool.pathInfo;
		let allPointObjectMap = thatS3dPathDrawingTool.getPathObjectMap("point");
		let allLineObjectMap = thatS3dPathDrawingTool.getPathObjectMap("line");
		let allTagObjectMap = thatS3dPathDrawingTool.getTagObjectMap();
		for(let name in allPointObjectMap){
			if(selectedNameMap[name] && !affectedPointNameMap[name]){
				allNeedMovePointMap[name] = true;
			}
		}
		//如果线被选中，那么所有关联的点都要移动
		for(let name in allLineObjectMap){
			let lineObject = allLineObjectMap[name];
			if(selectedNameMap[name] && !affectedPointNameMap[name]) {
				allNeedMovePointMap[lineObject.userData.info.lineInfo.from] = true;
				allNeedMovePointMap[lineObject.userData.info.lineInfo.to] = true;

				switch(lineObject.userData.info.lineInfo.lineType){
					case "arc":{
						allNeedMovePointMap[lineObject.userData.info.lineInfo.center] = true;
						break;
					}
					case "segment":
					default:{
						break;
					}
				}
			}
		}

		//如果弧线的起点+终点、一个端点+圆心被选中，那么这条线关联的点都要移动
		let hasPointAdded = true;
		while(hasPointAdded) {
			hasPointAdded = false;
			for (let name in allLineObjectMap) {
				let lineObject = allLineObjectMap[name];
				switch (lineObject.userData.info.lineInfo.lineType) {
					case "arc": {
						//端点的中心点
						let fromObject = allPointObjectMap[lineObject.userData.info.lineInfo.from];
						let toObject = allPointObjectMap[lineObject.userData.info.lineInfo.to];
						lineObject.userData.info.middlePoint = {
							x: (fromObject.position.x + toObject.position.x) / 2,
							y: (fromObject.position.y + toObject.position.y) / 2,
							z: (fromObject.position.z + toObject.position.z) / 2
						}

						if ((allNeedMovePointMap[lineObject.userData.info.lineInfo.from] && allNeedMovePointMap[lineObject.userData.info.lineInfo.to])
							|| (allNeedMovePointMap[lineObject.userData.info.lineInfo.center] && allNeedMovePointMap[lineObject.userData.info.lineInfo.from])
							|| (allNeedMovePointMap[lineObject.userData.info.lineInfo.center] && allNeedMovePointMap[lineObject.userData.info.lineInfo.to])) {
							if(!allNeedMovePointMap[lineObject.userData.info.lineInfo.center]){
								allNeedMovePointMap[lineObject.userData.info.lineInfo.center] = true;
								hasPointAdded = true;
							}
							if(!allNeedMovePointMap[lineObject.userData.info.lineInfo.from]){
								allNeedMovePointMap[lineObject.userData.info.lineInfo.from] = true;
								hasPointAdded = true;
							}
							if(!allNeedMovePointMap[lineObject.userData.info.lineInfo.to]){
								allNeedMovePointMap[lineObject.userData.info.lineInfo.to] = true;
								hasPointAdded = true;
							}
						}
						break;
					}
					case "segment":
					default: {
						break;
					}
				}
			}
		}

		//统计需要移动的点的个数
		let needMovePointCount = 0;
		for(let name in allNeedMovePointMap){
			needMovePointCount++;
		}

		//执行移动
		if(needMovePointCount > 0) {
			//移动点
			if(needMovePointCount === 1 && absoluteX != null && absoluteZ != null) {
				let movePointObject = null;
				for (let name in allPointObjectMap) {
					let pointObject = allPointObjectMap[name];
					if (selectedNameMap[name]) {
						movePointObject= pointObject;
					}
				}
				movePointObject.position.set(absoluteX, movePointObject.position.y, absoluteZ);
			}
			else{
				for (let name in allNeedMovePointMap) {
					let pointObject = allPointObjectMap[name];
					pointObject.position.set(pointObject.position.x + shiftX, pointObject.position.y, pointObject.position.z + shiftZ);
				}
			}

			for(let name in allLineObjectMap) {
				let lineObject = allLineObjectMap[name];
				if (lineObject.userData.info.lineInfo.lineType === "arc"
				&& !(allNeedMovePointMap[lineObject.userData.info.lineInfo.center]
						&& allNeedMovePointMap[lineObject.userData.info.lineInfo.from]
						&& allNeedMovePointMap[lineObject.userData.info.lineInfo.to])) {

					let fromObject = allPointObjectMap[lineObject.userData.info.lineInfo.from];
					let toObject = allPointObjectMap[lineObject.userData.info.lineInfo.to];
					let centerObject = allPointObjectMap[lineObject.userData.info.lineInfo.center];
					let centerPoint = {
						x: centerObject.position.x,
						y: centerObject.position.z
					};
					let fromPoint = {
						x: fromObject.position.x,
						y: fromObject.position.z
					};
					let toPoint = {
						x: toObject.position.x,
						y: toObject.position.z
					};
					let middlePoint ={
						x: lineObject.userData.info.middlePoint.x,
						y: lineObject.userData.info.middlePoint.z
					};

					if(allNeedMovePointMap[lineObject.userData.info.lineInfo.center]){
						//如果移动了圆心，两个端点没有移动，那么围绕端点的中点旋转两个端点
						let distance = common2DLine.getLength(fromPoint, middlePoint);
						let points = common2DLine.findPointsAtDistance(middlePoint, centerPoint, distance);
						if(points != null){
							//根据新生成的点，用近的新新点替换旧点
							if(common2DLine.getLength(fromPoint, points[0]) < common2DLine.getLength(fromPoint, points[1])) {
								fromObject.position.set(points[0].x, fromObject.position.y, points[0].y);
								toObject.position.set(points[1].x, fromObject.position.y, points[1].y);
							}
							else{
								fromObject.position.set(points[1].x, fromObject.position.y, points[1].y);
								toObject.position.set(points[0].x, fromObject.position.y, points[0].y);
							}
						}
						allNeedMovePointMap[lineObject.userData.info.lineInfo.from] = true;
						allNeedMovePointMap[lineObject.userData.info.lineInfo.to] = true;
					}
					else{
						//如果弧线上仅移动了一个端点，圆心和另外一个端点没有移动，那么对称移动另外一个端点
						if(allNeedMovePointMap[lineObject.userData.info.lineInfo.from]){
							let point = common2DLine.mirrorPointAcrossLine(fromPoint, middlePoint, centerPoint);
							toObject.position.set(point.x, fromObject.position.y, point.y);
							allNeedMovePointMap[lineObject.userData.info.lineInfo.to] = true;
						}
						else{
							let point = common2DLine.mirrorPointAcrossLine(toPoint, middlePoint, centerPoint);
							fromObject.position.set(point.x, fromObject.position.y, point.y);
							allNeedMovePointMap[lineObject.userData.info.lineInfo.from] = true;
						}
					}
				}
			}

			//更新一下pathInfo里的point的信息
			for(let pointName in allNeedMovePointMap){
				let pointObject = allPointObjectMap[pointName];
				let pointInfo = pathInfo.pointMap[pointName];
				pointInfo.x = pointObject.position.x;
				pointInfo.y = pointObject.position.z;
			}

			//按照约束，重新计算点的位置
			thatS3dPathDrawingTool.reCalcPointsByConstraints(pathInfo, allPointObjectMap, selectedNameMap, affectedPointNameMap);

			//显示约束错误
			let errorConstraintNameMap = thatS3dPathDrawingTool.checkAllConstraintEffective();
			thatS3dPathDrawingTool.showConstraintErrors(errorConstraintNameMap);

			//遍历所有的线，如果有关联，那么移动线
			let allNeedMoveLineMap = {};
			for(let name in allLineObjectMap) {
				let lineObject = allLineObjectMap[name];
				allTagObjectMap = thatS3dPathDrawingTool.getTagObjectMap();
				switch (lineObject.userData.info.lineInfo.lineType) {
					case "arc": {
						if(allNeedMovePointMap[lineObject.userData.info.lineInfo.center]
							|| allNeedMovePointMap[lineObject.userData.info.lineInfo.from]
							|| allNeedMovePointMap[lineObject.userData.info.lineInfo.to]){

							let fromObject = allPointObjectMap[lineObject.userData.info.lineInfo.from];
							let toObject = allPointObjectMap[lineObject.userData.info.lineInfo.to];
							let centerObject = allPointObjectMap[lineObject.userData.info.lineInfo.center];
							let centerPoint = {
								x: centerObject.position.x,
								y: centerObject.position.z
							};
							let fromPoint = {
								x: fromObject.position.x,
								y: fromObject.position.z
							};
							let toPoint = {
								x: toObject.position.x,
								y: toObject.position.z
							};

							let points = thatS3dPathDrawingTool.calcArcPoint3Ds(fromPoint, toPoint, centerPoint);
							lineObject.geometry = new THREE.BufferGeometry().setFromPoints(points);

							thatS3dPathDrawingTool.rebuildTagObject3D("line", name, allTagObjectMap);

							allNeedMoveLineMap[name] = true;
						}
						break;
					}
					case "segment":{
						//如果起点或者终点有一个点移动了，那么重绘这条线
						if(allNeedMovePointMap[lineObject.userData.info.lineInfo.from]
							|| allNeedMovePointMap[lineObject.userData.info.lineInfo.to]){

							let fromObject = allPointObjectMap[lineObject.userData.info.lineInfo.from];
							let toObject = allPointObjectMap[lineObject.userData.info.lineInfo.to];
							let fromPoint = {
								x: fromObject.position.x,
								y: fromObject.position.z
							};
							let toPoint = {
								x: toObject.position.x,
								y: toObject.position.z
							};

							let points = thatS3dPathDrawingTool.calcSegmentPoints(fromPoint, toPoint);
							lineObject.geometry = new THREE.BufferGeometry().setFromPoints(points);

							thatS3dPathDrawingTool.rebuildTagObject3D("line", name, allTagObjectMap);

							allNeedMoveLineMap[name] = true;
						}
						break;
					}
					default: {
						break;
					}
				}
			}

			//更新点的tag，暂未启用
			allTagObjectMap = thatS3dPathDrawingTool.getTagObjectMap();
			for(let pointName in allNeedMovePointMap){
				thatS3dPathDrawingTool.rebuildTagObject3D("point", pointName, allTagObjectMap);
			}


			//重新渲染相关的约束
			let allConstraintObjectMap = thatS3dPathDrawingTool.getPathObjectMap("constraint");
			let allNeedRemoveConstraintNameMap = thatS3dPathDrawingTool.getRelatedConstraintNameMap(allNeedMoveLineMap, allConstraintObjectMap);
			for(let constraintName in allNeedRemoveConstraintNameMap){
				let constraintObject = allConstraintObjectMap[constraintName];
				let constraintInfo = pathInfo.constraintMap[constraintName];
				thatS3dPathDrawingTool.rootObject3D.remove(constraintObject);
				let object3D = thatS3dPathDrawingTool.createConstraintObject3D(constraintInfo, pathInfo);
				thatS3dPathDrawingTool.rootObject3D.add(object3D);
			}

			//刷新pointTable
			thatS3dPathDrawingTool.refreshPointTable();
		}
	}

	//按照约束，重新计算点的位置
	this.reCalcPointsByConstraints = function(pathInfo, allPointObjectMap, selectedNameMap, affectedPointNameMap){
		let pointNameMap = {};
		for(let name in selectedNameMap) {
			if (pathInfo.pointMap[name] != null) {
				pointNameMap[name] = true;
			}
			else if (pathInfo.lineMap[name] != null) {
				let relatedPointNames = thatS3dPathDrawingTool.getRelatedPointNamesByLineName(name, pathInfo);
				for(let i = 0; i < relatedPointNames.length; i++){
					let relatedPointName = relatedPointNames[i];
					pointNameMap[relatedPointName] = true;
				}
			}
		}

		let newAffectPointNameMap = {};
		for(let sourcePointName in pointNameMap) {
			if (!affectedPointNameMap[sourcePointName]) {
				affectedPointNameMap[sourcePointName] = true;

				let constraintNameMap = thatS3dPathDrawingTool.getRelatedConstraintNameMapByPointName(sourcePointName);

				//先处理距离约束
				for (let constraintName in constraintNameMap) {
					let constraintInfo = pathInfo.constraintMap[constraintName];
					if (constraintInfo.constraintType === "distance") {
						let lineName = constraintInfo.from;
						let lineInfo = pathInfo.lineMap[lineName];
						let distance = constraintInfo.value;
						let fromPointName = lineInfo.from;
						let toPointName = lineInfo.to;
						if (fromPointName !== sourcePointName) {
							//如果toPoint是主动移动，那么fromPoint为被动移动
							fromPointName = lineInfo.to;
							toPointName = lineInfo.from;
						}

						let affectPointInfo = thatS3dPathDrawingTool.calcAffectedPointInfoByConstraintDistance(fromPointName, toPointName, distance);
						if (!affectedPointNameMap[affectPointInfo.name]) {
							thatS3dPathDrawingTool.reLocatePointAndInfo(affectPointInfo.name, affectPointInfo.x, affectPointInfo.y, allPointObjectMap, pathInfo);
							newAffectPointNameMap[affectPointInfo.name] = true;
						}
					}
				}

				//再处理角度约束
				for (let constraintName in constraintNameMap) {
					let constraintInfo = pathInfo.constraintMap[constraintName];
					if (constraintInfo.constraintType === "angle") {
						let fromLineName = constraintInfo.from;
						let toLineName = constraintInfo.to;
						let fromLineInfo = pathInfo.lineMap[fromLineName];
						let toLineInfo = pathInfo.lineMap[toLineName];
						let angle = constraintInfo.value;
						if (fromLineInfo.from !== sourcePointName && fromLineInfo.to !== sourcePointName) {
							//如果移动的点不在fromLine，那么把toLine作为fromLine，即fromLine转动
							toLineName = constraintInfo.from;
							fromLineName = constraintInfo.to;
							angle = 360 - angle;
						}
						let affectPointInfo = thatS3dPathDrawingTool.calcAffectedPointInfoByConstraintAngle(fromLineName, toLineName, angle);
						if (affectPointInfo != null && !affectedPointNameMap[affectPointInfo.name]) {
							thatS3dPathDrawingTool.reLocatePointAndInfo(affectPointInfo.name, affectPointInfo.x, affectPointInfo.y, allPointObjectMap, pathInfo);
							newAffectPointNameMap[affectPointInfo.name] = true;
						}
					}
				}

				//再处理其他约束
				for (let constraintName in constraintNameMap) {
					let constraintInfo = pathInfo.constraintMap[constraintName];
					if (constraintInfo.constraintType !== "distance" && constraintInfo.constraintType !== "angle") {
						let affectPointInfo = null;
						switch (constraintInfo.constraintType) {
							case "parallel": {
								let fromLineInfo = pathInfo.lineMap[constraintInfo.from];
								let toLineInfo = pathInfo.lineMap[constraintInfo.to];
								let toLineName = constraintInfo.to;
								let fromLineFromPointName = fromLineInfo.from;
								let fromLineToPointName = fromLineInfo.to;
								if (fromLineFromPointName !== sourcePointName && fromLineToPointName !== sourcePointName) {
									//如果移动的点不在fromLine，那么把toLine作为fromLine，即fromLine根究toLine移动
									if(toLineInfo.from === sourcePointName){
										toLineName = constraintInfo.from;
										fromLineFromPointName = toLineInfo.from;
										fromLineToPointName = toLineInfo.to;
									}
									else {
										toLineName = constraintInfo.from;
										fromLineFromPointName = toLineInfo.to;
										fromLineToPointName = toLineInfo.from;
									}
								}
								else{
									if(fromLineFromPointName === sourcePointName){
										toLineName = constraintInfo.to;
										fromLineFromPointName = fromLineInfo.from;
										fromLineToPointName = fromLineInfo.to;
									}
									else {
										toLineName = constraintInfo.to;
										fromLineFromPointName = fromLineInfo.to;
										fromLineToPointName = fromLineInfo.from;
									}
								}
								affectPointInfo = thatS3dPathDrawingTool.calcAffectedPointInfoByConstraintParallel(fromLineFromPointName, fromLineToPointName, toLineName);
								break;
							}
							case "vertical": {
								let lineInfo = pathInfo.lineMap[constraintInfo.from];
								let fromPointName = lineInfo.from;
								let toPointName = lineInfo.to;
								if (fromPointName !== sourcePointName) {
									//如果toPoint是主动移动，那么fromPoint为被动移动
									fromPointName = lineInfo.to;
									toPointName = lineInfo.from;
								}
								affectPointInfo = thatS3dPathDrawingTool.calcAffectedPointInfoByConstraintVertical(fromPointName, toPointName);
								break;
							}
							case "horizontal": {
								let lineInfo = pathInfo.lineMap[constraintInfo.from];
								let fromPointName = lineInfo.from;
								let toPointName = lineInfo.to;
								if (fromPointName !== sourcePointName) {
									//如果toPoint是主动移动，那么fromPoint为被动移动
									fromPointName = lineInfo.to;
									toPointName = lineInfo.from;
								}
								affectPointInfo = thatS3dPathDrawingTool.calcAffectedPointInfoByConstraintHorizontal(fromPointName, toPointName);
								break;
							}
							default: {
								break;
							}
						}

						if (!affectedPointNameMap[affectPointInfo.name]) {
							thatS3dPathDrawingTool.reLocatePointAndInfo(affectPointInfo.name, affectPointInfo.x, affectPointInfo.y, allPointObjectMap, pathInfo);
							newAffectPointNameMap[affectPointInfo.name] = true;
						}
					}
				}

			}
		}

		//递归执行后续点的移动
		for(let pointName in newAffectPointNameMap){
			let pointInfo = pathInfo.pointMap[pointName];
			thatS3dPathDrawingTool.movePointByName(pointInfo.name, common3DFunction.m2mm(pointInfo.x), common3DFunction.m2mm(pointInfo.y), affectedPointNameMap);
		}
	}

	this.reLocatePointAndInfo = function (pointName, x, y, allPointObjectMap, pathInfo){
		let pointInfo = pathInfo.pointMap[pointName];
		pointInfo.x = x;
		pointInfo.y = y;

		let pointObject = allPointObjectMap[pointName];
		pointObject.position.set(x, thatS3dPathDrawingTool.unitZero, y);
	}

	this.rebuildTagObject3D = function (type, pathObjectName, allTagObjectMap){
		let tagObject3D = allTagObjectMap[pathObjectName];
		if(tagObject3D != null){
			thatS3dPathDrawingTool.rootObject3D.remove(tagObject3D);
			switch(type){
				case "point":{
					break;
				}
				case "line":{
					let lineInfo = thatS3dPathDrawingTool.pathInfo.lineMap[pathObjectName];
					tagObject3D = thatS3dPathDrawingTool.createLineTagObject3D(lineInfo, thatS3dPathDrawingTool.pathInfo);
					break;
				}
				default:{
					break;
				}
			}
			thatS3dPathDrawingTool.rootObject3D.add(tagObject3D);
		}
	}

	this.getPositionOnPlane = function (mousePosition){
		let intersects = thatS3dPathDrawingTool.manager.viewer.getSceneIntersects(mousePosition);
		for(let i = 0; i < intersects.length; i++){
			let intersect = intersects[i];
			if(intersect.object.isDrawingToolPlane){
				return {
					x: intersect.point.x,
					y: intersect.point.y,
					z: intersect.point.z
				};
			}
		}
		return {
			x: 0,
			y: 0,
			z: 0
		};
	}

	this.checkAllConstraintEffective = function (){
		let errorConstraintNameMap = {};
		let allConstainerMap = thatS3dPathDrawingTool.getPathObjectMap("constraint");
		for(let constraintName in allConstainerMap){
			if(!thatS3dPathDrawingTool.checkConstraintEffective(constraintName)){
				errorConstraintNameMap[constraintName] = true;
			}
		}
		return errorConstraintNameMap;
	}

	this.checkConstraintEffective = function (constraintName){
		let pathInfo = thatS3dPathDrawingTool.pathInfo;
		let constraintInfo = pathInfo.constraintMap[constraintName];
		let effective = false;
		switch(constraintInfo.constraintType){
			case "distance":{
				effective = thatS3dPathDrawingTool.checkConstraintEffectiveDistance(constraintInfo, pathInfo);
				break;
			}
			case "horizontal":{
				effective = thatS3dPathDrawingTool.checkConstraintEffectiveHorizontal(constraintInfo, pathInfo);
				break;
			}
			case "vertical":{
				effective = thatS3dPathDrawingTool.checkConstraintEffectiveVertical(constraintInfo, pathInfo);
				break;
			}
			case "angle":{
				effective = thatS3dPathDrawingTool.checkConstraintEffectiveAngle(constraintInfo, pathInfo);
				break;
			}
			case "parallel":{
				effective = thatS3dPathDrawingTool.checkConstraintEffectiveParallel(constraintInfo, pathInfo);
				break;
			}
			default:{
			}
		}
		return effective;
	}

	this.checkConstraintEffectiveDistance = function (constraintInfo, pathInfo){
		let lineInfo = pathInfo.lineMap[constraintInfo.from];
		let fromPointInfo = pathInfo.pointMap[lineInfo.from];
		let toPointInfo = pathInfo.pointMap[lineInfo.to];
		let length = common2DLine.getLength(fromPointInfo, toPointInfo);
		return Math.abs(length - constraintInfo.value) <= thatS3dPathDrawingTool.ignoreSize;
	}
	this.checkConstraintEffectiveHorizontal = function (constraintInfo, pathInfo) {
		let lineInfo = pathInfo.lineMap[constraintInfo.from];
		let fromPointInfo = pathInfo.pointMap[lineInfo.from];
		let toPointInfo = pathInfo.pointMap[lineInfo.to];
		return Math.abs(fromPointInfo.y - toPointInfo.y) <= thatS3dPathDrawingTool.ignoreSize;
	}

	this.checkConstraintEffectiveVertical = function (constraintInfo, pathInfo) {
		let lineInfo = pathInfo.lineMap[constraintInfo.from];
		let fromPointInfo = pathInfo.pointMap[lineInfo.from];
		let toPointInfo = pathInfo.pointMap[lineInfo.to];
		return Math.abs(fromPointInfo.x - toPointInfo.x) <= thatS3dPathDrawingTool.ignoreSize;
	}

	this.checkConstraintEffectiveParallel = function (constraintInfo, pathInfo) {
		let fromLineInfo = pathInfo.lineMap[constraintInfo.from];
		let toLineInfo = pathInfo.lineMap[constraintInfo.to];
		let fromLineFromPointInfo = pathInfo.pointMap[fromLineInfo.from];
		let fromLineToPointInfo = pathInfo.pointMap[fromLineInfo.to];
		let toLineFromPointInfo = pathInfo.pointMap[toLineInfo.from];
		let toLineToPointInfo = pathInfo.pointMap[toLineInfo.to];
		return common2DLine.checkParallel(fromLineFromPointInfo, fromLineToPointInfo, toLineFromPointInfo, toLineToPointInfo, thatS3dPathDrawingTool.ignoreAngle)
			|| common2DLine.checkParallel(fromLineFromPointInfo, fromLineToPointInfo, toLineToPointInfo, toLineFromPointInfo, thatS3dPathDrawingTool.ignoreAngle);
	}

	this.checkConstraintEffectiveAngle = function (constraintInfo, pathInfo) {
		let anglePointInfo = thatS3dPathDrawingTool.getAnglePointsByTwoLines(constraintInfo.from, constraintInfo.to, pathInfo);
		if (anglePointInfo == null
			|| anglePointInfo.from == null
			|| anglePointInfo.to == null
			|| anglePointInfo.center == null) {
			return false;
		}
		else {
			let angle = thatS3dPathDrawingTool.getAngleByThreePoints(anglePointInfo.from, anglePointInfo.to, anglePointInfo.center);
			return Math.abs(angle * 180 / Math.PI - constraintInfo.value) <= thatS3dPathDrawingTool.ignoreAngle;
		}
	}

	this.showConstraintErrors = function (constraintNameMap){
		let container = $("#" + thatS3dPathDrawingTool.containerId);
		let constaintContainer = $(container).find(".pathDrawingToolConstraintContainer")[0];
		let allConstainerMap = thatS3dPathDrawingTool.getPathObjectMap("constraint");
		for(let constraintName in allConstainerMap){
			if(constraintNameMap[constraintName]) {
				$(constaintContainer).find(".pathDrawingTableRow[name='" + constraintName + "'] .pathDrawingCellName .pathDrawingCellNoneError").addClass("pathDrawingCellError");
			}
			else{
				$(constaintContainer).find(".pathDrawingTableRow[name='" + constraintName + "'] .pathDrawingCellName .pathDrawingCellNoneError").removeClass("pathDrawingCellError");
			}
		}
	}

	//判断是否形成了回路
	this.checkIsLoop = function(pathInfo){
		let allLineNameMap = {};
		let loopedPointNameMap = {};
		let loopedLineNameMap = {};
		let nextPointName = null;
		let firstPointName = null;
		let lastLineName = null;
		let lastPointName = null;
		for(let lineName in pathInfo.lineMap){
			allLineNameMap[lineName] = true;
			if(nextPointName == null){
				let lineInfo = pathInfo.lineMap[lineName];
				nextPointName = lineInfo.from;
				firstPointName = nextPointName;
				loopedPointNameMap[nextPointName] = true;
			}
		}

		//根据点，连接线，循环遍历所有的线
		while(nextPointName != null){
			let lineNames = thatS3dPathDrawingTool.getRelatedLineNamesByPointName(nextPointName);
			let nextLineName = null;
			for(let i = 0; i < lineNames.length; i++){
				let lineName = lineNames[i];
				if(!loopedLineNameMap[lineName]){
					nextLineName = lineName;
					loopedLineNameMap[nextLineName] = true;
					break;
				}
			}
			if(nextLineName != null){
				let nextLineInfo = pathInfo.lineMap[nextLineName];
				if(!loopedPointNameMap[nextLineInfo.from]){
					nextPointName = nextLineInfo.from;
				}
				if(!loopedPointNameMap[nextLineInfo.to]){
					nextPointName = nextLineInfo.to;
				}
				if(nextPointName != null){
					loopedPointNameMap[nextPointName] = true;
				}

				lastLineName = nextLineName;
				lastPointName = nextPointName;
			}
			else{
				nextPointName = null;
			}
		}

		//判断第一个点和最后一个点是否在同一条line上，如果不是，那么没有形成闭环
		if(lastLineName != null){
			let lastLineInfo = pathInfo.lineMap[lastLineName];
			if(!(lastLineInfo.from === firstPointName && lastLineInfo.to === lastPointName)
				&& !(lastLineInfo.from === lastPointName && lastLineInfo.to === firstPointName))
			return false;
		}

		//判断是否所有的线都被遍历到了
		for(let lineName in pathInfo.lineMap) {
			if(!loopedLineNameMap[lineName]){
				return false;
			}
		}

		return true;
	}

	this.pointMapToStr = function (pathInfo){
		let strs = [];
		for(let pointName in pathInfo.pointMap){
			let pointInfo = pathInfo.pointMap[pointName];
			let str = pointName
				+ ","
				+ cmnPcr.decimalToStr(common3DFunction.m2mm(pointInfo.x), false, thatS3dPathDrawingTool.positionFixNum)
				+ ","
				+ cmnPcr.decimalToStr(common3DFunction.m2mm(pointInfo.y), false, thatS3dPathDrawingTool.positionFixNum);
			strs.push(str);
		}
		return cmnPcr.arrayToString(strs, ";");
	}

	this.lineMapToStr = function (pathInfo){
		let strs = [];
		for(let lineName in pathInfo.lineMap){
			let lineInfo = pathInfo.lineMap[lineName];
			let str = lineName
				+ ","
				+ lineInfo.lineType
				+ ","
				+ lineInfo.from
				+ ","
				+ lineInfo.to
				+ ","
				+ (lineInfo.center == null ? "" : lineInfo.center);
			strs.push(str);
		}
		return cmnPcr.arrayToString(strs, ";");
	}

	this.constraintMapToStr = function (pathInfo){
		let strs = [];
		for(let constraintName in pathInfo.constraintMap){
			let constraintInfo = pathInfo.constraintMap[constraintName];
			let str = constraintName
				+ ","
				+ constraintInfo.constraintType
				+ ","
				+ constraintInfo.from
				+ ","
				+ (constraintInfo.to == null ? "" : constraintInfo.to)
				+ ","
				+ (constraintInfo.value == null ? "" : (
					constraintInfo.constraintType === "distance"
						? cmnPcr.decimalToStr(common3DFunction.m2mm(constraintInfo.value),false, thatS3dPathDrawingTool.fixNum)
						: (constraintInfo.constraintType === "angle" ? (constraintInfo.value * Math.PI / 180) : "")
				));
			strs.push(str);
		}
		return cmnPcr.arrayToString(strs, ";");
	}

	this.pathInfoToStr = function (pathInfo){
		let loopedPointInfos = [];
		let allLineNameMap = {};
		let loopedPointNameMap = {};
		let loopedLineNameMap = {};
		let nextPointName = null;
		for(let lineName in pathInfo.lineMap){
			allLineNameMap[lineName] = true;
			if(nextPointName == null){
				let lineInfo = pathInfo.lineMap[lineName];
				nextPointName = lineInfo.from;
				loopedLineNameMap[lineName] = true;
				loopedPointNameMap[nextPointName] = true;
				let pointInfo = pathInfo.pointMap[nextPointName];
				loopedPointInfos.push({
					name: nextPointName,
					x: pointInfo.x,
					y: pointInfo.y
				});
			}
		}

		//根据点，连接线，循环遍历所有的线
		while(nextPointName != null){
			let lineNames = thatS3dPathDrawingTool.getRelatedLineNamesByPointName(nextPointName);
			let nextLineName = null;
			for(let i = 0; i < lineNames.length; i++){
				let lineName = lineNames[i];
				if(!loopedLineNameMap[lineName]){
					nextLineName = lineName;
					break;
				}
			}
			if(nextLineName != null){
				let nextLineInfo = pathInfo.lineMap[nextLineName];
				if(!loopedPointNameMap[nextLineInfo.from]){
					nextPointName = nextLineInfo.from;
				}
				if(!loopedPointNameMap[nextLineInfo.to]){
					nextPointName = nextLineInfo.to;
				}
				if(nextLineInfo.lineType === "arc"){
					let centerPointInfo = pathInfo.pointMap[nextLineInfo.center];
					loopedPointInfos.push({
						name: centerPointInfo.name,
						x: centerPointInfo.x,
						y: centerPointInfo.y,
						linePointType: "arc",
						clockDirectionType: nextLineInfo.to === nextPointName ? "clockwise" : "anticlockwise"
					});
				}
				if(nextPointName != null){
					loopedLineNameMap[nextLineName] = true;
					loopedPointNameMap[nextPointName] = true;
					let pointInfo = pathInfo.pointMap[nextPointName];
					loopedPointInfos.push({
						name: nextLineName,
						x: pointInfo.x,
						y: pointInfo.y
					});
				}
			}
			else{
				nextPointName = null;
			}
		}

		let pointStrs = [];
		for(let i = 0; i < loopedPointInfos.length; i++){
			let pointInfo = loopedPointInfos[i];
			let pointStr = cmnPcr.decimalToStr(common3DFunction.m2mm(pointInfo.x),false, thatS3dPathDrawingTool.fixNum)
			+ ","
			+ cmnPcr.decimalToStr(common3DFunction.m2mm(pointInfo.y),false, thatS3dPathDrawingTool.fixNum)
			+ ","
			+ (pointInfo.linePointType === "arc" ? "c" : "")
			+ ","
			+ (pointInfo.clockDirectionType === "anticlockwise" ? "a" : (pointInfo.clockDirectionType === "clockwise" ? "c" : ""));
			pointStrs.push(pointStr);
		}

		return cmnPcr.arrayToString(pointStrs, ";")
	}
}
export default S3dPathDrawingTool