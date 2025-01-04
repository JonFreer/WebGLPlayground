import OBJFile from 'obj-file-parser'
import { Buffers, initBuffers } from './init-buffers'

export interface Model{
    meshes: Mesh[]
}

interface Mesh{
    buffers: Buffers;
    name: String;
    nVertices:number;
}

export interface Offset{
    position: number;
    textureCoord: number;
    normal: number;
}

export function fetchAndParseOBJ(gl:WebGL2RenderingContext, url:string):Model{

    const model_out : Model = {
        meshes:[]
    }

    fetch(url).then(response =>{
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.text();
    }).then(text=>{

         // Get the text content of the OBJ file

        // Parse the OBJ file
        const objFile = new OBJFile(text);
        const parsedObj = objFile.parse();
        const offset: Offset = {
            position:0,
            textureCoord:0,
            normal:0
        };

        // const verts = parsedObj.models.map(model=>model.vertices).flat();
        
        parsedObj.models.forEach(model => {
            // console.log(model)
            model_out.meshes.push({
                buffers: initBuffers(gl,model,offset),
                name:  model.name,
                nVertices: model.faces.length// *3
            });

            // console.log(model.faces.length * 3)

            // const vertices = mo.map(mesh=>mesh.)

            offset.position += model.vertices.length
            offset.textureCoord += model.textureCoords.length
            offset.normal += model.vertexNormals.length

        })
        // console.log(parsedObj)

    })
    
    // const model_out_two: Model = {
    //     meshes:[]
    // }

    // if meshes
    // model_out_two.meshes.push(model_out.meshes[0])
    // console.log("model_out",model_out,model_out_two,model_out.meshes[0])
    // return {meshes: [model_out.meshes[0]]}  
    return model_out
}