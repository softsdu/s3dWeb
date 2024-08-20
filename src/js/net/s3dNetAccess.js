//调用服务器端方法类
let S3dNetAccess = function (){
	const thatS3dNetAccess = this;
	
	this.configs = null;

	this.containerId = null;

	this.serverUrl = null;

	this.serviceName = null; 

	this.s3dType = "s3dNormal";

	this.appKey = null; 
	
	this.init = function(initParams){
		thatS3dNetAccess.serverUrl = initParams.serverUrl;
		thatS3dNetAccess.serviceName = initParams.serviceName;
		thatS3dNetAccess.appKey = initParams.appKey; 
	} 

	this.createModel = function(p){
		let requestParam = {
			modelName: p.modelName, 
			s3dType: thatS3dNetAccess.s3dType
		};  
		thatS3dNetAccess.request({
			requestParam: requestParam, 
			funcName: "createModel",
			successFunc: function(obj) {
				p.successFunc(obj);
			},
			failFunc: function(obj) {
				msgBox.error({title:"提示", info: obj.message});
			}
		});
	}

	this.copyModel = function(p){
		let requestParam = {
			modelId: p.modelId
		};  
		thatS3dNetAccess.request({
			requestParam: requestParam, 
			funcName: "copyModel",
			successFunc: function(obj) {
				p.successFunc(obj);
			},
			failFunc: function(obj) {
				msgBox.error({title:"提示", info: obj.message});
			}
		});
	}

	this.deleteModel = function(p){
		let requestParam = {
			modelId: p.modelId
		};  
		thatS3dNetAccess.request({
			requestParam: requestParam, 
			funcName: "deleteModel",
			successFunc: function(obj) {
				p.successFunc(obj);
			},
			failFunc: function(obj) {
				msgBox.error({title:"提示", info: obj.message});
			}
		});
	}

	this.getModelList = function(p){
		let requestParam = {
			s3dType: thatS3dNetAccess.s3dType
		};  
		thatS3dNetAccess.request({
			requestParam: requestParam, 
			funcName: "getModelList",
			successFunc: function(obj) {
				p.successFunc(obj);
			},
			failFunc: function(obj) {
				msgBox.error({title:"提示", info: obj.message});
			}
		});
	}

	this.request = function(p){ 
		serverAccess.request({			
			serverUrl: thatS3dNetAccess.serverUrl,
			serviceName: thatS3dNetAccess.serviceName,			
			appKey: thatS3dNetAccess.appKey,
			funcName: p.funcName,
			args: {requestParam: cmnPcr.jsonToStr(p.requestParam)}, 
			successFunc: p.successFunc,
			failFunc: p.failFunc,
			errorFunc: function(httpRequest, textStatus, errorThrown){
				thatS3dNetAccess.service.active = false;
				msgBox.alert({info: "无法连通S3d服务"}); 
			}
		}) 
	} 
}

export default S3dNetAccess