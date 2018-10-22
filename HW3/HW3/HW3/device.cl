
union openCLTestUnion
{
	float f;
	short s;
	char c;
};


struct openCLTestStruct
{
	char c;
	char4 c4;
	union openCLTestUnion uni;
	uint2 u2[4];
};

__kernel void helloParallelWorld(float3 vec3, float4 vec4, float8 vec8, float16 vec16, __global struct openCLTestStruct* ptr_struct) {



	uint glb_x = get_global_id(0);
	uint glb_y = get_global_id(1);

	uint lcl_x = get_local_id(0);
	uint lcl_y = get_local_id(1);

	//uint work_group_id = get_group_id(0)
	printf("Global ID: (%d, %d) | Local ID: (%d, %d)\n", glb_x, glb_y, lcl_x, lcl_y);

	if (glb_x == 2 && glb_y == 2) {
	
		printf("Forward: %.2v4f\n", vec4);
		printf("Reverse: %.2v4f\n", vec4.wzyx);

		printf("Float16: %.2v16f\n", vec16);

	}
}


