__kernel void saxpy1d(float a, __global float* x, __global float* y, __global float* z){ 
	/* 
	Global dimensions:
		{12, 0, 0}
	Input Buffers
		x = y = [1, 2, ..., 12]
		a = 4
	Output validation
		[5,10, ..., 60]
	*/
	int gidx = get_global_id(0);
	z[gidx] = a*x[gidx] + y[gidx];
}
