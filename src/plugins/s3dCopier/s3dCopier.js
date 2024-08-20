import * as THREE from "three";

//S3dCopier 复制粘贴
let S3dCopier = function (){
	//当前对象
	const thatS3dCopier = this; 

	this.manager = null;
	
	//containerId
	this.containerId = null;

	//被复制的内容
	this.copiedData = null;

	//初始化
	this.init = function(p){
		thatS3dCopier.manager = p.manager; 
		thatS3dCopier.containerId = p.containerId;
	}  

	//复制
	this.copy = function(p){
		let object3Ds = p.object3Ds; 
		let nodeJsons = [];
		let groupNodeId = thatS3dCopier.manager.treeEditor.getCurrentGroupNodeId();
		for(let i = 0; i < object3Ds.length; i++){
			let object3D = object3Ds[i];
			let nodeId = object3D.userData.unitInfo.id;
			let nodeJson = thatS3dCopier.manager.viewer.cloneJsonById(nodeId);

			let pasteShiftX = 0;
			let pasteShiftY = 0;
			let pasteShiftZ = 0;
			if(!nodeJson.useWorldPosition) {
				let box = new THREE.Box3().setFromObject(object3D, true);
				pasteShiftX = box.max.x - box.min.x;
				pasteShiftZ = box.max.z - box.min.z;
			}
 
			nodeJsons.push({	
				position: nodeJson.position,
				rotation: nodeJson.rotation,
				componentCode: nodeJson.code ,
				versionNum: nodeJson.versionNum,
				groupNodeId: groupNodeId,
				customInfo: nodeJson.customInfo,
				parameters: nodeJson.parameters,
				materials: nodeJson.materials,
				useWorldPosition: nodeJson.useWorldPosition,
				isServer: nodeJson.isServer,
				pasteShift:{
					x: pasteShiftX,
					y: pasteShiftY,
					z: pasteShiftZ
				}
			});			
		}
		thatS3dCopier.copiedData = {
			nodeJsons: nodeJsons,
			pasteCount: 0
		};
		thatS3dCopier.manager.statusBar.refreshStatusText({
			status: thatS3dCopier.manager.viewer.status,
			message: "复制了 " + nodeJsons.length + " 个图元"
		});
	}

	//粘贴
	this.paste = function(p){	
		let pasteCount = thatS3dCopier.copiedData.pasteCount + 1;
		thatS3dCopier.copiedData.pasteCount = pasteCount;

		let groupNodeId = thatS3dCopier.manager.treeEditor.getCurrentGroupNodeId();

		let newServerNodeJsons = [];
		let newLocalNodeJsons = [];
		for(let i = 0; i < thatS3dCopier.copiedData.nodeJsons.length; i++){
			let nodeJson = thatS3dCopier.copiedData.nodeJsons[i];			
			let componentInfo = null;
			if(nodeJson.isServer) {
				componentInfo = thatS3dCopier.manager.serverObjectCreator.getComponentInfo(nodeJson.componentCode, nodeJson.versionNum);
			}
			else{
				componentInfo = thatS3dCopier.manager.localObjectCreator.getComponentInfo(nodeJson.componentCode, nodeJson.versionNum);
			}
			let parameters = {};
			for(let paramName in componentInfo.parameters){
				let param = componentInfo.parameters[paramName];
				parameters[paramName] = {
					value: nodeJson.parameters[paramName] == null ? null : nodeJson.parameters[paramName].value,
					isGeo: param.isGeo
				};
			}

			let position = [nodeJson.position[0] + nodeJson.pasteShift.x * pasteCount,
				nodeJson.position[1] + nodeJson.pasteShift.y * pasteCount,
				nodeJson.position[2] + nodeJson.pasteShift.z * pasteCount,
			];

			if(nodeJson.isServer) {
				newServerNodeJsons.push({
					position: position,
					rotation: nodeJson.rotation,
					code: nodeJson.componentCode,
					versionNum: nodeJson.versionNum,
					isOnGround: false,
					needSelectAfterAdd: thatS3dCopier.copiedData.nodeJsons.length === 1,
					customInfo: nodeJson.customInfo,
					parameters: parameters,
					groupNodeId: groupNodeId
				});
			}
			else {
				newLocalNodeJsons.push({
					position: position,
					rotation: nodeJson.rotation,
					code: nodeJson.componentCode,
					versionNum: nodeJson.versionNum,
					isOnGround: false,
					needSelectAfterAdd: thatS3dCopier.copiedData.nodeJsons.length === 1,
					customInfo: nodeJson.customInfo,
					parameters: parameters,
					materials: nodeJson.materials,
					groupNodeId: groupNodeId
				});
			}
		} 
		//先取消选中当前的对象，再添加
		thatS3dCopier.manager.viewer.cancelSelectObject3Ds();
		if(newServerNodeJsons.length > 0) {
			thatS3dCopier.manager.viewer.addNewServerObjects(newServerNodeJsons);
		}
		if(newLocalNodeJsons.length > 0) {
			thatS3dCopier.manager.viewer.addNewLocalObjects(newLocalNodeJsons);
		}
	}	
}
export default S3dCopier