const http = require('http');

const url = 'http://localhost:5000/download/1768341823205-563972339-package-lock.json';

http.get(url, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Content-Disposition:', res.headers['content-disposition']);
}).on('error', (e) => {
    console.error(e);
});
