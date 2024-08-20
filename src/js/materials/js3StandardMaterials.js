import JS3BaseMaterials from "./js3BaseMaterials.js";
let JS3StandardMaterials = function(){
	const thatStandardMaterials = this;

	this.manager = null;

	this.infoMap = {};

	this.materialMap = {};

	this.lineMaterialMap = {};

	this.baseMaterials;

	this.init = function(p){
		thatStandardMaterials.manager = p.manager;
		thatStandardMaterials.initBaseMaterials();
	}

	this.initBaseMaterials = function (){
		thatStandardMaterials.baseMaterials = new JS3BaseMaterials();
		thatStandardMaterials.baseMaterials.init({
			manager: thatStandardMaterials.manager
		});
	}
	
	this.setMaterial = function(materialName, material){
		thatStandardMaterials.materialMap[materialName] = material;
	}
	
	this.getMaterial = function(materialName){
		return thatStandardMaterials.materialMap[materialName];
	}
	
	this.setLineMaterial = function(materialName, material){
		thatStandardMaterials.lineMaterialMap[materialName] = material;
	}
	
	this.getLineMaterial = function(materialName){
		return thatStandardMaterials.lineMaterialMap[materialName];
	}
	
	this.getMaterialInfo = function(materialName){
		let materialInfo = thatStandardMaterials.infoMap[materialName];
		if(materialInfo == null){
			return null;
		}
		else{
			return materialInfo;
		}
	}

	this.getMaterialInfoByJson = function(materialJson){
		let materialInfo =  {
			name: materialJson.code,
			color: materialJson.color == null ? null : common3DFunction.stringToRGBInt(materialJson.color),
			imageName: materialJson.imageId === null || materialJson.imageId === undefined ? "" : materialJson.code,
			normalImageName: materialJson.normalImageId === null || materialJson.normalImageId === undefined ? "" : (materialJson.code + "_normal"),
			opacity: materialJson.opacity,
			opacityImageName: materialJson.opacityImageId === null || materialJson.opacityImageId === undefined ? "" : (materialJson.code + "_opacity"),
			roughness: materialJson.roughness,
			roughnessImageName: materialJson.roughnessImageId === null || materialJson.roughnessImageId === undefined ? "" : (materialJson.code + "_roughness"),
			metalness: materialJson.metalness,
			metalnessImageName: materialJson.metalnessImageId === null || materialJson.metalnessImageId === undefined ? "" : (materialJson.code + "_metalness"),
			envMapIntensity: materialJson.envMapIntensity,
			scaleHeight: materialJson.scaleHeight,
			scaleWidth: materialJson.scaleWidth,
			rotation: materialJson.rotation,
			isMirror: materialJson.isMirror,
			typeCode: materialJson.typeCode,
			isServer: true,
		};
		thatStandardMaterials.infoMap[materialInfo.name] = materialInfo;
		return materialInfo;
	}
}
export default JS3StandardMaterials