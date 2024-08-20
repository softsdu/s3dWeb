import {cmnPcr} from "../../commonjs/common/static.js"

//S3dWeb 模型结构树
let S3dTree = function (){
	//当前对象
	const thatS3dTree = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null; 
	
	//所有节点数据（树形）
	this.nodeJArray = null;

	//节点ID与json
	this.id2NodeJsonMap = null;

	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dTree.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dTree.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dTree.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	}
	
	//获取节点json
	this.getNodeJson = function(nodeId){
		return thatS3dTree.id2NodeJsonMap[nodeId];
	}
	 
	//初始化
	this.init = function(p){
		thatS3dTree.containerId = p.containerId;
		thatS3dTree.manager = p.manager;

		thatS3dTree.nodeJArray = thatS3dTree.initNodeJArray(p.manager.s3dObject);

		thatS3dTree.id2NodeJsonMap = {};
		thatS3dTree.initId2NodeJsonMap(thatS3dTree.nodeJArray, thatS3dTree.id2NodeJsonMap);

		if(p.config.onNodeClick != null){
			thatS3dTree.addEventFunction("onNodeClick", p.config.onNodeClick); 
		} 
		if(p.config.onNodeCheckStatusChange != null){
			thatS3dTree.addEventFunction("onNodeCheckStatusChange", p.config.onNodeCheckStatusChange); 
		} 
		       
		thatS3dTree.showTree(p.config.title, thatS3dTree.nodeJArray);

		let container = $("#" + thatS3dTree.containerId);
		$(container).find(".s3dTreeCloseBtn").click(function(){
			thatS3dTree.hide();
		});
		$(container).find(".s3dTreeContainer").click(function(){
			return false;
		});

		if(p.config.visible){
			thatS3dTree.show();
		}
		else{
			thatS3dTree.hide();
		}
	}
	
	//隐藏
	this.hide = function(){
		$("#" + thatS3dTree.containerId).find(".s3dTreeContainer").css({"display": "none"});
	}
	
	//隐藏
	this.show = function(){
		$("#" + thatS3dTree.containerId).find(".s3dTreeContainer").css({"display": "block"});
	}
	
	//获取显示状态
	this.getVisible = function(){
		return $("#" + thatS3dTree.containerId).find(".s3dTreeContainer").css("display") === "block";
	}
	
	//显示结构树
	this.showTree = function(title, nodeJArray){
		//构造html
		let treeHtml = thatS3dTree.getTreeHtml(nodeJArray);
		let container = $("#" + thatS3dTree.containerId);
		$(container).append(treeHtml);
		$(container).find(".s3dTreeTitle").text(title);
		
		//点击节点名称事件
		$(container).find(".s3dTreeNodeTitle").click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			let nodeJson = thatS3dTree.id2NodeJsonMap[nodeId];
			thatS3dTree.doEventFunction("onNodeClick", { 
				nodeJson: nodeJson,
				isLeaf: nodeJson.children == null || nodeJson.children.length == 0
			});
			let container = $("#" + thatS3dTree.containerId);
			$(container).find(".s3dTreeNodeHeader").removeClass("s3dTreeNodeHeaderActive");
			$(container).find(".s3dTreeNodeContainer[nodeId='" + nodeId + "']").children(".s3dTreeNodeHeader").addClass("s3dTreeNodeHeaderActive");
		});

		this.highlightNodes = function(nodeJArray){
			let container = $("#" + thatS3dTree.containerId);
			$(container).find(".s3dTreeNodeHeader").removeClass("s3dTreeNodeHeaderActive");
			for(let i = 0; i < nodeJArray.length; i++){
				let nodeJson = nodeJArray[i];
				$(container).find(".s3dTreeNodeContainer[nodeId='" + nodeJson.id + "']").children(".s3dTreeNodeHeader").addClass("s3dTreeNodeHeaderActive");
			}
		}

		//点击折叠或展开
		$(container).find(".s3dTreeNode").click(function(){
			if($(this).hasClass("s3dTreeNodeExpand")){
				$(this).removeClass("s3dTreeNodeExpand");
				$(this).addClass("s3dTreeNodeCollapse");
				$(this).parent().parent().children(".s3dTreeChildrenContainer").addClass("s3dTreeHidden");
			}
			else{
				$(this).removeClass("s3dTreeNodeCollapse");
				$(this).addClass("s3dTreeNodeExpand");
				$(this).parent().parent().children(".s3dTreeChildrenContainer").removeClass("s3dTreeHidden");
			}
		});
		
		//复选框
		$(container).find(".s3dTreeNodeCheckbox").click(function(){
			let nodeItem = $(this).parent().parent()[0];
			let changedNodeIds = [];
			let checked = $(this).hasClass("s3dTreeNodeCheckboxNone") || $(this).hasClass("s3dTreeNodeCheckboxPart");  
			
			//改变选中状态，且更新所有children
			thatS3dTree.setNodeCheckStatus(nodeItem, checked, changedNodeIds);
			
			//更新所有的父级节点
			thatS3dTree.refreshAllParentCheckStatus(nodeItem);
			
			//出发选中状态改变事件
			thatS3dTree.doEventFunction("onNodeCheckStatusChange", {
				checked: checked,
				changedNodeIds: changedNodeIds
			});			
		});

		//快捷键
		$(container).find(".s3dTreeContainer").mousedown(function(){
			$(this).focus();	
		});
		$(container).find(".s3dTreeContainer").keydown(thatS3dTree.onKeyDown);
		
	}
	
	//快捷键
    this.onKeyDown = function(ev) {			
		switch(ev.keyCode){				
			case 27: // esc 曲线选择 
			case 67:{ //c 居中
				thatS3dTree.manager.viewer.onKeyDown(ev); 
				break;
			}
			default:
				break;
		}
	}
	
	//设置节点选中状态
	this.setNodeCheckStatus = function(nodeItem, checked, changedNodeIds){
		let checkbox = $(nodeItem).children(".s3dTreeNodeHeader").children(".s3dTreeNodeCheckbox");
		let childrenContainers = $(nodeItem).children(".s3dTreeChildrenContainer");
		let hasChildren = childrenContainers.length !== 0;
		if(hasChildren){
			let childrenNodeItems = $(childrenContainers[0]).children(".s3dTreeNodeContainer");
			for(let i = 0; i < childrenNodeItems.length; i++){
				let childNodeItem = childrenNodeItems[i];
				thatS3dTree.setNodeCheckStatus(childNodeItem, checked, changedNodeIds);
			}
		}	
		else{
			//记录变化状态的node
			if((checked && $(checkbox).hasClass("s3dTreeNodeCheckboxNone"))
				||(!checked && $(checkbox).hasClass("s3dTreeNodeCheckboxChecked"))){
				let nodeId = $(nodeItem).attr("nodeId");
				changedNodeIds.push(nodeId); 
			}
		}
		if(checked){
			$(checkbox).removeClass("s3dTreeNodeCheckboxPart");
			$(checkbox).removeClass("s3dTreeNodeCheckboxNone");
			$(checkbox).addClass("s3dTreeNodeCheckboxChecked");
		}
		else {
			$(checkbox).removeClass("s3dTreeNodeCheckboxPart");
			$(checkbox).removeClass("s3dTreeNodeCheckboxChecked");
			$(checkbox).addClass("s3dTreeNodeCheckboxNone");
		}
			
	} 
	
	//刷新所有父节点选中状态（递归）
	this.refreshAllParentCheckStatus = function(nodeItem){
		let parentNodeItem = $(nodeItem).parent().parent()[0];
		while($(parentNodeItem).hasClass("s3dTreeNodeContainer")){
			let checkStatus = thatS3dTree.getAllChildrenCheckStatus(parentNodeItem);
			let checkbox = $(parentNodeItem).children(".s3dTreeNodeHeader").children(".s3dTreeNodeCheckbox");
			if(checkStatus.allChecked){
				$(checkbox).removeClass("s3dTreeNodeCheckboxPart");
				$(checkbox).removeClass("s3dTreeNodeCheckboxNone");
				$(checkbox).addClass("s3dTreeNodeCheckboxChecked");
			}
			else if(checkStatus.allUnchecked){
				$(checkbox).removeClass("s3dTreeNodeCheckboxPart");
				$(checkbox).removeClass("s3dTreeNodeCheckboxChecked");
				$(checkbox).addClass("s3dTreeNodeCheckboxNone");
			}
			else {
				$(checkbox).removeClass("s3dTreeNodeCheckboxChecked");
				$(checkbox).removeClass("s3dTreeNodeCheckboxNone");
				$(checkbox).addClass("s3dTreeNodeCheckboxPart");
			}
			parentNodeItem = $(parentNodeItem).parent().parent();
		}
	}
	
	//获取子节点选中状态
	this.getAllChildrenCheckStatus = function(parentNodeItem){
		let allChecked = true;
		let allUnchecked = true;
		let childrenContainer = $(parentNodeItem).children(".s3dTreeChildrenContainer")[0];
		let allChildrenNodeItems = $(childrenContainer).children(".s3dTreeNodeContainer").children(".s3dTreeNodeHeader").children(".s3dTreeNodeCheckbox");
		for(let i = 0; i < allChildrenNodeItems.length; i++){
			let childNodeItem = allChildrenNodeItems[i];
			if($(childNodeItem).hasClass("s3dTreeNodeCheckboxNone")){
				allChecked = false;
			}
			else if($(childNodeItem).hasClass("s3dTreeNodeCheckboxPart")){
				allChecked = false;
				allUnchecked = false;
			}
			else{
				allUnchecked = false;
			}
		}
		return {
			allChecked: allChecked,
			allUnchecked: allUnchecked
		};
	}

	//初始化节点id与json对照
	this.initId2NodeJsonMap = function(nodeJArray, id2NodeJsonMap){
		if(nodeJArray != null && nodeJArray.length > 0){
			for(let i = 0; i < nodeJArray.length; i++){
				let nodeJson = nodeJArray[i];
				id2NodeJsonMap[nodeJson.id] = nodeJson;
				thatS3dTree.initId2NodeJsonMap(nodeJson.children, id2NodeJsonMap);
			}
		}
	}

	//初始化NodeJArray
	this.initNodeJArray = function(s3dObject, id2NodeJsonMap){
		let nodeJArray = [];
		for(let i = 0; i < s3dObject.groups.length; i++){
			let groupJson = s3dObject.groups[i];
			let groupNodeJson = {
				id: groupJson.id,
				name: groupJson.name,
				isGroup: true,
				children: []
			};
			for(let j = 0; j < groupJson.units.length; j++){
				let unitId = groupJson.units[j];
				let unitJson = s3dObject.unitMap[unitId];
				groupNodeJson.children.push({
					id: unitId,
					name: unitJson.name,
					isGroup: false
				});
			}
			nodeJArray.push(groupNodeJson);
		}
		return nodeJArray;
	}

	//该节点下的所有叶节点id
	this.getChildNodeIds = function(nodeId){
		let leafNodes = $("#" + thatS3dTree.containerId).find(".s3dTreeNodeContainer[nodeId='" + nodeId + "']").find(".s3dTreeNodeContainer[isLeaf='true']");
		let nodeIds = [];
		for(let i = 0; i < leafNodes.length; i++){
			let leafNode = leafNodes[i];
			nodeIds.push($(leafNode).attr("nodeId"));
		}
		return nodeIds;
	}
	
	//该节点下的所有叶节点Json
	this.getChildNodeJsons = function(nodeId){
		let leafNodes = $("#" + thatS3dTree.containerId).find(".s3dTreeNodeContainer[nodeId='" + nodeId + "']").find(".s3dTreeNodeContainer[isLeaf='true']");
		let nodeJsons = [];
		for(let i = 0; i < leafNodes.length; i++){
			let leafNode = leafNodes[i];
			let leafNodeId = $(leafNode).attr("nodeId");
			nodeJsons.push(thatS3dTree.id2NodeJsonMap[leafNodeId]);
		}
		return nodeJsons;
	}
	
	//是否包含子节点
	this.checkHasChildren = function(nodeId){
		return $("#" + thatS3dTree.containerId).find(".s3dTreeNodeContainer[nodeId='" + nodeId + "']").attr("isLeaf") === "false";
	}	
	
	//获取树html
	this.getTreeHtml = function(nodeJArray){
		let treeHtml = "<div class=\"s3dTreeContainer\" tabindex=\"1\">";
		treeHtml += "<div class=\"s3dTreeBackground\"></div>";
		treeHtml += "<div class=\"s3dTreeHeader\">";
		treeHtml += "<div class=\"s3dTreeTitle\"></div>";
		treeHtml += "<div class=\"s3dTreeCloseBtn\">×</div>";
		treeHtml += "</div>";
		treeHtml += "<div class=\"s3dTreeInnerContainer\">";
		if(nodeJArray != null){
			for(let i = 0; i < nodeJArray.length; i++){
				let nodeJson = nodeJArray[i];
				let hasChildren = nodeJson.children != null && nodeJson.children.length > 0;
				let isGroup = nodeJson.isGroup == undefined ? false : nodeJson.isGroup;
				let childNodeHtml = thatS3dTree.getNodeHtml(nodeJson, true, isGroup || hasChildren);
				treeHtml += childNodeHtml;
			}
		}
		treeHtml += "</div>";
		treeHtml += "</div>";
		return treeHtml;
	}
	
	//获取node节点html
	this.getNodeHtml = function(nodeJson, expanded, isGroup){  
		let nodeHtml = "";
		nodeHtml += "<div class=\"s3dTreeNodeContainer\" nodeId=\"" + nodeJson.id + "\" isLeaf=\"" + (isGroup ? "false" : "true") + "\">";
		nodeHtml += "<div class=\"s3dTreeNodeHeader\">";
		nodeHtml += ("<div class=\"s3dTreeNodeCheckbox s3dTreeNodeCheckboxChecked\"></div>");
		nodeHtml += (isGroup ? ("<div class=\"s3dTreeNode " + (expanded ? "s3dTreeNodeExpand" : "s3dTreeNodeCollapse") + "\"></div>") : "");
		nodeHtml += ("<div class=\"s3dTreeNodeTitle\">" + cmnPcr.html_encode(nodeJson.name) + "</div>");
		nodeHtml += "</div>";
		if(isGroup){
			nodeHtml += ("<div class=\"s3dTreeChildrenContainer" + (expanded ? "" : " s3dTreeHidden") + "\">");
			if(nodeJson.children != null){
				for(let i = 0; i < nodeJson.children.length; i++){
					let childNodeJson = nodeJson.children[i];
					let hasChildChildren = childNodeJson.children != null && childNodeJson.children.length > 0;
					let isChildGroup = childNodeJson.isGroup == undefined ? false : childNodeJson.isGroup;
					let childNodenodeHtml = thatS3dTree.getNodeHtml(childNodeJson, false, isChildGroup || hasChildChildren);
					nodeHtml += childNodenodeHtml;
				}
			}
			nodeHtml += "</div>";
		}
		nodeHtml += "</div>";
		return nodeHtml;
	}
}
export default S3dTree