import * as THREE from "three";
import {cmnPcr, msgBox} from "../../commonjs/common/static.js"

//S3dWeb 服务器图元对象Creator
let S3dServerObjectCreator = function (){
	//当前对象
	let thatS3dServerObjectCreator = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	//正在构造的信息
	this.creatingInfo = {
		countInfo: null,
		unitJsons: null,
		cacheKey2InfoMap: {},
		resource2CacheKeysMap: {},
		afterCreateObject3D: null
	};

	//组件属性设置map
	this.componentKey2JsonMap = null;

	//材质渲染面
	this.materialSide = THREE.FrontSide;

	//resource包围盒的外框
	this.resourceBoxEdgeMaterial = new THREE.LineBasicMaterial({
		color: 0x888888,
		linewidth: 1,
		opacity: 0.0,
		transparent: true,
		visible: false //默认显示外框不显示
	});
	 
	//初始化
	this.init = function(p){
		thatS3dServerObjectCreator.containerId = p.containerId;
		thatS3dServerObjectCreator.manager = p.manager;

		thatS3dServerObjectCreator.componentKey2JsonMap = {};
		thatS3dServerObjectCreator.materialMap = {};
		thatS3dServerObjectCreator.lineMaterialMap = {};
	}

	this.addComponentMap = function(componentCode, versionNum, componentJson){		
		let key = componentCode + "_" + versionNum;
		thatS3dServerObjectCreator.componentKey2JsonMap[key] = componentJson;
	}

	this.getComponentInfo = function(componentCode, versionNum){
		let key = componentCode + "_" + versionNum;
		return thatS3dServerObjectCreator.componentKey2JsonMap[key];
	}

	this.checkHasComponentInfo = function(componentCode, versionNum){		
		let key = componentCode + "_" + versionNum;
		return thatS3dServerObjectCreator.componentKey2JsonMap[key] != null;
	}

	this.getComponentJsons = function(pArray, afterGetComponentJsons) {
		let componentCodeAndVersionNumArray = [];
		let componentInfoKeys = {};
		for(let i = 0; i < pArray.length; i++){
			let p = pArray[i];
			let key = p.code + "_" + p.versionNum;
			if(!componentInfoKeys[key]){
				componentInfoKeys[key] = true;
				componentCodeAndVersionNumArray.push({
					code: p.code,
					versionNum: p.versionNum
				});
			}
		}
		let requestParam = {
			componentCodeAndVersionNumArray: componentCodeAndVersionNumArray
		};
		thatS3dServerObjectCreator.manager.request({
			requestParam: requestParam,
			funcName: "getComponentFilesByCodes",
			successFunc: function (obj) {
				let componentInfos = obj.result.componentInfos;
				let ps = [];
				for (let i = 0; i < componentInfos.length; i++) {
					let componentInfo = componentInfos[i];
					let componentJson = cmnPcr.strToJson(decodeURIComponent(componentInfo.content));
					thatS3dServerObjectCreator.addComponentMap(componentJson.code, componentJson.versionNum, componentJson);
					ps.push({
						id: componentJson.id,
						code: componentJson.code,
						versionNum: componentJson.versionNum,
						name: componentJson.name,
						json: componentJson,
						isServer: true
					});
				}
				afterGetComponentJsons(ps);
			},
			failFunc: function (obj) {
				msgBox.error({title: "提示", info: obj.message});
			}
		});
	}

	this.getParameterString = function(parameters, componentInfo){
		let sortedParameters = [];
		let parameterHash = {};
		let paramCount = 0;
		for(let paramName in parameters){
			let parameter = parameters[paramName];
			let comParameter = componentInfo.parameters[paramName];
			if(comParameter != null && comParameter.isGeo){
				//增加参数值为json的处理 modified by ls 202201
				let parameterValue = parameter.value;
				if(parameterValue != null && typeof parameterValue != "string"){
					parameterValue = cmnPcr.jsonToStr(parameterValue);
				}
				parameterHash[paramName] = {
					name: paramName,
					value:  parameterValue
				};
				paramCount++;
			}
		}
		let count = 0;
		while(count < paramCount){
			let tempName = "";
			for(let name in parameterHash){
				if(name > tempName){
					tempName = name;
				}
			}
	        sortedParameters.push(parameterHash[tempName]);
	        delete parameterHash[tempName];
	        count++;
		}
		let parameterStr = "";
		for(let i = 0; i < sortedParameters.length; i++){
			let parameter = sortedParameters[i];
			parameterStr += (parameter.name + ":" + parameter.value + "; ");
		}
		return parameterStr;
	}

	this.getRequestParameters = function (unitJson, componentInfo){
		if(!componentInfo) {
			componentInfo = thatS3dServerObjectCreator.getComponentInfo(unitJson.code, unitJson.versionNum);
		}
		let parameters = {};
		for(let paramName in componentInfo.parameters){
			let comParam = componentInfo.parameters[paramName];
			let unitParam = unitJson.parameters[paramName];
			parameters[paramName] = {
				name: paramName,
				value: unitParam == null ? null : unitParam.value,
				isGeo: comParam.isGeo
			};
		}
		return parameters;
	}

	this.getUnitCacheKey = function (unitJson, detailLevel, viewLevel, componentInfo){
		let parameters = thatS3dServerObjectCreator.getRequestParameters(unitJson, componentInfo);
		return thatS3dServerObjectCreator.getCacheKey(unitJson.code, unitJson.versionNum, parameters, unitJson.useWorldPosition, detailLevel, viewLevel);
	}

	this.getCacheKey = function(componentCode, versionNum, parameters, useWorldPosition, detailLevel, viewLevel){
		return thatS3dServerObjectCreator.manager.object3DCache.getComponentObject3DKey(componentCode, versionNum, parameters, useWorldPosition, detailLevel, viewLevel);
	}

	this.checkHasCache = function(cacheKey){
		return thatS3dServerObjectCreator.manager.object3DCache.hasRefComponentObject3D(cacheKey);
	}

	this.getCache = function(cacheKey){
		return thatS3dServerObjectCreator.manager.object3DCache.getRefComponentObject3D(cacheKey);
	}

	this.addCache = function(p){
		thatS3dServerObjectCreator.manager.object3DCache.addRefComponentObject3D(p.cacheKey, p.object3D, p.geoJson, p.sameUnitId, p.unitSetting, p.box, p.tagObject3D);
	}

	this.createObject3Ds = function(unitJsons, afterCreateObject3D, countInfo){
		thatS3dServerObjectCreator.manager.messageBox.show({message: "准备调用服务器端造型服务"});
		//需要从服务器端获取component信息
		let needServerGetComponentInfos = [];
		let componentInfoKeys = {};
		for(let i = 0; i < unitJsons.length; i++){
			let unitJson = unitJsons[i];
			let componentInfo = thatS3dServerObjectCreator.getComponentInfo(unitJson.code, unitJson.versionNum);
			if(componentInfo == null && !componentInfoKeys[unitJson.code + "_" + unitJson.versionNum]){
				componentInfoKeys[unitJson.code + "_" + unitJson.versionNum] = true;
				needServerGetComponentInfos.push({
					code: unitJson.code,
					versionNum: unitJson.versionNum
				});
			}
		}

		//更新creatingInfo
		thatS3dServerObjectCreator.creatingInfo.countInfo = countInfo;
		thatS3dServerObjectCreator.creatingInfo.unitJsons = unitJsons;
		thatS3dServerObjectCreator.creatingInfo.cacheKey2InfoMap = {};
		thatS3dServerObjectCreator.creatingInfo.resource2CacheKeysMap = {};
		thatS3dServerObjectCreator.creatingInfo.afterCreateObject3D = afterCreateObject3D;
		if(needServerGetComponentInfos.length === 0){
			//不需要从服务器端获取componentInfo
			thatS3dServerObjectCreator.createServerObjects(unitJsons);
		}
		else{
			//需要先获取componentInfo
			thatS3dServerObjectCreator.getComponentJsons(needServerGetComponentInfos, function (){
				thatS3dServerObjectCreator.createServerObjects(thatS3dServerObjectCreator.creatingInfo.unitJsons);
			});
		}
	}

	this.createServerObjects = function(){
		let unitJsons = thatS3dServerObjectCreator.creatingInfo.unitJsons;
		let pArray = [];
		//先构造unitSetting
		let createCount = unitJsons.length;
		for(let i = 0; i < unitJsons.length; i++){
			let unitJson = unitJsons[i];
			let componentInfo = thatS3dServerObjectCreator.getComponentInfo(unitJson.code, unitJson.versionNum);
			let parameters = {};
			for(let paramName in unitJson.parameters){
				if(componentInfo.parameters[paramName]){
					parameters[paramName] = {
						value: unitJson.parameters[paramName].value,
						isGeo: componentInfo.parameters[paramName].isGeo
					};
				}
			}
			let cacheKey = thatS3dServerObjectCreator.getCacheKey(unitJson.code, unitJson.versionNum, parameters, unitJson.useWorldPosition, thatS3dServerObjectCreator.manager.viewer.detailLevel, thatS3dServerObjectCreator.manager.viewer.viewLevel);
			let hasCache = thatS3dServerObjectCreator.checkHasCache(cacheKey);
			let p = {
				code: unitJson.code,
				versionNum: unitJson.versionNum,
				parameters: unitJson.parameters,
				detailLevel: thatS3dServerObjectCreator.manager.viewer.detailLevel,
				viewLevel: thatS3dServerObjectCreator.manager.viewer.viewLevel,
				unitSetting: {
					id: unitJson.id,
					code: unitJson.code,
					versionNum: unitJson.versionNum,
					name: unitJson.name,
					position: [unitJson.position[0], unitJson.position[1], unitJson.position[2]],
					rotation: [unitJson.rotation[0], unitJson.rotation[1], unitJson.rotation[2]],
					useWorldPosition: unitJson.useWorldPosition,
					parameters: unitJson.parameters
				},
				cacheKey: cacheKey,
				otherInfo: {
					id: unitJson.id,
					name: unitJson.name,
					isOnGround: unitJson.isOnGround,
					groupNodeId: unitJson.groupNodeId,
					createIndex: i,
					createCount: createCount,
					needSelectAfterAdd: unitJson.needSelectAfterAdd,
					userData: unitJson.userData
				},
				hasCache: hasCache
			};
			pArray.push(p);
		}

		//先处理本地有缓存的
		for(let i = 0; i < pArray.length; i++){
			let p = pArray[i]; 
			if(p.hasCache){
				thatS3dServerObjectCreator.createObject3DByCloneCache(p);
			}
		}

		//再处理需要调用服务器端的
		for(let i = 0; i < pArray.length; i++){
			let p = pArray[i]; 
			if(!p.hasCache){ 
				let info = thatS3dServerObjectCreator.creatingInfo.cacheKey2InfoMap[p.cacheKey];
				if(info == null){
					info = {
						waitingList: []
					};
					thatS3dServerObjectCreator.creatingInfo.cacheKey2InfoMap[p.cacheKey] = info;
				}
				info.waitingList.push(p);
			}
		}
		for(let cacheKey in thatS3dServerObjectCreator.creatingInfo.cacheKey2InfoMap){
			let waitingList = thatS3dServerObjectCreator.creatingInfo.cacheKey2InfoMap[cacheKey].waitingList;
			let p = waitingList[0];
			thatS3dServerObjectCreator.createServerObject(p);
		}
	}

	this.createServerObject = function(p){
		let requestParam = {
			code: p.code,
			versionNum: p.versionNum,
			parameters: p.parameters,
			detailLevel: p.detailLevel,
			viewLevel: p.viewLevel,
			unitSetting: p.unitSetting,
			cacheKey: p.cacheKey,
			otherInfo: p.otherInfo,
			hasTags: true
		};
		thatS3dServerObjectCreator.manager.request({
			requestParam: requestParam,
			funcName: "createObject3D",
			successFunc: function(obj) {
				let result = obj.result;
				let geoJson = result.geoJson;
				let materialJsonMap = result.materialJson;
				let unitSetting = result.unitSetting;
				let cacheKey = result.cacheKey;
				let otherInfo = result.otherInfo;


				let cacheKeyInfo = thatS3dServerObjectCreator.creatingInfo.cacheKey2InfoMap[cacheKey];
				cacheKeyInfo.cacheKey = cacheKey;
				cacheKeyInfo.resultJson = result;

				//提前加载Resource
				let resourceJsons = result.resourceJsons;
				let resourceStatusHash;
				if(resourceJsons != null && resourceJsons.length > 0){
					resourceStatusHash = {};
					cacheKeyInfo.resourceStatusHash = resourceStatusHash;
					for(let j = 0; j < resourceJsons.length; j++){
						let resourceJson = resourceJsons[j];
						let resourceZipCode = resourceJson.name;
						let resourceType = resourceJson.resourceType;
						let resourceCacheKey = thatS3dServerObjectCreator.manager.object3DCache.getResourceObject3DKey(resourceZipCode, resourceType);
						let hasResourceCache = thatS3dServerObjectCreator.manager.object3DCache.hasResourceObject3D(resourceCacheKey);
						resourceStatusHash[resourceCacheKey] = false;
						if(!hasResourceCache){
							resourceStatusHash[resourceCacheKey] = false;

							let resourceKey = resourceZipCode + "_" + resourceType;
							if(!thatS3dServerObjectCreator.creatingInfo.resource2CacheKeysMap[resourceKey]){
								thatS3dServerObjectCreator.creatingInfo.resource2CacheKeysMap[resourceKey] = [];
							}
							thatS3dServerObjectCreator.creatingInfo.resource2CacheKeysMap[resourceKey].push(cacheKey);
							thatS3dServerObjectCreator.manager.resourceLoader.loadServerResource(resourceZipCode, resourceType, function(resourceKey){
								let cacheKeys = thatS3dServerObjectCreator.creatingInfo.resource2CacheKeysMap[resourceKey];
								for(let i = 0; i < cacheKeys.length; i++){
									let info = thatS3dServerObjectCreator.creatingInfo.cacheKey2InfoMap[cacheKey];
									info.resourceStatusHash[resourceKey] = true;
									let allResourceLoaded = true;
									for(let key in info.resourceStatusHash){
										if(!info.resourceStatusHash[key]){
											allResourceLoaded = false;
											break;
										}
									}
									//如果需要的resource都已经获取到了
									if(allResourceLoaded){
										thatS3dServerObjectCreator.createObject3DAfterLoadResource(cacheKey, info.resultJson);
									}
								}
								delete thatS3dServerObjectCreator.creatingInfo.resource2CacheKeysMap[resourceKey];
							});
						}
					}
				}
				if(resourceStatusHash == null){
					//不包含resource
					thatS3dServerObjectCreator.createObject3DAfterLoadResource(cacheKey, result);
				}
				else{
					let allResourceLoaded = true;
					for(let key in resourceStatusHash){
						if(!resourceStatusHash[key]){
							allResourceLoaded = false;
							break;
						}
					}
					//如果所有的resource在本地都有缓存
					if(allResourceLoaded){
						thatS3dServerObjectCreator.createObject3DAfterLoadResource(cacheKey, result);
					}
				}
			},
			failFunc: function(obj) {
				msgBox.error({title:"提示", info: obj.message});
			}
		});
	}

	this.createObject3DAfterLoadResource = function(cacheKey, resultJson){
		let geoJson = resultJson.geoJson;
		let serverUnitSetting = resultJson.unitSetting;
		let serverMaterialJsons = resultJson.materialJson;
		let resourceJson = geoJson["resource"];
		let object3D;
		if(resourceJson == null){
			object3D = thatS3dServerObjectCreator.geoJsonToObject3D(geoJson, serverMaterialJsons);
			if(!geoJson.useWorldPosition){
				thatS3dServerObjectCreator.moveToCenter(object3D);
			}
		}
		else{
			object3D = thatS3dServerObjectCreator.jsonToResourceObject3D(geoJson, null, resultJson.unitSetting);
		}
		let box = new THREE.Box3().setFromObject(object3D, true);

		let tagObject3D = thatS3dServerObjectCreator.createTagRootObject3D(geoJson, serverMaterialJsons);

		thatS3dServerObjectCreator.callbackCreateObject3D(cacheKey, object3D, geoJson, serverUnitSetting.id, serverUnitSetting, box, tagObject3D);
		delete thatS3dServerObjectCreator.creatingInfo.cacheKey2InfoMap[cacheKey];
	}

	this.callbackCreateObject3D = function(cacheKey, object3D, geoJson, unitId, serverUnitSetting, box, tagObject3D){
		thatS3dServerObjectCreator.addCache({
			cacheKey: cacheKey,
			object3D: object3D,
			geoJson: geoJson,
			sameUnitId: unitId,
			unitSetting: serverUnitSetting,
			box: box,
			tagObject3D: tagObject3D
		});

		//有可能serverUnitSetting里的属性值与unitSetting的属性值不同（例如服务器端修改了属性值），那么需要更新 added by ls 20220623
		let requestParameters = {};
		let refComponentInfo = thatS3dServerObjectCreator.getComponentInfo(serverUnitSetting.code, serverUnitSetting.versionNum);
		for(let paramName in serverUnitSetting.parameters){
			let unitParameter = serverUnitSetting.parameters[paramName];
			let refComponentInfoParameter = refComponentInfo.parameters[paramName];
			if(refComponentInfoParameter != null){
				requestParameters[paramName] = {
					//如果参数值为undefined，那么赋值为null modified by ls 20220519
					value: unitParameter.value === undefined ? null : unitParameter.value,
					isGeo: refComponentInfoParameter.isGeo
				};
			}
		}
		let newCacheKey = thatS3dServerObjectCreator.manager.object3DCache.getComponentObject3DKey(refComponentInfo.code, refComponentInfo.versionNum, requestParameters, serverUnitSetting.useWorldPosition, thatS3dServerObjectCreator.manager.viewer.detailLevel, thatS3dServerObjectCreator.manager.viewer.viewLevel);
		if(newCacheKey !== cacheKey){
			thatS3dServerObjectCreator.manager.object3DCache.addRefComponentObject3D(newCacheKey, object3D, geoJson, unitId, serverUnitSetting, box, tagObject3D);
		}

		let waitingInfos = thatS3dServerObjectCreator.creatingInfo.cacheKey2InfoMap[cacheKey].waitingList;
		for(let i = 0; i < waitingInfos.length; i++){
			let waitingInfo = waitingInfos[i];
			thatS3dServerObjectCreator.createObject3DByCloneCache(waitingInfo);
		}
	}

	this.createObject3DByCloneCache = function (p){
		let cacheInfo = thatS3dServerObjectCreator.manager.object3DCache.getRefComponentObject3D(p.cacheKey);
		if(p.otherInfo.isOnGround){
			let height = (cacheInfo.box.max.y - cacheInfo.box.min.y);
			p.unitSetting.position[1] = height / 2;
		}

		let newObject3D = thatS3dServerObjectCreator.manager.object3DCache.cloneRefComponentObject3D(p.cacheKey);
		newObject3D.isS3dObject = true;
		newObject3D.userData.unitInfo = thatS3dServerObjectCreator.createNodeData(p.unitSetting, cacheInfo.unitSetting);
		if(newObject3D.userData.unitInfo.useWorldPosition){
			newObject3D.rotation.set(0, 0, 0);
			newObject3D.position.set(0, 0, 0);
		}
		else {
			newObject3D.rotation.set(p.unitSetting.rotation[0], p.unitSetting.rotation[1], p.unitSetting.rotation[2]);
			newObject3D.position.set(p.unitSetting.position[0], p.unitSetting.position[1], p.unitSetting.position[2]);
		}

		thatS3dServerObjectCreator.creatingInfo.countInfo.serverSucceed = thatS3dServerObjectCreator.creatingInfo.countInfo.serverSucceed + 1;

		thatS3dServerObjectCreator.creatingInfo.afterCreateObject3D({
			object3D: newObject3D,
			unitSetting: p.unitSetting,
			cacheKey: p.cacheKey,
			isServer: true,
			otherInfo: p.otherInfo,
			countInfo: thatS3dServerObjectCreator.creatingInfo.countInfo
		});
		thatS3dServerObjectCreator.refreshProgress();
	}

	this.setObject3DUvsImage = function(object3D, uvs, unitSetting){
    	if(uvs != null){
    		let meshUvCount = 0;
    		for(let meshKey in uvs){
    			meshUvCount++;
    		}
    		if(meshUvCount > 0 || isForced){
    			for(let i = 0; i < object3D.children.length; i++){
    				let mesh = object3D.children[i];
    				let meshKey = mesh.name;
    				let meshUv = uvs[meshKey];
    				thatS3dServerObjectCreator.setMeshUvsImage(mesh, meshUv, unitSetting);
    			}
    		} 
    	}
	}

	this.setMeshUvsImage = function(mesh, meshUv, unitSetting){
		if(meshUv != null){
			let uvs = mesh.geometry.attributes.uv;
			for(let faceIndex in meshUv){
				let faceUv = meshUv[faceIndex];
				let materialIndex = 0;
				for(let k = 0; k < mesh.material.length; k++){
					let m = mesh.material[k];
					if(m.name === faceUv.imageName){
						materialIndex = k;
					} 
				}
				if(materialIndex === 0){
					let imageName = unitSetting.parameters[faceUv.imageName] == null ? "test" : unitSetting.parameters[faceUv.imageName].value;
					let imageUrl = "../../images/" + imageName;
					let texture = THREE.ImageUtils.loadTexture(imageUrl, {}, function() { 	
						
					}); 
					let faceMaterial = new THREE.MeshPhongMaterial( { 
						transparent: false,
						opacity: mesh.material[0].opacity,
						name: faceUv.imageName,
						map: texture,
						flatShading: true,
						side: THREE.FrontSide,
						color: mesh.material[0].color
					});
					mesh.material.push(faceMaterial); 
					materialIndex = mesh.material.length - 1;
				}
				let fIndex = parseInt(faceUv.faceIndex);
				uvs.array[fIndex * 3 * 2] =  faceUv.a.x;
				uvs.array[fIndex * 3 * 2 + 1] =  faceUv.a.y;
				uvs.array[fIndex * 3 * 2 + 2] =  faceUv.b.x;
				uvs.array[fIndex * 3 * 2 + 3] =  faceUv.b.y;
				uvs.array[fIndex * 3 * 2 + 4] =  faceUv.c.x;
				uvs.array[fIndex * 3 * 2 + 5] =  faceUv.c.y;

				mesh.geometry.addGroup(fIndex * 3, 3, materialIndex); 
			}
			mesh.geometry.setAttribute("uv", uvs); 
			mesh.geometry.uvsNeedUpdate = true;	 	
		} 
	}

	this.createNodeData = function(unitSetting, serverUnitSetting){
		let componentInfo = thatS3dServerObjectCreator.getComponentInfo(unitSetting.code, unitSetting.versionNum);
		let parameters = {};
		for(let paramName in componentInfo.parameters){
			let param = unitSetting.parameters[paramName];
			let comParam = componentInfo.parameters[paramName];
			if(comParam.isGeo){
				parameters[paramName] = {
					value: serverUnitSetting.parameters[paramName].value
				};
			}
			else{
				parameters[paramName] = {
					value: param == null ? null : param.value
				};
			}
		}
		
		//如果没有指定useWorldPosition，那么按照服务器端返回值来
		if(!unitSetting.useWorldPosition){
			unitSetting.useWorldPosition = serverUnitSetting.useWorldPosition;
		}

		unitSetting.center = serverUnitSetting.center;

		return {								
			id: unitSetting.id,
			name: unitSetting.name,
			code: unitSetting.code,
			versionNum: unitSetting.versionNum,
			useWorldPosition: unitSetting.useWorldPosition,
			position: unitSetting.position,
			rotation: unitSetting.rotation,
			center: unitSetting.center,
			parameters: parameters,
			isServer: true
		}; 
	}

	this.refreshProgress = function(){
		let succeedCount = thatS3dServerObjectCreator.creatingInfo.countInfo.serverSucceed
			+ thatS3dServerObjectCreator.creatingInfo.countInfo.localSucceed;
		if(succeedCount === thatS3dServerObjectCreator.creatingInfo.countInfo.all){
			let message = "调用成功";
			thatS3dServerObjectCreator.manager.messageBox.show({message: message});
			thatS3dServerObjectCreator.manager.messageBox.hide({timeout: 200});
		}
		else{
			let message = "正在调用造型服务 (" + succeedCount + " / " + thatS3dServerObjectCreator.creatingInfo.countInfo.all + ")"
			thatS3dServerObjectCreator.manager.messageBox.show({message: message});
		}
	}

	this.geoJsonToObject3D = function(geoJson, serverMaterialJsons){
		let offText = geoJson["offText"];
		let materialName = geoJson["material"]; 
		let lineMaterialName = geoJson["lineMaterial"];
		let resourceJson = geoJson["resource"];
		if(resourceJson != null){
			//在此加载resource模型
			let object3D = thatS3dServerObjectCreator.jsonToResourceObject3D(geoJson);
			object3D.name = geoJson.name;
			object3D.userData.isResource = true;
			return object3D;
		}
		else if(offText == null){
			//包含子节点
			let childOffs = geoJson["children"];
			let object3D = new THREE.Object3D();
			for(let i = 0; i < childOffs.length; i++){
				let childOffJson = childOffs[i];
				let tempNamePath = childOffJson.name;
				thatS3dServerObjectCreator.geoJsonToSubObject3D(childOffJson, geoJson, object3D, tempNamePath, serverMaterialJsons);
			} 
			return object3D;
		}	
		else{		  
			let offMeshInfo = thatS3dServerObjectCreator.getMeshInfoFromOff(offText);
			let mesh = thatS3dServerObjectCreator.getMeshFromText(offMeshInfo, materialName, lineMaterialName, serverMaterialJsons);
			mesh.name = "Mesh";
	        //that.refreshMeshUvMaterial(mesh, geoJson);
	        let object3D = new THREE.Object3D();
	        object3D.add(mesh);  
			return object3D;
		}
	}

	this.geoJsonToSubObject3D = function(geoJson, parentGeoJson, parentObject3D, namePath, serverMaterialJsons){
		//如果是辅助点，那么不构造mesh
		if(geoJson.isPoint){
			if(parentObject3D.assistPoints == null){
				parentObject3D.assistPoints =  [];
			}
			parentObject3D.assistPoints.push({
				x: geoJson.position[0],
				y: geoJson.position[1],
				z: geoJson.position[2]
			});
		}
		else{
			geoJson.parentGeoJson = parentGeoJson;
			let offText = geoJson["offText"];
			let materialName = geoJson["material"]; 
			let lineMaterialName = geoJson["lineMaterial"];
			let resourceJson = geoJson["resource"];
			if(resourceJson != null){
				//在此加载resource模型
				let object3D = thatS3dServerObjectCreator.jsonToResourceObject3D(geoJson);
				object3D.name = namePath;
				object3D.userData.isResource = true;
				parentObject3D.add(object3D);
			}
			else if(offText == null){
				let childOffs = geoJson["children"]; 
				for(let i = 0; i < childOffs.length; i++){
					let childOffJson = childOffs[i]; 
					let tempNamePath = (namePath.length === 0 ? "" : (namePath + "/")) + childOffJson.name;
					thatS3dServerObjectCreator.geoJsonToSubObject3D(childOffJson, geoJson, parentObject3D, tempNamePath, serverMaterialJsons);
				} 
			}
			else{		  
				let offMeshInfo = thatS3dServerObjectCreator.getMeshInfoFromOff(offText);
				let mesh = thatS3dServerObjectCreator.getMeshFromText(offMeshInfo, materialName, lineMaterialName, serverMaterialJsons);
				mesh.name = namePath; 
				//that.refreshMeshUvMaterial(mesh, geoJson); 

				parentObject3D.add(mesh);
			}
		}
	}

	//模型中包含的所有材质
	this.getGeoMaterialNames = function (geoJson, materialNameMap) {
		let materialName = geoJson["material"];
		if (materialName != null && materialName.length > 0 && !materialNameMap[materialName]) {
			materialNameMap[materialName] = true;
		}
		let lineMaterialName = geoJson["lineMaterial"];
		if (lineMaterialName != null && lineMaterialName.length > 0 && !materialNameMap[lineMaterialName]) {
			materialNameMap[lineMaterialName] = true;
		}
		let childGeos = geoJson["children"];
		if(childGeos != null) {
			for (let i = 0; i < childGeos.length; i++) {
				let childGeoJson = childGeos[i];
				thatS3dServerObjectCreator.getGeoMaterialNames(childGeoJson, materialNameMap);
			}
		}
	}

	//resource的外轮廓mesh
	this.createResourceBoxMesh = function (boxMeshInfo, lineMaterial){
		let mesh = new THREE.Object3D();
		mesh.noneGeometry = true;

		for(let i = 0; i < boxMeshInfo.lines.length; i++){
			let lineInfo = boxMeshInfo.lines[i];
			let pointsLine = [];
			pointsLine.push( new THREE.Vector3( lineInfo.start.x, lineInfo.start.y, lineInfo.start.z ) );
			pointsLine.push( new THREE.Vector3( lineInfo.end.x, lineInfo.end.y, lineInfo.end.z ) );
			let geometry = new THREE.BufferGeometry().setFromPoints( pointsLine );
			let line = new THREE.Line(geometry, lineMaterial);
			line.isResourceBoxLine = true;
			mesh.add(line);
		}
		return mesh;
	}

	this.jsonToResourceObject3D = function(geoJson){
		//三个scale属性 modified by ls 20230901
		let scaleX = geoJson.resource.scaleX;
		let scaleY = geoJson.resource.scaleY;
		let scaleZ = geoJson.resource.scaleZ;

		//外框 added by ls 20230829
		let boxMeshInfo = thatS3dServerObjectCreator.getMeshInfoFromOff(geoJson.offText);
		let boxMesh = thatS3dServerObjectCreator.createResourceBoxMesh(boxMeshInfo, thatS3dServerObjectCreator.resourceBoxEdgeMaterial);

		let resourceZipCode = geoJson.resource.name;
		let resourceType = geoJson.resource.resourceType;
		let cacheKey = thatS3dServerObjectCreator.manager.object3DCache.getResourceObject3DKey(resourceZipCode, resourceType);
		let resourceObject3D =  thatS3dServerObjectCreator.manager.object3DCache.cloneResourceObject3D(cacheKey);
		thatS3dServerObjectCreator.moveToCenter(resourceObject3D);
		if(thatS3dServerObjectCreator.manager.viewer.showShadow){
			thatS3dServerObjectCreator.setResourceMeshShadow(resourceObject3D);
		}

		let outerResourceObject3D = new THREE.Object3D();
		outerResourceObject3D.add(resourceObject3D);
		resourceObject3D.scale.set(scaleX, scaleY, scaleZ);
		resourceObject3D.rotation.set(geoJson.rotation[0], geoJson.rotation[1], geoJson.rotation[2]);
		thatS3dServerObjectCreator.moveToCenter(outerResourceObject3D);
		let box = new THREE.Box3().setFromObject(boxMesh, true);
		let xCenter = (box.min.x + box.max.x) / 2;
		let yCenter = (box.min.y + box.max.y) / 2;
		let zCenter = (box.min.z + box.max.z) / 2;
		outerResourceObject3D.position.set(xCenter, yCenter, zCenter);

		let object3D = new THREE.Object3D();
		object3D.add(outerResourceObject3D);
		object3D.add(boxMesh);

		//增加辅助点 added by ls 20230418
		let assistInfo =  thatS3dServerObjectCreator.manager.object3DCache.getResourceAssistInfo(cacheKey);
		if(assistInfo != null ){
			object3D.assistPoints = [];
			for(let pointName in assistInfo){
				let p = assistInfo[pointName];
				object3D.assistPoints.push({
					pointType: p.pointType,
					x: p.x * scaleX,
					y: p.y * scaleY,
					z: p.z * scaleZ
				});
			}
		}

		return object3D;
	}

	this.moveToCenter = function(object3D){
		let box = new THREE.Box3().setFromObject(object3D, true);
		let xCenter = (box.min.x + box.max.x) / 2;
		let yCenter = (box.min.y + box.max.y) / 2;
		let zCenter = (box.min.z + box.max.z) / 2;

		//记录下居中时造成的偏移量 added by ls 20221208
		object3D.centerShift = {
			x: -xCenter,
			y: -yCenter,
			z: -zCenter
		};

		for(let i = 0; i < object3D.children.length; i++){
			let meshObj = object3D.children[i];
			if(!meshObj.userData.isResource){
				let x = -xCenter;
				let y = -yCenter;
				let z = -zCenter;
				meshObj.position.set(x, y, z);
			}
			else{
				let x = meshObj.position.x - xCenter;
				let y = meshObj.position.y - yCenter;
				let z = meshObj.position.z - zCenter;
				meshObj.position.set(x, y, z);
			}
		}

		//将辅助点的位置也平移，和整体一致
		if(object3D.assistPoints != null){
			for(let i = 0; i < object3D.assistPoints.length; i++){
				let assistPoint = object3D.assistPoints[i];
				assistPoint.x = assistPoint.x - xCenter;
				assistPoint.y = assistPoint.y - yCenter;
				assistPoint.z = assistPoint.z - zCenter;
			}
		}
	}

	this.setResourceMeshShadow = function(object3D){
		if(object3D.children.length > 0){
			for(let i = 0; i < object3D.children.length; i++){
				let childObj = object3D.children[i];
				thatS3dServerObjectCreator.setResourceMeshShadow(childObj);
			}
		}
		else{
			object3D.castShadow = true;
			object3D.receiveShadow = true;
			if(object3D.material != null){
				if(object3D.material.length == null){
					object3D.material.flatShading = true;
				}
				else{
					for(let i = 0; i < object3D.material.length; i++){
						object3D.material[i].flatShading = true;
					}
				}
			}
		}
	}

	this.getMeshInfoFromOff = function(offText){
		let txts = offText.split("\n");
		let counts = txts[1].split(" ");
		let pointCount = parseInt(counts[0]);
		let faceCount = parseInt(counts[1]);
		let lineCount = parseInt(counts[2]);
		let vertices = [];
		let positions = [];
		let faces = [];
		let indices = [];
		let lines = [];
		for(let i = 2; i < 2 + pointCount; i++){
			let parts = txts[i].split(" ");
			vertices.push(parseFloat(parts[0]));
			vertices.push(parseFloat(parts[1]));
			vertices.push(parseFloat(parts[2]));
		}
		let positionIndex = 0;
		for(let i = 2 + pointCount; i < 2 + pointCount + faceCount; i++){
			let parts = txts[i].split(" ");
			faces.push(parseInt(parts[1]));
			faces.push(parseInt(parts[2]));
			faces.push(parseInt(parts[3])); 
			positions.push(vertices[parseInt(parts[1]) * 3]);
			positions.push(vertices[parseInt(parts[1]) * 3 + 1]);
			positions.push(vertices[parseInt(parts[1]) * 3 + 2]);
			positions.push(vertices[parseInt(parts[2]) * 3]);
			positions.push(vertices[parseInt(parts[2]) * 3 + 1]);
			positions.push(vertices[parseInt(parts[2]) * 3 + 2]);
			positions.push(vertices[parseInt(parts[3]) * 3]);
			positions.push(vertices[parseInt(parts[3]) * 3 + 1]);
			positions.push(vertices[parseInt(parts[3]) * 3 + 2]);
			indices.push(positionIndex);
			indices.push(positionIndex + 1);
			indices.push(positionIndex + 2);
			positionIndex = positionIndex + 3;
		}	
		for(let i = 2 + pointCount + faceCount; i < 2 + pointCount + faceCount + lineCount; i++){
			let parts = txts[i].split(" ");
			let lineStartX = vertices[parseInt(parts[1]) * 3];
			let lineStartY = vertices[parseInt(parts[1]) * 3 + 1];
			let lineStartZ = vertices[parseInt(parts[1]) * 3 + 2];
			let lineEndX = vertices[parseInt(parts[2]) * 3];
			let lineEndY = vertices[parseInt(parts[2]) * 3 + 1];
			let lineEndZ = vertices[parseInt(parts[2]) * 3 + 2];
			let line = {
				start: {x: lineStartX, y: lineStartY, z: lineStartZ},
				end: {x: lineEndX, y: lineEndY, z: lineEndZ}
			}
			lines.push(line);
		}
		return {
			positions: positions,
			indices: indices,
			lines: lines
		};
	}
	
	this.getMeshFromText = function(offMeshInfo, materialName, lineMaterialName, serverMaterialJsons){
    	let mesh = null;
    	if(offMeshInfo.indices.length > 0){
			let geometry = new THREE.BufferGeometry(); 
			geometry.setAttribute("position", new THREE.Float32BufferAttribute(offMeshInfo.positions, 3)); 
			geometry.setIndex(new THREE.Uint16BufferAttribute(offMeshInfo.indices, 1));
			geometry.computeVertexNormals();
	 
			let material = thatS3dServerObjectCreator.getMaterial(materialName, serverMaterialJsons);
			mesh = new THREE.Mesh(geometry,  material );
			thatS3dServerObjectCreator.setMeshMaterial(mesh, material);
				
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			mesh.hasGeometry = true;
    	}
    	else{
    		mesh = new THREE.Mesh();
    		mesh.noneGeometry = true;
    	}
    	let lineMaterial = thatS3dServerObjectCreator.getLineMaterial(lineMaterialName, serverMaterialJsons);
		for(let i = 0; i < offMeshInfo.lines.length; i++){
			let lineInfo = offMeshInfo.lines[i];
            let lineGeometry = new THREE.BufferGeometry(); 
			let positions = [];  
			positions.push(lineInfo.start.x, lineInfo.start.y, lineInfo.start.z);
			positions.push(lineInfo.end.x, lineInfo.end.y, lineInfo.end.z); 
			lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
            let line = new THREE.Line(lineGeometry, lineMaterial);
            line.isUnitLine = true;
            mesh.add(line);
		}
		return mesh;
	}
    
    this.getMaterial = function(materialName, serverMaterialJsons){
		let materialInfo = thatS3dServerObjectCreator.manager.materials.getMaterialInfo(materialName);
		if(materialInfo == null && materialName != null && materialName.length !== 0){
			let serverMaterialJson = serverMaterialJsons[materialName];
			if(serverMaterialJson != null) {
				materialInfo = thatS3dServerObjectCreator.manager.materials.getMaterialInfoByJson(serverMaterialJson);
			}
		}
		let material = thatS3dServerObjectCreator.materialMap[materialName];
		if(material == null) {
			if (materialInfo == null) {
				material = new THREE.MeshStandardMaterial({
					color: 0xAAAAAA,
					side: thatS3dServerObjectCreator.materialSide,
					flatShading: true,
					name: materialName,
					metalness: 0,
					roughness: 1
				});
				thatS3dServerObjectCreator.manager.materials.setMaterial(materialName, material);
			}
			else {
				let materialCreate = thatS3dServerObjectCreator.manager.materials.baseMaterials.creators[materialInfo.typeCode];
				if (materialCreate != null) {
					material = materialCreate(materialInfo);
				}
				else {
					material = thatS3dServerObjectCreator.manager.materials.baseMaterials.defaultCreator(materialInfo);
				}
				thatS3dServerObjectCreator.manager.materials.setMaterial(materialName, material);
			}
		}
		return material;
    }
    
    
    this.getLineMaterial = function(materialName, serverMaterialJsons){
		let materialInfo = thatS3dServerObjectCreator.manager.materials.getMaterialInfo(materialName);
		if(materialName != null && materialName.length !== 0){
			let serverMaterialJson = serverMaterialJsons[materialName];
			if(serverMaterialJson != null) {
				materialInfo = thatS3dServerObjectCreator.manager.materials.getMaterialInfoByJson(serverMaterialJson);
			}
		}
		if(materialInfo == null){
			let material = thatS3dServerObjectCreator.manager.materials.getLineMaterial(materialName);
			if(material == null) {
				material = new THREE.LineBasicMaterial({
					color: 0xCCCCCC,
					linewidth: 1
				});
				thatS3dServerObjectCreator.manager.materials.setLineMaterial(materialName, material);
			}
			return material;
		}
		else{
			let material =  thatS3dServerObjectCreator.manager.materials.getLineMaterial(materialName);
			if(material == null){
				let material = new THREE.LineBasicMaterial({
					color: materialInfo.color,
					linewidth: 1
				});
				thatS3dServerObjectCreator.manager.materials.setLineMaterial(materialName, material);
				return material;
			}
			else{ 
				return material;
			}
		}
  	}
  
	this.setMeshMaterial = function(mesh, material){  
		let uvs = [];
		let euler = new THREE.Euler(0, 0, 0); 
		let indices = mesh.geometry.index.array;
		let positions = mesh.geometry.getAttribute("position").array;
		let ss = "";
	  	for(let j = 0; j < indices.length; j = j + 3){ 
			let uv = [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1, 1)]; 
						
			let pA = new THREE.Vector3(positions[indices[j] * 3], positions[indices[j] * 3 + 1], positions[indices[j] * 3 + 2]);
			pA.applyEuler(euler); 
			let pB = new THREE.Vector3(positions[indices[j + 1] * 3], positions[indices[j + 1] * 3 + 1], positions[indices[j + 1] * 3 + 2]);
			pB.applyEuler(euler); 
			let pC = new THREE.Vector3(positions[indices[j + 2] * 3], positions[indices[j + 2] * 3 + 1], positions[indices[j + 2] * 3 + 2]);
			pC.applyEuler(euler); 
			let ignoreValue = 0.0001;
			if((Math.abs(pA.x - pB.x) < ignoreValue) && (Math.abs(pA.x - pC.x) < ignoreValue)){
				uv[0].x = pA.y;
				uv[0].y = pA.z;
				uv[1].x = pB.y;
				uv[1].y = pB.z;	
				uv[2].x = pC.y;  
				uv[2].y = pC.z;
			}
			else if((Math.abs(pA.z - pB.z) < ignoreValue) && (Math.abs(pA.z - pC.z) < ignoreValue)){
				uv[0].x = pA.y;
				uv[0].y = pA.x;
				uv[1].x = pB.y;	
				uv[1].y = pB.x;
				uv[2].x = pC.y;
				uv[2].y = pC.x;  
			} 
			else if((Math.abs(pA.y - pB.y) < ignoreValue) && (Math.abs(pA.y - pC.y) < ignoreValue)){
				uv[0].x = pA.x;
				uv[0].y = pA.z;
				uv[1].x = pB.x;	
				uv[1].y = pB.z;
				uv[2].x = pC.x;
				uv[2].y = pC.z;  
			}
			else {
				uv[0].x = pA.y;
				uv[0].y = pA.z;
				uv[1].x = pB.y;
				uv[1].y = pB.z;	
				uv[2].x = pC.y;  
				uv[2].y = pC.z;  
			}

			uvs.push(uv[0].x);
			uvs.push(uv[0].y);
			uvs.push(uv[1].x);
			uvs.push(uv[1].y);
			uvs.push(uv[2].x);
		  	uvs.push(uv[2].y);
		  	ss += (uv[0].x + "," + uv[0].y + "," + uv[1].x + "," + uv[1].y + "," + uv[2].x + "," + uv[2].y + ",");
	  	}
		mesh.geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2)); 
		mesh.geometry.addGroup(0, indices.length, 0); 
		mesh.material = [material];   
		mesh.geometry.uvsNeedUpdate = true;
	}

	//构造标注的object3Ds
	this.cloneTagRootObject3D = function(cacheKey){
		return thatS3dServerObjectCreator.manager.object3DCache.cloneTagObject3D(cacheKey);
	}

	//构造标注的object3Ds
	this.createTagRootObject3D = function(geoJson, serverMaterialJsons){
		let tag3D = new THREE.Object3D();
		let childTag3Ds = [];
		if(geoJson.tags != null){
			for(let i = 0; i < geoJson.tags.length; i++){
				let tagJson = geoJson.tags[i];
				let childTag3D = thatS3dServerObjectCreator.offToTagObject3D(tagJson, serverMaterialJsons);
				childTag3Ds.push(childTag3D);
			}
		}
		for(let i = 0; i < childTag3Ds.length; i++){
			let childTag3D = childTag3Ds[i];
			tag3D.add(childTag3D);
		}
		tag3D.isTag = true;

		return tag3D;
	}

	//tagJson转标注object3D
	this.offToTagObject3D = function(tagJson, serverMaterialJsons){
		let offText = tagJson["offText"];
		let materialName = tagJson["material"];
		let lineMaterialName = tagJson["lineMaterial"];
		if(offText == null){
			//包含子节点
			let childOffs = tagJson["children"];
			let obj3D = new THREE.Object3D();
			for(let i = 0; i < childOffs.length; i++){
				let childOffJson = childOffs[i];
				let tempNamePath = childOffJson.name;
				thatS3dServerObjectCreator.offToSubTagObject3D(childOffJson, tagJson, obj3D, tempNamePath, serverMaterialJsons);
			}
			return obj3D;
		}
		else{
			let meshInfo = thatS3dServerObjectCreator.getMeshInfoFromOff(offText);
			let mesh = thatS3dServerObjectCreator.getMeshFromText(meshInfo, materialName, lineMaterialName, serverMaterialJsons);
			mesh.name = "Mesh";
			let obj3D = new THREE.Object3D();
			obj3D.add(mesh);
			//thatS3dServerObjectCreator.refreshMeshUvMaterial(mesh, tagJson);
			return obj3D;
		}
	}

	//tagJson转标注subObject3D
	this.offToSubTagObject3D = function(tagJson, parentGeoJson, root3D, namePath, serverMaterialJsons){
		tagJson.parentGeoJson = parentGeoJson;
		let offText = tagJson["offText"];
		let materialName = tagJson["material"];
		let lineMaterialName = tagJson["lineMaterial"];
		if(offText == null){
			let childOffs = tagJson["children"];
			for(let i = 0; i < childOffs.length; i++){
				let childOffJson = childOffs[i];
				let tempNamePath = (namePath.length === 0 ? "" : (namePath + "/")) + childOffJson.name;
				thatS3dServerObjectCreator.offToSubTagObject3D(childOffJson, tagJson, root3D, tempNamePath, serverMaterialJsons);
			}
		}
		else{
			let meshInfo = thatS3dServerObjectCreator.getMeshInfoFromOff(offText);
			let mesh = thatS3dServerObjectCreator.getMeshFromText(meshInfo, materialName, lineMaterialName, serverMaterialJsons);
			mesh.name = namePath;
			root3D.add(mesh);
		}
		tagJson.parentGeoJson = null;
	}

}
export default S3dServerObjectCreator