import * as THREE from "three";
import {cmnPcr, msgBox, s3dOperateType} from "../../commonjs/common/static.js"

//S3dWeb splitter将大模型分解成小模型
let S3dSplitter = function (){
	//当前对象
	const thatS3dSplitter = this;

	this.manager = null;

	this.init= function (p){
		thatS3dSplitter.manager = p.manager;
	}

	this.do = function (p) {
		thatS3dSplitter.split();
	}

	this.split = function (){
		let object3Ds = thatS3dSplitter.manager.viewer.selectedObject3Ds;
		if(object3Ds == null || object3Ds.length !== 1){
			msgBox.alert({info: "请选中一个构件."});
		}
		else{
			let unitObject3D = object3Ds[0];
			let unitInfo = unitObject3D.userData.unitInfo;
			if(unitInfo.isServer){
				msgBox.alert({info: "仅支持对本地组件模型进行分解."});
			}
			else{
				thatS3dSplitter.manager.viewer.unSelectObject3D(unitObject3D);
				let unitInfo = unitObject3D.userData.unitInfo;
				thatS3dSplitter.splitObject3D(unitObject3D, unitInfo);
			}
		}
    }

	this.splitObject3D = function (unitObject3D, unitInfo){
		let partName = unitInfo.parameters["组成部分"].value;

		let childInfo = thatS3dSplitter.getChildInfo(unitObject3D, unitInfo, partName);
		if(childInfo.count === 0){
			msgBox.alert({info: "不包含子构件，无法分解."});
		}
		else {
			let newGroupId = cmnPcr.createGuid();
			let unitJsons = {};
			let unitIds = [];
			for (let childName in childInfo.infoMap) {
				let info = childInfo.infoMap[childName];
				let unitJson = {
					id: cmnPcr.createGuid(),
					name: unitInfo.name + "_" + childName,
					code: unitInfo.code,
					versionNum: unitInfo.versionNum,
					position: info.position,
					rotation: info.rotation,
					parameters: {},
					groupNodeId: newGroupId,
					isOnGround: false,
					needSelectAfterAdd: false
				};
				for (let paramName in unitInfo.parameters) {
					let parameter = unitInfo.parameters[paramName];
					unitJson.parameters[paramName] = {
						value: parameter.value
					};
				}
				//组成部分
				unitJson.parameters["组成部分"].value = childName;

				unitJsons[unitJson.id] = unitJson;
				unitIds.push(unitJson.id);
			}

			//开始记录到undo list
			thatS3dSplitter.manager.viewer.beginAddToUndoList(s3dOperateType.splitLocal, unitIds, {sourceNodeId: unitInfo.id});

			thatS3dSplitter.manager.treeEditor.addGroupNodeInSilence(newGroupId, unitInfo.name);

			thatS3dSplitter.manager.viewer.addNewObjectsInSilence(unitJsons);

			thatS3dSplitter.manager.treeEditor.addLeafNodes(unitJsons, newGroupId);

			thatS3dSplitter.manager.viewer.removeObjectByIdInSilence(unitInfo.id);

			thatS3dSplitter.manager.treeEditor.removeNodeInSilence(unitInfo.id);

			//结束添加到undo list
			thatS3dSplitter.manager.viewer.endAddToUndoList(s3dOperateType.splitLocal, unitIds, {sourceNodeId: unitInfo.id});
		}
	}

	this.getChildInfo = function (unitObject3D, unitInfo, parentPath) {
		let outerObject3D = unitObject3D.children[0];
		let innerObject3D = outerObject3D.children[0];
		if(parentPath == null || parentPath.length === 0){
			parentPath = "";
		}

		let scaleX = unitInfo.parameters["X缩放"].value;
		let scaleY = unitInfo.parameters["Y缩放"].value;
		let scaleZ = unitInfo.parameters["Z缩放"].value;

		let children = innerObject3D.children;
		let allInfoMap = {};
		for (let i = 0; i < children.length; i++) {
			let child = children[i];
			let path = parentPath + "###" + i + "_" + child.name;

			let clonedChild = child.clone();
			clonedChild.position.set(0, 0, 0);
			clonedChild.rotation.set(0, 0, 0);
			let innerBox = new THREE.Box3().setFromObject(clonedChild, true);
			let innerCenter = {
				x: (innerBox.min.x + innerBox.max.x) / 2,
				y: (innerBox.min.y + innerBox.max.y) / 2,
				z: (innerBox.min.z + innerBox.max.z) / 2
			};

			let vec = new THREE.Vector3(innerCenter.x, innerCenter.y, innerCenter.z);
			vec.applyEuler(child.rotation);
			let innerVec = new THREE.Vector3(
				vec.x + child.position.x + innerObject3D.position.x,
				vec.y + child.position.y + innerObject3D.position.y,
				vec.z + child.position.z + innerObject3D.position.z
			);
			innerVec.applyEuler(unitObject3D.rotation);

			let childPosition = {
				x: unitObject3D.position.x + innerVec.x * scaleX,
				y: unitObject3D.position.y + innerVec.y * scaleY,
				z: unitObject3D.position.z + innerVec.z * scaleZ,
			};

			let outerEuler = new THREE.Euler();
			outerEuler.x = unitObject3D.rotation.x;
			outerEuler.y = unitObject3D.rotation.y;
			outerEuler.z = unitObject3D.rotation.z;
			let innerEuler = new THREE.Euler();
			innerEuler.x = child.rotation.x;
			innerEuler.y = child.rotation.y;
			innerEuler.z = child.rotation.z;
			let outerQuaternion = new THREE.Quaternion();
			outerQuaternion.setFromEuler(outerEuler)
			let innerQuaternion = new THREE.Quaternion();
			innerQuaternion.setFromEuler(innerEuler)

			let childRotation = new THREE.Euler();
			childRotation.setFromQuaternion(outerQuaternion.multiply(innerQuaternion));
			//childRotation.setFromQuaternion(outerQuaternion);

			allInfoMap[path] = {
				name: path,
				position: [childPosition.x, childPosition.y, childPosition.z],
				rotation: [childRotation.x, childRotation.y, childRotation.z]
			};
		}
		return {
			count: children.length,
			infoMap: allInfoMap
		};
	}
}
export default S3dSplitter