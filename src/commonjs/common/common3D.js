import * as THREE from "three";
window.common3DFunction = {
	//毫米转米
    mm2m: function(mm){
    	return mm / 1000;
    },
	//米转毫米
    m2mm: function(m){
    	return m * 1000;
    },
    //角度转弧度
    degree2radian: function(a){
        return  Math.PI * a / 180;
    },
    //弧度转角度
    radian2degree: function(a){
        return  180 * a / Math.PI;
    },
	//复制object3D
	cloneObject3D: function(object3D){
		var newObject3D = object3D.clone();
		if(newObject3D.children != null){
			for(var i = 0 ; i < newObject3D.children.length; i++){
				var childObj = newObject3D.children[i]; 
				var materials = childObj.material;
				var newMaterials = new Array();
				for(var j = 0; j < materials.length; j++){
					newMaterials.push(materials[j]);
				}
				childObj.material = newMaterials;				
				childObj.geometry = childObj.geometry.clone(); 
			}
		}
		return newObject3D;
	},
	//字符串转rgb added by ls 202201
    stringToRGBArray: function(color){ 
        let r = parseInt(color.substring(0, 2), 16);
        let g = parseInt(color.substring(2, 4), 16);
        let b = parseInt(color.substring(4, 6), 16) 
        return [r,g,b]
    },
	//rgb字符串转数值
    stringToRGBInt: function(color){
        let r = parseInt(color.substring(0, 2), 16);
        let g = parseInt(color.substring(2, 4), 16);
        let b = parseInt(color.substring(4, 6), 16) 
        return r * 256*256 + g * 256 + b;
    },
    //rgb转字符串 added by ls 202201
    rgbToString: function(r,g,b) {
        return "#"+r.toString(16)+g.toString(16)+b.toString(16);
    },
    //夹角 added by ls 20220818
    get2DRotateAngle: function(pointA, pointB){ 
		var angleA = common3DFunction.get2DPointAngle(pointA); 
		var angleB = common3DFunction.get2DPointAngle(pointB);
		return angleB - angleA;
	},
    //向量的倾斜角度 added by ls 20220818
    get2DPointAngle: function(point){ 
		var x = point.x;
		var y = point.y;
		var minDouble = 0.0000001;
		var z = Math.sqrt(Math.pow(x,2) + Math.pow(y,2));
		if(Math.abs(x) < minDouble && Math.abs(y) < minDouble){
			return 0;
		}
		else if(Math.abs(x) < minDouble){
			return y > 0 ? 270 : 90;
		}
		else if(Math.abs(y) < minDouble){
			return x > 0 ? 0 : 180;
		}		
		else{
			var sin = Math.abs(y) / z; 
			var radina = Math.asin(sin);
			var angle = 180 * radina / Math.PI;
	 
	        if(x > 0 && y > 0){
	            return 360 - angle;
	        }
	        else if(x < 0 && y > 0){
	            return 180 + angle;
	        }
	        else if(x < 0 && y < 0){
	            return 180 - angle;
	        }
	        else {
	            return angle;
	        }
		}
	},
	checkSamePoint: function (pointA, pointB, ignoreSize){
		if(ignoreSize == null){
			return pointA.x === pointB.x
				&& pointA.y === pointB.y
				&& pointA.z === pointB.z;
		}
		else{
			return Math.abs(pointA.x - pointB.x) <= ignoreSize
				&& Math.abs(pointA.y - pointB.y) <= ignoreSize
				&& Math.abs(pointA.z - pointB.z) <= ignoreSize;
		}
	}
}

//平移的算法 added by ls 20220818
window.commonShift = {
	//移动2D点
	shiftPoint2D: function(point, shift){
		return {
			x: point.x + shift.x,
			y: point.y + shift.y
		};
	},
	//批量移动2D点
	shiftPoint2Ds: function(points, shift){
		var shiftedPoints = [];
		for(var i = 0; i < points.length; i++){
			shiftedPoints.push(commonShift.shiftPoint2D(points[i], shift));
		}
		return shiftedPoints;
	}
}

//旋转的算法 added by ls 20220818
window.commonRotate = {
	//旋转2D点
    rotatePoint2D: function(point, degress){
		if(point.x === 0 && point.y === 0){
			return {
				x: 0,
				y: 0
			};
		}
		else {
			var v = new THREE.Vector3(point.x, 0, point.y);
			var p = v.applyAxisAngle(new THREE.Vector3(0, 1, 0), degress);
			return {
				x: p.x,
				y: p.z
			};
		}
    },
	//批量旋转2D点
    rotatePoint2Ds: function(points, degress){
		var rotatedPoints = [];
		for(var i = 0; i < points.length; i++){
			rotatedPoints.push(commonRotate.rotatePoint2D(points[i], degress));
		}
		return rotatedPoints;
    }
}

//多边形的算法 added by ls 20220818
window.commonPolygon = {
	//判断2D点是否在多边形内
	insidePolygon2D: function(p, points){ 
		var counter = 0;
		var xinters;
		var p1, p2;
		p1 = points[0];
		var n = points.length;
		for(var i = 1; i <= n; i++){
			p2 = points[i % n];
			if(commonLine.onSegment2D(p1, p2, p)){
				return true;
			}
			if(p.y > cmnPcr.min([p1.y,p2.y])){
				if(p.y <= cmnPcr.max([p1.y,p2.y])){
					if(p.x <= cmnPcr.max([p1.x,p2.x])){
						if(p1.y != p2.y){
							xinters = (p.y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y) + p1.x;
							if(p1.x == p2.x || p.x <= xinters){
								counter++;
							}
						}
					}
				}
			}
			p1 = p2;
		}
		if(counter % 2 == 0){
			return false;
		}
		return true; 
	}
}

//直线的算法 added by ls 20220818
window.commonLine = {
	//判断2D点是否在线段内
	onSegment2D: function(pointA, pointB, point2D) {
		if((point2D.x - pointA.x) * (pointB.y - pointA.y) == (pointB.x - pointA.x) * (point2D.y - pointA.y)
		&& cmnPcr.min([pointA.x, pointB.x]) <= point2D.x
		&& point2D.x <= cmnPcr.max([pointA.x, pointB.x])
		&& cmnPcr.min([pointA.y, pointB.y]) <= point2D.y
		&& point2D.y <= cmnPcr.max([pointA.y, pointB.y])){
			return true;
		}
		else{
			return false;
		}
	}
}