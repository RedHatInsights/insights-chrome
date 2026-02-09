// allow .svg imports in TSX? files
declare module '*.svg' {
  const content: string;
  export default content;
}
