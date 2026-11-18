import { Mesh } from "three";
import type { BufferGeometry,Material,Object3D,AnimationClip } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export type Cast = {
  root:Object3D;
  clips:AnimationClip[];
  luma:Mesh;
  mouth:Mesh;
  crest:Object3D;
  ripple:Mesh;
  seal:Object3D;
  resources:Set<BufferGeometry|Material>;
};

const exportUrl=new URL("./assets/cast.glb",import.meta.url).href;

export async function loadCast():Promise<Cast|undefined> {
  const resources=new Set<BufferGeometry|Material>();
  try {
    const glb=await new GLTFLoader().loadAsync(exportUrl);
    glb.scene.traverse(node=>{
      if(!(node instanceof Mesh))return;
      resources.add(node.geometry);
      for(const mat of Array.isArray(node.material)?node.material:[node.material])resources.add(mat);
    });
    const luma=glb.scene.getObjectByName("Luma_Shell");
    const mouth=glb.scene.getObjectByName("Luma_Mouth");
    const ripple=glb.scene.getObjectByName("Ripple_Jewel");
    const crest=glb.scene.getObjectByName("Luma_Crest");
    const seal=glb.scene.getObjectByName("Null_Seal");
    if(!(luma instanceof Mesh && mouth instanceof Mesh && ripple instanceof Mesh && crest && seal && glb.animations.length))
      throw Error("The Blender cast export is incomplete");
    return {root:glb.scene,clips:glb.animations,luma,mouth,crest,ripple,seal,resources};
  } catch {
    for(const resource of resources)resource.dispose();
    return undefined;
  }
}
