/**
 * Bezel-wrapped versions of the 6 backdrop wordmark variants.
 * NOT typewriter — that's a type animation, not a backdrop.
 */
import React from 'react';
import { Bezel } from '../components/Bezel';
import { WordmarkCrtScan } from './CrtScan';
import { WordmarkMovieIntro } from './MovieIntro';
import { WordmarkFilmGrain } from './FilmGrain';
import { WordmarkNeonGlow } from './NeonGlow';
import { WordmarkGlitch } from './Glitch';
import { WordmarkInkBloom } from './InkBloom';

export const WordmarkCrtScanBezel: React.FC = () => (
  <Bezel><WordmarkCrtScan /></Bezel>
);
export const WordmarkMovieIntroBezel: React.FC = () => (
  <Bezel><WordmarkMovieIntro /></Bezel>
);
export const WordmarkFilmGrainBezel: React.FC = () => (
  <Bezel><WordmarkFilmGrain /></Bezel>
);
export const WordmarkNeonGlowBezel: React.FC = () => (
  <Bezel><WordmarkNeonGlow /></Bezel>
);
export const WordmarkGlitchBezel: React.FC = () => (
  <Bezel><WordmarkGlitch /></Bezel>
);
export const WordmarkInkBloomBezel: React.FC = () => (
  <Bezel><WordmarkInkBloom /></Bezel>
);
