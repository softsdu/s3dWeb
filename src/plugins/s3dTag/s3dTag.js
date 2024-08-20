import {cmnPcr} from "../../commonjs/common/static.js"
import "./s3dTag.css"

//S3dWeb 标注
let S3dTag = function (){
	
	//当前对象
	const thatS3dTag = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;  

	//节点ID与tag object3D
	this.nodeId2TagObject3D = null;

	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dTag.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dTag.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dTag.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	}

	//初始化
	this.init = function(p){
		thatS3dTag.containerId = p.containerId;
		thatS3dTag.manager = p.manager;
		thatS3dTag.nodeId2TagObject3D = {};
		thatS3dTag.initContainer();

		let container = $("#" + thatS3dTag.containerId);
		$(container).on("touchstart", thatS3dTag.onDocumentClick);
		$(container).on("click", thatS3dTag.onDocumentClick);

        if(p.config.onTagClick != null){
        	thatS3dTag.addEventFunction("onTagClick", p.config.onTagClick); 
        }
	}

	this.onDocumentClick = function(ev){
		if($(ev.target).hasClass("s3dTagLink")){
			let nodeId = $(ev.target).parent().parent().attr("nodeId");
			thatS3dTag.onTagClick({
				nodeId: nodeId	
			});
		}
	}

	this.onTagClick = function(p){
    	thatS3dTag.doEventFunction("onTagClick", p);
	}
	
	//添加标注
	this.addTag = function(p){ 
		let existTag3D = thatS3dTag.nodeId2TagObject3D[p.nodeId];
		if(existTag3D != null){
			thatS3dTag.removeTag(p);
		}
		let object3D = thatS3dTag.manager.viewer.getObject3DById(p.nodeId);		
		if(object3D == null){
			throw "Unknown object3D. nodeId = " + p.nodeId;
		}
		p.tagId = cmnPcr.getRandomValue();
		let tagHtml = p.linkUrl == null ? thatS3dTag.getTagHtml(p) : thatS3dTag.getTagWithLinkHtml(p);
		$("#" + thatS3dTag.containerId).find(".s3dTagLayerContainer").append(tagHtml);
		let tagDiv = $("#" + p.tagId)[0]; 
		let tag2D = new THREE.CSS2DObject(tagDiv);
		tag2D.isTag = true;
		let posToRoot = thatS3dTag.manager.viewer.getPositionInRoot(object3D);
		if(p.shift == null){
			tag2D.position.set(posToRoot.x, posToRoot.y, posToRoot.z);		
		}
		else {
			tag2D.position.set(posToRoot.x + p.shift.x, posToRoot.y + p.shift.y, posToRoot.z + p.shift.z);		
		}
		let rootObject3D = thatS3dTag.manager.viewer.getRootObject3D(); 
		rootObject3D.add(tag2D);
		thatS3dTag.nodeId2TagObject3D[p.nodeId] = tag2D;
		/*
		$("#" + thatS3dTag.containerId).find(".s3dTagLink").click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTag.onTagClick({
				nodeId: nodeId	
			});
		});
		*/
	}
	
	//添加标注
	this.addTagByPosition = function(p){ 
		let existTag3D = thatS3dTag.nodeId2TagObject3D[p.nodeId];
		if(existTag3D != null){
			thatS3dTag.removeTag(p);
		}
		p.tagId = cmnPcr.getRandomValue();
		let tagHtml = p.linkUrl == null ? thatS3dTag.getTagHtml(p) : thatS3dTag.getTagWithLinkHtml(p);
		$("#" + thatS3dTag.containerId).find(".s3dTagLayerContainer").append(tagHtml);
		let tagDiv = $("#" + p.tagId)[0]; 
		let tag2D = new THREE.CSS2DObject(tagDiv);
		tag2D.isTag = true; 
		tag2D.position.set(p.position.x, p.position.y, p.position.z);		
		let rootObject3D = thatS3dTag.manager.viewer.getRootObject3D(); 
		rootObject3D.add(tag2D);
		thatS3dTag.nodeId2TagObject3D[p.nodeId] = tag2D;
		/*
		$("#" + thatS3dTag.containerId).find(".s3dTagLink").click(function(){
			let nodeId = $(this).parent().parent().attr("nodeId");
			thatS3dTag.onTagClick({
				nodeId: nodeId	
			});
		});
		*/
	}
	
	this.removeTag = function(p){
		let existTag3D = thatS3dTag.nodeId2TagObject3D[p.nodeId];
		if(existTag3D != null){
			let rootObject3D = thatS3dTag.manager.viewer.getRootObject3D(); 
			rootObject3D.remove(existTag3D);
			delete thatS3dTag.nodeId2TagObject3D[p.nodeId];			
		}
	}
	
	//获取tag html
	this.getTagHtml = function(p){  
		return  "<div class=\"s3dTagContainer\" id=\"" + p.tagId + "\" nodeId=\"" + p.nodeId + "\">"
		 	+ "<div class=\"s3dTagBackground\"></div>"
		 	+ "<div class=\"s3dTagContent\">" + cmnPcr.html_encode(p.content) + "</div>"
			+ "</div>";
	}
	
	//获取tag html
	this.getTagWithLinkHtml = function(p){
		return "<div class=\"s3dTagContainer\" id=\"" + p.tagId + "\" nodeId=\"" + p.nodeId + "\">"
		 	+ "<div class=\"s3dTagBackground\"></div>"
		 	+ "<div class=\"s3dTagContentWithLink\"><a class=\"s3dTagLink\">" + cmnPcr.html_encode(p.content) + "</a></div>"
			+ "</div>";
	}
	
	this.initContainer = function(){
		let html = "<div class=\"s3dTagLayerContainer\"></div>"
		$("#" + thatS3dTag.containerId).append(html);
	}
}
export default S3dTag