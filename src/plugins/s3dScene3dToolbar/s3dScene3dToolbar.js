import {cmnPcr, s3dNormalViewport, s3dViewerStatus, serverAccess} from "../../commonjs/common/static.js"
import "./s3dScene3dToolbar.css"
import {msgBox} from "../../commonjs/common/static.js"

//S3dWeb场景设计
let S3dScene3dToolbar = function (){
	//当前对象
	const thatS3dScene3dToolbar= this;
	
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
		let allFuncs = thatS3dScene3dToolbar.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dScene3dToolbar.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dScene3dToolbar.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	}
	 
	//初始化
	this.init = function(p){
		thatS3dScene3dToolbar.containerId = p.containerId;
		thatS3dScene3dToolbar.manager = p.manager;
		thatS3dScene3dToolbar.unitTypeConfig = p.config.unitTypeConfig;
		thatS3dScene3dToolbar.serviceConfig = {
			save: {
				serviceName: p.config.serviceConfig.save.serviceName,
				functionName: p.config.serviceConfig.save.functionName,
			}
		};
		thatS3dScene3dToolbar.imageDirectory = p.config.imageDirectory;


		thatS3dScene3dToolbar.showScene3dToolbar(p.config.title);
		$("#" + thatS3dScene3dToolbar.containerId).find(".s3dScene3dToolbarCloseBtn").click(function(){
			thatS3dScene3dToolbar.hide();
		});

		if(p.config.visible){
			thatS3dScene3dToolbar.show();
		}
		else{
			thatS3dScene3dToolbar.hide();
		}
	}
	
	//隐藏
	this.hide = function(){
		$("#" + thatS3dScene3dToolbar.containerId).find(".s3dScene3dToolbarContainer").css({"display": "none"});
	}
	
	//隐藏
	this.show = function(){
		$("#" + thatS3dScene3dToolbar.containerId).find(".s3dScene3dToolbarContainer").css({"display": "block"});
	}
	
	//获取显示状态
	this.getVisible = function(){
		return $("#" + thatS3dScene3dToolbar.containerId).find(".s3dScene3dToolbarContainer").css("display") === "block";
	}
	
	//显示
	this.showScene3dToolbar = function(title){
		//构造html
		let listHtml = thatS3dScene3dToolbar.getListHtml();
		let container = $("#" + thatS3dScene3dToolbar.containerId);
		$(container).append(listHtml);
		$(container).find(".s3dScene3dToolbarTitle").text(title);

		//resize按钮
		thatS3dScene3dToolbar.updateResizeBtn();

		$(container).find(".s3dScene3dToolbarContainer").find(".s3dScene3dToolbarBtnContainer").each(function (index, element){
			let imageName = $(element).attr("imageName");
			if(imageName != null) {
				let imageUrl = thatS3dScene3dToolbar.imageDirectory + imageName + ".png";
				$(element).css("background-image", "url('" + imageUrl + "')");
			}
		});

		//绑定事件
		$(container).find(".s3dScene3dToolbarContainer").find(".s3dScene3dToolbarBtnContainer").click(function (){
			let btnName = $(this).attr("name");
			switch (btnName){
				case "saveModel":{
					thatS3dScene3dToolbar.saveModel();
					break;
				}
				case "setting":{
					if (thatS3dScene3dToolbar.manager.setting.getVisible()) {
						thatS3dScene3dToolbar.manager.setting.hide();
					}
					else {
						thatS3dScene3dToolbar.manager.setting.show();
					}
					break;
				}
				case "ruler":{
					thatS3dScene3dToolbar.manager.ruler.do();
					break;
				}
				case "splitter":{
					thatS3dScene3dToolbar.manager.splitter.do();
					break;
				}
				case "topViewport":{
					thatS3dScene3dToolbar.manager.viewer.setNormalViewport(s3dNormalViewport.top);
					break;
				}
				case "property":{
					if (thatS3dScene3dToolbar.manager.propertyEditor.getVisible()) {
						thatS3dScene3dToolbar.manager.propertyEditor.hide();
					} else {
						thatS3dScene3dToolbar.manager.propertyEditor.show();
					}
					break;
				}
				case "componentList":{
					if (thatS3dScene3dToolbar.manager.adder.getVisible()) {
						thatS3dScene3dToolbar.manager.adder.hide();
					}
					else {
						thatS3dScene3dToolbar.manager.adder.show();
					}
					break;
				}
				case "statusBar":{
					if (thatS3dScene3dToolbar.manager.statusBar.getVisible()) {
						thatS3dScene3dToolbar.manager.statusBar.hide();
					}
					else {
						thatS3dScene3dToolbar.manager.statusBar.show();
					}
					break;
				}
				case "tree":{
					if (thatS3dScene3dToolbar.manager.treeEditor.getVisible()) {
						thatS3dScene3dToolbar.manager.treeEditor.hide();
					} else {
						thatS3dScene3dToolbar.manager.treeEditor.show();
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
		let s3dObject = thatS3dScene3dToolbar.manager.s3dObject;
		s3dObject.groups = thatS3dScene3dToolbar.manager.treeEditor.getResultGroups();
		s3dObject.unitMap = thatS3dScene3dToolbar.manager.viewer.getResultUnitMap();
		s3dObject.unitTypeMap = thatS3dScene3dToolbar.manager.viewer.getResultUnitTypeMap();
		let modelText = cmnPcr.jsonToStr(s3dObject);

		let requestParam = {
			modelId: s3dObject.id,
			modelName: s3dObject.name,
			modelText: modelText
		};

		serverAccess.request({
			serverUrl: thatS3dScene3dToolbar.manager.service.url,
			serviceName: thatS3dScene3dToolbar.serviceConfig.save.serviceName,
			appKey: thatS3dScene3dToolbar.manager.service.appKey,
			funcName: thatS3dScene3dToolbar.serviceConfig.save.functionName,
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

	this.updateResizeBtn = function (){
		let toolbarContainer = $("#" + thatS3dScene3dToolbar.containerId).find(".s3dScene3dToolbarContainer")[0];
		let resizeBtns = $(toolbarContainer).find(".s3dScene3dToolbarResizeBtn");

		let newResizeBtnHtml;
		if(resizeBtns.length === 0){
			newResizeBtnHtml = thatS3dScene3dToolbar.getResizeBtnHtml(true);
		}
		else {
			let resizeBtn = resizeBtns[0];
			let status = $(resizeBtn).attr("status");

			//执行隐藏或还原
			switch (status) {
				case "normal": {
					$(toolbarContainer).addClass("s3dScene3dToolbarContainerMin");
					break;
				}
				case "min": {
					$(toolbarContainer).removeClass("s3dScene3dToolbarContainerMin");
					break;
				}
			}

			//获取新的按钮html
			switch (status) {
				case "normal": {
					newResizeBtnHtml = thatS3dScene3dToolbar.getResizeBtnHtml(false);
					break;
				}
				case "min": {
					newResizeBtnHtml = thatS3dScene3dToolbar.getResizeBtnHtml(true);
					break;
				}
			}
			$(resizeBtn).remove();
		}
		$(toolbarContainer).append(newResizeBtnHtml);

		//绑定事件
		$(toolbarContainer).find(".s3dScene3dToolbarResizeBtn").click(function (){
			thatS3dScene3dToolbar.updateResizeBtn();
		});
	}

	this.getResizeBtnHtml = function (closed){
		if(closed){
			return "<div class=\"s3dScene3dToolbarResizeBtn\" title=\"最小化工具栏\" status=\"normal\"><svg xmlns=\"http://www.w3.org/2000/svg\" class=\"s3dScene3dToolbarBtnSvg\" width=\"20\" height=\"24\">"
				+ "<line x1=\"2\" y1=\"10\" x2=\"14\" y2=\"10\" class=\"s3dScene3dToolbarResizeBtnLine\" />"
				+ "<line x1=\"2\" y1=\"11\" x2=\"14\" y2=\"11\" class=\"s3dScene3dToolbarResizeBtnLine\" />"
				+ "</svg></div>";
		}
		else{
			return "<div class=\"s3dScene3dToolbarResizeBtn\" title=\"还原工具栏\" status=\"min\"><svg xmlns=\"http://www.w3.org/2000/svg\" class=\"s3dScene3dToolbarBtnSvg\" width=\"20\" height=\"24\">"
				+ "<line x1=\"2\" y1=\"9\" x2=\"14\" y2=\"9\" class=\"s3dScene3dToolbarResizeBtnLine\" />"
				+ "<line x1=\"2\" y1=\"16\" x2=\"14\" y2=\"16\" class=\"s3dScene3dToolbarResizeBtnLine\" />"
				+ "<line x1=\"2\" y1=\"9\" x2=\"2\" y2=\"16\" class=\"s3dScene3dToolbarResizeBtnLine\" />"
				+ "<line x1=\"14\" y1=\"9\" x2=\"14\" y2=\"16\" class=\"s3dScene3dToolbarResizeBtnLine\" />"
				+ "</svg></div>";
		}
	}
	
	//获取list html
	this.getListHtml = function(){
		let saveBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"save\" title=\"保存\" name=\"saveModel\"></div>";

		let componentListBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"componentList\" title=\"显示/隐藏组件库\" name=\"componentList\"></div>";

		let rulerBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"ruler\" title=\"测距\" name=\"ruler\"></div>";

		let splitterBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"splitter\" title=\"分解，将大模型拆成多个小模型\" name=\"splitter\"></div>";

		let propertyBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"property\" title=\"显示/隐藏属性编辑器\" name=\"property\"></div>";

		let settingBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"setting\" title=\"设置\" name=\"setting\"></div>";

		let statusBarBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"statusBar\" title=\"显示/隐藏状态栏\" name=\"statusBar\"></div>";

		let topViewportBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"topViewport\" title=\"显示原点\" name=\"topViewport\"></div>";

		let treeBtnHtml = "<div class=\"s3dScene3dToolbarBtnContainer\" imageName=\"tree\" title=\"显示/隐藏模型结构\" name=\"tree\"></div>";

		let btnSplitterHtml = "<div class=\"s3dScene3dToolbarBtnSplitter\">"
			+ "<svg xmlns=\"http://www.w3.org/2000/svg\" class=\"s3dScene3dToolbarBtnSvg\" width=\"5\" height=\"32\">"
			+ "<line x1=\"2\" y1=\"4\" x2=\"2\" y2=\"28\" class=\"s3dScene3dToolbarBtnSplitterLineA\" />"
			+ "</svg>"
			+ "</div>";

		return "<div class=\"s3dScene3dToolbarContainer\">"
			+ "<div class=\"s3dScene3dToolbarBackground\"></div>"
			+ "<div class=\"s3dScene3dToolbarHeader\">"
			+ "<div class=\"s3dScene3dToolbarTitle\"></div>"

			//不可关闭
			//+ "<div class=\"s3dScene3dToolbarCloseBtn\">×</div>"

			+ "</div>"
			+ "<div class=\"s3dScene3dToolbarInnerContainer\">"
			+ "<div class=\"s3dScene3dToolbarInnerLine\">"
			+ settingBtnHtml
			+ saveBtnHtml
			+ btnSplitterHtml
			+ topViewportBtnHtml
			+ rulerBtnHtml
			+ splitterBtnHtml
			+ "</div>"
			+ "<div class=\"s3dScene3dToolbarInnerLine\">"
			+ treeBtnHtml
			+ propertyBtnHtml
			+ componentListBtnHtml
			+ statusBarBtnHtml
			+ "</div>"
			+ "</div>"
			+ "</div>";
	}
}

export default S3dScene3dToolbar