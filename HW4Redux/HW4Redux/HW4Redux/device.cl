__constant sampler_t sampler = CLK_NORMALIZED_COORDS_FALSE | CLK_ADDRESS_CLAMP | CLK_FILTER_LINEAR; 

__kernel void img_rotate(__read_only image2d_t inputImg, __write_only image2d_t outputImg, int imgWidth, int imgHeight, float theta)
{
	// use global IDs for output coords
	int x = get_global_id(0);
	int y = get_global_id(1);
	// compute image center
	float x0 = imgWidth/2.0f;
	float y0 = imgHeight/2.0f;
	// compute WI location relative to image center
	int xprime = x-x0;
	int yprime = y-y0;
	// compute sin and cos
	float sinTheta = sin(theta*M_PI_F/180.f);
	float cosTheta = cos(theta*M_PI_F/180.f);
	// compute input location
	float2 readCoord;
	readCoord.x = xprime*cosTheta - yprime*sinTheta + x0;
	readCoord.y = xprime*sinTheta + yprime*cosTheta + y0;
	// read input image
	float value = read_imagef(inputImg, sampler, readCoord).x; // return only x component of float4 (monochromatic image)
	// write output image
	// write to all R-G-B components, will convert from 32-bit uint to 8-bit uints?
	write_imagef(outputImg, (int2)(x,y), (float4)(value, value, value, 0.f));
}


//__constant float gaussBlurFilter[49] = {
//0.0091,0.0132,0.0165,0.0178,0.0165,0.0132,0.0091,0.0132,0.0192,0.0239,0.0258,0.0239,0.0192,0.0132,0.0165,0.0239,0.0299,0.0322,0.0299,0.0239,0.0165,0.0178,0.0258,0.0322,0.0347,0.0322,0.0258,0.0178,0.0165,0.0239,0.0299,0.0322,0.0299,0.0239,0.0165,0.0132,0.0192,0.0239,0.0258,0.0239,0.0192,0.0132,0.0091,0.0132,0.0165,0.0178,0.0165,0.0132,0.0091
//
//};
//__constant int filterWidth = 7;

__kernel void img_conv_filter(__read_only image2d_t inputImg, __write_only image2d_t outputImg, int cols, int rows,int filterWidth, __constant float *gaussBlurFilter, sampler_t h_sampler)
{
	// use global IDs for output coords
	int x = get_global_id(0); // columns
	int y = get_global_id(1); // rows
	int halfWidth = (int)(filterWidth/2); // auto-round nearest int ???
	float4 sum = (float4)(0);
	int filtIdx = 0; // filter kernel passed in as linearized buffer array
	int2 coords;
	for(int i = -halfWidth; i <= halfWidth; i++) // iterate filter rows
	{
	coords.y = y + i;
	for(int j = -halfWidth; j <= halfWidth; j++) // iterate filter cols
	{
	coords.x = x + j;
	//float4 pixel = convert_float4(read_imageui(inputImg, sampler, coords)); // operate element-wise on all 3 color components (r,g,b)
	float4 pixel = read_imagef(inputImg, h_sampler, coords); // operate element-wise on all 3 color components (r,g,b)
	filtIdx++;
	sum += pixel * (float4)(gaussBlurFilter[filtIdx],gaussBlurFilter[filtIdx],gaussBlurFilter[filtIdx],1.0f); // leave a-channel unchanged
	}
	}
	//write resultant filtered pixel to output image
	coords = (int2)(x,y);
	//write_imageui(outputImg, coords, convert_uint4(sum));
	write_imagef(outputImg, coords, sum);
}
