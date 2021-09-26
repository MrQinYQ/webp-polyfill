// import { CacheFirst } from 'workbox-strategies/CacheFirst';
// import { NetworkFirst } from 'workbox-strategies/NetworkFirst';
// import { precacheAndRoute } from 'workbox-precaching/precacheAndRoute';
// import { registerRoute } from 'workbox-routing/registerRoute';

// const manifest = self.__WB_MANIFEST;
// if (manifest) {
//     console.log('manifest', manifest);
//     precacheAndRoute(manifest);
// }
// registerRoute('/', new NetworkFirst());

// registerRoute(
//     '/static/',
//     new CacheFirst({
//         cacheName: 'static-cache',
//         matchOptions: {
//             ignoreVary: true
//         }
//     })
// );

import UPNG from 'upng-js';

self.importScripts('./a.out.js');

console.log('Module', Module);

const api = {};

Module.onRuntimeInitialized = async _ => {
    const _api = {
        version: Module.cwrap('version', 'number', []),
        create_buffer: Module.cwrap('create_buffer', 'number', ['number', 'number']),
        destroy_buffer: Module.cwrap('destroy_buffer', '', ['number']),
        encode: Module.cwrap('encode', '', ['number', 'number', 'number', 'number']),
        free_result: Module.cwrap('free_result', '', ['number']),
        get_result_pointer: Module.cwrap('get_result_pointer', 'number', []),
        get_result_size: Module.cwrap('get_result_size', 'number', []),
        webp_get_info: Module.cwrap('webp_get_info', 'number', ['number', 'number']),
        get_info_width: Module.cwrap('get_info_width', 'number', []),
        get_info_height: Module.cwrap('get_info_height', 'number', []),
        free_info: Module.cwrap('free_info', '', []),
        decode: Module.cwrap('decode', 'number', ['number', 'number']),
    };
    Object.keys(_api).forEach(key => {
        api[key] = _api[key];
    });
}

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', event => {
    const request = event.request;
    event.respondWith(handle(request));
});

function handle(request) {
    return fetch(request).then(res => {
        const contenttype = res.headers.get('content-type');
        if (contenttype === 'image/webp') {
            console.log('it is webp');
            return webp2png(res);
        }
        return res;
    });
}

async function webp2png(res) {
    const data = await res.arrayBuffer();
    const u8ca = new Uint8ClampedArray(data);
    const u8calength = u8ca.length;
    console.log(u8ca, u8calength);
    const p = api.create_buffer(u8calength, 1);
    console.log(p);
    Module.HEAP8.set(u8ca, p);
    const info_r = api.webp_get_info(p, u8calength);
    console.log('info_r', info_r);
    const width = api.get_info_width();
    const height = api.get_info_height();
    const rp = api.decode(p, u8calength);
    console.log(rp, height, width);
    const resultView = new Uint8Array(Module.HEAP8.buffer, rp, width * height * 4);
    const result = new Uint8Array(resultView);
    console.log('resultView', resultView);
    api.free_result(rp);
    api.destroy_buffer(p);
    api.free_info();
    console.log('result', result, result.buffer);
    const r = UPNG.encode([result.buffer], width, height);
    const blob = new Blob([r], { type: 'image/png' });
    const response = new Response(blob, {
        headers: {
            'content-type': 'image/png'
        }
    });
    return Promise.resolve(response);
}