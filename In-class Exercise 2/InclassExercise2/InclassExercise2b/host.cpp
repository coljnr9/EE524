#include "host.h"


//Get platforms
int main(int argc, char** argv){
	cl_int clStatus;
	cl_uint num_platforms;

	cl_platform_id *platforms = NULL;
	cl_platform_id intelPlatform;

	cl_device_id hdGraphicsDevice;

	cl_platform_info *platform_info = NULL;
	cl_device_info *device_info = NULL;

	size_t platform_info_size, device_info_size;

	std::cout << "Running In-class Exercise 2b" << std::endl;
	clStatus = clGetPlatformIDs(NULL, platforms, &num_platforms);
	if (clStatus != CL_SUCCESS) { std::cout << "Error with platform query"; }

	platforms = (cl_platform_id *)malloc(sizeof(cl_platform_id) * num_platforms);
	clStatus = clGetPlatformIDs(num_platforms, platforms, NULL);
	if (clStatus != CL_SUCCESS) { std::cout << "Error with platform query"; }

	for (int i = 0; i < num_platforms; i++) {
		clStatus = clGetPlatformInfo(platforms[i], CL_PLATFORM_NAME, NULL, NULL, &platform_info_size);
		if (clStatus != CL_SUCCESS) { std::cout << "Error getting platform name" << std::endl; }

		platform_info = (cl_platform_info *)malloc(platform_info_size);
		clStatus = clGetPlatformInfo(platforms[i], CL_PLATFORM_NAME, platform_info_size, platform_info, NULL);
		if (clStatus != CL_SUCCESS) { std::cout << "Error getting platform name" << std::endl; }

		if (strcmp((char *)platform_info, "Intel(R) OpenCL") == 0)
		{
			cl_uint num_devices = 0;
			cl_device_id *devices = NULL;
			//Possible platform found
			clStatus = clGetDeviceIDs(platforms[i], CL_DEVICE_TYPE_GPU, NULL, NULL, &num_devices);
			if (clStatus != CL_SUCCESS) { std::cout << "Error getting device IDs 1: " << clStatus; }
			devices = (cl_device_id *)malloc(sizeof(cl_device_id) * num_devices);
			
			if (num_devices > 0) {
				clStatus = clGetDeviceIDs(platforms[i], CL_DEVICE_TYPE_GPU, num_devices, devices, NULL);
				if (clStatus != CL_SUCCESS) { std::cout << "Error getting device IDs 2" << clStatus; }
				
				for (int j = 0; j < num_devices; j++) {
					clStatus = clGetDeviceInfo(devices[j], CL_DEVICE_NAME, NULL, NULL, &device_info_size);
					if (clStatus != CL_SUCCESS) { std::cout << "Error getting device name"; }
					device_info = (cl_device_info *)malloc(device_info_size);

					clStatus = clGetDeviceInfo(devices[j], CL_DEVICE_NAME, device_info_size, device_info, NULL);
					if (clStatus != CL_SUCCESS) { std::cout << "Error getting device name"; }
					
					if (strcmp((char *)device_info, "Intel(R) HD Graphics 530") == 0) {
						//iGPU found
						intelPlatform = platforms[i];
						hdGraphicsDevice = devices[j];						
						std::cout << "Platform: " << (char *)platform_info << ", Device: " << (char *)device_info << std::endl;

						const cl_context_properties properties[] = { CL_CONTEXT_PLATFORM, (cl_context_properties)intelPlatform, 0 };
						cl_context context = clCreateContext(properties, 1, &hdGraphicsDevice, NULL, NULL, &clStatus);
						if (clStatus != CL_SUCCESS) { std::cout << "Error creating context: " << clStatus; }

						cl_command_queue commands = clCreateCommandQueue(context, hdGraphicsDevice, 0, &clStatus);
						if (clStatus != CL_SUCCESS) { std::cout << "Error creating command queue: " << clStatus; }
						/*********************************Starting the kernal building process*******************/

						size_t file_size;
						cl_program program;
						cl_kernel kernel;
						const size_t global_work_dim[3] = { 12, 0, 0 };
						const size_t local_work_dim[3] = { 12, 0, 0 };
						
						const char *kernel_source = read_source("C:\\Users\\coljnr9\\Documents\\Programming\\In-class Exercise 2\\InclassExercise2\\InclassExercise2b\\vecadd_anyD.cl", &file_size);

						program = clCreateProgramWithSource(context, 1, &kernel_source, NULL, &clStatus);
						if (clStatus != CL_SUCCESS) { std::cout << "Problem creating program from source"; }

						clStatus = clBuildProgram(program, 1, &hdGraphicsDevice, "-cl-std=CL2.0", NULL, NULL);
						if (clStatus != CL_SUCCESS) { 
							std::cout << "Error building program: " << clStatus;
							size_t len;
							char buffer[2048];
							clGetProgramBuildInfo(program, hdGraphicsDevice, CL_PROGRAM_BUILD_LOG, sizeof(buffer), buffer, &len);
							std::cout << buffer << std::endl;
						}


						kernel = clCreateKernel(program, "vecadd_anyD", &clStatus);
						if (clStatus != CL_SUCCESS) { std::cout << "Error creating kernel: " << clStatus; }

						float *h_a = (float *)_aligned_malloc(sizeof(float) * LENGTH, 4096);
						float *h_b = (float *)_aligned_malloc(sizeof(float) * LENGTH, 4096);
						float *h_c = (float *)_aligned_malloc(sizeof(float) * LENGTH, 4096);

						for (int j = 0; j < LENGTH; j++) {
							h_a[j] = (float)j;
							h_b[j] = (float)j + 1;
						}

						cl_mem d_a = clCreateBuffer(context, CL_MEM_USE_HOST_PTR, sizeof(float) * LENGTH, h_a, &clStatus);
						if (clStatus != CL_SUCCESS) { std::cout << "Error creating buffer d_a: " << clStatus << std::endl; }
						cl_mem d_b = clCreateBuffer(context, CL_MEM_USE_HOST_PTR, sizeof(float) * LENGTH, h_b, &clStatus);
						if (clStatus != CL_SUCCESS) { std::cout << "Error creating buffer d_b: " << clStatus << std::endl; }
						cl_mem d_c = clCreateBuffer(context, CL_MEM_USE_HOST_PTR|CL_MEM_READ_WRITE, sizeof(float) * LENGTH, h_c, &clStatus);
						if (clStatus != CL_SUCCESS) { std::cout << "Error creating buffer d_c: " << clStatus << std::endl; }
						
						clStatus = clSetKernelArg(kernel, 0, sizeof(cl_mem), &d_a);
						if (clStatus != CL_SUCCESS) { std::cout << "Error setting arg 0:" << clStatus << std::endl; }
						
						clStatus = clSetKernelArg(kernel, 1, sizeof(cl_mem), &d_b);
						if (clStatus != CL_SUCCESS) { std::cout << "Error setting arg 1:" << clStatus << std::endl; }
						
						clStatus = clSetKernelArg(kernel, 2, sizeof(cl_mem), &d_c);
						if (clStatus != CL_SUCCESS) { std::cout << "Error setting arg 2:" << clStatus << std::endl; }
												
						std::cout << std::endl;
						/**************************Execute Kernel*******************************************/
						clStatus = clEnqueueNDRangeKernel(commands, kernel, 1, NULL, global_work_dim, local_work_dim, 0, NULL, NULL);
						if (clStatus != CL_SUCCESS) { std::cout << "Error creating EnqueueNDRangeKernel thing: " << clStatus << std::endl; }

						clFinish(commands);	

						cl_map_flags MapFlags(CL_MAP_READ);
						h_c = (float *)clEnqueueMapBuffer(commands, d_c, CL_FALSE, MapFlags, 0, sizeof(float) * LENGTH, 0, NULL, NULL, &clStatus);
						if (clStatus != CL_SUCCESS) { std::cout << "Error creating clEnqueueMapBuffer thing: " << clStatus << std::endl; }
						
						std::cout << "Input buffer A:\t\t[";
						for (int i = 0; i < LENGTH-1; i++) {
							std::cout << h_a[i] << ", ";
						}
						std::cout << h_a[LENGTH - 1] << "]" << std::endl;

						std::cout << "Input buffer B:\t\t[";
						for (int i = 0; i < LENGTH - 1; i++) {
							std::cout << h_b[i] << ", ";
						}
						std::cout << h_b[LENGTH - 1] << "]" << std::endl;

						std::cout << "Output buffer C:\t[";
						for (int i = 0; i < LENGTH - 1; i++) {
							std::cout << h_c[i] << ", ";
						}
						std::cout << h_c[LENGTH - 1] << "]" << std::endl;					

						clEnqueueUnmapMemObject(commands, d_c, h_c, 0, NULL, NULL);

						_aligned_free(h_a);
						_aligned_free(h_b);
						_aligned_free(h_c);
						free((void *)kernel_source);
						free(devices);
					}
				}
			}
		}
	}
	/****Release allllll dat memory***/
	free(platforms);
	free(platform_info);

	free(device_info);


}