import {cmnPcr} from "../../commonjs/common/static.js"
import "./s3dAppearanceSetting.css"

//S3dWeb 外观显示设置
let S3dAppearanceSetting = function (){
	
	//当前对象
	const thatS3dAppearanceSetting = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	//记录每个分组被选中的项
	this.group2CheckedItemMap = {};

	//事件
	this.eventFunctions = {};
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dAppearanceSetting.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dAppearanceSetting.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}

	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dAppearanceSetting.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		}
	}

	//初始化
	this.init = function(p){
		thatS3dAppearanceSetting.containerId = p.containerId;
		thatS3dAppearanceSetting.manager = p.manager;
		thatS3dAppearanceSetting.mobileAutoRotate = p.config.mobileAutoRotate;

		thatS3dAppearanceSetting.showForm();

		if(p.config.visible){
			thatS3dAppearanceSetting.show();
		}
		else{
			thatS3dAppearanceSetting.hide();
		}

		if(p.config.onButtonClick != null){
			thatS3dAppearanceSetting.addEventFunction("onButtonClick", p.config.onButtonClick);
		}

		if(p.config.afterInit != null){
			thatS3dAppearanceSetting.addEventFunction("afterInit", p.config.afterInit);
		}
		thatS3dAppearanceSetting.afterInit();
	}

	this.afterInit = function (){
		thatS3dAppearanceSetting.doEventFunction("afterInit", {});
	}

	//隐藏
	this.hide = function(){
		let container = $("#" + thatS3dAppearanceSetting.containerId)[0];
		$(container).find(".s3dAppearanceSettingBtnSectionOuterContainer").css({"display": "none"});
		$(container).find(".s3dAppearanceSettingGroupSectionOuterContainer").css({"display": "none"});
		$(container).find(".s3dAppearanceSettingDesSectionOuterContainer").css({"display": "none"});
	}

	//隐藏
	this.show = function(){
		let container = $("#" + thatS3dAppearanceSetting.containerId)[0];
		$(container).find(".s3dAppearanceSettingBtnSectionOuterContainer").css({"display": "block"});
		$(container).find(".s3dAppearanceSettingGroupSectionOuterContainer").css({"display": "block"});
		$(container).find(".s3dAppearanceSettingDesSectionOuterContainer").css({"display": "block"});
	}

	//获取显示状态
	this.getVisible = function(){
		return $("#" + thatS3dAppearanceSetting.containerId).find(".s3dAppearanceSettingContainer").css("display") === "block";
	}

	this.buttonClick = function (p){
		let groupCode = p.groupCode;
		let itemCode = p.itemCode;
		thatS3dAppearanceSetting.doEventFunction("onButtonClick", {
			group2CheckedItemMap: thatS3dAppearanceSetting.group2CheckedItemMap,
			groupCode: groupCode,
			itemCode: itemCode,
			onProcessed: function (p){
				thatS3dAppearanceSetting.setBtnChecked(p);
			}
		});
	}
	
	//显示工具栏
	this.showForm = function(){
		//构造html
		let html = thatS3dAppearanceSetting.getAppearanceSettingHtml();
		let container = $("#" + thatS3dAppearanceSetting.containerId)[0];
		$(container).append(html);

		//点击btn事件
		$(container).find(".s3dAppearanceSettingBtnContainer").click(function(){
			let buttonCode = $(this).attr("buttonCode");
			let groupCode = $(this).attr("groupCode");
			thatS3dAppearanceSetting.buttonClick({
				groupCode: groupCode,
				buttonCode: buttonCode,
			});
		});

		//点击group事件
		$(container).find(".s3dAppearanceSettingGroupContainer").click(function(){
			let groupCode = $(this).attr("groupCode");
			thatS3dAppearanceSetting.showGroup({
				groupCode: groupCode
			});
		});
	}

	this.showGroup = function (p){
		let groupCode = p.groupCode;
		let container = $("#" + thatS3dAppearanceSetting.containerId);
		$(container).find(".s3dAppearanceSettingGroupBtnContainer").removeClass("s3dAppearanceSettingGroupBtnContainerActive");
		$(container).find(".s3dAppearanceSettingGroupBtnContainer[groupCode='" + groupCode + "']").addClass("s3dAppearanceSettingGroupBtnContainerActive");

		$(container).find(".s3dAppearanceSettingGroupContainer").removeClass("s3dAppearanceSettingGroupContainerActive");
		$(container).find(".s3dAppearanceSettingGroupContainer[groupCode='" + groupCode + "']").addClass("s3dAppearanceSettingGroupContainerActive");

		$(container).find(".s3dAppearanceSettingDesContainer").removeClass("s3dAppearanceSettingDesContainerActive");
		$(container).find(".s3dAppearanceSettingDesContainer[groupCode='" + groupCode + "']").addClass("s3dAppearanceSettingDesContainerActive");
	}

	this.setSectionInnerHtml = function (sectionName, html){
		let outerContainer = $("#" + thatS3dAppearanceSetting.containerId).find("div[sectionName='" + sectionName + "']");
		let innerContainer = $(outerContainer).find(".innerContainer .s3dAppearanceSettingGroupBtnContainer");
		$(innerContainer).html(html);
		let visible = html != null && html.length !== 0;
		$(outerContainer).css({display: (visible ? "block" : "none")});
	}
	
	//获取html
	this.getAppearanceSettingHtml = function(){
		let html = "<div class=\"s3dAppearanceSettingBtnSection3OuterContainer\" sectionName=\"level3\">";
		html += "<div class=\"s3dAppearanceSettingBtnSection3Background\"></div>";
		html += "<div class=\"s3dAppearanceSettingBtnSection3InnerContainer innerContainer\">";
		html += "<div class=\"s3dAppearanceSettingGroupBtnContainer\"/></div>";
		html += "</div>";
		html += "</div>";
		html += "<div class=\"s3dAppearanceSettingBtnSection2OuterContainer\" sectionName=\"level2\">";
		html += "<div class=\"s3dAppearanceSettingBtnSection2Background\"></div>";
		html += "<div class=\"s3dAppearanceSettingBtnSection2InnerContainer innerContainer\">";
		html += "<div class=\"s3dAppearanceSettingGroupBtnContainer\"/></div>";
		html += "</div>";
		html += "</div>";
		html += "<div class=\"s3dAppearanceSettingBtnSection1OuterContainer\" sectionName=\"level1\">";
		html += "<div class=\"s3dAppearanceSettingBtnSection1Background\"></div>";
		html += "<div class=\"s3dAppearanceSettingBtnSection1InnerContainer innerContainer\">";
		html += "<div class=\"s3dAppearanceSettingGroupBtnContainer\"/></div>";
		html += "</div>";
		html += "</div>";
		html += "<div class=\"s3dAppearanceSettingGroupSectionOuterContainer\" sectionName=\"group\">";
		html += "<div class=\"s3dAppearanceSettingGroupSectionBackground\"></div>";
		html += "<div class=\"s3dAppearanceSettingGroupSectionInnerContainer innerContainer\">";
		html += "<div class=\"s3dAppearanceSettingGroupBtnContainer\"/></div>";
		html += "</div>";
		html += "</div>";
		html += "<div class=\"s3dAppearanceSettingDesSectionOuterContainer\" sectionName=\"description\">";
		html += "<div class=\"s3dAppearanceSettingDesSectionBackground\"></div>";
		html += "<div class=\"s3dAppearanceSettingDesSectionInnerContainer innerContainer\">";
		html += "<div class=\"s3dAppearanceSettingGroupBtnContainer\"/></div>";
		html += "</div>";
		html += "</div>";
		return html;
	}

	this.getGroupHtml = function (groupJson, checked){
		return ("<div class=\"s3dAppearanceSettingGroupContainer" + (checked ? " s3dAppearanceSettingGroupContainerActive" : "") + "\" \" groupCode=\"" + groupJson.code + "\" title=\"" + cmnPcr.html_encode(groupJson.name) + "\">"
			+ "<div class=\"s3dAppearanceSettingGroupName\">" + groupJson.name + "</div>"
			+ "</div>");
	}

	this.bindGroupClickEvent = function (groupCode, clickFunc){
		let container = $("#" + thatS3dAppearanceSetting.containerId);
		$(container).find(".s3dAppearanceSettingGroupContainer[groupCode='" + groupCode + "']").click(function (){
			let container = $("#" + thatS3dAppearanceSetting.containerId);
			if(!$(this).hasClass("s3dAppearanceSettingGroupContainerActive")){
				$(container).find(".s3dAppearanceSettingGroupContainer").removeClass("s3dAppearanceSettingGroupContainerActive");
				$(this).addClass("s3dAppearanceSettingGroupContainerActive");
				clickFunc({
					groupCode: groupCode
				});
			}
		})
	}

	this.getDescriptionHtml = function (text){
		return ("<div class=\"s3dAppearanceSettingDesContainer\">"
			+ "<div class=\"s3dAppearanceSettingDesText\">" + text + "</div>"
			+ "</div>");
	}

	//获取button html
	this.getBtnHtml = function(btnJson, groupCode, checked){
		if(btnJson.imgData == null){
			return "<div class=\"s3dAppearanceSettingBtnContainer s3dAppearanceSettingBtnContainerOnlyText\" itemCode=\"" + btnJson.code + "\" groupCode=\"" + groupCode + "\" title=\"" + cmnPcr.html_encode(btnJson.name) + "\">"
				+ "<div class=\"s3dAppearanceSettingBtnName s3dAppearanceSettingBtnNameOnlyText" + (checked ? " s3dAppearanceSettingBtnNameActive" : "") + "\">" + btnJson.name + "</div>"
				+ "</div>";
		}
		else {
			if(btnJson.imgData.normal != null) {
				let imgUrl = thatS3dAppearanceSetting.getImageUrl(btnJson.imgData.directory, btnJson.imgData.normal);
				return "<div class=\"s3dAppearanceSettingBtnContainer\" itemCode=\"" + btnJson.code + "\" groupCode=\"" + groupCode + "\" title=\"" + cmnPcr.html_encode(btnJson.name) + "\">"
					+ "<img class=\"s3dAppearanceSettingBtnImg\" src=\"" + imgUrl + "\" />"
					+ "<div class=\"s3dAppearanceSettingBtnName" + (checked ? " s3dAppearanceSettingBtnNameActive" : "") + "\">" + btnJson.name + "</div>"
					+ "</div>";
			}
			else{
				let colors = btnJson.imgData.colors;
				return "<div class=\"s3dAppearanceSettingBtnContainer\" itemCode=\"" + btnJson.code + "\" groupCode=\"" + groupCode + "\" title=\"" + cmnPcr.html_encode(btnJson.name) + "\">"
					+ "<div class=\"s3dAppearanceSettingBtnColor\" style=\"background-color: #" + colors[0] + "\"></div>"
					+ "<div class=\"s3dAppearanceSettingBtnColorAlpha1\"></div>"
					+ "<div class=\"s3dAppearanceSettingBtnColorAlpha2\"></div>"
					+ "<div class=\"s3dAppearanceSettingBtnName" + (checked ? " s3dAppearanceSettingBtnNameActive" : "") + "\">" + cmnPcr.html_encode(btnJson.name) + "</div>"
					+ "</div>";
			}
		}
	}

	this.bindBtnClickEvent = function (itemCode, groupCode, clickFunc, imgData){
		let container = $("#" + thatS3dAppearanceSetting.containerId);
		$(container).find(".s3dAppearanceSettingBtnContainer[groupCode='" + groupCode + "'][itemCode='" + itemCode + "']").click(function (){
			let container = $("#" + thatS3dAppearanceSetting.containerId);
			let btnNameCtrl = $(this).find(".s3dAppearanceSettingBtnName")[0];
			if(!$(btnNameCtrl).hasClass("s3dAppearanceSettingBtnNameActive")){
				$(container).find(".s3dAppearanceSettingBtnContainer[groupCode='" + groupCode + "'] .s3dAppearanceSettingBtnName").removeClass("s3dAppearanceSettingBtnNameActive");
				$(container).find(".s3dAppearanceSettingBtnContainer[groupCode='" + groupCode + "'] .s3dAppearanceSettingBtnNameOnlyBox").removeClass("s3dAppearanceSettingBtnNameOnlyBoxActive");
				$(btnNameCtrl).addClass("s3dAppearanceSettingBtnNameActive");
				if($(btnNameCtrl).hasClass("s3dAppearanceSettingBtnNameOnlyBox")){
					$(btnNameCtrl).addClass("s3dAppearanceSettingBtnNameOnlyBoxActive");
				}
				clickFunc({
					groupCode: groupCode,
					itemCode: itemCode
				});
			}
		})
	}

	this.getCheckedItemCode = function (groupCode){
		return thatS3dAppearanceSetting.group2CheckedItemMap[groupCode];
	}

	this.setCheckedItemCode = function (groupCode, itemCode){
		thatS3dAppearanceSetting.group2CheckedItemMap[groupCode] = itemCode;
	}

	this.setBtnChecked = function (p){
		let groupCode = p.groupCode;
		let itemCode = p.itemCode;
		let imgData = p.imgData;
		let container = $("#" + thatS3dAppearanceSetting.containerId);
		let btnGroupContainer = $(container).find(".s3dAppearanceSettingGroupBtnContainer[groupCode='" + groupCode + "']")[0];
		let allBtnContainers = $(btnGroupContainer).find(".s3dAppearanceSettingBtnContainer");
		for(let i = 0; i < allBtnContainers.length; i++){
			let btnContainer = allBtnContainers[i];
			let btnItemCode = $(btnContainer).attr("itemCode");
			let checked = btnItemCode === itemCode;

			if (checked) {
				$(btnContainer).find(".s3dAppearanceSettingBtnName").addClass("s3dAppearanceSettingBtnNameActive");
			} else {
				$(btnContainer).find(".s3dAppearanceSettingBtnName").removeClass("s3dAppearanceSettingBtnNameActive");
			}

			if(imgData != null) {
				let imgName = checked ? imgData.checked : imgData.normal;
				let imgUrl = thatS3dAppearanceSetting.getImageUrl(imgData.directory, imgName);
				$(btnContainer).find(".s3dAppearanceSettingBtnImg").attr("src", imgUrl);
			}
		}
	}

	this.getImageUrl = function (directory, imgName){
		return directory + "/" + imgName;
	}
}
export default S3dAppearanceSetting