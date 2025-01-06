import { Geometry } from "./geometry/geometry";


export interface Buffers{
    position: WebGLBuffer;
    indices: WebGLBuffer;
    textureCoord: WebGLBuffer;
    normal: WebGLBuffer;
}


export class Mesh{

    buffers: Buffers;
    name: String;
    indexCount: number;

    constructor(gl: WebGL2RenderingContext, geometry: Geometry, name: string){
        this.name = name;
        this.indexCount = geometry.indexCount;
        this.buffers = this.initBuffers(gl,geometry);
    } 
    

      // Static method to act as an alternative constructor
    static createFromBuffers(buffers: Buffers, name: string, indexCount: number): Mesh {
        const mesh = Object.create(Mesh.prototype);
        mesh.buffers = buffers;
        mesh.name = name;
        mesh.indexCount = indexCount;
        return mesh;
    }
    
    

    initBuffers(gl: WebGL2RenderingContext, geometry: Geometry):Buffers{
        
        // init the base buffers
        // todo: add optional buffers
        const normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(geometry.normals),
            gl.STATIC_DRAW
          );

        const textureCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(geometry.uv),
            gl.STATIC_DRAW
          );

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array(geometry.positions),
            gl.STATIC_DRAW
        );

        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(geometry.indices),
            gl.STATIC_DRAW,
          );

        return {
            position: positionBuffer,
            indices: indexBuffer,
            textureCoord: textureCoordBuffer,
            normal: normalBuffer
        } 
        



    }
}