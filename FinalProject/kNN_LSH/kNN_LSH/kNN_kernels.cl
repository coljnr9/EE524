// Add you device OpenCL code
__kernel void localitySensitiveHash(__global float16 *p_stable_dist, __global uint *uniform_dist, __global float16 *inputVectors){ 
	int gid;
	int b;
	float16 a, q;
	float hash;
	float dot0, dot1, dot2, dot3;
	gid = get_global_id(0);
	
	a = p_stable_dist[gid];
	q = inputVectors[gid];
	b = uniform_dist[gid];

	dot0 = dot(a.lo.lo, q.lo.lo);
	dot1 = dot(a.lo.hi, q.lo.hi);
	dot2 = dot(a.hi.lo, q.hi.lo);
	dot3 = dot(a.hi.hi, q.hi.hi);
	hash = (dot0 + dot1 + dot2 + dot3 + b) / 4.0f;
	if (gid < 10){ 
		
		printf("Hash: %.4f\n", hash);
	}


	
}
