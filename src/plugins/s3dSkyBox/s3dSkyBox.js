import * as THREE from "three";
import {FBXLoader} from "fbxLoader";
import {RGBELoader} from "rgbeLoader";

//S3dSkyBox 天空盒
let S3dSkyBox = function () {
	//当前对象
	const thatS3dSkyBox = this;

	//containerId
	this.containerId = null;

	//s3d manager
	this.manager = null;

	this.rootUrl = null;

	this.skyList = null;

	//初始化
	this.init = function (p) {
		thatS3dSkyBox.containerId = p.containerId;
		thatS3dSkyBox.manager = p.manager;
		thatS3dSkyBox.rootUrl = p.config.rootUrl;
		thatS3dSkyBox.skyList = p.config.skyList;
		thatS3dSkyBox.initSky(thatS3dSkyBox.manager.s3dObject.scene.skyBoxName)
	}

	this.setSkyInfo = function (name) {
		thatS3dSkyBox.manager.s3dObject.scene.skyBoxName = name;
		thatS3dSkyBox.initSky(name);
	}

	this.initSky = function (name) {
		thatS3dSkyBox.clearSky();
		if (thatS3dSkyBox.manager.viewer.camera instanceof THREE.PerspectiveCamera) {
			let skyInfo = thatS3dSkyBox.skyList.skyMap[name];
			switch (skyInfo.type) {
				case "None": {
					//不做处理
					break;
				}
				case "Hemisphere": {
					thatS3dSkyBox.loadHdrTexture(skyInfo);
					break;
				}
				case "Box": {
					thatS3dSkyBox.setBoxSky(skyInfo);
					break;
				}
				default: {
					//未知的天空类型
					throw "未知的天空类型"
				}
			}
		}
	}

	//清除天空
	this.clearSky = function () {
		let scene = thatS3dSkyBox.manager.viewer.scene;

		thatS3dSkyBox.manager.viewer.hemisphereLight.intensity = 1;

		//清除box
		scene.background = null;
		scene.environment = null;

		//清除半球
		let hemisphereObj = thatS3dSkyBox.getHemisphereObj();
		if (hemisphereObj != null) {
			scene.remove(hemisphereObj);
		}
	}

	this.getHemisphereObj = function () {
		let scene = thatS3dSkyBox.manager.viewer.scene;
		let hemisphereObj = null;
		for (let i = 0; i < scene.children.length; i++) {
			let obj = scene.children[i];
			if (obj.isSky) {
				hemisphereObj = obj;
			}
		}
		return hemisphereObj;
	}

	this.refreshLights = function (skyInfo){
		let viewer = thatS3dSkyBox.manager.viewer;
		viewer.hemisphereLight.intensity = skyInfo.lightMap.hemisphere;
		for(let i = 0; i < viewer.directionalLights.length; i++){
			viewer.directionalLights[i].intensity = skyInfo.lightMap.directions[i];
		}
	}

	this.setHemisphereSky = function (skyInfo) {
		let path = thatS3dSkyBox.rootUrl + skyInfo.name + "/" + skyInfo.name + ".fbx";
		let fbxLoader = new FBXLoader();
		fbxLoader.load(path, function (hemisphereObj) {
			let scene = thatS3dSkyBox.manager.viewer.scene;
			let hdrTexture = scene.environment;
			hemisphereObj.scale.set(skyInfo.scale, skyInfo.scale, skyInfo.scale);
			hemisphereObj.rotation.set(0, skyInfo.rotate * Math.PI / 180, 0);
			hemisphereObj.position.set(hemisphereObj.position.x, hemisphereObj.position.y + skyInfo.move, hemisphereObj.position.z);
			hemisphereObj.isSky = true;
			hemisphereObj.castShadow = true;
			hemisphereObj.receiveShadow = true;
			hemisphereObj.children[0].material = new THREE.MeshPhongMaterial({
				color: 0xFFFFFF,
				map: hdrTexture,
				//emissive: 0xffffff,
				//emissiveIntensity: 0.2
			});
			scene.add(hemisphereObj);
		});
	}

	//半球
	this.loadHdrTexture = function (skyInfo) {
		let path = thatS3dSkyBox.rootUrl + skyInfo.name + "/" + skyInfo.hdrName;
		let loader = new RGBELoader();
		loader.load(path, function (hdrTexture) {
			hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
			//hdrTexture.intensity = skyInfo.intensity;
			thatS3dSkyBox.refreshLights(skyInfo);
			thatS3dSkyBox.manager.viewer.scene.environment = hdrTexture;
			thatS3dSkyBox.setHemisphereSky(skyInfo);
			thatS3dSkyBox.refreshAllUnitObject3DEnvMap(hdrTexture);
		});
	}

	//为所有构件更新环境贴图
	this.refreshAllUnitObject3DEnvMap = function (hdrTexture) {
		let allObject3DMap = thatS3dSkyBox.manager.viewer.allObject3DMap;
		let id2MaterialMap = {};
		for (let unitId in allObject3DMap) {
			let object3D = allObject3DMap[unitId];
			thatS3dSkyBox.refreshObject3DMaterialEnvMap(object3D, id2MaterialMap, hdrTexture);
		}
	}

	this.refreshMaterialEnvMap = function (material, id2MaterialMap, hdrTexture){
		if(material != null && id2MaterialMap[material.id] !== true){
			if(material.envMapIntensity != null && material.envMapIntensity > 0) {
				material.envMap = hdrTexture;
			}
			id2MaterialMap[material.id] = true;
		}
	}

	this.refreshObject3DMaterialEnvMap = function (object3D, id2MaterialMap, hdrTexture) {
		if (object3D.children.length === 0) {
			let materialObj = object3D.material;
			if(materialObj != null) {
				if (materialObj.length != null) {
					for (let i = 0; i < materialObj.length; i++) {
						let m = materialObj[i];
						thatS3dSkyBox.refreshMaterialEnvMap(m, id2MaterialMap, hdrTexture);
						if (object3D.originalMaterial != null) {
							let om = object3D.originalMaterial[i];
							thatS3dSkyBox.refreshMaterialEnvMap(om, id2MaterialMap, hdrTexture);
						}
					}
				} else {
					thatS3dSkyBox.refreshMaterialEnvMap(materialObj, id2MaterialMap, hdrTexture);
					if (object3D.originalMaterial != null) {
						thatS3dSkyBox.refreshMaterialEnvMap(object3D.originalMaterial, id2MaterialMap, hdrTexture);
					}
				}
			}
		} else {
			let childObjs = object3D.children;
			for (let i = 0; i < childObjs.length; i++) {
				let childObj = childObjs[i];
				thatS3dSkyBox.refreshObject3DMaterialEnvMap(childObj, id2MaterialMap, hdrTexture);
			}
		}
	}

	//方盒子
	this.setBoxSky = function (skyInfo){
		let path = thatS3dSkyBox.rootUrl + skyInfo.name + "/";
		let format = '.jpg';
		let urls = [
			path + 'right' + format,
			path + 'left' + format,
			path + 'up' + format,
			path + 'down' + format,
			path + 'front' + format,
			path + 'back' + format
		];
		thatS3dSkyBox.manager.viewer.scene.background = new THREE.CubeTextureLoader().load(urls);

		let sphereTexture = new THREE.CubeTextureLoader();
		thatS3dSkyBox.manager.viewer.scene.environment = sphereTexture.load(urls);
	}

}
export default S3dSkyBox