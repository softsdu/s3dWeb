import {cmnPcr, s3dNormalViewport, s3dViewerStatus, serverAccess} from "../../commonjs/common/static.js"
import "./s3dHouse2DToolbar.css"
import {msgBox} from "../../commonjs/common/static.js"

//S3dWeb 户型工具栏
let S3dHouse2DToolbar = function (){
	//当前对象
	const thatS3dHouse2DToolbar= this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	//构件类型设置
	this.unitTypeConfig = null;

	//toolbar的图标所属文件夹
	this.imageDirectory = null;

	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dHouse2DToolbar.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dHouse2DToolbar.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dHouse2DToolbar.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	}
	 
	//初始化
	this.init = function(p){
		thatS3dHouse2DToolbar.containerId = p.containerId;
		thatS3dHouse2DToolbar.manager = p.manager;
		thatS3dHouse2DToolbar.unitTypeConfig = p.config.unitTypeConfig;
		thatS3dHouse2DToolbar.serviceConfig = {
			save: {
				serviceName: p.config.serviceConfig.save.serviceName,
				functionName: p.config.serviceConfig.save.functionName,
			}
		};
		thatS3dHouse2DToolbar.imageDirectory = p.config.imageDirectory;


		thatS3dHouse2DToolbar.showHouse2DToolbar(p.config.title);
		$("#" + thatS3dHouse2DToolbar.containerId).find(".s3dHouse2DToolbarCloseBtn").click(function(){
			thatS3dHouse2DToolbar.hide();
		});

		if(p.config.visible){
			thatS3dHouse2DToolbar.show();
		}
		else{
			thatS3dHouse2DToolbar.hide();
		}
	}
	
	//隐藏
	this.hide = function(){
		$("#" + thatS3dHouse2DToolbar.containerId).find(".s3dHouse2DToolbarContainer").css({"display": "none"});
	}
	
	//隐藏
	this.show = function(){
		$("#" + thatS3dHouse2DToolbar.containerId).find(".s3dHouse2DToolbarContainer").css({"display": "block"});
	}
	
	//获取显示状态
	this.getVisible = function(){
		return $("#" + thatS3dHouse2DToolbar.containerId).find(".s3dHouse2DToolbarContainer").css("display") === "block";
	}
	
	//显示
	this.showHouse2DToolbar = function(title){
		//构造html
		let listHtml = thatS3dHouse2DToolbar.getListHtml();
		let container = $("#" + thatS3dHouse2DToolbar.containerId);
		$(container).append(listHtml);
		$(container).find(".s3dHouse2DToolbarTitle").text(title);

		//resize按钮
		thatS3dHouse2DToolbar.updateResizeBtn();

		$(container).find(".s3dHouse2DToolbarContainer").find(".s3dHouse2DToolbarBtnContainer").each(function (index, element){
			let imageName = $(element).attr("imageName");
			if(imageName != null) {
				let imageUrl = thatS3dHouse2DToolbar.imageDirectory + imageName + ".png";
				$(element).css("background-image", "url('" + imageUrl + "')");
			}
		});

		//绑定事件
		$(container).find(".s3dHouse2DToolbarContainer").find(".s3dHouse2DToolbarBtnContainer").click(function (){
			let btnName = $(this).attr("name");
			switch (btnName){
				case "generateWall2D":{
					thatS3dHouse2DToolbar.generateWall2D();
					break;
				}
				case "drawRoom2D":{
					thatS3dHouse2DToolbar.drawRoom2D();
					break;
				}
				case "saveModel":{
					thatS3dHouse2DToolbar.saveModel();
					break;
				}
				case "setting":{
					if (thatS3dHouse2DToolbar.manager.setting2D.getVisible()) {
						thatS3dHouse2DToolbar.manager.setting2D.hide();
					}
					else {
						thatS3dHouse2DToolbar.manager.setting2D.show();
					}
					break;
				}
				case "ruler":{
					thatS3dHouse2DToolbar.manager.ruler.do();
					break;
				}
				case "topViewport":{
					thatS3dHouse2DToolbar.manager.viewer.setNormalViewport(s3dNormalViewport.top);
					break;
				}
				case "property":{
					if (thatS3dHouse2DToolbar.manager.propertyEditor.getVisible()) {
						thatS3dHouse2DToolbar.manager.propertyEditor.hide();
					} else {
						thatS3dHouse2DToolbar.manager.propertyEditor.show();
					}
					break;
				}
				case "componentList":{
					if (thatS3dHouse2DToolbar.manager.adder.getVisible()) {
						thatS3dHouse2DToolbar.manager.adder.hide();
					}
					else {
						thatS3dHouse2DToolbar.manager.adder.show();
					}
					break;
				}
				case "statusBar":{
					if (thatS3dHouse2DToolbar.manager.statusBar.getVisible()) {
						thatS3dHouse2DToolbar.manager.statusBar.hide();
					}
					else {
						thatS3dHouse2DToolbar.manager.statusBar.show();
					}
					break;
				}
				case "tree":{
					if (thatS3dHouse2DToolbar.manager.treeEditor.getVisible()) {
						thatS3dHouse2DToolbar.manager.treeEditor.hide();
					} else {
						thatS3dHouse2DToolbar.manager.treeEditor.show();
					}
					break;
				}
				default:{
					msgBox.alert({info: "未知的按钮. btnName=" + btnName});
					break;
				}
			}
		});
	}

	//保存模型
	this.saveModel = function (){
		let s3dObject = thatS3dHouse2DToolbar.manager.s3dObject;
		s3dObject.groups = thatS3dHouse2DToolbar.manager.treeEditor.getResultGroups();
		s3dObject.unitMap = thatS3dHouse2DToolbar.manager.viewer.getResultUnitMap();
		s3dObject.unitTypeMap = thatS3dHouse2DToolbar.manager.viewer.getResultUnitTypeMap();
		let modelText = cmnPcr.jsonToStr(s3dObject);

		let requestParam = {
			modelId: s3dObject.id,
			modelName: s3dObject.name,
			modelText: modelText
		};

		serverAccess.request({
			serverUrl: thatS3dHouse2DToolbar.manager.service.url,
			serviceName: thatS3dHouse2DToolbar.serviceConfig.save.serviceName,
			appKey: thatS3dHouse2DToolbar.manager.service.appKey,
			funcName: thatS3dHouse2DToolbar.serviceConfig.save.functionName,
			args: {
				requestParam: cmnPcr.jsonToStr(requestParam)
			},
			successFunc: function (obj) {
				msgBox.alert({info: "保存成功."});
			},
			failFunc: function (obj) {
				msgBox.error({title: "提示", info: obj.message});
			},
			errorFunc: function(httpRequest, textStatus, errorThrown){
				msgBox.error({info: "无法连通S3d服务"});
			}
		})
	}

	//绘制房间轮廓
	this.drawRoom2D = function (){
		let objectIds = thatS3dHouse2DToolbar.manager.viewer.getSelectedObject3DIds();
		if(objectIds.length === 0){
			msgBox.alert({info: "请选择房间"});
		}
		else if(objectIds.length > 1){
			msgBox.alert({info: "请选择一个房间"})
		}
		else{
			let objectId = objectIds[0];
			let object3D = thatS3dHouse2DToolbar.manager.viewer.getObject3DById(objectId);
			let unitInfo = object3D.userData.unitInfo;
			if(unitInfo.code.startsWith(thatS3dHouse2DToolbar.unitTypeConfig.room2D.categoryCode)){
				//转为draw状态
				thatS3dHouse2DToolbar.manager.viewer.changeStatus({
					status: s3dViewerStatus.draw
				});

				thatS3dHouse2DToolbar.manager.pathDrawingTool.show({
					id: unitInfo.id,
					pointStr: unitInfo.parameters["点"].value,
					lineStr: unitInfo.parameters["线"].value,
					constraintStr: unitInfo.parameters["约束"].value,
					pathStr: unitInfo.parameters["路径"].value
				});
			}
			else{
				msgBox.alert({info: "请选择房间"})
			}
		}
	}

	//根据房间生成墙
	this.generateWall2D = function (){
		//根据房间构造轮廓参数
		let parameters = {};
		let allRoomObject3Ds = thatS3dHouse2DToolbar.manager.viewer.getObject3DsByCodePrefix(thatS3dHouse2DToolbar.unitTypeConfig.room2D.categoryCode);
		if(allRoomObject3Ds.length > 0) {
			let allRoomPolygonStrs = [];
			for (let i = 0; i < allRoomObject3Ds.length; i++) {
				let roomObject3D = allRoomObject3Ds[i];
				let unitInfo = roomObject3D.userData.unitInfo;
				let roomPolygonStr = unitInfo.parameters["轮廓"].value;
				allRoomPolygonStrs.push(roomPolygonStr);
			}
			parameters["多房间轮廓"] = {
				value: cmnPcr.arrayToString(allRoomPolygonStrs, "#"),
				isGeo: true
			};
		}
		else{
			msgBox.alert({info: "没有找到任何房间信息."});
			return false;
		}

		//删除原有的墙
		let wallObject3Ds = thatS3dHouse2DToolbar.manager.viewer.getObject3DsByCodePrefix(thatS3dHouse2DToolbar.unitTypeConfig.wall2D.categoryCode);
		if(wallObject3Ds.length > 0){
			if(!msgBox.confirm({info: "墙已经存在, 是否重新生成?"})){
				return false;
			}
			else{
				let unitIds = [];
				for(let i = 0; i < wallObject3Ds.length; i++){
					let wallObject3D = wallObject3Ds[i];
					unitIds.push(wallObject3D.userData.unitInfo.id);
				}
				thatS3dHouse2DToolbar.manager.viewer.removeObjects(unitIds, false);
			}
		}

		let groupNodeId = thatS3dHouse2DToolbar.manager.treeEditor.getCurrentGroupNodeId();
		thatS3dHouse2DToolbar.manager.viewer.addNewServerObject({
			name: "墙",
			position: [0, 0, 0],
			rotation:  [0, 0, 0],
			code: thatS3dHouse2DToolbar.unitTypeConfig.wall2D.defaultCode,
			versionNum: thatS3dHouse2DToolbar.unitTypeConfig.wall2D.defaultVersionNum,
			isOnGround: false,
			needSelectAfterAdd: true,
			customInfo: {},
			parameters: parameters,
			groupNodeId: groupNodeId
		});
	}

	this.updateResizeBtn = function (){
		let toolbarContainer = $("#" + thatS3dHouse2DToolbar.containerId).find(".s3dHouse2DToolbarContainer")[0];
		let resizeBtns = $(toolbarContainer).find(".s3dHouse2DToolbarResizeBtn");

		let newResizeBtnHtml;
		if(resizeBtns.length === 0){
			newResizeBtnHtml = thatS3dHouse2DToolbar.getResizeBtnHtml(true);
		}
		else {
			let resizeBtn = resizeBtns[0];
			let status = $(resizeBtn).attr("status");

			//执行隐藏或还原
			switch (status) {
				case "normal": {
					$(toolbarContainer).addClass("s3dHouse2DToolbarContainerMin");
					break;
				}
				case "min": {
					$(toolbarContainer).removeClass("s3dHouse2DToolbarContainerMin");
					break;
				}
			}

			//获取新的按钮html
			switch (status) {
				case "normal": {
					newResizeBtnHtml = thatS3dHouse2DToolbar.getResizeBtnHtml(false);
					break;
				}
				case "min": {
					newResizeBtnHtml = thatS3dHouse2DToolbar.getResizeBtnHtml(true);
					break;
				}
			}
			$(resizeBtn).remove();
		}
		$(toolbarContainer).append(newResizeBtnHtml);

		//绑定事件
		$(toolbarContainer).find(".s3dHouse2DToolbarResizeBtn").click(function (){
			thatS3dHouse2DToolbar.updateResizeBtn();
		});
	}

	this.getResizeBtnHtml = function (closed){
		if(closed){
			return "<div class=\"s3dHouse2DToolbarResizeBtn\" title=\"最小化工具栏\" status=\"normal\"><svg xmlns=\"http://www.w3.org/2000/svg\" class=\"s3dHouse2DToolbarBtnSvg\" width=\"16\" height=\"16\">"
				+ "<line x1=\"2\" y1=\"7\" x2=\"14\" y2=\"7\" class=\"s3dHouse2DToolbarResizeBtnLine\" />"
				+ "<line x1=\"2\" y1=\"8\" x2=\"14\" y2=\"8\" class=\"s3dHouse2DToolbarResizeBtnLine\" />"
				+ "</svg></div>";
		}
		else{
			return "<div class=\"s3dHouse2DToolbarResizeBtn\" title=\"还原工具栏\" status=\"min\"><svg xmlns=\"http://www.w3.org/2000/svg\" class=\"s3dHouse2DToolbarBtnSvg\" width=\"16\" height=\"16\">"
				+ "<line x1=\"2\" y1=\"5\" x2=\"14\" y2=\"5\" class=\"s3dHouse2DToolbarResizeBtnLine\" />"
				+ "<line x1=\"2\" y1=\"11\" x2=\"14\" y2=\"11\" class=\"s3dHouse2DToolbarResizeBtnLine\" />"
				+ "<line x1=\"2\" y1=\"5\" x2=\"2\" y2=\"11\" class=\"s3dHouse2DToolbarResizeBtnLine\" />"
				+ "<line x1=\"14\" y1=\"5\" x2=\"14\" y2=\"11\" class=\"s3dHouse2DToolbarResizeBtnLine\" />"
				+ "</svg></div>";
		}
	}
	
	//获取list html
	this.getListHtml = function(){
		let roomBtnHtml = "<div class=\"s3dHouse2DToolbarBtnContainer\" title=\"绘制房间轮廓\" name=\"drawRoom2D\">"
			+ "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"s3dHouse2DToolbarBtnSvg\" width=\"32\" height=\"32\">"
			+ "<line x1=\"5\" y1=\"5\" x2=\"16\" y2=\"5\" class=\"s3dHouse2DToolbarBtnLine\" />"
			+ "<line x1=\"16\" y1=\"5\" x2=\"16\" y2=\"12\" class=\"s3dHouse2DToolbarBtnLine\" />"
			+ "<line x1=\"16\" y1=\"12\" x2=\"27\" y2=\"12\" class=\"s3dHouse2DToolbarBtnLine\" />"
			+ "<line x1=\"27\" y1=\"12\" x2=\"27\" y2=\"27\" class=\"s3dHouse2DToolbarBtnLine\" />"
			+ "<line x1=\"27\" y1=\"27\" x2=\"5\" y2=\"27\" class=\"s3dHouse2DToolbarBtnLine\" />"
			+ "<line x1=\"5\" y1=\"27\" x2=\"5\" y2=\"5\" class=\"s3dHouse2DToolbarBtnLine\" />"
			+ "</svg>"
			+ "</div>";

		let wallBtnHtml = "<div class=\"s3dHouse2DToolbarBtnContainer\" title=\"自动生成墙\" name=\"generateWall2D\">"
			+ "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"s3dHouse2DToolbarBtnSvg\" width=\"32\" height=\"32\">"
			+ "<line x1=\"5\" y1=\"5\" x2=\"27\" y2=\"5\" class=\"s3dHouse2DToolbarBtnLine\" />"
			+ "<line x1=\"5\" y1=\"27\" x2=\"27\" y2=\"27\" class=\"s3dHouse2DToolbarBtnLine\" />"
			+ "<line x1=\"5\" y1=\"5\" x2=\"5\" y2=\"27\" class=\"s3dHouse2DToolbarBtnLine\" />"
			+ "<line x1=\"27\" y1=\"5\" x2=\"27\" y2=\"27\" class=\"s3dHouse2DToolbarBtnLine\" />"
			+ "<line x1=\"5\" y1=\"12\" x2=\"27\" y2=\"12\" class=\"s3dHouse2DToolbarBtnLine\" />"
			+ "<line x1=\"5\" y1=\"20\" x2=\"27\" y2=\"20\" class=\"s3dHouse2DToolbarBtnLine\" />"
			+ "<line x1=\"10\" y1=\"5\" x2=\"10\" y2=\"12\" class=\"s3dHouse2DToolbarBtnLine\" />"
			+ "<line x1=\"22\" y1=\"5\" x2=\"22\" y2=\"12\" class=\"s3dHouse2DToolbarBtnLine\" />"
			+ "<line x1=\"16\" y1=\"12\" x2=\"16\" y2=\"20\" class=\"s3dHouse2DToolbarBtnLine\" />"
			+ "<line x1=\"10\" y1=\"20\" x2=\"10\" y2=\"27\" class=\"s3dHouse2DToolbarBtnLine\" />"
			+ "<line x1=\"22\" y1=\"20\" x2=\"22\" y2=\"27\" class=\"s3dHouse2DToolbarBtnLine\" />"
			+ "</svg>"
			+ "</div>";

		let saveBtnHtml = "<div class=\"s3dHouse2DToolbarBtnContainer\" imageName=\"save\" title=\"保存\" name=\"saveModel\"></div>";

		let componentListBtnHtml = "<div class=\"s3dHouse2DToolbarBtnContainer\" imageName=\"componentList\" title=\"显示/隐藏组件库\" name=\"componentList\"></div>";

		let rulerBtnHtml = "<div class=\"s3dHouse2DToolbarBtnContainer\" imageName=\"ruler\" title=\"测量\" name=\"ruler\"></div>";

		let propertyBtnHtml = "<div class=\"s3dHouse2DToolbarBtnContainer\" imageName=\"property\" title=\"显示/隐藏属性编辑器\" name=\"property\"></div>";

		let settingBtnHtml = "<div class=\"s3dHouse2DToolbarBtnContainer\" imageName=\"setting\" title=\"设置\" name=\"setting\"></div>";

		let statusBarBtnHtml = "<div class=\"s3dHouse2DToolbarBtnContainer\" imageName=\"statusBar\" title=\"显示/隐藏状态栏\" name=\"statusBar\"></div>";

		let topViewportBtnHtml = "<div class=\"s3dHouse2DToolbarBtnContainer\" imageName=\"topViewport\" title=\"显示原点\" name=\"topViewport\"></div>";

		let treeBtnHtml = "<div class=\"s3dHouse2DToolbarBtnContainer\" imageName=\"tree\" title=\"显示/隐藏模型结构\" name=\"tree\"></div>";

		let spliterHtml = "<div class=\"s3dHouse2DToolbarBtnSplitter\">"
			+ "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"s3dHouse2DToolbarBtnSvg\" width=\"32\" height=\"32\">"
			+ "<line x1=\"3\" y1=\"0\" x2=\"3\" y2=\"32\" class=\"s3dHouse2DToolbarBtnSplitterLineA\" />"
			+ "<line x1=\"4\" y1=\"0\" x2=\"4\" y2=\"32\" class=\"s3dHouse2DToolbarBtnSplitterLineB\" />"
			+ "</svg>"
			+ "</div>";

		return "<div class=\"s3dHouse2DToolbarContainer\">"
			+ "<div class=\"s3dHouse2DToolbarBackground\"></div>"
			+ "<div class=\"s3dHouse2DToolbarHeader\">"
			+ "<div class=\"s3dHouse2DToolbarTitle\"></div>"

			//不可关闭
			//+ "<div class=\"s3dHouse2DToolbarCloseBtn\">×</div>"

			+ "</div>"
			+ "<div class=\"s3dHouse2DToolbarInnerContainer\">"
			+ "<div class=\"s3dHouse2DToolbarInnerLine\">"
			+ topViewportBtnHtml
			+ rulerBtnHtml
			+ spliterHtml
			+ treeBtnHtml
			+ propertyBtnHtml
			+ componentListBtnHtml
			+ statusBarBtnHtml
			+ "</div>"
			+ "<div class=\"s3dHouse2DToolbarInnerLine\">"
			+ roomBtnHtml
			+ wallBtnHtml
			+ spliterHtml
			+ settingBtnHtml
			+ spliterHtml
			+ saveBtnHtml
			+ "</div>"
			+ "</div>"
			+ "</div>";
	}
}

export default S3dHouse2DToolbar