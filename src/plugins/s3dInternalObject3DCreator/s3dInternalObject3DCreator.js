import {GLTFLoader} from "gltfLoader";

//S3dWeb 图元对象Creator
let S3dInternalObject3DCreator = function (){
	//当前对象
	const thatS3dInternalObject3DCreator = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	//缓存
	this.object3DCache = {};

	this.gltfLoader = new GLTFLoader();

	//初始化
	this.init = function(p){
		thatS3dInternalObject3DCreator.containerId = p.containerId;
		thatS3dInternalObject3DCreator.manager = p.manager;    
	}

	this.initObject3DCache = function (gltfKey, gltfText, afterInitCacheObject3D){
		thatS3dInternalObject3DCreator.gltfLoader.parse(gltfText, null, function (result){
			let object3D = result.scene.children[0];
			thatS3dInternalObject3DCreator.manager.object3DCache.addResourceObject3D(gltfKey, object3D);
			afterInitCacheObject3D(gltfKey);
		});
	}

	this.createUnitObject3D = function(cacheKey, unitJson) {
		let object3D = thatS3dInternalObject3DCreator.manager.object3DCache.cloneResourceObject3D(cacheKey);
		object3D.userData.unitInfo = unitJson;
		object3D.rotation.set(unitJson.rotation[0], unitJson.rotation[1], unitJson.rotation[2])
		object3D.position.set(unitJson.position[0], unitJson.position[1], unitJson.position[2])
		return object3D;
	}
}
export default S3dInternalObject3DCreator