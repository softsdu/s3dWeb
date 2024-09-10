import JS3BaseMaterials from "./js3BaseMaterials.js";
import * as THREE from "three";
let JS3LocalMaterials = function(){
    const thatLocalMaterials = this;

    this.manager = null;

    this.infoMap = {};

    this.materialMap = {};

    this.baseMaterials;

    this.init = function(p){
        thatLocalMaterials.manager = p.manager;
        thatLocalMaterials.initBaseMaterials();
        thatLocalMaterials.initUserMaterialInfos();
        thatLocalMaterials.initLocalMaterialInfos();
    }

    this.initBaseMaterials = function (){
        thatLocalMaterials.baseMaterials = new JS3BaseMaterials();
        thatLocalMaterials.baseMaterials.init({
            manager: thatLocalMaterials.manager
        });
    }

    this.setMaterial = function(materialName, material){
        thatLocalMaterials.materialMap[materialName] = material;
    }

    this.getMaterial = function(materialName){
        let material = thatLocalMaterials.materialMap[materialName];
        if(material == null){
            let materialInfo = thatLocalMaterials.getMaterialInfo(materialName);
            material = thatLocalMaterials.createUserMaterial(materialName);
            if(material == null) {
                let materialCreate = thatLocalMaterials.manager.materials.baseMaterials.creators[materialInfo.typeCode];
                if (materialCreate != null) {
                    material = materialCreate(materialInfo);
                } else {
                    material = thatLocalMaterials.manager.materials.baseMaterials.defaultCreator(materialInfo);
                }
            }
            thatLocalMaterials.manager.materials.setMaterial(materialName, material);
        }
        return material;
    }

    this.getMaterialInfo = function(materialName){
        let materialInfo = thatLocalMaterials.infoMap[materialName];
        if(materialInfo == null){
            return null;
        }
        else{
            return materialInfo;
        }
    }

    this.load = function(materialName,
                         color,
                         imageAccessoryId,
                         imageName,
                         normalImageAccessoryId,
                         normalImageName,
                         opacity,
                         opacityImageAccessoryId,
                         opacityImageName,
                         metalness,
                         metalnessImageAccessoryId,
                         metalnessImageName,
                         roughness,
                         roughnessImageAccessoryId,
                         roughnessImageName,
                         envMapIntensity,
                         scaleWidth,
                         scaleHeight,
                         rotation,
                         isMirror,
                         typeCode){
        thatLocalMaterials.infoMap[materialName] = {
            name: materialName,
            color: color,
            imageAccessoryId: imageAccessoryId,
            imageName: imageName,
            normalImageAccessoryId: normalImageAccessoryId,
            normalImageName: normalImageName,
            opacity: opacity,
            opacityImageAccessoryId: opacityImageAccessoryId,
            opacityImageName: opacityImageName,
            metalness: metalness,
            metalnessImageAccessoryId: metalnessImageAccessoryId,
            metalnessImageName: metalnessImageName,
            roughness: roughness,
            roughnessImageAccessoryId: roughnessImageAccessoryId,
            roughnessImageName: roughnessImageName,
            envMapIntensity: envMapIntensity,
            scaleWidth: scaleWidth,
            scaleHeight: scaleHeight,
            rotation: rotation,
            isMirror: isMirror,
            typeCode: typeCode,
            isServer: false,
        };
    }

    this.initLocalMaterialInfos = function (){
        thatLocalMaterials.load("绿色粗糙漆面", null, "e25aacdb-3b7d-4530-81b9-141f78952aeb", "绿色粗糙漆面", "cbf8e1ae-a390-4cfc-9ec7-6c51c10a1661", "绿色粗糙漆面_normal", null, "", "", null, "df8118a1-f073-4283-83f5-30df5e154523", "绿色粗糙漆面_metalness", null, "e0f19008-1086-4356-a6d1-88039d5924f5", "绿色粗糙漆面_roughness", 0.1, 1.0, 1.0, null, false, "PaintFrosted");
        thatLocalMaterials.load("木地板（哑光）", null, "c140731e-b491-47b7-b185-824d823cf0d3", "木地板（哑光）", "18cfe349-5cbb-4b4b-be40-531ba153a2ab", "木地板（哑光）_normal", null, "", "", null, "", "", 0.5, "56b7baef-7202-48f3-ace9-435159298a07", "木地板（哑光）_roughness", 0.0, null, null, null, false, "WoodFrosted");
        thatLocalMaterials.load("水晶1", null, "fb6d341e-41da-4892-9d98-6206d0d99e26", "水晶1", "3d69e235-190f-4c13-a5f2-f1bf26374851", "水晶1_normal", null, "", "", 0.1, "", "", 0.1, "", "", 0.0, 1.0, 1.0, null, false, "Stone");
        thatLocalMaterials.load("自发光（绿色）", 0x00FF00, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "SelfLuminous");
        thatLocalMaterials.load("不锈钢（哑光）", 0xC0C0C4, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "MetalFrosted");
        thatLocalMaterials.load("沙土地1", null, "5430b7d6-8076-4fc4-b117-fd5af1757b5e", "沙土地1", "e2e810bf-e5dc-40ef-bd1c-7ea522e95808", "沙土地1_normal", null, "", "", null, "", "", null, "ba71a7cb-3604-4a2f-acc2-65463cf341e2", "沙土地1_roughness", 0.0, 1.0, 1.0, null, false, "GroundLand");
        thatLocalMaterials.load("蓝色透明", 0x00fff9, "", "", "", "", 0.3, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("砖红金属色", 0xC41327, "", "", "", "", null, "", "", 0.5, "", "", null, "", "", 0.5, null, null, null, false, "");
        thatLocalMaterials.load("泥土地1", null, "48f2a862-3152-41ea-8f91-6efc462e5d2f", "泥土地1", "29af7b98-28f4-4bb3-9dbe-d9afea546651", "泥土地1_normal", null, "", "", null, "", "", null, "b6340a68-ea8b-4487-80ea-ed114904eb20", "泥土地1_roughness", 0.0, null, null, null, false, "GroundLand");
        thatLocalMaterials.load("深灰色混凝土", 0xa, "c1da1d70-a0ae-492b-b919-943bde6903c3", "深灰色混凝土", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("黑色金属", 0x3a3333, "", "", "", "", null, "", "", 0.9, "", "", null, "", "", 0.5, null, null, null, false, "");
        thatLocalMaterials.load("银板", null, "2ca99998-2947-4e24-832f-fae43104c24b", "银板", "fca02a9d-bc7c-4d5b-90f4-6872126ee1dc", "银板_normal", null, "", "", null, "07d84fb4-fc0b-489b-9125-ea52b3156f65", "银板_metalness", null, "06f4b372-cfe7-4f45-874a-c294552d47a9", "银板_roughness", 0.3, 1.0, 1.0, 90.0, false, "MetalPolished");
        thatLocalMaterials.load("木纹6", null, "b4b77c69-82a5-4698-8b6b-19257126f86a", "木纹6", "ef75355c-583b-4d86-a5d8-d0e6e901a939", "木纹6_normal", null, "", "", null, "", "", null, "4f82d9ed-b921-4eda-8208-f6acc06ec0c7", "木纹6_roughness", 0.0, 1.0, 1.0, null, false, "WoodPolished");
        thatLocalMaterials.load("雪地", null, "db85196b-f42a-4f3d-8303-d3c33197f14b", "雪地", "1944f3e8-5a41-4a31-bf19-9a536afb9a29", "雪地_normal", null, "", "", null, "", "", null, "aef08ecf-5d0f-4625-8b68-fffb605cb41c", "雪地_roughness", 0.0, null, null, null, false, "Snow");
        thatLocalMaterials.load("花岗岩1", null, "f7348efd-96b7-44ce-95bc-3053f6ff74ba", "花岗岩1", "a376c6d6-a6bb-4f19-9681-c1ef8dd23f2a", "花岗岩1_normal", null, "", "", null, "", "", null, "b02034e4-85f9-4cca-9322-18249766ac13", "花岗岩1_roughness", 0.0, 1.0, 1.0, null, false, "Stone");
        thatLocalMaterials.load("玛瑙1", null, "a9944705-194b-40ae-a643-6325600d96ed", "玛瑙1", "1ee96211-c3bf-4fd9-aca0-3aa802afc6c0", "玛瑙1_normal", null, "", "", null, "", "", null, "1213a1f2-d248-41aa-bd79-87186f87fcb6", "玛瑙1_roughness", 0.0, 1.0, 1.0, null, false, "Stone");
        thatLocalMaterials.load("大理石1", null, "65a70082-6030-4fa2-b503-2ac1adcca705", "大理石1", "2dfa42b7-0146-4e46-b3f3-0a9975f82a17", "大理石1_normal", null, "", "", null, "", "", null, "b6ce310d-a2e6-4d26-b56a-08debbc5f79d", "大理石1_roughness", 0.2, 1.0, 1.0, null, false, "MarblePolished");
        thatLocalMaterials.load("黄水晶1", 0xFFFF00, "f38a8c3c-ceb2-4b6c-8854-8cfd938b37df", "黄水晶1", "94a03f1a-f1f9-454d-a49a-5788151d08f6", "黄水晶1_normal", null, "", "", 0.1, "", "", 0.1, "", "", 0.0, 1.0, 1.0, null, false, "Stone");
        thatLocalMaterials.load("金属网", null, "a7e47fcd-518c-4242-bf5e-d58e4c98d774", "金属网", "d8c6477f-ac3b-4c42-a50a-0e727c4ccbf8", "金属网_normal", null, "d33d4c3c-c6b0-411f-b981-ff403c65a98c", "金属网_opacity", 0.005, "cff49461-341e-43e9-af25-a9c706104803", "金属网_metalness", null, "523f2332-1a5c-4168-83d9-1665d821eb99", "金属网_roughness", 0.0, 1.0, 1.0, null, false, "MetalFrosted");
        thatLocalMaterials.load("石板地面", null, "2a24673f-fc15-43a5-a966-099d68f4d8e2", "石板地面", "25e850ed-29b6-465a-a45e-adcf6da80c6f", "石板地面_normal", null, "", "", null, "", "", null, "0f072f24-847a-4888-828c-ab67fd40b40b", "石板地面_roughness", 0.0, 1.0, 1.0, null, false, "GroundLand");
        thatLocalMaterials.load("沙地1", null, "684016c4-9a3c-457d-805a-e35334269a9b", "沙地1", "7250d236-9fb0-48f4-a488-5ce5df8ef415", "沙地1_normal", null, "", "", null, "", "", null, "8506fd99-0960-4100-b01d-265f3654d63e", "沙地1_roughness", 0.0, 1.0, 1.0, null, false, "Sand");
        thatLocalMaterials.load("纱帘1", null, "e66a20cb-7c50-4e0f-913a-bdc8f86b7f85", "纱帘1", "b97bbbe2-c2f5-4fba-8186-e6f58362f8ef", "纱帘1_normal", null, "7a88f5f5-bb23-48d9-8028-fe603a900d0f", "纱帘1_opacity", null, "", "", null, "3808f2ba-b1de-48ed-bfd1-e91c54201283", "纱帘1_roughness", 0.0, null, null, null, false, "Fabric");
        thatLocalMaterials.load("黑色", 0x000000, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("草坪3", null, "45027c89-9652-4e88-9401-baf6fed11086", "草坪3", "de2cfb37-7359-4e81-b5d0-d7c4762b7abb", "草坪3_normal", null, "", "", null, "", "", null, "6b2127b7-e89e-47d9-9699-9ca714844880", "草坪3_roughness", 0.0, 1.0, 1.0, null, false, "Lawn");
        thatLocalMaterials.load("坡道", 0xa, "62511f9a-217a-4eea-944a-04d02acda8a0", "坡道", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("木纹3", null, "de82f151-678d-4b25-9de5-dcc451b8da5b", "木纹3", "a67ae48f-5949-44c1-824b-591b8e36cdf5", "木纹3_normal", null, "", "", null, "", "", null, "711b90e2-6528-4949-b62c-66a83f536297", "木纹3_roughness", 0.0, 1.0, 1.0, null, false, "WoodPolished");
        thatLocalMaterials.load("深绿色", 0x009B12, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("砖红色混凝土", 0xffffff, "86fff252-7062-4d7b-bdec-2408c3cdcad0", "砖红色混凝土", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("原木", null, "76d53a02-b5c2-4d8d-8b9e-8926066e37f6", "原木", "8fabac34-5b51-46db-8a5b-9db765623380", "原木_normal", null, "", "", null, "", "", null, "7f5129cd-6fdd-44c6-8228-f1defcd14db1", "原木_roughness", 0.0, null, null, null, false, "WoodNatural");
        thatLocalMaterials.load("铜板（生锈）", 0xB87333, "c335f887-5d7d-45e8-b5ca-8f5a4fa3ed63", "铜板（生锈）", "", "", null, "", "", null, "", "", null, "93b7197f-c11c-4e94-a11b-199a1944c526", "铜板（生锈）_roughness", 0.0, 10.0, 10.0, null, false, "MetalRusted");
        thatLocalMaterials.load("橙子皮", null, "5d8b5632-06b7-4c61-9bcf-855e1dcc3335", "橙子皮", "b9526bc6-1929-4cba-bc8d-f0bf8dc93b9f", "橙子皮_normal", null, "0cb85f96-92fe-432f-abf0-0ceff8af04b5", "橙子皮_opacity", null, "", "", null, "15d3979e-f266-43e3-a8e4-c61e6035075e", "橙子皮_roughness", 0.0, 5.0, 5.0, null, false, "FruitSkin");
        thatLocalMaterials.load("大理石灰", 0xa, "0743342b-a922-42b2-bd2b-450fb44be428", "大理石灰", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("树皮1", null, "34208f8b-fbd4-46e9-849e-8074c972ea83", "树皮1", "0b7352fa-d186-4e99-bd4e-046231d0f66a", "树皮1_normal", null, "", "", null, "", "", null, "8926982e-1fc1-4763-b2d9-c107eea326bc", "树皮1_roughness", 0.0, 1.0, 1.0, null, false, "WoodNatural");
        thatLocalMaterials.load("草坪1", null, "69524fd8-e55d-4b4b-931b-54f720cf0700", "草坪1", "651ffaee-6b44-41db-bdc2-2ef9e6849249", "草坪1_normal", null, "", "", null, "", "", null, "074ca205-c1ae-499b-8d55-ecaa2586f2ba", "草坪1_roughness", 0.0, 1.0, 1.0, null, false, "Lawn");
        thatLocalMaterials.load("复合木地板（红木纹_亮光）", null, "55db5cc4-95ac-441e-bd9f-d9eca8934686", "复合木地板（红木纹_亮光）", "814d290b-5880-4b58-a5f1-94fe5316e150", "复合木地板（红木纹_亮光）_normal", null, "", "", null, "", "", null, "61ff0274-e2c3-4e54-bb48-7e37933ab3a3", "复合木地板（红木纹_亮光）_roughness", 0.2, 10, 10, null, false, "WoodPolished");
        thatLocalMaterials.load("自发光（黄色）", 0xFFD800, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "SelfLuminous");
        thatLocalMaterials.load("木纹4", null, "e41ceb96-c674-4123-840a-2d9612289bdc", "木纹4", "e3665a42-976c-4222-9ee9-306918b145bc", "木纹4_normal", null, "", "", null, "", "", null, "c90b7bc8-21b4-4bf9-af8e-aa5cc475e980", "木纹4_roughness", 0.1, 10, 10, null, false, "WoodPolished");
        thatLocalMaterials.load("白色", 0xffffff, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("混凝土", 0xf , "70920f7d-0d66-4a0c-bb87-fdcfc4f170a6", "混凝土", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("红色亮光漆面", 0xFF0000, "", "", "", "", null, "", "", 0.2, "", "", 0.2, "", "", 0.5, null, null, null, false, "PaintPolished");
        thatLocalMaterials.load("灰色玻璃", 0x888888, "", "", "", "", 0.2, "", "", null, "", "", 0.0, "", "", 0.0, null, null, null, false, "GlassClearly");
        thatLocalMaterials.load("石子地面", null, "97e41e43-5143-43b2-98a0-4e3e7a225eed", "石子地面", "e7002ee2-c905-4b38-a624-31406671fd6d", "石子地面_normal", null, "", "", null, "", "", null, "0b975714-97ea-40f7-ab1c-1efa190ffdb7", "石子地面_roughness", 0.0, 1.0, 1.0, null, false, "GroundLand");
        thatLocalMaterials.load("石头墙", null, "991da457-a5e3-44ea-a14c-b6a0e6e0f900", "石头墙", "a406b21a-955d-4d62-9a25-f70c147a8996", "石头墙_normal", null, "", "", null, "", "", null, "91953f37-4e01-434d-9528-d1ec95b09f62", "石头墙_roughness", 0.0, null, null, 0.0, false, "Stone");
        thatLocalMaterials.load("布纹1", null, "79307a2a-6314-40da-8af5-59c2e396b6ff", "布纹1", "800af32c-2359-4997-aff6-9f92d8deb118", "布纹1_normal", null, "", "", null, "", "", null, "bca4944a-6519-4216-94e1-c4446875faef", "布纹1_roughness", 0.0, 1.0, 1.0, null, false, "Fabric");
        thatLocalMaterials.load("灰色透明", 0x585858, "", "", "", "", 0.01, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("铜板（哑光）", 0xB87333, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "MetalFrosted");
        thatLocalMaterials.load("木材（红_哑光）", null, "2d8f86c9-eb7e-4007-beb6-e00fa7398d4e", "木材（红_哑光）", "042234dd-e9ab-47b9-ab9e-131098e0889b", "木材（红_哑光）_normal", null, "", "", null, "", "", null, "eed6d45a-aa14-4feb-b6f0-129d818a615b", "木材（红_哑光）_roughness", 0.0, null, null, null, false, "WoodFrosted");
        thatLocalMaterials.load("陶器", null, "af79cc31-e6b3-4f94-a41c-09c56a45df45", "陶器", "8f7905b7-1b6c-4259-83c4-8119b7719524", "陶器_normal", null, "", "", null, "", "", null, "85321e62-2cc5-4b2a-aab3-5dc3c8a59830", "陶器_roughness", 0.0, 2.0, 2.0, null, false, "Clay");
        thatLocalMaterials.load("自发光（红色）", 0xFF0000, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "SelfLuminous");
        thatLocalMaterials.load("蓝色亮光漆面", 0x0000FF, "", "", "", "", null, "", "", 0.2, "", "", 0.2, "", "", 0.5, null, null, null, false, "PaintPolished");
        thatLocalMaterials.load("磨砂玻璃", null, "13b25702-5a2b-4cd4-a8d3-ea6b273062ec", "磨砂玻璃", "7e19b452-2b8d-4a70-aba4-3129bf2380da", "磨砂玻璃_normal", null, "", "", null, "", "", null, "bb6dad47-bbe4-498a-a70e-988560e7707a", "磨砂玻璃_roughness", 0.0, null, null, null, false, "GlassFrosted");
        thatLocalMaterials.load("黄金", null, "96d54c68-402e-4a7b-996a-7aea0ced6ad9", "黄金", "2f096aea-461e-48f8-b432-439d3ddff1f3", "黄金_normal", null, "", "", null, "0181b0c3-ed39-40cc-9187-829df73fb397", "黄金_metalness", null, "529e0623-889c-4212-b20c-ecadb5bef0e0", "黄金_roughness", 0.3, 1.0, 1.0, null, false, "MetalFrosted");
        thatLocalMaterials.load("黑色亮光漆面", 0x111111, "", "", "", "", null, "", "", 0.2, "", "", 0.2, "", "", 0.5, null, null, null, false, "PaintPolished");
        thatLocalMaterials.load("网纹皮革", null, "6d642783-ecb9-44eb-8846-f9a68dfb6fd6", "网纹皮革", "6ea8dd80-626b-49bf-a49b-ddd332f2ad80", "网纹皮革_normal", null, "", "", null, "", "", null, "07936a1a-7ef9-4972-9ccb-f1dadb1dfb5a", "网纹皮革_roughness", 0.05, 1.0, 1.0, null, false, "Leather");
        thatLocalMaterials.load("瓷砖3", null, "0eb60f38-20e3-4e3f-9b41-03731cff9b41", "瓷砖3", "edf67f40-3d84-40a2-9734-d274de8db3c7", "瓷砖3_normal", null, "27611cd3-25b6-4a74-b8f4-2ee2245c84ce", "瓷砖3_opacity", null, "", "", null, "8ce6f900-81d5-4434-93a4-8b709551d224", "瓷砖3_roughness", 0.2, 1.0, 1.0, null, false, "CeramicFrosted");
        thatLocalMaterials.load("水晶2", null, "f93ea4fc-ae35-4f2f-bcbf-60bf73a09d59", "水晶2", "92d82db0-274c-4c84-a61d-71e36207f36c", "水晶2_normal", null, "", "", null, "", "", null, "7acfbf69-77c9-40d4-8ff5-237f6bcc3b5b", "水晶2_roughness", 0.0, 1.0, 1.0, null, false, "Stone");
        thatLocalMaterials.load("黄色", 0xf1e29b, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("木纹2", null, "e12d0fa0-f683-4b89-86ea-4e0fe996d714", "木纹2", "3d5b873a-3693-4d71-9579-bed1476251c6", "木纹2_normal", null, "", "", null, "", "", null, "9799287c-40d3-426c-85f7-baec52333baa", "木纹2_roughness", 0.0, 1.0, 1.0, null, false, "WoodPolished");
        thatLocalMaterials.load("橡胶1", null, "fd7a8546-77cc-40d8-9597-01ed40c0880f", "橡胶1", "b0821e30-ffe1-4840-8c09-007c2684e572", "橡胶1_normal", null, "", "", null, "", "", null, "7087d556-129b-4c84-b028-3ad1dda72756", "橡胶1_roughness", 0.0, 1.0, 1.0, null, false, "Rubber");
        thatLocalMaterials.load("冰面1", null, "44b3412e-97ef-479e-920a-ff26a3086d50", "冰面1", "d45a1962-c11b-4d84-a006-eaa5942c5443", "冰面1_normal", 0.9, "", "", 0.8, "", "", 0.4, "", "", 0.0, 1.0, 1.0, null, false, "Ice");
        thatLocalMaterials.load("石英石2", null, "3c6e74f7-9500-4d6b-b459-999103ae63c3", "石英石2", "5a5e3213-4f58-46be-afae-b2d80e1a9a2b", "石英石2_normal", null, "", "", null, "", "", null, "b41d8329-0129-40ee-ae7c-d95814fd0e36", "石英石2_roughness", 0.0, 1.0, 1.0, null, false, "Stone");
        thatLocalMaterials.load("竖木纹", 0xa, "873681b0-eaed-4e64-b47c-01e1417751c9", "竖木纹", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("钢板", null, "1dcc7c61-71e5-4e26-94c0-a14a345a2081", "钢板", "41c494bf-540b-4737-91ab-908dfe5dd4b7", "钢板_normal", null, "", "", null, "046efd9e-fe1f-4e1c-99da-f17b9fe00c13", "钢板_metalness", null, "3500c9a6-d8a1-4e19-b7e0-045b6db3224b", "钢板_roughness", 0.3, 1.0, 1.0, null, false, "MetalPolished");
        thatLocalMaterials.load("橙色", 0xdcc434, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("木地板（亮光）", null, "c140731e-b491-47b7-b185-824d823cf0d3", "木地板（亮光）", "18cfe349-5cbb-4b4b-be40-531ba153a2ab", "木地板（亮光）_normal", null, "", "", null, "", "", null, "56b7baef-7202-48f3-ace9-435159298a07", "木地板（亮光）_roughness", 0.2, null, null, null, false, "WoodPolished");
        thatLocalMaterials.load("路面", 0x666666, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("银色金属", 0xfcf7f7, "", "", "", "", null, "", "", 0.5, "", "", null, "", "", 0.5, null, null, null, false, "");
        thatLocalMaterials.load("瓷砖1", null, "b2258cb0-d143-4e64-9289-b4e45e44a81d", "瓷砖1", "f3b42141-81be-4ebd-ab2b-4f33d730eb0a", "瓷砖1_normal", null, "", "", null, "", "", null, "b78a87bb-4979-42e2-ab7f-376323662280", "瓷砖1_roughness", 0.2, null, null, null, false, "CeramicPolished");
        thatLocalMaterials.load("地板", 0xa, "a98d2960-ba71-4753-8508-ef5b1c35ac04", "地板", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("马赛克玻璃", null, "bbb61867-0eaf-4707-88e3-d55c244dab7d", "马赛克玻璃", "9977e89f-281e-4cfc-8119-c7c2568f9124", "马赛克玻璃_normal", null, "", "", null, "", "", null, "0314c842-9faf-42f3-9aa8-3292ebe5c750", "马赛克玻璃_roughness", 0.0, 2.0, 2.0, null, false, "GlassClearly");
        thatLocalMaterials.load("生锈钢板2", null, "b0c8d327-f48f-4ee9-85f3-b562f2b0a5a7", "生锈钢板2", "7282b888-635c-47ca-934a-21007ec8b51a", "生锈钢板2_normal", null, "", "", null, "481385ef-964f-49ad-ac0f-37defd92c151", "生锈钢板2_metalness", null, "b0b1e0e6-5dd1-4d87-b9b1-8c5b9e67ac48", "生锈钢板2_roughness", 0.0, 1.0, 1.0, null, false, "MetalRusted");
        thatLocalMaterials.load("钢板3", null, "0d57e562-bf92-42c4-be98-5f8d2127a4d4", "钢板3", "cddab3b4-adfc-4cb3-b939-175317233c3d", "钢板3_normal", null, "", "", null, "f85cec0c-6bfc-40a8-b158-400e36811da6", "钢板3_metalness", null, "ecc6a6a0-ce71-499c-ad4a-fcca4ec999d9", "钢板3_roughness", 0.3, 1.0, 1.0, null, false, "MetalPolished");
        thatLocalMaterials.load("金属", 0x969494, "", "", "", "", null, "", "", 0.3, "", "", null, "", "", 0.3, null, null, null, false, "MetalPolished");
        thatLocalMaterials.load("黑水晶1", 0x000000, "f38a8c3c-ceb2-4b6c-8854-8cfd938b37df", "黑水晶1", "94a03f1a-f1f9-454d-a49a-5788151d08f6", "黑水晶1_normal", null, "", "", 0.1, "", "", 0.1, "", "", 0.0, 1.0, 1.0, null, false, "Stone");
        thatLocalMaterials.load("黄色亮光漆面", 0xFFFF00, "", "", "", "", null, "", "", 0.2, "", "", 0.2, "", "", 0.5, null, null, null, false, "PaintPolished");
        thatLocalMaterials.load("木纹8", null, "9725e072-7427-498d-8458-18244e9492d1", "木纹8", "ec781b5d-e337-4fbd-afb7-ebac627acce8", "木纹8_normal", null, "", "", null, "", "", null, "b3a4708c-eb3e-4d9e-a2df-1a77150ef64f", "木纹8_roughness", 0.0, 1.0, 1.0, null, false, "WoodPolished");
        thatLocalMaterials.load("木纹9", null, "dee5a230-e787-4a9f-84a6-4cfa6299c497", "木纹9", "ca0e4c91-4085-4091-9b0d-5ec55a954354", "木纹9_normal", null, "", "", null, "", "", null, "9cb7aa64-e868-4c20-a100-c0d527f55ba3", "木纹9_roughness", 0.0, 1.0, 1.0, null, false, "WoodFrosted");
        thatLocalMaterials.load("混凝土表面", 0xaaaaaa, "c04910a4-1ac3-4a7d-8198-b42566df8b2a", "混凝土表面", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("五彩玻璃", null, "a1969289-04d3-4f3c-8e8a-0ddfdcf831ea", "五彩玻璃", "17076b55-865b-4b4e-b8b1-0c3e32c0db94", "五彩玻璃_normal", null, "", "", null, "ff6ff8fd-1843-4271-8347-e43989331e26", "五彩玻璃_metalness", null, "c59a5caa-5b2a-4ea4-a945-03b2b636cae8", "五彩玻璃_roughness", 0.0, 1.0, 1.0, null, false, "GlassClearly");
        thatLocalMaterials.load("白塑料（哑光）", null, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "PlasticsFrosted");
        thatLocalMaterials.load("木纹", 0xf1e29b, "a98d2960-ba71-4753-8508-ef5b1c35ac04", "木纹", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("冰面2", null, "6ba3fe67-0a4a-45af-a66e-b7c14c295519", "冰面2", "2e08e1f5-9420-4cc6-ba99-2a5a1481e9f2", "冰面2_normal", 0.9, "", "", 0.8, "", "", 0.4, "", "", 0.0, 1.0, 1.0, null, false, "Ice");
        thatLocalMaterials.load("蓝色玻璃", 0x0000FF, "", "", "", "", 0.2, "", "", null, "", "", 0.0, "", "", 0.0, null, null, null, false, "GlassClearly");
        thatLocalMaterials.load("布纹", 0xa, "eb3ba15d-2edc-433d-9296-4ff1ee0d2667", "布纹", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("铺满落叶的地面2", null, "d2bd9b0f-a7dc-4ec6-9006-8a950f95c51b", "铺满落叶的地面2", "2d77f860-4845-4f46-beda-3f160467c4bb", "铺满落叶的地面2_normal", null, "", "", null, "", "", null, "28c8463d-46fe-4cb1-8464-ad59caf62db9", "铺满落叶的地面2_roughness", 0.0, 1.0, 1.0, null, false, "GroundLand");
        thatLocalMaterials.load("蓝色", 0x00fff9, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("黑色粗糙漆面", 0x000000, "603a6b20-ffe3-427a-b4e3-ae0b9038cd4b", "黑色粗糙漆面", "9f7a9394-5526-4b3e-a151-7933c91a89f3", "黑色粗糙漆面_normal", null, "", "", null, "e6026c8e-6e14-43de-96da-8c21fb7dcb76", "黑色粗糙漆面_metalness", null, "b6ba4e60-2001-4266-918d-2b9780afefed", "黑色粗糙漆面_roughness", 0.1, 1.0, 1.0, null, false, "PaintFrosted");
        thatLocalMaterials.load("混凝土色", 0x969494, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("石英石1", null, "bbf6a10a-3b0c-4944-bf77-c2a62402568d", "石英石1", "ebef8db8-078a-48d0-981e-b1a46ab393db", "石英石1_normal", null, "", "", null, "", "", null, "fd323e6d-a8dc-4379-a62a-6efd4bada419", "石英石1_roughness", 0.0, 1.0, 1.0, null, false, "Stone");
        thatLocalMaterials.load("金色", 0xf1e29b, "", "", "", "", null, "", "", 0.5, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("金属网2", null, "9ff39c46-696e-400c-8d38-dd615c2a138e", "金属网2", "d50f9fcf-f35c-4ee7-836e-b0fdcd78a40c", "金属网2_normal", null, "46175a6b-b4bc-494d-ab33-522e61887057", "金属网2_opacity", null, "cbba8605-512a-41b2-826e-998174282906", "金属网2_metalness", null, "8f85936b-4cfa-49b8-9d0a-34f5441e577a", "金属网2_roughness", 0.0, 1.0, 1.0, null, false, "MetalFrosted");
        thatLocalMaterials.load("生锈钢板", null, "9cc0f1e4-d7e6-4bf4-85c2-5b655df71878", "生锈钢板", "030e0b3b-74c3-4bc6-a009-b42ab836ddba", "生锈钢板_normal", null, "", "", null, "5ec548cd-683c-45e4-a27a-63758c37c382", "生锈钢板_metalness", null, "8885ba59-3fec-426e-8e04-ac655b37be68", "生锈钢板_roughness", 0.0, 1.0, 1.0, null, false, "MetalRusted");
        thatLocalMaterials.load("碎石块路面", null, "78b26816-5f5c-47aa-a849-b5730db2cc4f", "碎石块路面", "a9cf360e-f01a-4145-a2bd-9ddb0345b2a6", "碎石块路面_normal", null, "846649a3-b984-4814-9970-745302b9a69b", "碎石块路面_opacity", null, "", "", null, "95a29384-f040-4e4a-a50b-4f76d504e666", "碎石块路面_roughness", 0.0, 1.0, 1.0, null, false, "GroundLand");
        thatLocalMaterials.load("大理石灰（亮光）", null, "9c1201a4-1169-4303-9123-126230b866c2", "大理石灰（亮光）", "", "", null, "", "", null, "", "", null, "", "", 0.2, null, null, null, false, "MarblePolished");
        thatLocalMaterials.load("透明玻璃", 0xFFFFFF, "", "", "", "", 0.2, "", "", null, "", "", 0.0, "", "", 0.0, null, null, null, false, "GlassClearly");
        thatLocalMaterials.load("木纹7", null, "8fce8598-ec7f-4fb3-96a8-4de7690aedbf", "木纹7", "315ded0c-d27a-4c4b-83db-6c6a0398edc1", "木纹7_normal", null, "", "", null, "", "", null, "78704a1b-bb70-4067-a11b-a9aaf3d38693", "木纹7_roughness", 0.0, 1.0, 1.0, null, false, "WoodPolished");
        thatLocalMaterials.load("泥坑地面", null, "8acf1431-4c46-40f4-ad7f-f46913f84287", "泥坑地面", "bb72c5c2-dd77-4ec8-975c-b0c83c09bf92", "泥坑地面_normal", null, "", "", null, "", "", null, "867ded7d-9dcd-495d-ac24-0a78f66c89be", "泥坑地面_roughness", 0.0, 1.0, 1.0, null, false, "GroundLand");
        thatLocalMaterials.load("铺满落叶的地面", null, "770a5464-fc67-4c66-b536-bf06fe8c74df", "铺满落叶的地面", "d827b87b-3f28-4d5f-bf19-a837130c9476", "铺满落叶的地面_normal", null, "", "", null, "", "", null, "", "", 0.0, 2.0, 2.0, null, false, "GroundLand");
        thatLocalMaterials.load("花纹玻璃", null, "40a9cab6-2b6b-44e8-bb4e-acaf3a095b19", "花纹玻璃", "766c4c4b-2e02-4b22-b2a5-11d70badd5cb", "花纹玻璃_normal", null, "", "", null, "", "", null, "c7a3a50e-13db-4bde-99f3-ae896dd246a2", "花纹玻璃_roughness", 0.0, null, null, null, false, "GlassFrosted");
        thatLocalMaterials.load("草坪5", null, "e152eff1-b677-433b-af80-477c7fa34721", "草坪5", "393f0a92-4a03-4ef8-880e-f115e749d514", "草坪5_normal", null, "", "", null, "", "", null, "73b8b1e9-7828-4bba-b984-498c21e3644e", "草坪5_roughness", 0.0, 1.0, 1.0, null, false, "Lawn");
        thatLocalMaterials.load("新铺的沥青地面", null, "50319f90-77b1-44d2-adac-4c5301a83f1d", "新铺的沥青地面", "783fa719-344b-4f89-9321-d6ff05400747", "新铺的沥青地面_normal", null, "", "", null, "", "", null, "85a1cc34-8efe-4df6-9bda-2a1f66fce24f", "新铺的沥青地面_roughness", 0.0, 1.0, 1.0, null, false, "Asphalt");
        thatLocalMaterials.load("纸张1", null, "928344ce-3d8d-44ce-9213-b3fb633928fc", "纸张1", "385b2228-174d-4263-8d19-77ebafa7bdbf", "纸张1_normal", null, "", "", null, "", "", null, "5eb32ada-b047-4f0f-9279-fded908eaaee", "纸张1_roughness", 0.0, 2.0, 2.0, null, false, "Paper");
        thatLocalMaterials.load("白塑料（亮光）", null, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.3, null, null, null, false, "PlasticsSmoothy");
        thatLocalMaterials.load("大理石", 0xa, "d4353c82-3d3b-41c7-a243-026d09691d76", "大理石", "", "", null, "", "", null, "", "", null, "", "", 0.2, null, null, null, false, "");
        thatLocalMaterials.load("带裂纹的沥青路面", null, "156e13d4-f7cb-4362-bfa6-0b436e5d53e1", "带裂纹的沥青路面", "b0c745bc-4c02-441f-9348-6131758af3b1", "带裂纹的沥青路面_normal", null, "", "", null, "", "", null, "f97d09ef-0521-44ea-8e18-f0dc557d7628", "带裂纹的沥青路面_roughness", 0.0, 1.0, 1.0, null, false, "Asphalt");
        thatLocalMaterials.load("红色", 0xff0707, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("白色粗糙漆面", 0xFFFFFF, "b2ceeaed-607b-4bc5-a081-81cdcbe70796", "白色粗糙漆面", "9f7a9394-5526-4b3e-a151-7933c91a89f3", "白色粗糙漆面_normal", null, "", "", null, "e6026c8e-6e14-43de-96da-8c21fb7dcb76", "白色粗糙漆面_metalness", null, "b6ba4e60-2001-4266-918d-2b9780afefed", "白色粗糙漆面_roughness", 0.1, 1.0, 1.0, null, false, "PaintFrosted");
        thatLocalMaterials.load("木纹5", null, "97eb80d3-2d4a-4195-9352-efb83c8bff80", "木纹5", "e359440d-eaf9-4abe-add8-09e2e96601aa", "木纹5_normal", null, "", "", null, "", "", null, "805e02a2-a7e9-464c-831b-33e4fddda22e", "木纹5_roughness", 0.0, 1.0, 1.0, null, false, "WoodPolished");
        thatLocalMaterials.load("不锈钢（抛光）", 0xC0C0C4, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.3, null, null, null, false, "MetalPolished");
        thatLocalMaterials.load("泥坑地面1", null, "55a04341-1082-44a4-b4c0-eb23bf1dd4f8", "泥坑地面1", "84bc191e-23c6-4eb2-90c0-11db9efec1a6", "泥坑地面1_normal", null, "", "", null, "", "", null, "402bdff8-21df-426e-9fe9-27c7dbf0c2f0", "泥坑地面1_roughness", 0.0, 1.0, 1.0, null, false, "GroundLand");
        thatLocalMaterials.load("白色透明", 0xeeeeee, "", "", "", "", 0.3, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("草坪4", null, "922b589c-e914-4b4f-bd2d-37132ac00c10", "草坪4", "1eb2301d-2dfc-4093-a55b-1502a6ea3549", "草坪4_normal", null, "", "", null, "", "", null, "db499a89-23ad-4d65-97c1-b062c7cb3bae", "草坪4_roughness", 0.0, 1.0, 1.0, null, false, "Lawn");
        thatLocalMaterials.load("透明", 0xffffff, "", "", "", "", 0.01, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("混凝土", null, "a5acf6bf-4bd1-4a7d-ac11-0f273497a840", "混凝土", "f5b70ffa-80ef-4957-a46d-941eeaa727a8", "混凝土_normal", null, "", "", null, "", "", null, "17f90384-a6f3-465c-80db-4d0d853e30bb", "混凝土_roughness", 0.0, 1.0, 1.0, null, false, "Concrete");
        thatLocalMaterials.load("绿色", 0x00ff00, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("铜板（抛光）", 0xB87333, "", "", "", "", null, "", "", null, "", "", null, "", "", 0.3, null, null, null, false, "MetalPolished");
        thatLocalMaterials.load("瓷砖2", null, "030e6962-a166-472a-aaf1-ed46c3f43f27", "瓷砖2", "7f75e1f4-9d87-4fc8-9d9a-812cf90def00", "瓷砖2_normal", null, "", "", null, "", "", null, "d8fc6d29-30db-4749-8e6e-ecc6d29aaef3", "瓷砖2_roughness", 0.2, null, null, null, false, "CeramicPolished");
        thatLocalMaterials.load("白色混凝土", 0xaaaaaa, "21cf8355-3e14-4a9a-9df3-92fb3a5873e7", "白色混凝土", "", "", null, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("大红酸枝", 0x7B302B, "da380898-1cf9-4a82-9dac-1038fb26090d", "大红酸枝", "", "", 1.0, "", "", 0.3, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("地砖草坪", null, "1f8ffe7d-504d-4280-b65f-bc599e6b430f", "地砖草坪", "69b75cd7-9346-4d76-b400-0c50442eb2f2", "地砖草坪_normal", null, "", "", null, "", "", null, "678feae3-94ba-4b09-a0c6-dd99523d865f", "地砖草坪_roughness", 0.0, 0.6, 0.6, null, false, "Lawn");
        thatLocalMaterials.load("大理石蓝（亮光）", null, "1d3c4648-f497-4341-9b16-4055a0ac4094", "大理石蓝（亮光）", "", "", null, "", "", null, "", "", null, "", "", 0.2, null, null, null, false, "MarblePolished");
        thatLocalMaterials.load("绿色透明", 0x00ff00, "", "", "", "", 0.3, "", "", null, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("红砖墙", null, "d7b94568-3af9-481f-b373-80fecc5aebc2", "红砖墙", "6c30027a-dcc2-402b-9318-4788abe5064a", "红砖墙_normal", null, "", "", null, "", "", null, "501c88ba-baa3-4ca6-a28a-b9103edca46d", "红砖墙_roughness", 0.0, 1.0, 1.0, 0.0, false, "Brick");
        thatLocalMaterials.load("皮革1", null, "be06af34-8e10-48c1-831c-7c294d5e20cb", "皮革1", "a0909eef-705d-4efc-8ad4-69e2fa691fa9", "皮革1_normal", null, "", "", null, "", "", null, "ecdb72d8-c156-4209-8013-f035fdde6f1f", "皮革1_roughness", 0.05, 1.0, 1.0, null, false, "Leather");
        thatLocalMaterials.load("大理石凹凸蓝（哑光）", null, "fb51c8fd-e3a5-4b47-82a1-57394398da96", "大理石凹凸蓝（哑光）", "c393d183-02a6-4284-85b0-870e1ce994c7", "大理石凹凸蓝（哑光）_normal", null, "", "", null, "", "", null, "97f17368-154d-42a2-9377-5dc593b7f72d", "大理石凹凸蓝（哑光）_roughness", 0.0, null, null, null, false, "MarbleFrosted");
        thatLocalMaterials.load("水面波纹", null, "a09ce70b-c823-4649-9971-3497411ec696", "水面波纹", "c5a0c9aa-baba-427e-81f7-74c6d9645748", "水面波纹_normal", null, "0cb85f96-92fe-432f-abf0-0ceff8af04b5", "水面波纹_opacity", null, "", "", null, "70b819c1-5aa3-47f0-803a-9edf9e873659", "水面波纹_roughness", 0.0, null, null, null, false, "Water");
        thatLocalMaterials.load("压岩红木", 0x451719, "16303c68-ecac-4cc0-bca8-a7fb9239c99d", "压岩红木", "", "", 1.0, "", "", 0.3, "", "", null, "", "", 0.0, null, null, null, false, "");
        thatLocalMaterials.load("红砖地面", null, "7d1ed3cb-536c-4938-a461-bedf7f005db2", "红砖地面", "5910bbd6-225d-44e2-8cdd-ab345fdb99fa", "红砖地面_normal", null, "", "", null, "", "", null, "042bbd59-e41a-4aab-ade1-75ee32d0500d", "红砖地面_roughness", 0.0, 1.0, 1.0, null, false, "GroundLand");
        thatLocalMaterials.load("草坪2", null, "d4f3d24d-b314-4e1b-990e-3d9baaa9e9e8", "草坪2", "960c60e7-6ad7-48db-a5dd-4d6a952105bd", "草坪2_normal", null, "", "", null, "", "", null, "ec6c69b3-6422-41f2-906d-f17fcf7cdfc6", "草坪2_roughness", 0.0, 1.0, 1.0, null, false, "Lawn");
        thatLocalMaterials.load("花岗岩2", null, "48f81b78-3605-4b87-9663-df7f12b685ea", "花岗岩2", "4f55a241-4e34-496d-80b9-8a31dc97da2f", "花岗岩2_normal", null, "", "", null, "", "", null, "b06df977-c24a-458b-905d-4a8b8e5cb5b4", "花岗岩2_roughness", 0.0, 1.0, 1.0, null, false, "Stone");
        thatLocalMaterials.load("电镀金属", null, "b08a8189-1efa-4576-b4dd-750014bc9e21", "电镀金属", "1cab9924-74bf-438e-b1c9-c1afc1f82f09", "电镀金属_normal", null, "", "", null, "bd6e6878-ea0c-4b83-949a-61ac116dac0c", "电镀金属_metalness", null, "ceaf07e7-a0dc-4783-9409-823bdd9a09e2", "电镀金属_roughness", 0.1, 1.0, 1.0, null, false, "MetalFrosted");
        thatLocalMaterials.load("铝板", null, "f754ac56-3332-4315-8ddc-defa084ce6f2", "铝板", "ca695b5c-5ce9-406e-9d4c-4e3e6b3b282c", "铝板_normal", null, "", "", null, "a08283a7-81ad-4361-a80e-7da276c72f39", "铝板_metalness", null, "d433d5d2-81e7-411f-bbb9-7e657d122e3b", "铝板_roughness", 0.3, 1.0, 1.0, null, false, "MetalFrosted");
        thatLocalMaterials.load("白色亮光漆面", 0xF8F8F8, "", "", "", "", null, "", "", 0.2, "", "", 0.2, "", "", 0.5, null, null, null, false, "PaintPolished");
    }

    this.initUserMaterialInfos = function (){
        //切丝机
        thatLocalMaterials.load("切丝机外壳", 0xCCC0B1, "", "", "", "", null, "", "", 0.4, "", "", 0.2, "", "", 0.3, null, null, null, false, "CeramicFrosted");
        thatLocalMaterials.load("切丝机底部", 0xA6ABBC, "", "", "", "", null, "", "", 0.3, "", "", 0.5, "", "", 0.0, null, null, null, false, "MetalFrosted");
        thatLocalMaterials.load("切丝机大门框", 0x222222, "", "", "", "", null, "", "", 0.3, "", "", 0.1, "", "", 0.2, null, null, null, false, "GlassClearly");
        thatLocalMaterials.load("切丝机门玻璃", 0xAAAAAA, "", "", "", "", 0.3, "", "", 0.0, "", "", 0.5, "", "", 0.1, null, null, null, false, "GlassClearly");

        //Tank300
        thatLocalMaterials.load("Tank300橙色车漆", 0xE54110, "", "", "", "", null, "", "", 0.3, "", "", 0.1, "", "", 0.5, null, null, null, false, "PaintPolished");
        thatLocalMaterials.load("Tank300灰色车漆", 0x666666, "", "", "", "", null, "", "", 0.3, "", "", 0.1, "", "", 0.5, null, null, null, false, "PaintPolished");
        thatLocalMaterials.load("Tank300黑色车漆", 0x050505, "", "", "", "", null, "", "", 0.3, "", "", 0.1, "", "", 1.0, null, null, null, false, "PaintPolished");
        thatLocalMaterials.load("Tank300白色车漆", 0xf6f7fb, "", "", "", "", null, "", "", 0.3, "", "", 0.1, "", "", 0.2, null, null, null, false, "PaintPolished");
        thatLocalMaterials.load("Tank300绿色车漆", 0x7B996E, "", "", "", "", null, "", "", 0.3, "", "", 0.1, "", "", 0.5, null, null, null, false, "PaintPolished");
        thatLocalMaterials.load("轮毂", 0xBBBBBB, "", "", "", "", null, "", "", 0.5, "", "", 0.1, "", "", 0.3, null, null, null, false, "MetalPolished");
        thatLocalMaterials.load("Tank300_Shadow", 0xFFFFFF, "", "Tank300_Shadow", "", "", null, "", "", 0.0, "", "", 1.0, "", "", 0.0, null, null, null, false, "");

        //ford游骑侠
        thatLocalMaterials.load("福特游骑侠陨石灰", 0x696C73, "", "", "", "", null, "", "", 0.3, "", "", 0.1, "", "", 0.5, null, null, null, false, "PaintPolished");
        thatLocalMaterials.load("福特游骑侠丹霞橙", 0xCC690B, "", "", "", "", null, "", "", 0.3, "", "", 0.1, "", "", 0.5, null, null, null, false, "PaintPolished");
        thatLocalMaterials.load("福特游骑侠火山黑", 0x050505, "", "", "", "", null, "", "", 0.3, "", "", 0.1, "", "", 1.0, null, null, null, false, "PaintPolished");
        thatLocalMaterials.load("福特游骑侠沙屿蓝", 0x4071BC, "", "", "", "", null, "", "", 0.3, "", "", 0.1, "", "", 1.0, null, null, null, false, "PaintPolished");
        thatLocalMaterials.load("福特游骑侠雪峰白", 0xf6f7fb, "", "", "", "", null, "", "", 0.3, "", "", 0.1, "", "", 0.2, null, null, null, false, "PaintPolished");
        thatLocalMaterials.load("福特游骑侠赤壤棕", 0x483834, "", "", "", "", null, "", "", 0.3, "", "", 0.1, "", "", 0.5, null, null, null, false, "PaintPolished");

    }

    this.createUserMaterial = function (name){
        switch (name){
            case "Tank300_Shadow":{
                let textureLoader = new THREE.TextureLoader();
                let imageUrl = thatLocalMaterials.manager.localObjectCreator.imageFolder + "Tank300_Shadow.png";
                let texture = textureLoader.load(imageUrl, function(texture) {
                    texture.repeat.set(1, 1);
                    let repeatType = THREE.ClampToEdgeWrapping;
                    texture.wrapS = repeatType;
                    texture.wrapT = repeatType;
                    texture.rotation = 0;
                });

                return new THREE.MeshPhongMaterial({
                    map: texture,
                    transparent: true, // 启用材质的透明度
                    alphaTest: 0.0, // 可选，设置alpha通道测试阈值，低于此值的部分会被裁剪掉
                });
            }
            case "白塑料":{
                return new THREE.MeshStandardMaterial({
                    color: 0xFFFFFF,
                    roughness: 0.1,
                    metalness: 0.5,
                    specular: 0xFFFFFF,
                    shininess: 90,
                    envMapIntensity: 0.3
                });
            }
            case "灰色金属":{
                return new THREE.MeshStandardMaterial({
                    color: 0xCCCCCC,
                    roughness: 0.2,
                    metalness: 0.5,
                    specular: 0xCCCCCC,
                    shininess: 90,
                    envMapIntensity: 0.3
                });
            }
            default:{
                return null;
            }
        }
    }
}
export default JS3LocalMaterials