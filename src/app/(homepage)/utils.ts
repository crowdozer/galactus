/**
 * Round the given number to the nearest digit present in an array of numbers
 * The function uses the Array.reduce() method to iterate over each value in the
 * array and find the value with the smallest absolute difference to the given number.
 * It then returns that value.
 */
export function roundToNearest(num: number, arr: number[]): number {
  return arr.reduce((prev, curr) => {
    return Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev;
  });
}

/**
 * Attempts to measure device FPS
 */
export async function measureFPS(): Promise<number> {
  // Define the duration of the performance testing in milliseconds
  const testDuration = 1000;

  const startTime = performance.now();
  let frames = 0;

  return new Promise<number>((resolve) => {
    const loop = (timestamp: number) => {
      frames++;
      const elapsed = timestamp - startTime;
      if (elapsed >= testDuration) {
        const fps = frames / (elapsed / 1000);
        resolve(fps);
      } else {
        requestAnimationFrame(loop);
      }
    };

    requestAnimationFrame(loop);
  });
}

/**
 * Analyzes the machine's fps capabilities and then sets
 * a reasonable default value
 */
export async function getMaximumFPS() {
  const capableFPS = await measureFPS();

  return roundToNearest(capableFPS, [144, 60, 30]);
}

/**
 * Returns a random integer between the given numbers
 */
export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Determines the char width/height
 */
export function getCharSize(): [number, number] {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  ctx.font = "10px 'Consolas'";

  const charWidth = ctx.measureText("M").width;
  const charHeight = 10 * 1.2; // Assuming line-height is 1.2 times the font size

  return [charWidth, charHeight];
}

/**
 * Determines the rotation step.
 * speed = how many revolutions per minute
 * fps   = how many rotation steps to apply every second
 */
export function getRotationStep(targetRPM: number, targetFPS: number): number {
  const totalDegrees = 360 * targetRPM;
  const framesPerMinute = targetFPS * 60;
  const degreesPerFrame = totalDegrees / framesPerMinute;

  return degreesPerFrame;
}
