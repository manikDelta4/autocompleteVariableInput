/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode } from "react";
import { Editor } from "slate";

export interface CustomEditor extends Editor {
  isInline: (element: any) => boolean;
  isVoid: (element: any) => boolean;
  markableVoid: (element: any) => boolean;
}

export interface MentionElement {
  type: "mention";
  character: string;
  children: any;
}

export interface PortalProps {
  children?: ReactNode;
}

export interface SlateInputProps {
  onChange: (value: string) => void;
  placeholder?: string;
  variables: string[];
}
