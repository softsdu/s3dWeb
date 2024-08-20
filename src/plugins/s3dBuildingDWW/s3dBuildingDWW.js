//BuildingDWW 墙、窗、门的联动
let S3dBuildingDWW = function (){
	//当前对象
	const thatBuildingDWW = this;

	this.manager = null;
	
	//containerId
	this.containerId = null;  

	this.wallCategoryCodes = ["301010"];
	this.doorCategoryCodes = ["302020"];
	this.windowCategoryCodes = ["302010"];

	//封闭多线段墙组件编码
	this.polygonWallCodes = ["301010-0001", "301010-0002", "301010-0021", "301010-0022"];

	//不封闭多线段墙编码
	this.directWallCodes = ["301010-0011", "301010-0012"];

	//墙路径属性名称
	this.wallPathPropertyName = "中线轮廓";

	//墙起点属性名称
	this.wallStartPropertyName =  "起点";
	
	//墙终点属性名称
	this.wallEndPropertyName =  "终点";

	//墙洞口属性名称
	this.wallHolePropertyName = "洞口";

	//墙是否处理洞口属性名称
	this.wallProcessHolePropertyName = "处理洞口";

	//门、床宽度属性名称
	this.holeWidthPropertyName = "宽度";

	//门、床高度属性名称
	this.holeHeightPropertyName = "高度";

	//门、床高度属性名称
	this.wallBottomPropertyName = "距离地面";

	//门、床高度属性名称
	this.wallHeightPropertyName = "高度";

	//所有墙对应的线段
	this.allWallLineMap = [];

	//吸附距离
	this.attachDistance = 0.5;

	//用于计算是否吸附的最大值
	this.maxValue = 1000000000000;

	this.checkIsDoor = function(code){
		return thatBuildingDWW.checkIsCategoryType(code, thatBuildingDWW.doorCategoryCodes);
	}

	this.checkIsWindow = function(code){
		return thatBuildingDWW.checkIsCategoryType(code, thatBuildingDWW.windowCategoryCodes);
	}

	this.checkIsWall = function(code){
		return thatBuildingDWW.checkIsCategoryType(code, thatBuildingDWW.wallCategoryCodes);
	}

	this.checkIsCategoryType = function(code, categoryCodes){
		for(let i = 0; i < categoryCodes.length; i++){
			let categoryCode = categoryCodes[i];
			if(code.startWith(categoryCode)){
				return true;
			}
		}
		return false;
	}

	this.getAllWalls = function(){
		return thatBuildingDWW.getTypeUnitObject3Ds(thatBuildingDWW.wallCategoryCodes);
	}

	this.getAllWindows = function(){
		return thatBuildingDWW.getTypeUnitObject3Ds(thatBuildingDWW.windowCategoryCodes);
	}

	this.getAllDoors = function(){
		return thatBuildingDWW.getTypeUnitObject3Ds(thatBuildingDWW.doorCategoryCodes);
	}
	
	this.getTypeUnitObject3Ds = function(categoryCodes){
		let object3Ds = [];
		for(let id in thatBuildingDWW.manager.viewer.allObject3DMap){
			let object3D = thatBuildingDWW.manager.viewer.allObject3DMap[id]; 
			if(object3D.userData.unitInfo.componentInfo != null){
				if(thatBuildingDWW.checkIsCategoryType(object3D.userData.unitInfo.code,categoryCodes)){
					object3Ds.push(object3D);
				}
			}
		}
		return object3Ds;
	}

	this.init = function(p){
		thatBuildingDWW.manager = p.manager; 
		thatBuildingDWW.containerId = p.containerId;
	}

	this.onDrag = function(p){ 
		let object3D = thatBuildingDWW.manager.viewer.getObject3DById(p.nodeId);
		let code = object3D.userData.unitInfo.code;
		
		//判定移动的是否为门窗
		let isWindowOrDoor = thatBuildingDWW.checkIsWindow(code) || thatBuildingDWW.checkIsDoor(code);
		if(isWindowOrDoor){
			let needSystemAttach = true;
			let object3DPoint = {
				x: object3D.position.x,
				y: object3D.position.z
			};
			switch(p.axis){
				case "X":{
					//获取X方向最近的墙上的点，且达到attachDistance的
					let attachPoint = thatBuildingDWW.getXAttachPoint(object3DPoint);
					if(attachPoint != null){
						object3D.position.set(attachPoint.point.x, object3D.position.y, attachPoint.point.y); 
						let angle = common2DLine.getAngle(attachPoint.line.to, attachPoint.line.from);
						object3D.rotation.set(0, -angle, 0);
						//存在问题：rotation改变了，但是没有保存
						thatBuildingDWW.manager.moveHelper.refreshAttachHelpLine();  
						needSystemAttach = attachPoint.line.from.y == attachPoint.line.to.y ? true : false;
					}
					break;
				}
				case "Z":{
					//获取Z方向最近的墙上的点，且达到attachDistance的
					let attachPoint = thatBuildingDWW.getZAttachPoint(object3DPoint);
					if(attachPoint != null){
						object3D.position.set(attachPoint.point.x, object3D.position.y, attachPoint.point.y); 
						let angle = common2DLine.getAngle(attachPoint.line.to, attachPoint.line.from);
						object3D.rotation.set(0, -angle, 0); 	
						thatBuildingDWW.manager.moveHelper.refreshAttachHelpLine();  
						needSystemAttach = attachPoint.line.from.x === attachPoint.line.to.x ? true : false;
					}
					break;
				}
				case "XZ":
					case "XYZ":{
					//获取X和Z方向最近的墙上的点，且达到attachDistance的
					let attachPointX = thatBuildingDWW.getXAttachPoint(object3DPoint);
					let attachPointZ = thatBuildingDWW.getZAttachPoint(object3DPoint);
					let attachPoint = attachPointX == null ? attachPointZ : (attachPointZ == null ? attachPointX : (attachPointX.distance < attachPointZ.distance ? attachPointX : attachPointZ));
					if(attachPoint != null){
						object3D.position.set(attachPoint.point.x, object3D.position.y, attachPoint.point.y); 
						let angle = common2DLine.getAngle(attachPoint.line.to, attachPoint.line.from);
						object3D.rotation.set(0, -angle, 0);	
						thatBuildingDWW.manager.moveHelper.refreshAttachHelpLine();  
						needSystemAttach = false;
					}
					break;
				} 
			}
			return needSystemAttach;
		}
		else{
			return true;
		}
	}

	this.getXAttachPoint = function(object3DPoint){
		let minPoint = null;
		let minDistance = thatBuildingDWW.maxValue;
		let minLine = null;
		for(let wallId in thatBuildingDWW.allWallLineMap){
			let lines = thatBuildingDWW.allWallLineMap[wallId];
			for(let i = 0; i < lines.length; i++){
				let wallLine = lines[i];
				let checkFromPoint = {
					x: -thatBuildingDWW.maxValue,
					y: object3DPoint.y
				};
				let checkToPoint = {
					x: thatBuildingDWW.maxValue,
					y: object3DPoint.y
				};
				let intersectPoint = common2DLine.getLineIntersectPoint(checkFromPoint, checkToPoint, wallLine.from, wallLine.to);
				if(intersectPoint == null){
					let distance = Math.abs(checkFromPoint.y - wallLine.from.y);
					if(distance < thatBuildingDWW.attachDistance){					
						let point = {
							x: object3DPoint.x,
							y: wallLine.from.y
						};
						if(common2DLine.checkInSegment(point, wallLine.from, wallLine.to)){
							minPoint = point;
							minDistance = distance;
							minLine = wallLine;
						}
					}
				}
				else if(intersectPoint != null && common2DLine.checkInSegment(intersectPoint, wallLine.from,wallLine.to)){
					let distance = common2DLine.getLength(intersectPoint, object3DPoint);
					if(distance < minDistance){
						minDistance = distance;
						minPoint = intersectPoint;
						minLine = wallLine;
					}
				}
			}
		}
		if(minDistance < thatBuildingDWW.attachDistance){
			return {
				distance: minDistance,
				point: minPoint,
				line: minLine
			};
		}
		else{
			return null;
		}
	}

	this.getZAttachPoint = function(object3DPoint){
		let minPoint = null;
		let minDistance = thatBuildingDWW.maxValue;
		let minLine = null;
		for(let wallId in thatBuildingDWW.allWallLineMap){
			let lines = thatBuildingDWW.allWallLineMap[wallId];
			for(let i = 0; i < lines.length; i++){
				let wallLine = lines[i];
				let checkFromPoint = {
					x: object3DPoint.x,
					y: -thatBuildingDWW.maxValue
				};
				let checkToPoint = {
					x: object3DPoint.x,
					y: thatBuildingDWW.maxValue
				};
				let intersectPoint = common2DLine.getLineIntersectPoint(checkFromPoint, checkToPoint, wallLine.from, wallLine.to);
				if(intersectPoint == null){
					let distance = Math.abs(checkFromPoint.x - wallLine.from.x);
					if(distance < thatBuildingDWW.attachDistance){
						let point = {
							x: wallLine.from.x,
							y: object3DPoint.y
						};
						if(common2DLine.checkInSegment(point, wallLine.from, wallLine.to)){
							minPoint = point;
							minDistance = distance;
							minLine = wallLine;
						}
					}
				}
				else if(intersectPoint != null && common2DLine.checkInSegment(intersectPoint, wallLine.from,wallLine.to)){
					let distance = common2DLine.getLength(intersectPoint, object3DPoint);
					if(distance < minDistance){
						minDistance = distance;
						minPoint = intersectPoint;
						minLine = wallLine;
					}
				}
			}
		}
		if(minDistance < thatBuildingDWW.attachDistance){
			return {
				distance: minDistance,
				point: minPoint,
				line: minLine
			};
		}
		else{
			return null;
		}
	}

	this.afterDeleteObject3D = function(p){
		//当墙造型后，重新获取所有墙的线段
		let object3D = thatBuildingDWW.manager.viewer.getObject3DById(p.nodeId);
		let code = object3D.userData.unitInfo.code;
		let isWall = thatBuildingDWW.checkIsWall(code);
		if(isWall){
			thatBuildingDWW.reGetAllWallLines();
		}
	}  

	this.afterChangeObject3D = function(nodeIds){
		//增加新的墙厚，wallLines不重新计算
		//当墙造型后，重新获取所有墙的线段
		let hasWall = false;
		let exceptIdMap = {};
		for(let i = 0; i < nodeIds.length; i++){
			let nodeId = nodeIds[i];
			let object3D = thatBuildingDWW.manager.viewer.getObject3DById(nodeId);
			let code = object3D.userData.unitInfo.code;
			let isWall = thatBuildingDWW.checkIsWall(code);
			if(isWall){
				hasWall = true;
			}
		}
		if(hasWall){
			thatBuildingDWW.reGetAllWallLines(exceptIdMap);
		}
	}

	//重新计算墙洞值，可能是因为门、窗移动，新建、删除门窗、墙改变属性引起 added by ls 20220920
	this.reCalcAllWallHoles = function(p){
		let needReCalc = false;
		let isWallChanged = null;

		//判断是否要重新计算墙洞
		if(p.nodeId != null){ 
			let object3D = thatBuildingDWW.manager.viewer.getObject3DById(p.nodeId);
			let code = object3D.userData.unitInfo.code;
			let isWindowOrDoor = thatBuildingDWW.checkIsWindow(code) || thatBuildingDWW.checkIsDoor(code);
			if(isWindowOrDoor){
				needReCalc = true;
			}
			let isWall = thatBuildingDWW.checkIsWall(code);
			if(isWall){
				isWallChanged = true;
			}
		}
		else{
			needReCalc = true;
		}
		
		let wallIds = [];
		if(isWallChanged){
			//如果本次计算就是因为修改了墙造成的
			wallIds.push(p.nodeId);
		}
		else if(needReCalc){
			//如果本次计算时因为修改了门窗造成的，需要全部计算墙
			for(let wallId in thatBuildingDWW.allWallLineMap){
				wallIds.push(wallId);
			}
		}
		
		//找到洞口属性改变的墙
		let needRebuildWallIds = [];
		for(let i = 0; i < wallIds.length; i++){
			let wallId = wallIds[i];
			let wallObject3D = thatBuildingDWW.manager.viewer.allObject3DMap[wallId];	
			let oldHoleValue = wallObject3D.userData.unitInfo.parameters[thatBuildingDWW.wallHolePropertyName] == undefined ? "" : wallObject3D.userData.unitInfo.parameters[thatBuildingDWW.wallHolePropertyName];
			let needProcessHole = wallObject3D.userData.unitInfo.parameters[thatBuildingDWW.wallProcessHolePropertyName] == undefined ? true : wallObject3D.userData.unitInfo.parameters[thatBuildingDWW.wallProcessHolePropertyName];
			if(needProcessHole){
				let allHoleStrs = [];			
				for(let id in thatBuildingDWW.manager.viewer.allObject3DMap){
					let object3D = thatBuildingDWW.manager.viewer.allObject3DMap[id];
					if(object3D.userData.unitInfo.code != null){
						let code = object3D.userData.unitInfo.code;
						let isWindowOrDoor = thatBuildingDWW.checkIsWindow(code) || thatBuildingDWW.checkIsDoor(code);
						if(isWindowOrDoor){ 					
							//判断高度是否重合
							let wallBottom = common3DFunction.mm2m(wallObject3D.userData.unitInfo.parameters[thatBuildingDWW.wallBottomPropertyName]);
							let wallTop = wallBottom + common3DFunction.mm2m(wallObject3D.userData.unitInfo.parameters[thatBuildingDWW.wallHeightPropertyName]);
							if(wallBottom < object3D.position.y && wallTop > object3D.position.y){
								let lines = thatBuildingDWW.allWallLineMap[wallId];
								let holeStr = thatBuildingDWW.getHoleStr(object3D, wallId, lines);
								if(holeStr != null){
									allHoleStrs.push(holeStr);
								}
							}
						}
					}
				}
				let newHoleValue = cmnPcr.arrayToString(allHoleStrs, ";");
				if(oldHoleValue != newHoleValue){
					wallObject3D.userData.unitInfo.parameters[thatBuildingDWW.wallHolePropertyName] = newHoleValue;
					needRebuildWallIds.push(wallId);
				}
			}
		}

		//重新构造墙
		if(needRebuildWallIds.length > 0){
			//重新构造墙
			thatBuildingDWW.manager.viewer.rebuildServerObjectsByIds({
				nodeIds: needRebuildWallIds
			});
		}	
	}

	//暂不启用
	this.reCalcWallHoles = function(p){ 
		let wallId = p.id;
		if(thatBuildingDWW.allWallLineMap[wallId] != null){ //判断是否是墙  
			let wallObject3D = thatBuildingDWW.manager.viewer.allObject3DMap[wallId];	
			let oldHoleValue = p.parameters[thatBuildingDWW.wallHolePropertyName].value == undefined ? "" : p.parameters[thatBuildingDWW.wallHolePropertyName].value;
			let allHoleStrs = [];
			for(let id in thatBuildingDWW.manager.viewer.allObject3DMap){
				let object3D = thatBuildingDWW.manager.viewer.allObject3DMap[id];
				let code = object3D.userData.unitInfo.code;
				let isWindowOrDoor = thatBuildingDWW.checkIsWindow(code) || thatBuildingDWW.checkIsDoor(code);
				if(isWindowOrDoor){ 					
					//判断高度是否重合
					let wallBottom = common3DFunction.mm2m(wallObject3D.userData.unitInfo.parameters[thatBuildingDWW.wallBottomPropertyName]);
					let wallTop = wallBottom + common3DFunction.mm2m(wallObject3D.userData.unitInfo.parameters[thatBuildingDWW.wallHeightPropertyName]);
					if(wallBottom < object3D.position.y && wallTop > object3D.position.y){
						
						let lines = null;
						//闭合曲线墙
						if(thatBuildingDWW.checkIsCategoryType(p.componentCode, thatBuildingDWW.polygonWallCodes)){
							let wallPath = p.parameters[thatBuildingDWW.wallPathPropertyName].value;
							lines = thatBuildingDWW.getPolygonWallLines(wallPath);
						}
						
						//直线墙
						if(thatBuildingDWW.checkIsCategoryType(p.componentCode, thatBuildingDWW.directWallCodes)){
							let startPointStr = p.parameters[thatBuildingDWW.wallStartPropertyName].value;
							let endPointStr = p.parameters[thatBuildingDWW.wallEndPropertyName].value;
							lines = thatBuildingDWW.getDirectWallLines(startPointStr, endPointStr);
						}

						let holeStr = thatBuildingDWW.getHoleStr(object3D, wallId, lines);
						if(holeStr != null){
							allHoleStrs.push(holeStr);
						}
					}
				}
			}
			let newHoleValue = cmnPcr.arrayToString(allHoleStrs, ";");
			if(oldHoleValue != newHoleValue){
				p.parameters[thatBuildingDWW.wallHolePropertyName].value = newHoleValue; 
			} 
		}		
	}

	this.getHoleStr = function(object3D, wallId, lines){
		let object3DPoint = {
			x: object3D.position.x,
			y: object3D.position.z
		};
		let minPoint = null;
		let minDistance = thatBuildingDWW.maxValue;
		let minLine = null;
		for(let i = 0; i < lines.length; i++){
			let wallLine = lines[i];
			let checkFromPoint = {
				x: -thatBuildingDWW.maxValue,
				y: object3DPoint.y
			};
			let checkToPoint = {
				x: thatBuildingDWW.maxValue,
				y: object3DPoint.y
			};
			let intersectPoint = common2DLine.getLineIntersectPoint(checkFromPoint, checkToPoint, wallLine.from, wallLine.to);
			if(intersectPoint == null){
				let distance = Math.abs(checkFromPoint.y - wallLine.from.y);
				if(distance < thatBuildingDWW.attachDistance){					
					let point = {
						x: object3DPoint.x,
						y: wallLine.from.y
					};
					if(common2DLine.checkInSegment(point, wallLine.from, wallLine.to)){
						minPoint = point;
						minDistance = distance;
						minLine = wallLine;
					}
				}
			}
			else if(intersectPoint != null && common2DLine.checkInSegment(intersectPoint, wallLine.from,wallLine.to)){
				let distance = common2DLine.getLength(intersectPoint, object3DPoint);
				if(distance < minDistance){
					minDistance = distance;
					minPoint = intersectPoint;
					minLine = wallLine;
				}
			}
			if(minDistance < thatBuildingDWW.attachDistance){
				let holeWidth = object3D.userData.unitInfo.parameters[thatBuildingDWW.holeWidthPropertyName];
				let holeHeight = object3D.userData.unitInfo.parameters[thatBuildingDWW.holeHeightPropertyName];
				let rotationAngle = common2DLine.getAngle(minLine.to, minLine.from);
				let holeStr = common3DFunction.m2mm(object3D.position.x) + ","  
					+ common3DFunction.m2mm(object3D.position.y) + ","  
					+ common3DFunction.m2mm(object3D.position.z) + "," 
					+ holeWidth + "," + 
					+ holeHeight + ","  
					+ common3DFunction.radian2degree(rotationAngle);
				return holeStr;
			}
		}
		return null;
	}

	this.reGetAllWallLines = function(exceptIdMap){
		let allWallObject3Ds = thatBuildingDWW.getAllWalls();
		let allWallLineMap = {};
		for(let i = 0; i < allWallObject3Ds.length; i++){
			let wallObject3D = allWallObject3Ds[i];
			let object3DId = wallObject3D.userData.unitInfo.id;
			if(exceptIdMap == null || exceptIdMap[object3DId] == null){
				let unitInfo = wallObject3D.userData.unitInfo;
				
				//闭合曲线墙
				if(thatBuildingDWW.checkIsCategoryType(unitInfo.code, thatBuildingDWW.polygonWallCodes)){
					let wallPath = unitInfo.parameters[thatBuildingDWW.wallPathPropertyName];
					let lines = thatBuildingDWW.getPolygonWallLines(wallPath);
					if(lines.length > 0){
						allWallLineMap[object3DId] = lines;
					}
				}
				
				//直线墙
				if(thatBuildingDWW.checkIsCategoryType(unitInfo.code, thatBuildingDWW.directWallCodes)){
					let startPointStr = unitInfo.parameters[thatBuildingDWW.wallStartPropertyName];
					let endPointStr = unitInfo.parameters[thatBuildingDWW.wallEndPropertyName];
					let lines = thatBuildingDWW.getDirectWallLines(startPointStr, endPointStr);
					if(lines.length > 0){
						allWallLineMap[object3DId] = lines;
					}
				}
			}
		}
		thatBuildingDWW.allWallLineMap =  allWallLineMap;
	}

	this.getDirectWallLines = function(startPointStr, endPointStr){
		let lines = [];
		if(startPointStr != null && startPointStr.trim().length > 0 && endPointStr != null && endPointStr.trim().length > 0){ 
			let startPointPartStrs = startPointStr.split(",");
			let endPointPartStrs = endPointStr.split(",");
			let from = {
				x: common3DFunction.mm2m(cmnPcr.strToDecimal(startPointPartStrs[0].trim())),
				y:common3DFunction.mm2m(cmnPcr.strToDecimal(startPointPartStrs[1].trim()))
			}; 
			let to = {
				x: common3DFunction.mm2m(cmnPcr.strToDecimal(endPointPartStrs[0].trim())),
				y:common3DFunction.mm2m(cmnPcr.strToDecimal(endPointPartStrs[1].trim()))
			}; 
			//线段墙
			lines.push({
				from: from,
				to: to
			}); 
		}
		return lines;
	}

	this.getPolygonWallLines = function(wallPath){
		let lines = [];
		if(wallPath != null && wallPath.trim().length > 0){
			let wallPointStrs = wallPath.trim().split(";");
			let wallPoints = [];
			for(let j = 0; j < wallPointStrs.length; j++){
				let wallPointStr = wallPointStrs[j];
				let pStrs = wallPointStr.split(",");
				let x = common3DFunction.mm2m(cmnPcr.strToDecimal(pStrs[0].trim()));
				let y = common3DFunction.mm2m(cmnPcr.strToDecimal(pStrs[1].trim()));
				wallPoints.push({
					x: x,
					y: y
				});
			} 

			//闭合多线段的墙
			for(let j = 0; j < wallPoints.length; j++){
				let from = wallPoints[j];
				let to = j === wallPoints.length - 1 ? wallPoints[0] : wallPoints[j + 1];
				lines.push({
					from: from,
					to: to
				});
			}
		}
		return lines;
	}
}
export default S3dBuildingDWW