export class HDRI {
    texture: WebGLTexture;
    constructor(gl: WebGL2RenderingContext, url: string) {
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        const level = 0;
        const internalFormat = gl.RGBA32F;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.FLOAT;
        const pixel = new Float32Array([0, 0, 1.0, 1.0]); // opaque blue

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
        console.log("dataA")
        image.onload = () => {
            this.parseHDR(image)
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(
                gl.TEXTURE_2D,
                level,
                internalFormat,
                srcFormat,
                srcType,
                image,
            );
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        };
        image.src = url;
    }

    parseHDR(data: HTMLImageElement) {

        console.log("data",data)
        // Parse the HDR data here and return an object with { width, height, data }
        // data should be a Float32Array with RGB values
        // This is a placeholder implementation and needs to be replaced with actual HDR parsing logic
        return {
            width: 512,
            height: 256,
            data: new Float32Array(512 * 256 * 3) // Replace with actual HDR data
        };
    }
}
