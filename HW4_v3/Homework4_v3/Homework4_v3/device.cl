__constant sampler_t mysampler = CLK_NORMALIZED_COORDS_FALSE | CLK_ADDRESS_CLAMP | CLK_FILTER_NEAREST;

__kernel void img_rotate(__read_only image2d_t inputImg, __write_only image2d_t outputImg, int imgWidth, int imgHeight, float theta)
{
	// use global IDs for output coords
	int x = get_global_id(0);
	int y = get_global_id(1);
	// compute image center
	float x0 = imgWidth / 2.0f;
	float y0 = imgHeight / 2.0f;
	// compute WI location relative to image center
	int xprime = x - x0;
	int yprime = y - y0;
	// compute sin and cos
	float sinTheta = sin(theta*M_PI_F / 180.f);
	float cosTheta = cos(theta*M_PI_F / 180.f);
	// compute input location
	float2 readCoord;
	readCoord.x = xprime * cosTheta - yprime * sinTheta + x0;
	readCoord.y = xprime * sinTheta + yprime * cosTheta + y0;
	// read input image
	float value = read_imagef(inputImg, mysampler, readCoord).x; // return only x component of float4 (monochromatic image)
	
	// write output image
	// write to all R-G-B components, will convert from 32-bit uint to 8-bit uints?
	write_imagef(outputImg, (int2)(x, y), (float4)(value, value, value, 0));
}
__kernel void img_conv_filter(__read_only image2d_t inImg, __write_only image2d_t outImg, int imgWidth, int imgHeight, __constant float* convfilter, uint filtWidth)
{
	// use global IDs for output coords
	int x = get_global_id(0); // columns
	int y = get_global_id(1); // rows
	const sampler_t imgSampler = CLK_NORMALIZED_COORDS_FALSE | CLK_ADDRESS_REPEAT | CLK_FILTER_NEAREST;
	int halfWidth = (int)(filtWidth / 2); // auto-round nearest int
	float sum = 0.0f;
	int filtIdx = 0; // filter kernel passed in as linearized buffer array
	int2 coords;
	for (int i = -halfWidth; i <= halfWidth; i++) // iterate filter rows
	{
		coords.y = y + i;
		for (int j = -halfWidth; j <= halfWidth; j++) // iterate filter cols
		{
			coords.x = x + j;
			float pixel = convert_float(read_imageui(inImg, imgSampler, coords).x); // operate on single component (x = r)
			sum += pixel * convfilter[filtIdx];
			filtIdx++;
		}
	}
	//write resultant filtered pixel to output image
	coords = (int2)(x, y);
	write_imageui(outImg, coords, convert_uint4((float4)(sum, sum, sum, 1.0f))); // leave a-channel unchanged
}