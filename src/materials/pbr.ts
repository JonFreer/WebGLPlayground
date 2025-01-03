import { mat3, mat4, vec3 } from "gl-matrix";
import { Camera } from "../camera";
import { setAttribute } from "../draw-scene";
import { Buffers } from "../init-buffers";
import { initShaderProgram } from "../shader-handler";
import { ProgramInfo } from "../webgl-demo";

const vsSource = `# version 300 es

layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTexCoords;

out vec2 TexCoords;
out vec3 WorldPos;
out vec3 Normal;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;
uniform mat3 normalMatrix;

void main()
{
    TexCoords = aTexCoords;
    WorldPos = vec3(model * vec4(aPos, 1.0));
    Normal = normalMatrix * aNormal;   

    gl_Position =  projection * view * vec4(WorldPos, 1.0);
}
   
`;

const fsSource = `# version 300 es

    precision highp float;

    out vec4 FragColor;
    in highp vec2 TexCoords;
    in highp vec3 WorldPos;
    in highp vec3 Normal;

    uniform vec3 camPos;
  
    uniform vec3  albedo;
    uniform float metallic;
    uniform float roughness;
    uniform float ao;

    // lights
    uniform vec3 lightPositions[4];
    uniform vec3 lightColors[4];

    const float PI = 3.14159265359;

    vec3 fresnelSchlick(float cosTheta, vec3 F0){
        return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
    }  

    float DistributionGGX(vec3 N, vec3 H, float roughness)
    {
        float a      = roughness*roughness;
        float a2     = a*a;
        float NdotH  = max(dot(N, H), 0.0);
        float NdotH2 = NdotH*NdotH;
        
        float num   = a2;
        float denom = (NdotH2 * (a2 - 1.0) + 1.0);
        denom = PI * denom * denom;
        
        return num / denom;
    }

    float GeometrySchlickGGX(float NdotV, float roughness)
    {
        float r = (roughness + 1.0);
        float k = (r*r) / 8.0;

        float num   = NdotV;
        float denom = NdotV * (1.0 - k) + k;
        
        return num / denom;
    }
    float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
    {
        float NdotV = max(dot(N, V), 0.0);
        float NdotL = max(dot(N, L), 0.0);
        float ggx2  = GeometrySchlickGGX(NdotV, roughness);
        float ggx1  = GeometrySchlickGGX(NdotL, roughness);
        
        return ggx1 * ggx2;
    }

    void main(){
        vec3 N = normalize(Normal);
        vec3 V = normalize(camPos - WorldPos);

        vec3 Lo = vec3(0.0); //acc light out
        for(int i = 0; i < 4; ++i){
            vec3 L = normalize(lightPositions[i] - WorldPos);
            vec3 H = normalize(V+L);

            float distance = length(lightPositions[i] - WorldPos);
            float attenuation = 1.0 / (distance * distance);
            vec3 radiance = lightColors[i] * attenuation;

            vec3 F0 = vec3(0.04); 
            F0 = mix(F0, albedo, metallic);
            vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);

            float NDF = DistributionGGX(N, H, roughness);       
            float G   = GeometrySmith(N, V, L, roughness); 

            vec3 numerator    = NDF * G * F;
            float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0)  + 0.0001;
            vec3 specular     = numerator / denominator; 

            vec3 kS = F;
            vec3 kD = vec3(1.0) - kS;
            
            kD *= 1.0 - metallic;	

            const float PI = 3.14159265359;
            float NdotL = max(dot(N, L), 0.0);        
            Lo += (kD * albedo / PI + specular) * radiance * NdotL;
        }


        vec3 ambient = vec3(0.03) * albedo * ao;
        vec3 color   = ambient + Lo;  
        color = color / (color + vec3(1.0));
        color = pow(color, vec3(1.0/2.2)); 
        FragColor = vec4(color, 1.0);

    }

    

`;

export class PBRMaterial {
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
        textureCoord: gl.getAttribLocation(shaderProgram, "aTexCoords"),
        vertexNormal: gl.getAttribLocation(shaderProgram, "aNormal"),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, "projection"),
        viewMatrix: gl.getUniformLocation(shaderProgram, "view"),
        modelMatrix: gl.getUniformLocation(shaderProgram, "model"),
        // uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
        normalMatrix: gl.getUniformLocation(shaderProgram, "normalMatrix"),
        albedo: gl.getUniformLocation(shaderProgram, "albedo"),
        metallic: gl.getUniformLocation(shaderProgram, "metallic"),
        roughness: gl.getUniformLocation(shaderProgram, "roughness"),
        ao: gl.getUniformLocation(shaderProgram, "ao"),
        camPos: gl.getUniformLocation(shaderProgram, "camPos"),
        lightPositions: gl.getUniformLocation(shaderProgram, "lightPositions"),
        lightColors: gl.getUniformLocation(shaderProgram, "lightColors"),
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

    // gl.uniform1i(this.programInfo.uniformLocations.uSampler, 0);

    gl.uniform3fv(this.programInfo.uniformLocations.albedo,vec3.fromValues(1.0,0.5,0.5));
    gl.uniform1f(this.programInfo.uniformLocations.metallic,0.0);
    gl.uniform1f(this.programInfo.uniformLocations.roughness,0.2);
    gl.uniform1f(this.programInfo.uniformLocations.ao,0.0);

    gl.uniform3fv(this.programInfo.uniformLocations.camPos,camera.getPosition());

    const lightPositions = [
        vec3.fromValues(-10.0,  10.0, 10.0),
        vec3.fromValues( 10.0,  10.0, 10.0),
        vec3.fromValues(-10.0, -10.0, 10.0),
        vec3.fromValues( 10.0, -10.0, 10.0),
    ].map(vec=>[vec[1],vec[1],vec[2]]).flat()


    const lightColors = [
        vec3.fromValues(300.0, 300.0, 300.0),
        vec3.fromValues(300.0, 300.0, 300.0),
        vec3.fromValues(300.0, 300.0, 300.0),
        vec3.fromValues(300.0, 300.0, 300.0),
    ].map(vec=>[vec[1],vec[1],vec[2]]).flat()


    gl.uniform3fv(this.programInfo.uniformLocations.lightPositions,lightPositions);
    gl.uniform3fv(this.programInfo.uniformLocations.lightColors,lightColors);


  }
}
