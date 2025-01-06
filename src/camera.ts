import { mat4, vec3 } from "gl-matrix";

export class Camera{

    fieldOfView: number;
    aspect: number;
    zNear: number;
    zFar: number;
    projectionMatrix: mat4;

    target: vec3 = vec3.fromValues(0.0, 0.0, 0.0);
    radius: number = 7.0;
    azimuth: number = 0.0;
    elevation: number = 0.0;
    gl: WebGL2RenderingContext;

    constructor(gl:WebGL2RenderingContext){
        this.fieldOfView = (450 * Math.PI) / 180; // in radians
        this.aspect = 1.0;
        this.zNear = 0.1;
        this.zFar = 100.0;
        this.projectionMatrix = mat4.create();

        this.gl = gl;

        this.updateProjectionMatrix();
        this.setupEventListers(gl);
    }

    updateProjectionMatrix(){
        this.aspect = 
        (this.gl.canvas as HTMLCanvasElement).clientWidth /
        (this.gl.canvas as HTMLCanvasElement).clientHeight;

        mat4.perspective(this.projectionMatrix, this.fieldOfView, this.aspect, this.zNear, this.zFar);

    }

    getViewMatrix(){
        const viewMatrix = mat4.create();
        // Look at the target from the camera position
        mat4.lookAt(viewMatrix, this.getPosition(), this.target, [0.0, 1.0, 0.0]);
        
        return viewMatrix;
    }

    setupEventListers(gl:WebGL2RenderingContext){
        // Handle user input
        gl.canvas.addEventListener('mousemove', (event: Event) => {
            const mouseEvent = event as MouseEvent;
            console.log("mouse evnet")
            if (mouseEvent.buttons === 1) { // Left button is held down
                this.azimuth += mouseEvent.movementX * 0.01;
                this.elevation -= mouseEvent.movementY * 0.01;
            }
        });
    }

    getPosition(){
        return vec3.fromValues(
                this.radius * Math.sin(this.azimuth) * Math.cos(this.elevation),
                this.radius * Math.sin(this.elevation),
                this.radius * Math.cos(this.azimuth) * Math.cos(this.elevation),
            );
    }

}