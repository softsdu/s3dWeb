import {cmnPcr, s3dViewerStatus, msgBox} from "../../commonjs/common/static.js"
import "./s3dAdder.css"

//S3dWeb 模型新增
let S3dAdder = function (){
	//当前对象
	const thatS3dAdder = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null; 

	//服务器地址
	this.serverUrl = null;
	
	//所有类型节点数据（树形）
	this.categoryJArray = null;

	//组件数据
	this.componentJArray = null;

	//mdlType
	this.mdlTypes = ["s3dCom", "component"];

	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dAdder.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dAdder.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dAdder.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	} 
	 
	//初始化
	this.init = function(p){
		thatS3dAdder.containerId = p.containerId;
		thatS3dAdder.manager = p.manager;
		thatS3dAdder.mdlTypes = p.config.mdlTypes == null ? thatS3dAdder.mdlTypes : p.config.mdlTypes;
		thatS3dAdder.initAdderHtml(p.config.title);
		thatS3dAdder.initCategoryTree();
		let container = $("#" + thatS3dAdder.containerId);
		$(container).find(".s3dAdderCloseBtn").click(function(){
			thatS3dAdder.hide();
		});
		$(container).find(".s3dAdderContainer").click(function(){
			return false;
		});

		if(p.config.visible){
			thatS3dAdder.show();
		}
		else{
			thatS3dAdder.hide();
		}
	}
	
	//隐藏
	this.hide = function(){
		$("#" + thatS3dAdder.containerId).find(".s3dAdderContainer").css({"display": "none"});
	}
	
	//隐藏
	this.show = function(){
		$("#" + thatS3dAdder.containerId).find(".s3dAdderContainer").css({"display": "block"});
	}
	
	//获取显示状态
	this.getVisible = function(){
		return $("#" + thatS3dAdder.containerId).find(".s3dAdderContainer").css("display") === "block";
	}

	//初始化html
	this.initAdderHtml = function(title){
		let html = thatS3dAdder.getAdderHtml();
		let container = $("#" + thatS3dAdder.containerId);
		$(container).append(html);
		$(container).find(".s3dAdderTitle").text(title);
	}

	//从加载构件分类
	this.initCategoryTree = function (){
		if(thatS3dAdder.manager.componentLibrary != null && thatS3dAdder.manager.componentLibrary.categories != null) {
			thatS3dAdder.showCategoryTree(thatS3dAdder.manager.componentLibrary.categories);
		}
	}

	//构造html
	this.getAdderHtml = function(){
		return "<div class=\"s3dAdderContainer\">"
			+ "<div class=\"s3dAdderBackground\"></div>"
			+ "<div class=\"s3dAdderHeader\">"
			+ "<div class=\"s3dAdderTitle\"></div>"
			+ "<div class=\"s3dAdderCloseBtn\">×</div>"
			+ "</div>"
			+ "<div class=\"s3dAdderCategoryTreeContainer\"></div>"
			+ "<div class=\"s3dAdderComponentListContainer\"><div class=\"s3dAdderComponentNone\">请点击选择左侧类型</div></div>"
			+ "</div>";
	}
	
	//显示结构树
	this.showCategoryTree = function(categoryJArray){
		//构造html
		let categoryTreeHtml = thatS3dAdder.getCategoryTreeHtml(categoryJArray);
		let container = $("#" + thatS3dAdder.containerId);
		$(container).find(".s3dAdderCategoryTreeContainer").append(categoryTreeHtml);
		//点击节点名称事件
		$(container).find(".s3dAdderNodeContainer .s3dAdderNodeHeader .s3dAdderNodeTitle").click(function(){
			let categoryCode = $(this).parent().parent().attr("categoryCode");
			thatS3dAdder.initComponentList({
				categoryCode: categoryCode
			});
			let container = $("#" + thatS3dAdder.containerId);
			$(container).find(".s3dAdderNodeHeader").removeClass("s3dAdderNodeHeaderActive");
			$(container).find(".s3dAdderNodeContainer[categoryCode='" + categoryCode + "']").children(".s3dAdderNodeHeader").addClass("s3dAdderNodeHeaderActive");
		});

		//点击折叠或展开
		$(container).find(".s3dAdderNodeContainer .s3dAdderNodeHeader .s3dAdderNode").click(function(){
			if($(this).hasClass("s3dAdderNodeExpand")){
				$(this).removeClass("s3dAdderNodeExpand");
				$(this).addClass("s3dAdderNodeCollapse");
				$(this).parent().parent().children(".s3dAdderChildrenContainer").addClass("s3dAdderHidden");
			}
			else{
				$(this).removeClass("s3dAdderNodeCollapse");
				$(this).addClass("s3dAdderNodeExpand");
				$(this).parent().parent().children(".s3dAdderChildrenContainer").removeClass("s3dAdderHidden");
			}
		}); 
	}

	//获取构件列表
	this.initComponentList = function(p){
		let  componentJArray = thatS3dAdder.manager.componentLibrary.getComponents(p.categoryCode);
		thatS3dAdder.showComponentList(componentJArray);
	}

	//是否包含子节点
	this.checkHasChildren = function(categoryId){
		return $("#" + thatS3dAdder.containerId).find(".s3dAdderNodeContainer[categoryId='" + categoryId + "']").attr("isLeaf") === "false";
	}

	//获取server category树html
	this.getCategoryTreeHtml = function(nodeJArray){
		let treeHtml = "";
		for(let i = 0; i < nodeJArray.length; i++){
			let nodeJson = nodeJArray[i];
			let childNodeHtml = thatS3dAdder.getCategoryNodeHtml(nodeJson, 1);
			treeHtml += childNodeHtml;
		}
		return treeHtml;
	}

	//获取node节点html
	this.getCategoryNodeHtml = function(nodeJson, levelIndex){
		let hasChildren = nodeJson.children !== null && nodeJson.children !== undefined && nodeJson.children.length > 0;
		let expanded = levelIndex === 0;
		let nodeHtml = "";
		let nodeText = decodeURIComponent(nodeJson.name);
		nodeHtml += "<div class=\"s3dAdderNodeContainer\" categoryCode=\"" + nodeJson.code + "\" isLeaf=\"" + (hasChildren ? "false" : "true") + "\">";
		nodeHtml += "<div class=\"s3dAdderNodeHeader\">";
		nodeHtml += (hasChildren ? ("<div class=\"s3dAdderNode " + (expanded ? "s3dAdderNodeExpand" : "s3dAdderNodeCollapse") + "\"></div>") : "");
		nodeHtml += ("<div class=\"s3dAdderNodeTitle\">" + cmnPcr.html_encode(nodeText) + "</div>");
		nodeHtml += "</div>";
		if(hasChildren){
			nodeHtml += ("<div class=\"s3dAdderChildrenContainer" + (expanded ? "" : " s3dAdderHidden") + "\">");
			for(let i = 0; i < nodeJson.children.length; i++){
				let childNodeJson = nodeJson.children[i];
				let childNodenodeHtml = thatS3dAdder.getCategoryNodeHtml(childNodeJson, levelIndex + 1);
				nodeHtml += childNodenodeHtml;
			}
			nodeHtml += "</div>";
		}
		nodeHtml += "</div>";
		return nodeHtml;
	}

	//构件列表
	this.showComponentList = function(componentJArray){
		let componentListHtml = thatS3dAdder.getComponentListHtml(componentJArray);
		let container = $("#" + thatS3dAdder.containerId);
		$(container).find(".s3dAdderComponentListContainer").html(componentListHtml);
        $(container).find(".s3dAdderComponentListContainer")[0].scrollTop =  0;

		$(container).find(".s3dAdderComponentContainer").click(function(){
			let componentName = $(this).attr("componentName"); 
			let componentId = $(this).attr("componentId"); 
			let componentCode = $(this).attr("componentCode");
			let versionNum = $(this).attr("versionNum");
			let isServer = $(this).attr("isServer") === "true";
			let isLocal = $(this).attr("isLocal") === "true";
			thatS3dAdder.waitAddComponent({ 
				componentName: componentName,
				componentId: componentId,
				componentCode: componentCode,
				versionNum: versionNum,
				isServer: isServer,
				isLocal: isLocal
			});
		});
	}

	//等待添加新构件到模型中
	this.waitAddComponent = function(p){
		let container = $("#" + thatS3dAdder.containerId);
		if(p == null){
			$(container).find(".s3dAdderComponentContainer").removeClass("s3dAdderComponentContainerActive");
		}
		else{
			$(container).find(".s3dAdderComponentContainer").removeClass("s3dAdderComponentContainerActive");
			$(container).find(".s3dAdderComponentContainer[componentCode='" + p.componentCode + "']").addClass("s3dAdderComponentContainerActive");
			if(p.isServer) {
				thatS3dAdder.manager.serverObjectCreator.getComponentJsons([{
					code: p.componentCode,
					versionNum: p.versionNum
				}], thatS3dAdder.changeToAddStatus);
			}
			if(p.isLocal) {
				thatS3dAdder.manager.localObjectCreator.getComponentJsons([{
					code: p.componentCode,
					versionNum: p.versionNum
				}], thatS3dAdder.changeToAddStatus);
			}
		}
	}

	//取消等待添加新构件到模型中
	this.cancelWaitAddComponent = function(){
		$("#" + thatS3dAdder.containerId).find(".s3dAdderComponentContainer").removeClass("s3dAdderComponentContainerActive");
	}

	this.changeToAddStatus = function(ps){
		let p = ps[0];
		thatS3dAdder.manager.viewer.changeStatus({
			status: s3dViewerStatus.add,
			statusData: {
				componentName: p.name,
				componentId: p.id,
				componentCode: p.code,
				versionNum: p.versionNum,
				componentJson: p.json,
				isServer: p.isServer,
				isLocal: p.isLocal
			}
		});
	}
	
	//获取构件列表html
	this.getComponentListHtml = function(componentJArray){
		let html = "";
		if(componentJArray.length === 0){
			html += ("<div class=\"s3dAdderComponentNone\">没有找到该类型组件</div>");
		}
		else{
			for(let i = 0; i < componentJArray.length; i++){
				let componentJson = componentJArray[i];
				html += thatS3dAdder.getComponentItemHtml(componentJson);
			}
		}
		return html;
	}
	
	//获取构件条目html
	this.getComponentItemHtml = function(componentJson){
		let componentName = decodeURIComponent(componentJson.name); 
		let componentCode = decodeURIComponent(componentJson.code);
		let versionNum = componentJson.versionNum;
		let imgUrl = null;
		let isServer = componentJson.isServer;
		let isLocal = componentJson.isLocal;
		if(isServer) {
			imgUrl = componentJson.imgId == null ? null : (thatS3dAdder.manager.service.url + "accessory/getImage?id=" + componentJson.imgId);
		}
		if(isLocal){
			imgUrl =componentJson.imgUrl == null ? null : (thatS3dAdder.manager.componentLibrary.rootPath + componentJson.imgUrl);
		}
		let tag = "名称: " + componentName + "\r\n编码: " + componentCode + "\r\n版本: " + versionNum;
		return "<div class=\"s3dAdderComponentContainer\" isServer=\"" + (isServer ? "true" : "false") + "\"  isLocal=\"" + (isLocal ? "true" : "false") + "\" title=\"" + tag + "\"componentName=\"" + componentName + "\" componentCode=\"" + componentCode + "\" versionNum=\"" + versionNum + "\">"
			+ "<div class=\"s3dAdderComponentImageContainer\">"
			+ (imgUrl == null ? ("<div class=\"s3dAdderComponentImageText\">无缩略图</div>") : ("<img class=\"s3dAdderComponentImage\" src=\"" + imgUrl + "\" />"))
			+ "</div>"
			+ "<div class=\"s3dAdderComponentHeader\">"
			+ "<div class=\"s3dAdderComponentHeaderBackground\">&nbsp;</div>"
			+ ("<div class=\"s3dAdderComponentTitle\">" + cmnPcr.html_encode(componentName) + "</div>")
			+ "</div>"
			+ "</div>";
	}
}
export default S3dAdder