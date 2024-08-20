import "s3dAutoRotateCamera.css"

//自动旋转
let S3dAutoRotateCamera = function (){
	const thatAutoRotateCamera = this;

	this.manager = null;
	
	this.containerId = null;    

    this.cameraRotationSetting = {
		oneRoundTime: 90000,
		rotating: false,
		waitingBeforeBeginTime: 30000
	};

    this.target = null;

	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatAutoRotateCamera.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatAutoRotateCamera.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatAutoRotateCamera.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	}

	this.init = function(p){
		thatAutoRotateCamera.manager = p.manager; 
		thatAutoRotateCamera.containerId = p.containerId; 
        if(p.config.onCloseInfoContainer != null){
        	thatAutoRotateCamera.addEventFunction("onCloseInfoContainer", p.config.onCloseInfoContainer); 
        }
	} 

	this.onCloseInfoContainer = function(p){
    	thatAutoRotateCamera.doEventFunction("onCloseInfoContainer", p);
	}
  	
	//启动自动旋转Camera
	this.startRotateCamera = function(p){

		let position = p.position;
		let target = p.target;
        thatAutoRotateCamera.target = p.target;
        let zoom = p.zoom;

		//重新设置中心点
		thatAutoRotateCamera.manager.viewer.setViewport(target, position, zoom);  
		
		let roundCount = 100000;
    	let startRotateY = 0;
    	let endRotateY = Math.PI * 2 * roundCount; 

		let distanceXZ = Math.sqrt((position[0] - target[0]) * (position[0] - target[0]) + (position[2] - target[2]) * (position[2] - target[2]));
		 		
    	//旋转camera
    	let rotateCameraStep = new TWEEN.Tween({rotateY: startRotateY, distanceXZ: distanceXZ, yPosition: position[1]}) 
    	.to({rotateY: endRotateY, distanceXZ: distanceXZ, yPosition: position[1]}, thatAutoRotateCamera.cameraRotationSetting.oneRoundTime * roundCount)  
		.onUpdate(function(p){ 
			thatAutoRotateCamera.updateCameraAnimation(this);
		});    

    	thatAutoRotateCamera.cameraRotationSetting.step = rotateCameraStep; 
    	thatAutoRotateCamera.cameraRotationSetting.rotating = true;
    	rotateCameraStep.start(); 
	}
	
	//停止自动旋转Camera
	this.stopRotateCamera = function(){
		if(thatAutoRotateCamera.cameraRotationSetting.step != null){
			thatAutoRotateCamera.cameraRotationSetting.step.stop();
		} 
    	thatAutoRotateCamera.cameraRotationSetting.rotating = false;
	}
	
	//停止自动旋转Camera
	this.autoRotateCamera = function(rotating){
		if(rotating == null){
			if(thatAutoRotateCamera.cameraRotationSetting.rotating){
				thatAutoRotateCamera.stopRotateCamera();
			}
			else{
				thatAutoRotateCamera.startRotateCamera();
			}
		}
		else if(rotating){
			if(!thatAutoRotateCamera.cameraRotationSetting.rotating){ 
				thatAutoRotateCamera.startRotateCamera();
			}
		}
		else{
			if(thatAutoRotateCamera.cameraRotationSetting.rotating){
				thatAutoRotateCamera.stopRotateCamera();
			} 
		}
	} 

	this.updateCameraAnimation = function(p){
		let x = p.distanceXZ * Math.cos(p.rotateY);
		let z = p.distanceXZ * Math.sin(p.rotateY);
		let target = thatAutoRotateCamera.target;  
		let y = p.yPosition * Math.abs(Math.cos(p.rotateY / 2)) * 0.8 + p.yPosition * 0.2;
    	thatAutoRotateCamera.manager.viewer.orbitControl.position0 = new THREE.Vector3(target[0] + x, y, target[2] + z); 
    	thatAutoRotateCamera.manager.viewer.orbitControl.reset(); 			
	}  
	
	this.showInfoAnimate = function(p){
 
        let targetPosition = p.targetPosition;
        let cameraPosition = p.cameraPosition; 
        let lastViewport = thatAutoRotateCamera.manager.viewer.getCameraViewport();
        
        //旋转camera
        let infoPointStep = new TWEEN.Tween({
            cameraPositionX: lastViewport.position[0],
            cameraPositionY: lastViewport.position[1],
            cameraPositionZ: lastViewport.position[2],
            targetPositionX: lastViewport.target[0],
            targetPositionY: lastViewport.target[1],
            targetPositionZ: lastViewport.target[2],
            zoom: lastViewport.zoom,
        }) 
        .to({
            cameraPositionX: cameraPosition[0],
            cameraPositionY: cameraPosition[1],
            cameraPositionZ: cameraPosition[2],
            targetPositionX: targetPosition[0],
            targetPositionY: targetPosition[1],
            targetPositionZ: targetPosition[2],
            zoom: p.zoom,
        }, 800)  
        .onUpdate(function(p){ 
            thatAutoRotateCamera.manager.viewer.setViewport([this.targetPositionX, this.targetPositionY, this.targetPositionZ], [this.cameraPositionX, this.cameraPositionY, this.cameraPositionZ], this.zoom);  
        });
        infoPointStep.start(); 

        thatAutoRotateCamera.showInfoContentPage({
            title: p.title,
            linkUrl: p.linkUrl
        }); 
	}
	
	this.showInfoContentPage = function(p){
		let container =  $("#" + thatAutoRotateCamera.containerId);
       $(container).find(".cameraTagContainer").remove();
        let html = "<div class=\"cameraTagContainer\" style=\"display: block;\">"
            + "<div class=\"cameraTagBackground\"></div>"
            + "<div class=\"cameraTagTitle\"></div>"
            + "<div class=\"cameraTagClose\">×</div>"
            + "<div class=\"cameraTagInnerContainer\"><iframe class=\"cameraTagPointContent\" border=\"0\" src=\"\"></iframe></div>"
            + "</div>";
		$(container).append(html);
        $(container).find(".cameraTagTitle").text(p.title);
        $(container).find(".cameraTagPointContent").attr("src", p.linkUrl);
        $(container).find(".cameraTagClose").click(function(){
            $("#" + thatAutoRotateCamera.containerId).find(".cameraTagContainer").remove();
            thatAutoRotateCamera.onCloseInfoContainer();
        });
	}
}
export default S3dAutoRotateCamera