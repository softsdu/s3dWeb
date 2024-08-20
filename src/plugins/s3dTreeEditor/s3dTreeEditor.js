import {cmnPcr, msgBox, s3dOperateType} from "../../commonjs/common/static.js";
import "./s3dTreeEditor.css"

//S3dWeb 模型结构树
let S3dTreeEditor = function (){
	//当前对象
	const thatS3dTreeEditor = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null; 

	//title
	this.title = null;
	
	//所有节点数据（树形）
	this.nodeJArray = null;

	//节点ID与json
	this.id2NodeJsonMap = null;

	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dTreeEditor.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dTreeEditor.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dTreeEditor.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	}
	
	//获取节点json
	this.getNodeJson = function(nodeId){
		return thatS3dTreeEditor.id2NodeJsonMap[nodeId];
	}
	 
	//初始化
	this.init = function(p){
		thatS3dTreeEditor.containerId = p.containerId;
		thatS3dTreeEditor.manager = p.manager; 
		thatS3dTreeEditor.title = p.config.title;

		thatS3dTreeEditor.nodeJArray = thatS3dTreeEditor.initNodeJArray(p.manager.s3dObject);
		
		thatS3dTreeEditor.id2NodeJsonMap = {};
		thatS3dTreeEditor.initId2NodeJsonMap(thatS3dTreeEditor.nodeJArray, thatS3dTreeEditor.id2NodeJsonMap);

		if(p.config.onNodeClick != null){
			thatS3dTreeEditor.addEventFunction("onNodeClick", p.config.onNodeClick); 
		} 
		if(p.config.onNodeCheckStatusChange != null){
			thatS3dTreeEditor.addEventFunction("onNodeCheckStatusChange", p.config.onNodeCheckStatusChange); 
		}

		thatS3dTreeEditor.showTree(p.config.title, thatS3dTreeEditor.nodeJArray);

		let container = $("#" + thatS3dTreeEditor.containerId);
		$(container).find(".s3dTreeEditorCloseBtn").click(function(){
			thatS3dTreeEditor.hide();
		});
		
		$(container).find(".s3dTreeEditorAddRootGroupBtn").click(function(){
			thatS3dTreeEditor.addGroup(null);
		});
		
		$(container).find(".s3dTreeEditorMultiNodeChangeParentBtn").click(function(){
			let nodeIds = thatS3dTreeEditor.manager.viewer.getSelectedObject3DIds();
			thatS3dTreeEditor.changeParentGroup(nodeIds);
		});

		$(container).find(".s3dTreeEditorContainer").click(function(){
			return false;
		});

		if(p.config.visible){
			thatS3dTreeEditor.show();
		}
		else{
			thatS3dTreeEditor.hide();
		}
	}

	//初始化NodeJArray
	this.initNodeJArray = function(s3dObject){
		let nodeJArray = [];
		for(let i = 0; i < s3dObject.groups.length; i++){
			let groupJson = s3dObject.groups[i];
			let groupNodeJson = {
				id: groupJson.id,
				name: groupJson.name,
				isDefault: groupJson.isDefault,
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

	//静默刷新树
	this.refreshTreeInSilence = function(treeJson){
		thatS3dTreeEditor.showTree(thatS3dTreeEditor.title, treeJson.children);
	}
	
	//隐藏
	this.hide = function(){
		$("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorContainer").css({"display": "none"});
	}
	
	//隐藏
	this.show = function(){
		$("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorContainer").css({"display": "block"});
	}
	
	//获取显示状态
	this.getVisible = function(){
		return $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorContainer").css("display") === "block";
	} 

	this.highlightNodes = function(nodeJArray){
		let container = $("#" + thatS3dTreeEditor.containerId);
		$(container).find(".s3dTreeEditorNodeHeader").removeClass("s3dTreeEditorNodeHeaderActive");
		for(let i = 0; i < nodeJArray.length; i++){
			let nodeJson = nodeJArray[i];
			$(container).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeJson.id + "']").children(".s3dTreeEditorNodeHeader").addClass("s3dTreeEditorNodeHeaderActive");
		}
	}

	this.nodeTitleClick = function(nodeId){
		let nodeJson = thatS3dTreeEditor.id2NodeJsonMap[nodeId];
		thatS3dTreeEditor.doEventFunction("onNodeClick", { 
			nodeJson: nodeJson
		});
		let container = $("#" + thatS3dTreeEditor.containerId);
		$(container).find(".s3dTreeEditorNodeHeader").removeClass("s3dTreeEditorNodeHeaderActive");
		$(container).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']").children(".s3dTreeEditorNodeHeader").addClass("s3dTreeEditorNodeHeaderActive");
	}

	this.changeNodeExpandStatus = function(nodeId){
		let expandBtn = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']").children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNode")[0];
		if($(expandBtn).hasClass("s3dTreeEditorNodeExpand")){
			$(expandBtn).removeClass("s3dTreeEditorNodeExpand");
			$(expandBtn).addClass("s3dTreeEditorNodeCollapse");
			$(expandBtn).parent().parent().children(".s3dTreeEditorChildrenContainer").addClass("s3dTreeEditorHidden");
		}
		else{
			$(expandBtn).removeClass("s3dTreeEditorNodeCollapse");
			$(expandBtn).addClass("s3dTreeEditorNodeExpand");
			$(expandBtn).parent().parent().children(".s3dTreeEditorChildrenContainer").removeClass("s3dTreeEditorHidden");
		}
	}

	this.checkNode = function(nodeId){
		let nodeItem = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']")[0]; 
		let checkInput = $(nodeItem).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeCheckbox")[0];
		let changedNodeIds = [];
		let checked = $(checkInput).hasClass("s3dTreeEditorNodeCheckboxNone") || $(checkInput).hasClass("s3dTreeEditorNodeCheckboxPart");  
		
		//改变选中状态，且更新所有children
		thatS3dTreeEditor.setNodeCheckStatus(nodeItem, checked, changedNodeIds);
		
		//更新所有的父级节点
		thatS3dTreeEditor.refreshAllParentCheckStatus(nodeItem);
		
		//出发选中状态改变事件
		thatS3dTreeEditor.doEventFunction("onNodeCheckStatusChange", {
			checked: checked,
			changedNodeIds: changedNodeIds
		});
	}
	
	//显示结构树
	this.showTree = function(title, nodeJArray){
		let container = $("#" + thatS3dTreeEditor.containerId);
		//构造html
		$(container).find(".s3dTreeEditorContainer").remove();
		let treeHtml = thatS3dTreeEditor.getTreeHtml(nodeJArray);	
		$(container).append(treeHtml);
		$(container).find(".s3dTreeEditorTitle").text(title);
		
		//点击节点名称事件
		$(container).find(".s3dTreeEditorNodeTitle").click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTreeEditor.nodeTitleClick(nodeId);
		});

		//点击折叠或展开
		$(container).find(".s3dTreeEditorNode").click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTreeEditor.changeNodeExpandStatus(nodeId);
		});
		
		//复选框
		$(container).find(".s3dTreeEditorNodeCheckbox").click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTreeEditor.checkNode(nodeId);
		});
		
		//删除节点
		$(container).find(".s3dTreeEditorNodeDeleteBtn").click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTreeEditor.removeNode(nodeId);
		});
		
		//组节点重命名
		$(container).find(".s3dTreeEditorNodeRenameBtn").click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTreeEditor.renameGroup(nodeId);
		});
		
		//添加下级分组
		$(container).find(".s3dTreeEditorNodeAddSubGroupBtn").click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTreeEditor.addGroup(nodeId);
		});
		
		//更改所属分组
		$(container).find(".s3dTreeEditorNodeChangeParentBtn").click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTreeEditor.changeParentGroup([nodeId]);
		});
		
		//快捷键
		$(container).find(".s3dTreeEditorContainer").mousedown(function(){
			$(this).focus();	
		});
		$(container).find(".s3dTreeEditorContainer").keydown(thatS3dTreeEditor.onKeyDown);
		
	}
	
	//快捷键
    this.onKeyDown = function(ev) {			
		switch(ev.keyCode){				
			case 27: // esc 取消选择 
			case 70:{ //f 居中
				thatS3dTreeEditor.manager.viewer.onKeyDown(ev); 
				break;
			}
			default:
				break;
		}
	}

	this.addGroup = function(parentNodeId){		
		let winContainerId = cmnPcr.getRandomValue();
		let nameWinHtml = thatS3dTreeEditor.getNameWinHtml(winContainerId, "新建分组");
		$("#" + thatS3dTreeEditor.containerId).append(nameWinHtml);
		let winContainer = $("#" + winContainerId)[0];
		$(winContainer).attr("parentNodeId", parentNodeId == null ? "" : parentNodeId);
		
		$(winContainer).find(".s3dTreeEditorNameCloseBtn").click(function(){
			let winContainer = $("#" + winContainerId)[0];
			$(winContainer).remove();
		});
		$(winContainer).find(".s3dTreeEditorNameButton").click(function(){
			let winContainer = $("#" + winContainerId)[0];
			let newGroupName = $(winContainer).find(".s3dTreeEditorNameInput").val().trim();
			if(newGroupName.length === 0){
				msgBox.alert({info: "请输入名称"});
			}
			else if(thatS3dTreeEditor.hasSameNameGroup(newGroupName, null, parentNodeId)){
				msgBox.alert({info: "存在相同的组名"});
			}
			else{
				let parentNodeId = $(winContainer).attr("parentNodeId");

				//开始记录到undo list
				thatS3dTreeEditor.beginAddToUndoList();

				thatS3dTreeEditor.addGroupNode({
					id: cmnPcr.createGuid(),
					name: newGroupName,
					isGroup: true
				}, parentNodeId.length === 0 ? null : parentNodeId);
				
				//结束记录到undo list
				thatS3dTreeEditor.endAddToUndoList();

				$(winContainer).remove();
			}
		});
	}

	this.addGroupNodeInSilence = function (groupId, groupName){
		let newGroupName = groupName;
		let groupPrefix = 0;
		while (thatS3dTreeEditor.hasSameNameGroup(newGroupName, null, null)){
			groupPrefix++;
			newGroupName = groupName + "_" + groupPrefix;
		}

		let newGroupInfo = {
			id: groupId,
			name: newGroupName,
			isGroup: true
		};

		thatS3dTreeEditor.addGroupNode(newGroupInfo);
		return newGroupInfo;
	}

	this.changeParentGroup = function(nodeIds){
		let winContainerId = cmnPcr.getRandomValue();
		let changeParentWinHtml = thatS3dTreeEditor.getChangeParentWinHtml(winContainerId, "选择目标分组");
		$("#" + thatS3dTreeEditor.containerId).append(changeParentWinHtml);
		let winContainer = $("#" + winContainerId)[0];
		let nodeIdsStr = cmnPcr.arrayToString(nodeIds, ",");
		$(winContainer).attr("nodeIds", nodeIdsStr);
		$(winContainer).find(".s3dTreeEditorChangeParentCloseBtn").click(function(){
			let winContainer = $("#" + winContainerId)[0];
			$(winContainer).remove();
		});
		$(winContainer).find(".s3dTreeEditorChangeParentNodeHeader").click(function(){
			let nodeId = $(this).parent().attr("nodeId");
			let winContainer = $("#" + winContainerId)[0];
			$(winContainer).find(".s3dTreeEditorChangeParentNodeHeader").removeClass("s3dTreeEditorChangeParentNodeHeaderActive");
			$(winContainer).find(".s3dTreeEditorChangeParentNodeItem[nodeId='" + nodeId + "']").children(".s3dTreeEditorChangeParentNodeHeader").addClass("s3dTreeEditorChangeParentNodeHeaderActive");
		});

		$(winContainer).find(".s3dTreeEditorChangeParentButtonOk").click(function(){
			let winContainer = $("#" + winContainerId)[0];
			let activeHeaders = $(winContainer).find(".s3dTreeEditorChangeParentNodeHeaderActive");
			if(activeHeaders.length === 0){
				msgBox.alert({info: "请选择目标分组"});
			}
			else{
				let targetNodeId = $(activeHeaders[0]).parent().attr("nodeId");
				let nodeIdsStr = $(winContainer).attr("nodeIds");
				let nodeIds = nodeIdsStr.split(",");
				let isChildren = false;
				for(let i = 0; i < nodeIds.length; i++){ 
					let nodeId = nodeIds[i];
					if(thatS3dTreeEditor.checkIsChildren(nodeId, targetNodeId)){
						isChildren = true;
					}
				} 
				if(isChildren){
					msgBox.alert({info: "不可以选择当前节点的子节点"});
				}
				else{
					//开始记录到undo list
					thatS3dTreeEditor.beginAddToUndoList();
	
					for(let i = 0; i < nodeIds.length; i++){ 
						let nodeId = nodeIds[i];
						thatS3dTreeEditor.changeNodeParent(nodeId, targetNodeId);
					} 
					
					//结束记录到undo list
					thatS3dTreeEditor.endAddToUndoList();

					$(winContainer).remove();
				}
			}
		});

		$(winContainer).find(".s3dTreeEditorChangeParentButtonRoot").click(function(){
			let winContainer = $("#" + winContainerId)[0]; 
			let nodeId = $(winContainer).attr("nodeId"); 
			thatS3dTreeEditor.changeNodeParent(nodeId, null);
			$(winContainer).remove(); 
		});
	}

	this.changeNodeParent = function(nodeId, targetNodeId){
		let container = $("#" + thatS3dTreeEditor.containerId);
		let oldParentNodeId = thatS3dTreeEditor.getGroupId(nodeId);
		if(targetNodeId == null){
			//根节点
			let nodeContainer = $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']")[0];
			let targetChildrenContainer = $(container).find(".s3dTreeEditorInnerContainer")[0];
			$(nodeContainer).appendTo(targetChildrenContainer); 
		}
		else{
			let nodeContainer = $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']")[0];
			let targetChildrenContainer = $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + targetNodeId + "']").children(".s3dTreeEditorChildrenContainer")[0];
			$(nodeContainer).appendTo(targetChildrenContainer); 
		}

		thatS3dTreeEditor.sortChildNodes(targetNodeId);

		thatS3dTreeEditor.refreshGroupUnitCount(oldParentNodeId);
		thatS3dTreeEditor.refreshGroupUnitCount(targetNodeId);
	}

	this.sortSameGroupNodes = function(nodeId){
		let childrenContainer =  $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']").parent()[0];
		thatS3dTreeEditor.addToSortedChildrenContainer(childrenContainer);
	}

	this.sortChildNodes = function(parentNodeId){
		let container = $("#" + thatS3dTreeEditor.containerId);
		let childrenContainer = parentNodeId == null ? $(container).find(".s3dTreeEditorInnerContainer")[0] :  $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + parentNodeId + "']").children(".s3dTreeEditorChildrenContainer")[0];
		thatS3dTreeEditor.addToSortedChildrenContainer(childrenContainer);
	}

	this.addToSortedChildrenContainer = function(childrenContainer){
		let newContainerId = cmnPcr.getRandomValue();		let containerClass = $(childrenContainer).attr("class");
		let newContainerHtml = "<div id=\"" + newContainerId + "\" class=\"" + containerClass + "\"></div>";
		
		$(childrenContainer).parent().append(newContainerHtml);
		let newContainer = $("#" + thatS3dTreeEditor.containerId).find("#" + newContainerId);

		let childContainers = $(childrenContainer).children(".s3dTreeEditorNodeContainer");
		let sortedChildContainers = [];
		for(let i = 0; i < childContainers.length; i++){
			let added = false;
			let childContainer = childContainers[i];
			let nodeName = $(childContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeName").text();
			let newSortedChildContainers = [];
			for(let j = 0; j < sortedChildContainers.length; j++){
				let sortedChildContainer = sortedChildContainers[j];
				let sortedNodeName =  $(sortedChildContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeName").text();
				if(!added && sortedNodeName.localeCompare(nodeName) > 0){
					newSortedChildContainers.push(childContainer);
					added = true;
				}
				newSortedChildContainers.push(sortedChildContainer);
			}
			if(!added){
				newSortedChildContainers.push(childContainer);
			}
			sortedChildContainers = newSortedChildContainers;
		}
		$(newContainer).append(sortedChildContainers);
		$(childrenContainer).remove();
	}

	this.checkIsChildren = function(parentNodeId, childNodeId){
		return $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + parentNodeId + "']").find(".s3dTreeEditorNodeContainer[nodeId='" + childNodeId + "']").length > 0;
	}

	this.addGroupNode = function(nodeJson, parentNodeId){
		let nodeHtml = thatS3dTreeEditor.getNodeHtml(nodeJson, true, true);
		if(parentNodeId == null){
			$("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorInnerContainer").append(nodeHtml);
		}
		else{
			$("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + parentNodeId + "']").children(".s3dTreeEditorChildrenContainer").append(nodeHtml);
		}
		thatS3dTreeEditor.id2NodeJsonMap[nodeJson.id] = nodeJson;
		thatS3dTreeEditor.bindNodeEvent(nodeJson.id);		
		thatS3dTreeEditor.sortSameGroupNodes(nodeJson.id);
	}

	this.addLeafNode = function(nodeJson, parentNodeId){
		let nodeHtml = thatS3dTreeEditor.getNodeHtml(nodeJson, false, false);
		if(parentNodeId == null){
			$("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorInnerContainer").append(nodeHtml);
		}
		else{
			$("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + parentNodeId + "']").children(".s3dTreeEditorChildrenContainer").append(nodeHtml);
		}
		thatS3dTreeEditor.id2NodeJsonMap[nodeJson.id] = nodeJson;
		thatS3dTreeEditor.bindNodeEvent(nodeJson.id);
		thatS3dTreeEditor.sortSameGroupNodes(nodeJson.id);

		thatS3dTreeEditor.refreshGroupUnitCount(parentNodeId);
	}

	this.addLeafNodes = function(nodeJsons, parentNodeId){
		let nodeHtml = "";
		for(let nodeId in nodeJsons) {
			let nodeJson = nodeJsons[nodeId];
			nodeHtml += thatS3dTreeEditor.getNodeHtml(nodeJson, false, false);
		}
		if(parentNodeId == null){
			$("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorInnerContainer").append(nodeHtml);
		}
		else{
			$("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + parentNodeId + "']").children(".s3dTreeEditorChildrenContainer").append(nodeHtml);
		}
		for(let nodeId in nodeJsons) {
			let nodeJson = nodeJsons[nodeId];
			thatS3dTreeEditor.id2NodeJsonMap[nodeJson.id] = nodeJson;
			thatS3dTreeEditor.bindNodeEvent(nodeJson.id);
		}

		thatS3dTreeEditor.sortChildNodes(parentNodeId);

		thatS3dTreeEditor.refreshGroupUnitCount(parentNodeId);
	}

	this.renameGroup = function(nodeId) {
		let container = $("#" + thatS3dTreeEditor.containerId);
		let nodeContainer = $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']");
		let isDefault = $(nodeContainer).attr("isDefault") === "true";
		if (isDefault) {
			msgBox.alert({info: "默认分组不支持重命名"});
		}
		else {
			let nodeName = $(nodeContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeName").text();
			let winContainerId = cmnPcr.getRandomValue();
			let nameWinHtml = thatS3dTreeEditor.getNameWinHtml(winContainerId, "重命名");
			$(container).append(nameWinHtml);
			let winContainer = $("#" + winContainerId)[0];
			$(winContainer).attr("nodeId", nodeId);
			$(winContainer).find(".s3dTreeEditorNameInput").val(nodeName);

			$(winContainer).find(".s3dTreeEditorNameCloseBtn").click(function () {
				let winContainer = $("#" + winContainerId)[0];
				$(winContainer).remove();
			});
			$(winContainer).find(".s3dTreeEditorNameButton").click(function () {
				let winContainer = $("#" + winContainerId)[0];
				let newGroupName = $(winContainer).find(".s3dTreeEditorNameInput").val().trim();
				let nodeId = $(winContainer).attr("nodeId");
				if (newGroupName.length === 0) {
					msgBox.alert({info: "请输入名称"});
				} else if (thatS3dTreeEditor.hasSameNameGroup(newGroupName, nodeId, null)) {
					msgBox.alert({info: "存在相同的组名"});
				} else {

					//开始记录到undo list
					thatS3dTreeEditor.beginAddToUndoList();

					thatS3dTreeEditor.refreshGroupName(nodeId, newGroupName);

					thatS3dTreeEditor.sortSameGroupNodes(nodeId);

					//结束记录到undo list
					thatS3dTreeEditor.endAddToUndoList();

					$(winContainer).remove();
				}
			});
		}
	}

	this.refreshGroupName = function (nodeId, groupName){
		let nodeContainer = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']");
		$(nodeContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeName").text(groupName);
	}

	this.refreshGroupUnitCount = function (nodeId){
		let nodeContainer = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']");
		let unitCount = $(nodeContainer).find(".s3dTreeEditorChildrenContainer .s3dTreeEditorNodeContainer").length;
		$(nodeContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeUnitCount").text(unitCount);
	}

	//开启添加到undo list
	this.beginAddToUndoList = function(){
		thatS3dTreeEditor.manager.statusBar.beginAddToUndoList({
			operateType: s3dOperateType.editTree,
			tree: thatS3dTreeEditor.getTreeJson()
		});
	}

	//结束添加到undo list
	this.endAddToUndoList = function(){
		thatS3dTreeEditor.manager.statusBar.endAddToUndoList({
			operateType: s3dOperateType.editTree,
			tree: thatS3dTreeEditor.getTreeJson()
		});
	}


	this.hasSameNameGroup = function(groupName, nodeId, parentNodeId){
		let sameGroupNodeContainers = [];
		if(nodeId != null){
			let nodeContainer = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']");
			sameGroupNodeContainers = $(nodeContainer).parent().children(".s3dTreeEditorNodeContainer");
		}
		else if(parentNodeId != null){
			let parentNodeContainer = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']");
			sameGroupNodeContainers = $(parentNodeContainer).children(".s3dTreeEditorChildrenContainer").children(".s3dTreeEditorNodeContainer");
		}
		else{
			sameGroupNodeContainers = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorInnerContainer").children(".s3dTreeEditorNodeContainer");
		}
		for(let i = 0; i < sameGroupNodeContainers.length; i++){
			let sameGroupNodeContainer = sameGroupNodeContainers[i];
			let nId = $(sameGroupNodeContainer).attr("nodeId");
			if(nId !== nodeId){
				let nName = $(sameGroupNodeContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeName").text();
				if(nName === groupName){
					return true;
				}
			}			
		}
		return false;
	}

	//获取name html(重命名分组、新建分组)
	this.getNameWinHtml = function(winContainerId, title){
		return "<div class=\"s3dTreeEditorNameContainer\" id=\"" + winContainerId + "\">"
			+ "<div class=\"s3dTreeEditorNameBackground\"></div>"
			+ "<div class=\"s3dTreeEditorNameOuterContainer\">"
			+ "<div class=\"s3dTreeEditorNameHeader\">"
			+ "<div class=\"s3dTreeEditorNameTitle\">" + title + "</div>"
			+ "<div class=\"s3dTreeEditorNameCloseBtn\">×</div>"
			+ "</div>"
			+ "<div class=\"s3dTreeEditorNameInnerContainer\">"
			+ "<div class=\"s3dTreeEditorNameItem\">"
			+ "<div class=\"s3dTreeEditorNameItemTitle\">分组名称</div>"
			+ "<div class=\"s3dTreeEditorNameItemValue\"><input type=\"text\" class=\"s3dTreeEditorNameInput\" /></div>"
			+ "</div>"
			+ "<div class=\"s3dTreeEditorNameItem\">"
			+ "<div class=\"s3dTreeEditorNameItemTitle\"></div>"
			+ "<div class=\"s3dTreeEditorNameItemValue\"><div class=\"s3dTreeEditorNameButton\">确 定</div></div>"
			+ "</div>"
			+ "</div>"
			+ "</div>"
			+ "</div>"
			+ "</div>";
	}

	//获取name html(重命名分组、新建分组)
	this.getChangeParentWinHtml = function(winContainerId, title){
		return  "<div class=\"s3dTreeEditorChangeParentContainer\" id=\"" + winContainerId + "\">"
			+ "<div class=\"s3dTreeEditorChangeParentBackground\"></div>"
			+ "<div class=\"s3dTreeEditorChangeParentOuterContainer\">"
			+ "<div class=\"s3dTreeEditorChangeParentHeader\">"
			+ "<div class=\"s3dTreeEditorChangeParentTitle\">" + title + "</div>"
			+ "<div class=\"s3dTreeEditorChangeParentCloseBtn\">×</div>"
			+ "</div>"
			+ "<div class=\"s3dTreeEditorChangeParentInnerContainer\">"
			+ "<div class=\"s3dTreeEditorChangeParentTree\">"
			+ thatS3dTreeEditor.getChangeParentSubHtml(null)
			+ "</div>"
			+ "<div class=\"s3dTreeEditorChangeParentBottom\">"
			/*暂不启用
			+ "<div class=\"s3dTreeEditorChangeParentButton s3dTreeEditorChangeParentButtonRoot\">设为根节点</div>"
			 */
			+ "<div class=\"s3dTreeEditorChangeParentButton s3dTreeEditorChangeParentButtonOK\">确 定</div>"
			+ "</div>"
			+ "</div>"
			+ "</div>"
			+ "</div>"
			+ "</div>";
	}

	this.getChangeParentSubHtml = function(parentNodeId){
		let container = $("#" + thatS3dTreeEditor.containerId);
		let html = "";
		let treeEditorNodeContainers = parentNodeId == null ? $(container).find(".s3dTreeEditorInnerContainer").children() : $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + parentNodeId + "']").children(".s3dTreeEditorChildrenContainer").children();
		for(let i = 0; i < treeEditorNodeContainers.length; i++){
			let treeEditorNodeContainer = treeEditorNodeContainers[i];
			let nodeId = $(treeEditorNodeContainer).attr("nodeId");
			let isLeaf = $(treeEditorNodeContainer).attr("isLeaf") === "true";
			let childNodes = $(treeEditorNodeContainer).children(".s3dTreeEditorChildrenContainer").children();
			let nodeName = $(treeEditorNodeContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeName").text();
			if(!isLeaf){
				html += "<div class=\"s3dTreeEditorChangeParentNodeItem\" nodeId=\"" + nodeId + "\">";
				html += "<div class=\"s3dTreeEditorChangeParentNodeHeader\"><div class=\"s3dTreeEditorChangeParentNodeTitle\">" + cmnPcr.html_encode(nodeName) + "</div></div>";
				if(childNodes.length > 0){
					html += "<div class=\"s3dTreeEditorChangeParentSubNodeContainer\">";
					html += thatS3dTreeEditor.getChangeParentSubHtml(nodeId);
					html += "</div>";
				}
				html += "</div>";
			}
		}
		return html;
	}

	this.removeNode = function(nodeId){
		let container = $("#" + thatS3dTreeEditor.containerId);
		let nodeContainer = $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']");
		if($(nodeContainer).find(".s3dTreeEditorNodeContainer").length === 0){

			let nodeName = $(nodeContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeName").text();
			let isLeaf = $(nodeContainer).attr("isLeaf") === "true";
			let isDefault = $(nodeContainer).attr("isDefault") === "true";
			if(isDefault){
				msgBox.alert({info: "该分组为默认分组, 不允许删除."});
			}
			else if(msgBox.confirm({info: "确定删除" + (isLeaf ? "图元" : "分组") + " " + nodeName + " 吗?"})){
				if(isLeaf){
					thatS3dTreeEditor.removeLeafNode(nodeId);
					thatS3dTreeEditor.manager.viewer.removeObject(nodeId, false);
				}
				else{
					//开始记录到undo list
					thatS3dTreeEditor.beginAddToUndoList();

					thatS3dTreeEditor.removeGroupNode(nodeId);

					//结束记录到undo list
					thatS3dTreeEditor.endAddToUndoList();
				}
			}
		}
		else{
			msgBox.alert({info: "该分组包含子节点, 不允许删除."});
		}
	}

	this.removeNodeInSilence = function(nodeId){
		let container = $("#" + thatS3dTreeEditor.containerId);
		let nodeContainer = $(container).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']");
		if($(nodeContainer).find(".s3dTreeEditorNodeContainer").length === 0){
			let isLeaf = $(nodeContainer).attr("isLeaf") === "true";
			if(isLeaf){
				thatS3dTreeEditor.removeLeafNode(nodeId);
			}
			else{
				thatS3dTreeEditor.removeGroupNode(nodeId);
			}
		}
		else{
			msgBox.alert({info: "该分组包含子节点, 不允许删除."});
		}
	}

	this.removeGroupNode = function(nodeId){
		let nodeContainer = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']");
		$(nodeContainer).remove();
	}

	this.getGroupId = function (nodeId){
		return $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']").parent().parent().attr("nodeId");
	}

	this.removeLeafNode = function(nodeId){
		let parentNodeId = thatS3dTreeEditor.getGroupId(nodeId);

		let nodeContainer = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']");
		$(nodeContainer).remove();

		thatS3dTreeEditor.refreshGroupUnitCount(parentNodeId);
	}

	this.bindNodeEvent = function(nodeId){
		let nodeItem = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']")[0]; 
		let expandBtn = $(nodeItem).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNode")[0];
		let nodeTitle = $(nodeItem).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle")[0];
		let checkInput = $(nodeItem).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeCheckbox")[0];
		let deleteBtn = $(nodeItem).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeDeleteBtn")[0];
		let renameBtn = $(nodeItem).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeRenameBtn")[0];
		let addSubGroupBtn = $(nodeItem).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeAddSubGroupBtn")[0];
		let changeParentBtn = $(nodeItem).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeChangeParentBtn")[0];
		
		//点击节点名称事件
		$(nodeTitle).click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTreeEditor.nodeTitleClick(nodeId);
		});

		//点击折叠或展开
		$(expandBtn).click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTreeEditor.changeNodeExpandStatus(nodeId);
		});
		
		//复选框
		$(checkInput).click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTreeEditor.checkNode(nodeId);
		});
		
		//删除节点
		$(deleteBtn).click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTreeEditor.removeNode(nodeId);
		});
		
		//重命名节点
		$(renameBtn).click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTreeEditor.renameGroup(nodeId);
		});

		//添加下级分组
		$(addSubGroupBtn).click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTreeEditor.addGroup(nodeId);
		});

		//更换所属分组
		$(changeParentBtn).click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTreeEditor.changeParentGroup([nodeId]);
		});
	}
	
	//设置节点选中状态
	this.setNodeCheckStatus = function(nodeItem, checked, changedNodeIds){
		let checkbox = $(nodeItem).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeCheckbox");
		let childrenContainers = $(nodeItem).children(".s3dTreeEditorChildrenContainer");
		let hasChildren = childrenContainers.length !== 0;
		if(hasChildren){
			let childrenNodeItems = $(childrenContainers[0]).children(".s3dTreeEditorNodeContainer");
			for(let i = 0; i < childrenNodeItems.length; i++){
				let childNodeItem = childrenNodeItems[i];
				thatS3dTreeEditor.setNodeCheckStatus(childNodeItem, checked, changedNodeIds);
			}
		}	
		else{
			//记录变化状态的node
			if((checked && $(checkbox).hasClass("s3dTreeEditorNodeCheckboxNone"))
				||(!checked && $(checkbox).hasClass("s3dTreeEditorNodeCheckboxChecked"))){
				let nodeId = $(nodeItem).attr("nodeId");
				changedNodeIds.push(nodeId); 
			}
		}
		if(checked){
			$(checkbox).removeClass("s3dTreeEditorNodeCheckboxPart");
			$(checkbox).removeClass("s3dTreeEditorNodeCheckboxNone");
			$(checkbox).addClass("s3dTreeEditorNodeCheckboxChecked");
		}
		else {
			$(checkbox).removeClass("s3dTreeEditorNodeCheckboxPart");
			$(checkbox).removeClass("s3dTreeEditorNodeCheckboxChecked");
			$(checkbox).addClass("s3dTreeEditorNodeCheckboxNone");
		}
			
	} 
	
	//刷新所有父节点选中状态（递归）
	this.refreshAllParentCheckStatus = function(nodeItem){
		let parentNodeItem = $(nodeItem).parent().parent()[0];
		while($(parentNodeItem).hasClass("s3dTreeEditorNodeContainer")){
			let checkStatus = thatS3dTreeEditor.getAllChildrenCheckStatus(parentNodeItem);
			let checkbox = $(parentNodeItem).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeCheckbox");
			if(checkStatus.allChecked){
				$(checkbox).removeClass("s3dTreeEditorNodeCheckboxPart");
				$(checkbox).removeClass("s3dTreeEditorNodeCheckboxNone");
				$(checkbox).addClass("s3dTreeEditorNodeCheckboxChecked");
			}
			else if(checkStatus.allUnchecked){
				$(checkbox).removeClass("s3dTreeEditorNodeCheckboxPart");
				$(checkbox).removeClass("s3dTreeEditorNodeCheckboxChecked");
				$(checkbox).addClass("s3dTreeEditorNodeCheckboxNone");
			}
			else {
				$(checkbox).removeClass("s3dTreeEditorNodeCheckboxChecked");
				$(checkbox).removeClass("s3dTreeEditorNodeCheckboxNone");
				$(checkbox).addClass("s3dTreeEditorNodeCheckboxPart");
			}
			parentNodeItem = $(parentNodeItem).parent().parent();
		}
	}
	
	//获取子节点选中状态
	this.getAllChildrenCheckStatus = function(parentNodeItem){
		let allChecked = true;
		let allUnchecked = true;
		let childrenContainer = $(parentNodeItem).children(".s3dTreeEditorChildrenContainer")[0];
		let allChildrenNodeItems = $(childrenContainer).children(".s3dTreeEditorNodeContainer").children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeCheckbox");
		for(let i = 0; i < allChildrenNodeItems.length; i++){
			let childNodeItem = allChildrenNodeItems[i];
			if($(childNodeItem).hasClass("s3dTreeEditorNodeCheckboxNone")){
				allChecked = false;
			}
			else if($(childNodeItem).hasClass("s3dTreeEditorNodeCheckboxPart")){
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
				thatS3dTreeEditor.initId2NodeJsonMap(nodeJson.children, id2NodeJsonMap);
			}
		}
	}

	//该节点下的所有叶节点id
	this.getChildNodeIds = function(nodeId){
		let leafNodes = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']").find(".s3dTreeEditorNodeContainer[isLeaf='true']");
		let nodeIds = [];
		for(let i = 0; i < leafNodes.length; i++){
			let leafNode = leafNodes[i];
			nodeIds.push($(leafNode).attr("nodeId"));
		}
		return nodeIds;
	}
	
	//该节点下的所有叶节点Json
	this.getChildNodeJsons = function(nodeId){
		let leafNodes = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']").find(".s3dTreeEditorNodeContainer[isLeaf='true']");
		let nodeJsons = [];
		for(let i = 0; i < leafNodes.length; i++){
			let leafNode = leafNodes[i];
			let leafNodeId = $(leafNode).attr("nodeId");
			nodeJsons.push(thatS3dTreeEditor.id2NodeJsonMap[leafNodeId]);
		}
		return nodeJsons;
	}
	
	//是否包含子节点
	this.checkHasChildren = function(nodeId){
		return $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']").attr("isLeaf") === "false";
	}	
	
	//获取树html
	this.getTreeHtml = function(nodeJArray){
		let treeHtml = "<div class=\"s3dTreeEditorContainer\" tabindex=\"1\">";
		treeHtml += "<div class=\"s3dTreeEditorBackground\"></div>";
		treeHtml += "<div class=\"s3dTreeEditorHeader\">";
		treeHtml += "<div class=\"s3dTreeEditorTitle\"></div>";
		treeHtml += "<div class=\"s3dTreeEditorHeaderBtn s3dTreeEditorAddRootGroupBtn\">+</div>";
		treeHtml += "<div class=\"s3dTreeEditorHeaderBtn s3dTreeEditorMultiNodeChangeParentBtn\">&#x21c4;</div>";
		treeHtml += "<div class=\"s3dTreeEditorHeaderBtn s3dTreeEditorCloseBtn\">×</div>";
		treeHtml += "</div>";
		treeHtml += "<div class=\"s3dTreeEditorInnerContainer\">";
		if(nodeJArray != null){
			for(let i = 0; i < nodeJArray.length; i++){
				let nodeJson = nodeJArray[i];
				let hasChildren = nodeJson.children != null && nodeJson.children.length > 0;
				let isGroup = nodeJson.isGroup == undefined ? false : nodeJson.isGroup;
				let childNodeHtml = thatS3dTreeEditor.getNodeHtml(nodeJson, false, isGroup || hasChildren);
				treeHtml += childNodeHtml;
			}
		}
		treeHtml += "</div>";
		treeHtml += "</div>";
		return treeHtml;
	}
	
	//获取node节点html
	this.getNodeHtml = function(nodeJson, expanded, isGroup){
		let isDefault = nodeJson.isDefault;
		let nodeHtml = "";
		nodeHtml += "<div class=\"s3dTreeEditorNodeContainer\" nodeId=\"" + nodeJson.id + "\" isLeaf=\"" + (isGroup ? "false" : "true") + "\" isDefault=\"" + (isDefault ? "true" : "false") + "\">";
		nodeHtml += "<div class=\"s3dTreeEditorNodeHeader\">";
		nodeHtml += ("<div class=\"s3dTreeEditorNodeCheckbox s3dTreeEditorNodeCheckboxChecked\"></div>");
		nodeHtml += (isGroup ? ("<div class=\"s3dTreeEditorNode " + (expanded ? "s3dTreeEditorNodeExpand" : "s3dTreeEditorNodeCollapse") + "\"></div>") : "");
		nodeHtml += "<div class=\"s3dTreeEditorNodeTitle\">";
		nodeHtml += ("<span class=\"s3dTreeEditorNodeName\">" + cmnPcr.html_encode(nodeJson.name) + "</span>");
		if(isGroup) {
			let unitCount = nodeJson.children == null ? 0 : nodeJson.children.length;
			nodeHtml += ("&nbsp;(<span class=\"s3dTreeEditorNodeUnitCount\">" + unitCount + "</span>)");
		}
		nodeHtml += "</div>";
		nodeHtml += "<div class=\"s3dTreeEditorNodeBtn s3dTreeEditorNodeDeleteBtn\" title=\"删除\">&#10005;</div>";
		if(!isGroup) {
			nodeHtml += "<div class=\"s3dTreeEditorNodeBtn s3dTreeEditorNodeChangeParentBtn\" title=\"更换上级\">&#x21c4;</div>";
		}
		/*
		nodeHtml += (isGroup ? "<div class=\"s3dTreeEditorNodeBtn s3dTreeEditorNodeAddSubGroupBtn\" title=\"新建子分组\">+</div>" : "");
		 */
		nodeHtml += (isGroup ? "<div class=\"s3dTreeEditorNodeBtn s3dTreeEditorNodeRenameBtn\" title=\"重命名\">&#x270e;</div>" : "");
		nodeHtml += "</div>";
		if(isGroup){
			nodeHtml += ("<div class=\"s3dTreeEditorChildrenContainer" + (expanded ? "" : " s3dTreeEditorHidden") + "\">");
			if(nodeJson.children != null){
				for(let i = 0; i < nodeJson.children.length; i++){
					let childNodeJson = nodeJson.children[i];
					let hasChildChildren = childNodeJson.children != null && childNodeJson.children.length > 0;
					let isChildGroup = childNodeJson.isGroup == undefined ? false : childNodeJson.isGroup;
					let childNodenodeHtml = thatS3dTreeEditor.getNodeHtml(childNodeJson, false, isChildGroup || hasChildChildren);
					nodeHtml += childNodenodeHtml;
				}
			}
			nodeHtml += "</div>";
		}
		nodeHtml += "</div>";
		return nodeHtml;
	}

	this.getTreeJson = function(){
		let parentContainer = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorInnerContainer");
		let treeRootJson = {};
		thatS3dTreeEditor.getTreeNodeJson(treeRootJson, parentContainer);
		return treeRootJson;
	}

	this.getTreeNodeJson = function(parentNodeJson, parentContainer){
		let childContainers = $(parentContainer).children(".s3dTreeEditorNodeContainer");
		if(childContainers.length > 0){
			parentNodeJson.children = [];
			for(let i = 0; i < childContainers.length; i++){
				let childContainer = childContainers[i];
				let isGroup = $(childContainer).attr("isLeaf") !== "true";
				let childNodeId = $(childContainer).attr("nodeId");
				let childNodeName = $(childContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeName").text();
				let childNodeJson = {
					id: childNodeId,
					name: childNodeName,
					isGroup: isGroup
				};
				let childNextLevelContainer = $(childContainer).children(".s3dTreeEditorChildrenContainer");
				thatS3dTreeEditor.getTreeNodeJson(childNodeJson, childNextLevelContainer);
				parentNodeJson.children.push(childNodeJson);
			}
		}
	}

	//更改节点名称（唯一标识）
	this.changeNodeName = function(nodeId, nodeName){
		let nodeContainer = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorNodeContainer[nodeId='" + nodeId + "']");
		$(nodeContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeName").text(nodeName);
		thatS3dTreeEditor.sortSameGroupNodes(nodeId);
	}

	//获取当前的分组id
	this.getCurrentGroupNodeId = function(){
		let container = $("#" + thatS3dTreeEditor.containerId);
		let activeNodeHeaders = $(container).find(".s3dTreeEditorNodeHeaderActive");
		if(activeNodeHeaders.length === 0){
			let defaultGroupContainer = $(container).find(".s3dTreeEditorNodeContainer[isDefault='true']");
			return $(defaultGroupContainer).attr("nodeId");
		}
		else{
			let nodeContainer = $(activeNodeHeaders[0]).parent();
			let isLeaf= $(nodeContainer).attr("isLeaf") === "true";
			if(isLeaf){
				//找到其父节点为group
				let parentContainer = $(nodeContainer).parent()[0];
				if($(parentContainer).hasClass("s3dTreeEditorInnerContainer")){
					//根节点
					return null;
				}
				else{
					let groupContainer = $(parentContainer).parent()[0];
					return $(groupContainer).attr("nodeId");
				}
			}
			else{
				//当前选中的节点就是group
				return $(activeNodeHeaders[0]).parent().attr("nodeId");
			}
		}
	}


	this.getResultGroups = function(){
		let parentContainer = $("#" + thatS3dTreeEditor.containerId).find(".s3dTreeEditorInnerContainer");
		return thatS3dTreeEditor.getGroupJsons(parentContainer);
	}

	this.getGroupJsons = function(parentContainer){
		let groupJsons = [];
		let childContainers = $(parentContainer).children(".s3dTreeEditorNodeContainer");
		if(childContainers.length > 0){
			for(let i = 0; i < childContainers.length; i++){
				let childContainer = childContainers[i];
				let isGroup = $(childContainer).attr("isLeaf") !== "true";
				let isDefault = $(childContainer).attr("isDefault") === "true";
				let childNodeId = $(childContainer).attr("nodeId");
				let childNodeName = $(childContainer).children(".s3dTreeEditorNodeHeader").children(".s3dTreeEditorNodeTitle").children(".s3dTreeEditorNodeName").text();
				let childNodeJson = {
					id: childNodeId,
					name: childNodeName,
					isDefault: isDefault,
					units: []
				};
				let childUnitContainers = $(childContainer).children(".s3dTreeEditorChildrenContainer").children(".s3dTreeEditorNodeContainer");
				for(let j = 0; j < childUnitContainers.length; j++){
					let childUnitContainer = childUnitContainers[j];
					childNodeJson.units.push($(childUnitContainer).attr("nodeId"));
				}
				groupJsons.push(childNodeJson);
			}
		}
		return groupJsons;
	}
}
export default S3dTreeEditor