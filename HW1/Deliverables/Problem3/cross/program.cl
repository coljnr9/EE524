__kernel void vec3crossProduct(int4 a, int4 b, __global int *crossProd){ 
/* 
Implements 3d Cross Product:
 A x B = i(A_y * B_z - A_z * B_y)
		 j(A_z * B_x - A_x * B_z)
		 k(A_x * B_y - A_y * B_x)
Global/Local size
	3
Inputs
	a = [1, 2, 3, 0]
	b = [4, 5, 6, 0]
Outputs expectation
	[-3, 6, -3, 0]
*/
	int outputIdx = get_global_id(0);
	int elementValue;
	crossProd[3] = 0;
	
	if (outputIdx == 0){		
		elementValue = a.y*b.z - a.z*b.y;
		crossProd[outputIdx] = elementValue;
		printf("OutputIdx is: %d, crossProduct is %d\n", outputIdx, elementValue);
	}else if (outputIdx == 1) {
		elementValue = a.z*b.x - a.x*b.z;
		crossProd[outputIdx] = elementValue;
		printf("OutputIdx is: %d, crossProduct is %d\n", outputIdx, elementValue);
	}else if (outputIdx == 2){
		elementValue = a.x*b.y - a.y*b.x;
		crossProd[outputIdx] = elementValue;
		printf("OutputIdx is: %d, crossProduct is %d\n", outputIdx, elementValue);
	}	
}
