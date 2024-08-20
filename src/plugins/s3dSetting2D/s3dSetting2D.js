import {cmnPcr, msgBox} from "../../commonjs/common/static.js"
import "./s3dSetting2D.css"

//S3dSetting2D 配置
let S3dSetting2D = function (){
	
	//当前对象
	const thatS3dSetting2D = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;  
	
	//title
	this.title = null; 

	this.settings = {};

	//初始化
	this.init = function(p){
		thatS3dSetting2D.containerId = p.containerId;
		thatS3dSetting2D.manager = p.manager;
		thatS3dSetting2D.title = p.config.title == null ? "配置" : p.config.title;
	}
	 
	//initHtml
	this.initHtml = function(){
		let winHtml = thatS3dSetting2D.getWinHtml();
		$("#" + thatS3dSetting2D.containerId).append(winHtml);	 
	}  

	this.getCurrentCameraInfo = function(){
		let container = $("#" + thatS3dSetting2D.containerId).find(".s3dSetting2DContainer")[0];

		let cameraInfo = thatS3dSetting2D.manager.viewer.getCurrentCameraInfo();
		$(container).find(".s3dSetting2DItemInput[name='cameraTarget']").val(
			common3DFunction.m2mm(cameraInfo.target[0]).toFixed(0) + ", " +
			common3DFunction.m2mm(cameraInfo.target[1]).toFixed(0) + ", " +
			common3DFunction.m2mm(cameraInfo.target[2]).toFixed(0));
		$(container).find(".s3dSetting2DItemInput[name='cameraPosition']").val(
			common3DFunction.m2mm(cameraInfo.position[0]).toFixed(0) + ", " +
			common3DFunction.m2mm(cameraInfo.position[1]).toFixed(0) + ", " +
			common3DFunction.m2mm(cameraInfo.position[2]).toFixed(0));
		$(container).find(".s3dSetting2DItemInput[name='cameraZoom']").val(cameraInfo.zoom.toFixed(2));
	}
    	
	//隐藏
	this.hide = function(){
		$("#" + thatS3dSetting2D.containerId).find(".s3dSetting2DContainer").css({"display": "none"});
	}
	
	//获取显示状态
	this.getVisible = function(){
		return $("#" + thatS3dSetting2D.containerId).find(".s3dSetting2DContainer").css("display") === "block";
	}
	
	//隐藏
	this.show = function(){
		let container = $("#" + thatS3dSetting2D.containerId);
		if($(container).find(".s3dSetting2DContainer").length === 0){
			thatS3dSetting2D.initHtml(); 
			$(container).find(".s3dSetting2DTitle").text(thatS3dSetting2D.title);
			$(container).find(".s3dSetting2DCloseBtn").click(function(){
				thatS3dSetting2D.hide();
			});
			$(container).find(".s3dSetting2DBottomButton[name='cancel']").click(function(){
				thatS3dSetting2D.hide();
			});
			$(container.find(".s3dSetting2DBottomButton[name='ok']")).click(function(){
				if(thatS3dSetting2D.save()) {
					thatS3dSetting2D.hide();
				}
			});
			$(container).find(".s3dSetting2DGroupButton[name='getCurrentCameraInfo']").click(function(){
				thatS3dSetting2D.getCurrentCameraInfo();
			});

			//参数值录入框，数值类型
			let allDecimalInputs = $(container).find(".s3dSetting2DItemDecimal");
			$(allDecimalInputs).bind("keypress", function(e) {
				return e.key >= '0' && e.key <= '9' || e.key === '.' || e.key === '-';
			}); 
			$(allDecimalInputs).bind("dragenter", function(e) {
				return false;
			});  
			$(allDecimalInputs).change( function(e) {
				thatS3dSetting2D.changeDecimalValue(this);
			}); 

		}
		$(container).find(".s3dSetting2DContainer").css({"display": "block"});
		
		thatS3dSetting2D.refreshValues();
	}

	this.getValues = function(){		
		let container = $("#" + thatS3dSetting2D.containerId).find(".s3dSetting2DContainer")[0];
		let targetStr = $(container).find(".s3dSetting2DItemInput[name='cameraTarget']").val();
		let positionStr = $(container).find(".s3dSetting2DItemInput[name='cameraPosition']").val();
		let zoomStr = $(container).find(".s3dSetting2DItemInput[name='cameraZoom']").val();
		let cameraInfo = null;
		if(targetStr.length !== 0){
			let targetStrs = targetStr.split(",");
			let positionStrs = positionStr.split(",");
			cameraInfo = {
				type: "Orthographic",
				target: [
					common3DFunction.mm2m(cmnPcr.strToDecimal(targetStrs[0])),
					common3DFunction.mm2m(cmnPcr.strToDecimal(targetStrs[1])),
					common3DFunction.mm2m(cmnPcr.strToDecimal(targetStrs[2]))
				],
				position: [
					common3DFunction.mm2m(cmnPcr.strToDecimal(positionStrs[0])),
					common3DFunction.mm2m(cmnPcr.strToDecimal(positionStrs[1])),
					common3DFunction.mm2m(cmnPcr.strToDecimal(positionStrs[2]))
				],
				zoom: cmnPcr.strToDecimal(zoomStr)
			};
		}

		let modelName = $(container).find(".s3dSetting2DItemInput[name='modelName']").val().trim();

		let axisSizeX = common3DFunction.mm2m(cmnPcr.strToDecimal($(container).find(".s3dSetting2DItemInput[name='axisSizeX']").val()));
		let axisSizeZ = common3DFunction.mm2m(cmnPcr.strToDecimal($(container).find(".s3dSetting2DItemInput[name='axisSizeZ']").val()));
		let gridSpace = common3DFunction.mm2m(cmnPcr.strToDecimal($(container).find(".s3dSetting2DItemInput[name='gridSpace']").val()));
		let fontSize = common3DFunction.mm2m(cmnPcr.strToDecimal($(container).find(".s3dSetting2DItemInput[name='fontSize']").val()));

		return {
			modelName: modelName,
			cameraInfo: cameraInfo,
			sceneInfo: {
				skyBoxName: "None",
			},
			axisInfo: {
				size: {
					x: axisSizeX,
					y: 1,
					z: axisSizeZ,
				},
				gridSpace: gridSpace,
				fontSize: fontSize
			}
		};
	}
	this.save = function(){
		let values = thatS3dSetting2D.getValues();
		let errorInfo = "";
		if(values.modelName.length === 0){
			errorInfo += "'模型名称'不可为空.\r\n";
		}
		if(errorInfo.length > 0){
			msgBox.alert({info: errorInfo});
			return false;
		}
		else{
			thatS3dSetting2D.manager.loader.setModelName(values.modelName);
			thatS3dSetting2D.manager.viewer.setCameraInfo(values.cameraInfo);
			thatS3dSetting2D.manager.axis.setAxisInfo(values.axisInfo);
			return true;
		}
	}

	this.changeDecimalValue = function(inputCtrl){
		let propertyName = $(inputCtrl).attr("name");
		let precision = parseInt($(inputCtrl).attr("precision"));
		let propertyValueStr = $(inputCtrl).val().trim(); 
		if(propertyValueStr.length > 0){
			let propertyValue = cmnPcr.strToDecimal(propertyValueStr);
			propertyValue = cmnPcr.toFixed(propertyValue, precision);
			$(inputCtrl).val(propertyValue);
		}
	}

	this.refreshValues = function(){
		let container = $("#" + thatS3dSetting2D.containerId).find(".s3dSetting2DContainer")[0];

		let cameraInfo = thatS3dSetting2D.manager.viewer.getCameraInfo();
		$(container).find(".s3dSetting2DItemInput[name='cameraTarget']").val(common3DFunction.m2mm(cameraInfo.target[0]) + ", " + common3DFunction.m2mm(cameraInfo.target[1]) + ", " + common3DFunction.m2mm(cameraInfo.target[2]));
		$(container).find(".s3dSetting2DItemInput[name='cameraPosition']").val(common3DFunction.m2mm(cameraInfo.position[0]) + ", " + common3DFunction.m2mm(cameraInfo.position[1]) + ", " + common3DFunction.m2mm(cameraInfo.position[2]));
		$(container).find(".s3dSetting2DItemInput[name='cameraZoom']").val(cameraInfo.zoom);


		let modelName = thatS3dSetting2D.manager.s3dObject.name;
		$(container).find(".s3dSetting2DItemInput[name='modelName']").val(modelName)

		let axisInfo = thatS3dSetting2D.manager.s3dObject.axis;
		$(container).find(".s3dSetting2DItemInput[name='axisSizeX']").val(common3DFunction.m2mm(axisInfo.size.x));
		$(container).find(".s3dSetting2DItemInput[name='axisSizeZ']").val(common3DFunction.m2mm(axisInfo.size.z));
		$(container).find(".s3dSetting2DItemInput[name='gridSpace']").val(common3DFunction.m2mm(axisInfo.gridSpace));
		$(container).find(".s3dSetting2DItemInput[name='fontSize']").val(common3DFunction.m2mm(axisInfo.fontSize));
	}
	
	//获取html
	this.getWinHtml = function(){

		return  "<div class=\"s3dSetting2DContainer\">"
			+ "<div class=\"s3dSetting2DBackground\"></div>"
			+ "<div class=\"s3dSetting2DOuterContainer\">"
			+ "<div class=\"s3dSetting2DHeader\">"
			+ "<div class=\"s3dSetting2DTitle\"></div>"
			+ "<div class=\"s3dSetting2DCloseBtn\">×</div>"
			+ "</div>"
			+ "<div class=\"s3dSetting2DInnerContainer\">"
			+ "<div class=\"s3dSetting2DItemGroupContainer\">"
			+ "<div class=\"s3dSetting2DItemGroupTitle\">基本信息</div>"
			+ "</div>"
			+ "<div class=\"s3dSetting2DItemContainer\">"
			+ "<div class=\"s3dSetting2DItemTitle\">模型名称</div>"
			+ "<div class=\"s3dSetting2DItemValue\"><input type=\"text\" name=\"modelName\" class=\"s3dSetting2DItemInput s3dSettingItemString\" /></div>"
			+ "</div>"
			+ "<div class=\"s3dSetting2DItemGroupContainer\">"
			+ "<div class=\"s3dSetting2DItemGroupTitle\">网格（mm）</div>"
			+ "</div>"
			+ "<div class=\"s3dSetting2DItemContainer\">"
			+ "<div class=\"s3dSetting2DItemTitle\">水平</div>"
			+ "<div class=\"s3dSetting2DItemValue\"><input type=\"number\" name=\"axisSizeX\" min=\"1\" class=\"s3dSetting2DItemInput s3dSettingItemString\"></input></div>"
			+ "</div>"
			+ "<div class=\"s3dSetting2DItemContainer\">"
			+ "<div class=\"s3dSetting2DItemTitle\">竖直</div>"
			+ "<div class=\"s3dSetting2DItemValue\"><input type=\"number\" name=\"axisSizeZ\" min=\"1\" class=\"s3dSetting2DItemInput s3dSettingItemString\"></input></div>"
			+ "</div>"
			+ "<div class=\"s3dSetting2DItemContainer\">"
			+ "<div class=\"s3dSetting2DItemTitle\">间隔大小</div>"
			+ "<div class=\"s3dSetting2DItemValue\"><input type=\"number\" name=\"gridSpace\" min=\"1\" class=\"s3dSetting2DItemInput s3dSettingItemString\"></input></div>"
			+ "</div>"
			+ "<div class=\"s3dSetting2DItemContainer\">"
			+ "<div class=\"s3dSetting2DItemTitle\">字体大小</div>"
			+ "<div class=\"s3dSetting2DItemValue\"><input type=\"number\" name=\"fontSize\" min=\"1\" class=\"s3dSetting2DItemInput s3dSettingItemString\"></input></div>"
			+ "</div>"
			+ "<div class=\"s3dSetting2DItemGroupContainer\">"
			+ "<div class=\"s3dSetting2DItemGroupTitle\">初始视角（mm）</div>"
			+ "<div name=\"getCurrentCameraInfo\" class=\"s3dSetting2DGroupButton\">获取当前视角</div>"
			+ "</div>"
			+ "<div class=\"s3dSetting2DItemContainer\">"
			+ "<div class=\"s3dSetting2DItemTitle\">目标坐标</div>"
			+ "<div class=\"s3dSetting2DItemValue\"><input type=\"text\" placeholder=\"未指定\" name=\"cameraTarget\" readonly=\"readonly\" class=\"s3dSetting2DItemInput s3dSettingItemReadonly\" /></div>"
			+ "</div>"
			+ "<div class=\"s3dSetting2DItemContainer\">"
			+ "<div class=\"s3dSetting2DItemTitle\">摄像机坐标</div>"
			+ "<div class=\"s3dSetting2DItemValue\"><input type=\"text\" placeholder=\"未指定\" name=\"cameraPosition\" readonly=\"readonly\" class=\"s3dSetting2DItemInput s3dSettingItemReadonly\" /></div>"
			+ "</div>"  
			+ "<div class=\"s3dSetting2DItemContainer\">"
			+ "<div class=\"s3dSetting2DItemTitle\">缩放</div>"
			+ "<div class=\"s3dSetting2DItemValue\"><input type=\"text\" placeholder=\"未指定\" name=\"cameraZoom\" readonly=\"readonly\" class=\"s3dSetting2DItemInput s3dSettingItemReadonly\" /></div>"
			+ "</div>"
			+ "<div class=\"s3dSetting2DBottomContainer\">"
			+ "<div class=\"s3dSetting2DBottomButton\" name=\"cancel\">取消</div>"
			+ "<div class=\"s3dSetting2DBottomButton\" name=\"ok\">确定</div>"
			+ "</div>"  
			+ "</div>"
			+ "</div>"
			+ "</div>";
	}
}
export default S3dSetting2D