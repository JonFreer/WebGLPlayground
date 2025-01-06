// This shader bakes in the raddiance component from a cube map into a lower resolution cube map

import { mat4 } from "gl-matrix";
import { initShaderProgram } from "../shader-handler";
import { setAttribute } from "../draw-scene";

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

uniform samplerCube environmentMap;

const float PI = 3.14159265359;

void main()
{		
	// The world vector acts as the normal of a tangent surface
    // from the origin, aligned to WorldPos. Given this normal, calculate all
    // incoming radiance of the environment. The result of this radiance
    // is the radiance of light coming from -Normal direction, which is what
    // we use in the PBR shader to sample irradiance.
    vec3 N = normalize(WorldPos);

    vec3 irradiance = vec3(0.0);   
    
    // tangent space calculation from origin point
    vec3 up    = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(up, N));
    up         = normalize(cross(N, right));
       
    float sampleDelta = 0.025;
    float nrSamples = 0.0;
    for(float phi = 0.0; phi < 2.0 * PI; phi += sampleDelta)
    {
        for(float theta = 0.0; theta < 0.5 * PI; theta += sampleDelta)
        {
            // spherical to cartesian (in tangent space)
            vec3 tangentSample = vec3(sin(theta) * cos(phi),  sin(theta) * sin(phi), cos(theta));
            // tangent space to world
            vec3 sampleVec = tangentSample.x * right + tangentSample.y * up + tangentSample.z * N; 

            irradiance += texture(environmentMap, sampleVec).rgb * cos(theta) * sin(theta);
            nrSamples++;
        }
    }
    irradiance = PI * irradiance * (1.0 / float(nrSamples));
    
    FragColor = vec4(irradiance, 1.0);
}
`


export class IrradianceShader {
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
              environmentMap: gl.getUniformLocation(shaderProgram, "environmentMap")
            },
          };

    }

     setUniforms(gl:WebGL2RenderingContext, texture: WebGLTexture, view: mat4, projection: mat4){
            //set the texture
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
            gl.uniform1i(this.programInfo.uniformLocations.environmentMap, 0);
    
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

};