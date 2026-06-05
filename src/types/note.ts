export type VideoNote = {
  videoId: string;
  title: string;
  markdown: string;
  updatedAt: number;
  thumbnail: string;
  tags?: string[];
};
