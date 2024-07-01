export type Word = {
  name: string;
  meanings: Meaning[];
};

export type Meaning = {
  word_type: string;
  ipa: IPA[];
  definition: string;
  level: string;
  examples: string[];
};

export type IPA = {
  region: string;
  pronunciation: string;
};
