import * as THREE from "three";
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

	this.addObject3DCache = async function (gltfKey, gltfText, afterInitCacheObject3D){
		thatS3dInternalObject3DCreator.gltfLoader.parse(gltfText, function (result){
			let object3D = result.scene.children[0];
			thatS3dInternalObject3DCreator.manager.object3DCache.addResourceObject3D(gltfKey, object3D);
			afterInitCacheObject3D({
				cacheKey: gltfKey
			});
		});
	}

	this.createUnitObject3D = function (cacheKey, unitJson) {
		let object3D = thatS3dInternalObject3DCreator.object3DCache[cacheKey].clone();
		object3D.userData.unitInfo = unitJson;
		object3D.rotation.set(unitJson.rotation[0], unitJson.rotation[1], unitJson.rotation[2])
		object3D.position.set(unitJson.position[0], unitJson.position[1], unitJson.position[2])
		return object3D;
	}
    
    //进行坐标变换
    this.setObject3DTransform = function(nodeJson, object3D){
    	if(nodeJson.transform != null && nodeJson.transform.length > 0){
    		let tvs = [];
    		let tvStrs = nodeJson.transform.replaceAll("(", "").replaceAll(")", "").split(",");
    		for(let i = 0; i < tvStrs.length; i++){
    			tvs.push(parseFloat(tvStrs[i]));
    		}  
    		let m = new THREE.Matrix4();
    		m.set(tvs[0], tvs[4], tvs[8], tvs[12], tvs[1], tvs[5], tvs[9], tvs[13], tvs[2], tvs[6], tvs[10], tvs[14], tvs[3], tvs[7], tvs[11], tvs[15]);                 
    		object3D.applyMatrix4(m); 
    	}
    	else {
			if(nodeJson.position == null && nodeJson.rotation == null){
				
				let box = new THREE.Box3().setFromObject(object3D, true);
				let centerPoint = {
					x: (box.min.x + box.max.x) / 2,               
					y: (box.min.y + box.max.y) / 2,
					z: (box.min.z + box.max.z) / 2
				};
				let size = {
					x: (box.max.x - box.min.x),
					y: (box.max.y - box.min.y),
					z: (box.max.z - box.min.z)
				};
				//object3D.position.set(centerPoint.x, centerPoint.y, centerPoint.z); 

			}
			else{		
				let box = new THREE.Box3().setFromObject(object3D, true);
				if(nodeJson.position != null){
					object3D.position.set(nodeJson.position.x,nodeJson.position.y, nodeJson.position.z); 
				}
				if(nodeJson.rotation != null){
					object3D.rotation.set(nodeJson.rotation.x,nodeJson.rotation.y, nodeJson.rotation.z); 
				}
			}
    	}
    }

	//复制参数
	this.cloneParameters = function(paramUrl){
		let propertyJArray = thatS3dInternalObject3DCreator.manager.s3dObject.parametersJson[paramUrl];
		let parameters = {};
		for(let i = 0; i < propertyJArray.length; i++){
			let propertyJson = propertyJArray[i];
			parameters[propertyJson.name] = {
				value: propertyJson.value
			};
		}
		return parameters;
	}
    
    //根据s3d里的node，构造object3D
    this.createNodeObject3D = function(nodeJson, allNodeJsons, allUnitJsons, geometryMap, materialMap, lod, isLocal, isServer){
    	if(nodeJson.nodes != null){
    		let object3D = new THREE.Object3D();
    		
        	//打上标记
    		object3D.isS3dObject = true; 
    		
    		//包含子node
    		for(let i = 0; i < nodeJson.nodes.length; i++){
    			let childNodeJson = allNodeJsons[nodeJson.nodes[i]];
    			let childObject3D = thatS3dInternalObject3DCreator.createNodeObject3D(childNodeJson, allNodeJsons, allUnitJsons, geometryMap, materialMap, lod, isLocal, isServer);
    			if(childObject3D != null){
    				object3D.add(childObject3D);
    			}
    		}
    		thatS3dInternalObject3DCreator.setObject3DTransform(nodeJson, object3D);
    		object3D.name = nodeJson.name;
    		object3D.nodeData = {
    			id: nodeJson.id,
    			name: nodeJson.name,
				transform: nodeJson.transform,
    			parameters: nodeJson.paramUrl == null ? null : thatS3dInternalObject3DCreator.cloneParameters(nodeJson.paramUrl),
				isLocal: isLocal,
				isServer: isServer
    		};
    		return object3D;
    	}
    	else if(nodeJson.unit != null){
    		//关联了unit
    		let unitJson = allUnitJsons[nodeJson.unit];
    		let geoKey = unitJson[lod];
			
			//存在geometry为空的情况 added by ls 20221202
			let cacheGeo = geometryMap[geoKey];
			if(cacheGeo == null){
				return null;
			}
			else{
				let geo = cacheGeo.clone();
				let materials = [];
				for(let i = 0; i < nodeJson.materials.length; i++){
					materials.push(materialMap[nodeJson.materials[i]]);
				}
				let mesh = new THREE.Mesh(geo, materials[0]); 
				
				//打上标记
				mesh.isS3dMesh = true; 
				mesh.isS3dObject = true; 
				
				mesh.castShadow = true;
				mesh.receiveShadow = true;
				thatS3dInternalObject3DCreator.setObject3DTransform(nodeJson, mesh);
				mesh.name = nodeJson.name;
				mesh.nodeData = {
					id: nodeJson.id,
					name: nodeJson.name,
					transform: nodeJson.transform,
					parameters: nodeJson.paramUrl == null ? null : thatS3dInternalObject3DCreator.cloneParameters(nodeJson.paramUrl),
					isLocal: isLocal,
					isServer: isServer
				};
				return mesh;
			}
    	}
    	else{
    		//关联了图例，暂不处理
    		return null;
    	}
    }
    
    //根据gltf json信息，构造object3D
	this.createObject3DFromGltfJson = function(meshJson){
		if(meshJson.points.length === 0){
			//revit导出的，存在为空的几何的情况 added by ls 20221202
			return null;
		}
		else{
			let pointStrs = meshJson.points.split(",");
			let faceStrs = meshJson.faces.split(",");
			let pointCount = pointStrs.length;
			let faceCount = faceStrs.length;
			let vertices = [];
			let positions = [];
			let faces = [];
			let indices = [];
			for(let i = 0; i < pointCount; i++){
				let parts = pointStrs[i].trim().split(" ");
				vertices.push(parseFloat(parts[0]));
				vertices.push(parseFloat(parts[1]));
				vertices.push(parseFloat(parts[2]));
			}
			let positionIndex = 0;
			for(let i = 0; i < faceCount; i++){
				let parts = faceStrs[i].trim().split(" ");
				faces.push(parseInt(parts[0]));
				faces.push(parseInt(parts[1]));
				faces.push(parseInt(parts[2])); 
				positions.push(vertices[parseInt(parts[0]) * 3]);
				positions.push(vertices[parseInt(parts[0]) * 3 + 1]);
				positions.push(vertices[parseInt(parts[0]) * 3 + 2]);
				positions.push(vertices[parseInt(parts[1]) * 3]);
				positions.push(vertices[parseInt(parts[1]) * 3 + 1]);
				positions.push(vertices[parseInt(parts[1]) * 3 + 2]);
				positions.push(vertices[parseInt(parts[2]) * 3]);
				positions.push(vertices[parseInt(parts[2]) * 3 + 1]);
				positions.push(vertices[parseInt(parts[2]) * 3 + 2]);
				indices.push(positionIndex);
				indices.push(positionIndex + 1);
				indices.push(positionIndex + 2);
				positionIndex = positionIndex + 3;
			}	

			let geometry = new THREE.BufferGeometry(); 
			geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3 ) ); 
			geometry.setIndex(new THREE.Uint16BufferAttribute(indices, 1 ));  
			geometry.computeVertexNormals();
			return geometry;
		}
	}
}
export default S3dInternalObject3DCreator