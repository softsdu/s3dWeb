import {cmnPcr} from "../../commonjs/common/static.js"
import "./s3dPropertyList.css"

//S3dWeb 属性列表
let S3dPropertyList = function (){
	//当前对象
	const thatS3dPropertyList = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;  

	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dPropertyList.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dPropertyList.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dPropertyList.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	}
	 
	//初始化
	this.init = function(p){
		thatS3dPropertyList.containerId = p.containerId;
		thatS3dPropertyList.manager = p.manager; 		       
		thatS3dPropertyList.showPropertyList(p.config.title);
		thatS3dPropertyList.refreshProperties(null);
		$("#" + thatS3dPropertyList.containerId).find(".s3dPropertyListCloseBtn").click(function(){
			thatS3dPropertyList.hide();
		});

		if(p.config.visible){
			thatS3dPropertyList.show();
		}
		else{
			thatS3dPropertyList.hide();
		}
	}
	
	//隐藏
	this.hide = function(){
		$("#" + thatS3dPropertyList.containerId).find(".s3dPropertyListContainer").css({"display": "none"});
	}
	
	//隐藏
	this.show = function(){
		$("#" + thatS3dPropertyList.containerId).find(".s3dPropertyListContainer").css({"display": "block"});
	}
	
	//获取显示状态
	this.getVisible = function(){
		return $("#" + thatS3dPropertyList.containerId).find(".s3dPropertyListContainer").css("display") === "block";
	}
	
	//显示结构树
	this.showPropertyList = function(title){
		//构造html
		let listHtml = thatS3dPropertyList.getListHtml();
		let container = $("#" + thatS3dPropertyList.containerId);
		$(container).append(listHtml);
		$(container).find(".s3dPropertyListTitle").text(title);
	} 
	
	//获取list html
	this.getListHtml = function(){
		return "<div class=\"s3dPropertyListContainer\">"
			+ "<div class=\"s3dPropertyListBackground\"></div>"
			+ "<div class=\"s3dPropertyListHeader\">"
			+ "<div class=\"s3dPropertyListTitle\"></div>"
			+ "<div class=\"s3dPropertyListSubTitle\"></div>"
			+ "<div class=\"s3dPropertyListCloseBtn\">×</div>"
			+ "</div>"
			+ "<div class=\"s3dPropertyListInnerContainer\">"
			+ "</div>"
			+ "</div>";
	} 
	
	//刷新属性
	this.refreshProperties = function(nodeJArray){
		let container = $("#" + thatS3dPropertyList.containerId);
		let propertyListInnerContainer = $(container).find(".s3dPropertyListInnerContainer")[0];
		let propertyListSubTitle = $(container).find(".s3dPropertyListSubTitle")[0];
		if(nodeJArray == null || nodeJArray.length === 0){
			$(propertyListSubTitle).html(" - 请选择单个图元查看属性"); 
			$(propertyListInnerContainer).html("已选择 0 个图元");
		}
		else if(nodeJArray.length > 1){ 
			$(propertyListSubTitle).html(" - 请选择单个图元查看属性"); 
			$(propertyListInnerContainer).html("已选择 " + nodeJArray.length + " 个图元");
		}
		else{
			let nodeJson = nodeJArray[0];
			
			let comParameters = null;
			let allCateGroupInfoHash = {};
			let defaultCateGroupName = "默认分组";
			allCateGroupInfoHash[defaultCateGroupName] = {
				name: defaultCateGroupName,
				html: thatS3dPropertyList.getGroupHtml(defaultCateGroupName),
				paramInfos: []
			};
			comParameters = thatS3dPropertyList.manager.s3dObject.unitTypeMap[nodeJson.code + "_" + nodeJson.versionNum].parameters;
			for(let paramName in comParameters){
				let comParam = comParameters[paramName];
				let categoryName = comParam.categoryName;
				let groupName = comParam.groupName;
				let categoryGroupName = categoryName + "-" + groupName;
				if(categoryGroupName == null || categoryGroupName.length === 0){
					categoryGroupName = defaultGroupName;
				}
				if(allCateGroupInfoHash[categoryGroupName] == null){
					allCateGroupInfoHash[categoryGroupName] = {
						name: categoryGroupName,
						categoryName: categoryName,
						groupName: groupName,
						html: thatS3dPropertyList.getGroupHtml(categoryGroupName),
						paramInfos: []
					};
				}

				let cateGroupInfo = allCateGroupInfoHash[categoryGroupName];
				let paramValue = nodeJson.parameters[paramName].value;
				let propertyHtml = thatS3dPropertyList.getPropertyHtml(paramName, paramValue);
				cateGroupInfo.paramInfos.push({
					name: paramName,
					html: propertyHtml
				});
			}

			//组排序
			let sortedCateGroupInfos = [];
			for(let cateGroupName in allCateGroupInfoHash){
				let cateGroupInfo = allCateGroupInfoHash[cateGroupName];
				let tempSortedCateGroupInfos = [];
				let added = false;
				for(let i = 0; i < sortedCateGroupInfos.length; i++){
					let tempSortedCateGroupInfo = sortedCateGroupInfos[i];
					if(!added && tempSortedCateGroupInfo.name.localeCompare(cateGroupInfo.name) > 0){
						tempSortedCateGroupInfos.push(cateGroupInfo);
						added = true;
					}
					tempSortedCateGroupInfos.push(tempSortedCateGroupInfo);
				}
				if(!added){
					tempSortedCateGroupInfos.push(cateGroupInfo);
				}
				sortedCateGroupInfos = tempSortedCateGroupInfos;
			}

			//组内的参数排序
			for(let i = 0; i < sortedCateGroupInfos.length; i++){
				let cateGroupInfo = sortedCateGroupInfos[i];
				let sortedParamInfos = [];
				for(let j = 0; j < cateGroupInfo.paramInfos.length; j++){
					let tempSortedParamInfos = [];
					let paramInfo = cateGroupInfo.paramInfos[j];
					let added = false;
					for(let k = 0; k < sortedParamInfos.length; k++){
						let tempSortedParamInfo = sortedParamInfos[k];
						if(!added && tempSortedParamInfo.indexInGroup > paramInfo.indexInGroup){
							tempSortedParamInfos.push(paramInfo);
							added = true;
						}
						tempSortedParamInfos.push(tempSortedParamInfo);
					}
					if(!added){
						tempSortedParamInfos.push(paramInfo);
					}
					sortedParamInfos = tempSortedParamInfos;
				}
				cateGroupInfo.paramInfos = sortedParamInfos;
			}

			//拼接所有的html
			let allPropertyHtml = "";
			for(let i = 0; i < sortedCateGroupInfos.length; i++){
				let cateGroupInfo = sortedCateGroupInfos[i];
				if(cateGroupInfo.paramInfos.length > 0){
					allPropertyHtml += cateGroupInfo.html;
					for(let j = 0; j < cateGroupInfo.paramInfos.length; j++){
						let paramInfo = cateGroupInfo.paramInfos[j];
						allPropertyHtml += paramInfo.html;		
					}
				}
			}
			$(propertyListSubTitle).html(" - " + nodeJson.name);
			$(propertyListInnerContainer).html(allPropertyHtml.length > 0 ? allPropertyHtml : "当前图元没有定义属性");
		}
	}
	
	//获取property html
	this.getPropertyHtml = function(paramName, paramValue){
		return "<div class=\"s3dPropertyListItemContainer\">"
			+ "<div class=\"s3dPropertyListItemTitle\">" + cmnPcr.html_encode(paramName) + "</div>"
			+ "<div class=\"s3dPropertyListItemValue\">" + cmnPcr.html_encode(paramValue) + "</div>"
			+ "</div>";
	}
	
	//获取group html
	this.getGroupHtml = function(groupName){
		return "<div class=\"s3dPropertyListItemContainer\">"
			+ "<div class=\"s3dPropertyListItemGroup\">" + cmnPcr.html_encode(groupName) + "</div>"
			+ "</div>";
	}
}
export default S3dPropertyList