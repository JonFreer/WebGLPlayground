import * as OBJFile from 'obj-file-parser';
import { Offset } from './load-model';
import { Buffers } from './mesh';

// export interface Buffers{
//     position: WebGLBuffer;
//     color: WebGLBuffer;
//     indices: WebGLBuffer;
//     textureCoord: WebGLBuffer;
//     normal: WebGLBuffer;
// }

function initBuffers(gl:WebGL2RenderingContext, mesh: OBJFile.ObjModel, offset:Offset) : Buffers {
    const positionBuffer = initPositionBuffer(gl,mesh);
    const colorBuffer = initColorBuffer(gl, mesh);
    const indexBuffer = initIndexBuffer(gl,mesh, offset);
    const textureCoordBuffer = initTextureBuffer(gl, mesh, offset);
    const normalBuffer = initNormalBuffer(gl,mesh, offset);
    
    return {
      position: positionBuffer,
      // color: colorBuffer,
      indices: indexBuffer,
      textureCoord: textureCoordBuffer,
      normal: normalBuffer
    };

  }

  function initColorBuffer(gl: WebGL2RenderingContext, mesh: OBJFile.ObjModel){
 
    const colors = mesh.vertices.map(point => [point.x, point.y, point.z, 1.0]).flat();
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    return colorBuffer;
  }
  
  function initPositionBuffer(gl:WebGLRenderingContext, mesh: OBJFile.ObjModel) {
    // Create a buffer for the square's positions.
    const positionBuffer = gl.createBuffer();
  
    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = mesh.vertices.map(point => [point.x, point.y, point.z]).flat();
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
    return positionBuffer;
  }

  function initIndexBuffer(gl:WebGL2RenderingContext,mesh: OBJFile.ObjModel,offset:Offset){
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
    const indices = new Uint16Array(mesh.faces.map(face => face.vertices.map(vertex=>vertex.vertexIndex-1-offset.position)).flat());
      gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices),
        gl.STATIC_DRAW,
      )

      return indexBuffer
  }

  function initTextureBuffer(gl:WebGL2RenderingContext, mesh: OBJFile.ObjModel,offset:Offset){
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
    const indices = mesh.faces.map(face => face.vertices.map(vertex=>vertex.vertexIndex-1-offset.position)).flat();
    const textureIndicies = mesh.faces.map(face => face.vertices.map(vertex=>vertex.textureCoordsIndex-1-offset.textureCoord)).flat();
    const textureCoordinates = mesh.textureCoords.map(point => [point.u, point.v])//.flat();
    const textureCoordinatesRemap = textureCoordinates.slice();

    for(var i = 0; i< indices.length; i++){
        textureCoordinatesRemap[indices[i]] = textureCoordinates[textureIndicies[i]];
    }

      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(textureCoordinatesRemap.flat()),
        gl.STATIC_DRAW,
      );
    
      return textureCoordBuffer;
  }
  
  function initNormalBuffer(gl:WebGL2RenderingContext, mesh: OBJFile.ObjModel, offset: Offset){
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    const indices = mesh.faces.map(face => face.vertices.map(vertex=>vertex.vertexIndex-1-offset.position)).flat();
    const normalIndicies = mesh.faces.map(face => face.vertices.map(vertex=>vertex.vertexNormalIndex-1-offset.normal)).flat();
    const vertexNormals = mesh.vertexNormals.map(point => [point.x, point.y, point.z])
    // const vertexNormalsRemap = mesh.vertices.map(point => [point.x, point.y,point.z]).slice()
    const vertexNormalsRemap = vertexNormals.slice()
    for(var i = 0; i< indices.length; i++){
        vertexNormalsRemap[indices[i]] = vertexNormals[normalIndicies[i]];
    }

      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertexNormalsRemap.flat()),
        gl.STATIC_DRAW
      );

      return normalBuffer;
  }

  export { initBuffers };
  