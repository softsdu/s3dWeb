import {MsgBox,ServerAccess,CommonProcessor} from "./common.js"
import  "../../commonjs/jQuery/jquery.min.js"
//字段类型
export const valueType={string:"string", decimal:"decimal", boolean:"boolean", date:"date", time:"time", object:"object"};

//消息对话框
export const msgBox = new MsgBox();

//一般通用处理
export const cmnPcr = new CommonProcessor();

//服务器通讯
export const serverAccess = new ServerAccess();

//处理jquery1.9后不支持$.browser的问题
$.browser={};(function(){$.browser.msie=false; $.browser.version=0;if(navigator.userAgent.match(/MSIE ([0-9]+)./)){ $.browser.msie=true;$.browser.version=RegExp.$1;}})();

//viewer的视角
export const s3dNormalViewport = {init: "init", front: "front", back: "back", top: "top", bottom: "bottom", left: "left", right: "right"};

//viewer的状态
export const s3dViewerStatus = {normalView: "normalView", selectPoints: "selectPoints", specialView: "specialView", disable: "disable", edit: "edit", add: "add", pop: "pop", draw: "draw"};
export const s3dViewerStatusText = {normalView: "常规", selectPoints: "选点", specialView: "特殊", disable: "禁用", edit: "修改", add: "新增", pop: "弹出窗口", draw: "绘制"};

//viewer执行的操作
export const s3dOperateType = {transform: "transform", editTree: "editTree", edit: "edit", add: "add", delete: "delete", splitLocal: "splitLocal", none: "none"};

export const s3dOperateTypeName = {transform: "移动旋转", editTree: "更改结构", edit: "编辑", add: "添加", delete: "删除", splitLocal: "分解", none: "无"};

export const s3dDetailLevel = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
export const s3dViewLevel = {all: "all", always: "always", high: "high", middle: "middle", low: "low"};

//resourceType added by ls 20240112
export const s3dResourceType = {gltf: "gltf", fbx: "fbx"};