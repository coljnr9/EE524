//HW2 InclassExcerize2b - Victor Perez

#include "host.hpp"

#define	WINDOWS_PROFILING 1
#define OPEN_CL_PROFILING 2
#define ROTATE 1
#define GAUSSBLUR 2
#define ROTATE_KERNEL "img_rotate"
#define GAUSSBLUR_KERNEL "img_conv_filter"

//configuration parameters
#define	PROFILING_APPROACH WINDOWS_PROFILING
#define KERNEL_NAME GAUSSBLUR_KERNEL
#define KERNEL GAUSSBLUR
#define ROTATION_ANGLE 47.0f
#define AVERAGING_ITERATIONS 100
#define GAUSSFILTER_WIDTH 7
#define BUFFER_SIZE GAUSSFILTER_WIDTH*GAUSSFILTER_WIDTH


using namespace std;
void serialConvolution(unsigned char *inImageptr, unsigned char *outImagePtr, int cols, int rows, int filterWidth, const float *gaussBlurFilter);


int main(int argc, char**argv) {




	// Set up the Platform
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	cl_platform_id* platforms = NULL;
	cl_uint num_platforms = 0;

	cl_int clStatus = clGetPlatformIDs(0, NULL, &num_platforms);
	platforms = (cl_platform_id *)malloc(sizeof(cl_platform_id)*num_platforms);
	clStatus = clGetPlatformIDs(num_platforms, platforms, NULL);
	//std::cout << "Number of Platforms: %d\n" << std::endl;

	// Create a context for platform 2 device 1  Intel(R) OpenCL  - HD Graphics
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	cl_platform_info *platform_names = NULL;
	size_t size;
	cl_device_id *device_list = NULL;
	cl_uint num_devices = 0;
	cl_device_info *device_name = NULL;
	cl_platform_id platform_id;

	for (int i = 0; i < num_platforms; i++) {
		clStatus = clGetPlatformInfo(platforms[i], CL_PLATFORM_NAME, 0, NULL, &size);
		platform_names = (cl_platform_info *)malloc(size);
		clGetPlatformInfo(platforms[i], CL_PLATFORM_NAME, size, platform_names, NULL);
		//std::cout << "Platform Name: %s\n" << std::endl;

		if (!strcmp((char*)platform_names, "Intel(R) OpenCL")) {
			std::cout <<  "INTEL_PLATFORM found!" << std::endl;
			platform_id = platforms[i];
			break;
		}
	}
	
	clStatus = clGetDeviceIDs(platform_id, CL_DEVICE_TYPE_GPU, 0, NULL, &num_devices);
	device_list = (cl_device_id *)malloc(sizeof(cl_device_id)*num_devices);
	clStatus = clGetDeviceIDs(platform_id, CL_DEVICE_TYPE_ALL, num_devices, device_list, NULL);
	std::cout << "Number of Devices:" << num_devices << std::endl;



	//Device Names and info
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	clStatus = clGetDeviceInfo(device_list[0], CL_DEVICE_NAME, 0, NULL, &size);
	device_name = (cl_device_info *)malloc(size);
	clGetDeviceInfo(device_list[0], CL_DEVICE_NAME, size, device_name, NULL);
	std::cout << "Device Name:" << (char*)device_name << std::endl;

	//get work group size information
	cl_uint device_max_work_item_dimensions;
	size_t max_work_group_size;
	size_t *device_max_work_item_sizes = NULL;

	clGetDeviceInfo(device_list[0], CL_DEVICE_MAX_WORK_ITEM_DIMENSIONS, sizeof(device_max_work_item_dimensions), &device_max_work_item_dimensions, NULL);
	std::cout << "Device Max Work Item Dimensions:" << device_max_work_item_dimensions << std::endl;

	clStatus = clGetDeviceInfo(device_list[0], CL_DEVICE_MAX_WORK_ITEM_SIZES, 0, NULL, &size);
	device_max_work_item_sizes = (size_t *)malloc(size);
	clGetDeviceInfo(device_list[0], CL_DEVICE_MAX_WORK_ITEM_SIZES, size, device_max_work_item_sizes, NULL);
	for (int i = 0; i < device_max_work_item_dimensions;i++) {
		std::cout << "Device Max Work Item Sizes for dimension:" << device_max_work_item_sizes[i] << std::endl;
	}


	clGetDeviceInfo(device_list[0], CL_DEVICE_MAX_WORK_GROUP_SIZE, sizeof(max_work_group_size), &max_work_group_size, NULL);
	std::cout << "Device Max Work Group Size: " << max_work_group_size << std::endl;



	//Create Context
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	cl_context context = clCreateContext(NULL, 1, device_list, NULL, NULL, &clStatus);
	CL_CHK_ERR(clStatus, "Error creating context", "Context Creation Succesfully");
	

	//Create Program with source- need to read source files first
	//may wish to specify a header file so that types can be predefined... might be done at via clBuildProgram though
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	const char* kernel_file_name = "device.cl";
	size_t filesize;
	const char *src = read_source(kernel_file_name, &filesize);
	cl_program program = clCreateProgramWithSource(context, 1, &src, NULL, &clStatus);
	CL_CHK_ERR(clStatus, "\nError-Program Not Created Succesfully\n", "Program Creation Succesfull\n");
	
	//Build Program
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	clStatus = clBuildProgram(program, 1, device_list, "-cl-std=CL2.0", NULL, NULL);
	CL_CHK_ERR(clStatus, "\nError-Program Not Built Succesfully\n", "Program Build Succesfull\n");
	
	//Create Command Queue
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	cl_command_queue command_queue = clCreateCommandQueue(context, device_list[0], CL_QUEUE_PROFILING_ENABLE, &clStatus);
	CL_CHK_ERR(clStatus, "\nError-Command Queue\n", "Command Queue Creation Succesfull\n");
	
	//Create Kernel and check status
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	cl_kernel kernel = clCreateKernel(program, KERNEL_NAME, &clStatus);
	CL_CHK_ERR(clStatus, "\nError-Kernel Creation\n", "Kernel Creation Succesfull\n");
	
	//stbi image load
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	int imgRows = 0;
	int imgCols = 0;
	int imgChannels = 0;

	unsigned char *imgdata = NULL;
	// REMEMBER: stbi_image_free(imgdata);
	unsigned char *hOutputImg = NULL;
	unsigned char *hOutputImgSerial = NULL;
	string inPath = "C:/Users/Cole Rogers/Pictures/EE524/lena_512x512_32bit.png";
	string outPath = "C:/Users/Cole Rogers/Pictures/EE524/OutputImageParallel.png";
	//string outPathSerial = "C:/Users/victor.perez/Documents/Intel/HW4/Part1/HW4/HW4/OutputImageSerial.png";

	imgdata = stbi_load(inPath.c_str(), &imgCols, &imgRows, &imgChannels, 0);
	hOutputImg = (unsigned char*)malloc(imgRows*imgCols * imgChannels * sizeof(unsigned char));//allocate mem for output image
	hOutputImgSerial = (unsigned char*)malloc(imgRows*imgCols * imgChannels * sizeof(unsigned char));//allocate mem for output image

	//create inputs/outputs and necessary buffers
	//need to clCreatIMage then clEnqueueWriteImage before any input image 
	//is set as a kernel argument
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	cl_image_desc desc;
	desc.image_type = CL_MEM_OBJECT_IMAGE2D;
	desc.image_width = imgCols; //should be populated by stbi load
	desc.image_height = imgRows;//should be populated by stbi load.
	desc.image_depth = 0;
	desc.image_array_size = 0;
	desc.image_slice_pitch = 0;
	desc.image_row_pitch = 0;
	desc.num_mip_levels = 0;
	desc.num_samples = 0;
	desc.buffer = NULL;

	float theta = ROTATION_ANGLE;

	cl_image_format imgfmt;
	imgfmt.image_channel_order = CL_RGBA;
	imgfmt.image_channel_data_type = CL_UNSIGNED_INT8;

	cl_mem inputImg = clCreateImage(context, CL_MEM_READ_ONLY, &imgfmt, &desc, NULL, &clStatus);
	CL_CHK_ERR(clStatus, "\nError-Create Input Image\n", "Input Image Created\n");

	cl_mem outputImg = clCreateImage(context, CL_MEM_WRITE_ONLY, &imgfmt, &desc, NULL, &clStatus);
	CL_CHK_ERR(clStatus, "\nError-Create Output Image\n", "Output Image Created\n");
	
	//EnqueueWriteImage copies the host image to the device
	size_t origin[3] = { 0,0,0 };  // offset within image to copy from
	size_t region[3] = { imgCols, imgRows, 1 }; // elements per dim
	clStatus = clEnqueueWriteImage(command_queue, inputImg, CL_TRUE, origin, region, 0, 0, imgdata, 0, NULL, NULL);
	CL_CHK_ERR(clStatus, "\nError-EnqueueWriteImage\n", "EnqueueWriteImage Succesful\n");
	

	//Set Kernel Argurments
	//__kernel void img_rotate(__read_only image2d_t inputImg, __write_only image2d_t outputImg, int imgWidth, int imgHeight, float theta)
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
#if KERNEL == ROTATE

	clStatus = clSetKernelArg(kernel, 0, sizeof(cl_mem), &inputImg);//input image
	CL_CHK_ERR(clStatus, "\nError-Set Arg inputImg\n", "Kernal Arg inputImg Set\n");

	clStatus = clSetKernelArg(kernel, 1, sizeof(cl_mem), &outputImg);//output image
	CL_CHK_ERR(clStatus, "\nError-Set Arg outputImg\n", "Kernal Arg outputImg Set\n");

	clStatus = clSetKernelArg(kernel, 2, sizeof(int), &imgCols);//image columns or width
	CL_CHK_ERR(clStatus, "\nError-Set Arg imgCols\n", "Kernal Arg imgCols Set\n");

	clStatus = clSetKernelArg(kernel, 3, sizeof(int), &imgRows);//image rows or height
	CL_CHK_ERR(clStatus, "\nError-Set Arg imgRows\n", "Kernal Arg imgRows Set\n");

	clStatus = clSetKernelArg(kernel, 4, sizeof(float), &theta);//image rows or height
	CL_CHK_ERR(clStatus, "\nError-Set Arg theta\n", "Kernal Arg theta Set\n");

#elif KERNEL == GAUSSBLUR
//__kernel void img_conv_filter(__read_only image2d_t inputImg, __write_only image2d_t outputImg, int cols, int rows, int filterwidth, float *gaussBlurFilter, sampler_t h_sampler)
	
	//const cl_sampler_properties sampler_props[] = { CL_SAMPLER_NORMALIZED_COORDS|CL_FALSE, CL_SAMPLER_ADDRESSING_MODE|CL_ADDRESS_CLAMP_TO_EDGE, CL_SAMPLER_FILTER_MODE|CL_FILTER_LINEAR,0 };
	cl_sampler sampler = clCreateSampler(context, CL_FALSE, CL_ADDRESS_CLAMP_TO_EDGE, CL_FILTER_LINEAR, &clStatus);
	CL_CHK_ERR(clStatus, "\nError-Gauss Sampler Create\n", "Gauss Sampler Created\n");

	const int filterWidth = GAUSSFILTER_WIDTH;
	//need to create a buffer for gauss filter
	const float gaussBlurFilter[49] = {
		0.0091,0.0132,0.0165,0.0178,0.0165,0.0132,0.0091,
		0.0132,0.0192,0.0239,0.0258,0.0239,0.0192,0.0132,
		0.0165,0.0239,0.0299,0.0322,0.0299,0.0239,0.0165,
		0.0178,0.0258,0.0322,0.0347,0.0322,0.0258,0.0178,
		0.0165,0.0239,0.0299,0.0322,0.0299,0.0239,0.0165,
		0.0132,0.0192,0.0239,0.0258,0.0239,0.0192,0.0132,
		0.0091,0.0132,0.0165,0.0178,0.0165,0.0132,0.0091
	};
	float *h_gauss_filter = (float*)_aligned_malloc(sizeof(float) * BUFFER_SIZE, 4096);
	for (int i = 0; i < 49; i++) {
		h_gauss_filter[i] = gaussBlurFilter[i];
	}

	cl_mem d_gauss_filter = clCreateBuffer(context, CL_MEM_USE_HOST_PTR, sizeof(float) * BUFFER_SIZE, h_gauss_filter, &clStatus);
	CL_CHK_ERR(clStatus, "\nError-Gauss Buffer Create\n", "Gauss Buffer Created\n");

	clStatus = clSetKernelArg(kernel, 0, sizeof(cl_mem), &inputImg);//input image
	CL_CHK_ERR(clStatus, "\nError-Set Arg inputImg\n", "Kernal Arg inputImg Set\n");

	clStatus = clSetKernelArg(kernel, 1, sizeof(cl_mem), &outputImg);//output image
	CL_CHK_ERR(clStatus, "\nError-Set Arg outputImg\n", "Kernal Arg outputImg Set\n");

	clStatus = clSetKernelArg(kernel, 2, sizeof(int), &imgCols);//image columns or width
	CL_CHK_ERR(clStatus, "\nError-Set Arg imgCols\n", "Kernal Arg imgCols Set\n");

	clStatus = clSetKernelArg(kernel, 3, sizeof(int), &imgRows);//image rows or height
	CL_CHK_ERR(clStatus, "\nError-Set Arg imgRows\n", "Kernal Arg imgRows Set\n");

	clStatus = clSetKernelArg(kernel, 4, sizeof(int), &filterWidth);//filterwidth
	CL_CHK_ERR(clStatus, "\nError-Set Arg filterWidth\n", "Kernal Arg filterWidth Set\n");

	clStatus = clSetKernelArg(kernel, 5, sizeof(cl_mem), &d_gauss_filter);//pointer to entire filter
	CL_CHK_ERR(clStatus, "\nError-Set Arg d_gauss_filter\n", "Kernal Arg d_gauss_filter Set\n");

	clStatus = clSetKernelArg(kernel, 6, sizeof(cl_sampler), &sampler);//host side sampler
	CL_CHK_ERR(clStatus, "\nError-Set Arg sampler\n", "Kernal Arg sampler Set\n");

	//left off here trying to pass my sampler to kernel. everything works if you use sampler defined in .cl

#endif

	

	//execute kernel and gather performance specifics
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	const size_t gbl_work_size[3] = { imgCols,imgRows,0 };
	const size_t lcl_work_size[3] = { 16,16,0 };
	const unsigned int num_loops = AVERAGING_ITERATIONS;
	double data[num_loops];
	double avg_time = 0;
	double sigma = 0;
	double std = 0;

#if PROFILING_APPROACH == OPEN_CL_PROFILING

	cl_ulong submit_time = 0 ;
	cl_ulong start_time = 0;//will be returned in nanoseconds 
	cl_ulong end_time = 0; //will be returned in nanoseconds 
	cl_event kernal_instance;
	double execution_time = 0;
	double sum_delta_time = 0;

	//clGetEventProfilingInfo
	for (unsigned int cnt = 0;cnt < num_loops;cnt++) {
		
		clStatus = clEnqueueNDRangeKernel(command_queue, kernel, 2, NULL, gbl_work_size, lcl_work_size, 0, NULL, &kernal_instance);
		clStatus = clFinish(command_queue);
		clStatus = clGetEventProfilingInfo(kernal_instance, CL_PROFILING_COMMAND_SUBMIT, sizeof(submit_time), &submit_time, NULL);
		clStatus = clGetEventProfilingInfo(kernal_instance, CL_PROFILING_COMMAND_START, sizeof(start_time), &start_time, NULL);
		clStatus = clGetEventProfilingInfo(kernal_instance, CL_PROFILING_COMMAND_END, sizeof(end_time), &end_time, NULL);
		execution_time = (double)(end_time - start_time) / 1000000000;
		data[cnt] = execution_time;
		sum_delta_time += execution_time;
		//std::cout << " Kernel Execution Time: %f\n" << std::endl;
		
	}

	avg_time = sum_delta_time / num_loops;


#elif PROFILING_APPROACH == WINDOWS_PROFILING
	LARGE_INTEGER win_ctr_start, win_ctr_end, clk_freq, delta_time, sum_delta_time;
	
	delta_time.QuadPart = 0; // initialize 
	sum_delta_time.QuadPart = 0;
	win_ctr_end.QuadPart = 0;
	win_ctr_start.QuadPart = 0;
	clk_freq.QuadPart = 0;
	

	for (unsigned int cnt = 0;cnt < num_loops;cnt++) {
		QueryPerformanceFrequency(&clk_freq);// get clock ticks per second
		QueryPerformanceCounter(&win_ctr_start);//ctr at start time
		clStatus = clEnqueueNDRangeKernel(command_queue, kernel, 2, NULL, gbl_work_size, lcl_work_size, 0, NULL, NULL);
		clStatus = clFinish(command_queue);
		QueryPerformanceCounter(&win_ctr_end);//ctr at end time
		delta_time.QuadPart = (win_ctr_end.QuadPart - win_ctr_start.QuadPart) * 1000000 / clk_freq.QuadPart; //scale by 1e6 so number is not approximated as 0
		sum_delta_time.QuadPart += delta_time.QuadPart;
		data[cnt] = (double)delta_time.QuadPart / 1000000;
		//std::cout << " Kernel Execution Time: %f\n" << std::endl;
	}
	avg_time = (double)sum_delta_time.QuadPart / num_loops / 1000000; //descale
	
#endif // PROFILING_APPROACH == WINDOWS_PROFILING
	//calc standard deviation
	for (unsigned int cnt = 0; cnt < num_loops;cnt++) {
		sigma += pow((data[cnt] - avg_time), 2) / num_loops;

	}
	std = sqrt(sigma);

	std::cout << "Avg Kernel Execution Time: %f\n" << std::endl;
	std::cout << "Kernel Execution Time STD: %f\n" << std::endl;
	
	//Read results back to host for visual verification
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////
	clStatus = clEnqueueReadImage(command_queue, outputImg, CL_TRUE, origin, region, 0, 0, hOutputImg, 0, NULL, NULL);
	CL_CHK_ERR(clStatus, "\nError-Output Image Read\n", "Output Image Read Succesful\n");

	//stbi_write_jpg(char const *filename, int x, int y, int comp, const void *data, int quality)
	// int stbi_write_png(char const *filename, int w, int h, int comp, const void  *data, int stride_in_bytes);
	clStatus = stbi_write_jpg(outPath.c_str(), imgCols, imgRows, imgChannels, hOutputImg, 100); //using clStatus for error check even tho this isnt a cl service
	CL_CHK_ERR(clStatus, "Output Image Write Succesful\n", "\nError-Output Image Write\n");//status flipped in this error return

	clReleaseKernel(kernel);
	clReleaseCommandQueue(command_queue);

	clReleaseMemObject(inputImg);
	clReleaseMemObject(outputImg);

	clReleaseProgram(program);
	clReleaseContext(context);

	stbi_image_free(imgdata);
	free(hOutputImg);

	//serialConvolution(imgdata, hOutputImgSerial, imgCols, imgRows, filterWidth, gaussBlurFilter);
	//clStatus = stbi_write_jpg(outPathSerial.c_str(), imgCols, imgRows, imgChannels, hOutputImgSerial, 100); //using clStatus for error check even tho this isnt a cl service
	//CL_CHK_ERR(clStatus, "Output Image Write Succesful\n", "\nError-Output Image Write\n");//status flipped in this error return





}

void serialConvolution(unsigned char *inImageptr,unsigned char *outImagePtr,int cols, int rows, int filterWidth, const float *gaussBlurFilter)

{
	float sumr = 0;
	float sumg = 0;
	float sumb = 0;
	float pixelr = 0;
	float pixelg = 0;
	float pixelb = 0;
	int coordsy = 0;
	int coordsx = 0;
	int filtIdx = 0;
	int offset = 0;

	// use global IDs for output coords
	//int x = get_global_id(0); // columns// for loop for col
	for (int colcnt = 0; colcnt < cols; colcnt++) {

		//int y = get_global_id(1); // rows//for loop for row
		for (int rowcnt = 0; rowcnt < rows; rowcnt++) {

			int halfWidth = (int)(filterWidth / 2); // auto-round nearest int ???
			sumr = 0;
			sumg = 0;
			sumb = 0;
			filtIdx = 0; // filter kernel passed in as linearized buffer array
			coordsy = 0;
			coordsx = 0;
			for (int i = -halfWidth; i <= halfWidth; i++) // iterate filter rows
			{
				coordsx = rowcnt + i;
				for (int j = -halfWidth; j <= halfWidth; j++) // iterate filter cols
				{
					coordsy = colcnt + j;
					if ((coordsx > 0)&(coordsx < 512)&(coordsy > 0)&(coordsy < 512)) {

						offset = coordsx * rowcnt * 4 + coordsy * 4;
						pixelr = inImageptr[offset];
						offset = coordsx * rowcnt * 4 + coordsy * 4 + 1;
						pixelg = inImageptr[offset];
						offset = coordsx * rowcnt * 4 + coordsy * 4 + 2;
						pixelb = inImageptr[offset];
						//need to read pixels from image
					}
					else {
						pixelr = 0;
						pixelg = 0;
						pixelb = 0;
					}


					filtIdx++;
					sumr += pixelr * gaussBlurFilter[filtIdx];
					sumg += pixelg * gaussBlurFilter[filtIdx];
					sumb += pixelb * gaussBlurFilter[filtIdx];
						
				}
			}
			//set outputimage here
			offset = rowcnt * 4 + colcnt * 4;
			outImagePtr[offset] = sumr;
			offset = rowcnt * 4 + colcnt * 4 + 1;
			outImagePtr[offset] = sumg;
			offset = rowcnt * 4 + colcnt * 4 + 2;
			outImagePtr[offset] = sumb;
		}

	}
}