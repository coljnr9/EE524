__kernel void vec3dotproduct(int4 a, int4 b, __global int *dotProd) { 
/*
Global/Local size
	1
Inputs
	a = [1, 2, 3, 0]
	b = [4, 5, 6, 0]
Output Validation
	dotProd = 32
*/
	*dotProd = a.x*b.x + a.y*b.y + a.z * b.z;
}
