import * as THREE from "three";
import * as zip from "zipjs";
import {GLTFLoader} from "gltfLoader";
import {FBXLoader} from "fbxLoader";
import {mergeVertices} from "bufferGeometryUtils";
import {cmnPcr, msgBox, s3dResourceType} from "../../commonjs/common/static.js"

//S3dWeb Resource加载器
let S3dResourceLoader = function (){
	
	//当前对象
	const thatS3dResourceLoader = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	//gltfLoader
	this.gltfLoader = new GLTFLoader();

	//fbxLoader
	this.fbxLoader = new FBXLoader();

	//cache
	this.resourceObject3Ds = {};
	
	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dResourceLoader.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dResourceLoader.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dResourceLoader.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	}

	//初始化
	this.init = function(p){
		thatS3dResourceLoader.containerId = p.containerId;
		thatS3dResourceLoader.manager = p.manager;
		THREE.Cache.enabled = true;

		if(p.config.afterLoadResourceFile != null){
			thatS3dResourceLoader.addEventFunction("afterLoadResourceFile", p.config.afterLoadResourceFile);
		}
	}

    //加载读取s3d文件
	this.loadServerResource = function(resourceName, resourceType, afterLoadResource){
		switch(resourceType){
			case s3dResourceType.gltf:{
				thatS3dResourceLoader.loadServerGltfZip(resourceName, afterLoadResource);
				break;
			}
			case s3dResourceType.fbx:{
				thatS3dResourceLoader.loadServerFbxZip(resourceName, afterLoadResource);
				break;
			}
			default:{
				msgBox.alert({info: "不支持的ResourceType. ResourceType=" + resourceType});
				break;
			}
		}
	}
	this.loadLocalResource = function(resourceDirectory, resourceFileName, resourceType, processType, afterLoadResource){
		switch(resourceType){
			case s3dResourceType.gltf:{
				thatS3dResourceLoader.loadLocalGltf(resourceDirectory, resourceFileName, processType, afterLoadResource);
				break;
			}
			case s3dResourceType.fbx:{
				thatS3dResourceLoader.loadLocalFbx(resourceDirectory, resourceFileName, processType, afterLoadResource);
				break;
			}
			default:{
				msgBox.alert({info: "不支持的ResourceType. ResourceType=" + resourceType});
				break;
			}
		}
	}

	//加载读取gltf
	this.loadServerGltfZip = async function(resourceName, afterLoadResource) {
		let gltfZipFilePath = thatS3dResourceLoader.getGltfZipFileUrl(resourceName);
		fetch(gltfZipFilePath)
			.then(response => {
				// 检查网络请求是否成功
				if (!response.ok) {
					let error = "Network response was not ok: " + response.statusText;
					thatS3dResourceLoader.afterGotErrorResource(error, resourceName, s3dResourceType.fbx, afterLoadResource);
				} else {
					return response.blob();
				}
			})
			.then(async data => {
				zip.configure({chunkSize: 128, useWebWorkers: true});
				let zipReader = new zip.ZipReader(new zip.BlobReader(data));
				let entities = await zipReader.getEntries();

				//逐个解析entity
				let gltfEntry = null;
				let gltfName = "";
				let binEntry = null;
				let binName = "";
				let assistEntry = null;
				let assistName = "";
				for (let i = 0; i < entities.length; i++) {
					let entry = entities[i];
					let entryName = entry.filename;
					let entryLowerName = entryName.toLowerCase();
					if (entryLowerName.endWith(".gltf")) {
						gltfEntry = entry;
						gltfName = entryName;
					} else if (entryLowerName.endWith(".bin")) {
						binEntry = entry;
						binName = entryName;
					} else if (entryLowerName.endWith(".assist")) {
						assistEntry = entry;
						assistName = entryName;
					}
				}

				//gltf file
				if (gltfEntry != null) {
					let gltfFileUrl = thatS3dResourceLoader.getGltfFileUrl(gltfName);
					let gltfTextWriter = new zip.TextWriter(zip.getMimeType(gltfName));
					let gltfText = await gltfEntry.getData(gltfTextWriter);
					THREE.Cache.add(gltfFileUrl, gltfText);
				}

				//bin file
				if (binEntry != null) {
					let binFileUrl = thatS3dResourceLoader.getBinFileUrl(binName);
					let binBlobWriter = new zip.BlobWriter(zip.getMimeType(binName));
					let blob = await binEntry.getData(binBlobWriter);
					let binArrayBuffer = await blob.arrayBuffer();
					THREE.Cache.add(binFileUrl, binArrayBuffer);
				}

				//assist file
				if (assistEntry != null) {
					let assistFileUrl = thatS3dResourceLoader.getAssistFileUrl(assistName);
					let assistTextWriter = new zip.TextWriter(zip.getMimeType(gltfName));
					let assistText = await assistEntry.getData(assistTextWriter);
					THREE.Cache.add(assistFileUrl, assistText);
				}

				await thatS3dResourceLoader.afterUnzipGltf(resourceName, gltfName, binName, assistName, afterLoadResource);
			})
			.catch(error => {
				thatS3dResourceLoader.afterGotErrorResource(error, resourceName, s3dResourceType.fbx, afterLoadResource);
			});
	}

	//加载读取fbx
	this.loadServerFbxZip = function(resourceName, afterLoadResource) {
		let fbxZipFilePath = thatS3dResourceLoader.getFbxZipFileUrl(resourceName);
		fetch(fbxZipFilePath)
			.then(response => {
				// 检查网络请求是否成功
				if (!response.ok) {
					let error = "Network response was not ok: " + response.statusText;
					thatS3dResourceLoader.afterGotErrorResource(error, resourceName, s3dResourceType.fbx, afterLoadResource);
				} else {
					return response.blob();
				}
			})
			.then(async data => {
				zip.configure({chunkSize: 128, useWebWorkers: true});
				let zipReader = new zip.ZipReader(new zip.BlobReader(data));
				let entities = await zipReader.getEntries();

				//逐个解析entity
				let fbxEntry = null;
				let fbxName = "";
				let assistEntry = null;
				let assistName = "";
				for (let i = 0; i < entities.length; i++) {
					let entry = entities[i];
					let entryName = entry.filename;
					let entryLowerName = entryName.toLowerCase();
					if (entryLowerName.endWith(".fbx")) {
						fbxEntry = entry;
						fbxName = entryName;
					} else if (entryLowerName.endWith(".assist")) {
						assistEntry = entry;
						assistName = entryName;
					}
				}

				//fbx
				const fbxFileUrl = thatS3dResourceLoader.getFbxFileUrl(resourceName, fbxName);
				fetch(fbxFileUrl)
					.then(response => {
						// 检查网络请求是否成功
						if (!response.ok) {
							let error = "Network response was not ok: " + response.statusText;
							thatS3dResourceLoader.afterGotErrorResource(error, resourceName, s3dResourceType.fbx, afterLoadResource);
						} else {
							return response.arrayBuffer();
						}
					})
					.then(data => {
						THREE.Cache.add(fbxFileUrl, data);
						thatS3dResourceLoader.afterUnzipFbx(resourceName, fbxName, assistName, afterLoadResource);
					})
					.catch(error => {
						thatS3dResourceLoader.afterGotErrorResource(error, resourceName, s3dResourceType.fbx, afterLoadResource);
					});


				//assist file
				if (assistEntry != null) {
					let assistFileUrl = thatS3dResourceLoader.getAssistFileUrl(assistName);
					let assistTextWriter = new zip.TextWriter(zip.getMimeType(gltfName));
					let assistText = await assistEntry.getData(assistTextWriter);
					THREE.Cache.add(assistFileUrl, assistText);
					thatS3dResourceLoader.afterUnzipFbx(resourceName, fbxName, assistName, afterLoadResource);
				}
			})
			.catch(error => {
				thatS3dResourceLoader.afterGotErrorResource(error, resourceName, s3dResourceType.fbx, afterLoadResource);
			});
	}

	this.afterGotErrorResource = function (er, resourceName, resourceType, afterLoadResource){
		let message = resourceName + "加载错误. " + er;
		msgBox.alert({info: message});
		console.log(message);

		//添加一个box，用于显示错误的模型
		let geoText = "OFF\n8 12 0\n-0.5 0.5 -0.5\n0.5 0.5 -0.5\n0.5 0.5 0.5\n-0.5 0.5 0.5\n-0.5 -0.5 -0.5\n0.5 -0.5 -0.5\n0.5 -0.5 0.5\n-0.5 -0.5 0.5\n3 0 2 1\n3 0 3 2\n3 0 5 4\n3 0 1 5\n3 0 4 7\n3 0 7 3\n3 6 3 7\n3 6 2 3\n3 6 7 4\n3 6 4 5\n3 6 1 2\n3 6 5 1";

		//加载一个空壳子
		let boxMeshInfo = thatS3dResourceLoader.manager.serverObjectCreator.getMeshInfoFromOff(geoText);
		let object3D = thatS3dResourceLoader.manager.serverObjectCreator.getMeshFromText(boxMeshInfo);
		thatS3dResourceLoader.manager.serverObjectCreator.moveToCenter(object3D);
		let resourceKey = resourceName + "_" + resourceType;
		thatS3dResourceLoader.manager.object3DCache.addResourceObject3D(resourceKey, object3D, null);
		afterLoadResource(resourceKey);
	}

	//加载读取fbx
	this.loadLocalFbx = async function(directory, fileName, processType, afterLoadResource){
		let resourceFileUrl = thatS3dResourceLoader.getLocalFbxFileUrl(directory, fileName);
		const resourceName = directory + "\\" + fileName;
		fetch(resourceFileUrl)
			.then(response => {
				// 检查网络请求是否成功
				if (!response.ok) {
					let error = "Network response was not ok: " + response.statusText;
					thatS3dResourceLoader.afterGotErrorResource(error, resourceName, s3dResourceType.fbx, afterLoadResource);
				} else {
					return response.arrayBuffer();
				}
			})
			.then(async data => {
				let resourceCacheKey = thatS3dResourceLoader.manager.object3DCache.getResourceObject3DKey(resourceName, s3dResourceType.fbx);
				let imgSourceDirUrl = thatS3dResourceLoader.getLocalFbxImgSourceDirUrl(directory);
				let fbxObject3D = thatS3dResourceLoader.fbxLoader.parse(data, imgSourceDirUrl);
				switch(processType) {
					case "smooth": {
						thatS3dResourceLoader.smoothGeometry(fbxObject3D);
						break;
					}
					default:{
						break;
					}
				}
				let object3D = new THREE.Object3D();
				object3D.add(fbxObject3D);
				let materialInfo = thatS3dResourceLoader.getObject3DMaterialInfo(object3D);
				thatS3dResourceLoader.manager.object3DCache.addResourceObject3D(resourceCacheKey, object3D,	null, materialInfo);
				afterLoadResource(resourceCacheKey);
			})
			.catch(error => {
				thatS3dResourceLoader.afterGotErrorResource(error, resourceName, s3dResourceType.fbx, afterLoadResource);
			});
	}

	//平滑几何
	this.smoothGeometry = function (object3D){
		let hasChild = object3D.children.length > 0;
		if(hasChild){
			for(let i = 0; i < object3D.children.length; i++){
				let childObject3D = object3D.children[i];
				thatS3dResourceLoader.smoothGeometry(childObject3D);
			}
		}
		else {
			let geometry = object3D.geometry;
			geometry.deleteAttribute("normal");
			geometry = mergeVertices(geometry);
			geometry.computeVertexNormals();
			object3D.geometry = geometry;
		}
	}

	//加载读取gltf
	this.loadLocalGltf = async function(directory, fileName, processType, afterLoadResource){
		let resourceFileUrl = thatS3dResourceLoader.getLocalGltfFileUrl(directory, fileName);
		const resourceName = directory + "\\" + fileName;
		fetch(resourceFileUrl)
			.then(response => {
				// 检查网络请求是否成功
				if (!response.ok) {
					let error = "Network response was not ok: " + response.statusText;
					thatS3dResourceLoader.afterGotErrorResource(error, resourceName, s3dResourceType.gltf, afterLoadResource);
				} else {
					return response.arrayBuffer();
				}
			})
			.then(async data => {
				let resourceCacheKey = thatS3dResourceLoader.manager.object3DCache.getResourceObject3DKey(resourceName, s3dResourceType.gltf);
				let binSourceDirUrl = thatS3dResourceLoader.getLocalGltfSourceDirUrl(directory);
				let fbxObject3D = thatS3dResourceLoader.gltfLoader.parse(data, binSourceDirUrl, function (gltf){
					switch(processType) {
						case "smooth": {
							thatS3dResourceLoader.smoothGeometry(gltf.scene);
							break;
						}
						default:{
							break;
						}
					}
					let gltfObject3Ds = gltf.scene.children;
					let object3D = new THREE.Object3D();
					for(let i = 0; i < gltfObject3Ds.length; i++){
						let gltfObject3D = gltfObject3Ds[i];
						object3D.add(gltfObject3D);
					}
					let materialInfo = thatS3dResourceLoader.getObject3DMaterialInfo(object3D);
					thatS3dResourceLoader.manager.object3DCache.addResourceObject3D(resourceCacheKey, object3D, null, materialInfo);
					afterLoadResource(resourceCacheKey);
				}, function (error){
					thatS3dResourceLoader.afterGotErrorResource(error, resourceName, s3dResourceType.gltf, afterLoadResource);
				});
			})
			.catch(error => {
				thatS3dResourceLoader.afterGotErrorResource(error, resourceName, s3dResourceType.gltf, afterLoadResource);
			});
	}


	this.getObject3DMaterialInfo = function (object3D){
		let materialHash = {};
		let pathHash = {};
		thatS3dResourceLoader.getObject3DMaterilInfoHash(object3D, "", materialHash, pathHash);
		return {
			materialHash: materialHash,
			pathHash: pathHash
		};
	}

	//获取使用的material
	this.getObject3DMaterilInfoHash = function(object3D, parentPath, materialHash, pathHash){
		if(!object3D.isResourceBoxLine) {
			let materialObj = object3D.originalMaterial != null ? object3D.originalMaterial : object3D.material;
			if (materialObj != null) {
				pathHash[parentPath] = [];
				if (materialObj.length != null) {
					for (let i = 0; i < materialObj.length; i++) {
						let material = materialObj[i];
						pathHash[parentPath].push(material.name);
						if (materialHash[material.name] == null) {
							materialHash[material.name] = {
								id: material.id,
								name: material.name,
								color: material.color,
								material: material
							};
						}
					}
				}
				else {
					pathHash[parentPath].push(materialObj.name);
					if (materialHash[materialObj.name] == null) {
						materialHash[materialObj.name] = {
							id: materialObj.id,
							name: materialObj.name,
							color: materialObj.color,
							material: materialObj
						};
					}
				}
			}
			else {
				let childObjs = object3D.children;
				for (let i = 0; i < childObjs.length; i++) {
					let childObj = childObjs[i];
					let path = parentPath + "###" + i + "_" + childObj.name;
					thatS3dResourceLoader.getObject3DMaterilInfoHash(childObj, path, materialHash, pathHash);
				}
			}
		}
	}

	this.afterUnzipFbx = function(resourceName, fbxFileName, assistName, afterLoadResource){
		let allFileLoaded = true;
		let fbxFileUrl = thatS3dResourceLoader.getFbxFileUrl(resourceName, fbxFileName);
		let fbxArray = THREE.Cache.get(fbxFileUrl);
		if(fbxArray == null){
			allFileLoaded = false;
		}

		let assistInfo = null;
		if(assistName != null && assistName.length > 0){
			let assistFileUrl = thatS3dResourceLoader.getAssistFileUrl(assistName);
			let assistText = THREE.Cache.get(assistFileUrl);
			if(assistText == null){
				allFileLoaded = false;
			}
			else {
				assistInfo = cmnPcr.strToJson(assistText);
			}
		}

		if(allFileLoaded) {
			let resourceCacheKey = thatS3dResourceLoader.manager.object3DCache.getResourceObject3DKey(resourceName, s3dResourceType.fbx);
			let imgSourceDirUrl = thatS3dResourceLoader.getFbxImgSourceDirUrl(resourceName);
			let fbxObject3D = thatS3dResourceLoader.fbxLoader.parse(fbxArray, imgSourceDirUrl);
			let object3D = new THREE.Object3D();
			object3D.add(fbxObject3D);
			thatS3dResourceLoader.manager.object3DCache.addResourceObject3D(resourceCacheKey, object3D, assistInfo);
			afterLoadResource(resourceName + "_" + s3dResourceType.fbx);
		}
	}

	this.afterUnzipGltf = async function(resourceName, gltfFileName, binFileName, assistName, afterLoadResource){
		let allFileLoaded = true;
		let gltfFileUrl = thatS3dResourceLoader.getGltfFileUrl(gltfFileName);
		let gltfText = THREE.Cache.get(gltfFileUrl);
		if(gltfText == null){
			allFileLoaded = false;
		}

		if(binFileName != null && binFileName.length > 0) {
			let binFileUrl = thatS3dResourceLoader.getBinFileUrl(binFileName);
			let binArray = THREE.Cache.get(binFileUrl);
			if (binArray == null) {
				allFileLoaded = false;
			}
		}

		let assistInfo = null;
		if(assistName != null && assistName.length > 0){
			let assistFileUrl = thatS3dResourceLoader.getAssistFileUrl(assistName);
			let assistText = THREE.Cache.get(assistFileUrl);
			if(assistText == null){
				allFileLoaded = false;
			}
			else {
				assistInfo = cmnPcr.strToJson(assistText);
			}
		}

		if(allFileLoaded) {
			let resourceCacheKey = thatS3dResourceLoader.manager.object3DCache.getResourceObject3DKey(resourceName, s3dResourceType.gltf);
			let gltf = await thatS3dResourceLoader.gltfLoader.parseAsync(gltfText, thatS3dResourceLoader.getBinSourceDirUrl());

			let gltfObject3Ds = gltf.scene.children;
			let object3D = new THREE.Object3D();
			for(let i = 0; i < gltfObject3Ds.length; i++){
				let gltfObject3D = gltfObject3Ds[i];
				object3D.add(gltfObject3D);
			}
			thatS3dResourceLoader.manager.object3DCache.addResourceObject3D(resourceCacheKey, object3D, assistInfo);
			afterLoadResource(resourceName + "_" + s3dResourceType.gltf);
		}
	}

	this.getGltfFileUrl = function(gltfName){
		return thatS3dResourceLoader.manager.service.url + "resource/getGltf?code=" + gltfName;
	}

	this.getGltfZipFileUrl = function(name){
		return thatS3dResourceLoader.manager.service.url + "resource/getGltfZip?code=" + encodeURIComponent(name);
	}

	this.getBinFileUrl = function(binName){
		return binName === null || binName === undefined || binName.length === 0 ? "" : (thatS3dResourceLoader.manager.service.url + "resource/getBin?code=" + binName);
	}

	this.getAssistFileUrl = function(assistName){
		return assistName === null || assistName === undefined || assistName.length === 0 ? "" : (thatS3dResourceLoader.manager.service.url + "resource/getAssist?code=" + assistName);
	}

	this.getBinSourceDirUrl = function(){
		return thatS3dResourceLoader.manager.service.url + "resource/getBin?code=";
	}

	this.getFbxZipFileUrl = function(name){
		return thatS3dResourceLoader.manager.service.url + "/resource/getFbxZip?code=" + encodeURIComponent(name);
	}

	this.getFbxFileUrl = function(resFbxName, fbxName){
		return thatS3dResourceLoader.manager.service.url + "/resource/getFbx?resFbxName=" + encodeURIComponent(resFbxName) + "&fbxName=" + encodeURIComponent(fbxName);
	}

	this.getFbxImgSourceDirUrl = function(resFbxName){
		return thatS3dResourceLoader.manager.service.url + "/resource/getFbxImg?resFbxName=" + resFbxName + "&imgName=";
	}

	this.getLocalFbxFileUrl = function(directory, fileName){
		return thatS3dResourceLoader.manager.componentLibrary.rootPath + directory + "\\" + fileName + "?t=" + thatS3dResourceLoader.manager.timestamp;
	}

	this.getLocalGltfSourceDirUrl = function(directory){
		return thatS3dResourceLoader.manager.componentLibrary.rootPath + directory + "\\";
	}

	this.getLocalGltfFileUrl = function(directory, fileName){
		return thatS3dResourceLoader.manager.componentLibrary.rootPath + directory + "\\" + fileName + "?t=" + thatS3dResourceLoader.manager.timestamp;
	}
	this.getLocalFbxImgSourceDirUrl = function (directory){
		return thatS3dResourceLoader.manager.componentLibrary.rootPath + directory + "\\";
	}
}
export default S3dResourceLoader