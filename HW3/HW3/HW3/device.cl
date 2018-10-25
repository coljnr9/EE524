
union openCLTestUnion
{
	float f;
	short s;
	char c;
};


typedef struct openCLTestStruct
{
	uint2 u2[4];
	char4 c4 ;	
	union { float f; short s; char c; } uni;
	char c;
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
		printf("Float16 hi swizzle: %.2v8f\n", vec16.hi);
		printf("Float16 low swizzle: %.2v8f\n", vec16.lo);
		printf("Float16 even swizzle: %.2v8f\n", vec16.even);
		printf("Float16 odd swizzle: %.2v8f\n", vec16.odd);
		for (uint i = 0; i < 4; i++) { printf("uint2 array[%d]: %v2d\n", i, ptr_struct->u2[i]); }
		printf("openCLTestStruct.uni: %f\n", ptr_struct->uni.f);
		printf("openCLTestStruct.c: %c\n", ptr_struct->c);
		printf("openCLTestStruct.c4: %v4c \n", ptr_struct->c4);

		printf("sizeof(struct): %d\n", sizeof(*ptr_struct));

		uint struct_element_sum = 0;
		struct_element_sum += sizeof(ptr_struct->u2);
		struct_element_sum += sizeof(ptr_struct->c);
		struct_element_sum += sizeof(ptr_struct->c4);
		struct_element_sum += sizeof(ptr_struct->uni);
		printf("Sum of all struct element sizeof()s: %d\n", struct_element_sum);
		printf("sizeof(union): %d\n", sizeof(ptr_struct->uni));
		printf("sizeof(union char): %d\n", sizeof(ptr_struct->uni.c));
	}
}


