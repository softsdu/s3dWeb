import S3dManager from "../../../js/s3dWebManager.js";
import "../../../commonjs/jQuery/jquery.min.js";
import "../../../commonjs/common/common.js"
import {s3dViewerStatus} from "../../../commonjs/common/static.js"
import {TWEEN} from "../../../commonjs/threejs/examples/jsm/libs/tween.module.min.js"
import {bodyPaintMap, environmentMap, hubMap, systemDescription, autoMap} from "./info.js"
import {componentList} from "../resources/files/componentList.js"
import * as skyList from "../resources/skies/list.js";

const appInfo = {
	base: {
		name:"Auto",
		key: "56b98b34-1050-4d01-9537-8e909750c63d"
	},
	path:{
		root: "../../../",
		application: "../",
		model: "models/auto.s3dc"
	},
	scene: {
		needShowAnimate: false,
		hubName: "auto_hub",
		bodyName: "auto_body",
		shadowName: "auto_shadow"
	}
}
let s3dManager = null;

//运行轮胎滚动动画
function runHubAnimate(hubId) {
	if(appInfo.scene.needShowAnimate) {
		let viewer = s3dManager.viewer;
		const hubObject3D = viewer.getObject3DById(hubId);
		const hubStartRotX = hubObject3D.rotation.x;
		const hubRotationsSequence = [
			{
				startAngle: hubStartRotX,
				endAngle: hubStartRotX,
				duration: 2000,
				easing: TWEEN.Easing.Linear.None
			}, {
				startAngle: hubStartRotX,
				endAngle: hubStartRotX + Math.PI * 50,
				duration: 20000,
				easing: TWEEN.Easing.Quadratic.InOut
			}
		];

		// 函数用来开始新的旋转Tween
		function startNextRotation(currentAngle, currentIndex) {
			let viewer = s3dManager.viewer;
			const hubObject3D = viewer.getObject3DById(hubId);
			if (hubObject3D != null) {
				const nextItem = hubRotationsSequence[currentIndex];
				hubObject3D.rotation.x = nextItem.startAngle;
				const targetRotation = nextItem.endAngle;
				const tween = new TWEEN.Tween(hubObject3D.rotation)
					.to({x: targetRotation}, nextItem.duration)
					.easing(nextItem.easing)
					.onComplete(() => {
						// Tween结束时，检查是否还有更多序列
						currentIndex++;
						if (currentIndex === hubRotationsSequence.length) {
							currentIndex = 0;
						}
						startNextRotation(targetRotation, currentIndex);
					})
					.start();
			}
		}

		// 启动第一个旋转
		startNextRotation(0, 0);
	}
}

//切换轮毂
function switchHub(hubCode) {
	let hubInfo = hubMap[hubCode];
	const hubData = hubInfo.data;
	const materials = {};
	for (let mName in hubInfo.materialMap) {
		let vm = hubInfo.materialMap[mName];
		let m = {};
		for (let pName in vm) {
			m[pName] = vm[pName];
		}
		materials[mName] = m;
	}
	let getOldHubIds = function (namePrefix) {
		let object3DIds = [];
		for (let id in s3dManager.viewer.allObject3DMap) {
			let object3D = s3dManager.viewer.allObject3DMap[id];
			if (object3D.userData.unitInfo.name.startWith(namePrefix)) {
				object3DIds.push(object3D.userData.unitInfo.id);
			}
		}
		return object3DIds;
	}

	const oldHubIds = getOldHubIds(appInfo.scene.hubName);

	let addNewHub = function (hubJsons) {
		let hubJson = hubJsons[0];
		let parameters = {};
		for (let parameterName in hubJson.json.parameters) {
			let p = hubJson.json.parameters[parameterName];
			parameters[parameterName] = {
				value: p.defaultValue
			};
		}
		let newHubInfos = [];
		for (let i = 0; i < oldHubIds.length; i++) {
			let oldHubId = oldHubIds[i];
			const oldHubObject3D = s3dManager.viewer.getObject3DById(oldHubId);
			let oldHubUnitInfo = oldHubObject3D.userData.unitInfo;
			newHubInfos.push({
				name: appInfo.scene.hubName,
				code: hubData.componentCode,
				versionNum: hubData.versionNum,
				position: oldHubUnitInfo.position,
				rotation: oldHubUnitInfo.rotation,
				isOnGround: false,
				needSelectAfterAdd: false,
				parameters: parameters,
				materials: materials,
				userData: {
					isChangeHub: true,
					oldObjId: oldHubId
				}
			});
		}
		s3dManager.viewer.addNewLocalObjects(newHubInfos);
	}

	s3dManager.localObjectCreator.getComponentJsons([{
		code: hubData.componentCode,
		versionNum: hubData.versionNum
	}], addNewHub);
}

//切换车漆
function switchBodyPaint(bodyPaintCode){
	let autoCode = s3dManager.appearanceSetting.getCheckedItemCode("auto");
	let autoInfo = autoMap[autoCode];
	let bodyPaintInfo = bodyPaintMap[bodyPaintCode];
	let sourceMaterialName = autoInfo.bodyMaterial;
	let destMaterialName = bodyPaintInfo.data.materialName;
	let bodyObject3DId = getBodyObject3dId();
	let unitObject3D = s3dManager.viewer.getObject3DById(bodyObject3DId);
	s3dManager.localObjectCreator.setLocalObject3DMaterial(unitObject3D, unitObject3D.userData.unitInfo, sourceMaterialName, destMaterialName);
}

//切换车型
function switchAuto(autoCode){
	const autoInfo = autoMap[autoCode];
	const hubGroupCode = getDefaultHubGroupCode(autoCode);
	const hubInfo = hubMap[getDefaultHubCode(autoCode, hubGroupCode)];
	const autoComData = {
		code: autoInfo.data.componentCode,
		versionNum: autoInfo.data.versionNum
	};
	const shadowComData = {
		code: autoInfo.shadow.componentCode,
		versionNum: autoInfo.shadow.versionNum
	};
	const hubComData = {
		code: hubInfo.data.componentCode,
		versionNum: hubInfo.data.versionNum
	};

	let addNewBodyHubAndShadow = function (comJsons) {
		let newUnitInfos = [];
		for(let i = 0; i < comJsons.length; i++) {
			let comJson = comJsons[i];
			let parameters = {};
			for (let parameterName in comJson.json.parameters) {
				let p = comJson.json.parameters[parameterName];
				parameters[parameterName] = {
					value: p.defaultValue
				};
			}
			let materials = {};
			if (comJson.code === autoComData.code) {
				//车体
				for (let mName in  autoInfo.data.materials) {
					let vm = autoInfo.data.materials[mName];
					let m = {};
					for (let pName in vm) {
						m[pName] = vm[pName];
					}
					materials[mName] = m;
				}

				//更换默认车漆
				materials[autoInfo.bodyMaterial] = {
					name: bodyPaintMap[autoInfo.bodyPaints[0]].data.materialName
				};
				let oldAutoBodyObjId = getBodyObject3dId();
				let unitInfo = {
					name: appInfo.scene.bodyName + "_" + autoInfo.name,
					code: autoComData.code,
					versionNum: autoComData.versionNum,
					position: autoInfo.data.position,
					rotation: autoInfo.data.rotation,
					isOnGround: false,
					needSelectAfterAdd: false,
					parameters: parameters,
					materials: materials,
					userData: {
						isChangeHub: false,
						oldObjId: oldAutoBodyObjId
					}
				}
				newUnitInfos.push(unitInfo);
			}
			else if (comJson.code === shadowComData.code) {
				//影子
				for (let parameterName in autoInfo.shadow.parameters) {
					let p = autoInfo.shadow.parameters[parameterName];
					parameters[parameterName] = {
						value: p.value
					};
				}
				for (let mName in autoInfo.shadow.materials) {
					let vm = autoInfo.shadow.materials[mName];
					let m = {};
					for (let pName in vm) {
						m[pName] = vm[pName];
					}
					materials[mName] = m;
				}
				let oldShadowObjId = getShadowObject3dId();
				let unitInfo = {
					name: appInfo.scene.shadowName + "_" + autoInfo.name,
					code: shadowComData.code,
					versionNum: shadowComData.versionNum,
					position: autoInfo.shadow.position,
					rotation: autoInfo.shadow.rotation,
					isOnGround: false,
					needSelectAfterAdd: false,
					parameters: parameters,
					materials: materials,
					userData: {
						isChangeHub: false,
						oldObjId: oldShadowObjId
					}
				}
				newUnitInfos.push(unitInfo);
			}
			else if (comJson.code === hubComData.code) {
				for (let mName in hubInfo.materialMap) {
					let vm = hubInfo.materialMap[mName];
					let m = {};
					for (let pName in vm) {
						m[pName] = vm[pName];
					}
					materials[mName] = m;
				}

				let oldHubObjIds = getHubObject3dIds();

				for(let j = 0; j < autoInfo.hubs.length; j++){
					let hubData = autoInfo.hubs[j];
					let unitInfo = {
						name: appInfo.scene.hubName + "_" + autoInfo.name + "_" + j,
						code: hubComData.code,
						versionNum: hubComData.versionNum,
						position: hubData.position,
						rotation: hubData.rotation,
						isOnGround: false,
						needSelectAfterAdd: false,
						parameters: parameters,
						materials: materials,
						userData: {
							isChangeHub: true,
							oldObjId: oldHubObjIds.length >= j ? oldHubObjIds[j] : null
						}
					}
					newUnitInfos.push(unitInfo);
				}
			}
		}
		s3dManager.viewer.addNewLocalObjects(newUnitInfos);
	}

	s3dManager.localObjectCreator.getComponentJsons([{
		code: autoInfo.data.componentCode,
		versionNum: autoInfo.data.versionNum
	},{
		code: autoInfo.shadow.componentCode,
		versionNum: autoInfo.shadow.versionNum
	},{
		code: hubInfo.data.componentCode,
		versionNum: hubInfo.data.versionNum
	}], addNewBodyHubAndShadow);
}

//切换环境
function switchEnvironment(skyName){
	s3dManager.skyBox.setSkyInfo(skyName);
}

//获取车体对象ID
function getBodyObject3dId(){
	let object3DIds = getOldObject3DIds([appInfo.scene.bodyName]);
	return object3DIds.length === 0 ? null : object3DIds[0];
}

//获取影子对象ID
function getShadowObject3dId(){
	let object3DIds = getOldObject3DIds([appInfo.scene.shadowName]);
	return object3DIds.length === 0 ? null : object3DIds[0];
}

//获取轮毂对象IDs（多个）
function getHubObject3dIds(){
	return getOldObject3DIds([appInfo.scene.hubName]);
}

//根据名称前缀，获取旧的对象IDs
function getOldObject3DIds(allNamePrefix){
	let object3DIds = [];
	for (let id in s3dManager.viewer.allObject3DMap) {
		let object3D = s3dManager.viewer.allObject3DMap[id];
		for(let i = 0; i < allNamePrefix.length; i++){
			let namePrefix = allNamePrefix[i];
			if (object3D.userData.unitInfo.name.startWith(namePrefix)) {
				object3DIds.push(object3D.userData.unitInfo.id);
			}
		}
	}
	return object3DIds;
}

//获取车型的默认轮毂的编码
function getDefaultHubCode(autoCode){
	let autoInfo = autoMap[autoCode];
	let hubTypeMap = autoInfo.hubTypeMap;
	for(let hubTypeCode in hubTypeMap){
		let groupMap = hubTypeMap[hubTypeCode].groupMap;
		for(let hubGroupCode in groupMap) {
			if(groupMap[hubGroupCode].items.length > 0) {
				return groupMap[hubGroupCode].items[0];
			}
			else{
				return null;
			}
		}
	}
	return null;
}

//获取车型默认轮毂分组的编码
function getDefaultHubGroupCode(autoCode){
	let autoInfo = autoMap[autoCode];
	let hubTypeMap = autoInfo.hubTypeMap;
	for(let hubTypeCode in hubTypeMap){
		let groupMap = hubTypeMap[hubTypeCode].groupMap;
		for(let hubGroupCode in groupMap) {
			return hubGroupCode;
		}
	}
	return null;
}

//初始化车型HTML
function initAutoHtmls(){
	let checkedAutoCode = s3dManager.appearanceSetting.getCheckedItemCode("auto");
	let clickAutoCode = null;
	let autoChanged = false;
	let html = "";
	let i = 0;
	for(let vCode in autoMap){
		let vInfo = autoMap[vCode];
		let checked = (checkedAutoCode === vInfo.code ? true : (checkedAutoCode == null ? i === 0 : false));
		html += s3dManager.appearanceSetting.getBtnHtml({
			code: vInfo.code,
			name: vInfo.name
		}, "auto", checked);

		if(checked){
			clickAutoCode = vCode;
			if(checkedAutoCode !== clickAutoCode) {
				s3dManager.appearanceSetting.setCheckedItemCode("auto", vInfo.code);
				s3dManager.appearanceSetting.setCheckedItemCode("bodyPaint", null);
				s3dManager.appearanceSetting.setCheckedItemCode("hubType", null);
				s3dManager.appearanceSetting.setCheckedItemCode("hubGroup", null);
				s3dManager.appearanceSetting.setCheckedItemCode("hub", null);

				//换车了，第一次打开初始化的时候会出现这个情况
				autoChanged = true;
			}
		}

		i++;
	}
	s3dManager.appearanceSetting.setSectionInnerHtml("level1", html);

	for(let vCode in autoMap){
		let vInfo = autoMap[vCode];
		s3dManager.appearanceSetting.bindBtnClickEvent(vInfo.code, "auto", function (p) {
			let vCode = p.itemCode;
			let vInfo = autoMap[vCode];

			s3dManager.appearanceSetting.setCheckedItemCode("auto", vInfo.code);
			s3dManager.appearanceSetting.setCheckedItemCode("bodyPaint", null);
			s3dManager.appearanceSetting.setCheckedItemCode("hubType", null);
			s3dManager.appearanceSetting.setCheckedItemCode("hubGroup", null);
			s3dManager.appearanceSetting.setCheckedItemCode("hub", null);
			initBodyPaintHtmls(vCode, false);

			switchAuto(vCode);
		});
	}

	if(autoChanged) {
		initBodyPaintHtmls(clickAutoCode, false);

		switchAuto(clickAutoCode);
	}
	else{
		initBodyPaintHtmls(clickAutoCode, false);
	}
}

//初始化环境HTML
function initEnvironmentHtmls(){
	let checkedEnvironmentCode = s3dManager.appearanceSetting.getCheckedItemCode("environment");
	let html = "";
	let i = 0;
	for(let eCode in environmentMap){
		let eInfo = environmentMap[eCode];
		let checked = (checkedEnvironmentCode === eInfo.code ? true : (checkedEnvironmentCode == null ? i === 0 : false));
		html += s3dManager.appearanceSetting.getBtnHtml({
			code: eInfo.code,
			name: eInfo.name
		}, "environment", checked);

		if(checked){
			s3dManager.appearanceSetting.setCheckedItemCode("environment", eInfo.code);
		}
		i++;
	}
	s3dManager.appearanceSetting.setSectionInnerHtml("level1", html);
	s3dManager.appearanceSetting.setSectionInnerHtml("level2", null);
	s3dManager.appearanceSetting.setSectionInnerHtml("level3", null);

	for(let eCode in environmentMap){
		let eInfo = environmentMap[eCode];
		s3dManager.appearanceSetting.bindBtnClickEvent(eInfo.code, "environment", function (p) {
			let eCode = p.itemCode;
			let eInfo = environmentMap[eCode];
			switchEnvironment(eInfo.data.skyName);
			s3dManager.appearanceSetting.setCheckedItemCode("environment", eInfo.code);
		});
	}
}

//初始化车漆颜色HTML
function initBodyPaintHtmls(autoCode){
	let checkedBodyPaintCode = s3dManager.appearanceSetting.getCheckedItemCode("bodyPaint");
	let vInfo = autoMap[autoCode];
	let html = "";
	for(let i = 0 ; i < vInfo.bodyPaints.length; i++){
		let bodyPaintCode = vInfo.bodyPaints[i];
		let bpInfo = bodyPaintMap[bodyPaintCode];
		let checked = (checkedBodyPaintCode === bpInfo.code ? true : (checkedBodyPaintCode == null ? i === 0 : false));
		html += s3dManager.appearanceSetting.getBtnHtml({
			code: bpInfo.code,
			name: bpInfo.name,
			imgData: {
				normal: bpInfo.img.normal,
				directory: appInfo.path.application + "resources/appearanceSettings/bodyPaints"
			}
		}, "bodyPaint", checked);
	}
	s3dManager.appearanceSetting.setSectionInnerHtml("level2", html);
	s3dManager.appearanceSetting.setSectionInnerHtml("level3", null);

	for(let i = 0 ; i < vInfo.bodyPaints.length; i++){
		let bodyPaintCode = vInfo.bodyPaints[i];
		let bpInfo = bodyPaintMap[bodyPaintCode];
		s3dManager.appearanceSetting.bindBtnClickEvent(bpInfo.code, "bodyPaint", function (p) {
			let bpCode = p.itemCode;
			s3dManager.appearanceSetting.setCheckedItemCode("bodyPaint", bpCode);
			switchBodyPaint(bpCode);
		});
	}
}

//初始化轮毂类型HTML
function initHubTypeHtmls(autoCode){
	let vInfo = autoMap[autoCode];
	let checkedHubTypeCode = s3dManager.appearanceSetting.getCheckedItemCode("hubType");
	let clickHubTypeCode = null;
	let html = "";
	let i = 0;
	for(let htCode in vInfo.hubTypeMap){
		let hubTypeInfo = vInfo.hubTypeMap[htCode];
		let checked = (checkedHubTypeCode === hubTypeInfo.code ? true : (checkedHubTypeCode == null ? i === 0 : false));
		html += s3dManager.appearanceSetting.getBtnHtml({
			code: hubTypeInfo.code,
			name: hubTypeInfo.name
		}, "hubType", checked);

		if(checked){
			clickHubTypeCode = htCode;
			if(clickHubTypeCode !== checkedHubTypeCode) {
				s3dManager.appearanceSetting.setCheckedItemCode("hubType", hubTypeInfo.code);
				s3dManager.appearanceSetting.setCheckedItemCode("hubGroup", null);
				s3dManager.appearanceSetting.setCheckedItemCode("hub", null);
			}
		}
		i++;
	}
	s3dManager.appearanceSetting.setSectionInnerHtml("level1", html);

	for(let htCode in vInfo.hubTypeMap){
		let hubTypeInfo = vInfo.hubTypeMap[htCode];
		s3dManager.appearanceSetting.bindBtnClickEvent(hubTypeInfo.code, "hubType", function (p) {
			let checkedAutoCode = s3dManager.appearanceSetting.getCheckedItemCode("auto");
			let htCode = p.itemCode;

			s3dManager.appearanceSetting.setCheckedItemCode("hubType", htCode);
			s3dManager.appearanceSetting.setCheckedItemCode("hubGroup", null);
			s3dManager.appearanceSetting.setCheckedItemCode("hub", null);
			initHubGroupHtmls(checkedAutoCode, htCode);
		});
	}

	initHubGroupHtmls(autoCode, clickHubTypeCode);
}

//初始化轮毂模型分组HTML
function initHubGroupHtmls(autoCode, hubTypeCode){
	let hubGroupMap = autoMap[autoCode].hubTypeMap[hubTypeCode].groupMap;
	let checkedHubGroupCode = s3dManager.appearanceSetting.getCheckedItemCode("hubGroup");
	let clickHubGroupCode = null;
	let html = "";
	let i = 0;
	for(let hubGroupCode in hubGroupMap){
		let hubGroupInfo = hubGroupMap[hubGroupCode];
		let checked = (checkedHubGroupCode === hubGroupCode ? true : (checkedHubGroupCode == null ? i === 0 : false));
		html += s3dManager.appearanceSetting.getBtnHtml({
			code: hubGroupInfo.code,
			name: hubGroupInfo.name,
			imgData: {
				normal: hubGroupInfo.img.normal,
				directory: appInfo.path.application + "resources/appearanceSettings/hubGroups"
			}
		}, "hubGroup", checked);
		if(checked){
			clickHubGroupCode = hubGroupInfo.code;
		}
		i++;
	}
	s3dManager.appearanceSetting.setSectionInnerHtml("level2", html);
	s3dManager.appearanceSetting.setSectionInnerHtml("level3", null);
	for(let hubGroupCode in hubGroupMap){
		let hubGroupInfo = hubGroupMap[hubGroupCode];
		s3dManager.appearanceSetting.bindBtnClickEvent(hubGroupCode, "hubGroup", function (p) {
			let checkedAutoCode = s3dManager.appearanceSetting.getCheckedItemCode("auto");
			let checkedHubTypeCode = s3dManager.appearanceSetting.getCheckedItemCode("hubType");
			let hgCode = p.itemCode;
			s3dManager.appearanceSetting.setCheckedItemCode("hubGroup", hgCode);
			s3dManager.appearanceSetting.setCheckedItemCode("hub", null);
			initHubHtmls(checkedAutoCode, checkedHubTypeCode, hgCode);
		});
	}
	initHubHtmls(autoCode, hubTypeCode, clickHubGroupCode);
}

//初始化轮毂模型分组HTML
function initHubHtmls(autoCode, hubTypeCode, hubGroupCode){
	let hubCodeList = autoMap[autoCode].hubTypeMap[hubTypeCode].groupMap[hubGroupCode].items;
	let checkedHubCode = s3dManager.appearanceSetting.getCheckedItemCode("hub");
	let clickHubCode = null;
	let html = "";
	for(let i = 0; i < hubCodeList.length; i++){
		let hubCode = hubCodeList[i];
		let checked = (checkedHubCode === hubCode ? true : (checkedHubCode == null ? i === 0 : false));
		let hubInfo = hubMap[hubCode];
		html += s3dManager.appearanceSetting.getBtnHtml({
			code: hubInfo.code,
			name: hubInfo.name,
			imgData: {
				colors: hubInfo.img.colors
			}
		}, "hub", checked);
		if(checked){
			clickHubCode = hubCode;
		}
	}
	s3dManager.appearanceSetting.setSectionInnerHtml("level3", html);
	for(let i = 0; i < hubCodeList.length; i++){
		let hubCode = hubCodeList[i];
		s3dManager.appearanceSetting.bindBtnClickEvent(hubCode, "hub", function (p) {
			let hCode = p.itemCode;
			s3dManager.appearanceSetting.setCheckedItemCode("hub", hCode);
			switchHub(hCode);
		});
	}
	switchHub(clickHubCode);
}

//初始化描述信息HTML
function initDescriptionHtml(){
	let html = s3dManager.appearanceSetting.getDescriptionHtml(systemDescription);
	s3dManager.appearanceSetting.setSectionInnerHtml("description", html);
}

//初始化展示层HTML
function initAppearanceHtmls() {
	let groupJsons = [{
		code: "auto",
		name: "车型"
	},{
		code: "hub",
		name: "轮毂"
	},{
		code: "environment",
		name: "环境"
	}
	];
	let html = "";
	for(let i = 0; i < groupJsons.length; i++){
		let groupJson = groupJsons[i];
		html += s3dManager.appearanceSetting.getGroupHtml(groupJson, i === 0);
	}
	s3dManager.appearanceSetting.setSectionInnerHtml("group", html);

	s3dManager.appearanceSetting.setCheckedItemCode("group", "auto");

	//绑定事件
	s3dManager.appearanceSetting.bindGroupClickEvent("auto", function (p){
		initAutoHtmls();
	});
	s3dManager.appearanceSetting.bindGroupClickEvent("hub", function (p){
		let autoCode = s3dManager.appearanceSetting.getCheckedItemCode("auto");
		initHubTypeHtmls(autoCode);
	});
	s3dManager.appearanceSetting.bindGroupClickEvent("environment", function (p){
		initEnvironmentHtmls();
	});
}

//初始化S3dManager
function initS3dManager(){
	let manager = new S3dManager();
	manager.init({
		containerId: "s3dViewerContainerId",
		pluginConfigs: {
			loader: {
				modelInfo:{
					url: appInfo.path.application + appInfo.path.model + "?t=" + encodeURIComponent((new Date()).toString())
				}
			},
			appearanceSetting: {
				visible: true
			},
			viewer: {
				showShadow: false,
				canSelectObject3D: false,
				mobileAutoRotate: false,
				hasAnimation: true,
				hemisphereLight: {
					intensity: 0.7
				},
				directionalLights: [
					{
						intensity: 0.3
					},
					{
						intensity: 0.1
					},
					{
						intensity: 0.0
					}
				],
				detailLevel: 4,
				orbitControlConfig: {
					perspective: {
						minDistance: 1,
						maxDistance: 90,
						near: 1,
						far: 200,
						enableRotate: true,
						enableZoom: true,
						enablePan: false,
						maxPolarAngle: Math.PI / 2
					}
				},
				onSelectChanged: function(p){
					s3dManager.propertyEditor.refreshProperties(p.nodeJArray);
					s3dManager.treeEditor.highlightNodes(p.nodeJArray);
					s3dManager.moveHelper.attach(p.nodeJArray);
				},
				afterAddNewObject: function(p){
					s3dManager.treeEditor.addLeafNode(p.nodeJson, p.groupNodeId);


					if(p.userData != null && p.userData.oldObjId != null){
						s3dManager.viewer.removeObject(p.userData.oldObjId, false, true);
					}

					if(p.userData != null && p.userData.isChangeHub) {
						//添加动画
						runHubAnimate(p.nodeJson.id);
					}
				},
				afterRebuildObject: function(p){
				},
				beforeRemoveObjects: function(p){
					s3dManager.moveHelper.detach();
				},
				afterRemoveObject: function(p){
					s3dManager.treeEditor.removeLeafNode(p.nodeId);
				},
				afterInitAllObjects: function(p){
					initAppearanceHtmls();
					initDescriptionHtml();
					initAutoHtmls();

					//默认轮毂添加动画
					for(let id in s3dManager.viewer.allObject3DMap){
						let object3D = s3dManager.viewer.allObject3DMap[id];
						if(object3D.userData.unitInfo.name.startWith(appInfo.scene.hubName)) {
							runHubAnimate(id);
						}
					}
				}
			},
			localObjectCreator: {
				imageFolder:  appInfo.path.application + "resources/materialImages/"
			},
			axis: {
				//hasAxis: true,
				//hasPlane: true,
				fontUrl: appInfo.path.application + "resources/fonts/helvetiker_bold.typeface.json"
			},
			adder: {
				//visible: true
			},
			statusBar: {
				//visible: true
			},
			propertyEditor: {
				//visible: true
			},
			treeEditor: {
				title: "模型结构",
				//visible: true,
				onNodeClick: function(p){
					let nodeId = p.nodeJson.id;
					let selectNodeIds = null;
					s3dManager.viewer.changeStatus({
						status: s3dViewerStatus.normalView
					});
					if(p.nodeJson.isGroup){
						selectNodeIds = s3dManager.treeEditor.getChildNodeIds(nodeId);
					}
					else{
						selectNodeIds = [nodeId];
					}
					if(selectNodeIds.length > 0){
						s3dManager.viewer.selectObject3Ds(selectNodeIds);
					}
					else{
						s3dManager.viewer.cancelSelectObject3Ds();
					}
				},
				onNodeCheckStatusChange: function(p){
					s3dManager.viewer.setObject3DsVisible(p.changedNodeIds, p.checked);
				}
			},
			toolbar: {
				//visible: true,
				buttonJArray: []
			},
			skyBox: {
				rootUrl: appInfo.path.application + "resources/skies/",
				skyList: skyList
			},
			serverObjectCreator: {},
			object3DCache: {},
			resourceLoader: {},
			exporter: {},
			messageBox: {},
			moveHelper: {},
			setting: {
				skyList: skyList
			},
			ruler:{},
			splitter: {},
			copier:{},
			materialPicker: {},
			localMaterialPicker: {},
			componentLibrary: {
				rootPath: appInfo.path.application + "resources/files/",
				categories: componentList
			},
		}
	});
	return manager;
}

$(document).ready(function(){
	s3dManager = initS3dManager();
});  