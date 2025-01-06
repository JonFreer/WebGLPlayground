import {initBuffers} from "./init-buffers"
import { drawScene } from "./draw-scene";
import { fetchAndParseOBJ, Model } from "./load-model";
import { BasicMaterial } from "./shaders/basic";
import { PBRMaterial } from "./shaders/pbr";
import { Camera } from "./camera";
import { HDRI } from "./hdri";
import { CubeMap } from "./cubemap";
import { SkyBox } from "./shaders/skybox";
import { PBRIBLMaterial } from "./shaders/pbr_ibl";
import { SphereGeometry } from "./geometry/sphere";
import { Mesh } from "./mesh";


export interface ProgramInfo {
  program: WebGLProgram;
  attribLocations: {
    vertexPosition: GLint;
    vertexColor: GLint;
    textureCoord: GLint;
    vertexNormal: GLint;
  };
  uniformLocations: {
    projectionMatrix: WebGLUniformLocation | null;
    viewMatrix: WebGLUniformLocation | null;
    modelMatrix: WebGLUniformLocation | null;
    uSampler: WebGLUniformLocation | null;
    normalMatrix: WebGLUniformLocation | null;
  };
}

let squareRotation = 0.0;
let deltaTime = 0;

main();

//
// start here
//
async function main() {


  const canvas = document.querySelector("#gl-canvas") as HTMLCanvasElement;

  if (!canvas) {
    alert("Unable to find the canvas element.");
    return;
  }

  const gl = canvas.getContext("webgl2");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  const ext = gl.getExtension('EXT_color_buffer_float') && gl.getExtension("OES_texture_float_linear")
  if(ext == null){
    alert(
      "Extensions not supported"
    );
    return
  }

  console.log("ext", ext)

    // Initialize the GL context
    window.addEventListener('resize', resizeCanvas);

    // Function to resize the canvas and adjust the viewport
    function resizeCanvas() {
      // Set the canvas width and height to match the window size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if(gl!=null){
        // Update the WebGL viewport to match the new canvas size
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      }
    }

    resizeCanvas()
  
  
  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const pbrMaterial = new PBRIBLMaterial(gl);
  // const pbrMaterial = new BasicMaterial(gl);
  // Collect all the info needed to use the shader program.
  // Look up which attribute our shader program is using
  // for aVertexPosition and look up uniform locations.

  

  // Here's where we call the routine that builds all the
// objects we'll be drawing.
// const buffers = initBuffers(gl);
const camera = new Camera(gl);
// const model = fetchAndParseOBJ(gl, "/backpack/backpack.obj")

console.log(new SphereGeometry(64,64))
const sphere  = new Mesh(gl,new SphereGeometry(64,64),"sphere");
const model: Model = {meshes: [sphere]}

// const texture = new HDRI(gl, "/backpack/diffuse.jpg");
const hdri = new HDRI(gl, "/sisulu_2k.hdr");
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

await hdri.loadHDR(gl,"/qwantani_dusk_1_2k.hdr")

// gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
const cubemap = new CubeMap(gl,hdri.texture);
const skybox = new SkyBox(gl,cubemap);
// Flip image pixels into the bottom-to-top order that WebGL expects.

// Draw the scene
let then = 0;

// Draw the scene repeatedly
function render(now:number) {
  now *= 0.001; // convert to seconds
  deltaTime = now - then;
  then = now;

  drawScene(gl as WebGL2RenderingContext, pbrMaterial,skybox, model, hdri.texture, squareRotation,camera);
  // squareRotation += deltaTime;

  requestAnimationFrame(render);
}

requestAnimationFrame(render);
}


//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function loadTexture(gl:WebGL2RenderingContext, url:string) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because images have to be downloaded over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel,
  );

  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image,
    );

    // WebGL1 has different requirements for power of 2 images
    // vs. non power of 2 images so check if the image is a
    // power of 2 in both dimensions.
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Yes, it's a power of 2. Generate mips.
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // No, it's not a power of 2. Turn off mips and set
      // wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  };
  image.src = url;

  return texture;
}

function isPowerOf2(value:number) {
  return (value & (value - 1)) === 0;
}