import S3dManager from "../../../js/s3dWebManager.js";
import "../../../commonjs/jQuery/jquery.min.js";
import "../../../commonjs/common/common.js"
import {cmnPcr, msgBox, s3dViewerStatus, serverAccess} from "../../../commonjs/common/static.js"

let s3dManager = null;

const appInfo = {
	base: {
		name:"House2dEditor",
		key: "56b98b34-1050-4d01-9537-8e909750c63d",
	},
	path:{
		root: "../../../",
		application: "../",
		server: "http://localhost:8080/design3d/",
		componentConfig: "web/design/s3d/appFiles/"
	},
	service:{
		model: {
			serviceName: "s3dModelNcpService",
			saveFunctionName: "saveModel",
			getFunctionName: "getModel"
		},
		component: {
			serviceName: "s3dModelNcpService",
			getConfigFunctionName: "getAppComponentConfigText"
		}
	}
}

const unitTypeConfig = {
	path2D: {
		categoryCodes: ["912070"]
	},
	room2D: {
		categoryCode: "912070",
		defaultCode: "912070-0099",
		defaultVersionNum: "1.0"
	},
	wall2D: {
		categoryCode: "912030",
		defaultCode: "912030-0099",
		defaultVersionNum: "1.0"
	},
	window2D: {
		categoryCode: "912060",
		//离地距离（mm)
		distanceToGround: 5000
	},
	door2D: {
		categoryCode: "912050",
		//离地距离（mm)
		distanceToGround: 5000
	}
}

const getAppComponentFileUrl = function (appInfo){
	return appInfo.path.server + appInfo.path.componentConfig + appInfo.name + ".js"
}

//判断是否为可绘制路径的构件
const checkIsPathUnit = function (unitCode){
	for(let i = 0; i < unitTypeConfig.path2D.categoryCodes.length; i++){
		let pathCategoryCode = unitTypeConfig.path2D.categoryCodes[i];
		if(unitCode.startWith(pathCategoryCode)){
			return true;
		}
	}
	return false;
}

function loadAppComponentConfig(appInfo, modelId, afterLoadJsFunction, afterS3dFunction){
	let requestParam = {
		appName: appInfo.base.name
	};
	serverAccess.request({
		serverUrl: appInfo.serverRoot,
		serviceName: appInfo.service.component.serviceName,
		appKey: appInfo.appKey,
		funcName: appInfo.service.component.getConfigFunctionName,
		args: {requestParam: cmnPcr.jsonToStr(requestParam)},
		successFunc: function (obj) {
			let componentConfigText = decodeURIComponent(obj.result.componentConfigText);
			let componentConfigJson = cmnPcr.strToJson(componentConfigText);
			afterLoadJsFunction(appInfo, modelId, componentConfigJson, afterS3dFunction);
		},
		failFunc: function (obj) {
			msgBox.error({title: "提示", info: obj.message});
		},
		errorFunc: function(httpRequest, textStatus, errorThrown){
			msgBox.error({info: "无法连通S3d服务"});
		}
	});
}

function loadS3dFile(appInfo, modelId, s3dComponentList, afterS3dFunction){
	let requestParam = {
		modelId: modelId
	};
	serverAccess.request({
		serverUrl: appInfo.path.server,
		serviceName: appInfo.service.model.serviceName,
		appKey: appInfo.base.key,
		funcName: appInfo.service.model.getFunctionName,
		args: {requestParam: cmnPcr.jsonToStr(requestParam)},
		successFunc: function (obj) {
			let modelInfo = obj.result.modelInfo;
			let s3dText = decodeURIComponent(modelInfo.text);
			afterS3dFunction(appInfo, s3dComponentList, modelInfo.id, modelInfo.name, s3dText);
		},
		failFunc: function (obj) {
			msgBox.error({title: "提示", info: obj.message});
		},
		errorFunc: function(httpRequest, textStatus, errorThrown){
			msgBox.error({info: "无法连通S3d服务"});
		}
	})
}

function initS3dManager(appInfo, s3dComponentList, s3dModelId, s3dModelName, s3dText){
	s3dManager = new S3dManager();
	s3dManager.init({
		containerId: "s3dViewerContainerId",
		service: {
			url: appInfo.path.server,
			name: appInfo.service.model.serviceName,
			appKey: appInfo.base.key,
		},
		pluginConfigs: {
			loader: {
				modelInfo:{
					id: s3dModelId,
					name: s3dModelName,
					text: s3dText
				}
			},
			viewer: {
				showShadow: false,
				canSelectObject3D: true,
				mobileAutoRotate: true,
				lineSelectThreshold: 0.04,
				hemisphereLight: {
					intensity: 0.7
				},
				directionalLights: [
					{
						intensity: 0.4
					},
					{
						intensity: 0.0
					},
					{
						intensity: 0.0
					}
				],
				detailLevel: 4,
				orbitControlConfig: {
					perspective: {
						near: 0.1,
						far: 1000,
						enableRotate: true,
						enableZoom: true,
						enablePan: true
					},
					orthographic: {
						near: -1000,
						far: 1000,
						enableRotate: true,
						enableZoom: true,
						enablePan: true
					}
				},
				onSelectChanged: function (p) {
					s3dManager.propertyEditor.refreshProperties(p.nodeJArray);
					s3dManager.treeEditor.highlightNodes(p.nodeJArray);
					s3dManager.moveHelper.attach(p.nodeJArray);
				},
				afterAddNewObject: function (p) {
					s3dManager.treeEditor.addLeafNode(p.nodeJson, p.groupNodeId);

					//将门窗的离地高度设置为1m，为了显示在墙和房间之上
					let isWindow = p.nodeJson.code.startWith(unitTypeConfig.window2D.categoryCode);
					let isDoor = p.nodeJson.code.startWith(unitTypeConfig.door2D.categoryCode);
					if(isWindow || isDoor){
						//获取高度
						let unitId = p.nodeJson.id;
						let object3D = s3dManager.viewer.getObject3DById(unitId);
						let box = s3dManager.viewer.getObject3DBox3(object3D);
						let unitHeight = box.max.y - box.min.y;
						let distanceToGround = common3DFunction.mm2m(isWindow ? unitTypeConfig.window2D.distanceToGround : (isDoor ? unitTypeConfig.door2D.distanceToGround : 0));
						let unitPositionY = unitHeight / 2 + distanceToGround;
						s3dManager.viewer.setObject3DPosition(unitId, {
							x: object3D.position.x,
							y: unitPositionY,
							z: object3D.position.z
						});
					}
				},
				afterRebuildObject: function (p) {
				},
				beforeRemoveObjects: function (p) {
					s3dManager.moveHelper.detach();
				},
				afterRemoveObject: function (p) {
					s3dManager.treeEditor.removeLeafNode(p.nodeId);
				},
				afterInitAllObjects: function (p) {
				},

				//在图层上mouseDown
				onMouseDownUserLayerObject: function (p) {
					//触发选中/取消选中功能
					s3dManager.pathDrawingTool.onMouseDown(p);
				},

				//在图层上mouseUp
				onMouseUpUserLayerObject: function (p) {

				},

				//在图层上做鼠标移动
				onMouseMoveUserLayerObject: function (p) {
					//如果有选中的点或线，那么执行拖拽
					s3dManager.pathDrawingTool.onMouseMove(p);
				},

				//如果单击是绘制路径图层，那么说明正在处理绘制路径的操作
				onClickLayerObject: function (p) {

				},

				//如果双击的路径构件，那么调用绘制路径插件，开始绘制路径
				onDblClickObject: function (p) {
					if (p.object3D != null && checkIsPathUnit(p.object3D.userData.unitInfo.code)) {

						//转为draw状态
						s3dManager.viewer.changeStatus({
							status: s3dViewerStatus.draw
						});

						let unitInfo = p.object3D.userData.unitInfo;
						s3dManager.pathDrawingTool.show({
							id: unitInfo.id,
							pointStr: unitInfo.parameters["点"].value,
							lineStr: unitInfo.parameters["线"].value,
							constraintStr: unitInfo.parameters["约束"].value,
							pathStr: unitInfo.parameters["路径"].value
						});
					}
				},

				//图层上keydown
				onKeyDownUserLayerObject: function (p) {
					//如果有选中的点或线，那么执行拖拽
					s3dManager.pathDrawingTool.onKeyDown(p);
				}
			},
			adder: {
				title: "组件库",
				visible: true,
				mdlTypes: ["component2d"]
			},
			treeEditor: {
				title: "模型结构",
				visible: true,
				onNodeClick: function (p) {
					let nodeId = p.nodeJson.id;
					let selectNodeIds = null;
					s3dManager.viewer.changeStatus({
						status: s3dViewerStatus.normalView
					});
					if (p.nodeJson.isGroup) {
						selectNodeIds = s3dManager.treeEditor.getChildNodeIds(nodeId);
					} else {
						selectNodeIds = [nodeId];
					}
					if (selectNodeIds.length > 0) {
						s3dManager.viewer.selectObject3Ds(selectNodeIds);
					} else {
						s3dManager.viewer.cancelSelectObject3Ds();
					}
				},
				onNodeCheckStatusChange: function (p) {
					s3dManager.viewer.setObject3DsVisible(p.changedNodeIds, p.checked);
				}
			},
			house2DToolbar: {
				visible: true,
				title: "户型工具栏",
				imageDirectory: appInfo.path.application + "images/toolbar/",
				unitTypeConfig: {
					room2D: unitTypeConfig.room2D,
					wall2D: unitTypeConfig.wall2D
				},
				serviceConfig:{
					save: {
						serviceName: appInfo.service.model.serviceName,
						functionName: appInfo.service.model.saveFunctionName
					}
				}
			},
			toolbar: {
				visible: false,
				buttonJArray: []
			},
			axis: {
				hasAxis: true,
				hasPlane: true,
				groundColor: 0xDDDDDD,
				gridColor: 0xCCCCCC,
				borderColor: 0xBBBBBB,
				textColor: 0xBBBBBB,
				fontUrl: appInfo.path.application + "resources/fonts/helvetiker_bold.typeface.json"
			},
			statusBar: {
				visible: true
			},
			propertyEditor: {
				visible: true,
				isProperty2DOnly: true
			},
			serverObjectCreator: {},
			object3DCache: {},
			resourceLoader: {},
			exporter: {},
			messageBox: {},
			moveHelper: {
				attachDistance: 0.1,
				onObject3DPositionChanged: function (p) {
					s3dManager.propertyEditor.refreshBaseValues(p.unitJson);
				},
			},
			pointSelector: {
				placePointRadius: 0.1
			},
			setting2D: {},
			ruler: {},
			splitter: {},
			copier: {},
			materialPicker: {},
			localMaterialPicker: {},
			componentLibrary: {
				rootPath: appInfo.path.application + "resources/files/",
				categories: s3dComponentList
			},
			pathDrawingTool: {
				fontUrl: appInfo.path.application + "resources/fonts/helvetiker_bold.typeface.json"
			}
		}
	});
}

$(document).ready(function() {
	let args = cmnPcr.getQueryStringArgs();
	let modelId = args["modelId"];
	let modelName = args["modelName"];
	let serverRoot = args["serverRoot"];
	if(serverRoot != null) {
		if(!serverRoot.endsWith("/")){
			serverRoot = serverRoot + "/";
		}
		appInfo.path.root = serverRoot;
	}
	$("title").text(modelName + " - SinoBIM装修二维设计");
	loadAppComponentConfig(appInfo, modelId, loadS3dFile, initS3dManager);
});