/**
 * Frame Designer — data model.
 *
 * A "frame" is an ordered stack of kit-primitive layers, each with a type,
 * a visibility flag, and a free-form props bag.  The frame is purely a
 * data structure — the rendering happens via the Remotion
 * FrameDesignerComposition, and persistence is straight JSON.
 */

export type LayerType =
  | 'TacticalFrame'
  | 'MonitorFrame'
  | 'PromptCard'
  | 'CaptionCard'
  | 'SceneLabel';

export interface Layer {
  /** Unique within a frame. */
  id: string;
  type: LayerType;
  visible: boolean;
  /** Props passed straight through to the kit primitive. */
  props: Record<string, unknown>;
}

export interface FramePreset {
  /** Slug — used for filename and as the preset id. */
  name: string;
  /** Display title. */
  title?: string;
  /** Optional one-liner shown in the picker. */
  description?: string;
  /** Aspect ratio of the canvas — width × height. */
  canvas: { width: number; height: number };
  layers: Layer[];
  /** ISO timestamp. */
  updatedAt?: string;
}

export type FieldType =
  | 'string'
  | 'text' // multi-line
  | 'number'
  | 'color'
  | 'boolean'
  | 'string[]'
  | 'enum';

export interface FieldSpec {
  key: string;
  label?: string;
  type: FieldType;
  /** For number fields. */
  min?: number;
  max?: number;
  step?: number;
  /** For enum fields. */
  options?: string[];
}

export interface LayerSpec {
  type: LayerType;
  label: string;
  description: string;
  defaultProps: Record<string, unknown>;
  fields: FieldSpec[];
}
