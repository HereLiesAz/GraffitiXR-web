import { deserializeProject } from './src/data/ProjectManager.js';

console.log("Running Security Verification...");

const maliciousJson = JSON.stringify({
    version: 1,
    opacity: 1, brightness: 0, contrast: 1, saturation: 1,
    scale: 1, rotationZ: 0, rotationX: 0, rotationY: 0,
    offset: {x: 0, y: 0},
    isLineDrawing: false,
    overlayImageUri: "javascript:alert('XSS')"
});

const result = deserializeProject(maliciousJson);

if (result) {
    console.log("RESULT: VULNERABLE - Malicious URI was accepted.");
} else {
    console.log("RESULT: SECURE - Malicious URI was rejected.");
}
