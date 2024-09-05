import * as THREE from "three";
import {FontLoader} from "fontLoader";
import {TextGeometry} from "textGeometry";
import {cmnPcr} from "../../commonjs/common/static.js"

//S3dWeb Axis
let S3dAxis = function (){
	//当前对象
	const thatS3dAxis = this;

	this.manager = null;

	//网格的起始刻度，为了解决plane和grid覆盖显示的问题 modified by ls 20230608
	this.gridZero = -0.01;

	//忽略误差的值（有时候double运算会出现不精确的问题）
	this.ignoreSize = 0.0001;

	//y方向（地坪在y轴位置）
	this.yZero = -0.001;

	//字体路径
	this.fontUrl;

	//默认字体
	this.defaultFont;

	//是否显示轴网
	this.hasAxis = true;

	//是否显示地平面
	this.hasPlane = true;

	//字体厚度
	this.fontThickness = 0.002;
	this.fontShift = 0.05;

	//x轴网材质
	this.xColor = 0x00FF00;
	this.xMaterial = null;
	
	//z轴网材质
	this.zColor = 0xFF0000;
	this.zMaterial = null;

	//网格材质
	this.gridColor = 0x666666;
	this.gridMaterial = null;
	
	//边框材质
	this.borderColor = 0x222222;
	this.borderMaterial = null;

	//地平面材质
	this.groundColor = 0xFFFFFF;
	this.planeMaterial = null;


	//刻度字体材质
	this.textColor = 0xCCCCCC;
	this.textMaterial = null;

	this.initMaterials = function (){

		thatS3dAxis.planeMaterial = new THREE.LineBasicMaterial({
			color: thatS3dAxis.groundColor,
			side: THREE.DoubleSide,
			opacity: 0.1,
			transparent: true
		});


		//刻度字体材质
		thatS3dAxis.textMaterial = new THREE.LineBasicMaterial({
			color: thatS3dAxis.textColor
		});

		//网格材质
		thatS3dAxis.gridMaterial = new THREE.LineBasicMaterial({
			color: thatS3dAxis.gridColor,
			linewidth: 1
		});

		//边框材质
		thatS3dAxis.borderMaterial = new THREE.LineBasicMaterial({
			color: thatS3dAxis.borderColor,
			linewidth: 1
		});

		//x轴网材质
		thatS3dAxis.xMaterial = new THREE.LineBasicMaterial({
			color: thatS3dAxis.xColor,
			linewidth: 1
		});

		//z轴网材质
		thatS3dAxis.zMaterial = new THREE.LineBasicMaterial({
			color: thatS3dAxis.zColor,
			linewidth: 1
		});
	}

	//初始化
	this.init = function(p){
		thatS3dAxis.manager = p.manager; 
		thatS3dAxis.fontUrl = p.config.fontUrl;
		thatS3dAxis.hasAxis = p.config.hasAxis == null ? false : p.config.hasAxis;
		thatS3dAxis.hasPlane = p.config.hasPlane == null ? false : p.config.hasPlane;

		thatS3dAxis.groundColor = p.config.groundColor == null ? thatS3dAxis.groundColor : p.config.groundColor;
		thatS3dAxis.gridColor = p.config.gridColor == null ? thatS3dAxis.gridColor : p.config.gridColor;
		thatS3dAxis.borderColor = p.config.borderColor == null ? thatS3dAxis.borderColor : p.config.borderColor;
		thatS3dAxis.textColor = p.config.textColor == null ? thatS3dAxis.textColor : p.config.textColor;
		thatS3dAxis.xColor = p.config.xColor == null ? thatS3dAxis.xColor : p.config.xColor;
		thatS3dAxis.zColor = p.config.zColor == null ? thatS3dAxis.zColor : p.config.zColor;

		thatS3dAxis.initMaterials();
		thatS3dAxis.initAxisInfo();
		thatS3dAxis.loadFont();
	}

	//隐藏
	this.hide = function(){
		$("#" + thatS3dAxis.containerId).find(".s3dPropertyEditorContainer").css({"display": "none"});
	}

	//隐藏
	this.show = function(){
		$("#" + thatS3dAxis.containerId).find(".s3dPropertyEditorContainer").css({"display": "block"});
	}

	//加载字体
	this.loadFont = function(p){
		let textLoad = new FontLoader();
		textLoad.load(thatS3dAxis.fontUrl, function(font){
			thatS3dAxis.defaultFont = font;
			if(thatS3dAxis.hasPlane){
				thatS3dAxis.addGroundPlane();
			}		
			if(thatS3dAxis.hasAxis){
				thatS3dAxis.addAxis();
			}				
		});
	} 

	//获取轴网信息
	this.getAxisInfo = function(){
		return thatS3dAxis.axisInfo;
	}

	//设置轴网信息
	this.setAxisInfo = function(axisInfo){
		thatS3dAxis.manager.s3dObject.axis = axisInfo;
		thatS3dAxis.removeGroundPlane();
		if(thatS3dAxis.hasPlane){
			thatS3dAxis.addGroundPlane();	
		}		
		thatS3dAxis.removeAxis();
		if(thatS3dAxis.hasAxis){
			thatS3dAxis.addAxis();
		}
	}

	//初始化轴网信息（暂未实现）
	this.initAxisInfo = function(){
	}
	
	//初始化GroundPlane
    this.removeGroundPlane = function(){    
		let viewer = thatS3dAxis.manager.viewer;
		let oldPlane = null;
		for(let i = 0; i <  viewer.scene.children.length; i++){
			let object3D = viewer.scene.children[i];
			if(object3D.isGroundPlane){
				oldPlane = object3D;
			}
		}
		if(oldPlane != null){
			viewer.scene.remove(oldPlane);
		}
	}
	
	//初始化GroundPlane
    this.addGroundPlane = function(){

		//比原有尺寸扩大倍数
		let planeScale = 2.5;
		let axisInfo = thatS3dAxis.manager.s3dObject.axis;
		let xCenter = 0;
		let zCenter = 0;
		let sizeX = axisInfo.size.x;
		let sizeZ = axisInfo.size.z;
		let planeGeometry = new THREE.PlaneGeometry(sizeX * planeScale, sizeZ * planeScale);
		let plane = new THREE.Mesh(planeGeometry, thatS3dAxis.planeMaterial);
		plane.rotation.x = -0.5 * Math.PI;
		plane.position.set(xCenter, thatS3dAxis.gridZero, zCenter);

        plane.receiveShadow = true;
        plane.isGroundPlane = true;
		thatS3dAxis.manager.viewer.scene.add(plane);
	}

	//删除原有轴网
	this.removeAxis = function(){
		let viewer = thatS3dAxis.manager.viewer;
		let allAxisObjects = [];
		for(let i = 0; i < viewer.scene.children.length; i++){
			let obj = viewer.scene.children[i];
			if(obj.isAxis){
				allAxisObjects.push(obj);
			}
		}
		for(let i = 0; i < allAxisObjects.length; i++){
			let obj = allAxisObjects[i];
			viewer.scene.remove(obj);
		} 
	}
	
	//添加轴网
    this.addAxis = function(){
		let axisInfo = thatS3dAxis.manager.s3dObject.axis;
		let spaceSizeM = axisInfo.gridSpace;
		let minX = -axisInfo.size.x;
		let minZ = -axisInfo.size.z;
		let maxX = axisInfo.size.x;
		let maxZ = axisInfo.size.z;
		let xCount = Math.ceil(Number((maxX / spaceSizeM).toFixed(3)));
		let zCount = Math.ceil(Number((maxZ / spaceSizeM).toFixed(3)));
		let textParameter = {
			font: thatS3dAxis.defaultFont,
			size: axisInfo.fontSize,
			height: thatS3dAxis.fontThickness
		};
 		
		//重绘
		let xLineInfos = [];
		for(let i = -xCount; i <= xCount; i++){
			let x = Number((i * spaceSizeM).toFixed(3));
			if(x <= maxX){
				let lineInfo = {
					from: {
						x: x,
						y: thatS3dAxis.yZero,
						z: minZ - thatS3dAxis.fontShift
					},
					to: {
						x: x,
						y: thatS3dAxis.yZero,
						z: maxZ + thatS3dAxis.fontShift
					},
					material: i === 0 || i === xCount|| i === -xCount ? thatS3dAxis.borderMaterial : thatS3dAxis.gridMaterial,
					value: x
				};
				xLineInfos.push(lineInfo);
			}
		}

		let zLineInfos = [];
		for(let i = -zCount; i <= zCount; i++){
			let z = Number((i * spaceSizeM).toFixed(3));
			if(z <= maxZ) {
				let lineInfo = {
					from: {
						x: minX - thatS3dAxis.fontShift,
						y: thatS3dAxis.yZero,
						z: z
					},
					to: {
						x: maxX + thatS3dAxis.fontShift,
						y: thatS3dAxis.yZero,
						z: z
					},
					material: i === 0 || i === zCount || i === -zCount ? thatS3dAxis.borderMaterial : thatS3dAxis.gridMaterial,
					value: z
				};
				zLineInfos.push(lineInfo);
			}
		} 
		thatS3dAxis.addAxisLines(xLineInfos, "bottom", textParameter);  
		thatS3dAxis.addAxisLines(zLineInfos, "right", textParameter); 
		thatS3dAxis.addAxisTexts(zLineInfos, "left", textParameter);  
		thatS3dAxis.addAxisTexts(zLineInfos, "right", textParameter); 
		thatS3dAxis.addAxisTexts(xLineInfos, "top", textParameter);  
		thatS3dAxis.addAxisTexts(xLineInfos, "bottom", textParameter);  
	}

	//添加轴网线
    this.addAxisLines = function(lineInfos, direction, textParameter){      	
    	//每个间隔 
		let viewer = thatS3dAxis.manager.viewer;
    	for(let i = 0; i < lineInfos.length; i++){ 
			let lineInfo = lineInfos[i];
            let geometry = new THREE.BufferGeometry();   
			let positions = [];  
			positions.push(lineInfo.from.x, lineInfo.from.y, lineInfo.from.z);
			positions.push(lineInfo.to.x, lineInfo.to.y, lineInfo.to.z); 
			geometry.setAttribute("position", new THREE.Float32BufferAttribute( positions, 3 ) ); 
            let line = new THREE.Line(geometry, lineInfo.material); 
            line.isAxis = true; 
        	viewer.scene.add(line);    
    	}  	 
    }

	//添加刻度
    this.addAxisTexts = function(lineInfos, direction, textParameter){ 
        let rotation = [0, 0, 0];
        switch(direction){
	        case "left":{ 
	        	rotation = [0.5 * Math.PI, Math.PI, 0.5 * Math.PI];
	        	break;
	        } 
	        case "right":{ 
	        	rotation = [-0.5 * Math.PI, 0, 0.5 * Math.PI];
	        	break;
	        }
	        case "bottom":{
	        	rotation = [-0.5 * Math.PI, 0, 0];
	        	break;
	        } 
	        case "top":{
	        	rotation = [0.5 * Math.PI, Math.PI, 0];
	        	break;
	        } 
        } 
    	
    	//每个间隔 
		let viewer = thatS3dAxis.manager.viewer;
    	for(let i = 0; i < lineInfos.length; i++){
			let lineInfo = lineInfos[i]; 
        	
        	//显示值			 
        	let textGeo = new TextGeometry(cmnPcr.decimalToStr(common3DFunction.m2mm(lineInfo.value), false, 0), textParameter);
        	let textMesh = new THREE.Mesh(textGeo, thatS3dAxis.textMaterial);
			let textBox = new THREE.Box3().setFromObject(textMesh);
			textMesh.position.set(-(textBox.max.x + textBox.min.x) / 2, -(textBox.max.y + textBox.min.y) / 2, -(textBox.max.z + textBox.min.z) / 2);
        	let textObject3D = new THREE.Object3D();
			let position = null;
			switch(direction){
				case "left": {   
					position = [lineInfo.from.x, lineInfo.from.y, lineInfo.from.z];
					position[0] = position[0] - (textBox.max.y - textBox.min.y);
					break;
				}
				case "right":{  
					position = [lineInfo.to.x, lineInfo.to.y, lineInfo.to.z];
					position[0] = position[0] + (textBox.max.y - textBox.min.y);
					break;
				}
				case "bottom":{
					position = [lineInfo.to.x, lineInfo.to.y, lineInfo.to.z];
					position[2] = position[2] + (textBox.max.y - textBox.min.y);
					break;
				}
				case "top":{
					position = [lineInfo.from.x, lineInfo.from.y, lineInfo.from.z];
					position[2] = position[2] - (textBox.max.y - textBox.min.y);
					break;
				} 
			} 	
        	textObject3D.position.set(position[0], position[1], position[2]);
        	textObject3D.rotation.set(rotation[0], rotation[1], rotation[2]);    
        	textObject3D.isAxis = true;  
        	textObject3D.add(textMesh);        	
        	viewer.scene.add(textObject3D);     
    	}  	 
    }
}
export default S3dAxis