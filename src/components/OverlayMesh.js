import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
// Removed R3F import as we are using vanilla THREE in ARScreen

import { OverlayVertexShader, OverlayFragmentShader } from '../rendering/shaders';

export class OverlayMesh extends THREE.Mesh {
    constructor() {
        const geometry = new THREE.PlaneGeometry(1, 1);
        const material = new THREE.ShaderMaterial({
            vertexShader: OverlayVertexShader,
            fragmentShader: OverlayFragmentShader,
            uniforms: {
                uTexture: { value: null },
                uOpacity: { value: 1.0 },
                uBrightness: { value: 0.0 },
                uContrast: { value: 1.0 },
                uSaturation: { value: 1.0 },
                uColorBalance: { value: new THREE.Vector3(1, 1, 1) }
            },
            transparent: true,
            side: THREE.DoubleSide,
            depthTest: false, // Ensure it draws on top if needed, or rely on position
            depthWrite: false
        });
        super(geometry, material);
    }

    updateTexture(texture) {
        // Adjust aspect ratio
        if (texture.image) {
            const aspect = texture.image.width / texture.image.height;
            this.geometry.dispose();
            this.geometry = new THREE.PlaneGeometry(1, 1 / aspect);
        }
        this.material.uniforms.uTexture.value = texture;
        this.material.needsUpdate = true;
        this.visible = true;
    }

    updateAdjustments(adjustments) {
        const { opacity, brightness, contrast, saturation, colorBalanceR, colorBalanceG, colorBalanceB } = adjustments;
        this.material.uniforms.uOpacity.value = opacity;
        this.material.uniforms.uBrightness.value = brightness;
        this.material.uniforms.uContrast.value = contrast;
        this.material.uniforms.uSaturation.value = saturation;
        this.material.uniforms.uColorBalance.value.set(colorBalanceR, colorBalanceG, colorBalanceB);
    }
}
