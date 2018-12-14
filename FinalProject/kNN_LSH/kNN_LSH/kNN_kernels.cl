
__kernel void localitySensitiveHash(__global float16 *p_stable_dist, __global uint *uniform_dist, __global float16 *inputVectors, __global int *outputHashes){ 
	int gid;
	int b;
	float16 a, q;
	int hash;
	float dot0, dot1, dot2, dot3;
	gid = get_global_id(0);
	
	a = p_stable_dist[gid];
	q = inputVectors[gid];
	b = uniform_dist[gid];

	/* As I write this, it seems really close in # operations to the traditional 
	d_ab = sqrt( (a_0 - b_0)^2 + (a_1 - b_1)^2 ... (a_N - b_N)^2)
	but I guess in this implementation you don't have to do a square root?
	*/
	
	//Paper calls out lambda, a weight vector. I belive this is to weight the "distances" in certain directions more strongly
	// For this implementation, the unit vector is used.
	// Dot only defined for float4 and smaller
	dot0 = dot(a.lo.lo, q.lo.lo);
	dot1 = dot(a.lo.hi, q.lo.hi);
	dot2 = dot(a.hi.lo, q.hi.lo);
	dot3 = dot(a.hi.hi, q.hi.hi);
	hash = floor((dot0 + dot1 + dot2 + dot3 + b) / 4.0f);
	//printf("VECTOR: %.2v16f,  HASH: %d\n", q, hash);
	outputHashes[gid] = hash;
}

__kernel void countHashes(__global int *uniqueHashes, __global int *inputHashes, int N, __global int *numVectors) {
	int *vectorIndices;
	int hash, hashIndex, numMatchingHashes;
	hashIndex = get_global_id(0);

	hash = uniqueHashes[hashIndex];

	// Count all vectors with this hash
	numMatchingHashes = 0;
	for (int i = 0; i < N; i++) {
		if (inputHashes[i] == hash) {
			numMatchingHashes++;
		}
	}
	numVectors[hashIndex] = numMatchingHashes;
}

__kernel void sortVectorsByHash(__global float16 *inputVectors, __global int *allHashes, int N, __global int *uniqueHashes, __global int *numVectors, __global float16 *sortedVectors, int num_unique_hashes, __global int *startIndicies) {
	// Already have hashes (allHashes) and vectors (inputVectors).  Each array gets a unique hash, and puts vectors with matchings hashes into it's vectorListLocation
	int gid = get_global_id(0);

	int hash = uniqueHashes[gid];
	int myStartIdx = 0;

	for (int i = 0; i < num_unique_hashes; i++) {
		if (uniqueHashes[i] == hash) { 
			break;
		}
		else {
			myStartIdx += numVectors[i];			
		}
	}
	startIndicies[gid] = myStartIdx;

	int k = 0;
	for (int i = 0; i < N; i++){ 
		if (allHashes[i] == hash){ 
			sortedVectors[myStartIdx + k] = inputVectors[i];
			k++;
		}
		else {/* Do nothing */ }
	}


}
	

