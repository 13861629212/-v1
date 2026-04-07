export interface WordEntry {
  id: string;
  word: string;
  explanation: string;
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
  type: 'discrimination';
}
