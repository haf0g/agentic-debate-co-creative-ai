const http = require('http');

console.log('Testing connection to Python server...');

const options = {
    hostname: '127.0.0.1',
    port: 8000,
    path: '/health',
    method: 'GET',
    timeout: 5000
};

const req = http.request(options, (res) => {
    console.log(`✅ Connection successful! Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Response:', data);
    });
});

req.on('error', (error) => {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
});

req.on('timeout', () => {
    console.error('❌ Connection timeout');
    req.destroy();
});

req.end();

// Test également avec localhost
console.log('\nTesting with localhost...');

const options2 = { ...options, hostname: 'localhost' };
const req2 = http.request(options2, (res) => {
    console.log(`✅ Connection with localhost successful! Status: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Response:', data);
    });
});

req2.on('error', (error) => {
    console.error('❌ Connection with localhost failed:', error.message);
});

req2.end();
