import OBJFile from 'obj-file-parser'
import {  initBuffers } from './init-buffers'
import { Buffers, Mesh } from './mesh';

export interface Model{
    meshes: Mesh[]
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

        const objFile = new OBJFile(text);
        const parsedObj = objFile.parse();
        const offset: Offset = {
            position:0,
            textureCoord:0,
            normal:0
        };
        
        parsedObj.models.forEach(model => {
            model_out.meshes.push(Mesh.createFromBuffers(initBuffers(gl,model,offset), model.name, model.faces.length*3));
            offset.position += model.vertices.length
            offset.textureCoord += model.textureCoords.length
            offset.normal += model.vertexNormals.length

        })
    })
    
    return model_out
}