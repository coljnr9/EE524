

#include "host.hpp"
#include "../../common_ocl_code/read_source.h"
#include "CLHelpers.h"

#include <CL/cl.h> 

#define SEPARATOR       ("----------------------------------------------------------------------\n") 
#define INTEL_PLATFORM  "Intel(R) OpenCL" 

using namespace std;

// get platform id of Intel OpenCL platform 
cl_platform_id get_intel_platform(const string platformName);

// read the kernel source code from a given file name 
//char* read_source(const char *file_name, size_t* file_size); 

// print the build log in case of failure 
void build_fail_log(cl_program, cl_device_id);
const int kernel_width = 5;
const float gaussBlurFilter_5x5[kernel_width * kernel_width] = {
1.0f / 273.0f, 4.0f / 273.0f, 7.0f / 273.0f, 4.0f / 273.0f, 1.0f / 273.0f,
4.0f / 273.0f, 16.0f / 273.0f, 26.0f / 273.0f, 16.0f / 273.0f, 4.0f / 273.0f,
7.0f / 273.0f, 26.0f / 273.0f, 41.0f / 273.0f, 26.0f / 273.0f, 7.0f / 273.0f,
4.0f / 273.0f, 16.0f / 273.0f, 26.0f / 273.0f, 16.0f / 273.0f, 4.0f / 273.0f,
1.0f / 273.0f, 4.0f / 273.0f, 7.0f / 273.0f, 4.0f / 273.0f, 1.0f / 273.0f
};
int main(int argc, char** argv)
{
	cl_int err;                             // error code returned from api calls 
	cl_platform_id   platform = NULL;   // platform id 
	cl_device_id     device_id = NULL;   // compute device id  
	cl_context       context = NULL;   // compute context 
	cl_program       program = NULL;   // compute program 

	string CLFileName;
	string CLKernelName;
	string outFilename;
	string inFile;
	string inPath = "C:/Users/Cole Rogers/Pictures/EE524/";
	string outPath = "C:/Users/Cole Rogers/Pictures/EE524/";


	float* hInputImg = NULL;
	float* hOututImg = NULL;

	float theta = 45.0f;  // rotation angle, degrees.

	int imgRows = 512;
	int imgCols = 512;
	int imgChannels;

	int runtype = 0;

	unsigned char *imgdata = NULL;
	// REMEMBER: stbi_image_free(imgdata);
	unsigned char *hOutputImg = NULL;

	int dim0 = 2;
	
	size_t global0[3];
	size_t local0[3];

	//For profiling
	LARGE_INTEGER perfFreq, perfCountStart, perfCountStop;
	float cumRuntime = 0.0;
	float cumSeqRuntime = 0.0;
	float execTime, mean, variance, stddev;
	float timeSamples[100];

	if (argc < 2)
	{
		printf("ERROR Invalid usage of program. Requires at least 2 command line parameter inputs! Exiting...\n");
		return 0;
	}
	else
	{
		runtype = atoi(argv[1]);
		switch (runtype)
		{
		case 1:  // Rotation kernel
			if (argc != 5)
			{
				printf("ERROR Invalid usage of program. Requires 3 command line inputs: runtype theta infile outfile! Exiting...\n");
				return 0;
			}
			CLFileName = "device.cl";
			CLKernelName = "img_rotate";
			dim0 = 2;

			theta = atof(argv[2]);
			inFile = argv[3];
			outFilename = argv[4];			
			imgdata = stbi_load(inPath.append(inFile).c_str(), &imgCols, &imgRows, &imgChannels, 0);
			global0[0] = imgCols; global0[1] = imgRows; global0[2] = 0;
			local0[0] = 32; local0[1] = 2; local0[2] = 0;
			hOutputImg = (unsigned char*)malloc(imgRows*imgCols * imgChannels * sizeof(unsigned char));
			printf("img_rotate: Runtype = %d Kernel File: %s, Kernel Function: %s, Rotation Angle: %f (degrees), infile: %s, outputfile: %s\n", runtype, CLFileName.c_str(), CLKernelName.c_str(), theta, inFile.c_str(), outFilename.c_str());
			break;
		case 2: // Convolutional kernel
			CLFileName = "device.cl";
			CLKernelName = "img_conv_filter";
			dim0 = 2;
			global0[0] = imgCols; global0[1] = imgRows; global0[2] = 0;
			local0[0] = 32; local0[1] = 2; local0[2] = 0;
			theta = atof(argv[2]);
			inFile = argv[3];
			outFilename = argv[4];
			imgdata = stbi_load(inPath.append(inFile).c_str(), &imgCols, &imgRows, &imgChannels, 0);
			hOutputImg = (unsigned char*)malloc(imgRows*imgCols * imgChannels * sizeof(unsigned char));
			printf("img_conv_filter: Runtype = %d Kernel File: %s, Kernel Function: %s, Rotation Angle: %f (degrees), infile: %s, outputfile: %s\n", runtype, CLFileName.c_str(), CLKernelName.c_str(), theta, inFile.c_str(), outFilename.c_str());			
			break;
		case 3: // serial implementation'
			std::cout << "Running serial implementation" << std::endl;
			inFile = argv[3];
			outFilename = argv[4];
			std::cout << "Input file is: " << inFile << std::endl;


			for (int rpts = 0; rpts < NUM_KERNEL_REPEATS; rpts++) {
				QueryPerformanceCounter(&perfCountStart);
				serial_gaussian_blur(inFile, gaussBlurFilter_5x5, outFilename);
				QueryPerformanceCounter(&perfCountStop);
				QueryPerformanceFrequency(&perfFreq);
				execTime = 1000.0f * (float)(perfCountStop.QuadPart - perfCountStart.QuadPart) / (float)perfFreq.QuadPart;
				timeSamples[rpts] = execTime;
			}
			mean = 0.0f;
			for (int i = 0; i < NUM_KERNEL_REPEATS; i++) {
				mean += timeSamples[i];
			}
			mean /= NUM_KERNEL_REPEATS;
			variance = 0.0f;
			for (int i = 0; i < NUM_KERNEL_REPEATS; i++) {
				variance += (timeSamples[i] - mean) * (timeSamples[i] - mean);
			}
			variance /= NUM_KERNEL_REPEATS;
			stddev = std::sqrt(variance);
			std::cout << "Mean = " << mean << " milliseconds" << std::endl;
			std::cout << "Std = " << stddev << std::endl;
			std::cout << "==========ALL DONE, EVERYTHING ELSE IS GARBAGE==============" << std::endl;
			break;
		default:
			printf("ERROR Invalid runtype value (%d) provided on commandline. Exiting...\n", runtype);
			return 0;
		}
	}

	// get Intel OpenCL platform 
	platform = get_intel_platform(INTEL_PLATFORM);

	if (NULL == platform)
	{
		printf("Error: failed to found Intel platform...\n");
		return EXIT_FAILURE;
	}

	// Getting the compute device for the processor graphic (GPU) on our platform by function 
	printf("Selected device: GPU\n");
	err = clGetDeviceIDs(platform, CL_DEVICE_TYPE_GPU, 1, &device_id, NULL);

	char *deviceName = new char[1024];
	err |= clGetDeviceInfo(device_id, CL_DEVICE_NAME, 1024, deviceName, NULL);
	printf("Device name: %s\n", deviceName);
	if (CL_SUCCESS != err || NULL == device_id)
	{
		printf("Error: Failed to get device on this platform!\n");
		return EXIT_FAILURE;
	}

	context = clCreateContext(NULL, 1, &device_id, NULL, NULL, &err);
	if (CL_SUCCESS != err || NULL == context)
	{
		printf("Error: Failed to create a compute context!\n");
		return EXIT_FAILURE;
	}

	size_t file_size;
	char * kernel_source = read_source(CLFileName.c_str(), &file_size);
	if (NULL == kernel_source)
	{
		printf("Error: Failed to read kernel source code from file name: %s!\n", CLFileName.c_str());
		clReleaseContext(context);
		return EXIT_FAILURE;
	}
	//printf("%s\n", kernel_source); // print out kernel source code

	program = clCreateProgramWithSource(context, 1, (const char **)&kernel_source, NULL, &err);
	if (CL_SUCCESS != err || NULL == program)
	{
		printf("Error: Failed to create compute program!\n");
		clReleaseContext(context);
		return EXIT_FAILURE;
	}

	// Build the executable program object
	//printf("\nBuild and Compile the program executable\n");
	//	-cl - mad - enable - cl - fast - relaxed - math
	err = clBuildProgram(program, 0, NULL, "-cl-std=CL2.0", NULL, NULL);
	if (CL_SUCCESS != err)
	{
		printf("Error: Failed to build program executable!\n");
		build_fail_log(program, device_id);
		clReleaseProgram(program);
		clReleaseContext(context);
		return EXIT_FAILURE;
	}

	// creates a command-queue on a specific device. context must be a valid OpenCL context. 
	//printf("\nCreating a command queue with properties\n");

	cl_command_queue commands0 = clCreateCommandQueueWithProperties(context, device_id, NULL, &err); // NO Profiling
	if (CL_SUCCESS != err || NULL == commands0)
	{
		printf("Error: Failed to create a Host command queue!\n");
		clReleaseContext(context);
		return EXIT_FAILURE;
	}

	// Create the compute kernel object in the program we wish to run 
#define NUM_MMUL_KERNELS 1

	cl_kernel mmul_kernels[NUM_MMUL_KERNELS] = { 0 };
	mmul_kernels[0] = clCreateKernel(program, CLKernelName.c_str(), &err);
	if (CL_SUCCESS != err || NULL == mmul_kernels[0])
	{
		printf("Error: Failed to create compute kernel0!\n");
		clReleaseProgram(program);
		clReleaseContext(context);
		return EXIT_FAILURE;
	}

	cl_image_desc desc;
	desc.image_type = CL_MEM_OBJECT_IMAGE2D;
	desc.image_width = imgCols;
	desc.image_height = imgRows;
	desc.image_depth = 1;
	desc.image_array_size = 0;
	desc.image_slice_pitch = 0;
	desc.image_row_pitch = 0;
	desc.num_mip_levels = 0;
	desc.num_samples = 0;
	desc.buffer = NULL;

	cl_image_format imgfmt;
	imgfmt.image_channel_order = CL_RGBA;
	imgfmt.image_channel_data_type = CL_UNORM_INT8;

	cl_mem inputImg = clCreateImage(context, CL_MEM_READ_ONLY, &imgfmt, &desc, NULL, &err);
	CL_CHK_ERR(err, "Failed to create input image object!", "Success");
	if (CL_SUCCESS != err)
	{
		printf("Error: Failed to create input image object!\n");
		clReleaseProgram(program);
		clReleaseContext(context);
		return EXIT_FAILURE;
	}

	cl_mem outputImg = clCreateImage(context, CL_MEM_WRITE_ONLY, &imgfmt, &desc, NULL, &err);
	if (CL_SUCCESS != err)
	{
		printf("Error: Failed to create output image object!\n");
		clReleaseProgram(program);
		clReleaseContext(context);
		return EXIT_FAILURE;
	}
	

	// copy host data to device
	size_t origin[3] = { 0,0,0 };  // offset within image to copy from
	size_t region[3] = { imgCols, imgRows, 1 }; // elements per dim
	err = clEnqueueWriteImage(commands0, inputImg, CL_TRUE, origin, region, 0, 0, imgdata, 0, NULL, NULL);
	if (CL_SUCCESS != err)
	{
		printf("Error: clEnqueueWriteImage Failed!\n");
		clReleaseProgram(program);
		clReleaseContext(context);
		return EXIT_FAILURE;
	}

	// Setting the arguments to our compute kernel in order to execute it. 
	//printf("\nSetting the kernel arguments\n");

	err = clSetKernelArg(mmul_kernels[0], 0, sizeof(cl_mem), &inputImg);
	printf("Setting argument number 0\n");
	if (CL_SUCCESS != err)
	{
		printf("Error: Failed to set argument 0!\n");
		return EXIT_FAILURE;
	}

	err = clSetKernelArg(mmul_kernels[0], 1, sizeof(cl_mem), &outputImg);
	printf("Setting argument number 1\n");
	if (CL_SUCCESS != err)
	{
		printf("Error: Failed to set argument 1!\n");
		return EXIT_FAILURE;
	}

	err = clSetKernelArg(mmul_kernels[0], 2, sizeof(int), &imgCols);
	printf("Setting argument number 2\n");
	if (CL_SUCCESS != err)
	{
		printf("Error: Failed to set argument 2!\n");
		return EXIT_FAILURE;
	}

	err = clSetKernelArg(mmul_kernels[0], 3, sizeof(int), &imgRows);
	printf("Setting argument number 3\n");
	if (CL_SUCCESS != err)
	{
		printf("Error: Failed to set argument 3!\n");
		return EXIT_FAILURE;
	}

	if (1 == runtype) // Rotate kernel argument
	{
		err = clSetKernelArg(mmul_kernels[0], 4, sizeof(float), &theta);
		printf("Setting argument number 4\n");
		if (CL_SUCCESS != err)
		{
			printf("Error: Failed to set argument 4!\n");
			return EXIT_FAILURE;
		}
	}
	else if (2 == runtype) //Blur kernel arg (gaussian kernel)
	{
		cl_mem dBlurFilterBuffer = clCreateBuffer(context, CL_MEM_READ_ONLY | CL_MEM_USE_HOST_PTR, sizeof(gaussBlurFilter_5x5), (void *)gaussBlurFilter_5x5, &err);
		CL_CHK_ERR(err, "Failed to create buffer", "Buffer created successfully")
		err = clSetKernelArg(mmul_kernels[0], 4, sizeof(cl_mem), &dBlurFilterBuffer);
		CL_CHK_ERR(err, "Failed setting arg 4!", "Arg 4 set successfully");
		
		err = clSetKernelArg(mmul_kernels[0], 5, sizeof(int), &kernel_width);
		CL_CHK_ERR(err, "Failed setting arg 5!", "Arg 5 set successfully");


		cl_sampler mysampler = clCreateSampler(context, CL_SAMPLER_NORMALIZED_COORDS, CL_ADDRESS_CLAMP, CL_FILTER_NEAREST, &err);
		CL_CHK_ERR(err, "Failed to create sampler", "Sampler created successfully");

		err = clSetKernelArg(mmul_kernels[0], 6, sizeof(cl_sampler), &mysampler);
		CL_CHK_ERR(err, "Failed to set arg 6", "Arg 6 set sucessfully")
	}

	// NO PROFILING
	std::cout << "====Profiling parallel implementation====" << std::endl;
	for (int rpts = 0; rpts < NUM_KERNEL_REPEATS; rpts++)
	{ 
		QueryPerformanceCounter(&perfCountStart);
		err = clEnqueueNDRangeKernel(commands0, mmul_kernels[0], dim0, NULL, global0, local0, 0, NULL, NULL);
		if (CL_SUCCESS != err)
		{
			printf("Error: Failed to execute kernel!\n");
			clReleaseKernel(mmul_kernels[0]);
			clReleaseProgram(program);
			clReleaseCommandQueue(commands0);
			clReleaseContext(context);
			return EXIT_FAILURE;
		}

		err = clFinish(commands0);
		if (CL_SUCCESS != err)
		{
			printf("Error: clFinish Failed!\n");
			clReleaseKernel(mmul_kernels[0]);
			clReleaseProgram(program);
			clReleaseCommandQueue(commands0);
			clReleaseContext(context);
			return EXIT_FAILURE;
		}
		QueryPerformanceCounter(&perfCountStop);
		QueryPerformanceFrequency(&perfFreq);
		execTime = 1000.0f * (float)(perfCountStop.QuadPart - perfCountStart.QuadPart) / (float)perfFreq.QuadPart;
		timeSamples[rpts] = execTime;
	}
	mean = 0.0f;
	for (int i = 0; i < NUM_KERNEL_REPEATS; i++) {
		mean += timeSamples[i];
	}
	mean /= NUM_KERNEL_REPEATS;
	variance = 0.0f;
	for (int i = 0; i < NUM_KERNEL_REPEATS; i++) {
		variance += (timeSamples[i] - mean) * (timeSamples[i] - mean);
	}
	variance /= NUM_KERNEL_REPEATS;
	stddev = std::sqrt(variance);
	std::cout << "Mean = " << mean << " milliseconds" << std::endl;
	std::cout << "Std = " << stddev << std::endl;

	//printf("\n");
	printf("\n***** NDRange is finished ***** \n");

	//  
	err = clEnqueueReadImage(commands0, outputImg, CL_TRUE, origin, region, 0, 0, hOutputImg, 0, NULL, NULL);
	if (err != CL_SUCCESS)
	{
		printf("Error: Failed to map buffer buffer_buffer_in\n");
		return EXIT_FAILURE;
	}

	// NOTE: For stbi_write functions return value: 0 for ERROR, non-zero for SUCCESS
	outPath.append(outFilename);
	err = stbi_write_jpg(outPath.c_str(), imgCols, imgRows, imgChannels, hOutputImg, 100);

	clReleaseKernel(mmul_kernels[0]);
	clReleaseCommandQueue(commands0);

	clReleaseMemObject(inputImg);
	clReleaseMemObject(outputImg);

	clReleaseProgram(program);
	clReleaseContext(context);

	stbi_image_free(imgdata);
	free(kernel_source);
	free(hOutputImg);

	return 0;
}

cl_platform_id get_intel_platform(const string platformName)
{
	// Trying to get a handle to Intel's OpenCL platform using function 
	// Trying to identify one platform: 

	cl_platform_id platforms[10] = { NULL };
	cl_uint num_platforms = 0;

	cl_int err = clGetPlatformIDs(10, platforms, &num_platforms);

	if (err != CL_SUCCESS) {
		printf("Error: Failed to get a platform id!\n");
		return NULL;
	}

	size_t returned_size = 0;
	cl_char platform_name[1024] = { 0 }, platform_prof[1024] = { 0 }, platform_vers[1024] = { 0 }, platform_exts[1024] = { 0 };

	for (unsigned int ui = 0; ui < num_platforms; ++ui)
	{
		// Found one platform. Query specific information about the found platform using the function  
		// Trying to query platform specific information... 

		err = clGetPlatformInfo(platforms[ui], CL_PLATFORM_NAME, sizeof(platform_name), platform_name, &returned_size);
		err |= clGetPlatformInfo(platforms[ui], CL_PLATFORM_VERSION, sizeof(platform_vers), platform_vers, &returned_size);
		err |= clGetPlatformInfo(platforms[ui], CL_PLATFORM_PROFILE, sizeof(platform_prof), platform_prof, &returned_size);
		err |= clGetPlatformInfo(platforms[ui], CL_PLATFORM_EXTENSIONS, sizeof(platform_exts), platform_exts, &returned_size);

		if (err != CL_SUCCESS) {
			printf("Error: Failed to get platform info!\n");
			return NULL;
		}

		// check for Intel platform 
		if (!strcmp((char*)platform_name, platformName.c_str())) {
			printf("\nPlatform information\n");
			printf(SEPARATOR);
			printf("Platform name:       %s\n", (char *)platform_name);
			printf("Platform version:    %s\n", (char *)platform_vers);
			printf("Platform profile:    %s\n", (char *)platform_prof);
			printf("Platform extensions: %s\n", ((char)platform_exts[0] != '\0') ? (char *)platform_exts : "NONE");
			return platforms[ui];
		}
	}

	return NULL;
}



void build_fail_log(cl_program program, cl_device_id device_id)
{
	cl_int err = CL_SUCCESS;
	size_t log_size = 0;

	err = clGetProgramBuildInfo(program, device_id, CL_PROGRAM_BUILD_LOG, 0, NULL, &log_size);
	if (CL_SUCCESS != err)
	{
		printf("Error: Failed to read build log length...\n");
		return;
	}

	char* build_log = (char*)malloc(sizeof(char) * log_size + 1);
	if (NULL != build_log)
	{
		err = clGetProgramBuildInfo(program, device_id, CL_PROGRAM_BUILD_LOG, log_size, build_log, &log_size);
		if (CL_SUCCESS != err)
		{
			printf("Error: Failed to read build log...\n");
			free(build_log);
			return;
		}

		build_log[log_size] = '\0';    // mark end of message string 

		printf("Build Log:\n");
		puts(build_log);
		fflush(stdout);

		free(build_log);
	}
}


void serial_gaussian_blur(string inFile, const float* gaussianBlurFilter, string outFilename) {
	int imgRows;
	int imgCols;
	int imgChannels;
	int filtWidth = 5;
	int halfWidth = (int)(filtWidth / 2);
	unsigned char *imgdata = NULL;
	string inPath = "C:/Users/Cole Rogers/Pictures/EE524/";
	string outPath = "C:/Users/Cole Rogers/Pictures/EE524/";

	imgdata = stbi_load(inPath.append(inFile).c_str(), &imgCols, &imgRows, &imgChannels, 0);
	unsigned char* output_img;
	output_img = (unsigned char*)malloc(sizeof(unsigned char) * imgRows * imgCols);
	for (int i = 0; i < imgRows; i++) {
		for (int j = 0; j < imgCols*4; j+=4) {
			float sum = 0;

			for (int k = -halfWidth; k <= halfWidth; k++) {
				for (int l = -halfWidth; l <= halfWidth; l++) {
					int r = j + k;
					int c = j + l;

					r = (r < 0) ? 0 : r;
					c = (c < 0) ? 0 : c;

					r = (r >= imgRows) ? imgRows - 1 : r;
					c = (c >= imgCols) ? imgCols - 1 : c;

					int fRow = k + halfWidth;
					int fCol = l + halfWidth;
					sum += imgdata[r * imgCols + c] * gaussianBlurFilter[filtWidth * fRow + fCol];	
				}
			}
			output_img[imgCols * i + (int)(j/4)] = int(sum);
		}
	}
	outPath.append(outFilename);
	int err = stbi_write_jpg(outPath.c_str(), imgCols, imgRows, 1, output_img, 100);
}