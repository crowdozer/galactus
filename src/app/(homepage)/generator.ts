type PerformanceInfo = {
  invocations: number;
};

// Precompute 2pi
const TwoPi = Math.PI * 2;

/**
 * Galaxy generator
 *
 * Star layout is adapted from this:
 * https://www.reddit.com/r/gamedev/comments/20ach8/how_to_generate_star_positions_in_a_2d_procedural/
 */
export class GalaxyGenerator {
  /**
   * Configuration variables for star creation and galaxy display
   */

  // Canvas used in drawing the stars
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Canvas used in transforming the star canvas to grayscale bitmap
  private tmpCanvas: HTMLCanvasElement;
  private tmpCanvasCtx: CanvasRenderingContext2D;

  // Allocate memory for the star positions
  // A float angle and a float distance
  private starPositionsAngle: Float32Array;
  private starPositionsDistance: Float32Array;

  // How many stars to keep track of
  private numStars: number;
  // How many arms the galaxy should have
  private numArms: number;
  // Distance between arms in degrees
  private armSeparationDistance: number;
  // This constant determines the maximum offset that can be applied to a star's
  // position along the spiral arm of the galaxy. The greater the value, the more
  // scattered the stars will appear along the spiral arms, creating a more dispersed
  // or irregular spiral galaxy.
  private armOffsetMax: number;
  // This constant controls the rate at which the galaxy rotates. A higher value
  // will result in more axial rotation, while a lower value will slow the rotation.
  private rotationFactor: number;
  // This constant is used to add randomness to the star positions by applying
  // a small random offset to the x and y coordinates of each star. This makes
  // the galaxy look more natural, as the stars won't be perfectly aligned along
  // the spiral arms. The larger the value, the more dispersed the stars will be
  // around their intended position, leading to a more irregular galaxy appearance.
  private randomOffsetXY: number;
  // This constant puts a void in the center of the galaxy (low values, e.g .05)
  private blackHoleOffset: number;
  // How aggressively should distant objects experience slowed rotation
  // 0.0 = none
  // 1.0 = fully slowed at 100% distance
  // 1+  = speed up with distance
  private distanceRotationFalloffScale = 0.2;
  // Causes stars to drift towards the center
  private distanceDecayPercentPerStep = 0.99995;
  // Sin/Cos lookup table (speeds up calculations)
  private lookup: Lookup;
  // Cleanup function
  public cleanup: (() => void) | null;

  /**
   * Configuration variables for ASCII art conversion
   */

  // Ascii width
  private asciiWidth: number;
  // Ascii height
  private asciiHeight: number;
  // The characters to use in converting grayscale intensity to ascii
  public alphabet: string;
  // How many degrees to rotate the galaxy per step
  public rotationStep: number;
  // What to do when a new ascii frame is delivered
  private onNewFrame: (ascii: string) => void;
  // Callback ran every performance update
  private onPerformanceUpdate: (ips: number) => void;

  // Performance monitoring
  private performance: PerformanceInfo = {
    invocations: 0,
  };

  constructor(config: {
    numStars: number;
    numArms: number;
    armOffsetMax: number;
    rotationFactor: number;
    randomOffsetXY: number;
    asciiWidth: number;
    asciiHeight: number;
    alphabet: string;
    rotationStep: number;
    canvas: HTMLCanvasElement;
    blackHoleOffset?: number;
    canvasWidth?: number;
    canvasHeight?: number;
    onNewFrame: (ascii: string) => void;
    onPerformanceUpdate: (ips: number) => void;
    lookupTablePrecision?: number;
  }) {
    // A higher value than 360 can be assigned for more precision,
    // but it isn't necessary for an ascii sim lol
    this.lookup = new Lookup(360);

    this.numStars = config.numStars;
    this.numArms = config.numArms;
    this.armSeparationDistance = TwoPi / this.numArms;
    this.starPositionsDistance = new Float32Array(this.numStars);
    this.starPositionsAngle = new Float32Array(this.numStars);
    this.armOffsetMax = config.armOffsetMax;
    this.rotationFactor = config.rotationFactor;
    this.randomOffsetXY = config.randomOffsetXY;
    this.asciiWidth = config.asciiWidth;
    this.asciiHeight = config.asciiHeight;
    this.alphabet = config.alphabet;
    this.rotationStep = config.rotationStep;
    this.canvas = config.canvas;
    this.canvas.width = config.canvasWidth || 250;
    this.canvas.height = config.canvasHeight || 250;
    this.blackHoleOffset = config.blackHoleOffset || 0.05;
    this.onNewFrame = config.onNewFrame;
    this.onPerformanceUpdate = config.onPerformanceUpdate;
    this.ctx = config.canvas.getContext("2d", {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;

    // Downscale the canvas image to match the desired output resolution
    this.tmpCanvas = document.createElement("canvas");
    this.tmpCanvasCtx = this.tmpCanvas.getContext("2d", {
      willReadFrequently: true,
    }) as CanvasRenderingContext2D;
    this.cleanup = null;
  }

  /**
   * Initialize star positions in the galaxy
   */
  public initializeStars() {
    // Iterate through starPositions array and set each star's x and y coordinates
    for (let i = 0; i < this.numStars; i++) {
      // Calculate distance, angle, and armOffset for each star
      let distance = this.randFloat();
      distance = Math.pow(distance, 2);

      let angle = this.randFloat() * TwoPi;
      let armOffset = this.randFloat() * this.armOffsetMax;
      armOffset = armOffset - this.armOffsetMax / 2;
      armOffset = armOffset * (1 / distance);

      let squaredArmOffset = Math.pow(armOffset, 2);
      if (armOffset < 0) squaredArmOffset = squaredArmOffset * -1;
      armOffset = squaredArmOffset;

      // inverting distance to reverse the spiral direction
      const rotation = -distance * this.rotationFactor;

      angle =
        Math.floor(angle / this.armSeparationDistance) *
          this.armSeparationDistance +
        armOffset +
        rotation;

      // put a black hole at the center
      distance += this.blackHoleOffset;
      distance += this.randFloat() * this.randomOffsetXY;
      // shrink the entire drawing down
      distance *= 0.75;

      // Store distance and angle
      this.starPositionsAngle[i] = angle;
      this.starPositionsDistance[i] = distance;
    }
  }

  /**
   * Begins all intervals and sets a cleanup function
   */
  public startRenderingSequence(fps: number) {
    const clearIntervals = [
      this.beginGalaxyInterval(fps),
      this.beginPerformanceInterval(),
    ];

    this.cleanup = function () {
      for (let i = 0; i < clearIntervals.length; i++) {
        clearIntervals[i]();
      }
    };
  }

  /**
   * Stops the rendering sequence
   */
  public stopRenderingSequence() {
    if (this.cleanup) {
      console.log("stopping rendering cycles");
      this.cleanup();
      this.cleanup = null;
    }
  }

  // Rotate the galaxy by a given step in degrees
  public rotateGalaxy(stepDegrees: number = this.rotationStep) {
    const stepRadians = (stepDegrees * Math.PI) / 180;

    for (let i = 0; i < this.numStars; i++) {
      const distance = this.starPositionsDistance[i];

      const percentDrag = distance * this.distanceRotationFalloffScale;
      const radiansDrag = stepRadians * percentDrag;

      this.starPositionsAngle[i] += stepRadians - radiansDrag;
      this.starPositionsDistance[i] *= this.distanceDecayPercentPerStep;
    }
  }

  /**
   * Runs the given callback at the given fps
   */
  private asInterval(callback: () => void, fps: number): () => void {
    const interval = setInterval(() => {
      callback();
    }, 1000 / fps);

    return () => clearInterval(interval);
  }

  /**
   * Begins the ascii render interval
   */
  private beginGalaxyInterval(fps: number): () => void {
    return this.asInterval(() => {
      this.performance.invocations++;
      this.canvasToAscii();
      this.drawStars();
      this.rotateGalaxy();
    }, fps);
  }

  /**
   * Begins the performance interval
   */
  private beginPerformanceInterval(): () => void {
    const interval = setInterval(() => {
      this.onPerformanceUpdate(this.performance.invocations);

      this.performance.invocations = 0;
    }, 1000);

    return () => clearInterval(interval);
  }

  /**
   * Generate a random float between 0 and 1
   */
  private randFloat(): number {
    return Math.random();
  }

  /**
   * Draw stars on the invisible canvas
   */
  private drawStars() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    if (!this.ctx) return;

    // Clear the canvas and set the background color to black
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw white dots for each star on the canvas
    this.ctx.fillStyle = "#fff";
    for (let i = 0; i < this.numStars; i++) {
      const angle = this.starPositionsAngle[i];
      const distance = this.starPositionsDistance[i];
      this.ctx.beginPath();
      const [starX, starY] = this.polarToCartesian(angle, distance);
      const xpos = centerX + starX * centerX;
      const ypos = centerY + starY * centerY;
      this.ctx.arc(xpos, ypos, 1, 0, TwoPi);
      this.ctx.fill();
    }
  }

  /**
   * Convert polar coordinates (angle, dist) to (x, y)
   */
  private polarToCartesian(angle: number, distance: number): [number, number] {
    const x = distance * this.lookup.cosLookup(angle);
    const y = distance * this.lookup.sinLookup(angle);
    return [x, y];
  }

  /**
   * Convert canvas image to ascii art based on brightness
   */
  private canvasToAscii(): void {
    if (!this.tmpCanvas.width || !this.tmpCanvas.height) {
      console.error("no-op");
      return;
    }

    this.tmpCanvasCtx.drawImage(
      this.canvas,
      0,
      0,
      this.asciiWidth,
      this.asciiHeight
    );

    let asciiArt = "";

    // Get all pixel data at once
    // Use a typed array for any potential performance optimizations, and to guarantee
    // values are 0-255
    const imageData = new Uint8ClampedArray(
      this.tmpCanvasCtx.getImageData(
        0,
        0,
        this.asciiWidth,
        this.asciiHeight
      ).data
    );

    // Iterate through the downscaled canvas image and convert each pixel to an ASCII character
    for (let y = 0; y < this.asciiHeight; y++) {
      for (let x = 0; x < this.asciiWidth; x++) {
        const index = (y * this.asciiWidth + x) * 4;
        const grayscale = Math.round(
          (imageData[index] + imageData[index + 1] + imageData[index + 2]) / 3
        );
        const asciiChar = this.mapGrayscaleToAscii(grayscale);
        asciiArt += asciiChar;
      }
      asciiArt += "\n";
    }

    this.onNewFrame(asciiArt);
  }

  /**
   * Map grayscale pixel values to ASCII characters
   */
  private mapGrayscaleToAscii(value: number): string {
    const index = Math.round(((this.alphabet.length - 1) * value) / 255);
    return this.alphabet[index];
  }
}

// Calculates a lookup table for sine and cosine values
class Lookup {
  constructor(size = 360) {
    this.LOOKUP_TABLE_SIZE = size;

    this.sinLookupTable = new Float32Array(this.LOOKUP_TABLE_SIZE);
    this.cosLookupTable = new Float32Array(this.LOOKUP_TABLE_SIZE);

    for (let i = 0; i < this.LOOKUP_TABLE_SIZE; i++) {
      const angleRadians = (i * TwoPi) / this.LOOKUP_TABLE_SIZE;
      this.sinLookupTable[i] = Math.sin(angleRadians);
      this.cosLookupTable[i] = Math.cos(angleRadians);
    }
  }

  // The number of entries in the lookup table can be adjusted to balance memory usage and precision
  private LOOKUP_TABLE_SIZE: number;

  private sinLookupTable: Float32Array;
  private cosLookupTable: Float32Array;

  public sinLookup(angleRadians: number): number {
    const index =
      (Math.round((angleRadians * this.LOOKUP_TABLE_SIZE) / TwoPi) +
        this.LOOKUP_TABLE_SIZE) %
      this.LOOKUP_TABLE_SIZE;

    return this.sinLookupTable[index];
  }

  public cosLookup(angleRadians: number): number {
    const index =
      (Math.round((angleRadians * this.LOOKUP_TABLE_SIZE) / TwoPi) +
        this.LOOKUP_TABLE_SIZE) %
      this.LOOKUP_TABLE_SIZE;

    return this.cosLookupTable[index];
  }
}
