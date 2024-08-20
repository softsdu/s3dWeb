//直线相交
window.common2DLine = {
    //求直线交点
    getLineIntersectPoint: function (p1, p2, p3, p4, ignoreGap) {
        if (ignoreGap == null) {
            ignoreGap = 0.000001;
        }
        let a1 = p1.y - p2.y;
        let b1 = p2.x - p1.x;
        let c1 = a1 * p1.x + b1 * p1.y;

        let a2 = p3.y - p4.y;
        let b2 = p4.x - p3.x;
        let c2 = a2 * p3.x + b2 * p3.y;

        let det_k = a1 * b2 - a2 * b1;

        if (Math.abs(det_k) < ignoreGap) {//设置了精度
            return null;
        }

        let a = b2 / det_k;
        let b = -1 * b1 / det_k;
        let c = -1 * a2 / det_k;
        let d = a1 / det_k;

        let x = a * c1 + b * c2;
        let y = c * c1 + d * c2;

        return {x: x, y: y};
    },
    //求两个线段的交点
    getSegmentIntersectPoint: function (p1, p2, p3, p4, ignoreGap) {
        let point = common2DLine.getLineIntersectPoint(p1, p2, p3, p4, ignoreGap);
        if (point != null) {
            if (!common2DLine.checkInSegment(point, p3, p4)) {
                point = null;
            }
        }
        return point;
    },
    //求线段长度
    getLength: function (pointA, pointB) {
        let segLen = Math.sqrt((pointA.x - pointB.x) * (pointA.x - pointB.x) + (pointA.y - pointB.y) * (pointA.y - pointB.y));
        return segLen;
    },
    //判断点是在线段两侧，还是线段内
    checkInSegment: function (point, pointA, pointB) {
        let segLen = common2DLine.getLength(pointA, pointB);
        let toALen = common2DLine.getLength(pointA, point);
        let toBLen = common2DLine.getLength(point, pointB);
        return toALen <= segLen && toBLen <= segLen;
    },

    //计算向量的夹角
    getAngle: function (v1, v2) {
        // 计算两个向量与x轴正方向的夹角（使用反正切函数atan2，结果在-pi到pi之间）
        let angle1 = Math.atan2(v1.y, v1.x);
        let angle2 = Math.atan2(v2.y, v2.x);

        // 计算角度差，结果在-pi到pi之间，通过加2pi确保结果为0到2pi之间
        return (angle2 - angle1 + 2 * Math.PI) % (2 * Math.PI);
    },


    //镜像点
    mirrorPointAcrossLine: function (pointA, pointB, pointC) {
        // 计算直线BC的方向向量
        let dX = pointC.x - pointB.x;
        let dY = pointC.y - pointB.y;

        if (dX === 0 && dY === 0) {
            return {
                x: pointB.x + pointB.x - pointA.x,
                y: pointB.y + pointB.y - pointA.y
            };
        } else {
            // 计算点A到直线BC上点B的向量
            let aX = pointA.x - pointB.x;
            let aY = pointA.y - pointB.y;

            // 计算点A到直线BC的垂线段长度（两次点乘除以方向向量的模长平方）
            let numerator = (dX * aX + dY * aY);
            let denominator = dX * dX + dY * dY;
            let t = numerator / denominator;

            // 计算直线BC上，从点B到点A投影的点D的坐标
            let pointD = {
                x: pointB.x + t * dX, y: pointB.y + t * dY
            };

            // 从D点到A点的向量，然后反向延长得到A到A'的向量，最终计算A'
            let aToDx = pointD.x - pointA.x;
            let aToDy = pointD.y - pointA.y;
            return {
                x: pointD.x + aToDx,
                y: pointD.y + aToDy
            };
        }
    },
    findPointsAtDistance: function (pointA, pointC, distance) {
        // 计算直线AC的斜率，考虑垂直线的情况
        let slope;
        if (pointA.x !== pointC.x) {
            slope = (pointC.y - pointA.y) / (pointC.x - pointA.x);
        } else {
            // 如果AC是垂直线，则垂直方向为水平方向，斜率设为特定值以简化后续计算
            slope = Infinity;
        }

        // 计算垂直方向的单位向量
        let perpendicularSlope;
        if (slope === Infinity || slope === -Infinity) {
            // AC是垂直线
            return [{
                x: pointA.x + distance,
                y: pointA.y
            }, {
                x: pointA.x - distance,
                y: pointA.y
            }];
        } else if (slope === 0) {
            // AC是水平线
            return [{
                x: pointA.x,
                y: pointA.y - distance
            }, {
                x: pointA.x,
                y: pointA.y + distance
            }];
        } else {
            // 一般情况，垂直线斜率乘以-1即得垂直方向斜率
            perpendicularSlope = -1 / slope;
            // 计算垂直距离x在垂直方向上的向量长度
            // 注意：这里的x应理解为在垂直方向上的绝对距离，不区分左右或上下，因此直接使用x
            let perpendicularVectorLength = distance / Math.sqrt(1 + perpendicularSlope ** 2);

            // 一般情况
            return [{
                x: pointA.x + perpendicularVectorLength,
                y: pointA.y + perpendicularVectorLength * perpendicularSlope
            }, {
                x: pointA.x - perpendicularVectorLength,
                y: pointA.y - perpendicularVectorLength * perpendicularSlope
            }];
        }
    },

    //A和B点确定的线上有一个点point，线的右侧距离此点distance距离的点
    getRightPoint: function (pointA, pointB, point, distance) {
        if (pointB.x === pointA.x && pointB.y === pointA.y) {
            return null;
        } else if (pointB.x === pointA.x) {//垂直于X轴
            if (pointB.y > pointA.y) {
                return {
                    x: point.x + distance,
                    y: point.y
                };
            } else {
                return {
                    x: point.x - distance,
                    y: point.y
                };
            }
        } else if (pointB.y === pointA.y) {//垂直于Y轴
            if (pointB.x > pointA.x) {
                return {
                    x: point.x,
                    y: point.y - distance
                };
            } else {
                return {
                    x: point.x,
                    y: point.y + distance
                };
            }
        } else {
            //point需要是A和B之间的点
            let length = Math.sqrt((pointB.x - pointA.x) * (pointB.x - pointA.x) + (pointB.y - pointA.y) * (pointB.y - pointA.y));
            let linePointX = (pointB.x - pointA.x) * distance / length + pointA.x;
            let linePointY = (pointB.y - pointA.y) * distance / length + pointA.y;

            let relativeY = -linePointX + pointA.x;
            let relativeX = linePointY - pointA.y;
            return {
                x: relativeX + point.x,
                y: relativeY + point.y
            };
        }
    },
    //计算获得右侧平行线的点
    getRightLine: function(pointA, pointB, distance) {
        let newPointA = common2DLine.getRightPoint(pointA, pointB, pointA, distance);
        let newPointB = common2DLine.getRightPoint(pointA, pointB, pointB, distance);
        return [newPointA, newPointB];
    },

    //判断平行
    checkParallel: function(p1, p2, p3, p4, ignoreSize){
        ignoreSize = ignoreSize == null ? 0.00001 : ignoreSize;
        if(p2.x === p1.x || p4.x === p3.x){
            if(p2.x === p1.x && p4.x === p3.x){
                return true;
            }
            else{
                return false;
            }
        }
        else{
            let g1 = common2DLine.getGradient2D(p1, p2);
            let g2 = common2DLine.getGradient2D(p3, p4);
            return Math.abs(g2 - g1) <= ignoreSize;
        }
    },

    //计算斜率
    getGradient2D: function (p1, p2){
        if(p2.x === p1.x){
            return 0;
        }
        else {
            return (p2.y - p1.y) / (p2.x - p1.x);
        }
    },


    //计算直线上距离第一个点一定距离的点坐标
    getPointInLine: function (point, pointSub, distance){
        let len = common2DLine.getLength(point, pointSub);
        if(len === 0){
            return null;
        }
        else {
            let x = (pointSub.x - point.x) * distance / len + point.x;
            let y = (pointSub.y - point.y) * distance / len + point.y;
            return {
                x: x,
                y: y
            };
        }
    },

    //判断是否为同一个点
    checkSamePoint: function (pointA, pointB, ignoreSize){
        if(ignoreSize == null){
            return pointA.x === pointB.x
                && pointA.y === pointB.y;
        }
        else{
            return Math.abs(pointA.x - pointB.x) <= ignoreSize
                && Math.abs(pointA.y - pointB.y) <= ignoreSize;
        }
    },

    //判断点在线的哪一侧
    getDirectionByLine: function(point, pointA, pointB){
        //key > 0 在左侧,key = 0 在线上,key < 0 在右侧
        let key = (pointA.y - pointB.y) * point.x + (pointB.x - pointA.x) * point.y + pointA.x * pointB.y - pointB.x * pointA.y;
        return key > 0;
    }
}
