import S3dAdder from "../plugins/s3dAdder/s3dAdder.js";
import S3dAxis from "../plugins/s3dAxis/s3dAxis.js";
import S3dCopier from "../plugins/s3dCopier/s3dCopier.js";
import S3dExporter from "../plugins/s3dExporter/s3dExporter.js";
import S3dLoader from "../plugins/s3dLoader/s3dLoader.js";
import S3dMaterialPicker from "../plugins/s3dMaterialPicker/s3dMaterialPicker.js";
import S3dLocalMaterialPicker from "../plugins/s3dLocalMaterialPicker/s3dLocalMaterialPicker.js";
import S3dMessageBox from "../plugins/s3dMessageBox/s3dMessageBox.js";
import S3dMoveHelper from "../plugins/s3dMoveHelper/s3dMoveHelper.js";
import S3dObject3DCache from "../plugins/S3dObject3DCache/S3dObject3DCache.js";
import S3dResourceLoader from "../plugins/S3dResourceLoader/S3dResourceLoader.js";
import S3dServerObjectCreator from "../plugins/s3dServerObjectCreator/s3dServerObjectCreator.js";
import S3dLocalObjectCreator from "../plugins/S3dLocalObjectCreator/s3dLocalObjectCreator.js";
import S3dPointSelector from "../plugins/s3dPointSelector/s3dPointSelector.js";
import S3dPropertyEditor from "../plugins/s3dPropertyEditor/s3dPropertyEditor.js";
import S3dPropertyList from "../plugins/s3dPropertyList/s3dPropertyList.js";
import S3dRuler from "../plugins/s3dRuler/s3dRuler.js";
import S3dSetting from "../plugins/s3dSetting/s3dSetting.js";
import S3dSetting2D from "../plugins/s3dSetting2D/s3dSetting2D.js";
import S3dStatusBar from "../plugins/s3dStatusBar/s3dStatusBar.js";
import S3dTag from "../plugins/s3dTag/s3dTag.js";
import S3dToolbar from "../plugins/s3dToolbar/s3dToolbar.js";
import S3dTree from "../plugins/s3dTree/s3dTree.js";
import S3dTreeEditor from "../plugins/s3dTreeEditor/s3dTreeEditor.js";
import S3dViewer from "../plugins/s3dViewer/s3dViewer.js";
import S3dSkyBox from "../plugins/s3dSkyBox/s3dSkyBox.js";
import S3dComponentLibrary from "../plugins/S3dComponentLibrary/s3dComponentLibrary.js";
import S3dSplitter from "../plugins/s3dSplitter/s3dSplitter.js";
import S3dAppearanceSetting from "../plugins/s3dAppearanceSetting/s3dAppearanceSetting.js";
import S3dPathDrawingTool from "../plugins/s3dPathDrawingTool/S3dPathDrawingTool.js";
import S3dHouse2DToolbar from "../plugins/s3dHouse2DToolbar/s3dHouse2DToolbar.js";
import JS3StandardMaterials from "./materials/js3StandardMaterials.js"
import JS3LocalMaterials from "./materials/js3LocalMaterials.js";
import "../commonjs/jQuery/jquery.min.js";
import "../commonjs/bootstrap/bootstrap.min.js";
import "../commonjs/common/common.js";
import "../commonjs/common/common3D.js";
import "../commonjs/common/common2DLine.js";
import {cmnPcr, serverAccess} from "../commonjs/common/static.js";
import "../css/s3dManager.css"
import "../css/bootstrap.min.css"

//s3dWeb管理器
let S3dWebManager = function(){
	const thatS3dWebManager = this;
	
	//插件配置
	this.pluginConfigs = null;

	//容器
	this.containerId = null;

	//时间戳
	this.timestamp = null;

	//服务
	this.service = null;

	//3D模型相关
	this.s3dObject = null;

	//本地内存数据
	this.nodeId2jsonMap = null;

	//材质库
	this.standardMaterials = null;

	//本地材质库
	this.localMaterials = null;
	
	//应用插件
	//插件：模型加载器
	this.loader = null;

	//插件：3D查看器
	this.viewer = null;

	//插件：天空盒
	this.skyBox = null;
	
	//插件：模型结构树
	this.tree = null;
	
	//插件：模型结构树（可编辑）
	this.treeEditor = null;
	
	//插件：构件属性列表
	this.propertyList = null;
	
	//插件：工具栏
	this.toolbar = null;
	
	//插件：标记操作功能
	this.tag = null;

	//插件：状态栏
	this.statusBar = null;

	//插件：构件属性编辑器
	this.propertyEditor = null;

	//插件：资源加载
	this.resourceLoader = null;

	//插件：造型缓存
	this.object3DCache = null;

	//插件：本地造型功能
	this.localObjectCreator = null;

	//插件：服务器造型功能
	this.serverObjectCreator = null;

	//插件：导出模型（含保存）
	this.exporter = null;

	//插件：消息框
	this.messageBox = null;
	
	//插件：轴网（含地平面）
	this.axis = null;
	
	//插件：构件移动helper
	this.moveHelper = null;

	//插件：3D点选择功能（用于绘制）
	this.pointSelector = null;

	//插件：全局参数配置
	this.setting = null;

	//插件：测距功能
	this.ruler = null;

	//插件：复制粘贴构件功能
	this.copier = null;

	//插件：材质选择器
	this.materialPicker = null;

	//插件：分解工具
	this.splitter = null;

	//插件：外观设置
	this.appearanceSetting = null;

	//插件：2D绘图
	this.pathDrawingTool = null;

	//插件：户型工具栏
	this.house2DToolbar = null;

	//插件Map
	this.pluginMap = {};
	
	//初始化管理器
	this.init = function(initParams){
		thatS3dWebManager.pluginConfigs = initParams.pluginConfigs;
		thatS3dWebManager.containerId = initParams.containerId;
		thatS3dWebManager.timestamp = initParams.timestamp;
		if(initParams.service){
			thatS3dWebManager.service = {
				url: initParams.service.url,
				name: initParams.service.name,
				appKey: initParams.service.appKey,
				active: true
			}
		}
		thatS3dWebManager.initMaterials();
		thatS3dWebManager.initLocalMaterials();
		thatS3dWebManager.initLoader(initParams.pluginConfigs.loader);
	}

	this.initMaterials = function (){
		thatS3dWebManager.materials = new JS3StandardMaterials();
		thatS3dWebManager.materials.init({
			manager: thatS3dWebManager
		});
	}

	this.initLocalMaterials = function (){
		thatS3dWebManager.localMaterials = new JS3LocalMaterials();
		thatS3dWebManager.localMaterials.init({
			manager: thatS3dWebManager
		});
	}

	//调用服务器端方法
	this.request = function(p){
		if(thatS3dWebManager.service.active){
			serverAccess.request({			
				serverUrl: thatS3dWebManager.service.url,
				serviceName: thatS3dWebManager.service.name,
				appKey: thatS3dWebManager.service.appKey,
				funcName: p.funcName,
				args: {requestParam: cmnPcr.jsonToStr(p.requestParam)}, 
				successFunc: p.successFunc,
				failFunc: p.failFunc,
				errorFunc: function(httpRequest, textStatus, errorThrown){
					thatS3dWebManager.service.active = false;
					thatS3dWebManager.statusBar.refreshStatusText({
						status: thatS3dWebManager.viewer.status,
						message: "无法连通S3d服务"
					});
				}
			})
		}
		else{
			thatS3dWebManager.statusBar.refreshStatusText({
				status: thatS3dWebManager.viewer.status,
				message: "无法连通S3d服务"
			});
		}
	}

	this.addPluginToMap = function(name, pluginObject, isUI2D){
		thatS3dWebManager.pluginMap[name] = {
			name: name,
			object: pluginObject,
			isUI2D: isUI2D
		}
	}

	this.getUI2DPlugVisibilities = function (){
		let visibilities = [];
		for(let name in thatS3dWebManager.pluginMap){
			let pluginInfo = thatS3dWebManager.pluginMap[name];
			if(pluginInfo.isUI2D){
				visibilities.push({
					name: name,
					visible: pluginInfo.object.getVisible()
				});
			}
		}
		return visibilities;
	}

	this.setUI2DPlugVisibilities = function (visibilities){
		for(let i = 0; i < visibilities.length; i++){
			let visibility = visibilities[i];
			let name = visibility.name;
			let pluginInfo = thatS3dWebManager.pluginMap[name];
			if(pluginInfo.isUI2D){
				if(visibility.visible) {
					pluginInfo.object.show();
				}
				else{
					pluginInfo.object.hide();
				}
			}
		}
	}
	
	//初始化加载器
	this.initLoader = function(loaderConfig){
		thatS3dWebManager.loader = new S3dLoader();
		thatS3dWebManager.loader.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config:{
				modelInfo: loaderConfig.modelInfo,
				afterLoadS3dFile: function(p){
					thatS3dWebManager.s3dObject = p.s3dObject;

					//statusbar
					if(typeof S3dStatusBar != "undefined" && thatS3dWebManager.pluginConfigs.statusBar != null){
						thatS3dWebManager.initStatusBar(thatS3dWebManager.pluginConfigs.statusBar);
						thatS3dWebManager.addPluginToMap("statusBar", thatS3dWebManager.statusBar, true);
					}

					//object3DCache
					if(typeof S3dObject3DCache != "undefined" && thatS3dWebManager.pluginConfigs.object3DCache != null){
						thatS3dWebManager.initObject3DCache(thatS3dWebManager.pluginConfigs.object3DCache);
						thatS3dWebManager.addPluginToMap("object3DCache", thatS3dWebManager.object3DCache, false);
					}

					//object3DCreator
					if(typeof S3dResourceLoader != "undefined" && thatS3dWebManager.pluginConfigs.resourceLoader != null){
						thatS3dWebManager.initResourceLoader(thatS3dWebManager.pluginConfigs.resourceLoader);
						thatS3dWebManager.addPluginToMap("resourceLoader", thatS3dWebManager.resourceLoader, false);
					}

					//ComponentLibrary
					if(typeof S3dComponentLibrary != "undefined" && thatS3dWebManager.pluginConfigs.componentLibrary != null){
						thatS3dWebManager.initComponentLibrary(thatS3dWebManager.pluginConfigs.componentLibrary);
						thatS3dWebManager.addPluginToMap("componentLibrary", thatS3dWebManager.componentLibrary, false);
					}

					//localObjectCreator
					if(typeof S3dLocalObjectCreator != "undefined" && thatS3dWebManager.pluginConfigs.localObjectCreator != null){
						thatS3dWebManager.initLocalObjectCreator(thatS3dWebManager.pluginConfigs.localObjectCreator);
						thatS3dWebManager.addPluginToMap("localObjectCreator", thatS3dWebManager.localObjectCreator, false);
					}

					//serverObjectCreator
					if(typeof S3dServerObjectCreator != "undefined" && thatS3dWebManager.pluginConfigs.serverObjectCreator != null){
						thatS3dWebManager.initServerObjectCreator(thatS3dWebManager.pluginConfigs.serverObjectCreator);
						thatS3dWebManager.addPluginToMap("serverObjectCreator", thatS3dWebManager.serverObjectCreator, false);
					}

					//messageBox 
					if(typeof S3dMessageBox != "undefined" && thatS3dWebManager.pluginConfigs.messageBox != null){
						thatS3dWebManager.initMessageBox(thatS3dWebManager.pluginConfigs.messageBox);
						thatS3dWebManager.addPluginToMap("messageBox", thatS3dWebManager.messageBox, true);
					}

					//appearanceSetting
					if(typeof S3dAppearanceSetting != "undefined" && thatS3dWebManager.pluginConfigs.appearanceSetting != null){
						thatS3dWebManager.initAppearanceSetting(thatS3dWebManager.pluginConfigs.appearanceSetting);
						thatS3dWebManager.addPluginToMap("appearanceSetting", thatS3dWebManager.appearanceSetting, true);
					}

					//viewer
					if(typeof S3dViewer != "undefined" && thatS3dWebManager.pluginConfigs.viewer != null){
						thatS3dWebManager.initViewer(thatS3dWebManager.pluginConfigs.viewer);
						thatS3dWebManager.addPluginToMap("viewer", thatS3dWebManager.viewer, false);
					}

					//skyBox
					if(typeof S3dSkyBox != "undefined" && thatS3dWebManager.pluginConfigs.skyBox != null){
						thatS3dWebManager.initSkyBox(thatS3dWebManager.pluginConfigs.skyBox);
						thatS3dWebManager.addPluginToMap("skyBox", thatS3dWebManager.skyBox, false);
					}
					
					//adder 
					if(typeof S3dAdder != "undefined" && thatS3dWebManager.pluginConfigs.adder != null){
						thatS3dWebManager.initAdder(thatS3dWebManager.pluginConfigs.adder);
						thatS3dWebManager.addPluginToMap("adder", thatS3dWebManager.adder, true);
					}
					
					//toolbar 
					if(typeof S3dToolbar != "undefined" && thatS3dWebManager.pluginConfigs.toolbar != null){
						thatS3dWebManager.initToolbar(thatS3dWebManager.pluginConfigs.toolbar);
						thatS3dWebManager.addPluginToMap("toolbar", thatS3dWebManager.toolbar, true);
					}
					
					//tree 
					if(typeof S3dTree != "undefined" && thatS3dWebManager.pluginConfigs.tree != null){
						thatS3dWebManager.initTree(thatS3dWebManager.pluginConfigs.tree);
						thatS3dWebManager.addPluginToMap("tree", thatS3dWebManager.tree, true);
					}
					
					//treeEditor 
					if(typeof S3dTreeEditor != "undefined" && thatS3dWebManager.pluginConfigs.treeEditor != null){
						thatS3dWebManager.initTreeEditor(thatS3dWebManager.pluginConfigs.treeEditor);
						thatS3dWebManager.addPluginToMap("treeEditor", thatS3dWebManager.treeEditor, true);
					}
					
					//propertyList 
					if(typeof S3dPropertyList != "undefined" && thatS3dWebManager.pluginConfigs.propertyList != null){
						thatS3dWebManager.initPropertyList(thatS3dWebManager.pluginConfigs.propertyList);
						thatS3dWebManager.addPluginToMap("propertyList", thatS3dWebManager.propertyList, true);
					}	
					
					//tag 
					if(typeof S3dTag != "undefined" && thatS3dWebManager.pluginConfigs.tag != null){
						thatS3dWebManager.initTag(thatS3dWebManager.pluginConfigs.tag);
						thatS3dWebManager.addPluginToMap("tag", thatS3dWebManager.tag, false);
					}
					
					//propertyEditor 
					if(typeof S3dPropertyEditor != "undefined" && thatS3dWebManager.pluginConfigs.propertyEditor != null){
						thatS3dWebManager.initPropertyEditor(thatS3dWebManager.pluginConfigs.propertyEditor);
						thatS3dWebManager.addPluginToMap("propertyEditor", thatS3dWebManager.propertyEditor, true);
					}	
					
					//exporter 
					if(typeof S3dExporter != "undefined" && thatS3dWebManager.pluginConfigs.exporter != null){
						thatS3dWebManager.initExporter(thatS3dWebManager.pluginConfigs.exporter);
						thatS3dWebManager.addPluginToMap("exporter", thatS3dWebManager.exporter, true);
					}	
					
					//pointSelector 
					if(typeof S3dPointSelector != "undefined" && thatS3dWebManager.pluginConfigs.pointSelector != null){
						thatS3dWebManager.initPointSelector(thatS3dWebManager.pluginConfigs.pointSelector);
						thatS3dWebManager.addPluginToMap("pointSelector", thatS3dWebManager.pointSelector, false);
					}

					//setting 
					if(typeof S3dSetting != "undefined" && thatS3dWebManager.pluginConfigs.setting != null){
						thatS3dWebManager.initSetting(thatS3dWebManager.pluginConfigs.setting);
						thatS3dWebManager.addPluginToMap("setting", thatS3dWebManager.setting, true);
					}

					//setting2D
					if(typeof S3dSetting2D != "undefined" && thatS3dWebManager.pluginConfigs.setting2D != null){
						thatS3dWebManager.initSetting2D(thatS3dWebManager.pluginConfigs.setting2D);
						thatS3dWebManager.addPluginToMap("setting2D", thatS3dWebManager.setting2D, true);
					}

					//ruler 
					if(typeof S3dRuler != "undefined" && thatS3dWebManager.pluginConfigs.ruler != null){
						thatS3dWebManager.initRuler(thatS3dWebManager.pluginConfigs.ruler);
						thatS3dWebManager.addPluginToMap("ruler", thatS3dWebManager.ruler, false);
					}	
					
					//copier 
					if(typeof S3dCopier != "undefined" && thatS3dWebManager.pluginConfigs.copier != null){
						thatS3dWebManager.initCopier(thatS3dWebManager.pluginConfigs.copier);
						thatS3dWebManager.addPluginToMap("copier", thatS3dWebManager.copier, false);
					}

					//materialPicker 
					if(typeof S3dCopier != "undefined" && thatS3dWebManager.pluginConfigs.materialPicker != null){
						thatS3dWebManager.initMaterialPicker(thatS3dWebManager.pluginConfigs.materialPicker);
						thatS3dWebManager.addPluginToMap("materialPicker", thatS3dWebManager.materialPicker, true);
					}

					//localMaterialPicker
					if(typeof S3dCopier != "undefined" && thatS3dWebManager.pluginConfigs.localMaterialPicker != null){
						thatS3dWebManager.initLocalMaterialPicker(thatS3dWebManager.pluginConfigs.localMaterialPicker);
						thatS3dWebManager.addPluginToMap("localMaterialPicker", thatS3dWebManager.localMaterialPicker, true);
					}

					//splitter
					if(typeof S3dSplitter != "undefined" && thatS3dWebManager.pluginConfigs.splitter != null){
						thatS3dWebManager.initSplitter(thatS3dWebManager.pluginConfigs.splitter);
						thatS3dWebManager.addPluginToMap("splitter", thatS3dWebManager.splitter, false);
					}

					//pathDrawingTool
					if(typeof S3dPathDrawingTool != "undefined" && thatS3dWebManager.pluginConfigs.pathDrawingTool != null){
						thatS3dWebManager.initPathDrawingTool(thatS3dWebManager.pluginConfigs.pathDrawingTool);
						thatS3dWebManager.addPluginToMap("pathDrawingTool", thatS3dWebManager.pathDrawingTool, false);
					}

					//house3DToolbar
					if(typeof S3dHouse2DToolbar != "undefined" && thatS3dWebManager.pluginConfigs.house2DToolbar != null){
						thatS3dWebManager.initHouse2DToolbar(thatS3dWebManager.pluginConfigs.house2DToolbar);
						thatS3dWebManager.addPluginToMap("house3DToolbar", thatS3dWebManager.house2DToolbar, true);
					}
				}
			}
		});	
	}

	this.createViewer = function(){
		return new S3dViewer();
	}

	this.initViewer = function(viewerConfig){
		thatS3dWebManager.viewer = thatS3dWebManager.createViewer(); 
		thatS3dWebManager.viewer.addEventFunction("afterInitScene", function(p){
			//axis 
			if(typeof S3dAxis != "undefined" && thatS3dWebManager.pluginConfigs.axis != null){
				thatS3dWebManager.initAxis(thatS3dWebManager.pluginConfigs.axis);
			}	
			//moveHelper 
			if(typeof S3dMoveHelper != "undefined" && thatS3dWebManager.pluginConfigs.moveHelper != null){
				thatS3dWebManager.initMoveHelper(thatS3dWebManager.pluginConfigs.moveHelper);
			}	
		});  
		thatS3dWebManager.viewer.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: viewerConfig
		});	
	}

	this.createSkyBox = function(){
		return new S3dSkyBox();
	}

	this.initSkyBox = function(skyBoxConfig){
		thatS3dWebManager.skyBox = thatS3dWebManager.createSkyBox();
		thatS3dWebManager.skyBox.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: skyBoxConfig
		});
	}

	this.createAdder = function(){
		return new S3dAdder();
	}

	this.initAdder = function(adderConfig){
		thatS3dWebManager.adder = thatS3dWebManager.createAdder();
		thatS3dWebManager.adder.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: adderConfig
		});
	}

	this.createAxis = function(){
		return new S3dAxis();
	}

	this.initAxis = function(axisConfig){
		thatS3dWebManager.axis = thatS3dWebManager.createAxis(); 
		thatS3dWebManager.axis.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: axisConfig
		});
	}

	this.createMoveHelper = function(){
		return new S3dMoveHelper();
	}

	this.initMoveHelper = function(moveHelperConfig){
		thatS3dWebManager.moveHelper = thatS3dWebManager.createMoveHelper(); 
		thatS3dWebManager.moveHelper.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: moveHelperConfig
		});
	}

	this.createTree = function(){
		return new S3dTree();
	}
	
	this.initTree = function(treeConfig){
		thatS3dWebManager.tree = thatS3dWebManager.createTree(); 
		thatS3dWebManager.tree.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: treeConfig
		});
	}

	this.createTreeEditor = function(){
		return new S3dTreeEditor();
	}
	
	this.initTreeEditor = function(treeEditorConfig){
		thatS3dWebManager.treeEditor = thatS3dWebManager.createTreeEditor(); 
		thatS3dWebManager.treeEditor.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: treeEditorConfig
		});
	}

	this.createTag = function(){
		return new S3dTag();
	}
	
	this.initTag = function(tagConfig){
		thatS3dWebManager.tag = thatS3dWebManager.createTag(); 
		thatS3dWebManager.tag.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: tagConfig
		});
	}

	this.createPropertyList = function(){
		return new S3dPropertyList();
	}
	
	this.initPropertyList = function(propertyListConfig){
		thatS3dWebManager.propertyList = thatS3dWebManager.createPropertyList(); 
		thatS3dWebManager.propertyList.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: propertyListConfig
		});
	}

	this.createToolbar = function(){
		return new S3dToolbar();
	}
	
	this.initToolbar = function(toolbarConfig){
		thatS3dWebManager.toolbar = thatS3dWebManager.createToolbar();
		thatS3dWebManager.toolbar.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager, 
			config: toolbarConfig
		});
	}

	this.createStatusBar = function(){
		return new S3dStatusBar();
	}
	
	this.initStatusBar = function(statusBarConfig){
		thatS3dWebManager.statusBar = thatS3dWebManager.createStatusBar();
		thatS3dWebManager.statusBar.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager, 
			config: statusBarConfig
		});
	}

	this.createPropertyEditor = function(){
		return new S3dPropertyEditor();
	}
	
	this.initPropertyEditor = function(propertyEditorConfig){
		thatS3dWebManager.propertyEditor = thatS3dWebManager.createPropertyEditor();
		thatS3dWebManager.propertyEditor.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager, 
			config: propertyEditorConfig
		});
	}

	this.createObject3DCache = function(){
		return new S3dObject3DCache();
	}

	this.initObject3DCache = function(object3DCacheConfig){
		thatS3dWebManager.object3DCache = thatS3dWebManager.createObject3DCache();
		thatS3dWebManager.object3DCache.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: object3DCacheConfig
		});
	}

	this.createResourceLoader = function(){
		return new S3dResourceLoader();
	}

	this.initResourceLoader = function(resourceLoaderConfig){
		thatS3dWebManager.resourceLoader = thatS3dWebManager.createResourceLoader();
		thatS3dWebManager.resourceLoader.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: resourceLoaderConfig
		});
	}

	this.createServerObjectCreator = function(){
		return new S3dServerObjectCreator();
	}

	this.initServerObjectCreator = function(serverObjectCreatorConfig){
		thatS3dWebManager.serverObjectCreator = thatS3dWebManager.createServerObjectCreator();
		thatS3dWebManager.serverObjectCreator.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: serverObjectCreatorConfig
		});
	}

	this.createLocalObjectCreator = function(){
		return new S3dLocalObjectCreator();
	}

	this.initLocalObjectCreator = function(localObjectCreatorConfig){
		thatS3dWebManager.localObjectCreator = thatS3dWebManager.createLocalObjectCreator();
		thatS3dWebManager.localObjectCreator.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: localObjectCreatorConfig
		});
	}

	this.createExporter = function(){
		return new S3dExporter();
	}
	
	this.initExporter = function(exporterConfig){
		thatS3dWebManager.exporter = thatS3dWebManager.createExporter();
		thatS3dWebManager.exporter.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager, 
			config: exporterConfig
		});
	}

	this.createMessageBox = function(){
		return new S3dMessageBox();
	}
	
	this.initMessageBox = function(messageBoxConfig){
		thatS3dWebManager.messageBox = thatS3dWebManager.createMessageBox();
		thatS3dWebManager.messageBox.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager, 
			config: messageBoxConfig
		});
	}

	this.createPointSelector = function(){
		return new S3dPointSelector();
	}
	
	this.initPointSelector = function(pointSelectorConfig){
		thatS3dWebManager.pointSelector = thatS3dWebManager.createPointSelector();
		thatS3dWebManager.pointSelector.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager, 
			config: pointSelectorConfig
		});
	}

	this.createSetting = function(){
		return new S3dSetting();
	}

	this.initSetting = function(settingConfig){
		thatS3dWebManager.setting = thatS3dWebManager.createSetting();
		thatS3dWebManager.setting.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: settingConfig
		});
	}

	this.createSetting2D = function(){
		return new S3dSetting2D();
	}

	this.initSetting2D = function(setting2DConfig){
		thatS3dWebManager.setting2D = thatS3dWebManager.createSetting2D();
		thatS3dWebManager.setting2D.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: setting2DConfig
		});
	}

	this.createRuler = function(){
		return new S3dRuler();
	}
	
	this.initRuler = function(rulerConfig){
		thatS3dWebManager.ruler = thatS3dWebManager.createRuler();
		thatS3dWebManager.ruler.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager, 
			config: rulerConfig
		});
	}

	this.createCopier = function(){
		return new S3dCopier();
	}

	this.initCopier = function(copierConfig){
		thatS3dWebManager.copier = thatS3dWebManager.createCopier();
		thatS3dWebManager.copier.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: copierConfig
		});
	}

	this.createMaterialPicker = function(){
		return new S3dMaterialPicker();
	}

	this.initMaterialPicker = function(materialPickerConfig){
		thatS3dWebManager.materialPicker = thatS3dWebManager.createMaterialPicker();
		thatS3dWebManager.materialPicker.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: materialPickerConfig
		});
	}

	this.createLocalMaterialPicker = function(){
		return new S3dLocalMaterialPicker();
	}

	this.initLocalMaterialPicker = function(localMaterialPickerConfig){
		thatS3dWebManager.localMaterialPicker = thatS3dWebManager.createLocalMaterialPicker();
		thatS3dWebManager.localMaterialPicker.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: localMaterialPickerConfig
		});
	}

	this.createComponentLibrary = function(){
		return new S3dComponentLibrary();
	}

	this.initComponentLibrary = function(componentLibraryConfig){
		thatS3dWebManager.componentLibrary = thatS3dWebManager.createComponentLibrary();
		thatS3dWebManager.componentLibrary.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: componentLibraryConfig
		});
	}

	this.createSplitter = function(){
		return new S3dSplitter();
	}

	this.initSplitter = function(splitterConfig){
		thatS3dWebManager.splitter = thatS3dWebManager.createSplitter();
		thatS3dWebManager.splitter.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: splitterConfig
		});
	}

	this.createAppearanceSetting = function(){
		return new S3dAppearanceSetting();
	}

	this.initAppearanceSetting = function(appearanceSettingConfig){
		thatS3dWebManager.appearanceSetting = thatS3dWebManager.createAppearanceSetting();
		thatS3dWebManager.appearanceSetting.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: appearanceSettingConfig
		});
	}

	this.createPathDrawingTool = function(){
		return new S3dPathDrawingTool();
	}

	this.initPathDrawingTool = function(pathDrawingToolConfig){
		thatS3dWebManager.pathDrawingTool = thatS3dWebManager.createPathDrawingTool();
		thatS3dWebManager.pathDrawingTool.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: pathDrawingToolConfig
		});
	}

	this.createHouse2DToolbar = function(){
		return new S3dHouse2DToolbar();
	}

	this.initHouse2DToolbar = function(house2DToolbarConfig){
		thatS3dWebManager.house2DToolbar = thatS3dWebManager.createHouse2DToolbar();
		thatS3dWebManager.house2DToolbar.init({
			containerId: thatS3dWebManager.containerId,
			manager: thatS3dWebManager,
			config: house2DToolbarConfig
		});
	}
}
export default S3dWebManager
