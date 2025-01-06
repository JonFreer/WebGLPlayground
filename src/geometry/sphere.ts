import { Geometry } from "./geometry";

export class SphereGeometry extends Geometry{

    constructor(x_segments:number, y_segments:number){

        super()

        for ( var x = 0; x <= x_segments; x++)
        {
            for (var y = 0; y <= y_segments; y++)
            {
                var xSegment = x / x_segments;
                var ySegment = y / y_segments;
                var xPos = Math.cos(xSegment * 2.0 * Math.PI) * Math.sin(ySegment * Math.PI);
                var yPos = Math.cos(ySegment * Math.PI);
                var zPos = Math.sin(xSegment * 2 * Math.PI) * Math.sin(ySegment * Math.PI)

                this.positions.push(xPos, yPos, zPos);
                this.uv.push(xSegment, ySegment);
                this.normals.push(xPos, yPos, zPos);
            }
        }

        //set up index buffer
        // var oddRow = false;
        // for(var y = 0; y < y_segments; y++){
        //     if(!oddRow){
        //         for(var x = 0; x <= x_segments; x++){
        //             this.indices.push((y * (x_segments + 1) + x));
        //             this.indices.push((y + 1) * (x_segments + 1) +x);
        //         }
        //     }else{
        //         for(var x = x_segments; x >= 0; x--){
        //             this.indices.push((y + 1) * (x_segments + 1) + x);
        //             this.indices.push(y * (x_segments + 1) + x);
        //         }
        //     }

        //     oddRow = !oddRow;
        // }

        for (var y = 0; y < y_segments; y++) {
            for (var x = 0; x < x_segments; x++) {
                var a = y * (x_segments + 1) + x;
                var b = y * (x_segments + 1) + x + 1;
                var c = (y + 1) * (x_segments + 1) + x;
                var d = (y + 1) * (x_segments + 1) + x + 1;

                this.indices.push(a, b, d);
                this.indices.push(d, c, a);
            }
        }

        this.indexCount = this.indices.length;
    
    }
}