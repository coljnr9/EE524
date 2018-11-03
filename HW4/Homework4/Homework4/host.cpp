#include "host.hpp"


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

	std::cout << "Running In-class Exercise 4" << std::endl;
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

							cl_command_queue commands = clCreateCommandQueue(context, hdGraphicsDevice, CL_QUEUE_PROFILING_ENABLE, &clStatus);
							CL_CHK_ERR(clStatus, "Error creating commands queue", "Commands queue created successfully");

							/*********************************Starting the kernal building process*******************/
							std::cout << std::endl << "*********************************Starting the kernal building process*******************" << std::endl;
							std::string kernel_source_path = R"(device.cl)";
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

							kernel = clCreateKernel(program, "img_rotate", &clStatus);
							CL_CHK_ERR(clStatus, "Error creating kernel", "Kernel created successfully");

							/**************************Popuplate Kernel Arguements*******************************************/
							//Data
							/*
							- Create buffers
							- Set args
							- Enqueue kernel
							- retrieve results
							*/
						
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

