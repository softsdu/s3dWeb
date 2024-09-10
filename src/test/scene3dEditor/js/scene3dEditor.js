import S3dManager from "../../../js/s3dWebManager.js";
import "../../../commonjs/jQuery/jquery.min.js";
import "../../../commonjs/common/common.js"
import {cmnPcr, msgBox, s3dNormalViewport, s3dViewerStatus, serverAccess} from "../../../commonjs/common/static.js"
import {componentList} from "./componentList.js"
import * as skyList from "../resources/skies/list.js";

let s3dManager = null;
const appInfo = {
	base: {
		name:"Scene3dEditor",
		key: "7789e1d9-b9e5-42e9-a771-310812b582ab",
	},
	path:{
		root: "../../../",
		application: "../../../",
		resource: "../resources/",
		server: "http://60.216.19.243:8778/tada3d/",
		//server: "http://localhost:8080/tada3d/",
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
				useHighlightMaterial: false,
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
				onSelectChanged: function(p){
					s3dManager.propertyEditor.refreshProperties(p.nodeJArray);
					s3dManager.treeEditor.highlightNodes(p.nodeJArray);
					s3dManager.moveHelper.attach(p.nodeJArray);
				},
				afterAddNewObject: function(p){
					s3dManager.treeEditor.addLeafNode(p.nodeJson, p.groupNodeId);
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
				}
			},
			adder: {
				title: "组件库",
				visible: true
			},
			treeEditor: {
				title: "模型结构",
				visible: true,
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
			scene3dToolbar: {
				visible: true,
				title: "工具栏",
				imageDirectory: appInfo.path.application + "images/toolbar/",
				unitTypeConfig: {
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
			skyBox: {
				rootUrl: appInfo.path.resource + "skies/",
				skyList: skyList
			},
			axis: {
				hasAxis: true,
				hasPlane: true,
				fontUrl: appInfo.path.resource + "fonts/helvetiker_bold.typeface.json"
			},
			statusBar: {
				visible: true
			},
			propertyEditor: {
				visible: true
			},
			localObjectCreator: {
				imageFolder: appInfo.path.resource + "materialImages/"
			},
			serverObjectCreator: {},
			object3DCache: {},
			resourceLoader: {},
			exporter: {},
			messageBox: {},
			moveHelper: {
				attachDistance: 0.1,
				onObject3DPositionChanged: function(p){
					s3dManager.propertyEditor.refreshBaseValues(p.unitJson);
				},
			},
			pointSelector: {
				placePointRadius: 0.1
			},
			setting: {
				skyList: skyList
			},
			ruler:{},
			splitter: {},
			copier:{ },
			materialPicker: {},
			localMaterialPicker: {},
			componentLibrary: {
				rootPath: appInfo.path.resource + "files/",
				categories: s3dComponentList
			}
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

function loadAppComponentConfig(appInfo, modelId, afterLoadJsFunction, afterS3dFunction){
	let requestParam = {
		appName: appInfo.base.name
	};
	serverAccess.request({
		serverUrl: appInfo.server,
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
	$("title").text(modelName + " - 场景三维设计");
	loadAppComponentConfig(appInfo, modelId, loadS3dFile, initS3dManager);
});