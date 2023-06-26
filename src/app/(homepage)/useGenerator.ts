import { MutableRefObject, useState, useEffect } from "react";
import {
  getRandomInt,
  getMaximumFPS,
  getCharSize,
  getRotationStep,
} from "./utils";
import { GalaxyGenerator } from "./generator";

type Config = {
  refs: {
    dots: MutableRefObject<HTMLCanvasElement | null>;
    convertor: MutableRefObject<HTMLCanvasElement | null>;
    output: MutableRefObject<HTMLPreElement | null>;
  };
};

/**
 * A hook that manages a galaxy generator instance and exposes its output
 */
export function useGenerator(config: Config) {
  const {
    refs: { dots, convertor, output },
  } = config;

  const [alphabet, setAlphabet] = useState(" .-+01");
  const [targetFPS, setTargetFPS] = useState(0);
  const [targetRPM, setTargetRPM] = useState(2);
  const [debugIPS, setDebugIPS] = useState(0);
  const [asciiWidth, setAsciiWidth] = useState(0);
  const [asciiHeight, setAsciiHeight] = useState(0);
  const [numStars, setNumStars] = useState(1200);
  const [numArms, setNumArms] = useState(getRandomInt(1, 3));
  const [ascii, setAscii] = useState("");

  /**
   * Fixes the output element's height to be 1:1 aspect ratio
   */
  function setOutputSize(output: HTMLPreElement) {
    output.style.height = output.clientWidth + "px";
  }

  /**
   * Determines the dimensions of the output element, in ascii chars
   */
  function setAsciiDimensions(output: HTMLPreElement) {
    // Determine how big each character is
    const [charWidth, charHeight] = getCharSize();

    // Take the output width (height not needed, output is square)
    const outputWidth = output.clientWidth;

    // Divide width by char width for # of columns per row
    const columns = Math.floor(outputWidth / charWidth);

    // Divide height by char height for # of rows per column
    const rows = Math.floor(outputWidth / charHeight);

    // Set output
    setAsciiWidth(columns);
    setAsciiHeight(rows);
  }

  /**
   * ON MOUNT/UNMOUNT
   */
  useEffect(() => {
    let generator: GalaxyGenerator;

    async function startup() {
      console.log("setup");

      if (!targetRPM || !alphabet) {
        return;
      }

      // set target fps
      if (!targetFPS) {
        const fps = await getMaximumFPS();
        setTargetFPS(fps);
      }

      // set ascii width/height
      if (!output.current) {
        console.log("missing output ref");
        return;
      }
      setOutputSize(output.current);
      setAsciiDimensions(output.current);

      // setup the generator
      if (!dots.current) {
        console.log("missinging dots ref");
        return;
      }
      generator = new GalaxyGenerator({
        numStars,
        numArms,
        armOffsetMax: 0.75,
        canvas: dots.current,
        randomOffsetXY: 0.14,
        rotationFactor: 6,
        asciiWidth,
        asciiHeight,
        alphabet: alphabet,
        rotationStep: getRotationStep(Number(targetRPM), Number(targetFPS)),
        onNewFrame: (ascii) => {
          setAscii(ascii);
        },
        onPerformanceUpdate: (newIPS) => {
          setDebugIPS(Math.round(newIPS));
        },
      });

      // Initialize the generator
      generator.initializeStars();

      render();
    }

    async function render() {
      console.log("starting rendering cycles");

      generator.rotationStep = getRotationStep(
        Number(targetRPM),
        Number(targetFPS)
      );
      generator.alphabet = alphabet;
      generator.startRenderingSequence(Number(targetFPS));
    }

    async function teardown() {
      console.log("teardown");

      if (!generator) {
        return;
      }

      generator.stopRenderingSequence();
    }

    startup();

    return () => {
      teardown();
    };
  }, [dots, convertor, output, alphabet, targetFPS, targetRPM]);

  return {
    state: {
      // mutable
      alphabet,
      setAlphabet,
      targetFPS,
      setTargetFPS,
      targetRPM,
      setTargetRPM,
      // not mutable
      ascii,
      debugIPS,
      asciiWidth,
      asciiHeight,
      numStars,
      numArms,
    },
  };
}
