import {cmnPcr, s3dViewerStatus} from "../../commonjs/common/static.js"
import "./s3dLocalMaterialPicker.css"

//S3dWeb 选择本地材质
let S3dLocalMaterialPicker = function (){
	//当前对象
	const thatS3dLocalMaterialPicker = this;

	this.manager = null;
	
	//containerId
	this.containerId = null;

	//参数信息
	this.paramInfo = null;

	//选中的材质名称
	this.materialName = null;

	//初始化
	this.init = function(p){
		thatS3dLocalMaterialPicker.manager = p.manager;
		thatS3dLocalMaterialPicker.containerId = p.containerId;
		thatS3dLocalMaterialPicker.title = p.config.title == null ? "选择材质" : p.config.title;
	}  
	
	//显示材质选择器
	this.showPicker = function(p){
		thatS3dLocalMaterialPicker.paramInfo = p.paramInfo;
		thatS3dLocalMaterialPicker.materialName = p.paramInfo.materialName;
		//材质列表
		thatS3dLocalMaterialPicker.showContainer();
    } 

	//添加条目
	this.addItemToList = function(p){
		let container = $("#" + thatS3dLocalMaterialPicker.containerId).find(".s3dLocalMaterialPickerContainer")[0];
		let innerContainer = $(container).find(".s3dLocalMaterialPickerInnerContainer")[0];
		let childIndex = $(innerContainer).children().length;  
		p.index = childIndex;
		let itemHtml = thatS3dLocalMaterialPicker.getItemHtml(p);
		$(innerContainer).append(itemHtml); 
	} 

	//显示选择器的容器
	this.showContainer = function(p){
		let winHtml = thatS3dLocalMaterialPicker.getListHtml();
		let mainContainer = $("#" + thatS3dLocalMaterialPicker.containerId);
		$(mainContainer).append(winHtml);

		let container = $(mainContainer).find(".s3dLocalMaterialPickerContainer")[0];

		$(container).find(".s3dLocalMaterialPickerItemContainer").click(function(event){
			$(container).find(".s3dLocalMaterialPickerItemContainer").removeClass("s3dLocalMaterialPickerItemContainerActive");
			$(this).addClass("s3dLocalMaterialPickerItemContainerActive");
			thatS3dLocalMaterialPicker.materialName = $(this).attr("materialName");
		});

		$(container).find(".s3dLocalMaterialPickerTitle").text(thatS3dLocalMaterialPicker.title);
		$(container).find(".s3dLocalMaterialPickerCloseBtn").click(function(event){
			thatS3dLocalMaterialPicker.hideContainer();
			thatS3dLocalMaterialPicker.manager.viewer.changeStatus({
				status: s3dViewerStatus.normalView
			}); 
		})
		$(container).find(".s3dLocalMaterialPickerBtnCancel").click(function(event){
			thatS3dLocalMaterialPicker.hideContainer();
			thatS3dLocalMaterialPicker.manager.viewer.changeStatus({
				status: s3dViewerStatus.normalView
			});
		})
		$(container).find(".s3dLocalMaterialPickerBtnClear").click(function(event){
			thatS3dLocalMaterialPicker.materialName = "";
			thatS3dLocalMaterialPicker.endPick();
			thatS3dLocalMaterialPicker.manager.viewer.changeStatus({
				status: s3dViewerStatus.normalView
			});
		})
		$(container).find(".s3dLocalMaterialPickerBtnOk").click(function(event){
			thatS3dLocalMaterialPicker.endPick();
			thatS3dLocalMaterialPicker.manager.viewer.changeStatus({
				status: s3dViewerStatus.normalView
			}); 		 
		})
	}
	 
	//构造材质列表html
	this.getListHtml = function(p){
		let html = "<div class=\"s3dLocalMaterialPickerOuterContainer\">"
			+ "<div class=\"s3dLocalMaterialPickerOuterBackground\"></div>"
			+ "<div class=\"s3dLocalMaterialPickerContainer\">"
			+ "<div class=\"s3dLocalMaterialPickerBackground\"></div>"
			+ "<div class=\"s3dLocalMaterialPickerHeader\">"
			+ "<div class=\"s3dLocalMaterialPickerTitle\"></div>"
			+ "<div class=\"s3dLocalMaterialPickerSubTitle\"></div>"
			+ "<div class=\"s3dLocalMaterialPickerBtn s3dLocalMaterialPickerCloseBtn\" title=\"关闭\">×</div>"
			+ "<div class=\"s3dLocalMaterialPickerHeaderItemContainer\">"
			+ "<div class=\"s3dLocalMaterialPickerHeaderItemCell s3dLocalMaterialPickerHeaderItemName\">名称</div>"
			+ "<div class=\"s3dLocalMaterialPickerHeaderItemCell s3dLocalMaterialPickerHeaderItemColor\">颜色</div>"
			+ "<div class=\"s3dLocalMaterialPickerHeaderItemCell s3dLocalMaterialPickerHeaderItemOpacity\">透明</div>"
			+ "</div>"
			+ "</div>"
			+ "<div class=\"s3dLocalMaterialPickerInnerContainer\">";

		let index = 0;
		for(let materialName in thatS3dLocalMaterialPicker.manager.localMaterials.infoMap){
			let materialInfo = thatS3dLocalMaterialPicker.manager.localMaterials.infoMap[materialName];
			let itemHtml = thatS3dLocalMaterialPicker.getItemHtml({
				index: index,
				name: materialInfo.name,
				color: materialInfo.color,
				imageName: materialInfo.imageName,
				opacity: materialInfo.opacity,
				selected: materialInfo.name === thatS3dLocalMaterialPicker.paramInfo.materialName
			});
			index++;
			html += itemHtml;

		}

		html += "</div>"
		+ "<div class=\"s3dLocalMaterialPickerBottomContainer\">"
		+ "<div class=\"s3dLocalMaterialPickerBottomBtn s3dLocalMaterialPickerBtnClear\">清&nbsp;&nbsp;除</div>"
		+ "<div class=\"s3dLocalMaterialPickerBottomBtn s3dLocalMaterialPickerBtnCancel\">取&nbsp;&nbsp;消</div>"
		+ "<div class=\"s3dLocalMaterialPickerBottomBtn s3dLocalMaterialPickerBtnOk\">确&nbsp;&nbsp;定</div>"
		+ "</div>"
		+ "</div>"
		+ "</div>";
		return html; 
	}

	//构造材质条目html
	this.getItemHtml = function(p){
		let html = "<div class=\"s3dLocalMaterialPickerItemContainer" + (p.selected ? " s3dLocalMaterialPickerItemContainerActive" : "") + "\" materialName=\"" + p.name + "\">"
		+ "<div class=\"s3dLocalMaterialPickerItemCell s3dLocalMaterialPickerItemName\">" + p.name + "</div>";
		if(p.imageName.length === 0){
			html += "<div class=\"s3dLocalMaterialPickerItemCell s3dLocalMaterialPickerItemColor\" style=\"background-color:" + cmnPcr.getColorStr(p.color) + "\">&nbsp;</div>"
		}
		else{
			let imageUrl = thatS3dLocalMaterialPicker.manager.localObjectCreator.imageFolder + p.imageName + ".jpg";
			html += "<div class=\"s3dLocalMaterialPickerItemCell s3dLocalMaterialPickerItemColor\" style=\"background-image:url(" + imageUrl + ")\">&nbsp;</div>"
		}
		+ "<div class=\"s3dLocalMaterialPickerItemCell s3dLocalMaterialPickerItemColor\" style=\"background-color:" + cmnPcr.getColorStr(p.color) + "\">&nbsp;</div>"
		html += "<div class=\"s3dLocalMaterialPickerItemCell s3dLocalMaterialPickerItemOpacity\">" +  (p.opacity == null ? "" : (p.opacity * 100 + "%")) + "</div>"
		+ "</div>";
		return html;
	} 

	//取消选择
	this.cancelPick = function(p){
		thatS3dLocalMaterialPicker.hideContainer(p);
	}  

	//隐藏选择器容器
	this.hideContainer = function(p){
		$("#" + thatS3dLocalMaterialPicker.containerId).find(".s3dLocalMaterialPickerOuterContainer").remove();
	}

	//获取显示状态
	this.getVisible = function(){
		return $("#" + thatS3dLocalMaterialPicker.containerId).find(".s3dLocalMaterialPickerOuterContainer").css("display") === "block";
	}

	//结束选择
	this.endPick = function(){
		let materialName =  thatS3dLocalMaterialPicker.materialName;
		thatS3dLocalMaterialPicker.hideContainer();

		thatS3dLocalMaterialPicker.paramInfo.afterPickMaterial({
			materialName: materialName,
			paramInfo: thatS3dLocalMaterialPicker.paramInfo
		});
		
	}
}
export default S3dLocalMaterialPicker