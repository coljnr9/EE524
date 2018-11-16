// Add you host code
#include <string.h>
#include <string>
#include "CLHelpers.h"
#include "CL/cl.h"
#include "read_source.h"
#define STB_IMAGE_WRITE_IMPLEMENTATION
#include "../../STB/stb-master/stb_image_write.h"

#define STB_IMAGE_IMPLEMENTATION
#include "../../STB/stb-master/stb_image.h"


bool verifyResults(float *p_mappedBufferIN, float *p_mappedBufferOut, int numValues) {
	bool valsEqual = true;
	for (int i = 0; i < numValues; i++) {
		valsEqual &= (2 * p_mappedBufferIN[i] == 2 * p_mappedBufferOut[i]);
	}
	return valsEqual;
}
int main(int argc, char** argv) {
	float cumRuntime = 0.0f;
	float cumSeqRuntime = 0.0f;

	cl_event prof_event;

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


	std::cout << "Running In-class Exercise 8a" << std::endl;
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

							kernel = clCreateKernel(program, "img_conv_filter", &clStatus);
							CL_CHK_ERR(clStatus, "Error creating kernel", "Kernel created successfully");

							/**************************Create Images*******************************************/
							const float gaussBlurFilter[49] = {
								0.0091,0.0132,0.0165,0.0178,0.0165,0.0132,0.0091,
								0.0132,0.0192,0.0239,0.0258,0.0239,0.0192,0.0132,
								0.0165,0.0239,0.0299,0.0322,0.0299,0.0239,0.0165,
								0.0178,0.0258,0.0322,0.0347,0.0322,0.0258,0.0178,
								0.0165,0.0239,0.0299,0.0322,0.0299,0.0239,0.0165,
								0.0132,0.0192,0.0239,0.0258,0.0239,0.0192,0.0132,
								0.0091,0.0132,0.0165,0.0178,0.0165,0.0132,0.0091
								};

							unsigned char* hOutputImg = NULL;
							cl_uint filterWidth = 7;
							int imgRows, imgCols, imgChannels;

							unsigned char *imgdata = NULL;

							std::string inFile = "lena_512x512_32bit";
							std::string inPath = "C:/Temp/Cole/In-class Exercise 8a/In-class Exercise 8a/images/lena_512x512_32bit";
							imgdata = stbi_load(inPath.c_str(), &imgCols, &imgRows, &imgChannels, 0);

							cl_image_desc desc;
							desc.image_type = CL_MEM_OBJECT_IMAGE2D;
							desc.image_width = imgCols;
							desc.image_height = imgRows;
							desc.image_depth = 0;
							desc.image_array_size = 0;
							desc.image_slice_pitch = 0;
							desc.image_row_pitch = 0;
							desc.num_mip_levels = 0;
							desc.num_samples = 0;
							desc.buffer = NULL;

							cl_image_format imgfmt;
							imgfmt.image_channel_order = CL_RGBA;
							imgfmt.image_channel_data_type = CL_UNSIGNED_INT8;

							cl_mem inputImg = clCreateImage(context, CL_MEM_READ_ONLY, &imgfmt, &desc, NULL, &clStatus);
							cl_mem outputImg = clCreateImage(context, CL_MEM_WRITE_ONLY, &imgfmt, &desc, NULL, &clStatus);


							
							size_t origin[3] = { 0,0,0 };  // offset within image to copy from
							size_t region[3] = { imgCols, imgRows, 1 }; // elements per dim
							hOutputImg = (unsigned char*)malloc(imgRows*imgCols * imgChannels * sizeof(unsigned char));

							/**************************Popuplate Kernel Arguements*******************************************/
							//Data

							clStatus = clEnqueueWriteImage(commands, inputImg, CL_TRUE, origin, region, 0, 0, imgdata, 0, NULL, NULL);
							CL_CHK_ERR(clStatus, "Error enqueuing write image", "Write image enqueued successfully");

							clStatus = clSetKernelArg(kernel, 0, sizeof(cl_mem), &inputImg);
							CL_CHK_ERR(clStatus, "Error setting kernel arg 0", "Kernel arg 0 set successfully");


							clStatus = clSetKernelArg(kernel, 1, sizeof(cl_mem), &outputImg);
							CL_CHK_ERR(clStatus, "Error setting kernel arg 1", "Kernel arg 1 set successfully");
							
							clStatus = clSetKernelArg(kernel, 2, sizeof(float) * 49, &gaussBlurFilter);
							CL_CHK_ERR(clStatus, "Error setting kernel arg 1", "Kernel arg 1 set successfully");

							clStatus = clSetKernelArg(kernel, 2, sizeof(cl_uint), &filterWidth);
							CL_CHK_ERR(clStatus, "Error setting kernel arg 1", "Kernel arg 1 set successfully");
							

							std::cout << std::endl << "**************************Execute Kernel*******************************************" << std::endl;
							/**************************Execute Kernel*******************************************/
							clStatus = clEnqueueNDRangeKernel(commands, kernel, 2, NULL, global_work_dim, local_work_dim, 0, NULL, NULL);
							CL_CHK_ERR(clStatus, "Error enqueueing kernel", "Kernel dispatched successfully");

							clFinish(commands);

							/**************************Build MatMul Kernel*******************************************/


						}
					}
				}

				/****Release allllll dat memory***/

				free(platforms);
				free(platform_info);
				free(devices);
				free(device_info);
			}
		}
}


