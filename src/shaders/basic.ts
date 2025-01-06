import { mat3, mat4 } from "gl-matrix";
import { setAttribute } from "../draw-scene";
import { initShaderProgram } from "../shader-handler";
import { ProgramInfo } from "../webgl-demo";
import { Camera } from "../camera";
import { Buffers } from "../mesh";

// Vertex shader program
const vsSource = `# version 300 es
in vec2 aTextureCoord;
in vec4 aVertexPosition;
in vec3 aVertexNormal;

uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

out vec2 vTextureCoord;
out highp vec3 vLighting;
out vec3 vNormal;

void main() {
  gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix* aVertexPosition;
  vTextureCoord = aTextureCoord;

  // Apply lighting effect

  highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
  highp vec3 directionalLightColor = vec3(1, 1, 1);
  highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

  highp vec3 transformedNormal = uNormalMatrix * aVertexNormal;

  highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
  vLighting = ambientLight + (directionalLightColor * directional);

  vNormal = aVertexNormal;
}
`;

const fsSource = `# version 300 es

in highp vec2 vTextureCoord;
in highp vec3 vLighting;

in highp vec3 vNormal;

out highp vec4 fragColor;

uniform sampler2D uSampler;

void main() {
  // fragColor = texture(uSampler, vTextureCoord);
  highp vec4 texelColor = texture(uSampler, vTextureCoord);

  fragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
//   fragColor = vec4(vNormal, texelColor.a);
}
`;

export class BasicMaterial {
    programInfo;
    constructor(gl: WebGL2RenderingContext) {
        var shaderProgram = initShaderProgram(gl, vsSource, fsSource);
        if (shaderProgram == null) {
        alert("Invaid shader program");
        }
        shaderProgram = shaderProgram as WebGLProgram;
        this.programInfo = {
            program: shaderProgram,
            attribLocations: {
              vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
              vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
              textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
              vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
            },
            uniformLocations: {
              projectionMatrix: gl.getUniformLocation(
                shaderProgram,
                "uProjectionMatrix"
              ),
              viewMatrix: gl.getUniformLocation(shaderProgram, "uViewMatrix"),
              modelMatrix: gl.getUniformLocation(shaderProgram, "uModelMatrix"),
              uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
              normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix"),
            },
          };

    }

    setAttributes(gl: WebGL2RenderingContext, buffers: Buffers) {
        setAttribute(
          gl,
          this.programInfo.attribLocations.vertexPosition,
          buffers.position,
          3,
          gl.FLOAT
        );
        setAttribute(
          gl,
          this.programInfo.attribLocations.textureCoord,
          buffers.textureCoord,
          2,
          gl.FLOAT
        );
        setAttribute(
          gl,
          this.programInfo.attribLocations.vertexNormal,
          buffers.normal,
          3,
          gl.FLOAT
        );
        // setAttribute(
        //     gl,
        //     this.programInfo.attribLocations.vertexColor,
        //     buffers.color,
        //     3,
        //     gl.FLOAT
        //   );
      }


        setUniforms(
          gl: WebGL2RenderingContext,
          camera: Camera,
          modelMatrix: mat4,
          texture: WebGLTexture
        ) {
          gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            camera.projectionMatrix
          );
      
          gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelMatrix,
            false,
            modelMatrix
          );
      
          gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.viewMatrix,
            false,
            camera.getViewMatrix()
          );
      
          const normalMatrix = mat3.create();
          mat3.fromMat4(normalMatrix, modelMatrix);
          mat3.invert(normalMatrix, normalMatrix);
          mat3.transpose(normalMatrix, normalMatrix);
      
          gl.uniformMatrix3fv(
            this.programInfo.uniformLocations.normalMatrix,
            false,
            normalMatrix
          );
      
          // Tell WebGL we want to affect texture unit 0
          gl.activeTexture(gl.TEXTURE0);
          // Bind the texture to texture unit 0
          gl.bindTexture(gl.TEXTURE_2D, texture);
      
          gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);

    }


}

