#include "emscripten.h"
#include "src/webp/encode.h"
#include "src/webp/decode.h"
#include <stdlib.h>

EMSCRIPTEN_KEEPALIVE
int version()
{
	return WebPGetEncoderVersion();
}

EMSCRIPTEN_KEEPALIVE
uint8_t *create_buffer(int width, int height)
{
	return malloc(width * height * 4 * sizeof(uint8_t));
}

EMSCRIPTEN_KEEPALIVE
void destroy_buffer(uint8_t *p)
{
	free(p);
}

int result[2];
EMSCRIPTEN_KEEPALIVE
void encode(uint8_t *img_in, int width, int height, float quality)
{
	uint8_t *img_out;
	size_t size;

	size = WebPEncodeRGBA(img_in, width, height, width * 4, quality, &img_out);

	result[0] = (int)img_out;
	result[1] = size;
}

EMSCRIPTEN_KEEPALIVE
void free_result(uint8_t *result)
{
	WebPFree(result);
}

EMSCRIPTEN_KEEPALIVE
int get_result_pointer()
{
	return result[0];
}

EMSCRIPTEN_KEEPALIVE
int get_result_size()
{
	return result[1];
}

int image_info[2] = {0, 0};

EMSCRIPTEN_KEEPALIVE
int webp_get_info(const uint8_t *data, size_t data_size)
{
	int r;
	r = WebPGetInfo(data, data_size, &image_info[0], &image_info[1]);
	return r;
}

EMSCRIPTEN_KEEPALIVE
int get_info_width()
{
	return image_info[0];
}

EMSCRIPTEN_KEEPALIVE
int get_info_height()
{
	return image_info[1];
}

EMSCRIPTEN_KEEPALIVE
void free_info()
{
	image_info[0] = 0;
	image_info[1] = 0;
}

EMSCRIPTEN_KEEPALIVE
uint8_t *decode(const uint8_t *data, size_t data_size)
{
	return WebPDecodeRGBA(data, data_size, &image_info[0], &image_info[1]);
}
