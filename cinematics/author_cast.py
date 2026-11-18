"""Author the original Ripple Circuit cast and an editable Blender animatic.

Run from the repository with Blender 4.5 in background mode. Arguments after
-- are shot-board JSON, target GLB, and target .blend. The optional fourth
argument saves a single EEVEE look-development frame.
"""
import bpy
from math import pi, sin, cos, tan
from mathutils import Vector
from pathlib import Path
import json
import sys

board_path, glb_path, blend_path, *preview_path = sys.argv[sys.argv.index("--") + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.fps = 30
scene.world = bpy.data.worlds.new("Lagoon Horizon")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (.33, .61, .80, 1)
scene.world.node_tree.nodes["Background"].inputs[1].default_value = .48

def space(p):
    """Map web Y-up coordinates to Blender's Z-up space."""
    return p[0], -p[2], p[1]

def material(name, color, roughness=.42, glow=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color,1)
    mat.use_nodes = True
    node = mat.node_tree.nodes.get("Principled BSDF")
    node.inputs["Base Color"].default_value = (*color,1)
    node.inputs["Roughness"].default_value = roughness
    node.inputs["Emission Color"].default_value = (*color,1)
    node.inputs["Emission Strength"].default_value = glow
    return mat

mint = material("Jade lantern · Luma", (.21,.80,.65))
ring = material("Warm sterling", (.94,.77,.31), .30, .10)
ink = material("Deep teal ink", (.012,.064,.13))
cream = material("Glass highlight", (.80,1,.94), .28, .08)
pink = material("Rose reflection", (.89,.43,.48), .52)
cyan = material("Ripple aquamarine", (.09,.76,.78), .28, .13)
glass = material("NULL midnight facets", (.10,.048,.20), .26, .035)
violet = material("NULL illuminated seams", (.53,.18,.59), .30, .16)

def finish(name,scale,mat, smooth=False):
    obj = bpy.context.object
    obj.name = name
    obj.scale = space((scale[0],scale[1],-scale[2]))
    if mat: obj.data.materials.append(mat)
    for polygon in obj.data.polygons: polygon.use_smooth=smooth
    return obj

def uv(name,p,scale,mat,smooth=True):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=18,ring_count=12,location=space(p))
    return finish(name,scale,mat,smooth)

def ico(name,p,scale,mat,subdivisions=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions,radius=1,location=space(p))
    return finish(name,scale,mat)

def cube(name,p,scale,mat):
    bpy.ops.mesh.primitive_cube_add(size=1,location=space(p))
    return finish(name,scale,mat)

def empty(name):
    obj=bpy.data.objects.new(name,None)
    scene.collection.objects.link(obj)
    return obj

def child(obj, parent):
    obj.parent=parent
    return obj

def key(obj,path,frame,value):
    setattr(obj,path,value)
    obj.keyframe_insert(data_path=path,frame=frame,group=obj.name)

body=uv("Luma_Shell",(0,0,0),(.60,.54,.522),mint)
mouth=uv("Luma_Mouth",(0,-.177,.501),(.08,.035,.028),ink)
mouth.shape_key_add(name="Basis")
for label, width, depth in [("A",1.12,1.92),("E",1.42,.94),("O",.68,1.85),("Rest",.80,.40)]:
    shape=mouth.shape_key_add(name=label)
    for point in shape.data:
        point.co.x*=width
        point.co.z*=depth

crest=empty("Luma_Crest")
for side in (-1,1):
    fin=child(ico("Luma_Fin_L" if side<0 else "Luma_Fin_R",(side*.51,.29,-.14),(.085,.245,.105),ring),crest)
    fin.rotation_euler.y=side*.32
    for frame, shift, angle in [(1,0,0),(22,.11,.35),(41,-.035,-.12),(58,.049,.19),(90,0,0)]:
        key(fin,"location",frame,space((side*(.51+shift),.29+shift*.35,-.14)))
        key(fin,"rotation_euler",frame,(0,side*(.32+angle),0))
gem=ico("Ripple_Jewel",(0,0,0),(.24,.28,.18),cyan)
for frame,rot,stretch in [(1,0,1),(22,.67,1.21),(41,1.57,.94),(60,2.05,1.15),(90,pi,1)]:
    key(gem,"rotation_euler",frame,(.17,0,rot))
    key(gem,"scale",frame,(.24*stretch,.18,.28*stretch))
sigil=empty("Null_Seal")
for i in range(7):
    angle=i*pi/4
    shard=child(ico(f"Null_Shard_{i}",(cos(angle)*.65,sin(angle)*.65,0),(.115,.39,.072),violet if i%3==0 else glass),sigil)
    for frame,radius,spin,depth in [(1,.70,-.05,.03),(19,.48,.12,-.08),(41,.78,.46,.17),(58,.55,.58,-.09),(90,.70,.82,.03)]:
        turn=angle+spin
        key(shard,"location",frame,space((cos(turn)*radius,sin(turn)*radius,depth*sin(i*2.4))))
        key(shard,"rotation_euler",frame,(sin(turn)*.32,turn+pi/2,cos(turn)*.20))

# The web export contains the authored cast and a single 3-second action.
scene.frame_start=1
scene.frame_end=90
scene.frame_set(1)
bpy.ops.object.select_all(action="SELECT")
Path(glb_path).parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(Path(glb_path).resolve()),export_format="GLB",use_selection=True,
                         export_animation_mode="SCENE",export_anim_slide_to_zero=True,
                         export_force_sampling=True,export_frame_step=3,
                         export_animations=True,export_cameras=False,export_lights=False)

# The production animatic retains all eight film timelines and their named cuts.
luma=empty("ACTOR · Luma / body, face, fins")
ripple=empty("ACTOR · Ripple / core and shell")
null_control=empty("EFFECT · NULL seal")
for item in [body,mouth,crest]: child(item,luma)
child(gem,ripple)
child(sigil,null_control)
child(uv("Ripple · glass envelope",(0,0,0),(.39,.39,.39),cyan),ripple)
for sign in (-1,1):
    child(uv("Luma · sclera",(sign*.187,.045,.492),(.116,.174,.052),cream),luma)
    child(uv("Luma · pupil",(sign*.187,.047,.541),(.065,.104,.032),ink),luma)
    child(uv("Luma · eye sparkle",(sign*.187-.02,.084,.566),(.019,.019,.01),cream),luma)
    child(uv("Luma · warm cheek",(sign*.33,-.09,.435),(.08,.032,.022),pink),luma)

chalk=material("Aqueduct porcelain", (.60,.88,.82))
stone=material("Aero blue supports", (.07,.32,.47))
water=material("Lagoon cel reflection", (.09,.58,.68),.37)
deck=cube("Arrival Terrace",(0,-.2,.5),(10,.4,3.5),chalk)
cube("Lagoon animated set proxy",(0,-3.52,-10),(70,.23,70),water)
for name,point,sz in [("Beacon",(-5,.1,-2.9),1.5),("Reservoir",(-5.4,.2,-4.8),2),("Crown",(-1,.2,-6.3),2),("Relay",(4.9,.16,-4),1.6),("Canopy signal",(8.1,.45,-7.15),1.45)]:
    ico(name,point,(sz,.66,sz),stone,2)
    ico(name+" jewel",(point[0],point[1]+1,point[2]),(.47,.86,.44),cyan)
camera_data=bpy.data.cameras.new("Shot lens")
camera=bpy.data.objects.new("CAMERA · authored shot board",camera_data)
scene.collection.objects.link(camera)
scene.camera=camera
light_data=bpy.data.lights.new("Warm cel key","AREA")
light_data.energy=650
light_data.shape="DISK"
light_data.size=5
light=bpy.data.objects.new("Warm cel key",light_data)
scene.collection.objects.link(light)
light.location=space((-2,6,5))
light.rotation_euler=(-light.location).to_track_quat("-Z","Y").to_euler()
def camera_key(lens,frame):
    focus,offset,fov=lens
    point=Vector(space(focus))
    location=point+Vector(space(offset))
    camera_data.sensor_fit="VERTICAL"
    key(camera_data,"lens",frame,camera_data.sensor_height/(2*tan(fov*pi/360)))
    key(camera,"location",frame,location)
    key(camera,"rotation_euler",frame,(point-location).to_track_quat("-Z","Y").to_euler())

def actor_key(actor,keyframe,frame):
    x,y,z,roll,stretch,_=keyframe
    key(actor,"location",frame,space((x,y,z)))
    key(actor,"rotation_euler",frame,(0,roll,0))
    key(actor,"scale",frame,(stretch**-.5,1,stretch))

films=json.loads(Path(board_path).read_text())
cursor=1
reveal=1
for film_title,film in films.items():
    for shot in film["shots"]:
        end=cursor+int(shot["seconds"]*30)-1
        scene.timeline_markers.new(film["title"]+" | "+shot["label"],frame=cursor)
        camera_key(shot["lens"][0],cursor)
        camera_key(shot["lens"][-1],end)
        for actor, track in [(luma,shot["luma"]),(ripple,shot.get("ripple") or [[0,[0,-13,0,0,1,"neutral"]]])]:
            for entry in track:
                tick=cursor+round((end-cursor)*entry[0])
                actor_key(actor,entry[1],tick)
                if len(entry)>2: actor_key(actor,entry[1],tick+1)
            actor_key(actor,track[-1][1],end)
        show=shot["effect"]=="fracture"
        key(null_control,"location",cursor,space((-1,2.3,-5.9) if show else (0,-15,0)))
        key(null_control,"location",end,space((-1,2.3,-5.9) if show else (0,-15,0)))
        if film_title=="story-intro" and shot["effect"]=="spark" and reveal==1: reveal=cursor+155
        line=shot.get("line")
        if line and line.get("mouths"):
            shapes=mouth.data.shape_keys.key_blocks
            for i,ch in enumerate(line["mouths"]):
                at=cursor+round((line["in"]+(line["out"]-line["in"])*i/len(line["mouths"]))*30)
                for tag in ["A","E","O","Rest"]:
                    shapes[tag].value=float(tag==ch.upper() or tag=="Rest" and ch=="–")
                    shapes[tag].keyframe_insert(data_path="value",frame=at)
            shapes["Rest"].value=1
        cursor=end+1
scene.frame_end=cursor-1
scene.frame_set(reveal)
scene.render.engine="BLENDER_EEVEE_NEXT"
scene.render.resolution_x=960
scene.render.resolution_y=540
scene.render.resolution_percentage=100
scene.view_settings.view_transform="Standard"
scene["Production"]="Ripple Circuit 5.0 · The Animated Story"
scene["Authoring"]="All shots are named on the timeline. The web set and facial director live in src/story/film."
Path(blend_path).parent.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(Path(blend_path).resolve()),compress=True)
if preview_path:
    scene.render.filepath=str(Path(preview_path[0]).resolve())
    bpy.ops.render.render(write_still=True)
