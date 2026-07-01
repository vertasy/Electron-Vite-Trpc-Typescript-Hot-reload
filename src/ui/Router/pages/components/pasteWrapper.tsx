import React, { useCallback, useState } from "react";
import { useImagePaste } from "../../hooks/usePastedImage";

interface Props {
  children: React.ReactNode;
  onImagePaste: (file: File, dataUrl: string) => void;
}

export const PasteImageListener: React.FC<Props> = ({
  children,
  onImagePaste
}) => {
  useImagePaste(onImagePaste, [onImagePaste]);
  return <>{children}</>;
};
