import {cmnPcr, s3dViewerStatus} from "../../commonjs/common/static.js"
import "./s3dMaterialPicker.css"

//S3dWeb 选择材质
let S3dMaterialPicker = function (){
	//当前对象
	const thatS3dMaterialPicker = this; 

	this.manager = null;
	
	//containerId
	this.containerId = null;

	//参数信息
	this.paramInfo = null;

	//选中的材质名称
	this.materialName = null;

	//初始化
	this.init = function(p){
		thatS3dMaterialPicker.manager = p.manager; 
		thatS3dMaterialPicker.containerId = p.containerId; 
		thatS3dMaterialPicker.title = p.config.title == null ? "选择材质" : p.config.title;
	}  
	
	//显示材质选择器
	this.showPicker = function(p){   
		thatS3dMaterialPicker.paramInfo = p.paramInfo;
		thatS3dMaterialPicker.materialName = p.paramInfo.materialName;
		//材质列表
		thatS3dMaterialPicker.showContainer(); 
    } 

	//添加条目
	this.addItemToList = function(p){
		let container = $("#" + thatS3dMaterialPicker.containerId).find(".s3dMaterialPickerContainer")[0];
		let innerContainer = $(container).find(".s3dMaterialPickerInnerContainer")[0];
		let childIndex = $(innerContainer).children().length;  
		p.index = childIndex;
		let itemHtml = thatS3dMaterialPicker.getItemHtml(p);
		$(innerContainer).append(itemHtml); 
	}

	//显示选择器的容器
	this.showContainer = function(p){
		let winHtml = thatS3dMaterialPicker.getListHtml();
		let mainContainer = $("#" + thatS3dMaterialPicker.containerId);
		$(mainContainer).append(winHtml);

		let container = $(mainContainer).find(".s3dMaterialPickerContainer")[0];

		$(container).find(".s3dMaterialPickerItemContainer").click(function(event){
			$(container).find(".s3dMaterialPickerItemContainer").removeClass("s3dMaterialPickerItemContainerActive");
			$(this).addClass("s3dMaterialPickerItemContainerActive");
			thatS3dMaterialPicker.materialName = $(this).attr("materialName");
		});

		$(container).find(".s3dMaterialPickerTitle").text(thatS3dMaterialPicker.title);
		$(container).find(".s3dMaterialPickerCloseBtn").click(function(event){			
			thatS3dMaterialPicker.hideContainer();		
			thatS3dMaterialPicker.manager.viewer.changeStatus({
				status: s3dViewerStatus.normalView
			}); 
		})
		$(container).find(".s3dMaterialPickerBtnCancel").click(function(event){			
			thatS3dMaterialPicker.hideContainer();
			thatS3dMaterialPicker.manager.viewer.changeStatus({
				status: s3dViewerStatus.normalView
			}); 
		}) 
		$(container).find(".s3dMaterialPickerBtnOk").click(function(event){	
			thatS3dMaterialPicker.endPick();
			thatS3dMaterialPicker.manager.viewer.changeStatus({
				status: s3dViewerStatus.normalView
			}); 		 
		})
	}
	 
	//构造材质列表html
	this.getListHtml = function(p){
		let html = "<div class=\"s3dMaterialPickerContainer\">"
		+ "<div class=\"s3dMaterialPickerBackground\"></div>"
		+ "<div class=\"s3dMaterialPickerHeader\">"
		+ "<div class=\"s3dMaterialPickerTitle\"></div>"
		+ "<div class=\"s3dMaterialPickerSubTitle\"></div>"
		+ "<div class=\"s3dMaterialPickerBtn s3dMaterialPickerCloseBtn\" title=\"关闭\">×</div>"
		+ "<div class=\"s3dMaterialPickerHeaderItemContainer\">"
		+ "<div class=\"s3dMaterialPickerHeaderItemCell s3dMaterialPickerHeaderItemName\">名称</div>"
		+ "<div class=\"s3dMaterialPickerHeaderItemCell s3dMaterialPickerHeaderItemColor\">颜色</div>"
		+ "<div class=\"s3dMaterialPickerHeaderItemCell s3dMaterialPickerHeaderItemOpacity\">透明</div>"
		+ "</div>"
		+ "</div>" 
		+ "<div class=\"s3dMaterialPickerInnerContainer\">";

		let index = 0;
		for(let materialName in thatS3dMaterialPicker.manager.materials.infoMap){
			let materialInfo = thatS3dMaterialPicker.manager.materials.infoMap[materialName];
			let itemHtml = thatS3dMaterialPicker.getItemHtml({
				index: index,
				name: materialInfo.name,
				color: materialInfo.color,
				opacity: materialInfo.opacity,
				selected: materialInfo.name === thatS3dMaterialPicker.paramInfo.materialName
			});
			index++;
			html += itemHtml;

		}

		html += "</div>"
		+ "<div class=\"s3dMaterialPickerBottomContainer\">"
		+ "<div class=\"s3dMaterialPickerBottomBtn s3dMaterialPickerBtnCancel\">取&nbsp;&nbsp;消</div>"
		+ "<div class=\"s3dMaterialPickerBottomBtn s3dMaterialPickerBtnOk\">确&nbsp;&nbsp;定</div>"
		+ "</div>"
		+ "</div>";
		return html; 
	}

	//构造材质条目html
	this.getItemHtml = function(p){
		let html = "<div class=\"s3dMaterialPickerItemContainer" + (p.selected ? " s3dMaterialPickerItemContainerActive" : "") + "\" materialName=\"" + p.name + "\">"
		+ "<div class=\"s3dMaterialPickerItemCell s3dMaterialPickerItemName\">" + p.name + "</div>"
		+ "<div class=\"s3dMaterialPickerItemCell s3dMaterialPickerItemColor\" style=\"background-color:" + cmnPcr.getColorStr(p.color) + "\">&nbsp;</div>"
		+ "<div class=\"s3dMaterialPickerItemCell s3dMaterialPickerItemOpacity\">" + p.opacity + "%</div>"
		+ "</div>";
		return html;
	} 

	//取消选择
	this.cancelPick = function(p){
		thatS3dMaterialPicker.hideContainer(p);
	}  

	//隐藏选择器容器
	this.hideContainer = function(p){
		$("#" + thatS3dMaterialPicker.containerId).find(".s3dMaterialPickerContainer").remove();
	}

	//获取显示状态
	this.getVisible = function(){
		return $("#" + thatS3dMaterialPicker.containerId).find(".s3dMaterialPickerContainer").css("display") === "block";
	}

	//结束选择
	this.endPick = function(){
		let materialName =  thatS3dMaterialPicker.materialName;
		thatS3dMaterialPicker.hideContainer();

		thatS3dMaterialPicker.paramInfo.afterPickMaterial({
			materialName: materialName,
			paramInfo: thatS3dMaterialPicker.paramInfo
		});
		
	}
}
export default S3dMaterialPicker