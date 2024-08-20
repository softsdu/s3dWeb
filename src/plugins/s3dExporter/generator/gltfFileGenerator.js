import {GLTFExporter} from "gltfExporter";

let GltfFileGenerator = function (){

    const thatGltfFileGenerator = this;

    this.manager = null;

    this.init = function (p){
        thatGltfFileGenerator.manager = p.manager;
    }

    this.generate = function (p){
        let viewer = thatGltfFileGenerator.manager.viewer;
        let allObject3Ds = [];
        for(let id in viewer.allObject3DMap){
            let object3D = viewer.allObject3DMap[id];
            allObject3Ds.push(object3D);
        }

        let exporter = new GLTFExporter();
        exporter.parse(allObject3Ds, async function (result) {
            let text = JSON.stringify(result);
            thatGltfFileGenerator.save(text, thatGltfFileGenerator.manager.s3dObject.name + ".gltf");
        });
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
export default GltfFileGenerator