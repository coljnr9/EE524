#include "host.h"

int main(int argc, char** argv) {
	cl_platform_id *platforms = NULL;
	cl_platform_info *platform_info = NULL;
	cl_uint num_platforms;
	
	cl_uint num_entries = 0;
	cl_device_id *devices = NULL;


	cl_int clStatus = clGetPlatformIDs(0, NULL, &num_platforms);
	platforms = (cl_platform_id *)malloc(sizeof(cl_platform_id)*num_platforms);
	clStatus = clGetPlatformIDs(num_platforms, platforms, NULL);
	
	//Get platform info...
	for (cl_uint i = 0; i < num_platforms; i++) {
		std::cout << "=========================" << std::endl;
		print_platform_info(platforms[i], CL_PLATFORM_VENDOR);
		print_platform_info(platforms[i], CL_PLATFORM_NAME);
		

		clStatus = clGetDeviceIDs(platforms[i], CL_DEVICE_TYPE_ALL, NULL, NULL, &num_entries);
		devices = (cl_device_id *)malloc(sizeof(cl_device_id)*num_entries);
		clStatus = clGetDeviceIDs(platforms[i], CL_DEVICE_TYPE_ALL, num_entries, devices, NULL);

		for (cl_uint j = 0; j < num_entries; j++) {
			std::cout << "Device name: ";
			print_device_info(devices[j], CL_DEVICE_NAME);
			std::cout << "Device double fp config: ";
			print_device_info(devices[j], CL_DEVICE_DOUBLE_FP_CONFIG);
			std::cout << "Device preferred vector width float: ";
			print_device_info(devices[j], CL_DEVICE_PREFERRED_VECTOR_WIDTH_FLOAT);
			std::cout << "Device native vector width float: ";
			print_device_info(devices[j], CL_DEVICE_NATIVE_VECTOR_WIDTH_FLOAT);
			std::cout << "Device max clock frequency: ";
			print_device_info(devices[j], CL_DEVICE_MAX_CLOCK_FREQUENCY);
			std::cout << "Device max compute units: ";
			print_device_info(devices[j], CL_DEVICE_MAX_COMPUTE_UNITS);
			std::cout << "Device max work item sizes: ";
			print_device_info(devices[j], CL_DEVICE_MAX_WORK_ITEM_SIZES);
			std::cout << std::endl;
		}

		std::cout << std::endl;
	}
	free(platforms);
}

void print_platform_info(cl_platform_id platform, cl_platform_info param_name)
{
	size_t parameter_size;
	cl_int clStatus;
	cl_platform_info * platform_info;

	clStatus = clGetPlatformInfo(platform, param_name, NULL, NULL, &parameter_size);
	platform_info = (cl_platform_info *)malloc(parameter_size);
	clStatus = clGetPlatformInfo(platform, param_name, parameter_size, platform_info, NULL);
	std::cout << (char *)platform_info << std::endl;
	free(platform_info);
}

void print_device_info(cl_device_id device, cl_device_info param_name) {
	size_t parameter_size;
	cl_int clStatus;
	cl_device_info *device_info;

	clStatus = clGetDeviceInfo(device, param_name, NULL, NULL, &parameter_size);
	device_info = (cl_device_info *)malloc(parameter_size);
	clStatus = clGetDeviceInfo(device, param_name, parameter_size, device_info, NULL);
	switch (param_name) {
	case CL_DEVICE_NAME:
		std::cout << (char*)device_info << std::endl;
		break;
	default:
		std::cout << *device_info << std::endl;
	}
	free(device_info);
}