import {cmnPcr, s3dViewerStatus} from "../../commonjs/common/static.js"

//S3dRuler 测距
let S3dRuler = function (){
	//当前对象
	const thatS3dRuler = this;

	this.manager = null;
	
	//containerId
	this.containerId = null;  

	this.init = function(p){
		thatS3dRuler.manager = p.manager; 
		thatS3dRuler.containerId = p.containerId;
	}

	this.do = function(){
		thatS3dRuler.beginMeasure();
	}

	this.beginMeasure = function(){
		let locationType = "ruler";
		let statusData = { 
			locationType: locationType
		};
		
		if(thatS3dRuler.manager.viewer.changeStatus({
			status: s3dViewerStatus.selectPoints, 
			statusData: statusData
		})){
			thatS3dRuler.manager.pointSelector.beginPlacePoints({
				locationType: locationType,
				pointCount: 2,
				paramInfo: { 
					afterSelectPoints: thatS3dRuler.afterViewerSelectPoints
				}
			});
		}
	}

	this.afterViewerSelectPoints = function(p){		
		let points = p.points; 
		if(points.length === 2){
			let pointA = points[0];
			let pointB = points[1];
			let distance = Math.sqrt((pointA.x - pointB.x) * (pointA.x - pointB.x) + (pointA.y - pointB.y) * (pointA.y - pointB.y) + (pointA.z - pointB.z) * (pointA.z - pointB.z));
			thatS3dRuler.manager.statusBar.refreshStatusText({
				status: thatS3dRuler.manager.viewer.status,
				message: "测距结果(mm): " + cmnPcr.toFixed(common3DFunction.m2mm(distance), 2)
			});
			thatS3dRuler.manager.viewer.changeStatus({
				status: s3dViewerStatus.normalView
			})
		}
	}	
}
export default S3dRuler