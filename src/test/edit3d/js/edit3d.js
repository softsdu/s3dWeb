import S3dManager from "../../../js/s3dWebManager.js";
import "../../../commonjs/jQuery/jquery.min.js";
import "../../../commonjs/common/common.js"
import {s3dNormalViewport, s3dViewerStatus} from "../../../commonjs/common/static.js"
import {componentList} from "./componentList.js"
import * as skyList from "../resources/skies/list.js";

let s3dManager = null;
const appInfo = {
	base: {
		name:"Edit3d",
		key: "f132d797-d6c7-45da-9ca9-950e67035967",
	},
	path:{
		root: "../../../",
		application: "../",
		resource: "../resources/",
		//resource: "https://oss/s3dweb_resources/edit3d/resources/",
		model: "models/testEdit.s3dc"
	}
}

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
			viewer: {
				showShadow: false,
				canSelectObject3D: true,
				mobileAutoRotate: true,
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
			toolbar: {
				visible: true,
				buttonJArray: [{
					id: "homeViewport",
					name: "初始视角",
					imgUrl: appInfo.path.root + "images/toolbar/home.png",
					onButtonClick: function(p){
						s3dManager.viewer.setNormalViewport(s3dNormalViewport.init);
					}
				},{
					id: "topViewport",
					name: "俯视",
					imgUrl: appInfo.path.root + "images/toolbar/topViewport.png",
					onButtonClick: function(p){
						s3dManager.viewer.setNormalViewport(s3dNormalViewport.top);
					}
				},{
					id: "ruler",
					name: "测距",
					imgUrl: appInfo.path.root + "images/toolbar/ruler.png",
					onButtonClick: function(p){
						s3dManager.ruler.do();
					}
				},{
					id: "splitter",
					name: "分解",
					imgUrl: appInfo.path.root + "images/toolbar/splitter.png",
					onButtonClick: function(p){
						s3dManager.splitter.do(p);
					}
				},{
					id: "s3dTreeEditor",
					name: "模型结构",
					imgUrl: appInfo.path.root + "images/toolbar/tree.png",
					onButtonClick: function(p){
						if(s3dManager.treeEditor.getVisible()){
							s3dManager.treeEditor.hide();
						}
						else{
							s3dManager.treeEditor.show();
						}
					}
				},{
					id: "s3dPropertyEditor",
					name: "属性编辑器",
					imgUrl: appInfo.path.root + "images/toolbar/property.png",
					onButtonClick: function(p){
						if(s3dManager.propertyEditor.getVisible()){
							s3dManager.propertyEditor.hide();
						}
						else{
							s3dManager.propertyEditor.show();
						}
					}
				},{
					id: "adder",
					name: "组件库",
					imgUrl: appInfo.path.root + "images/toolbar/componentList.png",
					onButtonClick: function(p){
						if(s3dManager.adder.getVisible()){
							s3dManager.adder.hide();
						}
						else{
							s3dManager.adder.show();
						}
					}
				},{
					id: "statusBar",
					name: "状态栏",
					imgUrl: appInfo.path.root + "images/toolbar/statusBar.png",
					onButtonClick: function(p){
						if(s3dManager.statusBar.getVisible()){
							s3dManager.statusBar.hide();
						}
						else{
							s3dManager.statusBar.show();
						}
					}
				},{
					id: "exporter",
					name: "导出",
					imgUrl: appInfo.path.root + "images/toolbar/exporter.png",
					onButtonClick: function(p){
						if(s3dManager.exporter.getVisible()){
							s3dManager.exporter.hide();
						}
						else{
							s3dManager.exporter.show();
						}
					}
				},{
					id: "setting",
					name: "配置",
					imgUrl: appInfo.path.root + "images/toolbar/setting.png",
					onButtonClick: function(p){
						if(s3dManager.setting.getVisible()){
							s3dManager.setting.hide();
						}
						else{
							s3dManager.setting.show();
						}
					}
				}]
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
				categories: componentList
			}
		}
	});
	return manager;
}

$(document).ready(function(){
	s3dManager = initS3dManager();
});