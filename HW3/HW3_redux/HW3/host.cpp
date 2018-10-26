#include "host.hpp"
#define N 512

bool verifyResults(float *p_mappedBufferIN, float *p_mappedBufferOut, int numValues) {
	bool valsEqual = true;
	for (int i = 0; i < numValues; i++) {
		valsEqual &= (2 * p_mappedBufferIN[i] == 2 * p_mappedBufferOut[i]);
	}
	return valsEqual;
}
int main(int argc, char** argv) {

	
	cl_int clStatus;
	cl_uint num_platforms;

	cl_platform_id *platforms = NULL;
	cl_device_id *devices = NULL;

	cl_uint num_devices = 0;

	cl_platform_info *platform_info = NULL;
	cl_device_info *device_info = NULL;

	size_t platform_info_size, device_info_size, file_size;

	cl_platform_id intelPlatform;
	cl_device_id hdGraphicsDevice;

	cl_kernel kernel;
	cl_program program;

	const size_t global_work_dim[3] = { 5, 5, 0 };
	const size_t local_work_dim[3] = { 1, 1, 0 };

	cl_float *h_A = (cl_float*)_aligned_malloc(N*N * sizeof(cl_float), 4096);
	cl_float *h_B = (cl_float*)_aligned_malloc(N*N * sizeof(cl_float), 4096);
	cl_float *h_C = (cl_float*)_aligned_malloc(N*N * sizeof(cl_float), 4096);

	union openCLTestUnion
	{
		cl_float f;
		cl_short s;
		cl_char c;
	};

	struct openCLTestStruct
	{
		cl_uint2 u2[4];										/*8 bytes*/		
		cl_char4 c4;									    /*4 bytes*/
		union {	cl_float f; cl_short s; cl_char c; } uni;	/*4 bytes max*/
		cl_char c;											/*1 byte*/
	
	};




	std::cout << "Running In-class Exercise 2b" << std::endl;
	std::cout << std::endl << "*********************************Querying device info*******************" << std::endl;
	clStatus = clGetPlatformIDs(NULL, platforms, &num_platforms);
	CL_CHK_ERR(clStatus, "Error with platform query", "Platform ID queried successfully")

		platforms = (cl_platform_id *)malloc(sizeof(cl_platform_id) * num_platforms);
	clStatus = clGetPlatformIDs(num_platforms, platforms, NULL);
	CL_CHK_ERR(clStatus, "Error with platform query", "Platform IDs retrieved succesfully")

		for (int i = 0; i < num_platforms; i++) {
			clStatus = clGetPlatformInfo(platforms[i], CL_PLATFORM_NAME, NULL, NULL, &platform_info_size);
			CL_CHK_ERR(clStatus, "Error getting platform name", "Platform name size retrieved successfully")

				platform_info = (cl_platform_info *)malloc(platform_info_size);
			clStatus = clGetPlatformInfo(platforms[i], CL_PLATFORM_NAME, platform_info_size, platform_info, NULL);
			CL_CHK_ERR(clStatus, "Error getting platform name", "Platform name retrieved successfully");

			if (strcmp((char *)platform_info, "Intel(R) OpenCL") == 0)
			{

				//Possible platform found
				clStatus = clGetDeviceIDs(platforms[i], CL_DEVICE_TYPE_GPU, NULL, NULL, &num_devices);
				CL_CHK_ERR(clStatus, "Error getting number of devices", "Device count retrieved successfully");
				devices = (cl_device_id *)malloc(sizeof(cl_device_id) * num_devices);

				if (num_devices > 0) {
					clStatus = clGetDeviceIDs(platforms[i], CL_DEVICE_TYPE_GPU, num_devices, devices, NULL);
					CL_CHK_ERR(clStatus, "Error getting device IDs", "Device IDs retrieved successfully");

					for (int j = 0; j < num_devices; j++) {
						clStatus = clGetDeviceInfo(devices[j], CL_DEVICE_NAME, NULL, NULL, &device_info_size);
						CL_CHK_ERR(clStatus, "Error getting device name size", "Device name size retrieved successfully");
						device_info = (cl_device_info *)malloc(device_info_size);

						clStatus = clGetDeviceInfo(devices[j], CL_DEVICE_NAME, device_info_size, device_info, NULL);
						CL_CHK_ERR(clStatus, "Error getting device name", "Device name retrieved successfully");

						if (strcmp((char *)device_info, "Intel(R) HD Graphics 530") == 0) {
							//iGPU found
							intelPlatform = platforms[i];
							hdGraphicsDevice = devices[j];
							std::cout << "Platform: " << (char *)platform_info << ", Device: " << (char *)device_info << std::endl;

							const cl_context_properties properties[] = { CL_CONTEXT_PLATFORM, (cl_context_properties)intelPlatform, 0 };
							cl_context context = clCreateContext(properties, 1, &hdGraphicsDevice, NULL, NULL, &clStatus);
							CL_CHK_ERR(clStatus, "Error creating context", "Context created successfully");

							cl_command_queue commands = clCreateCommandQueue(context, hdGraphicsDevice, 0, &clStatus);
							CL_CHK_ERR(clStatus, "Error creating commands queue", "Commands queue created successfully");

							/*********************************Starting the kernal building process*******************/
							std::cout << std::endl << "*********************************Starting the kernal building process*******************" << std::endl;
							std::string kernel_source_path = R"(../device.cl)";
							const char *kernel_source = read_source(kernel_source_path.c_str(), &file_size);
							if (!kernel_source) {
								std::cout << "Some error occurred reading the source file... " << strerror(errno) << std::endl;
							}

							program = clCreateProgramWithSource(context, 1, &kernel_source, NULL, &clStatus);
							CL_CHK_ERR(clStatus, "Problem creating program from source", "Program created from source successfully");

							clStatus = clBuildProgram(program, 1, &hdGraphicsDevice, "-cl-std=CL2.0", NULL, NULL);
							if (clStatus != CL_SUCCESS) {
								std::cout << "Error building program: " << getCLErrorString(clStatus) << std::endl;
								size_t len;

								clStatus = clGetProgramBuildInfo(program, hdGraphicsDevice, CL_PROGRAM_BUILD_LOG, 0, NULL, &len);
								CL_CHK_ERR(clStatus, "Problem retrieving build log size", "Build log size retrieved successfully");
								char *buffer = (char *)malloc(len);

								clStatus = clGetProgramBuildInfo(program, hdGraphicsDevice, CL_PROGRAM_BUILD_LOG, len, buffer, NULL);
								CL_CHK_ERR(clStatus, "Problem retrieving build log", "Build log retrieved successfully");
								std::cout << buffer << std::endl;
							}

							kernel = clCreateKernel(program, "helloParallelWorld", &clStatus);
							CL_CHK_ERR(clStatus, "Error creating kernel", "Kernel created successfully");

							/**************************Popuplate Kernel Arguements*******************************************/
							//Data
							openCLTestStruct test_struct;
							cl_char4 char_vec = { 'A', 'B', 'C','D' };
							test_struct.c = 'M';							
							test_struct.c4 = char_vec;
							test_struct.uni.s = 42;
							cl_uint2 u2[4] = { {1, 2}, {2,3}, {3,4}, {4,5} };
							for (int m = 0; m < 4; m++) {
								test_struct.u2[m] = u2[m];
							}
							
							const openCLTestStruct* struct_ptr = &test_struct;
							cl_float3 f3 = { 0.0f, 1.1f, 2.2f };
							cl_float4 f4 = { 3.3f, 4.4f, 5.5f, 6.6f };
							cl_float8 f8 = { 0.1f, 1.2f, 2.3f, 3.4f, 4.5f, 5.6f, 6.7f, 7.8f };
							cl_float16 f16 = { 0.0f, 1.0f, 2.0f, 3.0f, 4.0f, 5.0f, 6.0f, 7.0f, 8.0f, 9.0f, 10.0f, 11.0f, 12.0f, 13.0f, 14.0f, 15.0f };


							cl_mem d_f3 = clCreateBuffer(context, CL_MEM_USE_HOST_PTR, sizeof(cl_float3), &f3, &clStatus);
							CL_CHK_ERR(clStatus, "Error creating f3 buffer", "f3 buffer created successfully");

							cl_mem d_f4 = clCreateBuffer(context, CL_MEM_USE_HOST_PTR, sizeof(cl_float4), &f4, &clStatus);
							CL_CHK_ERR(clStatus, "Error creating f4 buffer", "f4 buffer created successfully");

							cl_mem d_f8 = clCreateBuffer(context, CL_MEM_USE_HOST_PTR, sizeof(cl_float8), &f8, &clStatus);
							CL_CHK_ERR(clStatus, "Error creating f8 buffer", "f8 buffer created successfully");

							cl_mem d_ptr_struct = clCreateBuffer(context, CL_MEM_USE_HOST_PTR, sizeof(openCLTestStruct), &test_struct, &clStatus);
							CL_CHK_ERR(clStatus, "Error creating struct buffer", "Struct buffer created successfully");

							clStatus = clSetKernelArg(kernel, 0, sizeof(cl_float3), &f3);
							CL_CHK_ERR(clStatus, "Error setting kernel arg 0", "Kernel arg 0 set successfully");


							clStatus = clSetKernelArg(kernel, 1, sizeof(cl_float4), &f4);
							CL_CHK_ERR(clStatus, "Error setting kernel arg 1", "Kernel arg 1 set successfully");

							clStatus = clSetKernelArg(kernel, 2, sizeof(cl_float8), &f8);
							CL_CHK_ERR(clStatus, "Error setting kernel arg 2", "Kernel arg 2 set successfully");
							
							clStatus = clSetKernelArg(kernel, 3, sizeof(cl_float16), &f16);
							CL_CHK_ERR(clStatus, "Error setting kernel arg 3", "Kernel arg 3 set successfully");

							clStatus = clSetKernelArg(kernel, 4, sizeof(cl_mem), &d_ptr_struct);
							CL_CHK_ERR(clStatus, "Error setting kernel arg 4", "Kernel arg 3 set successfully");
					
							std::cout << std::endl << "**************************Execute Kernel*******************************************" << std::endl;
							/**************************Execute Kernel*******************************************/
							clStatus = clEnqueueNDRangeKernel(commands, kernel, 2, NULL, global_work_dim, local_work_dim, 0, NULL, NULL);
							CL_CHK_ERR(clStatus, "Error enqueueing kernel", "Kernel dispatched successfully");

							clFinish(commands);

							/**************************Build MatMul Kernel*******************************************/
							std::cout << std::endl << "*********************************Starting the MatMul kernel building process*******************" << std::endl;

							size_t matmul_file_size;
							const char* matmul_kernel_source = read_source(R"(../MatMul_opt1.cl)", &matmul_file_size);
							
							if (!matmul_kernel_source) {
								std::cout << "Some error occurred reading the source file... " << strerror(errno) << std::endl;
							}

							cl_program matmul_program = clCreateProgramWithSource(context, 1, &matmul_kernel_source, NULL, &clStatus);
							CL_CHK_ERR(clStatus, "Problem creating program from source", "Program created from source successfully");
						
							clStatus = clBuildProgram(matmul_program, 1, &hdGraphicsDevice, "-cl-std=CL2.0", NULL, NULL);
							if (clStatus != CL_SUCCESS) {
								std::cout << "Error building program: " << getCLErrorString(clStatus) << std::endl;
								size_t len;

								clStatus = clGetProgramBuildInfo(program, hdGraphicsDevice, CL_PROGRAM_BUILD_LOG, 0, NULL, &len);
								CL_CHK_ERR(clStatus, "Problem retrieving build log size", "Build log size retrieved successfully");
								char *buffer = (char *)malloc(len);

								clStatus = clGetProgramBuildInfo(program, hdGraphicsDevice, CL_PROGRAM_BUILD_LOG, len, buffer, NULL);
								CL_CHK_ERR(clStatus, "Problem retrieving build log", "Build log retrieved successfully");
								std::cout << buffer << std::endl;
							}
							else { std::cout << "Program built successfully!" << std::endl; }
							
							cl_kernel matmul_kernel = clCreateKernel(matmul_program, "MatMul_opt1", &clStatus);
							CL_CHK_ERR(clStatus, "Error creating kernel", "Kernel created successfully");

							/**************************Populate MatMul Kernel Arguments*******************************************/
							std::cout << std::endl << "*********************************Populate MatMul Kernel Arguments*******************" << std::endl;
							

							
							for (cl_int m = 0; m < N*N; m++) {
								h_A[m] = (cl_float)1;
								h_B[m] = (cl_float)1;
							}						

							cl_mem d_A = clCreateBuffer(context, CL_MEM_USE_HOST_PTR, sizeof(h_A), &h_A, &clStatus);
							CL_CHK_ERR(clStatus, "Error creating d_A buffer", "d_A buffer created successfully");
							cl_mem d_B = clCreateBuffer(context, CL_MEM_USE_HOST_PTR, sizeof(h_B), &h_B, &clStatus);
							CL_CHK_ERR(clStatus, "Error creating d_B buffer", "d_B buffer created successfully");
							cl_mem d_C = clCreateBuffer(context, CL_MEM_USE_HOST_PTR, sizeof(h_C), &h_C, &clStatus);
							CL_CHK_ERR(clStatus, "Error creating d_C buffer", "d_C buffer created successfully");
							
							cl_uint matMul_N = N;
							clStatus = clSetKernelArg(matmul_kernel, 0, sizeof(cl_uint), &matMul_N);
							CL_CHK_ERR(clStatus, "Error setting kernel arg 0", "Kernel arg 0 set successfully");
							clStatus = clSetKernelArg(matmul_kernel, 1, sizeof(d_A), &d_A);
							CL_CHK_ERR(clStatus, "Error setting kernel arg 1", "Kernel arg 1 set successfully");
							clStatus = clSetKernelArg(matmul_kernel, 2, sizeof(d_B), &d_B);
							CL_CHK_ERR(clStatus, "Error setting kernel arg 2", "Kernel arg 2 set successfully");
							clStatus = clSetKernelArg(matmul_kernel, 3, sizeof(d_C), &d_C);
							CL_CHK_ERR(clStatus, "Error setting kernel arg 3", "Kernel arg 3 set successfully");

							
							/**************************Execute Kernel*******************************************/
							std::cout << std::endl << "**************************Execute Kernel*******************************************" << std::endl;
							clStatus = clEnqueueNDRangeKernel(commands, matmul_kernel, 2, NULL, global_work_dim, local_work_dim, 0, NULL, NULL);
							CL_CHK_ERR(clStatus, "Error enqueueing kernel", "Kernel dispatched successfully");

							clFinish(commands);
							cl
							std::cout << std::endl << "*********************************Done with work for Intel platform*******************" << std::endl;
						}
					}
				}
			}
		}

	/****Release allllll dat memory***/

	free(platforms);
	free(platform_info);
	free(devices);
	free(device_info);
}

