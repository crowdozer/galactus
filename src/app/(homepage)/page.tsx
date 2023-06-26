"use client";
import { useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGenerator } from "./useGenerator";
import { Button } from "@/components/ui/button";

export default function Home() {
  const dotsCanvasRef = useRef<HTMLCanvasElement>(null);
  const convertorCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputPreRef = useRef<HTMLPreElement>(null);

  const api = useGenerator({
    refs: {
      dots: dotsCanvasRef,
      convertor: convertorCanvasRef,
      output: outputPreRef,
    },
  });

  const {
    state: {
      ascii,
      alphabet,
      setAlphabet,
      targetFPS,
      setTargetFPS,
      targetRPM,
      setTargetRPM,
      debugIPS,
      asciiWidth,
      asciiHeight,
      numStars,
      numArms,
    },
  } = api;

  return (
    <div className="relative mx-auto max-w-3xl py-8">
      {/* Renders the dots that rotate around */}
      <canvas
        ref={dotsCanvasRef}
        width="800px"
        height="800px"
        style={{
          display: "none",
          background: "blue",
        }}
      />

      {/* Temporary canvas for converting image to grayscale */}
      <canvas
        ref={convertorCanvasRef}
        width={asciiWidth + "px"}
        height={asciiHeight + "px"}
        style={{
          display: "none",
          background: "green",
        }}
      />

      {!asciiWidth && !asciiHeight ? (
        <div className="py-48 text-center">Measuring performance...</div>
      ) : null}

      {/* Output area */}
      <pre
        ref={outputPreRef}
        className="w-full select-none overflow-hidden whitespace-pre"
        style={{
          // background: "red",
          background: "transparent",
          fontSize: "10px",
          lineHeight: "calc(10px * 1.2)",
        }}
      >
        {ascii}
      </pre>

      <div className="mono rounded p-8">
        <div className="grid grid-cols-2">
          <div className="px-4 py-2 font-bold">sim speed</div>
          <div className="px-4 py-2">
            {debugIPS ? (
              <span>
                {debugIPS}hz (targ {targetFPS})
              </span>
            ) : (
              <span>measuring performance...</span>
            )}
          </div>
          <div className="px-4 py-2 font-bold">num arms</div>
          <div className="px-4 py-2">
            {numArms}
            {numArms > 1 ? " arms" : " arm"}
          </div>
          <div className="px-4 py-2 font-bold">stars</div>
          <div className="px-4 py-2">{numStars}</div>
          <div className="px-4 py-2 font-bold">ascii</div>
          <div className="px-4 py-2">
            {asciiWidth * asciiHeight} ({asciiWidth} x {asciiHeight})
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-8">
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Alphabet"
            value={alphabet}
            onChange={(event) => setAlphabet(event.target.value)}
          />
          <Select
            value={targetFPS.toString()}
            onValueChange={(value) => setTargetFPS(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Target FPS" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Target FPS</SelectLabel>
                <SelectItem value={"300"}>300 fps</SelectItem>
                <SelectItem value={"240"}>240 fps</SelectItem>
                <SelectItem value={"165"}>165 fps</SelectItem>
                <SelectItem value={"144"}>144 fps</SelectItem>
                <SelectItem value={"60"}>60 fps</SelectItem>
                <SelectItem value={"30"}>30 fps</SelectItem>
                <SelectItem value={"20"}>20 fps</SelectItem>
                <SelectItem value={"15"}>15 fps</SelectItem>
                <SelectItem value={"10"}>10 fps</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            value={targetRPM.toString()}
            onValueChange={(value) => setTargetRPM(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Target RPM" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Target FPS</SelectLabel>
                <SelectItem value={"1"}>1 rpm</SelectItem>
                <SelectItem value={"2"}>2 rpm</SelectItem>
                <SelectItem value={"4"}>4 rpm</SelectItem>
                <SelectItem value={"10"}>10 rpm</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            variant={"outline"}
            onClick={() => window.location.reload()}
            className="bg-stone-900 hover:bg-stone-800 active:bg-stone-900"
          >
            regenerate
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-8">
        <h1 className="text-xl font-bold mb-2">What is it?</h1>
        <p>
          A simple demo to render a galaxy using ascii. Star positions are
          simulated individually, then converted to a grayscale image where each
          pixel value is a brightness level. The brightness of that pixel is
          then rounded to the nearest alphabet character and displayed in the
          corresponding row/column.
        </p>
      </div>
    </div>
  );
}
