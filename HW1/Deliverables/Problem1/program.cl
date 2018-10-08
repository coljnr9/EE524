__kernel void vecadd2d (__global float *a, __global float *b, __global float *c){ 
/*  Input vector is          [1, 2, ..., 12]' 
	Output validation set is [2, 4, ..., 24]' 
	for all dimensions*/
	int num_dimensions = get_work_dim();
	int gidx = get_global_id(0);
	int gidy = get_global_id(1);
	int gidz = get_global_id(2);
	int Nx, Ny, Nz, idx;

	switch (num_dimensions){ 
	case 1:
	//x: 12, y: 0, z: 0
		idx = gidx;
		c[idx] = a[idx] + b[idx];
	break;
	case 2:
	//x: 4, y: 3, z: 0
		Nx = 4; //width
		idx = Nx * gidy + gidx;
		c[idx] = a[idx] + b[idx];
	break;
	case 3:
	//x: 2, y: 2, z:4
		Nx = 2;
		Ny = 2;
		idx = Nx*Ny*gidz + Nx*gidy + gidx;
		c[idx] = a[idx] + b[idx];
	break;
	}


}
 