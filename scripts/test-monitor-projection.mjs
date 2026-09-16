import assert from 'node:assert/strict';
import { build } from 'esbuild';
import * as THREE from 'three';

// Bundle in memory so this check needs no emitted files or extra test runtime.
const { outputFiles } = await build({
    entryPoints: [new URL('../src/outer/v2/monitorProjection.ts', import.meta.url).pathname],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
});
const { getMonitorProjection } = await import(
    `data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`
);

let checkedPoints = 0;
let maxError = 0;
const viewports = [
    { width: 390, height: 670, left: 0, top: 0 },
    { width: 844, height: 390, left: 11, top: 47 },
    { width: 1280, height: 720, left: -5, top: 13 },
];

for (const viewport of viewports) {
    for (const logicalSize of [{ x: 1280, y: 720 }, { x: 390, y: 219.375 }]) {
        for (let index = 0; index < 20; index += 1) {
            const camera = new THREE.PerspectiveCamera(35 + index, viewport.width / viewport.height, 0.01, 100);
            camera.position.set(0.2 * Math.sin(index), 0.3 * Math.cos(index), 3 + index / 20);
            camera.lookAt(0, 0, 0);
            camera.updateMatrixWorld(true);

            const surface = new THREE.Object3D();
            surface.position.set(0.1 * Math.sin(index), 0.1 * Math.cos(index), 0);
            surface.rotation.set(0.2 * Math.sin(index), 0.5 * Math.cos(index), 0.2 * Math.sin(index * 0.7));
            surface.scale.set(0.92 / logicalSize.x, 0.518 / logicalSize.y, 1);
            surface.updateMatrixWorld(true);

            const result = getMonitorProjection(camera, surface.matrixWorld, logicalSize, viewport);
            assert.ok(result, 'A visible monitor must have a projection');
            const values = result.slice('matrix3d('.length, -1).split(',').map(Number);
            assert.equal(values.length, 16);
            const matrix = new THREE.Matrix4().fromArray(values);
            assert.notEqual(matrix.determinant(), 0, 'Native hit testing needs an invertible matrix');
            const inverse = matrix.clone().invert();

            for (const [uRatio, vRatio] of [[0, 0], [1, 0], [1, 1], [0, 1], [0.5, 0.5], [0.17, 0.73]]) {
                const u = uRatio * logicalSize.x;
                const v = vRatio * logicalSize.y;
                // Independent reference: Three.js world → NDC projection.
                const ndc = new THREE.Vector3(u - logicalSize.x / 2, logicalSize.y / 2 - v, 0)
                    .applyMatrix4(surface.matrixWorld)
                    .project(camera);
                const expectedX = viewport.left + (ndc.x + 1) * viewport.width / 2;
                const expectedY = viewport.top + (1 - ndc.y) * viewport.height / 2;
                const actual = new THREE.Vector3(u, v, 0).applyMatrix4(matrix);
                const error = Math.hypot(actual.x - expectedX, actual.y - expectedY);
                assert.ok(error < 1e-8, `Projected point error: ${error}px`);
                maxError = Math.max(maxError, error);
                const recovered = actual.clone().applyMatrix4(inverse);
                assert.ok(Math.hypot(recovered.x - u, recovered.y - v) < 1e-7, 'Hit-test inverse must recover iframe coordinates');
                checkedPoints += 1;
            }
        }
    }
}

const camera = new THREE.PerspectiveCamera(45, 390 / 670, 0.01, 100);
camera.updateMatrixWorld(true);
const logicalSize = { x: 1280, y: 720 };
const viewport = { width: 390, height: 670 };
const matrixAt = (z) => new THREE.Matrix4().makeTranslation(0, 0, z)
    .scale(new THREE.Vector3(0.92 / logicalSize.x, 0.518 / logicalSize.y, 1));
assert.equal(getMonitorProjection(camera, matrixAt(2), logicalSize, viewport), null, 'Behind-camera planes must be hidden');
assert.equal(getMonitorProjection(camera, matrixAt(0), logicalSize, viewport), null, 'A plane on the camera must be hidden');
const crossing = new THREE.Matrix4().makeRotationY(Math.PI / 3)
    .scale(new THREE.Vector3(0.92 / logicalSize.x, 0.518 / logicalSize.y, 1));
assert.equal(getMonitorProjection(camera, crossing, logicalSize, viewport), null, 'A plane crossing the camera must be hidden');
const collapsed = matrixAt(-2).scale(new THREE.Vector3(0, 1, 1));
assert.equal(getMonitorProjection(camera, collapsed, logicalSize, viewport), null, 'Collapsed planes cannot receive input');
assert.equal(getMonitorProjection(camera, matrixAt(-2), { x: 0, y: 720 }, viewport), null);
assert.equal(getMonitorProjection(camera, matrixAt(-2), logicalSize, { width: 0, height: 670 }), null);
assert.equal(getMonitorProjection(camera, matrixAt(-2), logicalSize, { ...viewport, top: Number.NaN }), null);
const invalid = matrixAt(-2);
invalid.elements[0] = Number.NaN;
assert.equal(getMonitorProjection(camera, invalid, logicalSize, viewport), null);

console.log(`Monitor projection: ${checkedPoints} points passed; maximum error ${maxError.toExponential(2)} CSS px; invalid-plane guards passed.`);
