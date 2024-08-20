import {cmnPcr} from "../../commonjs/common/static.js"

//S3dWeb object3D 缓存
let S3dObject3DCache = function (){
	const thatS3dObject3DCache = this;

	//记录引用的组件的编码+版本+参数与Object3D的对照关系，用于量大的时候clone
	this.refComponentObject3Ds = {};

	//resource缓存
	this.resourceObject3Ds = {};

	this.init = function (p){

	}

	this.addRefComponentObject3D = function(cacheKey, object3D, geoJson, sameUnitId, unitSetting, box, tagObject3D){
		thatS3dObject3DCache.refComponentObject3Ds[cacheKey] = {
			cacheKey: cacheKey,
			object3D: object3D,
			tagObject3D: tagObject3D,
			geoJson: geoJson,
			sameUnitId: sameUnitId,
			unitSetting: unitSetting,
			box: box
		};
	}

	this.getRefComponentObject3D = function(cacheKey){
		return thatS3dObject3DCache.refComponentObject3Ds[cacheKey];
	}

	this.getComponentObject3DKey = function(componentCode, versionNum, parameters, useWorldPosition, detailLevel, viewLevel, isServer){
		return componentCode + "_" + versionNum + "_" + viewLevel + "_" + detailLevel + "_" + (useWorldPosition ? "worldPosition" : "localPosition") + "_" + (isServer ? "isServer" : "isLocal") + "_" + thatS3dObject3DCache.getParameterString(parameters);
	}

	this.cloneRefComponentObject3D = function(cacheKey){
		let cacheObj = thatS3dObject3DCache.refComponentObject3Ds[cacheKey];
		let newObject3D = cacheObj.object3D.clone();
		newObject3D.assistPoints = cacheObj.object3D.assistPoints;
		newObject3D.cacheKey = cacheKey;
		newObject3D.centerShift = cacheObj.object3D.centerShift;
		thatS3dObject3DCache.cloneObject3DGeometry(newObject3D, cacheObj.object3D);
		return newObject3D;
	}

	this.cloneTagObject3D = function(cacheKey){
		let cacheObj = thatS3dObject3DCache.refComponentObject3Ds[cacheKey];
		let newTagObject3D = cacheObj.tagObject3D.clone();
		newTagObject3D.isTag = true;
		thatS3dObject3DCache.cloneObject3DGeometry(newTagObject3D, cacheObj.tagObject3D);
		return newTagObject3D;
	}

	this.getUnitSetting = function(cacheKey){
		let cacheObj = thatS3dObject3DCache.refComponentObject3Ds[cacheKey];
		return cacheObj.unitSetting;
	}

	this.getGeoJson = function(cacheKey){
		let cacheObj = thatS3dObject3DCache.refComponentObject3Ds[cacheKey];
		return cacheObj.geoJson;
	}

	this.hasRefComponentObject3D = function(cacheKey){
		let cacheObj = thatS3dObject3DCache.refComponentObject3Ds[cacheKey];
		return cacheObj != null;
	}

	this.addResourceObject3D = function(cacheKey, object3D, assistInfo, materialInfo){
		thatS3dObject3DCache.resourceObject3Ds[cacheKey] = {
			object3D: object3D,
			assistInfo: assistInfo,
			materialInfo: materialInfo
		};
	}

	this.getResourceObject3D = function(cacheKey){
		return thatS3dObject3DCache.resourceObject3Ds[cacheKey];
	}

	this.cloneResourceObject3D = function(cacheKey){
		let cacheObj = thatS3dObject3DCache.resourceObject3Ds[cacheKey];
		return cacheObj.object3D.clone();
	}

	this.clonePartSourceObject3D = function (cacheKey, partName){
		let cacheObj = thatS3dObject3DCache.resourceObject3Ds[cacheKey];
		let pNames = partName.split("###");
		let object3D = cacheObj.object3D;
		for(let i = 0; i < pNames.length; i++){
			let pName = pNames[i];
			if(pName.length !== 0) {
				let lineIndex = pName.indexOf("_");
				let childIndexStr = pName.substr(0, lineIndex);
				let childIndex = parseInt(childIndexStr);
				object3D = object3D.children[childIndex];
			}
		}
		return object3D.clone();
	}

	this.getResourceAssistInfo = function(cacheKey){
		let cacheObj = thatS3dObject3DCache.resourceObject3Ds[cacheKey];
		return cacheObj.assistInfo;
	}

	this.cloneObject3DGeometry = function(object3D, oldObject3D){
		if(object3D.children != null){
			for(let i = 0 ; i < object3D.children.length; i++){
				let childObj = object3D.children[i];
				let oldChildObj = oldObject3D.children[i];
				let materials = childObj.material;
				if(materials != null){
					if(materials instanceof Array){
						let newMaterials = [];
						for(let j = 0; j < materials.length; j++){
							newMaterials.push(materials[j]);
						}
						childObj.material = newMaterials;
					}
					else{
						childObj.material = materials;
					}
				}

				if(childObj.geometry != null){
					childObj.geometry = childObj.geometry.clone();
				}

				if(childObj.type === "Mesh"){
					childObj.isS3dMesh = true;
				}
				else if(childObj.type === "Object3D"){
					childObj.isS3dObject = true;
				}

				//线
				if(oldChildObj.isUnitLine){
					childObj.isUnitLine = oldChildObj.isUnitLine;
				}

				//resource边框
				if(oldChildObj.isResourceBoxLine){
					childObj.isResourceBoxLine = oldChildObj.isResourceBoxLine;
				}

				thatS3dObject3DCache.cloneObject3DGeometry(childObj, oldChildObj);
			}
		}
	}

	this.hasResourceObject3D = function(cacheKey){
		let cacheObj = thatS3dObject3DCache.resourceObject3Ds[cacheKey];
		return cacheObj != null;
	}

	this.getResourceObject3DKey = function(name, resourceType){
		return name + "_" + resourceType;
	}

	this.getParameterString = function(parameters){
		let sortedParameters = [];
		let parameterHash = {};
		let paramCount = 0;
		for(let paramName in parameters){
			let parameter = parameters[paramName];
			if(parameter.isGeo){
				//增加参数值为json的处理 modified by ls 20220606
				let parameterValue = parameter.value;
				if(parameterValue !== null && parameterValue !== undefined && typeof parameterValue !== "string"){
					parameterValue = cmnPcr.jsonToStr(parameterValue);
				}
				parameterHash[paramName] = {
					name: paramName,
					value:  parameterValue,
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

			//增加表达式作为key的一部分
			parameterStr += (parameter.name + ":" + (parameter.value == null ? "" : parameter.value) + (parameter.exp == null ? "" : ("," + parameter.exp)) + "; ");
		}
		return parameterStr;
	}
}
export default S3dObject3DCache