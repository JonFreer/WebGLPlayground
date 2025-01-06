import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import parseHDR from 'parse-hdr';
export class HDRI {
    texture: WebGLTexture;
    level: number = 0;
    internalFormat: number = 0;
    border: number = 0;
    srcFormat: number;
    srcType:number;

    constructor(gl: WebGL2RenderingContext, url: string) {
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        this.internalFormat = gl.RGBA32F;

        this.border = 0;
        this.srcFormat = gl.RGBA;
        this.srcType = gl.FLOAT;
        const pixel = new Float32Array([0, 1.0, 1.0, 1.0]); // opaque blue

        gl.texImage2D(
            gl.TEXTURE_2D,
            this.level,
            this.internalFormat,
            1,
            1,
            this.border,
            this.srcFormat,
            this.srcType,
            pixel,
        );

        // this.loadHDR(gl, url, this.level, this.internalFormat, this.border, srcFormat, srcType);
        // console.log("loaded hdr")
    }

    async loadHDR(gl: WebGL2RenderingContext, url: string, ) {
        const response = await fetch(url);
        const hdrData = await response.arrayBuffer();
        const hdrImage = parseHDR(hdrData);
        console.log("data", hdrImage);

        gl.texImage2D(
            gl.TEXTURE_2D,
            this.level,
            this.internalFormat,
            hdrImage.shape[0],
            hdrImage.shape[1],
            this.border,
            this.srcFormat,
            this.srcType,
            hdrImage.data,
        );

        gl.generateMipmap(gl.TEXTURE_2D);
    }
}