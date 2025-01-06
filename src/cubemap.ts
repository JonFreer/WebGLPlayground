import { mat4, vec3 } from "gl-matrix";
import { equiToCubeShader } from "./shaders/equirectangularToCubemap";
import { IrradianceShader } from "./shaders/irradiance";



export class CubeMap{

    texture: WebGLTexture;
    filtered_texture: WebGLTexture;

    constructor(gl: WebGL2RenderingContext, hdri_texture: WebGLTexture){

        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
        // pbr: setup cubemap to render to and attach to framebuffer
        for (var i = 0; i < 6; i++){
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X+i,
                0,
                gl.RGBA32F,
                512, 512, 0, gl.RGBA, gl.FLOAT, null
            );
        }

        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR); 
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

         // pbr: set up projection and view matrices for capturing data onto the 6 cubemap face directions

        const captureProjection = mat4.create();
        mat4.perspective(captureProjection,(90* Math.PI) / 180, 1.0, 0.1, 10.0)

        const captureViews = [
            mat4.lookAt(mat4.create(), [0,0,0], [1,0,0], [0.0, -1.0, 0.0]),
            mat4.lookAt(mat4.create(), [0,0,0], [-1,0,0], [0.0, -1.0, 0.0]),
            mat4.lookAt(mat4.create(), [0,0,0], [0,1,0], [0.0, 0.0, 1.0]),
            mat4.lookAt(mat4.create(), [0,0,0], [0,-1,0], [0.0, 0.0, -1.0]),
            mat4.lookAt(mat4.create(), [0,0,0], [0,0,1], [0.0, -1.0, 0.0]),
            mat4.lookAt(mat4.create(), [0,0,0], [0,0,-1], [0.0, -1.0, 0.0]),
        ]

        const equirectangularToCubemapShader = new equiToCubeShader(gl);

        // set up the framebuffers
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

        const rbo = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, 512, 512);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbo);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(equirectangularToCubemapShader.programInfo.program);
        equirectangularToCubemapShader.setAttributes(gl);

        for(var i = 0; i < 6; i++){
            equirectangularToCubemapShader.setUniforms(gl,hdri_texture,captureViews[i],captureProjection);
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X+i,this.texture, 0);

            gl.viewport(0, 0, 512, 512);

              // Draw the geometry.
            var primitiveType = gl.TRIANGLES;
            var offset = 0;
            var count = 6 * 6;
            gl.drawArrays(primitiveType, offset, count);
        }


        // Form the irradiance_map
        this.filtered_texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.filtered_texture);
        for (var i = 0; i < 6; i++){
            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X+i,
                0,
                gl.RGBA32F,
                32, 32, 0, gl.RGBA, gl.FLOAT, null
            );
        }

        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR); 
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // set up the framebuffers
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, 32, 32);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbo);

        const irradianceShader = new IrradianceShader(gl);
        gl.useProgram(irradianceShader.programInfo.program);
        irradianceShader.setAttributes(gl);
        gl.viewport(0, 0, 32, 32);

        for(var i = 0; i < 6; i++){
            irradianceShader.setUniforms(gl,this.texture,captureViews[i],captureProjection); // pass in the cubemap texture made above
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X+i,this.filtered_texture, 0);

            // Draw the geometry.
            gl.drawArrays(gl.TRIANGLES, 0, 36);
        }
        

        // Return the frame buffer to the canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}