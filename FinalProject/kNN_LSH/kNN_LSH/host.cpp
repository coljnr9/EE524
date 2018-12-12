#include "host.h"

int main(int argc, char** argv) {
	cl_int clStatus;

	size_t platform_info_size;

	cl_platform_id* platforms = NULL;
	cl_uint num_platforms;

	cl_platform_info* platform_info = NULL;
	cl_platform_id intelPlatform;

	cl_uint num_devices;
	cl_device_info *device_info = NULL;
	cl_device_id *devices;
	cl_device_id intelHDGraphics;
	size_t device_info_size;
	
	size_t file_size;
	
	cl_kernel kernel;
	cl_program program;

	const size_t global_work_dim[3] = { N, 0, 0 };
	const size_t local_work_dim[3] = { 1, 0, 0 };
	
	int *hOutputHashes;


	NOTIFY("EE524 Final Project, k-Nearest Neighbors");

	std::cout << std::endl; NOTIFY("Getting number of platforms");
	clStatus = clGetPlatformIDs(NULL, NULL, &num_platforms);
	CL_CHK_ERR(clStatus, "Error getting number of platforms", "Retrieved number of platforms successfully.");

	platforms = (cl_platform_id*)malloc(sizeof(cl_platform_id) * num_platforms);
	clStatus = clGetPlatformIDs(num_platforms, platforms, NULL);
	CL_CHK_ERR(clStatus, "Error retrieving platform IDs", "Platform IDs retrieved successfully.");

	for (int i = 0; i < num_platforms; i++) {
		clStatus = clGetPlatformInfo(platforms[i], CL_PLATFORM_NAME, NULL, NULL, &platform_info_size);
		CL_CHK_ERR(clStatus, "Error retrieving platform info size", "Platform info size retrieved successfully.");

		platform_info = (cl_platform_info *)malloc(platform_info_size);
		clStatus = clGetPlatformInfo(platforms[i], CL_PLATFORM_NAME, platform_info_size, platform_info, NULL);
		CL_CHK_ERR(clStatus, "Error retrieving platform info", "Platform info retrieved successfully.");

		if (0 == strcmp((char*)platform_info, "Intel(R) OpenCL")) {
			NOTIFY("INTEL PLATFORM FOUND"); std::cout << std::endl;
			intelPlatform = platforms[i];
			break;
		}
		else { /*Do Nothing*/ }
	}
	clStatus = clGetDeviceIDs(intelPlatform, CL_DEVICE_TYPE_GPU, NULL, NULL, &num_devices);
	CL_CHK_ERR(clStatus, "Error retrieving number of devices", "Number of devices retrieved successfully");

	devices = (cl_device_id *)malloc(sizeof(cl_device_id) * num_devices);

	clStatus = clGetDeviceIDs(intelPlatform, CL_DEVICE_TYPE_GPU, num_devices, devices, NULL);
	CL_CHK_ERR(clStatus, "Error getting device IDs", "Device IDs retrieved successfully");
	
	int dev_idx = 0;
	for (int dev_idx = 0; dev_idx < num_devices; dev_idx++){
		clStatus = clGetDeviceInfo(devices[dev_idx], CL_DEVICE_NAME, NULL, NULL, &device_info_size);
		CL_CHK_ERR(clStatus, "Error getting device name size", "Device name size retrieved successfully");

		device_info = (cl_device_info *)malloc(device_info_size);
		clStatus = clGetDeviceInfo(devices[dev_idx], CL_DEVICE_NAME, device_info_size, device_info, NULL);
		CL_CHK_ERR(clStatus, "Error getting device name", "Device name retrieved successfully");

		if (0 == strcmp((char*)device_info, "Intel(R) HD Graphics 530")) {
			 NOTIFY("INTEL HD GRAPHICS FOUND"); std::cout << std::endl;
			intelHDGraphics = devices[dev_idx];
			break;
		}
		else { /*Do Nothing*/ }
	}

	std::cout << "Platform: " << (char *)platform_info << ", Device: " << (char *)device_info << std::endl;
	
	const cl_context_properties properties[] = { CL_CONTEXT_PLATFORM, (cl_context_properties)intelPlatform, 0 };
	cl_context context = clCreateContext(properties, 1, &intelHDGraphics, NULL, NULL, &clStatus);
	CL_CHK_ERR(clStatus, "Error creating context", "Context created successfully");

	cl_command_queue commands = clCreateCommandQueue(context, intelHDGraphics, CL_QUEUE_PROFILING_ENABLE, &clStatus);
	CL_CHK_ERR(clStatus, "Error creating commands queue", "Commands queue created successfully");

	NOTIFY("READING KERNEL");

	std::string kernel_source_path = R"(kNN_kernels.cl)";
	const char *kernel_source = read_source(kernel_source_path.c_str(), &file_size);
	if (!kernel_source) {
		std::cout << "Some error occurred reading the source file... " << strerror(errno) << std::endl;
	}

	program = clCreateProgramWithSource(context, 1, &kernel_source, NULL, &clStatus);
	CL_CHK_ERR(clStatus, "Problem creating program from source", "Program created from source successfully");

	clStatus = clBuildProgram(program, 1, &intelHDGraphics, "-cl-std=CL2.0", NULL, NULL);
	if (clStatus != CL_SUCCESS) {
		std::cout << "Error building program: " << getCLErrorString(clStatus) << std::endl;
		size_t len;

		clStatus = clGetProgramBuildInfo(program, intelHDGraphics, CL_PROGRAM_BUILD_LOG, 0, NULL, &len);
		CL_CHK_ERR(clStatus, "Problem retrieving build log size", "Build log size retrieved successfully");
		char *buffer = (char *)malloc(len);

		clStatus = clGetProgramBuildInfo(program, intelHDGraphics, CL_PROGRAM_BUILD_LOG, len, buffer, NULL);
		CL_CHK_ERR(clStatus, "Problem retrieving build log", "Build log retrieved successfully");
		std::cout << buffer << std::endl;
	}

	kernel = clCreateKernel(program, "localitySensitiveHash", &clStatus);
	CL_CHK_ERR(clStatus, "Error creating kernel", "Kernel created successfully");

	// So, apparently the Gaussian distribution is p-stable (p=2)
	cl_mem dPStableDist = clCreateBuffer(context, CL_MEM_READ_ONLY | CL_MEM_USE_HOST_PTR, sizeof(cl_float16) * N, P_STABLE_DIST, &clStatus);
	CL_CHK_ERR(clStatus, "Error creating p-stable dist buffer", "p-stable dist buffer created succesfully.");
	
	cl_mem dUniformDist = clCreateBuffer(context, CL_MEM_READ_ONLY | CL_MEM_USE_HOST_PTR, sizeof(int) * N, UNIFORM_4, &clStatus);
	CL_CHK_ERR(clStatus, "Error creating uniform dist buffer", "Uniform dist buffer created successfully.");

	cl_mem dInputVectors = clCreateBuffer(context, CL_MEM_READ_ONLY | CL_MEM_USE_HOST_PTR, sizeof(cl_float16) * N, inputVectors, &clStatus);
	CL_CHK_ERR(clStatus, "Error creating inputVector buffer", "inputVector buffer created successfully.");

	hOutputHashes = (int *)malloc(sizeof(int) * N);
	cl_mem dOutputHashes = clCreateBuffer(context, CL_MEM_USE_HOST_PTR | CL_MEM_READ_WRITE, sizeof(cl_int) * N, hOutputHashes, &clStatus);
	CL_CHK_ERR(clStatus, "Error creating outputHash buffer", "outputHash buffer created successfully.");

	clStatus = clSetKernelArg(kernel, 0, sizeof(cl_mem), &dPStableDist);
	CL_CHK_ERR(clStatus, "Error setting kernel arg 0", "Kernel arg 0 set successfully.");

	clStatus = clSetKernelArg(kernel, 1, sizeof(cl_mem), &dUniformDist);
	CL_CHK_ERR(clStatus, "Error setting kernel arg 1", "Kernel arg 1 set successfully.");

	clStatus = clSetKernelArg(kernel, 2, sizeof(cl_mem), &dInputVectors);
	CL_CHK_ERR(clStatus, "Error setting kernel arg 3", "Kernel arg 3 set successfully.");

	clStatus = clSetKernelArg(kernel, 3, sizeof(cl_mem), &dOutputHashes);
	CL_CHK_ERR(clStatus, "Error setting kernel arg 3", "Kernel arg 3 set successfully.");

	clStatus = clEnqueueNDRangeKernel(commands, kernel, 1, NULL, global_work_dim, NULL, 0, NULL, NULL);
	CL_CHK_ERR(clStatus, "Error enqueuing kernel", "Kernel enqueued successfully.");

	clFinish(commands);
	NOTIFY("COMMAND QUEUE FINSIHED");

	hOutputHashes = (int *)clEnqueueMapBuffer(commands, dOutputHashes, CL_FALSE, CL_MAP_READ, 0, sizeof(int) * N, 0, NULL, NULL, &clStatus);
	CL_CHK_ERR(clStatus, "Error mapping output buffer", "Output buffer mapped successfully.");

	// Count unique hashes
	int w[N];
	int j, i, num_unique_hashes = 0;



	cl_kernel hashMappingKernel;
	for (i = 0; i < N; i++) {
		for (j = 0; j < num_unique_hashes; j++) {
			if (hOutputHashes[i] == w[j])
				break;
		}

		if (j == num_unique_hashes) {
			w[num_unique_hashes] = hOutputHashes[i];
			num_unique_hashes++;
		}
	}
	std::cout << "Found " << num_unique_hashes << " unique hashes." << std::endl;
	
	// count number of vectors with each hash
	int *uniqueHashes = (int *)malloc(sizeof(int) * (num_unique_hashes + 1));
	int *hNumVectors = (int *)malloc(sizeof(int) * num_unique_hashes);

	for (int i = 0; i < num_unique_hashes; i++) {
		uniqueHashes[i] = w[i];
	}
	// each kernel gets a hash, and returns a pointer to an array of vectors indicies and a size
	hashMappingKernel = clCreateKernel(program, "countHashes", &clStatus);
	CL_CHK_ERR(clStatus, "Error building hashmap kernel", "HashMap kernel built successfully.");

	cl_mem dUniqueHashes = clCreateBuffer(context, CL_MEM_USE_HOST_PTR | CL_MEM_READ_ONLY, sizeof(cl_int) * num_unique_hashes, uniqueHashes, &clStatus);
	CL_CHK_ERR(clStatus, "Error createing unique hash buffer.", "UniqueHashes buffer created successfuly.");

	cl_mem dNumVectors = clCreateBuffer(context, CL_MEM_USE_HOST_PTR | CL_MEM_READ_WRITE, sizeof(cl_int) * num_unique_hashes, hNumVectors, &clStatus);
	CL_CHK_ERR(clStatus, "Error createing hash counts buffer.", "HashCounts buffer created successfuly.");

	clStatus = clSetKernelArg(hashMappingKernel, 0, sizeof(cl_mem), &dUniqueHashes);
	CL_CHK_ERR(clStatus, "Error setting kernel arg 0", "Kernel arg 0 set successfully.");

	clStatus = clSetKernelArg(hashMappingKernel, 1, sizeof(cl_mem), &dOutputHashes);
	CL_CHK_ERR(clStatus, "Error setting kernel arg 1", "Kernel arg 1 set successfully.");

	int hN = N;
	clStatus = clSetKernelArg(hashMappingKernel, 2, sizeof(cl_int), &hN);
	CL_CHK_ERR(clStatus, "Error setting kernel arg 2", "Kernel arg 2 set successfully.");

	clStatus = clSetKernelArg(hashMappingKernel, 3, sizeof(cl_mem), &dNumVectors);
	CL_CHK_ERR(clStatus, "Error setting kernel arg 3", "Kernel arg 3 set successfully.");

	const size_t gwd[3] = { num_unique_hashes, 0 , 0 };
	clStatus = clEnqueueNDRangeKernel(commands, hashMappingKernel, 1, NULL, gwd, NULL, 0, NULL, NULL);
	CL_CHK_ERR(clStatus, "Error enqueuing kernel", "Kernel enqueued successfully.");
	
	clFinish(commands);
	hNumVectors = (int *)clEnqueueMapBuffer(commands, dNumVectors, CL_TRUE, CL_MAP_READ, 0, sizeof(cl_int) * num_unique_hashes, 0, NULL, NULL, &clStatus);
	CL_CHK_ERR(clStatus, "Error mapping output buffer", "Output buffer mapped successfully.");


	NOTIFY("sortingVectorsByHash");
	//Make array of pointers
	cl_float16 **ptrArray;
	ptrArray = (cl_float16 **)malloc(sizeof(cl_float16 **));
	*ptrArray = (cl_float16 *)malloc(sizeof(cl_float16 *) * num_unique_hashes);
	

	std::cout << "XX" << sizeof(ptrArray) << std::endl;

	//malloc space for each list of vectors

	for (int i = 0; i < num_unique_hashes; i++) {
		ptrArray[i] = (cl_float16*)malloc(sizeof(cl_float16) * hNumVectors[i]);		

		std::cout << "Num Vectors: " << hNumVectors[i] << " size of malloc: " << sizeof(*ptrArray[i]) << std::endl;
	}


	// what if we want to query now?









	NOTIFY("Querying first point")
	cl_float16 q[1] = { 0.06221f, 0.19231f, -2.32688f, 1.54012f, -0.77666f, 1.95143f, -0.12816f, 0.14383f, -1.15380f, 0.81777f, 0.72801f, 0.18820f, -0.90387f, 0.19793f, 0.53129f, 1.45334f };
	int qHash[1];

	// hash it to find what bucket it needs to be in
	cl_mem queryPointBuffer = clCreateBuffer(context, CL_MEM_READ_ONLY | CL_MEM_USE_HOST_PTR, sizeof(cl_float16), &q, &clStatus);
	CL_CHK_ERR(clStatus, "Error setting the query point buffer", "Query point buffer set successfully");

	cl_mem queryHashBuffer = clCreateBuffer(context, CL_MEM_READ_WRITE | CL_MEM_USE_HOST_PTR, sizeof(cl_int), &qHash, &clStatus);
	CL_CHK_ERR(clStatus, "Error setting qHash buffer", "qHash set sucesffully buffer");

	clStatus = clSetKernelArg(kernel, 2, sizeof(cl_mem), &queryPointBuffer);
	CL_CHK_ERR(clStatus, "Error setting the query point arg", "Query point argument set successfully");
	
	clStatus = clSetKernelArg(kernel, 3, sizeof(cl_mem), &queryHashBuffer);
	CL_CHK_ERR(clStatus, "Error setting qHash", "qHash set sucesffully");

	const size_t gwb_100[3] = { 1, 0, 0 };
	clStatus = clEnqueueNDRangeKernel(commands, kernel, 1, NULL, gwb_100, NULL, 0, NULL, NULL);
	clFinish(commands);

	int *hQHash = (int *)malloc(sizeof(int));
	hQHash = (int *)clEnqueueMapBuffer(commands, queryHashBuffer, CL_TRUE, CL_MAP_READ, 0, sizeof(int), 0, NULL, NULL, &clStatus);
	CL_CHK_ERR(clStatus, "Error mapping buffer", "qHash buffer mapped successfully");


	std::cout << "HASH: " << hQHash[0] << std::endl;
	

	// search
	int hashBucketIdx = -1;
	for (int i = 0; i < num_unique_hashes; i++) {
		if (hQHash[0] == uniqueHashes[i]) {
			hashBucketIdx = i;
			break;
		}
	}
	
	int numPossibleNeighbors = hNumVectors[hashBucketIdx];

	cl_float16 *dNeighbors = (cl_float16 *)malloc(sizeof(cl_float16) * numPossibleNeighbors);


	free(hNumVectors);
	free(uniqueHashes);
	free(platforms);
	free(platform_info);
	
}