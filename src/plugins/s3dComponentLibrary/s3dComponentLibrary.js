//本地3D组件
let S3dComponentLibrary = function (){
	//当前对象
	const thatComponentLibrary = this;

	this.rootPath = null;

	this.init = function (p){
		thatComponentLibrary.rootPath = p.config.rootPath;
		thatComponentLibrary.categories = p.config.categories;
	}

	this.getAllLocalComponentJsons = function(){
		let componentList = [];
		thatComponentLibrary.getLocalComponentJsons(thatComponentLibrary.categories, componentList);
		return componentList;
	}

	this.getLocalComponentJsons = function (categories, list){
		if(categories != null){
			for(let i = 0; i < categories.length; i++){
				let category = categories[i];
				if(category.components != null){
					for(let i = 0; i < category.components.length; i++) {
						let componentInfo = category.components[i];
						if (componentInfo.isLocal) {

							let componentJson = {
								code: componentInfo.code,
								name: componentInfo.name,
								versionNum: componentInfo.versionNum,
								parameters: {}
							};
							componentJson.parameters["类型"] = {
								name: "类型",
								defaultValue: componentInfo.fileInfo.type,
								paramType: "string",
								isNullable: false,
								isEditable: false,
								isGeo: true,
								groupName: "模型文件"
							};
							componentJson.parameters["文件夹"] = {
								name: "文件夹",
								defaultValue: componentInfo.fileInfo.directory,
								paramType: "string",
								isNullable: false,
								isEditable: false,
								isGeo: true,
								groupName: "模型文件"
							};
							componentJson.parameters["文件名"] = {
								name: "文件名",
								defaultValue: componentInfo.fileInfo.fileName,
								paramType: "string",
								isNullable: false,
								isEditable: false,
								isGeo: true,
								groupName: "模型文件"
							};
							componentJson.parameters["处理方式"] = {
								name: "处理方式",
								defaultValue: componentInfo.fileInfo.processType,
								paramType: "string",
								isNullable: false,
								isEditable: false,
								isGeo: true,
								groupName: "模型文件"
							};
							componentJson.parameters["组成部分"] = {
								name: "组成部分",
								defaultValue: "",
								paramType: "string",
								isNullable: true,
								isEditable: false,
								isGeo: true,
								groupName: "模型文件"
							};
							componentJson.parameters["X缩放"] = {
								name: "X缩放",
								defaultValue: componentInfo.scale.x,
								paramType: "decimal",
								minValue: 0,
								isNullable: false,
								isEditable: true,
								isGeo: true,
								groupName: "缩放",
								listValues: ""
							};
							componentJson.parameters["Y缩放"] = {
								name: "Y缩放",
								defaultValue: componentInfo.scale.y,
								paramType: "decimal",
								minValue: 0,
								isNullable: false,
								isEditable: true,
								isGeo: true,
								groupName: "缩放",
								listValues: ""
							};
							componentJson.parameters["Z缩放"] = {
								name: "Z缩放",
								defaultValue: componentInfo.scale.z,
								paramType: "decimal",
								minValue: 0,
								isNullable: false,
								isEditable: true,
								isGeo: true,
								groupName: "缩放",
								listValues: ""
							};

							list.push(componentJson);
						}
					}
				}
				else {
					thatComponentLibrary.getLocalComponentJsons(category.children, list);
				}
			}
		}
	}

	this.getComponents = function(categoryCode){
		let category = this.getCategory(categoryCode, thatComponentLibrary.categories);
		let componentList = [];
		if(category != null){
			thatComponentLibrary.getAllComponents(category, componentList);
		}
		return componentList;
	}

	this.getAllComponents = function (category, list){
		if(category.children != null){
			for(let i = 0; i < category.children.length; i++){
				thatComponentLibrary.getAllComponents(category.children[i], list);
			}
		}
		else{
			if(category.components != null){
				for(let i = 0; i < category.components.length; i++){
					let componentInfo = category.components[i];
					if(componentInfo.isLocal) {
						list.push({
							code: componentInfo.code,
							name: componentInfo.name,
							versionNum: componentInfo.versionNum,
							imgUrl: componentInfo.fileInfo.imgName != null && componentInfo.fileInfo.imgName.length > 0 ? (componentInfo.fileInfo.directory + "\\" + componentInfo.fileInfo.imgName) : null,
							parameters: componentInfo.parameters,
							isLocal: true
						});
					}
					if(componentInfo.isServer) {
						list.push({
							code: componentInfo.code,
							name: componentInfo.name,
							versionNum: componentInfo.versionNum,
							imgId: componentInfo.imgId,
							isServer: true
						});
					}
				}
			}
		}
	}

	this.getCategory = function (categoryCode, categories){
		if(categories != null)
		for(let i = 0; i < categories.length; i++){
			let category = categories[i];
			if(category.code === categoryCode){
				return category;
			}
			else{
				let c = thatComponentLibrary.getCategory(categoryCode, category.children);
				if(c !== null){
					return c;
				}
			}
		}
		return null;
	}
}
export default S3dComponentLibrary