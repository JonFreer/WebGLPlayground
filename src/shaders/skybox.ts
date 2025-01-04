import { mat4 } from "gl-matrix";
import { setAttribute } from "../draw-scene";
import { initShaderProgram } from "../shader-handler";
import { CubeMap } from "../cubemap";

const vsSource =`#version 300 es
in vec3 aPos;

uniform mat4 projection;
uniform mat4 view;

out vec3 localPos;

void main()
{
    localPos = aPos;

    mat4 rotView = mat4(mat3(view)); // remove translation from the view matrix
    vec4 clipPos = projection * rotView * vec4(localPos, 1.0);

    gl_Position = clipPos.xyww;
}
`

const fsSource = `#version 300 es

precision highp float;
out vec4 FragColor;

in vec3 localPos;
  
uniform samplerCube environmentMap;
  
void main()
{
    vec3 envColor = texture(environmentMap, localPos).rgb;
    
    envColor = envColor / (envColor + vec3(1.0));
    envColor = pow(envColor, vec3(1.0/2.2)); 
  
    FragColor = vec4(envColor, 1.0);
    // FragColor = vec4(1.0,0.0,0.0, 1.0);
}
`
export class SkyBox{
    programInfo;
    cubemap: CubeMap;

        constructor(gl: WebGL2RenderingContext, cubemap: CubeMap) {
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

              this.cubemap = cubemap;

              
    
        }
        
            render(gl:WebGL2RenderingContext, view: mat4, projection: mat4){
                gl.useProgram(this.programInfo.program);
                this.setAttributes(gl);
                this.setUniforms(gl,view,projection);
                var primitiveType = gl.TRIANGLES;
                var offset = 0;
                var count = 6 * 6;
                gl.drawArrays(primitiveType, offset, count);
            }


            setUniforms(gl:WebGL2RenderingContext, view: mat4, projection: mat4){
                //set the texture
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubemap.texture);
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
        

}