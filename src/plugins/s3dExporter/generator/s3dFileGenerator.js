import {cmnPcr} from "../../../commonjs/common/static.js"
let S3dFileGenerator = function (){

    const thatS3dFileGenerator = this;

    this.manager = null;

    this.init = function (p){
        thatS3dFileGenerator.manager = p.manager;
    }

    this.generate = function (p){
        let s3dObject = thatS3dFileGenerator.manager.s3dObject;
        s3dObject.groups = thatS3dFileGenerator.manager.treeEditor.getResultGroups();
        s3dObject.unitMap = thatS3dFileGenerator.manager.viewer.getResultUnitMap();
        s3dObject.unitTypeMap = thatS3dFileGenerator.manager.viewer.getResultUnitTypeMap();

        //暂不启用
        s3dObject.materialMap = {};

        let s3dText = cmnPcr.jsonToStr(s3dObject);
        thatS3dFileGenerator.save(s3dText, s3dObject.name + ".s3dc");
    }

    this.save = function (text, fileName) {
        let blob = new Blob([text], { type: "text/plain"});
        let link = document.createElement("a");
        link.style.display = "none";
        link.href = window.URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
    }
}
export default S3dFileGenerator