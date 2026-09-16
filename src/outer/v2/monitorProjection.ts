import { Matrix4, type Camera } from 'three';

type LogicalSize = { x: number; y: number };
type ProjectionViewport = {
    width: number;
    height: number;
    left?: number;
    top?: number;
};

/**
 * Project a centered monitor plane into its containing element's CSS pixels.
 * The caller updates the camera/world matrices and uses transform-origin: 0 0.
 * No parent perspective or additional centering transform is needed.
 */
export function getMonitorProjection(
    camera: Camera,
    objectMatrixWorld: Matrix4,
    logicalSize: LogicalSize,
    viewport: ProjectionViewport
): string | null {
    const { x: width, y: height } = logicalSize;
    const { width: viewportWidth, height: viewportHeight, left = 0, top = 0 } = viewport;
    if (
        ![width, height, viewportWidth, viewportHeight, left, top].every(Number.isFinite) ||
        Math.min(width, height, viewportWidth, viewportHeight) <= 0
    ) {
        return null;
    }

    const m = new Matrix4()
        .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
        .multiply(objectMatrixWorld).elements;

    // DOM (u, v) maps to monitor-local (u - width/2, height/2 - v, 0).
    // Each clip coordinate is therefore a linear function of u and v.
    const clipX = [m[0], -m[4], m[12] - (width / 2) * m[0] + (height / 2) * m[4]];
    const clipY = [m[1], -m[5], m[13] - (width / 2) * m[1] + (height / 2) * m[5]];
    const clipW = [m[3], -m[7], m[15] - (width / 2) * m[3] + (height / 2) * m[7]];
    const cornerW = [
        clipW[2],
        clipW[0] * width + clipW[2],
        clipW[0] * width + clipW[1] * height + clipW[2],
        clipW[1] * height + clipW[2],
    ];
    // A homography cannot safely represent a plane crossing the camera.
    if (cornerW.some((value) => !Number.isFinite(value) || value <= 1e-6)) {
        return null;
    }

    const xCenter = left + viewportWidth / 2;
    const yCenter = top + viewportHeight / 2;
    const x = clipX.map((value, index) =>
        ((viewportWidth / 2) * value + xCenter * clipW[index]) / clipW[2]
    );
    const y = clipY.map((value, index) =>
        (-(viewportHeight / 2) * value + yCenter * clipW[index]) / clipW[2]
    );
    const g = clipW[0] / clipW[2];
    const h = clipW[1] / clipW[2];
    const [a, b, c] = x;
    const [d, e, f] = y;
    if (![a, b, c, d, e, f, g, h].every(Number.isFinite)) return null;

    // Keep the CSS transform invertible so native iframe hit testing works.
    const determinantTerms = [a * (e - f * h), -b * (d - f * g), c * (d * h - e * g)];
    const determinant = determinantTerms.reduce((sum, value) => sum + value, 0);
    const determinantScale = determinantTerms.reduce((sum, value) => sum + Math.abs(value), 0);
    if (
        !Number.isFinite(determinant) ||
        Math.abs(determinant) <= Number.EPSILON * 64 * determinantScale
    ) {
        return null;
    }

    // CSS matrix3d is column-major. The independent z axis must remain nonzero;
    // setting the entire z row to zero would make this otherwise valid map singular.
    return `matrix3d(${[a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, c, f, 0, 1].join(',')})`;
}
