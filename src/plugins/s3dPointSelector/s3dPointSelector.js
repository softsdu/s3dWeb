import * as THREE from "three";
import {cmnPcr} from "../../commonjs/common/static.js"
import "./s3dPointSelector.css"

//S3dWeb 选点
let S3dPointSelector = function (){
	//当前对象
	const thatS3dPointSelector = this;

	this.manager = null;
	
	//containerId
	this.containerId = null;
	 
	this.placedPoints = [];
	 
	this.placedLines = [];

	this.locationType = null;

	this.paramInfo = null;
	
	this.waitingPlacePoint = null;
	
	this.waitingPlaceLine = null;

	this.drawingPlacePoint = false;

	this.placePointRadius = 0.1;

	this.pointCount = 1;

	this.fixNum = 2;

	this.placedPointColor = new THREE.Color(0xff0000); 
	
	this.waitingPlaceBallMaterial = new THREE.MeshStandardMaterial({
    	color: 0xFF6A00,
    	depthTest: false,
		flatShading: false,
    	side: THREE.FrontSide,
		transparent: true,
		opacity: 0.5,
    	roughness: 1,
    	metalness: 0
	}); 

	this.lineMaterial = new THREE.LineBasicMaterial({ 
		color: 0x0000FF,
		depthTest: false,
		transparent: true,
		side: THREE.DoubleSide
	});  

	this.init = function(p){
		thatS3dPointSelector.manager = p.manager; 
		thatS3dPointSelector.containerId = p.containerId; 
		thatS3dPointSelector.title = p.config.title == null ? "选择点" : p.config.title;
		thatS3dPointSelector.placePointRadius = p.config.placePointRadius; 
	}  
	
	this.clearPlacePoints = function(){
		let allPlaceObjects = [];
		for(let i = 0; i < thatS3dPointSelector.manager.viewer.scene.children.length; i++){
			let obj = thatS3dPointSelector.manager.viewer.scene.children[i]; 
			if(obj.isPlacePoint || obj.isPlaceLine){
				allPlaceObjects.push(obj);
			}
		}
		for(let i = 0; i < allPlaceObjects.length; i++){
			let obj = allPlaceObjects[i];
			thatS3dPointSelector.manager.viewer.scene.remove(obj);
		}
		thatS3dPointSelector.placedPoints = [];
		thatS3dPointSelector.placedLines = []; 
		thatS3dPointSelector.waitingPlacePoint = null;
		thatS3dPointSelector.waitingPlaceLine = null;
		thatS3dPointSelector.manager.moveHelper.refreshAttachHelpLine(); 		
		thatS3dPointSelector.manager.moveHelper.refreshDrawHelpLine2D(); 
        thatS3dPointSelector.manager.moveHelper.refreshDrawHelpArc2D();
		thatS3dPointSelector.showWaitingPlacePointMessage();
		return true;
	}  
	
	this.beginPlacePoints = function(p){  
		thatS3dPointSelector.locationType = p.locationType;
		thatS3dPointSelector.pointCount = p.pointCount;

		thatS3dPointSelector.paramInfo = p.paramInfo;
		thatS3dPointSelector.placedPoints = [];
		thatS3dPointSelector.placedLines = []; 
		thatS3dPointSelector.waitingPlacePoint = null;
		thatS3dPointSelector.waitingPlaceLine = null;
		thatS3dPointSelector.drawingPlacePoint = true;

		//更新可吸附的坐标
		let object3D = p.paramInfo != null && p.paramInfo.nodeId != null ? thatS3dPointSelector.manager.viewer.getObject3DById(p.paramInfo.nodeId) : null;
		thatS3dPointSelector.manager.moveHelper.refreshAttachLines(object3D);
		

		if(thatS3dPointSelector.pointCount == null || thatS3dPointSelector.pointCount > 1){
			
			//显示点列表
			thatS3dPointSelector.showPointListContainer();

			//初始化已经放置的ball
			let pointStr = thatS3dPointSelector.paramInfo.pointStr;
			let points = thatS3dPointSelector.getPointsFromPointStr(pointStr);
			if(points.length > 0){
				thatS3dPointSelector.initPlacePoints(points);
			}
			else{
				thatS3dPointSelector.createPlacePoint();
			}				
		} 
		else{
			//只需选一个点是，直接创建可移动的ball
			thatS3dPointSelector.createPlacePoint();
		}
    }

	this.initPlacePoints = function(points){
		for(let i = 0; i < points.length; i++){
			let intersectPoint = points[i];
			let ball = this.createPointBall(intersectPoint);
			ball.isNew = false; 
			thatS3dPointSelector.manager.viewer.scene.add(ball);			 
			thatS3dPointSelector.addPlacedPoint(ball);			
			thatS3dPointSelector.addPointToList({
				x: ball.position.x,
				y: ball.position.y,
				z: ball.position.z,
				isCurve: ball.isCurve
			});
			if(thatS3dPointSelector.placedPoints.length > 1){
				let lastBall = thatS3dPointSelector.placedPoints[i - 1];
				thatS3dPointSelector.createWaitingPlaceLine(lastBall, ball); 
			}      
		}
	}

	this.clearPointList = function(){
		let container = $("#" + thatS3dPointSelector.containerId).find(".s3dPointSelectorContainer")[0];
		let innerContainer = $(container).find(".s3dPointSelectorInnerContainer")[0];
		$(innerContainer).empty();
	}

	this.getPointsFromPointStr = function(pointStr){		
		let points = [];
		if(pointStr != null && pointStr.trim().length !== 0){
			let pStrs = pointStr.split(";");
			let pointArray = [];
			for(let i = 0; i < pStrs.length; i++){
				let pStr = pStrs[i];
				let ps = pStr.split(",");
				let point = [];
				for(let j = 0; j < ps.length; j++){
					point[j] = ps[j];
				}
				pointArray.push(point);
			}
			switch(thatS3dPointSelector.locationType){
				case "point2D":
				case "gisPoint2D":
				case "polyline2D": 
				case "ruler":{
					for(let i = 0; i < pointArray.length; i++){
						let point = pointArray[i];
						points.push({
							index: i,
							x: common3DFunction.mm2m(cmnPcr.strToDecimal(point[0])),
							y: 0,
							z: common3DFunction.mm2m(cmnPcr.strToDecimal(point[1])),
						});
					}
					break;
				}
				case "polyline2DMix":{
					for(let i = 0; i < pointArray.length; i++){
						let point = pointArray[i];
						points.push({
							index: i,
							x: common3DFunction.mm2m(cmnPcr.strToDecimal(point[0])),
							y: 0,
							z: common3DFunction.mm2m(cmnPcr.strToDecimal(point[1])),
							isCurve: point.length > 2 ? (point[2].toLowerCase() === "b") : false
						});
					}
					break;
				}
				case "point3D":
				case "polyline3D":{
					for(let i = 0; i < pointArray.length; i++){
						let point = pointArray[i];
						points.push({
							index: i,
							x: common3DFunction.mm2m(cmnPcr.strToDecimal(point[0])),
							y: common3DFunction.mm2m(cmnPcr.strToDecimal(point[1])),
							z: common3DFunction.mm2m(cmnPcr.strToDecimal(point[2])),
						});
					}
					break;
				}
			}
		}
		return points;
	}

	
    this.drawLimit3DPoints = function(p){
		let intersectPoint = null;
		switch(thatS3dPointSelector.locationType){
			case "point2D":
			case "gisPoint2D":
			case "polyline2D":
			case "polyline2DMix":
			case "gisPolyline2D":
			case "ruler":{
				intersectPoint = thatS3dPointSelector.manager.viewer.getPositionInGroundPlaneByRaycaster(p.intersects);
				break;
			}
			case "point3D":
			case "polyline3D":{
				intersectPoint = thatS3dPointSelector.manager.viewer.getIntersect3DPointByRaycaster(p.intersects);
				break;
			}
		}
    	if(intersectPoint != null && thatS3dPointSelector.waitingPlacePoint != null){
			if(thatS3dPointSelector.waitingPlacePoint.isNew){
				//新点确定位置
				thatS3dPointSelector.createPlacePoint(intersectPoint);
			}
			else{
				//原有点移动后确定位置
				thatS3dPointSelector.refreshPointItemHtml({
					index: thatS3dPointSelector.waitingPlacePoint.index,
					point: intersectPoint
				});
				thatS3dPointSelector.waitingPlacePoint = null;
			}
    	} 
		else{
			//选定了一个原有点
			thatS3dPointSelector.waitingPlacePoint = thatS3dPointSelector.getBallByRaycaster(p.intersects);
		}
    }
	
	
    this.getBallByRaycaster = function(intersects) {  
        if (intersects.length > 0) {
        	let index = 0;
        	while(index < intersects.length){ 
				let intersect = intersects[index];
				if(intersect.object.isPlacePoint){
					return intersect.object;
				} 
        		else{
        			index++;
        		}
        	} 
        }
        return null;
    }; 
    
    this.movePlacePoint = function(p){ 
		let intersectPoint = null;
		switch(thatS3dPointSelector.locationType){
			case "point2D":
			case "gisPoint2D":
			case "polyline2D":
			case "polyline2DMix":
			case "gisPolyline2D":
			case "ruler":{
				intersectPoint = thatS3dPointSelector.manager.viewer.getPositionInGroundPlaneByRaycaster(p.intersects);
				break;
			}
			case "point3D":
			case "polyline3D":{
				let excludedObject3D = thatS3dPointSelector.paramInfo != null && thatS3dPointSelector.paramInfo.nodeId != null ? thatS3dPointSelector.manager.viewer.getObject3DById(thatS3dPointSelector.paramInfo.nodeId) : null;
				intersectPoint = thatS3dPointSelector.manager.viewer.getIntersect3DPointByRaycaster(p.intersects, excludedObject3D);
				break;
			}
		}
    	if(intersectPoint != null){
    		let waitingPlacePoint = thatS3dPointSelector.waitingPlacePoint;
			if(waitingPlacePoint != null){
				if(!p.shiftKey){
					let attachValueObjX = thatS3dPointSelector.manager.moveHelper.calcNearestCenterValueByAxis("x", null, intersectPoint.x, null); 
					let attachValueObjZ = thatS3dPointSelector.manager.moveHelper.calcNearestCenterValueByAxis("z", null, intersectPoint.z, null);
					if(attachValueObjX.newValue == null && attachValueObjZ.newValue == null){
						thatS3dPointSelector.manager.moveHelper.refreshAttachHelpLine(); 
					}
					else{
						if(attachValueObjX.newValue != null){
							intersectPoint.x = attachValueObjX.newValue;
							thatS3dPointSelector.manager.moveHelper.refreshAttachHelpLine("X", attachValueObjX.newValue); 	
						} 
						if(attachValueObjZ.newValue != null){
							intersectPoint.z = attachValueObjZ.newValue; 
							thatS3dPointSelector.manager.moveHelper.refreshAttachHelpLine("Z", attachValueObjZ.newValue); 		
						}
					}
				}
				else{
					thatS3dPointSelector.manager.moveHelper.refreshAttachHelpLine(); 	
				}
				waitingPlacePoint.position.set(intersectPoint.x, intersectPoint.y, intersectPoint.z); 

				if(waitingPlacePoint.isNew){
					//移动新的ball
					let waitingPlaceLine = thatS3dPointSelector.waitingPlaceLine;
					if(waitingPlaceLine != null){
						let beginPoint = thatS3dPointSelector.placedPoints[thatS3dPointSelector.placedPoints.length - 1];
						let endPoint = waitingPlacePoint;
						let positions = [];  
						positions.push(beginPoint.position.x, beginPoint.position.y, beginPoint.position.z);
						positions.push(endPoint.position.x, endPoint.position.y, endPoint.position.z); 
						waitingPlaceLine.geometry.setAttribute("position", new THREE.Float32BufferAttribute( positions, 3 ) ); 
						waitingPlaceLine.geometry.verticesNeedUpdate = true; 
						
						thatS3dPointSelector.manager.moveHelper.refreshDrawHelpLine2D(beginPoint.position, endPoint.position);
						if(thatS3dPointSelector.locationType === "polyline2D" || thatS3dPointSelector.locationType === "polyline2DMix"){
							if(thatS3dPointSelector.placedPoints.length >= 2){
								let arcBeginPoint = thatS3dPointSelector.placedPoints[thatS3dPointSelector.placedPoints.length - 2];
								thatS3dPointSelector.manager.moveHelper.refreshDrawHelpArc2D(arcBeginPoint.position, beginPoint.position, endPoint.position);
							}
						}
					}
				}
				else{
					//改变原有ball的位置
					let pointIndex = waitingPlacePoint.index;
					let preLine = pointIndex === 0 ? null : thatS3dPointSelector.placedLines[pointIndex - 1];
					let nextLine = pointIndex === thatS3dPointSelector.placedPoints.length - 1 ? null : thatS3dPointSelector.placedLines[pointIndex];
					if(preLine != null){
						let beginPoint = thatS3dPointSelector.placedPoints[pointIndex - 1];
						let endPoint = waitingPlacePoint;
						let positions = [];  
						positions.push(beginPoint.position.x, beginPoint.position.y, beginPoint.position.z);
						positions.push(endPoint.position.x, endPoint.position.y, endPoint.position.z); 
						preLine.geometry.setAttribute("position", new THREE.Float32BufferAttribute( positions, 3 ) ); 
						preLine.geometry.verticesNeedUpdate = true;
					}
					if(nextLine != null){
						let beginPoint = waitingPlacePoint;
						let endPoint = thatS3dPointSelector.placedPoints[pointIndex + 1];
						let positions = [];
						positions.push(beginPoint.position.x, beginPoint.position.y, beginPoint.position.z);
						positions.push(endPoint.position.x, endPoint.position.y, endPoint.position.z); 
						nextLine.geometry.setAttribute("position", new THREE.Float32BufferAttribute( positions, 3 ) ); 
						nextLine.geometry.verticesNeedUpdate = true;
					}
				}
				thatS3dPointSelector.showWaitingPlacePointMessage({
					waitingPlacePoint: waitingPlacePoint
				});
			}
    	}
		else{
			thatS3dPointSelector.showWaitingPlacePointMessage();
		}
    }
    
    this.showWaitingPlacePointMessage = function(p){
		if(p == null){
    		thatS3dPointSelector.manager.moveHelper.showMessageText(null);
    	}
    	else{
			let waitingPlacePoint = p.waitingPlacePoint;
			let message = "(" + thatS3dPointSelector.getDisplayValueStr(waitingPlacePoint.position.x) + ", " + thatS3dPointSelector.getDisplayValueStr(waitingPlacePoint.position.y) + ", " + thatS3dPointSelector.getDisplayValueStr(waitingPlacePoint.position.z) + ")";
			let pos2D = thatS3dPointSelector.manager.moveHelper.get2DPosition(waitingPlacePoint.position);

    		thatS3dPointSelector.manager.moveHelper.showMessageText(message, {
				x: pos2D.x,
				y: pos2D.y + 30
			}); 
    	}
    } 

    this.getDisplayValueStr = function(sourceValue, fixNum){
    	fixNum = fixNum == null ? thatS3dPointSelector.fixNum : fixNum; 
    	return cmnPcr.decimalToStr(common3DFunction.m2mm(sourceValue), false, fixNum, true);
    } 

	this.createPointBall = function(position){
        let ballGeometry = new THREE.SphereGeometry(thatS3dPointSelector.placePointRadius, 16, 16);  
        let ball = new THREE.Mesh(ballGeometry, thatS3dPointSelector.waitingPlaceBallMaterial); 
        ball.receiveShadow = false;
        ball.castShadow = false;
        ball.isPlacePoint = true;
		ball.isCurve = position == null || position.isCurve == null ? false : position.isCurve;
        if(position != null){
        	ball.position.set(position.x, position.y, position.z);
        }
		return ball;
	}

	this.addPointToList = function(point){
		let container = $("#" + thatS3dPointSelector.containerId).find(".s3dPointSelectorContainer")[0];
		let innerContainer = $(container).find(".s3dPointSelectorInnerContainer")[0];
		let childIndex = $(innerContainer).children().length;  
		let itemHtml = "";
		switch(thatS3dPointSelector.locationType){
			case "polyline2D":{
				itemHtml = thatS3dPointSelector.getPoint2DItemHtml({
					index: childIndex,
					point: point
				});
				break;
			}
			case "polyline2DMix":{
				itemHtml = thatS3dPointSelector.getMixPoint2DItemHtml({
					index: childIndex,
					point: point
				});
				break;
			}
			case "polyline3D":{
				itemHtml = thatS3dPointSelector.getPoint3DItemHtml({
					index: childIndex,
					point: point
				});
				break;
			}
		}
		$(innerContainer).append(itemHtml); 
	}

	this.addPlacedPoint = function(waitingPlacePoint){
		thatS3dPointSelector.manager.moveHelper.addAttachLineValueByAxis("x", waitingPlacePoint.position.x); 
		thatS3dPointSelector.manager.moveHelper.addAttachLineValueByAxis("y", waitingPlacePoint.position.y);  
		thatS3dPointSelector.manager.moveHelper.addAttachLineValueByAxis("z", waitingPlacePoint.position.z);  
		waitingPlacePoint.material.color = thatS3dPointSelector.placedPointColor;
		waitingPlacePoint.index = thatS3dPointSelector.placedPoints.length;
		thatS3dPointSelector.placedPoints.push(waitingPlacePoint);
		return waitingPlacePoint;
	}

	this.createWaitingPlaceLine = function(beginPoint, endPoint){ 
		let geometry = new THREE.BufferGeometry();   
		let positions = [];  
		positions.push(beginPoint.position.x, beginPoint.position.y, beginPoint.position.z);
		positions.push(endPoint.position.x, endPoint.position.y, endPoint.position.z); 
		geometry.setAttribute("position", new THREE.Float32BufferAttribute( positions, 3 ) ); 
		let line = new THREE.Line(geometry, thatS3dPointSelector.lineMaterial); 
		line.isPlaceLine = true;
		thatS3dPointSelector.placedLines.push(line);
		thatS3dPointSelector.manager.viewer.scene.add(line); 
		return line;
	}
	
    this.createPlacePoint = function(intersectPoint){  
        let ball = this.createPointBall(intersectPoint);
		ball.isNew = true;
        thatS3dPointSelector.manager.viewer.scene.add(ball);
		
        if(thatS3dPointSelector.waitingPlacePoint != null){
			thatS3dPointSelector.addPlacedPoint(thatS3dPointSelector.waitingPlacePoint);
			thatS3dPointSelector.addPointToList({
				x: thatS3dPointSelector.waitingPlacePoint.position.x,
				y: thatS3dPointSelector.waitingPlacePoint.position.y,
				z: thatS3dPointSelector.waitingPlacePoint.position.z,
				isCurve: false
			});
        }
        thatS3dPointSelector.waitingPlacePoint = ball;
        
        if(thatS3dPointSelector.placedPoints.length >= 1){
			let beginBall = thatS3dPointSelector.placedPoints[thatS3dPointSelector.placedPoints.length - 1];
            thatS3dPointSelector.waitingPlaceLine = thatS3dPointSelector.createWaitingPlaceLine(beginBall, thatS3dPointSelector.waitingPlacePoint);
        }        
        
		if(thatS3dPointSelector.pointCount != null && thatS3dPointSelector.placedPoints.length >= thatS3dPointSelector.pointCount){
			thatS3dPointSelector.endPlacePoints({});
		}
    }

	this.showPointListContainer = function(p){
		let winHtml = "";
		switch(thatS3dPointSelector.locationType){
			case "point2D":
			case "gisPoint2D":
			case "polyline2D":{
				winHtml = thatS3dPointSelector.getPoint2DListHtml();
				break;
			}
			case "polyline2DMix":{
				winHtml = thatS3dPointSelector.getMixPoint2DListHtml();
				break;
			}
			case "gisPolyline2D":{
				winHtml = thatS3dPointSelector.getGisPoint2DListHtml();
				break;
			}
			case "point3D":
			case "polyline3D":{
				winHtml = thatS3dPointSelector.getPoint3DListHtml();
				break;
			}
			case "ruler":
			default:{
				//不显示点列表
				return;	
			}
		}

		let mainContainer = $("#" + thatS3dPointSelector.containerId);
		$(mainContainer).append(winHtml);
		let container = $(mainContainer).find(".s3dPointSelectorContainer")[0];
		$(container).find(".s3dPointSelectorTitle").text(thatS3dPointSelector.title);
		$(container).find(".s3dPointSelectorCloseBtn").click(function(event){			
			thatS3dPointSelector.cancelPlacePoints();		
			thatS3dPointSelector.manager.viewer.changeStatus({
				status: s3dViewerStatus.normalView
			}); 
		})
		$(container).find(".s3dPointSelectorBtnCancel").click(function(event){			
			thatS3dPointSelector.cancelPlacePoints();		
			thatS3dPointSelector.hidePointListContainer();
			thatS3dPointSelector.manager.viewer.changeStatus({
				status: s3dViewerStatus.normalView
			}); 
		})
		$(container).find(".s3dPointSelectorBtnClear").click(function(event){			
			thatS3dPointSelector.clearPlacePoints();
			thatS3dPointSelector.clearPointList();
			thatS3dPointSelector.createPlacePoint();
		})
		$(container).find(".s3dPointSelectorBtnOk").click(function(event){	
			let otherValues = [];
			switch(thatS3dPointSelector.locationType){				
				case "polyline2DMix":{
					let itemBezierElements = $("#" + thatS3dPointSelector.containerId).find(".s3dPointSelectorContainer").find(".s3dPointSelectorItemBezier .s3dPointSelectorItemIsCurve");
					for(let i = 0; i < itemBezierElements.length; i++){
						let isCurve = $(itemBezierElements[i]).prop("checked");
						otherValues.push({
							isCurve: isCurve
						});
					}					
					break;
				}
			}
			

			thatS3dPointSelector.endPlacePoints({
				otherValues: otherValues
			});
			thatS3dPointSelector.manager.viewer.changeStatus({
				status: s3dViewerStatus.normalView
			}); 		 
		})
	}
	 
	this.getPoint3DListHtml = function(p){
		return "<div class=\"s3dPointSelectorContainer\">"
		+ "<div class=\"s3dPointSelectorBackground\"></div>"
		+ "<div class=\"s3dPointSelectorHeader\">"
		+ "<div class=\"s3dPointSelectorTitle\"></div>"
		+ "<div class=\"s3dPointSelectorSubTitle\"></div>"
		+ "<div class=\"s3dPointSelectorBtn s3dPointSelectorCloseBtn\" title=\"关闭\">×</div>"
		+ "<div class=\"s3dPointSelectorHeaderItemContainer\">"
		+ "<div class=\"s3dPointSelectorHeaderItemCell s3dPointSelectorHeaderItemIndex\">&nbsp;</div>"
		+ "<div class=\"s3dPointSelectorHeaderItemCell s3dPointSelectorHeaderItemX\">X</div>"
		+ "<div class=\"s3dPointSelectorHeaderItemCell s3dPointSelectorHeaderItemY\">Y</div>"
		+ "<div class=\"s3dPointSelectorHeaderItemCell s3dPointSelectorHeaderItemZ\">Z</div>"
		+ "</div>"
		+ "</div>" 
		+ "<div class=\"s3dPointSelectorInnerContainer\">"
		+ "</div>"
		+ "<div class=\"s3dPointSelectorBottomContainer\">"
		+ "<div class=\"s3dPointSelectorBottomBtn s3dPointSelectorBtnClear\">重新选点</div>"
		+ "<div class=\"s3dPointSelectorBottomBtn s3dPointSelectorBtnCancel\">取&nbsp;&nbsp;消</div>"
		+ "<div class=\"s3dPointSelectorBottomBtn s3dPointSelectorBtnOk\">确&nbsp;&nbsp;定</div>"
		+ "</div>"
		+ "</div>";
	} 
	 
	this.getPoint2DListHtml = function(p){
		return "<div class=\"s3dPointSelectorContainer\">"
		+ "<div class=\"s3dPointSelectorBackground\"></div>"
		+ "<div class=\"s3dPointSelectorHeader\">"
		+ "<div class=\"s3dPointSelectorTitle\"></div>"
		+ "<div class=\"s3dPointSelectorSubTitle\"></div>"
		+ "<div class=\"s3dPointSelectorBtn s3dPointSelectorCloseBtn\" title=\"关闭\">×</div>"
		+ "<div class=\"s3dPointSelectorHeaderItemContainer\">"
		+ "<div class=\"s3dPointSelectorHeaderItemCell s3dPointSelectorHeaderItemIndex\">&nbsp;</div>"
		+ "<div class=\"s3dPointSelectorHeaderItemCell s3dPointSelectorHeaderItemX\" style=\"width:75px;\">X</div>"
		+ "<div class=\"s3dPointSelectorHeaderItemCell s3dPointSelectorHeaderItemZ\" style=\"width:75px;\">Y</div>"
		+ "</div>"
		+ "</div>" 
		+ "<div class=\"s3dPointSelectorInnerContainer\">"
		+ "</div>"
		+ "<div class=\"s3dPointSelectorBottomContainer\">"
		+ "<div class=\"s3dPointSelectorBottomBtn s3dPointSelectorBtnClear\">重新选点</div>"
		+ "<div class=\"s3dPointSelectorBottomBtn s3dPointSelectorBtnCancel\">取&nbsp;&nbsp;消</div>"
		+ "<div class=\"s3dPointSelectorBottomBtn s3dPointSelectorBtnOk\">确&nbsp;&nbsp;定</div>"
		+ "</div>"
		+ "</div>";
	} 
	 
	this.getMixPoint2DListHtml = function(p){
		return "<div class=\"s3dPointSelectorContainer\">"
		+ "<div class=\"s3dPointSelectorBackground\"></div>"
		+ "<div class=\"s3dPointSelectorHeader\">"
		+ "<div class=\"s3dPointSelectorTitle\"></div>"
		+ "<div class=\"s3dPointSelectorSubTitle\"></div>"
		+ "<div class=\"s3dPointSelectorBtn s3dPointSelectorCloseBtn\" title=\"关闭\">×</div>"
		+ "<div class=\"s3dPointSelectorHeaderItemContainer\">"
		+ "<div class=\"s3dPointSelectorHeaderItemCell s3dPointSelectorHeaderItemIndex\">&nbsp;</div>"
		+ "<div class=\"s3dPointSelectorHeaderItemCell s3dPointSelectorHeaderItemX\" style=\"width:50px;\">X</div>"
		+ "<div class=\"s3dPointSelectorHeaderItemCell s3dPointSelectorHeaderItemZ\" style=\"width:50px;\">Y</div>"
		+ "<div class=\"s3dPointSelectorHeaderItemCell s3dPointSelectorHeaderItemBezier\" style=\"width:50px;\">曲线</div>"
		+ "</div>"
		+ "</div>" 
		+ "<div class=\"s3dPointSelectorInnerContainer\">"
		+ "</div>"
		+ "<div class=\"s3dPointSelectorBottomContainer\">"
		+ "<div class=\"s3dPointSelectorBottomBtn s3dPointSelectorBtnClear\">重新选点</div>"
		+ "<div class=\"s3dPointSelectorBottomBtn s3dPointSelectorBtnCancel\">取&nbsp;&nbsp;消</div>"
		+ "<div class=\"s3dPointSelectorBottomBtn s3dPointSelectorBtnOk\">确&nbsp;&nbsp;定</div>"
		+ "</div>"
		+ "</div>";
	} 
	 
	this.getGisPoint2DListHtml = function(p){
		return "<div class=\"s3dPointSelectorContainer\">"
		+ "<div class=\"s3dPointSelectorBackground\"></div>"
		+ "<div class=\"s3dPointSelectorHeader\">"
		+ "<div class=\"s3dPointSelectorTitle\"></div>"
		+ "<div class=\"s3dPointSelectorSubTitle\"></div>"
		+ "<div class=\"s3dPointSelectorBtn s3dPointSelectorCloseBtn\" title=\"关闭\">×</div>"
		+ "<div class=\"s3dPointSelectorHeaderItemContainer\">"
		+ "<div class=\"s3dPointSelectorHeaderItemCell s3dPointSelectorHeaderItemIndex\">&nbsp;</div>"
		+ "<div class=\"s3dPointSelectorHeaderItemCell s3dPointSelectorHeaderItemX\" style=\"width:75px;\">经度</div>"
		+ "<div class=\"s3dPointSelectorHeaderItemCell s3dPointSelectorHeaderItemZ\" style=\"width:75px;\">纬度</div>"
		+ "</div>"
		+ "</div>" 
		+ "<div class=\"s3dPointSelectorInnerContainer\">"
		+ "</div>"
		+ "<div class=\"s3dPointSelectorBottomContainer\">"
		+ "<div class=\"s3dPointSelectorBottomBtn s3dPointSelectorBtnClear\">全部清除</div>"
		+ "<div class=\"s3dPointSelectorBottomBtn s3dPointSelectorBtnCancel\">取&nbsp;&nbsp;消</div>"
		+ "<div class=\"s3dPointSelectorBottomBtn s3dPointSelectorBtnOk\">确&nbsp;&nbsp;定</div>"
		+ "</div>"
		+ "</div>";
	} 

	this.refreshPointItemHtml = function(p){
		let container = $("#" + thatS3dPointSelector.containerId).find(".s3dPointSelectorContainer")[0];
		let innerContainer = $(container).find(".s3dPointSelectorInnerContainer")[0];
		let item = $(innerContainer).find(".s3dPointSelectorItemIndex[index='" + p.index + "']").parent()[0];

		let x = thatS3dPointSelector.getDisplayValueStr(p.point.x);
		let y = thatS3dPointSelector.getDisplayValueStr(p.point.y);
		let z = thatS3dPointSelector.getDisplayValueStr(p.point.z);
		$(item).find(".s3dPointSelectorItemX").text(x);
		$(item).find(".s3dPointSelectorItemY").text(y);
		$(item).find(".s3dPointSelectorItemZ").text(z); 
	}

	this.getPoint3DItemHtml = function(p){
		let x = thatS3dPointSelector.getDisplayValueStr(p.point.x);
		let y = thatS3dPointSelector.getDisplayValueStr(p.point.y);
		let z = thatS3dPointSelector.getDisplayValueStr(p.point.z);
		return "<div class=\"s3dPointSelectorItemContainer\">"
		+ "<div class=\"s3dPointSelectorItemCell s3dPointSelectorItemIndex\" index=\"" +  p.index+ "\">" + (p.index + 1) +".</div>"
		+ "<div class=\"s3dPointSelectorItemCell s3dPointSelectorItemX\">" + x + "</div>"
		+ "<div class=\"s3dPointSelectorItemCell s3dPointSelectorItemY\">" + y + "</div>"
		+ "<div class=\"s3dPointSelectorItemCell s3dPointSelectorItemZ\">" + z + "</div>"
		+ "</div>";
	}

	this.getPoint2DItemHtml = function(p){
		let x = thatS3dPointSelector.getDisplayValueStr(p.point.x);
		let z = thatS3dPointSelector.getDisplayValueStr(p.point.z);
		return "<div class=\"s3dPointSelectorItemContainer\">"
		+ "<div class=\"s3dPointSelectorItemCell s3dPointSelectorItemIndex\" index=\"" +  p.index+ "\">" + (p.index + 1) +".</div>"
		+ "<div class=\"s3dPointSelectorItemCell s3dPointSelectorItemX\" style=\"width:75px;\">" + x + "</div>"
		+ "<div class=\"s3dPointSelectorItemCell s3dPointSelectorItemZ\" style=\"width:75px;\">" + z + "</div>"
		+ "</div>";
	}

	this.getMixPoint2DItemHtml = function(p){
		let x = thatS3dPointSelector.getDisplayValueStr(p.point.x);
		let z = thatS3dPointSelector.getDisplayValueStr(p.point.z);
		return "<div class=\"s3dPointSelectorItemContainer\">"
		+ "<div class=\"s3dPointSelectorItemCell s3dPointSelectorItemIndex\" index=\"" +  p.index+ "\">" + (p.index + 1) +".</div>"
		+ "<div class=\"s3dPointSelectorItemCell s3dPointSelectorItemX\" style=\"width:50px;\">" + x + "</div>"
		+ "<div class=\"s3dPointSelectorItemCell s3dPointSelectorItemZ\" style=\"width:50px;\">" + z + "</div>"
		+ "<div class=\"s3dPointSelectorItemCell s3dPointSelectorItemBezier\" style=\"width:50px;\"><input type=\"checkbox\" class=\"s3dPointSelectorItemIsCurve\" " + (p.point.isCurve ? "checked=\"checked\"" : "") + " /></div>"
		+ "</div>";
	}

	this.hidePointListContainer = function(p){
		$("#" + thatS3dPointSelector.containerId).find(".s3dPointSelectorContainer").remove();
	}

	this.refreshPointList = function(p){
		let allPoints = thatS3dPointSelector.placedPoints;
		let container = $("#" + thatS3dPointSelector.containerId).find(".s3dPointSelectorContainer")[0];
		let innerContainer = $(container).find(".s3dPointSelectorInnerContainer")[0];
		for(let i = 0; i < allPoints.length; i++){
			let position = allPoints[i].position; 
			let html = thatS3dPointSelector.getPointItemHtml({
				index: i,
				x: position.x,
				y: position.y,
				z: position.z
			});
			innerContainer.append(html);
		}
	}

	this.afterPlacedPointsChanged = function(p){
		thatS3dPointSelector.refreshPointList(p);
	}

	this.cancelPlacePoints = function(){
		thatS3dPointSelector.clearPlacePoints();		
		thatS3dPointSelector.hidePointListContainer();
	}

	this.endPlacePoints = function(p){
		let points = [];
		for(let i = 0; i < thatS3dPointSelector.placedPoints.length; i++){
			let placedPoint = thatS3dPointSelector.placedPoints[i];
			let point = {
				x: placedPoint.position.x,
				y: placedPoint.position.y,
				z: placedPoint.position.z
			};
			switch(thatS3dPointSelector.locationType){				
				case "polyline2DMix":{
					point.isCurve = p.otherValues[i].isCurve
				}
			}
			points.push(point);
		} 
		thatS3dPointSelector.clearPlacePoints();		
		thatS3dPointSelector.hidePointListContainer();

		thatS3dPointSelector.paramInfo.afterSelectPoints({
			points: points,
			locationType: thatS3dPointSelector.locationType,
			paramInfo: thatS3dPointSelector.paramInfo
		});
	}
}
export default S3dPointSelector