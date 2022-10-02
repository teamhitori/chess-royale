if (typeof process === 'object' && typeof window === 'undefined') {
    const { backend } = require('./backend');
    backend;
}

if (typeof window !== 'undefined'){
    const { frontend } = require('./frontend');
    frontend;
}