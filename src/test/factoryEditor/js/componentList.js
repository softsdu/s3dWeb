export const componentList = [{
	code: "01",
	name: "本地模型",
	children: [{
		code: "0101",
		name: "汽车",
		components: [{
			code: "0101-1001",
			name: "奔驰GLS580",
			versionNum: "1.0",
			isLocal: true,
			fileInfo: {
				type: "fbx",
				directory: "奔驰GLS580",
				fileName: "Benz_GLS_580.fbx",
				imgName: "Benz_GLS_580.jpg"
			},
			scale:{
				x: 0.01,
				y: 0.01,
				z: 0.01
			}
		}]
	}, {
		code: "0201",
		name: "建筑",
		components: [{
			code: "0201-1001",
			name: "厂区01",
			versionNum: "1.0",
			isLocal: true,
			fileInfo: {
				type: "fbx",
				directory: "厂区01",
				fileName: "厂区.fbx",
				imgName: "factory01.png",
			},
			scale:{
				x: 1,
				y: 1,
				z: 1
			}
		}]
	}]
}];