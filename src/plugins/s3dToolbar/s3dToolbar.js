import {cmnPcr} from "../../commonjs/common/static.js"
import "./s3dToolbar.css"

//S3dWeb 工具栏
let S3dToolbar = function (){
	
	//当前对象
	const thatS3dToolbar = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null; 
	
	//所有工具栏按钮json
	this.buttonJArray = null; 

	//节点ID与json
	this.id2ButtonJsonMap = null;

	//初始化
	this.init = function(p){
		thatS3dToolbar.containerId = p.containerId;
		thatS3dToolbar.manager = p.manager; 
		thatS3dToolbar.buttonJArray = p.config.buttonJArray;		
		thatS3dToolbar.id2ButtonJsonMap = {};
		thatS3dToolbar.initId2ButtonJsonMap(p.config.buttonJArray, thatS3dToolbar.id2ButtonJsonMap);
		thatS3dToolbar.showToolbar(p.config.buttonJArray);

		if(p.config.visible){
			thatS3dToolbar.show();
		}
		else{
			thatS3dToolbar.hide();
		}
	}

	//隐藏
	this.hide = function(){
		$("#" + thatS3dToolbar.containerId).find(".s3dToolbarContainer").css({"display": "none"});
	}

	//隐藏
	this.show = function(){
		$("#" + thatS3dToolbar.containerId).find(".s3dToolbarContainer").css({"display": "block"});
	}

	//获取显示状态
	this.getVisible = function(){
		return $("#" + thatS3dToolbar.containerId).find(".s3dToolbarContainer").css("display") === "block";
	}
	
	//显示工具栏
	this.showToolbar = function(buttonJArray){
		//构造html
		let toolbarHtml = thatS3dToolbar.getToolbarHtml(buttonJArray);
		let container = $("#" + thatS3dToolbar.containerId);
		$(container).append(toolbarHtml);
		
		//水平居中
		let toolbarContainer = $(container).find(".s3dToolbarContainer")[0];
		let toolbarWidth = $(toolbarContainer).width();
		$(toolbarContainer).css({"margin-left": (-toolbarWidth / 2) + "px"});
		
		//点击节点名称事件
		$(container).find(".s3dToolbarBtnContainer").click(function(){
			let buttonId = $(this).attr("buttonId");
			let buttonJson = thatS3dToolbar.id2ButtonJsonMap[buttonId];
			buttonJson.onButtonClick({});
		}); 
	}
 
	//初始化节点id与json对照
	this.initId2ButtonJsonMap = function(buttonJArray, id2ButtonJsonMap){
		if(buttonJArray != null && buttonJArray.length > 0){
			for(let i = 0; i < buttonJArray.length; i++){
				let buttonJson = buttonJArray[i];
				id2ButtonJsonMap[buttonJson.id] = buttonJson;
				thatS3dToolbar.initId2ButtonJsonMap(buttonJson.children, id2ButtonJsonMap);
			}
		}
	}
	
	//获取工具栏html
	this.getToolbarHtml = function(buttonJArray){
		let toolbarHtml = "<div class=\"s3dToolbarContainer\">";
		toolbarHtml += "<div class=\"s3dToolbarBackground\"></div>";
		toolbarHtml += "<div class=\"s3dToolbarInnerContainer\">";
		for(let i = 0; i < buttonJArray.length; i++){
			let buttonJson = buttonJArray[i];
			let childButtonHtml = thatS3dToolbar.getButtonHtml(buttonJson);
			toolbarHtml += childButtonHtml;
		}
		toolbarHtml += "</div>";
		toolbarHtml += "</div>";
		return toolbarHtml;
	}
	
	//获取button html
	this.getButtonHtml = function(buttonJson){
		return "<div class=\"s3dToolbarBtnContainer\" buttonId=\"" + buttonJson.id + "\" title=\"" + cmnPcr.html_encode(buttonJson.name) + "\">"
			+ ("<img class=\"s3dToolbarBtnImg\" src=\"" + buttonJson.imgUrl + "\" />")
			+ "</div>";
	}
}
export default S3dToolbar