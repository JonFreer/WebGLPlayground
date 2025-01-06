import { mat4 } from "gl-matrix";
import { ProgramInfo } from "./webgl-demo";
import { Buffers } from "./init-buffers";
import { Model } from "./load-model";
import { Camera } from "./camera";
import { PBRMaterial } from "./shaders/pbr";
import { BasicMaterial } from "./shaders/basic";
import { SkyBox } from "./shaders/skybox";
import { PBRIBLMaterial } from "./shaders/pbr_ibl";

function drawScene(
  gl: WebGL2RenderingContext,
  material: PBRMaterial | BasicMaterial | PBRIBLMaterial,
  skybox: SkyBox,
  model: Model,
  texture: WebGLTexture,
  squareRotation: number,
  camera: Camera
) {
  gl.viewport(0, 0,   (gl.canvas as HTMLCanvasElement).clientWidth,
  (gl.canvas as HTMLCanvasElement).clientHeight);
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
  gl.clearDepth(1.0); // Clear everything
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelMatrix = mat4.create();
  mat4.rotate(modelMatrix, modelMatrix, squareRotation, [0, 1, 1]);

  model.meshes.forEach((mesh) => {

    material.setAttributes(gl,mesh.buffers);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.buffers.indices);
    // Tell WebGL to use our program when drawing
    gl.useProgram(material.programInfo.program);

    material.setUniforms(gl,camera,modelMatrix,texture,skybox.cubemap.filtered_texture);

    // Tell the shader we bound the texture to texture unit 0

    {
      const vertexCount = mesh.nVertices*3;
      const type = gl.UNSIGNED_SHORT;
      const offset = 0;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }

  });

  // render skybox
  // can be moved to own class
  skybox.render(gl,camera.getViewMatrix(),camera.projectionMatrix)

}

// Tell WebGL how to pull out the positions from the position
// buffer into the vertexPosition attribute.
function setPositionAttribute(
  gl: WebGL2RenderingContext,
  buffers: Buffers,
  programInfo: ProgramInfo
) {
  const numComponents = 3; // pull out 2 values per iteration
  const type = gl.FLOAT; // the data in the buffer is 32bit floats
  const normalize = false; // don't normalize
  const stride = 0; // how many bytes to get from one set of values to the next
  // 0 = use type and numComponents above
  const offset = 0; // how many bytes inside the buffer to start from
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    numComponents,
    type,
    normalize,
    stride,
    offset
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

function setColorAttribute(
  gl: WebGL2RenderingContext,
  buffers: Buffers,
  programInfo: ProgramInfo
) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexColor,
    4,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
}

function setNormalAttribute(
  gl: WebGL2RenderingContext,
  buffers: Buffers,
  programInfo: ProgramInfo
) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexNormal,
    3,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
}

function setTextureAttribute(
  gl: WebGL2RenderingContext,
  buffers: Buffers,
  programInfo: ProgramInfo
) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
  gl.vertexAttribPointer(
    programInfo.attribLocations.textureCoord,
    2,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
}

export function setAttribute(gl: WebGL2RenderingContext, location: GLint, buffer: WebGLBuffer,size: GLint, type: GLenum){
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer); 
    gl.vertexAttribPointer(
      location,
      size,
      type,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(location);
}



export { drawScene };
