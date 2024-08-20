import GltfFileGenerator from "./generator/gltfFileGenerator.js";
import S3dFileGenerator from "./generator/s3dFileGenerator.js";
import "./s3dExporter.css"

//S3dWeb 导出器
let S3dExporter = function (){
	
	//当前对象
	const thatS3dExporter = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;  
			 
	//title
	this.title = null;

	//初始化
	this.init = function(p){
		thatS3dExporter.containerId = p.containerId;
		thatS3dExporter.manager = p.manager;    
		thatS3dExporter.title = p.config.title == null ? "导出" : p.config.title;
	} 
	 
	//initHtml
	this.initHtml = function(){
		let winHtml = thatS3dExporter.getWinHtml();
		let container = $("#" + thatS3dExporter.containerId);
		$(container).append(winHtml);
		$(container).find(".s3dExportButton[name='exportS3dFile']").click(function(){
			thatS3dExporter.exportS3dFile();
		});
		$(container).find(".s3dExportButton[name='exportGltfFile']").click(function(){
			thatS3dExporter.exportGltfFile();
		});
	}  

	//保存S3d模型
	this.exportS3dFile = function(){
		let fileGenerator = new S3dFileGenerator();
		fileGenerator.init({
			manager: thatS3dExporter.manager
		});
		fileGenerator.generate({
			name: thatS3dExporter.manager.s3dObject.name
		});
	}

	//保存复杂模型（可离线使用）
	this.exportGltfFile = function(){
		let fileGenerator = new GltfFileGenerator();
		fileGenerator.init({
			manager: thatS3dExporter.manager
		});
		fileGenerator.generate({
			name: thatS3dExporter.manager.s3dObject.name
		});
	}

	//获取模型设置信息
	this.getSettings = function(){
		return {
			camera: thatS3dExporter.manager.viewer.getCameraInfo(),
			axis: thatS3dExporter.manager.axis.getAxisInfo()
		};
	}

	this.save = function(blob, fileName) {
		let link = document.createElement("a");
		link.style.display = "none";
		link.href = window.URL.createObjectURL(blob);
		link.download = fileName || "data";
		link.click();
	}
	
	//隐藏
	this.hide = function(){
		$("#" + thatS3dExporter.containerId).find(".s3dExporterContainer").css({"display": "none"});
	}
	
	//获取显示状态
	this.getVisible = function(){
		return $("#" + thatS3dExporter.containerId).find(".s3dExporterContainer").css("display") === "block";
	}
	
	//隐藏
	this.show = function(){
		let container = $("#" + thatS3dExporter.containerId);
		if($(container).find(".s3dExporterContainer").length === 0){
			thatS3dExporter.initHtml(); 
			$(container).find(".s3dExporterTitle").text(thatS3dExporter.title);
			$(container).find(".s3dExporterCloseBtn").click(function(){
				thatS3dExporter.hide();
			});
		}
		$(container).find(".s3dExporterContainer").css({"display": "block"});
	}
	
	
	//获取html
	this.getWinHtml = function(){
		return "<div class=\"s3dExporterContainer\">"
			+ "<div class=\"s3dExporterBackground\"></div>"
			+ "<div class=\"s3dExporterOuterContainer\">"
			+ "<div class=\"s3dExporterHeader\">"
			+ "<div class=\"s3dExporterTitle\"></div>"
			+ "<div class=\"s3dExporterCloseBtn\">×</div>"
			+ "</div>"
			+ "<div class=\"s3dExporterInnerContainer\">"
			+ "<div class=\"s3dExportButton\" name=\"exportS3dFile\">"
			+ "<div class=\"s3dExporterText\">S3Dc文件</div>"
			+ "<div class=\"s3dExporterSubText\">文件小，可以使用S3DWeb打开/编辑</div>"
			+ "</div>"
			+ "<div class=\"s3dExportButton\" name=\"exportGltfFile\">"
			+ "<div class=\"s3dExporterText\">GLTF文件</div>"
			+ "<div class=\"s3dExporterSubText\">通用格式，主流三维软件支持</div>"
			+ "</div>"
			+ "<div class=\"s3dExporterBottom\">"
			+ "<div class=\"s3dExporterBottomText\"></div>"
			+ "</div>"
			+ "</div>"
			+ "</div>"
			+ "</div>";
	}
}
export default S3dExporter