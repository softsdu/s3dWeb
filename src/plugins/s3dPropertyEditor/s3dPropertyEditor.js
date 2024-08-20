import * as THREE from "three";
import {cmnPcr, s3dViewerStatus, msgBox, s3dOperateType} from "../../commonjs/common/static.js"
import "./s3dPropertyEditor.css"

//S3dWeb 属性编辑器
let S3dPropertyEditor = function (){
	//当前对象
	const thatS3dPropertyEditor = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	this.positionPrecision = 2;
	this.rotationPrecision = 2;
	this.seniorInfoPrecision = 2;

	this.currentUnitJson = null;
	this.seniorInfoChanged = false;

	this.isProperty2DOnly = false;

	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dPropertyEditor.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dPropertyEditor.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dPropertyEditor.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	}
	 
	//初始化
	this.init = function(p){
		thatS3dPropertyEditor.containerId = p.containerId;
		thatS3dPropertyEditor.manager = p.manager;
		thatS3dPropertyEditor.isProperty2DOnly = p.config.isProperty2DOnly ? true : false;
		thatS3dPropertyEditor.showEditor(p.config.title == null ? "属性编辑器" : p.config.title);
		thatS3dPropertyEditor.refreshProperties(null);
		$("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorCloseBtn").click(function(){
			thatS3dPropertyEditor.hide();
		});
		
		//绑定事件
		//构建通用属性值改变后
        if(p.config.afterBaseInfoValueChanged != null){
        	thatS3dPropertyEditor.addEventFunction("afterBaseInfoValueChanged", p.config.afterBaseInfoValueChanged); 
        }

		if(p.config.visible){
			thatS3dPropertyEditor.show();
		}
		else{
			thatS3dPropertyEditor.hide();
		}
	}

	//隐藏非2D的属性
	this.refreshProperty2DVisible = function (isAllHidden){
		let container = $("#" + thatS3dPropertyEditor.containerId);
		if(isAllHidden || thatS3dPropertyEditor.isProperty2DOnly){
			$(container).find(".s3dPropertyEditorItemContainer[hiddenIn2D='true']").css({display: "none"});
		}
		else{
			$(container).find(".s3dPropertyEditorItemContainer[hiddenIn2D='true']").css({display: "block"});
		}
	}
	
	//隐藏
	this.hide = function(){
		$("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorContainer").css({"display": "none"});
	}
	
	//隐藏
	this.show = function(){
		$("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorContainer").css({"display": "block"});
	}
	
	//获取显示状态
	this.getVisible = function(){
		return $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorContainer").css("display") === "block";
	}
	
	//显示结构树
	this.showEditor = function(title){
		//构造html
		let editorHtml = thatS3dPropertyEditor.getEditorHtml();
		let container = $("#" + thatS3dPropertyEditor.containerId);
		$(container).append(editorHtml);
		$(container).find(".s3dPropertyEditorTitle").text(title);
		$(container).find(".s3dPropertyEditorTabHeader").click(function(){
			let tabName = $(this).attr("name");
			let container = $("#" + thatS3dPropertyEditor.containerId);
			$(container).find(".s3dPropertyEditorTabHeader").removeClass("s3dPropertyEditorTabHeaderActive");
			$(container).find(".s3dPropertyEditorTabHeader[name='" + tabName + "']").addClass("s3dPropertyEditorTabHeaderActive");
			$(container).find(".s3dPropertyEditorInfoContainer").removeClass("s3dPropertyEditorInfoContainerActive");
			$(container).find(".s3dPropertyEditorInfoContainer[name='" + tabName + "']").addClass("s3dPropertyEditorInfoContainerActive");
		});
	} 
	
	//获取editor html
	this.getEditorHtml = function(){
		return "<div class=\"s3dPropertyEditorContainer\">"
			+ "<div class=\"s3dPropertyEditorBackground\"></div>"
			+ "<div class=\"s3dPropertyEditorHeader\">"
			+ "<div class=\"s3dPropertyEditorTitle\"></div>"
			+ "<div class=\"s3dPropertyEditorSubTitle\"></div>"
			+ "<div class=\"s3dPropertyEditorTabContainer\">"
			+ "<div class=\"s3dPropertyEditorTabHeader s3dPropertyEditorTabHeaderActive\" name=\"baseInfo\">"
			+ "<div class=\"s3dPropertyEditorTabTitle\">基本信息</div>"
			+ "</div>"
			+ "<div class=\"s3dPropertyEditorTabHeader\" name=\"seniorInfo\">"
			+ "<div class=\"s3dPropertyEditorTabTitle\">高级信息</div>"
			+ "</div>"
			+ "<div class=\"s3dPropertyEditorTabHeader\" name=\"materialInfo\">"
			+ "<div class=\"s3dPropertyEditorTabTitle\">材质信息</div>"
			+ "</div>"
			+ "</div>"
			+ "<div class=\"s3dPropertyEditorCloseBtn\">×</div>"
			+ "</div>"
			+ "<div class=\"s3dPropertyEditorInnerContainer\">"
			+ "<div class=\"s3dPropertyEditorInfoContainer s3dPropertyEditorInfoContainerActive\" name=\"baseInfo\"></div>"
			+ "<div class=\"s3dPropertyEditorInfoContainer\" name=\"seniorInfo\"></div>"
			+ "<div class=\"s3dPropertyEditorInfoContainer\" name=\"materialInfo\"></div>"
			+ "</div>"
			+ "</div>";
}

//刷新属性值
this.refreshPropertyValues = function(unitJson){
    let componentInfo = unitJson.isServer ? thatS3dPropertyEditor.manager.serverObjectCreator.getComponentInfo(unitJson.code, unitJson.versionNum) : null;
    let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];

    let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='baseInfo']")[0];
    thatS3dPropertyEditor.refreshBaseInfo(unitJson, baseInfoContainer);

    let seniorInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='seniorInfo']")[0];
    thatS3dPropertyEditor.refreshSeniorInfo(unitJson, componentInfo, seniorInfoContainer);

    let materialInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='materialInfo']")[0];
    thatS3dPropertyEditor.refreshMaterialInfo(unitJson, materialInfoContainer);
}

//刷新构造属性编辑器
this.refreshProperties = function(unitJArray){
    thatS3dPropertyEditor.blur();
    let container = $("#" + thatS3dPropertyEditor.containerId);
    let propertyEditorInnerContainer = $(container).find(".s3dPropertyEditorInnerContainer")[0];
    let propertyEditorSubTitle = $(container).find(".s3dPropertyEditorSubTitle")[0];
    if(unitJArray == null || unitJArray.length === 0){
        thatS3dPropertyEditor.currentUnitJson = null;
        let infoHtml = "已选择 0 个图元";
        $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='baseInfo']").html(infoHtml);
        $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='seniorInfo']").html(infoHtml);
        $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='materialInfo']").html(infoHtml);
    }
    else if(unitJArray.length > 1){
        thatS3dPropertyEditor.currentUnitJson = null;
        let infoHtml = "已选择 " + unitJArray.length + " 个图元";
        $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='baseInfo']").html(infoHtml);
        $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='seniorInfo']").html(infoHtml);
        $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='materialInfo']").html(infoHtml);
    }
    else{
        let unitJson = unitJArray[0];
        if(thatS3dPropertyEditor.currentUnitJson == null || thatS3dPropertyEditor.currentUnitJson.id !== unitJson.id){
            thatS3dPropertyEditor.currentUnitJson = unitJson;
            thatS3dPropertyEditor.initBaseInfoContainer(propertyEditorInnerContainer, unitJson);
            thatS3dPropertyEditor.initSeniorInfoContainer(propertyEditorInnerContainer, unitJson);
            thatS3dPropertyEditor.initMaterialInfoContainer(propertyEditorInnerContainer, unitJson);
        }
    }
}

this.initSeniorInfoContainer = function(propertyEditorInnerContainer, unitJson){
    let componentInfo = unitJson.isServer ? thatS3dPropertyEditor.manager.serverObjectCreator.getComponentInfo(unitJson.code, unitJson.versionNum) : thatS3dPropertyEditor.manager.localObjectCreator.getComponentInfo(unitJson.code, unitJson.versionNum) ;
    let seniorInfoHtml = thatS3dPropertyEditor.getSeniorInfoContainerHtml(unitJson, componentInfo);
    let seniorInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='seniorInfo']")[0];
    $(seniorInfoContainer).html(seniorInfoHtml);
    thatS3dPropertyEditor.refreshSeniorInfo(unitJson, componentInfo, seniorInfoContainer);

    //数值类型属性
    let allListInputs = $(seniorInfoContainer).find(".s3dPropertyEditorItemInputList");
    $(allListInputs).change( function(e) {
        thatS3dPropertyEditor.changeSeniorInfoListValue(this);
    });

    //数值类型属性
    let allDecimalInputs = $(seniorInfoContainer).find(".s3dPropertyEditorItemInputDecimal");
    $(allDecimalInputs).bind("keypress", function(e){
        return e.key >= '0' && e.key <= '9' || e.key == '.' || e.key === '-';
    });
    $(allDecimalInputs).bind("dragenter", function(e){
        return false;
    });
    $(allDecimalInputs).bind("keydown", function(e){
        let evt = window.event || e;
        if(evt.keyCode === 13){
            thatS3dPropertyEditor.changeSeniorInfoDecimalValue(this);
        }
        return true;
    });
    $(allDecimalInputs).change( function(e) {
        thatS3dPropertyEditor.changeSeniorInfoDecimalValue(this);
    });

    //字符串类型属性
    let allStringInputs = $(seniorInfoContainer).find(".s3dPropertyEditorItemInputString");
    $(allStringInputs).bind("keydown", function(e){
        let evt = window.event || e;
        if(evt.keyCode === 13){
            thatS3dPropertyEditor.changeSeniorInfoStringValue(this);
        }
        return true;
    });
    $(allStringInputs).change( function(e) {
        thatS3dPropertyEditor.changeSeniorInfoStringValue(this);
    });

    //布尔类型属性
    let allBooleanInputs = $(seniorInfoContainer).find(".s3dPropertyEditorItemInputBoolean");
    $(allBooleanInputs).change( function(e) {
        thatS3dPropertyEditor.changeSeniorInfoBooleanValue(this);
    });

    //选点按钮
    let selectPointsInput = $(seniorInfoContainer).find(".s3dPropertyEditorItemSelectPoints");
    $(selectPointsInput).click( function(e) {
        let paramName = $(this).parent().children(".s3dPropertyEditorItemInput").attr("name");
        let unitJson = thatS3dPropertyEditor.currentUnitJson;
        let componentInfo = thatS3dPropertyEditor.manager.serverObjectCreator.getComponentInfo(unitJson.code, unitJson.versionNum);
        let param = componentInfo.parameters[paramName];
        let statusData = {
            paramName: paramName,
            locationType: param.paramType,
            nodeId: unitJson.id
        };
        if(thatS3dPropertyEditor.manager.viewer.changeStatus({
            status: s3dViewerStatus.selectPoints,
            statusData: statusData
        })){
            let pointCount = 0;
            switch(param.paramType){
                case "point2D":
                case "gisPoint2D":
                case "point3D":{
                    pointCount = 1;
                    break;
                }
                case "polyline2D":
                case "polyline2DMix":
                case "gisPolyline2D":
                case "polyline3D":{
                    pointCount = null;
                    break;
                }
            }

            let defaultValue = param.defaultValue;
            let inputValue = $(this).parent().find(".s3dPropertyEditorItemInput").val();
            let pointStr = "";
            if(defaultValue !== inputValue){
                pointStr = inputValue;
            }

            thatS3dPropertyEditor.manager.pointSelector.beginPlacePoints({
                locationType: param.paramType,
                pointCount: pointCount,
                paramInfo: {
                    nodeId: unitJson.id,
                    paramName: paramName,
                    pointStr: pointStr,
                    afterSelectPoints: thatS3dPropertyEditor.afterViewerSelectPoints
                }
            });
        }

    });

    //选择材质按钮
    selectPointsInput = $(seniorInfoContainer).find(".s3dPropertyEditorItemMaterialPicker");
    $(selectPointsInput).click( function(e) {
        let paramName = $(this).parent().children(".s3dPropertyEditorItemInput").attr("name");
        let unitJson = thatS3dPropertyEditor.currentUnitJson;
        let statusData = {
            paramName: paramName,
            nodeId: unitJson.id
        };
        if(thatS3dPropertyEditor.manager.viewer.changeStatus({
            status: s3dViewerStatus.pop,
            statusData: statusData
        })){
            let materialName = $(this).parent().find(".s3dPropertyEditorItemInput").val();

            thatS3dPropertyEditor.manager.materialPicker.showPicker({
                paramInfo: {
                    nodeId: unitJson.id,
                    paramName: paramName,
                    materialName: materialName,
                    afterPickMaterial: thatS3dPropertyEditor.afterPickMaterial
                }
            });
        }

    });

    //应用按钮
    let applyBtn = $(seniorInfoContainer).find(".s3dPropertyEditorSeniorApplyBtn")[0];
    $(applyBtn).click(function(e){
        if(thatS3dPropertyEditor.seniorInfoChanged){
            thatS3dPropertyEditor.seniorInfoChanged = false;

            let unitJson = thatS3dPropertyEditor.currentUnitJson;

            //开始记录到undo list
            thatS3dPropertyEditor.beginAddToUndoList(unitJson.id);
            let newSeniorValues = thatS3dPropertyEditor.getNewSeniorValues(unitJson);
            thatS3dPropertyEditor.manager.viewer.setObjectParameters(unitJson.id, newSeniorValues);

            /*改为造型结束后，记录undo，否则位置信息不对
            //结束记录到undo list
            thatS3dPropertyEditor.endAddToUndoList(unitJson.id, newSeniorValues);
             */
			}
			else{
				msgBox.alert({info: "请先修改高级属性值."});
			}
		});
	}

	this.initMaterialInfoContainer = function(propertyEditorInnerContainer, unitJson){
		let materialInfoHtml = unitJson.isServer ? "" : thatS3dPropertyEditor.getMaterialInfoContainerHtml(unitJson);
		let materialInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='materialInfo']")[0];
		$(materialInfoContainer).html(materialInfoHtml);

		thatS3dPropertyEditor.refreshMaterialInfo(unitJson, materialInfoContainer);

		//材质环境反射率
		let envMapIntensityInput = $(materialInfoContainer).find(".s3dPropertyEditorItemInputDecimal[name='envMapIntensity']");
		$(envMapIntensityInput).change(function(e){
			let materialName = $(this).attr("matName");
			let sourceValue = cmnPcr.strToDecimal($(this).attr("sourceValue"));
			let str = $(this).val().trim();
			let hasChange = false;
			let newValue = null;
			let minValue = 0;
			let maxValue = 1;
			if (str.length === 0) {
				hasChange = sourceValue.length !== 0;
			}
			else{
				let precision = thatS3dPropertyEditor.seniorInfoPrecision;
				if(cmnPcr.isDecimal(str)){
					newValue = cmnPcr.toFixed(str, precision);
					if(newValue < minValue){
						newValue = minValue;
						$(this).val(newValue);
					}
					else if(newValue > maxValue){
						newValue = maxValue;
						$(this).val(newValue);
					}
					else{
						$(this).attr("sourceValue", newValue);
						$(this).val(newValue);
						if(sourceValue !== newValue){
							hasChange = true;
						}
					}
				}
				else{
					newValue = sourceValue;
					$(this).val(newValue);
				}
			}

			if (hasChange) {
				let unitId = thatS3dPropertyEditor.currentUnitJson.id;
				thatS3dPropertyEditor.changeLocalObject3DMaterialPropertyValue(unitId, materialName, "envMapIntensity", newValue);
			}
		});

		//材质颜色
		let colorInput = $(materialInfoContainer).find(".s3dPropertyEditorItemInputDecimal[name='color']");
		$(colorInput).change(function(e){
			let materialName = $(this).attr("matName");
			let sourceValue = $(this).attr("sourceValue");
			let newValue = $(this).val().trim();
			let hasChange = false;
			if (newValue.length === 0) {
				hasChange = sourceValue.length !== 0;
			}
			else {
				$(this).attr("sourceValue", newValue);
				$(this).val(newValue);
				if (sourceValue !== newValue) {
					hasChange = true;
				}
			}

			if (hasChange) {
				let unitId = thatS3dPropertyEditor.currentUnitJson.id;
				thatS3dPropertyEditor.changeLocalObject3DMaterialPropertyValue(unitId, materialName, "color", newValue);
			}
		});

		//设置本地构件材质属性值
		this.changeLocalObject3DMaterialPropertyValue = function (unitId, materialName, propertyName, propertyValue){
			let unitObject3D = thatS3dPropertyEditor.manager.viewer.allObject3DMap[unitId];
			let unitInfo = unitObject3D.userData.unitInfo;
			if(unitInfo.materials == null){
				unitInfo.materials = {};
			}
			let materialInfo = unitInfo.materials[materialName];
			if(materialInfo == null) {
				materialInfo = {};
				unitInfo.materials[materialName] = materialInfo;
			}
			if (propertyValue == null || propertyValue.length === 0) {
				delete materialInfo[propertyName];
			}
			else{
				materialInfo[propertyName] = propertyValue;
			}
			return thatS3dPropertyEditor.manager.localObjectCreator.setLocalObject3DMaterialPropertyValue(unitObject3D, unitInfo, materialName, propertyName, propertyValue);
		}

		//选择材质按钮
		let selectPointsInput = $(materialInfoContainer).find(".s3dPropertyEditorItemMaterialPicker");
		$(selectPointsInput).click( function(e) {
			let paramName = $(this).parent().children(".s3dPropertyEditorItemInput").attr("matName");
			let unitJson = thatS3dPropertyEditor.currentUnitJson;
			let statusData = {
				paramName: paramName,
				nodeId: unitJson.id
			};
			if(thatS3dPropertyEditor.manager.viewer.changeStatus({
				status: s3dViewerStatus.pop,
				statusData: statusData
			})){
				let materialName = $(this).parent().find(".s3dPropertyEditorItemInput").val();

				thatS3dPropertyEditor.manager.localMaterialPicker.showPicker({
					paramInfo: {
						nodeId: unitJson.id,
						paramName: paramName,
						materialName: materialName,
						afterPickMaterial: thatS3dPropertyEditor.afterPickLocalMaterial
					}
				});
			}

		});
	}

	this.afterViewerSelectPoints = function(p){
		let points = p.points;
		let paramName  = p.paramInfo.paramName; 
		if(thatS3dPropertyEditor.currentUnitJson != null && thatS3dPropertyEditor.currentUnitJson.id === p.paramInfo.nodeId){
			let paramValue = "";
			switch(p.locationType){ 
				case "point2D": 
				case "gisPoint2D":{
					let point = points[0];
					paramValue = cmnPcr.toFixed(common3DFunction.m2mm(point.x), thatS3dPropertyEditor.positionPrecision)
						+ "," + cmnPcr.toFixed(common3DFunction.m2mm(point.z), thatS3dPropertyEditor.positionPrecision);
					break;
				}
				case "point3D":{
					let point = points[0];
					paramValue = cmnPcr.toFixed(common3DFunction.m2mm(point.x), thatS3dPropertyEditor.positionPrecision) 
						+ "," + cmnPcr.toFixed(common3DFunction.m2mm(point.y), thatS3dPropertyEditor.positionPrecision)
						+ "," + cmnPcr.toFixed(common3DFunction.m2mm(point.z), thatS3dPropertyEditor.positionPrecision);
					break;
				}
				case "polyline2D":
				case "gisPolyline2D":{
					for(let i = 0; i < points.length; i++){
						if(i !== 0){
							paramValue += ";";
						}
						let point = points[i];
						paramValue += cmnPcr.toFixed(common3DFunction.m2mm(point.x), thatS3dPropertyEditor.positionPrecision)  
							+ "," + cmnPcr.toFixed(common3DFunction.m2mm(point.z), thatS3dPropertyEditor.positionPrecision);
					}
					break;
				} 
				case "polyline2DMix":{
					for(let i = 0; i < points.length; i++){
						if(i !== 0){
							paramValue += ";";
						}
						let point = points[i];
						paramValue += cmnPcr.toFixed(common3DFunction.m2mm(point.x), thatS3dPropertyEditor.positionPrecision)  
							+ "," + cmnPcr.toFixed(common3DFunction.m2mm(point.z), thatS3dPropertyEditor.positionPrecision)
							+ (point.isCurve ? ",b" : "");
					}
					break;
				} 
				case "polyline3D":{
					for(let i = 0; i < points.length; i++){
						if(i !== 0){
							paramValue += ";";
						}
						let point = points[i];
						paramValue += cmnPcr.toFixed(common3DFunction.m2mm(point.x), thatS3dPropertyEditor.positionPrecision)  
							+ "," + cmnPcr.toFixed(common3DFunction.m2mm(point.y), thatS3dPropertyEditor.positionPrecision)
							+ "," + cmnPcr.toFixed(common3DFunction.m2mm(point.z), thatS3dPropertyEditor.positionPrecision);
					}
					break;
				}
			}
			let componentInfo = thatS3dPropertyEditor.manager.serverObjectCreator.getComponentInfo(thatS3dPropertyEditor.currentUnitJson.code, thatS3dPropertyEditor.currentUnitJson.versionNum);
			let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
			let seniorInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='seniorInfo']")[0];
			let input = $(seniorInfoContainer).find(".s3dPropertyEditorItemInput[name='" + paramName + "']")[0];
			let sourceValue = $(input).attr("sourceValue"); 
			thatS3dPropertyEditor.setSeniorValue(paramName, paramValue, componentInfo, seniorInfoContainer);
			thatS3dPropertyEditor.seniorInfoValueChange(paramName, sourceValue, paramValue);
			thatS3dPropertyEditor.manager.viewer.changeStatus({
				status: s3dViewerStatus.normalView
			})
		}
	}

	this.afterPickMaterial = function(p){
		let paramValue = p.materialName;
		let paramName  = p.paramInfo.paramName;
		let componentInfo = thatS3dPropertyEditor.manager.serverObjectCreator.getComponentInfo(thatS3dPropertyEditor.currentUnitJson.code, thatS3dPropertyEditor.currentUnitJson.versionNum);
		let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
		let seniorInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='seniorInfo']")[0];
		let input = $(seniorInfoContainer).find(".s3dPropertyEditorItemInput[name='" + paramName + "']")[0];
		let sourceValue = $(input).attr("sourceValue");
		thatS3dPropertyEditor.setSeniorValue(paramName, paramValue, componentInfo, seniorInfoContainer);
		thatS3dPropertyEditor.seniorInfoValueChange(paramName, sourceValue, paramValue);
		thatS3dPropertyEditor.manager.viewer.changeStatus({
			status: s3dViewerStatus.normalView
		})
	}

	this.afterPickLocalMaterial = function(p){
		let newMaterialName = p.materialName;
		let sourceMaterialName = p.paramInfo.paramName;
		let unitId = p.paramInfo.nodeId;
		let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
		let materialInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='materialInfo']")[0];
		let newMaterial = thatS3dPropertyEditor.changeLocalObject3DMaterial(unitId, sourceMaterialName, newMaterialName);
		thatS3dPropertyEditor.setMaterialValue(sourceMaterialName, newMaterialName, newMaterial, materialInfoContainer);
	}

	//设置本地构件材质
	this.changeLocalObject3DMaterial = function (unitId, sourceMaterialName, newMaterialName){
		let unitObject3D = thatS3dPropertyEditor.manager.viewer.allObject3DMap[unitId];
		let unitInfo = unitObject3D.userData.unitInfo;
		if(unitInfo.materials == null){
			unitInfo.materials = {};
		}
		let materialInfo = unitInfo.materials[sourceMaterialName];
		if(materialInfo == null) {
			materialInfo = {};
			unitInfo.materials[sourceMaterialName] = materialInfo;
		}
		if (newMaterialName == null || newMaterialName.length === 0) {
			delete materialInfo.name;
		}
		else{
			materialInfo.name = newMaterialName;
		}
		return thatS3dPropertyEditor.manager.localObjectCreator.setLocalObject3DMaterial(unitObject3D, unitInfo, sourceMaterialName, newMaterialName);
	}

	this.setMaterialValue = function(sourceMaterialName, newMaterialName, newMaterial, materialInfoContainer){
		let input = $(materialInfoContainer).find(".s3dPropertyEditorItemInput[matName='" + sourceMaterialName + "'][name='material']");
		$(input).val(newMaterialName);

		let btn = $(input).parent().find(".s3dPropertyEditorItemMaterialPicker");
		let colorStr = cmnPcr.getColorStrByFloatArray([newMaterial.color.r, newMaterial.color.g, newMaterial.color.b]);
		$(btn).css("background-color", colorStr);
	}

	this.getNewSeniorValues = function(unitJson) {
		let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
		let seniorInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='seniorInfo']")[0];
		let seniorValues = {};
		let componentInfo;
		if (unitJson.isServer) {
			componentInfo = thatS3dPropertyEditor.manager.serverObjectCreator.getComponentInfo(unitJson.code, unitJson.versionNum);
		} else {
			componentInfo = thatS3dPropertyEditor.manager.localObjectCreator.getComponentInfo(unitJson.code, unitJson.versionNum);
		}
		for (let paramName in componentInfo.parameters) {
			let param = componentInfo.parameters[paramName];
			let value = null;
			if(param.isEditable) {
				let input = $(seniorInfoContainer).find(".s3dPropertyEditorItemInput[name='" + paramName + "']")[0];
				let valueStr = $(input).val();
				if (valueStr == null) {
					valueStr = "";
				}

				switch (param.paramType) {
					case "string":
					case "material": {
						value = valueStr;
						break;
					}
					case "boolean": {
						value = $(input).prop("checked");
						break;
					}
					case "decimal": {
						valueStr = valueStr.trim();
						value = valueStr.length === 0 ? null : cmnPcr.strToDecimal(valueStr);
						break;
					}
					default: {
						value = valueStr;
						break;
					}
				}
			}
			else{
				let unitParam = unitJson.parameters[paramName];
				if(unitParam == null){
					switch (param.paramType) {
						case "string":
						case "material": {
							value = "";
							break;
						}
						case "boolean": {
							value = null;
							break;
						}
						case "decimal": {
							value = null;
							break;
						}
						default: {
							value = "";
							break;
						}
					}
				}
				else{
					value = unitParam.value;
				}
			}
			seniorValues[paramName] = {
				value: value
			};
		}
		return seniorValues;
	}

	this.initBaseInfoContainer = function(propertyEditorInnerContainer, unitJson){
		let baseInfoHtml = thatS3dPropertyEditor.getBaseInfoContainerHtml(unitJson);
		let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='baseInfo']")[0];
		$(baseInfoContainer).html(baseInfoHtml);
		thatS3dPropertyEditor.refreshBaseInfo(unitJson, baseInfoContainer);

		//名称属性
		let nameInput = $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='name']")[0];
		$(nameInput).change(function(e){
			thatS3dPropertyEditor.changeBaseInfoNameValue(this);
		});

		//useWorldPosition
		let useWorldPositionInput = $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='useWorldPosition']")[0];
		$(useWorldPositionInput).change(function(e){
			thatS3dPropertyEditor.changeBaseInfoUseWorldPositionValue(this);
		});


		//位置、旋转属性
		let allDecimalInputs = $(baseInfoContainer).find(".s3dPropertyEditorItemInputDecimal");
		$(allDecimalInputs).bind("keypress", function(e){
			return event.key >= '0' && event.key <= '9' || event.key === '.' || event.key === '-';
		}); 
		$(allDecimalInputs).bind("dragenter", function(e){
			return false;
		}); 
		$(allDecimalInputs).bind("keydown", function(e){
			let evt = window.event || e;
			if(evt.keyCode === 13){
				thatS3dPropertyEditor.changeBaseInfoDecimalValue(this);
			}
			return true;
		}); 
		$(allDecimalInputs).change( function(e) {
			thatS3dPropertyEditor.changeBaseInfoDecimalValue(this);
		}); 
	}

	this.blur = function(){
		let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
		$(propertyEditorInnerContainer).find(".s3dPropertyEditorItemInput").blur();
		if(thatS3dPropertyEditor.seniorInfoChanged){
			msgBox.alert({info: "修改高级属性后未点击应用按钮, 系统放弃编辑结果."});
			thatS3dPropertyEditor.seniorInfoChanged = false;
		}
	}

	//当name属性改变时
	this.changeBaseInfoNameValue = function(input){
		let str = $(input).val().trim();
		let sourceValue = $(input).attr("sourceValue");
		if(str.length === 0){
			$(input).val(sourceValue);
		}
		else if(str !== sourceValue){
			if(thatS3dPropertyEditor.manager.viewer.checkUnitName(str)){
				//重名
				msgBox.alert({info: "与其它图元重名"});
				$(input).val(sourceValue);
			}
			else{
				$(input).attr("sourceValue", str);
				let baseInfoName =$(input).attr("name");
				thatS3dPropertyEditor.baseInfoValueChange(baseInfoName, sourceValue, str);
			}
		}
	}

	//当下拉的高级属性改变时
	this.changeSeniorInfoListValue = function(input){
		let itemContainer = $(input).parent().parent()[0];
		let seniorInfoName = $(input).attr("name");
		let str = $(input).val().trim();
		let newValue = null;
		let paramType = $(itemContainer).attr("paramType");
		let sourceValue = $(input).attr("sourceValue");
		switch(paramType){
			case "string":
			case "material":{
				newValue = str;
				break;
			}
			case "boolean":{
				newValue = str === "是" || str.toUpperCase() === "TRUE" || str.toUpperCase() === "Y" ? "Y" : "N";
				break;
			}
			case "decimal":{				
				newValue = cmnPcr.strToDecimal(str);
				break;
			}
			default:{
				newValue = str;
				break;
			}
		}
		thatS3dPropertyEditor.seniorInfoValueChange(seniorInfoName, sourceValue, newValue);
	}

	//当Decimal类型高级属性改变时
	this.changeSeniorInfoDecimalValue = function(input){
		let itemContainer = $(input).parent().parent()[0];
		let seniorInfoName = $(input).attr("name");
		let minValueStr = $(itemContainer).attr("minValue").trim();
		let maxValueStr = $(itemContainer).attr("maxValue").trim();
		let minValue = minValueStr.length === 0 ? null : cmnPcr.strToDecimal(minValueStr);
		let maxValue = maxValueStr.length === 0 ? null : cmnPcr.strToDecimal(maxValueStr);
		let isNullable = $(itemContainer).attr("isNullable") === "true";
		let sourceValue = cmnPcr.strToDecimal($(input).attr("sourceValue"));
		let str = $(input).val().trim();
		let hasChange = false;
		let newValue = null;
		if (str.length === 0) {
			if(isNullable){
				hasChange = sourceValue.length !== 0;
			}
			else{
				$(input).val(sourceValue);
			}
		}  
		else{
			let precision = thatS3dPropertyEditor.seniorInfoPrecision;
			if(cmnPcr.isDecimal(str)){
				newValue = cmnPcr.toFixed(str, precision);
				if(minValue != null && newValue < minValue){
					newValue = minValue;
					$(input).val(newValue);
					msgBox.alert({info: "属性 " + seniorInfoName + " 的值不能小于" + minValue});
				}
				else if(maxValue != null && newValue > maxValue){
					newValue = maxValue;
					$(input).val(newValue);
					msgBox.alert({info: "属性 " + seniorInfoName + " 的值不能大于" + maxValue});
				}
				else{
					$(input).attr("sourceValue", newValue);
					$(input).val(newValue);
					if(sourceValue !== newValue){
						hasChange = true;
					}
				}
			}
			else{
				newValue = sourceValue;
				$(input).val(newValue);
			} 
		}

		if (hasChange) {
			thatS3dPropertyEditor.seniorInfoValueChange(seniorInfoName, sourceValue, newValue);
		} 
	}

	//当String类型高级属性改变时
	this.changeSeniorInfoStringValue = function(input){
		let itemContainer = $(input).parent().parent()[0];
		let seniorInfoName = $(input).attr("name");
		let isNullable = $(itemContainer).attr("isNullable") === "true";
		let sourceValue = $(input).attr("sourceValue");
		let newValue = $(input).val();
		let hasChange = false;
		if (newValue.length === 0) {
			if(isNullable){
				hasChange = sourceValue.length !== 0;
				$(input).attr("sourceValue", "");
			}
			else{
				$(input).val(sourceValue);
			}
		}  
		else{
			if(sourceValue !== newValue){
				$(input).attr("sourceValue", newValue);
				hasChange = true;
			}
		}

		if (hasChange) {
			thatS3dPropertyEditor.seniorInfoValueChange(seniorInfoName, sourceValue, newValue);
		} 
	}

	//当Boolean类型高级属性改变时
	this.changeSeniorInfoBooleanValue = function(input){
		let itemContainer = $(input).parent().parent()[0];
		let seniorInfoName = $(input).attr("name");
		let checked = $(input).prop("checked")  
		thatS3dPropertyEditor.seniorInfoValueChange(seniorInfoName, !checked, checked); 
	}

	//当位置、旋转属性改变时
	this.changeBaseInfoDecimalValue = function(input){
		let str = $(input).val();
		if (cmnPcr.trim(str) === "") {
			str = "0";
		}  

		let hasChange = false;
		let newValue = null;
		let precision = cmnPcr.strToDecimal($(input).attr("precision"));
		let sourceValue = cmnPcr.strToDecimal($(input).attr("sourceValue"));
		if(cmnPcr.isDecimal(str)){
			newValue = cmnPcr.toFixed(str, precision);
			$(input).attr("sourceValue", newValue);
			$(input).val(newValue);
			if(sourceValue !== newValue){
				hasChange = true;
			}
		}
		else{
			newValue = sourceValue;
			$(input).val(newValue);
		} 

		let baseInfoName =$(input).attr("name");
		if (hasChange) {
			thatS3dPropertyEditor.baseInfoValueChange(baseInfoName, sourceValue, newValue);
		} 
	}

	//当useWorldPosition属性改变时
	this.changeBaseInfoUseWorldPositionValue = function(input){
		let checked = $(input).prop("checked");
		let baseInfoName =$(input).attr("name"); 
		thatS3dPropertyEditor.baseInfoValueChange(baseInfoName, !checked, checked); 
	}

	//高级属性改变
	this.seniorInfoValueChange = function(seniorInfoName, oldValue, newValue){
		thatS3dPropertyEditor.seniorInfoChanged = true;
		$("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorSeniorApplyBtn").addClass("s3dPropertyEditorSeniorApplyBtnChanged");
	}

	//开启添加到undo list
	this.beginAddToUndoList = function(nodeId){
		let nodeJsons = {};
		let tree = thatS3dPropertyEditor.manager.treeEditor.getTreeJson();		
		nodeJsons[nodeId] = thatS3dPropertyEditor.manager.viewer.cloneJsonById(nodeId);
		thatS3dPropertyEditor.manager.statusBar.beginAddToUndoList({
			operateType: s3dOperateType.edit,
			tree: tree,
			nodeJsons: nodeJsons
		});
	}

	//结束添加到undo list
	this.endAddToUndoList = function(nodeId, seniorInfoParameters){
		let nodeJsons = {};
		let tree = thatS3dPropertyEditor.manager.treeEditor.getTreeJson();		
		let nodeJson = thatS3dPropertyEditor.manager.viewer.cloneJsonById(nodeId);
		if(seniorInfoParameters != null){
			for(let paramName in seniorInfoParameters){
				nodeJson.parameters[paramName].value = seniorInfoParameters[paramName].value;
			}
		}
		nodeJsons[nodeId] = nodeJson;
		thatS3dPropertyEditor.manager.statusBar.endAddToUndoList({
			operateType: s3dOperateType.edit,
			tree: tree,
			nodeJsons: nodeJsons
		});
	}

	//静默改变属性值
	this.changeObjectInfoInSilence = function(nodeJsons){
		for(let nodeId in nodeJsons){
			let nodeJson = nodeJsons[nodeId];
			if(nodeJson.isServer){
				let newNodeJsons = {};
				newNodeJsons[nodeId] = nodeJson;
				thatS3dPropertyEditor.manager.viewer.removeObjectsInSilence(newNodeJsons);
				thatS3dPropertyEditor.manager.viewer.addNewObjectsInSilence(newNodeJsons);
			}
			else{
				let newNodeJsons = {};
				newNodeJsons[nodeId] = nodeJson;
				thatS3dPropertyEditor.manager.viewer.removeObjectsInSilence(newNodeJsons);
				thatS3dPropertyEditor.manager.viewer.addNewObjectsInSilence(newNodeJsons);
			}
		}
	}

	//基本属性改变
	this.baseInfoValueChange = function(baseInfoName, oldValue, newValue){
		let nodeId = thatS3dPropertyEditor.currentUnitJson.id;
		
		switch(baseInfoName){
			case "name":{
				//开始记录到undo list
				thatS3dPropertyEditor.beginAddToUndoList(nodeId);

				//名称
				thatS3dPropertyEditor.manager.treeEditor.changeNodeName(nodeId, newValue);
				thatS3dPropertyEditor.manager.viewer.changeObject3DName(nodeId, newValue);
		
				//结束记录到undo list
				thatS3dPropertyEditor.endAddToUndoList(nodeId);
				break;
			}
			case "posX":
			case "posY":
			case "posZ":
			case "rotX":
			case "rotY":
			case "rotZ":
			case "useWorldPosition":{
				//开始记录到undo list
				thatS3dPropertyEditor.beginAddToUndoList(nodeId);

				let newPosition = thatS3dPropertyEditor.getNewPosition();
				let newRotation = thatS3dPropertyEditor.getNewRotation();
				let newUseWorldPosition = thatS3dPropertyEditor.getNewUseWorldPosition(); 
				thatS3dPropertyEditor.manager.viewer.setObjectPositionRotationById(nodeId, newUseWorldPosition, newPosition, newRotation);
				let nodeJson = thatS3dPropertyEditor.manager.viewer.getNodeJson(nodeId);
				thatS3dPropertyEditor.manager.moveHelper.attach([nodeJson]);
				thatS3dPropertyEditor.afterChangeUseWorldPosition(newUseWorldPosition);
				thatS3dPropertyEditor.refreshBaseInfoDecimalValues(nodeJson);
		
				//结束记录到undo list
				thatS3dPropertyEditor.endAddToUndoList(nodeId);
				break;
			}
			default:{
				break;
			}
		}
		
		//当通用属性值改变后 added by ls 20220922
    	thatS3dPropertyEditor.doEventFunction("afterBaseInfoValueChanged", {
			nodeId: nodeId,
    		propertyName: baseInfoName,
    		oldValue: oldValue,
			newValue: newValue
    	});
	}

	this.getNewPosition = function(){
		let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
		let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='baseInfo']")[0];
		let posX = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='posX']").val());
		let posY = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='posY']").val());
		let posZ = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='posZ']").val());
		return {
			x: common3DFunction.mm2m(posX),
			y: common3DFunction.mm2m(posY),
			z: common3DFunction.mm2m(posZ)
		};
	}

	this.getNewRotation = function(){
		let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
		let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='baseInfo']")[0];
		let rotX = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='rotX']").val());
		let rotY = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='rotY']").val());
		let rotZ = cmnPcr.strToDecimal($(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='rotZ']").val());
		return {
			x: common3DFunction.degree2radian(rotX),
			y: common3DFunction.degree2radian(rotY),
			z: common3DFunction.degree2radian(rotZ)
		};
	}

	this.getNewUseWorldPosition = function(){
		let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
		let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='baseInfo']")[0];
		return $(baseInfoContainer).find(".s3dPropertyEditorItemInput[name='useWorldPosition']").prop("checked");
	}

	this.refreshSeniorInfo = function(unitJson, componentInfo, seniorInfoContainer){
		if(componentInfo == null){
			for(let paramName in unitJson.parameters){
				let paramValue = unitJson.parameters[paramName].value;
				let input = $(seniorInfoContainer).find(".s3dPropertyEditorItemInput[name='" + paramName + "']");
				$(input).val(paramValue);
				$(input).attr("sourceValue", paramValue);
			}
		}
		else{
			for(let paramName in unitJson.parameters){
				let paramValue = unitJson.parameters[paramName].value;
				this.setSeniorValue(paramName, paramValue, componentInfo, seniorInfoContainer);
			}
		}
	}

	this.refreshMaterialInfo = function(unitJson, materialInfoContainer){
	}

	this.setSeniorValue = function(paramName, paramValue, componentInfo, seniorInfoContainer){
		let comParam = componentInfo.parameters[paramName];
		let input = $(seniorInfoContainer).find(".s3dPropertyEditorItemInput[name='" + paramName + "']");
		if($(input).hasClass("s3dPropertyEditorItemInputReadonly")){
			$(input).text(paramValue);
		}
		else{
			if($(input).hasClass("s3dPropertyEditorItemInputList")){
				//处理下拉值类型是decimal的情况
				if(comParam.paramType === "decimal"){
					let options = $(input).children("option");
					for(let i = 0; i < options.length; i++){
						let opValueStr = $(options[i]).text();
						let opValue = cmnPcr.strToDecimal(opValueStr);
						if(paramValue === opValue){
							$(input).val(opValueStr);
							$(input).attr("sourceValue", opValueStr);
							break;
						}
					}
				}
			}
			else{
				if(comParam.paramType === "boolean"){
					$(input).prop("checked", paramValue);
					$(input).attr("sourceValue", paramValue);
				}
				else{
					$(input).val(paramValue);
					$(input).attr("sourceValue", paramValue);
				}
			}
		}
	}

	this.isSpecialParameter = function(listValues){
		if(listValues.startWith("trigger:") || listValues.startWith("pop:") || listValues.startWith("list:")){
			return true;	
		}
		else{
			return false;
		}
	}

	this.getSeniorInfoContainerHtml = function(unitJson, componentInfo){
		let html = "";
		if(componentInfo != null){
			let allGroups = thatS3dPropertyEditor.sortAllGroupParameters(componentInfo.parameters);
			for(let i = 0; i < allGroups.length; i++){
				let groupJson = allGroups[i];
				html = html + "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"" + (groupJson.name == null ? "" : groupJson.name) + "\">"
					+ "<div class=\"s3dPropertyEditorItemGroup\"><div class=\"s3dPropertyEditorItemGroupTitle\">" + cmnPcr.html_encode(groupJson.name == null || groupJson.name.length == 0 ? "默认分组" : groupJson.name) + "</div></div>"
					+ "</div>";
				for(let j = 0; j < groupJson.parameters.length; j++){
					let param = groupJson.parameters[j];
					html = html + "<div class=\"s3dPropertyEditorItemContainer\""
						+ "paramType=\"" + param.paramType + "\" "
						+ "isNullable=\"" + (param.isNullable ? "true" : "false") + "\" "
						+ "minValue=\"" + param.minValue + "\" "
						+ "maxValue=\"" + param.maxValue + "\" "
						+ "><div class=\"s3dPropertyEditorItemTitle\">" + cmnPcr.html_encode(param.name) + "</div>";
					if(!param.isEditable){
						html = html + "<div class=\"s3dPropertyEditorItemValue\"><div name=\"" + param.name + "\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputReadonly\" ></div></div>"
					}
					else if(param.listValues.length > 0 && !thatS3dPropertyEditor.isSpecialParameter(param.listValues)){
						html = html + "<div class=\"s3dPropertyEditorItemValue\"><select type=\"text\" name=\"" + param.name + "\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputList\" >";
						let listValues = param.listValues.split(",");
						for(let k = 0; k < listValues.length; k++){
							let listValue = listValues[k];
							html = html + "<option value=\"" + listValue + "\" >" + cmnPcr.html_encode(listValue) + "</option>";
						}
						html = html + "</select></div>";
					}
					else{
						switch(param.paramType){
							case "string":{
								html = html + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"text\" name=\"" + param.name + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputString\" /></div>"
								break;
							}
							case "boolean":{
								html = html + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"checkbox\" name=\"" + param.name + "\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputBoolean\" /></div>"
								break;
							}
							case "decimal":{
								html = html + "<div class=\"s3dPropertyEditorItemValue\"><input type=\"text\" name=\"" + param.name + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal\" /></div>"
								break;
							}
							case "material":{
								html = html
									+ "<div class=\"s3dPropertyEditorItemValue\">"
									+ "<input type=\"text\" name=\"" + param.name + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputString s3dPropertyEditorItemInputPop\" />"
									+ "<div class=\"s3dPropertyEditorItemPop s3dPropertyEditorItemMaterialPicker\"></div>"
									+ "</div>"
								break;
							}
							case "point2D":
							case "point3D":
							case "polyline2D":
							case "polyline2DMix":
							case "polyline3D":
							case "gisPoint2D":
							case "gisPolyline2D":{
								html = html
									+ "<div class=\"s3dPropertyEditorItemValue\">"
									+ "<input type=\"text\" name=\"" + param.name + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputString s3dPropertyEditorItemInputPop\" />"
									+ "<div class=\"s3dPropertyEditorItemPop s3dPropertyEditorItemSelectPoints\"></div>"
									+ "</div>"
								break;
							}
							default:{
								html = html + "<div class=\"s3dPropertyEditorItemValue\"><div type=\"text\" name=\"" + param.name + "\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputReadonly\"></div></div>"
								break;
							}
						}
					}
					html = html +  "</div>";
				}
			}
		}
		else {
			let html = ""
				//标识
				+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"default\">"
				+ "<div class=\"s3dPropertyEditorItemGroup\"><div class=\"s3dPropertyEditorItemGroupTitle\">默认分组</div></div>"
				+ "</div>";
			for(let paramName in unitJson.parameters){
				html = html + "<div class=\"s3dPropertyEditorItemContainer\">"
					+ "<div class=\"s3dPropertyEditorItemTitle\">" + cmnPcr.html_encode(paramName) + "</div>"
					+ "<div class=\"s3dPropertyEditorItemValue\"><input type=\"text\" name=\"" + paramName + "\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputString\" /></div>"
					+ "</div>";
			}
		}
		html = html + "<div class=\"s3dPropertyEditorBottomContainer\">"
			+ "<div class=\"s3dPropertyEditorItemBottom\"><div class=\"s3dPropertyEditorSeniorApplyBtn\">应用</div></div>"
			+ "</div>";
		return html;
	}

	this.getMaterialInfoContainerHtml = function(unitJson){
		let resourceDirectory = unitJson.parameters["文件夹"].value;
		let resourceFileName = unitJson.parameters["文件名"].value;
		let resourcePartName = unitJson.parameters["组成部分"].value;
		let resourceType = unitJson.parameters["类型"].value;
		let unitMaterialHash = unitJson.materials;
		let resourceKey = thatS3dPropertyEditor.manager.object3DCache.getResourceObject3DKey(resourceDirectory + "\\" + resourceFileName, resourceType);
		let resourceObjectInfo = thatS3dPropertyEditor.manager.object3DCache.getResourceObject3D(resourceKey);
		let materialInfo = resourceObjectInfo.materialInfo;
		let html = "";
		if(materialInfo != null) {
			let partMaterialNameHash = {};
			let pathHash = materialInfo.pathHash;
			for(let path in pathHash){
				if(resourcePartName == null || resourcePartName.length === 0 || path.startWith(resourcePartName)) {
					let pathMaterials = pathHash[path];
					for(let i = 0; i < pathMaterials.length; i++){
						let materialName = pathMaterials[i];
						if(!partMaterialNameHash[materialName]){
							partMaterialNameHash[materialName] = true;
						}
					}
				}
			}

			let materialHash = materialInfo.materialHash;
			for (let name in materialHash) {
				if (partMaterialNameHash[name]) {
					let matInfo = materialHash[name];
					let colorStr;

					if(name === "cheqi"){
						let a = 0;
					}
					//查看是否已制定替换material
					let destMaterialInfo = unitMaterialHash == null || unitMaterialHash[name] == null ? null : unitMaterialHash[name];
					let destMaterialName = destMaterialInfo == null ? "" : (destMaterialInfo.name == null ? "" : destMaterialInfo.name);
					if(destMaterialName.length === 0){
						colorStr = cmnPcr.getColorStrByFloatArray([matInfo.color.r, matInfo.color.g, matInfo.color.b]);
					}
					else{
						let materialInfo = thatS3dPropertyEditor.manager.localMaterials.getMaterialInfo(destMaterialName);
						colorStr = cmnPcr.getColorStr(materialInfo.color);
					}
					html = html + "<div class=\"s3dPropertyEditorItemContainer\" matName=\"" + matInfo.name +"\">"
						+ "<div class=\"s3dPropertyEditorItemGroup\"><div class=\"s3dPropertyEditorItemGroupTitle\">" + cmnPcr.html_encode(matInfo.name) + "</div></div>"
						+ "</div>";

					html = html + "<div class=\"s3dPropertyEditorItemContainer\">"
						+ "<div class=\"s3dPropertyEditorItemTitle\">替代材质</div>"
						+ "<div class=\"s3dPropertyEditorItemValue\">"
						+ "<input type=\"text\" matName=\"" + matInfo.name + "\" name=\"material\" matId=\"" + matInfo.id + "\" autocomplete=\"off\" "
						+ "class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputString s3dPropertyEditorItemInputPop\""
						+ " value=\"" + destMaterialName + "\" />"
						+ "<div class=\"s3dPropertyEditorItemPop s3dPropertyEditorItemMaterialPicker\" style=\"background-color:" + colorStr + "\"></div>"
						+ "</div>"
						+ "</div>";

					let color = destMaterialInfo == null || destMaterialInfo.color == null ? "" : destMaterialInfo.color;
					html = html + "<div class=\"s3dPropertyEditorItemContainer\">"
						+ "<div class=\"s3dPropertyEditorItemTitle\">颜色</div>"
						+ "<div class=\"s3dPropertyEditorItemValue\">"
						+ "<input type=\"text\" sourceValue=\"" + color + "\" matName=\"" + matInfo.name + "\" name=\"color\" matId=\"" + matInfo.id + "\" autocomplete=\"off\" "
						+ "class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal\""
						+ " value=\"" + color + "\" />"
						+ "</div>"
						+ "</div>";

					let envMapIntensity = destMaterialInfo == null || destMaterialInfo.envMapIntensity == null ? "" : destMaterialInfo.envMapIntensity;
					html = html + "<div class=\"s3dPropertyEditorItemContainer\">"
						+ "<div class=\"s3dPropertyEditorItemTitle\">环境反射率</div>"
						+ "<div class=\"s3dPropertyEditorItemValue\">"
						+ "<input type=\"text\" sourceValue=\"" + envMapIntensity + "\" matName=\"" + matInfo.name + "\" name=\"envMapIntensity\" matId=\"" + matInfo.id + "\" autocomplete=\"off\" "
						+ "class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal\""
						+ " value=\"" + envMapIntensity + "\" />"
						+ "</div>"
						+ "</div>";
				}
			}
		}
		return html;
	}

	//参数的组、组内参数排序
	this.sortAllGroupParameters = function(parameters){		
		let allGroups = [];
		let groupJsonMap = {};
		for(let paramName in parameters){
			let param = parameters[paramName];
			let groupName = param.groupName;
			let groupJson = null;
			if(groupJsonMap[groupName] == null){
				groupJson = {
					name: groupName,
					parameters: []
				};
				groupJsonMap[groupName] = groupJson;
				let tempAllGroups = [];
				let groupAdded = false;
				for(let i = 0; i < allGroups.length; i++){
					let tempGroup = allGroups[i];
					if(tempGroup.name > groupName && !groupAdded){
						tempAllGroups.push(groupJson);
						groupAdded = true;
					}
					tempAllGroups.push(tempGroup);
				}
				if(!groupAdded){
					tempAllGroups.push(groupJson);
				}
				allGroups = tempAllGroups;
			}
			else{
				groupJson = groupJsonMap[groupName];
			}
			
			let tempGroupParameters = [];
			let paramAdded = false;
			for(let i = 0; i < groupJson.parameters.length; i++){
				let tempParam = groupJson.parameters[i];
				if(tempParam.name > paramName && !paramAdded){
					tempGroupParameters.push(param);
					paramAdded = true;
				}
				tempGroupParameters.push(tempParam);
			}
			if(!paramAdded){
				tempGroupParameters.push(param);
			}
			groupJson.parameters = tempGroupParameters;
		}
		return allGroups;
	}

	this.refreshBaseValues = function(unitJson){
		if(thatS3dPropertyEditor.currentUnitJson != null){
			if(unitJson.id === thatS3dPropertyEditor.currentUnitJson.id){
				let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
				let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='baseInfo']")[0];
				thatS3dPropertyEditor.refreshBaseInfo(unitJson, baseInfoContainer);
			}
		}
	}

	this.afterChangeUseWorldPosition = function(useWorldPosition){
		let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
		let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='baseInfo']")[0];

		if(useWorldPosition == null){
			$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"useWorldPosition\"]").css("display", "none");
		}
		else{
			let displayValue = useWorldPosition ? "none" : "block";
			$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posX\"]").parent().parent().css("display", displayValue);
			$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posX\"]").parent().parent().css("display", displayValue);
			$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posY\"]").parent().parent().css("display", displayValue);
			$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posZ\"]").parent().parent().css("display", displayValue);
			$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"minX\"]").parent().parent().css("display", displayValue); 
			$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"minY\"]").parent().parent().css("display", displayValue); 
			$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"minZ\"]").parent().parent().css("display", displayValue); 
			$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"maxX\"]").parent().parent().css("display", displayValue); 
			$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"maxY\"]").parent().parent().css("display", displayValue); 
			$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"maxZ\"]").parent().parent().css("display", displayValue); 
			$(baseInfoContainer).find(".s3dPropertyEditorItemContainer[groupName=\"rotation\"]").css("display", displayValue);
		}

		thatS3dPropertyEditor.refreshProperty2DVisible(useWorldPosition);
	}

	this.refreshBaseInfoDecimalValues = function(unitJson){
		let propertyEditorInnerContainer = $("#" + thatS3dPropertyEditor.containerId).find(".s3dPropertyEditorInnerContainer")[0];
		let baseInfoContainer = $(propertyEditorInnerContainer).find(".s3dPropertyEditorInfoContainer[name='baseInfo']")[0];

		let posX = cmnPcr.toFixed(common3DFunction.m2mm(unitJson.position.x), thatS3dPropertyEditor.positionPrecision);
		let posY = cmnPcr.toFixed(common3DFunction.m2mm(unitJson.position.y), thatS3dPropertyEditor.positionPrecision);
		let posZ = cmnPcr.toFixed(common3DFunction.m2mm(unitJson.position.z), thatS3dPropertyEditor.positionPrecision);
		let rotX = cmnPcr.toFixed(common3DFunction.radian2degree(unitJson.rotation.x), thatS3dPropertyEditor.rotationPrecision);
		let rotY = cmnPcr.toFixed(common3DFunction.radian2degree(unitJson.rotation.y), thatS3dPropertyEditor.rotationPrecision);
		let rotZ = cmnPcr.toFixed(common3DFunction.radian2degree(unitJson.rotation.z), thatS3dPropertyEditor.rotationPrecision);

		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posX\"]").val(posX);
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posY\"]").val(posY);
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posZ\"]").val(posZ);
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"rotX\"]").val(rotX);
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"rotY\"]").val(rotY);
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"rotZ\"]").val(rotZ);
		
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"name\"]").attr("sourceValue", unitJson.name); 
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posX\"]").attr("sourceValue", posX);
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posY\"]").attr("sourceValue", posY);
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"posZ\"]").attr("sourceValue", posZ);
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"rotX\"]").attr("sourceValue", rotX);
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"rotY\"]").attr("sourceValue", rotY);
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"rotZ\"]").attr("sourceValue", rotZ); 
		
		let object3D = thatS3dPropertyEditor.manager.viewer.getObject3DById(unitJson.id);
        let box = new THREE.Box3().setFromObject(object3D, true);
		let minX = cmnPcr.toFixed(common3DFunction.m2mm(box.min.x), thatS3dPropertyEditor.positionPrecision);
		let minY = cmnPcr.toFixed(common3DFunction.m2mm(box.min.y), thatS3dPropertyEditor.positionPrecision);
		let minZ = cmnPcr.toFixed(common3DFunction.m2mm(box.min.z), thatS3dPropertyEditor.positionPrecision);
		let maxX = cmnPcr.toFixed(common3DFunction.m2mm(box.max.x), thatS3dPropertyEditor.positionPrecision);
		let maxY = cmnPcr.toFixed(common3DFunction.m2mm(box.max.y), thatS3dPropertyEditor.positionPrecision);
		let maxZ = cmnPcr.toFixed(common3DFunction.m2mm(box.max.z), thatS3dPropertyEditor.positionPrecision);
				
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"minX\"]").text(minX);
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"minY\"]").text(minY);
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"minZ\"]").text(minZ);
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"maxX\"]").text(maxX);
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"maxY\"]").text(maxY);
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"maxZ\"]").text(maxZ);
	}

	this.refreshBaseInfo = function(unitJson, baseInfoContainer){ 
		let posX = cmnPcr.toFixed(common3DFunction.m2mm(unitJson.position.x), thatS3dPropertyEditor.positionPrecision);
		let posY = cmnPcr.toFixed(common3DFunction.m2mm(unitJson.position.y), thatS3dPropertyEditor.positionPrecision);
		let posZ = cmnPcr.toFixed(common3DFunction.m2mm(unitJson.position.z), thatS3dPropertyEditor.positionPrecision);
		let rotX = cmnPcr.toFixed(common3DFunction.radian2degree(unitJson.rotation.x), thatS3dPropertyEditor.rotationPrecision);
		let rotY = cmnPcr.toFixed(common3DFunction.radian2degree(unitJson.rotation.y), thatS3dPropertyEditor.rotationPrecision);
		let rotZ = cmnPcr.toFixed(common3DFunction.radian2degree(unitJson.rotation.z), thatS3dPropertyEditor.rotationPrecision);

		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"name\"]").val(unitJson.name);
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"componentCode\"]").text(unitJson.code == null ? "无" : unitJson.code);
		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"versionNum\"]").text(unitJson.versionNum == null ? "无" : unitJson.versionNum);

		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"name\"]").attr("sourceValue", unitJson.name);

		$(baseInfoContainer).find(".s3dPropertyEditorItemInput[name=\"useWorldPosition\"]").prop("checked", unitJson.useWorldPosition);

		thatS3dPropertyEditor.refreshBaseInfoDecimalValues(unitJson);

		thatS3dPropertyEditor.afterChangeUseWorldPosition(unitJson.useWorldPosition);
	}

	this.getBaseInfoContainerHtml = function(unitJson){
		return ""
			//标识
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"identification\">"
			+ "<div class=\"s3dPropertyEditorItemGroup\"><div class=\"s3dPropertyEditorItemGroupTitle\">标识信息</div></div>"
			+ "</div>"
			//名称
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"identification\">"
			+ "<div class=\"s3dPropertyEditorItemTitle\">名称</div>"
			+ "<div class=\"s3dPropertyEditorItemValue\"><input type=\"text\" name=\"name\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputString\" /></div>"
			+ "</div>"
			//类型编码
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"identification\">"
			+ "<div class=\"s3dPropertyEditorItemTitle\">类型编码</div>"
			+ "<div class=\"s3dPropertyEditorItemValue\"><div type=\"text\" name=\"componentCode\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputReadonly\" ></div></div>"
			+ "</div>"
			//类型版本
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"identification\">"
			+ "<div class=\"s3dPropertyEditorItemTitle\">类型版本</div>"
			+ "<div class=\"s3dPropertyEditorItemValue\"><div type=\"text\" name=\"versionNum\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputReadonly\" ></div></div>"
			+ "</div>"
			//位置
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"position\">"
			+ "<div class=\"s3dPropertyEditorItemGroup\"><div class=\"s3dPropertyEditorItemGroupTitle\">位置信息</div></div>"
			+ "</div>"
			//X轴
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"position\">"
			+ "<div class=\"s3dPropertyEditorItemTitle\">X轴</div>"
			+ "<div class=\"s3dPropertyEditorItemValue\"><input type=\"text\" name=\"posX\" precision=\"" + thatS3dPropertyEditor.positionPrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal\" /></div>"
			+ "</div>"	
			//Y轴
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"position\" hiddenIn2D=\"true\">"
			+ "<div class=\"s3dPropertyEditorItemTitle\">Y轴</div>"
			+ "<div class=\"s3dPropertyEditorItemValue\"><input type=\"text\" name=\"posY\" precision=\"" + thatS3dPropertyEditor.positionPrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal\" /></div>"
			+ "</div>"	
			//Z轴
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"position\">"
			+ "<div class=\"s3dPropertyEditorItemTitle\">Z轴</div>"
			+ "<div class=\"s3dPropertyEditorItemValue\"><input type=\"text\" name=\"posZ\" precision=\"" + thatS3dPropertyEditor.positionPrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal\" /></div>"
			+ "</div>"
			//世界坐标
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"position\">"
			+ "<div class=\"s3dPropertyEditorItemTitle\">世界坐标</div>"
			+ "<div class=\"s3dPropertyEditorItemValue\"><input type=\"checkbox\" name=\"useWorldPosition\" disabled class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputBoolean\" /></div>"
			+ "</div>"
			//最小X
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"position\">"
			+ "<div class=\"s3dPropertyEditorItemTitle\">最小X</div>"
			+ "<div class=\"s3dPropertyEditorItemValue\"><div name=\"minX\" precision=\"" + thatS3dPropertyEditor.positionPrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputReadonly\"></div></div>"
			+ "</div>"	
			//最小Y
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"position\" hiddenIn2D=\"true\">"
			+ "<div class=\"s3dPropertyEditorItemTitle\">最小Y</div>"
			+ "<div class=\"s3dPropertyEditorItemValue\"><div name=\"minY\" precision=\"" + thatS3dPropertyEditor.positionPrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputReadonly\"></div></div>"
			+ "</div>"	
			//最小Z
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"position\">"
			+ "<div class=\"s3dPropertyEditorItemTitle\">最小Z</div>"
			+ "<div class=\"s3dPropertyEditorItemValue\"><div name=\"minZ\" precision=\"" + thatS3dPropertyEditor.positionPrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputReadonly\"></div></div>"
			+ "</div>"
			//最大X
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"position\">"
			+ "<div class=\"s3dPropertyEditorItemTitle\">最大X</div>"
			+ "<div class=\"s3dPropertyEditorItemValue\"><div name=\"maxX\" precision=\"" + thatS3dPropertyEditor.positionPrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputReadonly\"></div></div>"
			+ "</div>"	
			//最大Y
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"position\" hiddenIn2D=\"true\">"
			+ "<div class=\"s3dPropertyEditorItemTitle\">最大Y</div>"
			+ "<div class=\"s3dPropertyEditorItemValue\"><div name=\"maxY\" precision=\"" + thatS3dPropertyEditor.positionPrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputReadonly\"></div></div>"
			+ "</div>"	
			//最大Z
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"position\">"
			+ "<div class=\"s3dPropertyEditorItemTitle\">最大Z</div>"
			+ "<div class=\"s3dPropertyEditorItemValue\"><div name=\"maxZ\" precision=\"" + thatS3dPropertyEditor.positionPrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputReadonly\"></div></div>"
			+ "</div>"
			//旋转
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"rotation\">"
			+ "<div class=\"s3dPropertyEditorItemGroup\"><div class=\"s3dPropertyEditorItemGroupTitle\">旋转信息</div></div>"
			+ "</div>"
			//X方向
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"rotation\" hiddenIn2D=\"true\">"
			+ "<div class=\"s3dPropertyEditorItemTitle\">X方向</div>"
			+ "<div class=\"s3dPropertyEditorItemValue\"><input type=\"text\" name=\"rotX\" precision=\"" + thatS3dPropertyEditor.rotationPrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal\" /></div>"
			+ "</div>"	
			//Y方向
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"rotation\">"
			+ "<div class=\"s3dPropertyEditorItemTitle\">Y方向</div>"
			+ "<div class=\"s3dPropertyEditorItemValue\"><input type=\"text\" name=\"rotY\" precision=\"" + thatS3dPropertyEditor.rotationPrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal\" /></div>"
			+ "</div>"	
			//Z方向
			+ "<div class=\"s3dPropertyEditorItemContainer\" groupName=\"rotation\" hiddenIn2D=\"true\">"
			+ "<div class=\"s3dPropertyEditorItemTitle\">Z方向</div>"
			+ "<div class=\"s3dPropertyEditorItemValue\"><input type=\"text\" name=\"rotZ\" precision=\"" + thatS3dPropertyEditor.rotationPrecision + "\" autocomplete=\"off\" class=\"s3dPropertyEditorItemInput s3dPropertyEditorItemInputDecimal\" /></div>"
			+ "</div>";
	}
		
	//获取property html
	this.getPropertyHtml = function(paramName, paramValue){
		return "<div class=\"s3dPropertyEditorItemContainer\">"
			+ "<div class=\"s3dPropertyEditorItemTitle\">" + cmnPcr.html_encode(paramName) + "</div>"
			+ "<div class=\"s3dPropertyEditorItemValue\">" + cmnPcr.html_encode(paramValue) + "</div>"
			+ "</div>";
	}
}
export default S3dPropertyEditor