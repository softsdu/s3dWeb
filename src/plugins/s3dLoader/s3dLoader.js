import * as zip from "zipjs";
import {cmnPcr} from "../../commonjs/common/static.js"
import "./s3dLoader.css"

//S3dWeb 加载器
let S3dLoader = function (){
	
	//当前对象
	const thatS3dLoader = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	//s3dModelId
	this.s3dModelId = null;
		
	//3D模型相关
	this.s3dObject = null;
	
	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dLoader.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dLoader.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dLoader.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	}

	//初始化
	this.init = function(p){
		thatS3dLoader.containerId = p.containerId;
		thatS3dLoader.manager = p.manager;
		thatS3dLoader.s3dModelId = p.config.s3dModelId;
		if(p.config.afterLoadS3dFile != null){
			thatS3dLoader.addEventFunction("afterLoadS3dFile", p.config.afterLoadS3dFile);
		}		
		thatS3dLoader.show();
		if(p.config.modelInfo.text != null) {
			thatS3dLoader.loadS3dByText(p.config.modelInfo.id, p.config.modelInfo.text);
		}
		else {
			thatS3dLoader.loadS3dByUrl(p.config.modelInfo.id, p.config.modelInfo.url);
		}
	}

	this.getUnitMapJsonUrl = function (path, unitFileName){
		return path + unitFileName;
	}

	this.getUnitTypeMapJsonUrl = function (path, unitTypeFileName){
		return path + unitTypeFileName;
	}

	this.getMaterialMapJsonUrl = function (path, materialFileName){
		return path + materialFileName;
	}

	this.getGltfUrl = function (path, gltfFolderName, gltfKey){
		return path + gltfFolderName + "\\" + gltfKey;
	}

	//加载读取s3d文件
	this.loadS3dByUrl = async function(id, url) {
		thatS3dLoader.showStatus({
			status: "LoadingS3D",
			message: "加载S3D文件(1/5)"
		});

		let mainResponse = await fetch(url);
		let mainText = await mainResponse.text();
		thatS3dLoader.s3dObject = cmnPcr.strToJson(mainText);
		thatS3dLoader.s3dObject.id = id;
		thatS3dLoader.showS3dInViewer();
	}

	//加载读取s3d文件
	this.loadS3dByText = async function(id, text){
		thatS3dLoader.showStatus({
			status: "LoadingS3D",
			message: "加载S3D文件(1/3)"
		});

		thatS3dLoader.s3dObject = cmnPcr.strToJson(text);
		thatS3dLoader.s3dObject.id = id;
		thatS3dLoader.showS3dInViewer();
	}

	//加载读取s3d文件
	this.loadS3d = async function(id, text){
		thatS3dLoader.showStatus({
			status: "LoadingS3D",
			message: "加载S3D文件(1/3)"
		});

		thatS3dLoader.s3dObject = cmnPcr.strToJson(text);
		thatS3dLoader.s3dObject.id = id;

		thatS3dLoader.showS3dInViewer();
	}
    
	//下载完成后触发afterLoadS3dFile事件
    this.showS3dInViewer = function(){
    	let s3dObject = thatS3dLoader.s3dObject;

		thatS3dLoader.showStatus({
			status: "Rendering",
			message: "渲染3D图形(2/3)"
		});

		thatS3dLoader.doEventFunction("afterLoadS3dFile", {
			s3dObject: s3dObject
		})

		thatS3dLoader.showStatus({
			status: "Completed",
			message: "准备显示(3/3)"
		});
		thatS3dLoader.hide();
	}
	
	//显示
	this.show = function(){
		let winHtml = thatS3dLoader.getWinHtml();
		$("#" + thatS3dLoader.containerId).append(winHtml);		 
	} 
	
	//显示状态
	this.showStatus = function(p){
		$("#" + thatS3dLoader.containerId).find(".statusText").html(p.message);
	}
	
	//隐藏
	this.hide = function(p){
		$("#" + thatS3dLoader.containerId).find(".statusContainer").fadeOut(1000);
	}
	
	//获取html
	this.getWinHtml = function(){
		return "<div class=\"statusContainer\">"
			+ "<div class=\"statusInnerContainer\">"
			+ "<div class=\"statusBackground\"></div>"
			+ "<div class=\"statusText\"></div>"
			+ "</div>"
			+ "</div>";
	}

	//设置模型名称
	this.setModelName = function(modelName){
		thatS3dLoader.manager.s3dObject.name = modelName;
	}

	//获取模型名称
	this.getModelName = function(){
		return thatS3dLoader.manager.s3dObject.name;
	}
}
export default S3dLoader