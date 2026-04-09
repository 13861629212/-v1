export interface WordEntry {
  id: string;
  word: string;
  explanation: string;
  example?: string;
  group?: string;
  category?: string;
  subCategory?: string;
  type: 'idiom' | 'discrimination';
  tags?: string[];
}

export interface DiscriminationEntry {
  id: string;
  words: string[];
  content: string;
  example?: string;
  type: 'discrimination';
}
