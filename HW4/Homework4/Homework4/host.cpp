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
							// Load image
							int img_width, img_height, img_channels;
							cl_image_format img_format;
							cl_image_desc img_description;
							size_t global_work_size[3] = { 850, 850, 0 };
							size_t local_work_size[3] = { 5, 5, 0 };
							cl_float theta = 30;

							
							const unsigned char *boat_image = stbi_load("Big_Gray-Lena_8bit.png", &img_width, &img_height, &img_channels, STBI_grey);
							unsigned char *rotated_image[sizeof(boat_image)];
							img_format.image_channel_data_type = CL_UNSIGNED_INT8;
							img_format.image_channel_order = CL_RGBA;
							img_description.image_type = CL_MEM_OBJECT_IMAGE2D;
							img_description.image_width = img_width;
							img_description.image_height = img_height;
							img_description.image_depth = 0;
							img_description.image_row_pitch = 0;
							img_description.image_slice_pitch = 0;
							//create buffers??W
							cl_mem input_mem_image = clCreateImage2D(context, 
								CL_MEM_ALLOC_HOST_PTR | CL_MEM_READ_ONLY,
								&img_format, 
								img_description.image_width,
								img_description.image_height, 
								0, 
								(void *)boat_image, 
								&clStatus);
							CL_CHK_ERR(clStatus, "Error creatimg image", "Image created successfully");

							cl_mem output_mem_image = clCreateImage2D(context,
								CL_MEM_ALLOC_HOST_PTR |  CL_MEM_WRITE_ONLY,
								&img_format,
								img_description.image_width,
								img_description.image_height,
								0,
								(void *)rotated_image,
								&clStatus);

							clStatus = clSetKernelArg(kernel, 0, sizeof(cl_mem), &input_mem_image);
							CL_CHK_ERR(clStatus, "Error setting kernel arg 0", "Kernel arg 0 set successfully");
							clStatus = clSetKernelArg(kernel, 1, sizeof(cl_mem), &output_mem_image);
							CL_CHK_ERR(clStatus, "Error setting kernel arg 1", "Kernel arg 1 set successfully");
							clStatus = clSetKernelArg(kernel, 2, sizeof(img_description.image_width), &img_description.image_width);
							CL_CHK_ERR(clStatus, "Error setting kernel arg 2", "Kernel arg 2 set successfully");
							clStatus = clSetKernelArg(kernel, 3, sizeof(img_description.image_height), &img_description.image_height);
							CL_CHK_ERR(clStatus, "Error setting kernel arg 3", "Kernel arg 3 set successfully");
							clStatus = clSetKernelArg(kernel, 4, sizeof(cl_float), &theta);
							CL_CHK_ERR(clStatus, "Error setting kernel arg 4", "Kernel arg 4 set successfully");

							clStatus = clEnqueueNDRangeKernel(commands, kernel, 2, 0, global_work_size, local_work_size, NULL, NULL, NULL);
							CL_CHK_ERR(clStatus, "NDRangeKernel failed", "NDRangeKernel queued successfully");

							 // Map memory buffer to host address space?
							
							stbi_write_png("output.png", img_width, img_height, 4, rotated_image, 4 * img_width);
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

