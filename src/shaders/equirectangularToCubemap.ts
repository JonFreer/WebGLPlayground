import { mat4 } from "gl-matrix";
import { initShaderProgram } from "../shader-handler";
import { setAttribute } from "../draw-scene";

// Vertex shader program
const vsSource = `#version 300 es
in vec3 aPos;

out vec3 WorldPos;

uniform mat4 projection;
uniform mat4 view;

void main()
{
    WorldPos = aPos;
    gl_Position =  projection * view * vec4(WorldPos, 1.0);
}
`
const fsSource =  `#version 300 es

precision highp float;

out vec4 FragColor;
in vec3 WorldPos;

uniform sampler2D equirectangularMap;

const vec2 invAtan = vec2(0.1591, 0.3183);
vec2 SampleSphericalMap(vec3 v)
{
    vec2 uv = vec2(atan(v.z, v.x), asin(v.y));
    uv *= invAtan;
    uv += 0.5;
    return uv;
}

void main()
{		
    vec2 uv = SampleSphericalMap(normalize(WorldPos));
    vec3 color = texture(equirectangularMap, uv).rgb;
    
    FragColor = vec4(color, 1.0);
}
`

export class equiToCubeShader {
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
              vertexPosition: gl.getAttribLocation(shaderProgram, "aPos"),
            },
            uniformLocations: {
              projectionMatrix: gl.getUniformLocation(shaderProgram, "projection"),
              viewMatrix: gl.getUniformLocation(shaderProgram, "view"),
              equirectangularMap: gl.getUniformLocation(shaderProgram, "equirectangularMap")
            },
          };

    }

    setUniforms(gl:WebGL2RenderingContext, texture: WebGLTexture, view: mat4, projection: mat4){
        //set the texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(this.programInfo.uniformLocations.equirectangularMap, 0);

        gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.viewMatrix,
            false,
            view
          );

        gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.projectionMatrix,
            false,
            projection
          );
    }

    setAttributes(gl:WebGL2RenderingContext){
        const verts = [
            // back face
            -1.0, -1.0, -1.0,  // bottom-left
            1.0,  1.0, -1.0,  // top-right
            1.0, -1.0, -1.0,   // bottom-right         
            1.0,  1.0, -1.0,  // top-right
           -1.0, -1.0, -1.0,  // bottom-left
           -1.0,  1.0, -1.0,  // top-left
           // front face
           -1.0, -1.0,  1.0, // bottom-left
            1.0, -1.0,  1.0,   // bottom-right
            1.0,  1.0,  1.0,   // top-right
            1.0,  1.0,  1.0,  // top-right
           -1.0,  1.0,  1.0, // top-left
           -1.0, -1.0,  1.0, // bottom-left
           // left face
           -1.0,  1.0,  1.0, // top-right
           -1.0,  1.0, -1.0, // top-left
           -1.0, -1.0, -1.0, // bottom-left
           -1.0, -1.0, -1.0, // bottom-left
           -1.0, -1.0,  1.0, // bottom-right
           -1.0,  1.0,  1.0,// top-right
           // right face
            1.0,  1.0,  1.0, // top-left
            1.0, -1.0, -1.0,  // bottom-right
            1.0,  1.0, -1.0, // top-right         
            1.0, -1.0, -1.0,  // bottom-right
            1.0,  1.0,  1.0, // top-left
            1.0, -1.0,  1.0,  // bottom-left     
           // bottom face
           -1.0, -1.0, -1.0,  // top-right
            1.0, -1.0, -1.0,   // top-left
            1.0, -1.0,  1.0,  // bottom-left
            1.0, -1.0,  1.0,  // bottom-left
           -1.0, -1.0,  1.0,   // bottom-right
           -1.0, -1.0, -1.0,   // top-right
           // top face
           -1.0,  1.0, -1.0,  // top-left
            1.0,  1.0 , 1.0,   // bottom-right
            1.0,  1.0, -1.0, // top-right     
            1.0,  1.0,  1.0, // bottom-right
           -1.0,  1.0, -1.0,  // top-left
           -1.0,  1.0,  1.0,   // bottom-left     
       ]
        const positionBuffer = gl.createBuffer();
  
        // Select the positionBuffer as the one to apply buffer
        // operations to from here out.
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
      
        setAttribute(
                gl,
                this.programInfo.attribLocations.vertexPosition,
                positionBuffer,
                3,
                gl.FLOAT
                );
    }
}