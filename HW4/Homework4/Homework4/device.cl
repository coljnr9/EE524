// Add you device OpenCL code

__kernel void img_rotate(__read_only image2d_t inputImg, __write_only image2d_t outputImg, int imgWidth, int imgHeight, float theta){ 

	const sampler_t clSampler = CLK_NORMALIZED_COORDS_FALSE | CLK_ADDRESS_CLAMP_TO_EDGE | CLK_FILTER_LINEAR;
	int x = get_global_id(0);
	int y = get_global_id(1);

	float x0 = imgWidth / 2.0f;
	float y0 = imgHeight / 2.0f;

	int x_prime = x - x0;
	int y_prime = y - y0;

	float sinTheta = sin(theta * M_PI_F / 180.0f);
	float cosTheta = cos(theta * M_PI_F / 180.0f);

	float2 readCoord;
	readCoord.x = x_prime * cosTheta - y_prime * sinTheta + x0;
	readCoord.y = x_prime * sinTheta + y_prime * cosTheta + y0;

	float value = read_imagef(inputImg, clSampler, readCoord).x;
	write_imagef(outputImg, (int2)(x, y), (float4)(value, value, value, 0.f));
}