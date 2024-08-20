import "./s3dMessageBox.css"
//S3dWeb 消息框
let S3dMessageBox = function (){
	
	//当前对象
	const thatS3dMessageBox = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	//初始化
	this.init = function(p){
		thatS3dMessageBox.containerId = p.containerId;
		thatS3dMessageBox.manager = p.manager; 
	} 
	 
	//显示
	this.show = function(p){
		let container = $("#" + thatS3dMessageBox.containerId);
		if($(container).find(".s3dMessageBoxContainer").length === 0){
			let winHtml = thatS3dMessageBox.getWinHtml();
			$(container).append(winHtml);
		}	
		$(container).find(".s3dMessageBoxContainer").css({display: "block"});
		thatS3dMessageBox.refreshText(p);
	} 
	
	//显示状态
	this.refreshText = function(p){
		$("#" + thatS3dMessageBox.containerId).find(".s3dMessageBoxText").html(p.message);
	}
	
	//隐藏
	this.hide = function(p){
		$("#" + thatS3dMessageBox.containerId).find(".s3dMessageBoxContainer").fadeOut(p.timeout == null ? 1000 : p.timeout);
	}

	//获取显示状态
	this.getVisible = function(){
		return $("#" + thatS3dMessageBox.containerId).find(".s3dMessageBoxContainer").css("display") === "block";
	}
	
	//获取html
	this.getWinHtml = function(){
		return "<div class=\"s3dMessageBoxContainer\">"
			+ "<div class=\"s3dMessageBoxInnerContainer\">"
			+ "<div class=\"s3dMessageBoxBackground\"></div>"
			+ "<div class=\"s3dMessageBoxText\"></div>"
			+ "</div>"
			+ "</div>";
	}
}
export default S3dMessageBox