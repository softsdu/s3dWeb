import {cmnPcr, msgBox} from "./static.js";

//对话框
let MsgBox = function () {
	this.alert = function(p) { 
		p.title = p.title == null || p.title.length === 0 ? "提示" : p.title;
		this.showInfoWin(p);
	}
	
	this.showInfoWin = function(p){
		let title = cmnPcr.html_encode(p.title);
		let info = p.isHtmlInfo ? p.info : cmnPcr.html_encode(p.info);
		let dialogId = cmnPcr.getRandomValue();
		let dialogLabelId = dialogId + "_label";
		let html = "<div class=\"modal fade\" style=\"z-index:200001;\" id=\"" + dialogId + "\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"" + dialogLabelId + "\" aria-hidden=\"true\">"
			+ "<div class=\"modal-dialog\">"
			+ "<div class=\"modal-content\">"
			+ "<div class=\"modal-header\">"
			+ "<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">×</button>"
			+ "<h4 class=\"modal-title\" id=\"" + dialogLabelId + "\">" + title + "</h4>"
			+ "</div>"
			+ "<div class=\"modal-body\">" + info + "</div>"
			+ "<div class=\"modal-footer\">"
			+ "<button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">关闭</button>"
			+ "</div>"
			+ "</div><!-- /.modal-content -->"
			+ "</div><!-- /.modal-dialog -->"
			+ "</div><!-- /.modal -->";
		$(document.body).append(html);
		$("#" + dialogId).modal();
	}
 
	this.warning = function(p) {
		p.title = p.title == null || p.title.length === 0 ? "警告" : p.title;
		this.showInfoWin(p); 
	}

	this.error = function(p) {
		p.title = p.title == null || p.title.length === 0 ? "错误" : p.title;
		this.showInfoWin(p);
	}

	//title, info, nextFunc
	this.show = function(p) {

	}

	//title, info, yesFunc, noFunc, yesName, noName
	this.confirm = function(p) {
		return window.confirm(p.info);
	}
	
	this.animationWindow = function(p){
		let message = p.message;
		let duration = p.duration;

		let getClientLeft = function(element){
			if(element[0] === document){
			 	return 0;
		 	}
		 	else{
				let left = getClientLeft(element.parent());
		 		return left + $(element[0]).position().left;
		 	}	
		}
		let getClientTop = function(element){
			if(element[0] === document){
			 	return 0;
		 	}
		 	else{
				let top = getClientTop(element.parent());
		 		return top + $(element[0]).position().top;
		 	}	
		}
		let fromElement = $("#" + p.fromElementId);
		let toElement = $("#" + p.toElementId);
		let fromLeft = getClientLeft(fromElement);
		let fromTop = getClientTop(fromElement);
		let toLeft = getClientLeft(toElement);
		let toTop = getClientTop(toElement);
		let fromWidth = $(fromElement).width();
		let fromHeight = $(fromElement).height();
		let toWidth = $(toElement).width();
		let toHeight = $(toElement).height();

		let step = Math.floor(duration / 100);
		let stepWidth = (toWidth - fromWidth) / step;
		let stepHeight = (toHeight - fromHeight) / step;
		let stepLeft = (toLeft - fromLeft) / step;
		let stepTop = (toTop - fromTop) / step;

		let setLocationAndSize = function(divId, stepWidth, stepHeight, stepLeft, stepTop){
			let div = $("#" + divId);
			let left = $(div).position().left + stepLeft;
			let top = $(div).position().top + stepTop;
			let height = $(div).height() + stepHeight;
			let width = $(div).width() + stepWidth;
			if(height > 0 && width > 0){ 
				$("#" + divId).css({left:left +"px", top: top +"px", width: width + "px", height: height + "px"}); 
				setTimeout(function(){
					setLocationAndSize(divId, stepWidth, stepHeight, stepLeft, stepTop);
				}, 50);
			}
			else{
				$("#" + divId).remove(); 
			} 
		}

		let divId = cmnPcr.createGuid();
		let divHtml = "<div id=\"" + divId + "\" style=\"filter:alpha(opacity=50);-moz-opacity:0.50;opacity:0.50;position:absolute;background-color: #dddddd;z-index:1000;width:" + fromWidth + "px;left:" + fromLeft + "px;top:" + fromTop + "px;height:" + fromHeight + "px;\">" + message + "</div>";
		$(document.body).append(divHtml);
		setLocationAndSize(divId, stepWidth, stepHeight, stepLeft, stepTop);
	}
	
	//通用对话窗口
	this.htmlWindow = function(p) {
		//p.title
		//p.label
		//p.type
		//p.okFunction
		//p.cancelFunction

		if(p.type === "oneInputText"){
			//p.text
			let popContainer = new PopupContainer( {
				width : 240 ,
				height : 130 ,
				top : 50
			});
			
			popContainer.show();

			let frameId = cmnPcr.getRandomValue();
			let titleId = frameId + "_title";
			let labelId = frameId + "_label";
			let textId = frameId + "_text";
			let buttonContainerId = frameId + "_buttonContainer";
			let okBtnId = frameId + "_ok";
			let cancelBtnId = frameId + "_cancel";
			let innerHtml = "<div id=\"" + titleId + "\" style=\"width:100%;height:30px;font-size:13px;text-align:center;font-weight:800;\"></div>"
			 	+ "<div id=\"" + labelId + "\" style=\"witdh:100%;height:30px;font-size:11px;\"></div>"
			 	+ "<div style=\"witdh:100%;height:30px;font-size:11px;text-align:center;\"><input id=\"" + textId + "\" type=\"text\" style=\"width:230px;height:20px;\" /></div>"
			 	+ "<div id=\"" + buttonContainerId + "\" style=\"witdh:100%;height:30px;font-size:11px;text-align:right;\"><input type=\"button\" id=\"" + okBtnId +"\" value=\"确 定\" style=\"width:60px;height:25px;\" />&nbsp;<input type=\"button\" id=\"" + cancelBtnId +"\" value=\"取 消\" style=\"width:60px;height:25px;\" />&nbsp;</div>";
			$("#" + popContainer.containerId).html(innerHtml);
			$("#" + titleId).text(p.title);
			$("#" + labelId).text(p.label);
			$("#" + textId).val(p.text);
			$("#" + okBtnId).click(function(){
				let text = $("#" + textId).val();
				let succeed = p.okFunction({
					text : text,
					closeWin : function(){
						popContainer.close();
					}
				}); 			
			});
			$("#" + cancelBtnId).click(function(){
				let text = $("#" + textId).val();
				let succeed = p.cancelFunction === null || p.cancelFunction === undefined || p.cancelFunction({text : text});
				if(succeed){
					popContainer.close();
				}					
			});
		}
		else if(p.type === "oneInputTextarea"){
			//p.text
			let popContainer = new PopupContainer( {
				width : 400 ,
				height : 230 ,
				top : 50
			});
			
			popContainer.show();

			let frameId = cmnPcr.getRandomValue();
			let titleId = frameId + "_title";
			let labelId = frameId + "_label";
			let textId = frameId + "_text";
			let buttonContainerId = frameId + "_buttonContainer";
			let okBtnId = frameId + "_ok";
			let cancelBtnId = frameId + "_cancel";
			let innerHtml = "<div id=\"" + titleId + "\" style=\"width:100%;height:30px;font-size:15px;text-align:center;font-weight:800;\"></div>"
			 	+ "<div id=\"" + labelId + "\" style=\"witdh:100%;height:25px;font-size:13px;padding-left:10px;\"></div>"
			 	+ "<div style=\"witdh:100%;height:140px;font-size:11px;text-align:center;\"><textarea id=\"" + textId + "\" style=\"width:390px;height:130px;resize:none;border:1px solid #95B8E7\"></textarea></div>"
			 	+ "<div id=\"" + buttonContainerId + "\" style=\"witdh:100%;height:40px;font-size:11px;text-align:right;\"><input type=\"button\" id=\"" + okBtnId +"\" value=\"确 定\" style=\"width:60px;height:25px;\" />&nbsp;<input type=\"button\" id=\"" + cancelBtnId +"\" value=\"取 消\" style=\"width:60px;height:25px;\" />&nbsp;</div>";
			$("#" + popContainer.containerId).html(innerHtml);
			$("#" + titleId).text(p.title);
			$("#" + labelId).text(p.label);
			$("#" + textId).text(p.text);
			$("#" + okBtnId).click(function(){
				let text = $("#" + textId).val();
				let succeed = p.okFunction({
					text : text,
					closeWin : function(){
						popContainer.close();
					}
				}); 			
			});
			$("#" + cancelBtnId).click(function(){
				let text = $("#" + textId).val();
				let succeed = p.cancelFunction === null || p.cancelFunction === undefined || p.cancelFunction({text : text});
				if(succeed){
					popContainer.close();
				}					
			});
		}
	}
	
	this.getMultiRowFromGridWindow = function(windowPageUrl, initRows, listShowFieldName){
	
	}
}

let ModalDialog = function (p) {
	let width = p === undefined || p === null || p.width === undefined || p.width === null ? 600 : p.width;
	let height = p === undefined || p === null || p.height === undefined || p.height === null ? 400 : p.height;
	let divId = cmnPcr.getRandomValue();
	$.modal("<div id=\"" + divId + "\" class=\"\" style=\"width:" + width + "px;height:" + height + "px;\"></div>", {
		opacity : 50,
		overlayCss : {
			backgroundColor : "#AABDFF"
		},
		escClose : !(p.escClose === undefined || p.escClose === null)
	});
	return divId;
}

//等待
let WaitingBar = function () {
	let that = this;
	this.id = null;
	this.begin = function() {
		let barId = cmnPcr.getRandomValue();
		$(document.body).find(".waitingBarContainer").remove();
		that.id = barId;
		let barHtml = "<div id=\"" + barId + "\" class=\"waitingBarContainer\"><div class=\"waitingBarCenter\"><div class=\"waitingBarCenterAbsolute\"><div class=\"waitingBarObject\"></div><div class=\"waitingBarObject\"></div><div class=\"waitingBarObject\"></div><div class=\"waitingBarObject\"></div><div class=\"waitingBarObject\"></div><div class=\"waitingBarObject\"></div><div class=\"waitingBarObject\"></div><div class=\"waitingBarObject\"></div><div class=\"waitingBarObject\"></div><div class=\"waitingBarObject\"></div></div></div></div>";
		$(document.body).append(barHtml);	
	}

	this.end = function() {
		$("#" + that.id).fadeOut(200);
	}
}

//调用服务器端
let ServerAccess = function () {

	//封装soap
	this.getSoapData = function(funcName, args, namespace) {
		let postdata = "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">";
		postdata += "<soap:Body>";
		postdata += "<ns2:" + funcName + " xmlns:ns2=\"http://"
				+ (namespace === undefined || namespace === null ? "service.platform.zlp.com" : namespace)
				+ "/\">";
		for ( let x in args) {
			postdata += "<" + x + ">" + "<![CDATA[" + args[x] + "]]>" + "</"
					+ x + ">";
		}
		postdata += "</ns2:" + funcName + ">";
		postdata += "</soap:Body>";
		postdata += "</soap:Envelope>";
		return postdata;
	}
	//调用服务器，参数timeout、serverUrl、serviceName、funcName、requestParam、beforeFunc、endFunc、successFunc、failFunc、waitingBarParentId
	this.request = function(p) { 
		//给出默认网址
		$.ajaxSettings.async = p.aysnc == null ? true : p.aysnc;
		if (p.serverUrl === undefined || p.serverUrl === null) {
			let href = document.location.href;
			p.serverUrl = href.substr(0, href.indexOf("web",0));
		}

		let waitingBar = p.disableWaitingBar ? null : (new WaitingBar());
		//modified end

		//等待时间
		if (p.timeout === undefined || p.timeout === null) {
			p.timeout = 600000;
		}
		
		//ajax异步调用
		$.ajax( {
			type: "POST",  
			dataType: "json", 
			timeout : p.timeout, 
			url : (p.serverUrl + p.serviceName + "/" + p.funcName+ ".action"), 
			data: p.args, 
			beforeSend : function(httpRequest) {
				httpRequest.setRequestHeader("App-Key", p.appKey);
				if (p.beforeFunc) {
					p.beforeFunc(httpRequest);
				} else if (waitingBar != null) {
					waitingBar.begin();
				}
			},
			complete : function(XMLHttpRequest, textStatus) {
				if (p.endFunc) {
					p.endFunc(XMLHttpRequest);
				} else if (waitingBar != null) {
					waitingBar.end();
				}
			},
			success : function(result, textStatus) { 
				if (waitingBar != null) {
					waitingBar.end();
				}
				let obj = result[0];

				//obj里包含了code、message、result等
				if (obj.code === "000") {
					if (p.successFunc) {
						p.successFunc(obj);
					}
				}
				else {
					if (p.failFunc) {
						p.failFunc(obj);
					} else {
						if(obj.code === "001") {
							msgBox.alert( {
								title : "提示",
								info : "请登录系统后, 再进行此操作!"
							});
						}
						else {
							msgBox.alert( {
								title : "提示",
								info : obj.message
							});
						}
					}
				}
			},
			error : function(httpRequest, textStatus, errorThrown) {
				if (waitingBar != null) {
					waitingBar.end();
				}
				
				msgBox.error( {
					title : "连接失败",
					info : httpRequest.responseText,
					isHtmlInfo: true
				});

				if (p.errorFunc) {
					p.errorFunc(XMLHttpRequest, textStatus, errorThrown);
				}
			}
			});
		}

	this.getDataTableFromBackInfo = function(serverDt) {
		let dt = new DataTable();
		if (serverDt.rows != null) {
			for ( let i = 0; i < serverDt.rows.length; i++) {
				let serverRow = serverDt.rows[i];
				let row = new DataRow();
				for ( let j = 0; j < serverDt.fields.length; j++) {
					let field = serverDt.fields[j];
					let valueType = field.valueType.toLowerCase();
					let fieldName = field.name;
					let value = cmnPcr.strToObject(cmnPcr.replace(
							serverRow[fieldName], "\\\\\"", "\""), valueType);
					row.setValue(fieldName, value);
				}
				let rowId = cmnPcr.getRandomValue();
				row.rowId = rowId;
				dt.addRow(rowId, row);
			}
		}
		return dt;
	}
}

//通用处理

//一些通用方法
let CommonProcessor = function () {

	this.checkHtml5 = function(){
		if (typeof(Worker) !== "undefined") {
		   return true;  
		}  
		else {
			return false;  
		}		
	}

	this.checkBrowserVersion = function(rootPath){
		let notSupport = false;
		if($.browser.msie) {
			let ieVersion = $.browser.version;
			if(cmnPcr.strToDecimal(ieVersion) < 8){
				notSupport = true;
			}
			else{
				notSupport = false;
			}
        } 
        else if($.browser.safari) 
        { 
            notSupport = false;
        } 
        else if($.browser.mozilla) 
        { 
            notSupport = false;
        } 
        else if($.browser.opera) { 
            notSupport = false;
        } 
        if(notSupport){
        	window.location.href = rootPath + "/h/home/nonsupportbrowser.jsp";
        }
	}
	
	this.checkMouseLeftButton = function(ev){ 
		if($.browser.msie){
			let ieVersion = $.browser.version;
			if(cmnPcr.strToDecimal(ieVersion) < 9){
				return ev.button == 1;
			}
			else{
				return ev.button == 0;
			}
		} 
        else if($.browser.opera) {
			let operaVersion = $.browser.version;
			if(cmnPcr.strToDecimal(operaVersion) < 7.60){
				return ev.button == 1;
			}
			else{
				return ev.button == 0;
			} 
        } 
		else{
			return ev.button == 0;
		}
	}
	
	this.checkMouseRightButton = function(ev){ 
		if($.browser.msie){
			let ieVersion = $.browser.version;
			if(cmnPcr.strToDecimal(ieVersion) < 9){
				return ev.button == 0;
			}
			else{
				return ev.button == 2;
			}
		} 
        else if($.browser.opera) {
			let operaVersion = $.browser.version;
			if(cmnPcr.strToDecimal(operaVersion) < 7.60){
				return ev.button == 0;
			}
			else{
				return ev.button == 2;
			} 
        } 
		else{
			return ev.button == 2;
		} 
	}
	 

	this.checkJsonHasChild = function(obj){
		for(let key in obj){
			return true;
		}
		return false;
	}

	this.createGuid = function() {
	  	function s4() {
	    	return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	  	}
	  	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
	}

	//获取随机的值，用于构造于html控件的id值
	this.randomValue = 0;
	this.getRandomValue = function(prefix, suffix) {
		this.randomValue = this.randomValue + 1;
		return (prefix || "ncp") + this.randomValue + (suffix || "");
	}

	this.zIndex = 100000;
	this.getTopZIndex = function() {
		this.zIndex++;
		return this.zIndex;
	}

	//浮点数相加方法，解决浮点数加法不精确问题
	this.floatAdd = function(arg1, arg2) {
		let r1,r2,m;
		try{r1=arg1.toString().split(".")[1].length}catch(e){r1=0}
		try{r2=arg2.toString().split(".")[1].length}catch(e){r2=0}
		m=Math.pow(10,Math.max(r1,r2));
		return (arg1*m+arg2*m)/m
	}

	//将带有html保留符号的字符串转义, 使用正则表达式进行转义，加快转义速度
	this.encodeString = function(value) {
		let regxHmtlEncode = /"|&|'|<|>|[\x00-\x20]|[\x7F-\xFF]|[\u0100-\u2700]/g;
		let s = (value !== undefined || value !== null) ? value : this.toString();
		return (typeof s != "string") ? s : s.replace(regxHmtlEncode, function(
				$0) {
			let c = $0.charCodeAt(0);
			let r = [ "&#" ];
			c = (c === 0x20) ? 0xA0 : c;
			r.push(c);
			r.push(";");
			return r.join("");
		});
	}
	
	this.decodeURI = function(str){
		if(str === null || str === undefined || str.length === 0){
			return "";
		}
		else{
			return decodeURI(str);
		}
	}
	
	this.encodeURI = function(str){
		if(str === null || str === undefined  || str.length === 0){
			return "";
		}
		else{
			return encodeURI(str);
		}
	}

	//json对象转字符串
	this.jsonToStr = function(json) { 
		let str = JSON.stringify(json);
		return str;
	}

	//字符串转json对象
	this.strToJson = function(str) {
		let obj = $.parseJSON(str);
		return obj;
	}

	//获取时间标准格式
	this.getTimeFormat = function() {
		return "yyyy-MM-dd HH:mm:ss";
	}

	//获取日期标准格式
	this.getDateFormat = function() {
		return "yyyy-MM-dd";
	}

	//获取提示用户输入正确格式
	this.getAlertFormatString = function(type) {
		switch (type) {
		case valueType.date:
			return "请输入日期数据, 格式为'" + this.getDateFormat() + "', 例如 2013-01-23";
		case valueType.time:
			return "请输入时间数据, 格式为'" + this.getTimeFormat()
					+ "', 例如 2013-01-23 08:22:59";
		case valueType.boolean:
			return "请输入布尔类型数据, 例如 Y、N、True、False等";
		case valueType.decimal:
			return "请输入数值数据";
		case valueType.string:
			return "请输入字符串";
		case valueType.json:
			return "请输入JSON";
		default:
			return "";
		}
	}

	//获取类型的中文名
	this.getTypeName = function(type) {
		switch (type) {
		case valueType.date:
			return "日期";
		case valueType.time:
			return "时间";
		case valueType.boolean:
			return "是否";
		case valueType.decimal:
			return "数值";
		case valueType.string:
			return "字符串";
		case valueType.json:
			return "JSON";
		default:
			return "";
		}
	}

	//是否可将字符串转换成相应类型
	this.canConvert = function(mystr, type) {
		switch (type) {
		case valueType.date:
			return this.isDateOnly(mystr);
		case valueType.time:
			return this.isDateTime(mystr);
		case valueType.boolean:
			return this.isBoolean(mystr);
		case valueType.decimal:
			return this.isDecimal(mystr);
		case valueType.string:
			return true;
		default:
			return false;
		}
	}

	//判断字符串是否可以转换为数字类型
	this.isBoolean = function(mystr) {
		mystr = mystr.toLowerCase();
		return mystr === "是" || mystr === "否" || mystr === "true"
				|| mystr === "false" || mystr === "y" || mystr === "n"
				|| mystr === "yes" || mystr === "no";
	}

	//判断字符串是否可以转换为数字类型
	this.isDecimal = function(mystr) {
		return !isNaN(mystr);
	}

	//是否为日期，形如 (2003-12-05) 
	this.isDateOnly = function(str) {
		let dateObject = new Date(str);
		return !isNaN(dateObject) && dateObject instanceof Date;
	}

	// 是否为日期，形如 (2008-02-24 [10:02:24],2008/02/12 [10:02:24], 20080212[100224]  
	this.isDateTime = function(str) {
		let dateTimeObject = new Date(str);
		return !isNaN(dateTimeObject) && dateTimeObject instanceof Date && /\d{2}:\d{2}:\d{2}/.test(dateTimeString);
	}

	//字符串转简单类型对象
	this.strToObject = function(str, type) {
		if (str === "" || str === undefined || str === null) {
			return null;
		} else {
			switch (type) {
			case valueType.string:
				return str;
			case valueType.decimal:
				return cmnPcr.strToDecimal(str);
			case valueType.boolean:
				return cmnPcr.strToBoolean(str);
			case valueType.time:
				return cmnPcr.strToTime(str);
			case valueType.date:
				return cmnPcr.strToDate(str);
			case valueType.object:
				return cmnPcr.strToJson(str);
			default:
				alert("strToObject, type=" + type + ", str=" + str);
				return null;
			}
		}
	}

	//to decimal
	this.strToDecimal = function(str) {
		if (str.length > 64) {
			return parseFloat(str.replace(/,/gi, ""));
			//return value;
		} else {
			return parseFloat(str.replace(/,/gi, ""));
		}
	}

	//to date
	this.strToDate = function(str) {
		return this.strToTime(str);
	}

	//to time 字符串转时间,字符串必须为3种格式yyyy-MM-dd [HH:mm:ss] 或yyyy/MM/dd [HH:mm:ss]或 yyyyMMdd[HHmmss]
	this.strToTime = function(str) {
		if(str == null || str.length === 0){
			return null;
		}
		else{
			let ss;
			let dt;
			if (str.indexOf("T") > -1) {
				// 2010-02-06T16:04:19+08:00 处理这种日期数据
				str = mystr.substring(0, 10) + " " + str.substring(11, 19);
			}
	
			if (str.indexOf("-") > -1) {
				ss = str.split("-");
			} else if (str.indexOf("/") > -1) {
				ss = str.split("/");
			} else {
				let value = new Date(str.substr(0, 4), str.substr(4, 2) - 1, str
						.substr(6, 2), 0, 0, 0, 0);
				if (isNaN(value)) {
					return null;
				} else {
					return value;
				}
			}
	
			if (ss[2].indexOf(":") > -1) {
				let mytime = ss[2].substr(2);
				let stime = mytime.split(":");
				dt = new Date(ss[0], ss[1] - 1, ss[2].substr(0, 2), stime[0],
						stime[1], stime[2])
			} else {
				dt = new Date(ss[0], ss[1] - 1, ss[2].substr(0, 2));
			}
	
			return (isNaN(dt) ? null : dt);
		}
	}

	//to boolean
	this.strToBoolean = function(str) {
		str = str.toUpperCase();
		if (str === "TRUE" || str === "Y") {
			return true;
		} else if (str === "FALSE" || str === "N") {
			return false;
		} else {
			return null;
		}
	}

	//简单对象类型转字符串
	this.objectToStr = function(obj, type) {
		if (obj === undefined || obj === null) {
			return "";
		} else {
			switch (type) {
			case valueType.string:
				return obj.toString();
			case valueType.decimal:
				return this.decimalToStr(obj);
			case valueType.boolean:
				return this.booleanToStr(obj);
			case valueType.time:
				return this.datetimeToStr(obj, "yyyy-MM-dd HH:mm:ss");
			case valueType.date:
				return this.datetimeToStr(obj, "yyyy-MM-dd");
			default:
				alert("objectToStr, type=" + type + ", obj=" + obj.toString());
				return null;
			}
		}
	}

	//decimal
	this.decimalToStr = function(obj, isThousand, fixNum, ignoreZeroDecimal) {
		if (fixNum !== undefined) {
			obj = this.toFixed(obj, fixNum);
		}
		let value = obj.toString();
		if (isThousand || fixNum != null) {
			let subValues = value.split(".");
			let newValues = "";
			if(isThousand){
				for ( let i = 0; i < subValues[0].length; i++) {
					if (((i % 3) == (subValues[0].length % 3)) && i != 0) {
						newValues += ",";
					}
					newValues += subValues[0].substr(i, 1);
				}
			}
			else{
				newValues= subValues[0];
			}
			let dotDigitValueLength = subValues.length === 1 ? 0 : subValues[1].length;
			if (dotDigitValueLength > 0) {
				if(!ignoreZeroDecimal || subValues[1].replaceAll("0", "").length !== 0){
					newValues += ".";
					newValues += subValues[1];
				}
			} 
			if(fixNum > dotDigitValueLength && !ignoreZeroDecimal){
				if(dotDigitValueLength === 0){
					newValues += ".";
				}
				for(let i = dotDigitValueLength; i < fixNum; i++){
					newValues += "0";
				}
			} 
			value = newValues;
		}
		return value;
	}

	//boolean
	this.booleanToStr = function(obj, trueStr, falseStr) {
		if (obj === true) {
			return trueStr === undefined || trueStr === null ? "Y" : trueStr;
		} else if (obj === false) {
			return trueStr === undefined || trueStr === null ? "N" : falseStr;
		} else {
			return "";
		}
	}

	//datetime
	this.datetimeToStr = function(obj, datetimeFormat) {
		if(obj === null || obj === undefined){
			return "";
		}
		else{
			let compare = {
				'y+' : 'y',
				'M+' : 'M', //格式 月份：01到12
				'o+' : 'o', //格式 月份：1 到12
				'd+' : 'd', //格式 天 ： 01到31
				'D+' : 'D', //格式 天 ： 1 到31
				'h+' : 'h', //格式 小时：00到23
				'H+' : 'H', //格式 小时：0 到23
				'm+' : 'm', //格式 分钟：00到59
				'i+' : 'i', //格式 分钟：0 到59
				's+' : 's', //格式 秒 ： 00到59
				'S+' : 'S', //格式 秒 ： 0到59
				'f+' : 'f', //格式 毫秒 ： 0到999
				'F+' : 'F' //格式 毫秒 ： 0到999
			};
			let result = {
				'y' : obj.getFullYear(),
				'M' : (obj.getMonth() < 9) ? ("0" + (obj.getMonth() + 1)) : (obj
						.getMonth() + 1),
				'o' : (1 + obj.getMonth()),
				'd' : (obj.getDate() < 10) ? ("0" + obj.getDate()) : obj.getDate(),
				'D' : (obj.getDate() < 10) ? ("0" + obj.getDate()) : obj.getDate(),
				'h' : (obj.getHours() < 10) ? ("0" + obj.getHours()) : obj
						.getHours(),
				'H' : (obj.getHours() < 10) ? ("0" + obj.getHours()) : obj
						.getHours(),
				'm' : (obj.getMinutes() < 10) ? ("0" + obj.getMinutes()) : obj
						.getMinutes(),
				'i' : obj.getMinutes(),
				's' : (obj.getSeconds() < 10) ? ("0" + obj.getSeconds()) : obj
						.getSeconds(),
				'S' : (obj.getSeconds() < 10) ? ("0" + obj.getSeconds()) : obj
						.getSeconds(),
				'f' : obj.getMilliseconds(),
				'F' : obj.getMilliseconds()
			};
			let tmp = datetimeFormat;
			for ( let k in compare) {
	
				if (new RegExp('(' + k + ')').test(datetimeFormat)) {
	
					tmp = tmp.replace(RegExp.$1, result[compare[k]]);
				}
				;
			};
			return tmp;
		}
	}

	//获取类型中文名
	this.getValueTypeName = function(type) {
		let t = type.toLowerCase();
		switch (t) {
		case valueType.string:
			return "字符串";
		case valueType.decimal:
			return "数值";
		case valueType.boolean:
			return "布尔";
		case valueType.time:
			return "时间";
		case valueType.date:
			return "日期";
		default:
			return "未知类型" + type;
		}
	}

	// 判断是否为闰年  
	this.isLeapYear = function(myDate) {
		return (0 === myDate.getYear() % 4 && ((myDate.getYear() % 100 !== 0) || (myDate.getYear() % 400 === 0)));
	}

	//简单对象类型转字符串，param包含obj、type、isThousand是否包含千分位、fixNum小数位数
	this.objectToShowStr = function(p) {
		let obj = p.obj;
		let type = p.type;
		if (obj === undefined || obj === null) {
			return "";
		} else {
			switch (type) {
			case valueType.string:
				return obj.toString();
			case valueType.decimal:
				return this.decimalToStr(obj, p.isThousand, p.fixNum);
			case valueType.boolean:
				return this.booleanToStr(obj, p.trueStr, p.falseStr);
			case valueType.time:
				return this.datetimeToStr(obj, "yyyy-MM-dd HH:mm");
			case valueType.date:
				return this.datetimeToStr(obj, "yyyy-MM-dd");
			default:
				alert("objectToShowStr, type=" + type + ", obj="
						+ obj.toString());
				return null;
			}
		}
	}

	//根据颜色的int值获取颜色值,返回类似#000000
	this.getColorStr = function(colorInt) {
		if(colorInt == null){
			return "";
		}
		else {
			let color = Number(colorInt) + 16777216;
			let colorStr = color.toString(16);
			let len = colorStr.length;
			if (len > 6) {
				colorStr = colorStr.substring(len - 6, len);
			} else {
				for (let i = 0; i < 6 - len; i++) {
					colorStr = "0" + colorStr;
				}
			}
			colorStr = "#" + colorStr;
			return colorStr;
		}
	}

	//根据颜色的float数组值获取颜色值,返回类似#000000
	this.getColorStrByFloatArray = function(colorFloatArray) {
		let colorStr = Math.round(colorFloatArray[0] * 255).toString(16).padStart(2, "0") + Math.round(colorFloatArray[1] * 255).toString(16).padStart(2, "0") + Math.round(colorFloatArray[2] * 255).toString(16).padStart(2, "0");
		colorStr = "#" + colorStr;
		return colorStr;
	}

    //rbgInt转单个值数值 added by ls 20221202
    this.rgbIntToRGBIntArray = function(rgbInt){
		let rInt = rgbInt / (256 * 256);
		let remained = rgbInt %  (256 * 256);
		let gInt = remained / 256;
		let bInt = remained % 256;
    	return [rInt, gInt, bInt];
    }

	//转换成中文大写数字   
	this.toChinese = function(num) {
		if (!/^\d*(\.\d*)?$/.test(num)) {
			alert("Number is wrong!");
			return "Number is wrong!";
		}
		let AA = new Array("零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖");
		let BB = new Array("", "拾", "佰", "仟", "萬", "億", "点", "");
		let a = ("" + num).replace(/(^0*)/g, "").split("."), k = 0, re = "";
		for ( let i = a[0].length - 1; i >= 0; i--) {
			switch (k) {
			case 0:
				re = BB[7] + re;
				break;
			case 4:
				if (!new RegExp("0{4}\\d{" + (a[0].length - i - 1) + "}$")
						.test(a[0]))
					re = BB[4] + re;
				break;
			case 8:
				re = B, B[5] + re;
				BB[7] = BB[5];
				k = 0;
				break;
			}
			if (k % 4 === 2 && a[0].charAt(i + 2) !== 0
					&& a[0].charAt(i + 1) === 0)
				re = AA[0] + re;
			if (a[0].charAt(i) !== 0)
				re = AA[a[0].charAt(i)] + BB[k % 4] + re;
			k++;
		}
		if (a.length > 1) //加上小数部分(如果有小数部分)  
		{
			re += BB[6];
			for ( var i = 0; i < a[1].length; i++)
				re += AA[a[1].charAt(i)];
		}
		return re;
	}

	//保留小数点位数   
	this.toFixed = function(num, len) {
		if (isNaN(len) || len == null) {
			len = 0;
		} else {
			if (len < 0) {
				len = 0;
			}
		}
		return Math.round(num * Math.pow(10, len)) / Math.pow(10, len);
	}

	//转化为大写金额
	this.toMoney = function(num) {
		// 常量:  
		let MAXIMUM_NUMBER = 99999999999.99;
		let CN_ZERO = "零";
		let CN_ONE = "壹";
		let CN_TWO = "贰";
		let CN_THREE = "叁";
		let CN_FOUR = "肆";
		let CN_FIVE = "伍";
		let CN_SIX = "陆";
		let CN_SEVEN = "柒";
		let CN_EIGHT = "捌";
		let CN_NINE = "玖";
		let CN_TEN = "拾";
		let CN_HUNDRED = "佰";
		let CN_THOUSAND = "仟";
		let CN_TEN_THOUSAND = "万";
		let CN_HUNDRED_MILLION = "亿";
		let CN_SYMBOL = "";
		let CN_DOLLAR = "元";
		let CN_TEN_CENT = "角";
		let CN_CENT = "分";
		let CN_INTEGER = "整";
		// Variables:  
		let integral; // 代表整数部分.
		let dec; // 代表小数部分.
		let outputCharacters; // 输入结果.
		let parts;
		let digits, radices, bigRadices, decimals;
		let zeroCount;
		let i, p, d;
		let quotient, modulus;
		if (num > MAXIMUM_NUMBER) {
			return "";
		}
		// 先将小数部分和整数部分分开:  
		parts = (num + "").split(".");
		if (parts.length > 1) {
			integral = parts[0];
			dec = parts[1];
			// Cut down redundant decimal digits that are after the second.  
			dec = dec.substr(0, 2);
		} else {
			integral = parts[0];
			dec = "";
		}
		// Prepare the characters corresponding to the digits:  
		digits = [CN_ZERO, CN_ONE, CN_TWO, CN_THREE, CN_FOUR, CN_FIVE, CN_SIX, CN_SEVEN, CN_EIGHT, CN_NINE];
		radices = ["", CN_TEN, CN_HUNDRED, CN_THOUSAND];
		bigRadices = ["", CN_TEN_THOUSAND, CN_HUNDRED_MILLION];
		decimals = [CN_TEN_CENT, CN_CENT];

		// 开始处理:  
		outputCharacters = "";
		// 若大于0处理整数部分  
		if (ToNumber(integral) > 0) {
			zeroCount = 0;
			for (i = 0; i < integral.length; i++) {
				p = integral.length - i - 1;
				d = integral.substr(i, 1);
				quotient = p / 4;
				modulus = p % 4;
				if (d === "0") {
					zeroCount++;
				} else {
					if (zeroCount > 0) {
						outputCharacters += digits[0];
					}
					zeroCount = 0;
					outputCharacters += digits[ToNumber(d)] + radices[modulus];
				}

				if (modulus === 0 && zeroCount < 4) {
					outputCharacters += bigRadices[quotient];
				}
			}

			outputCharacters += CN_DOLLAR;
		}
		// 处理小数部分 
		if (dec !== "") {
			for (i = 0; i < dec.length; i++) {
				d = dec.substr(i, 1);
				if (d !== "0") {
					outputCharacters += digits[ToNumber(d)] + decimals[i];
				}
			}
		}
		if (outputCharacters === "") {
			outputCharacters = CN_ZERO + CN_DOLLAR;
		}
		if (dec === "") {
			outputCharacters += CN_INTEGER;
		}
		outputCharacters = CN_SYMBOL + outputCharacters;
		return outputCharacters;
	}
	//去除字符串两边的空格   
	this.trim = function(value) {
		if (value === null || value === undefined) {
			return null;
		} else {
			return value.replace(/(^\s*)|(\s*$)/g, "");
		}
	}

	//将出现的字串oldStr全部替换为newStr (区分大小写)
	this.replace = function(value, oldStr, newStr) {
		if (value === null || value === undefined) {
			return null;
		} else {
			return value.replace(new RegExp(oldStr, "gm"), newStr);
		}
	}
	
	//将出现的字串oldStr全部替换为newStr (区分大小写)
	this.replaceByRegExp = function(value, oldStr, newStr) {
		if (value === null || value === undefined) {
			return null;
		} else {
			return value.replace(oldStr, newStr);
		}
	}

	//字符串集合拼接成字符串
	this.arrayToString = function(strArray, joinStr) {
		let resultStr = "";
		for ( let i = 0; i < strArray.length; i++) {
			resultStr = resultStr + (i === 0 ? "" : joinStr) + strArray[i];
		}
		return resultStr;
	}

	this.html_encode = function(s) {
		if (s === null || s === undefined || s.length === 0)
			return "";
		s = s.toString();
		s = s.replace(/&/g, "&amp;");
		s = s.replace(/</g, "&lt;");
		s = s.replace(/>/g, "&gt;");
		//s = s.replace(/ /g, "&nbsp;");
		s = s.replace(/ /g, "&ensp;");
		s = s.replace(/\'/g, "&#39;");
		s = s.replace(/\"/g, "&quot;");
		s = s.replace(/\n/g, "<br>");
		return s;
	}

	this.html_decode = function(s) {
		if (s.length === 0)
			return "";
		//s = str.replace(/&gt;/g, "&");
		s = s.replace(/&lt;/g, "<");
		s = s.replace(/&gt;/g, ">");
		//增加对&ensp;的替换 added by ls 20170908
		s = s.replace(/&ensp;/g, " ");
		s = s.replace(/&nbsp;/g, " ");
		s = s.replace(/&#39;/g, "\'");
		s = s.replace(/&quot;/g, "\"");
		s = s.replace(/<br>/g, "\n");
		return s;
	}
	
	//将正则表达式的特殊保留字符转义 added by ls 20170912
	this.encodeRegExpString = function(s){
		if(s.length !== 0){
			let newStr = "";
			for(let i = 0; i < s.length; i++){
				switch(s[i]){
					case "*":
					case ".":
					case "?":
					case "+":
					case "$":
					case "^":
					case "[":
					case "]":
					case "(":
					case ")":
					case "{":
					case "}":
					case "|":
					case "\\":
						newStr += "\\"+s[i];
						break;
					default:
						newStr += s[i];
				}
			}
			return newStr;
		}
		else{
			return "";
		}
	}
	
	//获取网页地址中的参数
	this.getQueryStringArgs = function() {
		let query = document.location.search.substring(1); // 取查询字符串
	    return this.getQueryArgsFromString(query);
	}

	//获取网页地址中的参数
	this.getQueryArgsFromString = function(queryString) {
		let args = {};
		let pairs = queryString.split("&"); // 以 & 符分开成数组
	    for (let i = 0; i < pairs.length; i++) {
			let pos = pairs[i].indexOf('='); // 查找 "name=value" 对
	        if (pos === -1) continue; // 若不成对，则跳出循环继续下一对
			let argname = pairs[i].substring(0, pos); // 取参数名
			let value = pairs[i].substring(pos + 1); // 取参数值
	        value = decodeURIComponent(value); // 若需要，则解码 
	        args[argname] = value; // 存成对象的一个属性 
	    }
	    return args; // 返回此对象
	}
	
	//获取对象的属性个数
	this.getObjectPropertyCount = function(obj){
		if(obj == null){
			return null;
		}
		else{
			let num = 0;
			for(let k in obj){
				num++;
			}
			return num;
		}
	}
	this.isEmail = function(strEmail) {
		if(strEmail == null || strEmail.length == 0){
			return false;
		}
		else if (strEmail.search(/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/) != -1){
			return true;
		}
		else{
			return false;
		}
	}
	this.accMul = function(arg1, arg2) {
		let m=0,s1=arg1.toString(),s2=arg2.toString();
	    try{m+=s1.split(".")[1].length}catch(e){} 
	    try{m+=s2.split(".")[1].length}catch(e){} 
	    return Number(s1.replace(".",""))*Number(s2.replace(".",""))/Math.pow(10,m); 
	} 

	//对cookie的操作 added by ls 20210225
	this.setCookie = function(name,value,iDay) {
		let oDate=new Date();
		oDate.setDate(oDate.getDate()+iDay);
		document.cookie=name+'='+value+';expires='+oDate;

	}
	
	this.getCookie = function(name) {
		let arr=document.cookie.split('; ');
		let i=0;
		for(i=0;i<arr.length;i++)
		{
			let arr2=arr[i].split('=');
			
			if(arr2[0]==name)
			{
				return arr2[1];
			}
		}
		
		return null;
	}

	this.removeCookie = function(name) {
		setCookie(name, '1', -1);
	}

	//找到最大值 added by ls 20220818
	this.min = function(values){
		let value = Number.MAX_VALUE;
		for(let i = 0; i < values.length; i++){
			let v = values[i];
			if(v < value){
				value = v;
			}
		}
		return value;
	}
	
	//找到最小值 added by ls 20220818
	this.max = function(values){
		let value = -Number.MAX_VALUE;
		for(let i = 0; i < values.length; i++){
			let v = values[i];
			if(v > value){
				value = v;
			}
		}
		return value;
	}

}

let ListContainer = function (p) {
	const that = this;
	this.width = p.width;
	this.height = p.height;
	this.closeWinFunc = p.closeWinFunc;
	this.containerId = cmnPcr.getRandomValue();
	this.overlayId = cmnPcr.getRandomValue();

	this.getWindowOffset = function() {
		let ww = 0, wh = 0;
		// 获取窗口宽度
		if (window.innerWidth)
			ww = window.innerWidth;
		else if ((document.body) && (document.documentElement.clientWidth))
			ww = document.documentElement.clientWidth;
		// 获取窗口高度 
		if (window.innerHeight)
			wh = window.innerHeight;
		else if ((document.body) && (document.documentElement.clientHeight))
			wh = document.documentElement.clientHeight;
		return {
			width : ww,
			height : wh
		}
	}

	this.calculatePos = function(winSize, parentAttr, popSize) {
		let left, top;
		if (that.left === undefined) {
			if (winSize.height >= (parentAttr.top + parentAttr.height + popSize.height))
				top = parentAttr.top + parentAttr.height;
			else {
				if (parentAttr.top - popSize.height >= 0)
					top = parentAttr.top - popSize.height;
				else
					top = 0;
			}
		}
		if (parentAttr.left + parentAttr.width > popSize.width)
			left = parentAttr.left + parentAttr.width - popSize.width;
		else {
			left = 0;
		}
		return {
			"left" : left,
			"top" : top
		};
	}

	this.show = function() {
		let offset = $(p.parentControl).offset();
		offset.height = $(p.parentControl)[0].offsetHeight;
		offset.width = $(p.parentControl)[0].offsetWidth;

		let winOffset = this.getWindowOffset();
		let popSize = {
			"width" : that.width,
			"height" : that.height
		};
		let newPos = this.calculatePos(winOffset, offset, popSize);
		let overlayZIndex = cmnPcr.getTopZIndex();
		let boxZIndex = cmnPcr.getTopZIndex();
		let popHtml = "<div class=\"zlpListOverlay\" id=\"" + this.overlayId
				+ "\" style=\"z-index:" + overlayZIndex + ";\"></div>"
				+ "<div class=\"zlpListBox\" style=\"z-index:" + boxZIndex
				+ ";left:" + newPos.left + "px;top:" + newPos.top + "px;width:"
				+ popSize.width + "px;height:" + popSize.height + "px;\" id=\""
				+ this.containerId + "\"></div>";
		$(document.body).append(popHtml);

		$("#" + this.overlayId).click(function() {
			that.close( {});
		});
	}

	this.close = function(p) {
		if (that.closeWinFunc) {
			that.closeWinFunc(p);
		}
		let container = $("#" + this.containerId);
		let overlay = $("#" + this.overlayId);
		$(container).empty();
		$(container).remove();
		$(overlay).empty();
		$(overlay).remove();
	}
}

let PopupContainer = function (p) {
	const thatPopContainer = this;
	this.title = p.title;
	this.width = p.width;
	this.height = p.height;
	this.top = p.top;
	this.left = p.left;
	this.closeWinFunc = p.closeWinFunc;
	this.containerId = cmnPcr.getRandomValue();
	this.boxId = cmnPcr.getRandomValue();
	this.overlayId = cmnPcr.getRandomValue();
	this.isHidden = false;
	this.backdrop = p.backdrop !== undefined ? p.backdrop : false;
	this.canClose = p.canClose !== undefined ? p.canClose : true;
	
	//增加可拖拽操作 added by ls 20210820
	this.dragInfo = {
		distanceX: 0,
		distanceY: 0,
		isDown: false
	};

	this.getWindowOffset = function() {
		let ww = 0, wh = 0;
		// 获取窗口宽度
		if (window.innerWidth)
			ww = window.innerWidth;
		else if ((document.body) && (document.documentElement.clientWidth))
			ww = document.documentElement.clientWidth;
		// 获取窗口高度 
		if (window.innerHeight)
			wh = window.innerHeight;
		else if ((document.body) && (document.documentElement.clientHeight))
			wh = document.documentElement.clientHeight;
		return {
			width : ww,
			height : wh
		}
	}

	this.calculatePos = function(winSize, popSize) {
		let left = thatPopContainer.left;
		let top = thatPopContainer.top;
		if (top === undefined) {
			if (winSize.height >= popSize.height)
				top = (winSize.height - popSize.height) / 2;
			else {
				top = 0;
			}
		}
		if (left === undefined) {
			if (winSize.width > popSize.width)
				left = (winSize.width - popSize.width) / 2;
			else {
				left = 0;
			}
		}
		return {
			"left" : left,
			"top" : top
		};
	}

	this.show = function(callbackFunc) {
		let box = $("#" + thatPopContainer.boxId);
		let overlay = $("#" + thatPopContainer.overlayId);
		if(thatPopContainer.isHidden){
			$(box).css("display", "block");
			$(overlay).css("display", "block");
			thatPopContainer.isHidden = false;
		}
		else{
			let winOffset = thatPopContainer.getWindowOffset();
			let popSize = {
				"width" : thatPopContainer.width,
				"height" : thatPopContainer.height
			};
			let newPos = thatPopContainer.calculatePos(winOffset, popSize);
			let overlayZIndex = cmnPcr.getTopZIndex();
			let boxZIndex = cmnPcr.getTopZIndex();
			//alert(popSize.width)
			let popHtml = "<div class=\"zlpPopOverlay\" id=\"" + thatPopContainer.overlayId + "\" style=\"display:none;z-index:" + overlayZIndex + ";\"></div>"
				+ "<div class=\"zlpPopBox\" id=\"" + thatPopContainer.boxId + "\" style=\"z-index:" + boxZIndex + ";left:" + newPos.left + "px;top:" + thatPopContainer.top + "px;width:" + popSize.width + "px;height:" + popSize.height + "px;\">"
				+ "<div class=\"zlpPopTitle\"></div><div class=\"zlpPopCloseBtn\">×</div>"
				+ "<div class=\"zlpPopInnerBox\" id=\"" + thatPopContainer.containerId + "\"></div>"
				+ "</div>";
			$(document.body).append(popHtml);
			$(overlay).css({display: "block"});
			$("#" + thatPopContainer.containerId).css({display: "block"});
			$(box).find(".zlpPopTitle").text(thatPopContainer.title);
			$(box).find(".zlpPopCloseBtn").click(function(){
				if(thatPopContainer.canClose){
					thatPopContainer.close({});
				}
				else{
					thatPopContainer.hide({});
				}
			});
			$("#" + thatPopContainer.boxId).click(function(){
				return false;
			});
			$(overlay).click(function(){
				if(thatPopContainer.backdrop){
					thatPopContainer.close({});
				}
			});
			if(callbackFunc != null){
				callbackFunc();
			} 
			
			//增加可拖拽操作 add by ls 20210820
			$(box).find(".zlpPopTitle").mousedown(function(e){
				let dv = $(this).parent();
				let positionDiv = $(dv).offset();
				thatPopContainer.dragInfo.distanceX = e.pageX - positionDiv.left;
				thatPopContainer.dragInfo.distanceY = e.pageY - positionDiv.top;
				thatPopContainer.dragInfo.isDown = true;
			});

			$(box).mousemove(function(e){
				if(thatPopContainer.dragInfo.isDown){
			        var x = e.pageX - thatPopContainer.dragInfo.distanceX;
			        var y = e.pageY - thatPopContainer.dragInfo.distanceY;
	
			        if (x < 0) {
			            x = 0;
			        }
			        else if (x > $("#" + thatPopContainer.overlayId).width() - $("#" + thatPopContainer.boxId).outerWidth(true)) {
			            x = $("#" + thatPopContainer.overlayId).width() - $("#" + thatPopContainer.boxId).outerWidth(true);
			        }
	
			        if (y < 0) {
			            y = 0;
			        } 
			        else if (y > $("#" + thatPopContainer.overlayId).height() - $("#" + thatPopContainer.boxId).outerHeight(true)) {
			            y = $("#" + thatPopContainer.overlayId).height() - $("#" + thatPopContainer.boxId).outerHeight(true);
			        }
	
			        $(box).css({
			            'left': x + 'px',
			            'top': y + 'px'
			        });
				}
			});

		    $(box).mouseup(function() {
				thatPopContainer.dragInfo.isDown = false;
		    });
			
		}
	}

	this.close = function(p) {
		if (thatPopContainer.closeWinFunc) {
			thatPopContainer.closeWinFunc(p);
		}
		let box = $("#" + thatPopContainer.boxId);
		let overlay = $("#" + thatPopContainer.overlayId);
		$(box).empty();
		$(box).remove();
		$(overlay).empty();
		$(overlay).remove();
	}
	
	this.hide = function(){
		if (thatPopContainer.closeWinFunc) {
			thatPopContainer.closeWinFunc(p);
		} 
		$("#" + thatPopContainer.boxId).css("display", "none"); 
		$("#" + thatPopContainer.overlayId).css("display", "none"); 
		thatPopContainer.isHidden = true;
	}
}

let OpacityContainer = function (p) {
	const thatOpacityContainer = this;
	this.title = p.title;  
	this.style = p.style;
	this.closeWinFunc = p.closeWinFunc;
	this.containerId = cmnPcr.getRandomValue();
	this.boxId = cmnPcr.getRandomValue(); 
	this.isHidden = false;
	this.backdrop = p.backdrop !== undefined ? p.backdrop : false;
	this.canClose = p.canClose !== undefined ? p.canClose : true;

	this.show = function(callbackFunc) {
		if(thatOpacityContainer.isHidden){
			$("#" + thatOpacityContainer.boxId).css("display", "block");  
			thatOpacityContainer.isHidden = false;
		}
		else{  
			let boxZIndex = cmnPcr.getTopZIndex();
			let popHtml = "<div class=\"zlpOpacityBox\" id=\"" + thatOpacityContainer.boxId + "\" style=\"" + thatOpacityContainer.style + "\">"
				+ "<div class=\"zlpOpacityBackground\"></div>"
				+ "<div class=\"zlpOpacityTitle\"></div><div class=\"zlpOpacityCloseBtn\">×</div>"
				+ "<div class=\"zlpOpacityInnerBox\" id=\"" + thatOpacityContainer.containerId + "\"></div>"
				+ "</div>";
			$(document.body).append(popHtml);
			$("#" + thatOpacityContainer.boxId + " .zlpOpacityTitle").text(thatOpacityContainer.title);
			$("#" + thatOpacityContainer.boxId + " .zlpOpacityCloseBtn").click(function(){
				if(thatOpacityContainer.canClose){
					thatOpacityContainer.close({});
				}
				else{
					thatOpacityContainer.hide({});
				}
			});
			$("#" + thatOpacityContainer.boxId).click(function(){
				return false;
			}); 
			
			if(callbackFunc != null){
				callbackFunc();
			}			
		}
	}

	this.close = function(p) {
		if (thatOpacityContainer.closeWinFunc) {
			thatOpacityContainer.closeWinFunc(p);
		}
		let container = $("#" + thatOpacityContainer.boxId);
		$(container).empty();
		$(container).remove();
	}
	
	this.hide = function(){
		if (thatOpacityContainer.closeWinFunc) {
			thatOpacityContainer.closeWinFunc(p);
		} 
		$("#" + thatOpacityContainer.boxId).css("display", "none");  
		thatOpacityContainer.isHidden = true;
	}
}

//String类型数据新增判断是否以str开头
String.prototype.startWith = function(str) {
	str = str.replace("*", "\\u002A");
	var reg = new RegExp("^" + str);
	return reg.test(this);
}

//String类型数据新增判断是否以str结尾
String.prototype.endWith = function(str) {
	str = str.replace("*", "\\u002A");
	var reg = new RegExp(str + "$");
	return reg.test(this);
}

//判断数组内是否包含某个元素
Array.prototype.contains = function(element) {
	for (let i = 0; i < this.length; i++) {
		if (this[i] === element) {
			return true;
		}
	}
	return false;
}
export {MsgBox,ModalDialog,WaitingBar,ServerAccess,CommonProcessor,ListContainer,PopupContainer,OpacityContainer}