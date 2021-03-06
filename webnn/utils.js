'use strict';

const assert = chai.assert;

export class AccuracyCriterion {
  constructor(atol, rtol) {
    this.atol = atol;
    this.rtol = rtol;
  }
}

export const opFp32AccuracyCriteria =
    new AccuracyCriterion(1e-6, 5.0 * 1.1920928955078125e-7);

// The following 2 constants were used for converted tests from NNAPI CTS
export const ctsFp32RestrictAccuracyCriteria =
    new AccuracyCriterion(1e-5, 5.0 * 1.1920928955078125e-7);
export const ctsFp32RelaxedAccuracyCriteria =
    new AccuracyCriterion(5.0 * 0.0009765625, 5.0 * 0.0009765625);

export function almostEqual(a, b, criteria) {
  const delta = Math.abs(a - b);
  if (delta <= criteria.atol + criteria.rtol * Math.abs(b)) {
    return true;
  } else {
    console.warn(`a(${a}) b(${b}) delta(${delta})`);
    return false;
  }
}

export function checkValue(
    output, expected, criteria = opFp32AccuracyCriteria) {
  assert.isTrue(output.length === expected.length);
  for (let i = 0; i < output.length; ++i) {
    assert.isTrue(almostEqual(output[i], expected[i], criteria));
  }
}

export function sizeOfShape(array) {
  return array.reduce(
      (accumulator, currentValue) => accumulator * currentValue, 1);
}

export function checkShape(shape, expected) {
  assert.isTrue(shape.length === expected.length);
  for (let i = 0; i < shape.length; ++i) {
    assert.isTrue(shape[i] === expected[i]);
  }
}

// Refer to Implicit padding algorithms of Android NNAPI:
// https://developer.android.com/ndk/reference/group/neural-networks#group___neural_networks_1gab72e9e6263fd5b015bb7f41ec18ce220
export function computeExplicitPadding(
    inputSize, stride, filterSize, dilation = 1) {
  const outSize = Math.ceil(inputSize / stride);
  const effectiveFilterSize = (filterSize - 1) * dilation + 1;
  const neededInput = (outSize - 1) * stride + effectiveFilterSize;
  const totalPadding = Math.max(0, neededInput - inputSize);
  const paddingToBeginning = Math.floor(totalPadding / 2);
  const paddingToEnd = Math.floor((totalPadding + 1) / 2);
  return [paddingToBeginning, paddingToEnd];
}

export async function setPolyfillBackend(backend) {
  if (!backend) {
    // Use cpu by default for accuracy reason
    // See more details at:
    // https://github.com/webmachinelearning/webnn-polyfill/pull/32#issuecomment-763825323
    backend = 'cpu';
  }
  const tf = navigator.ml.createContext().tf;
  if (tf) {
    const backends = ['webgl', 'cpu'];
    if (!backends.includes(backend)) {
      if (backend) {
        console.warn(`webnn-polyfill doesn't support ${backend} backend.`);
      }
    } else {
      if (!(await tf.setBackend(backend))) {
        console.error(`Failed to set tf.js backend ${backend}.`);
      }
    }
    await tf.ready();
    console.info(
        `webnn-polyfill uses tf.js ${tf.version_core}` +
        ` ${tf.getBackend()} backend.`);
  }
}
