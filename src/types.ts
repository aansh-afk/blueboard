export type QuestionField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "checkbox-group" | "number";
  placeholder?: string;
  options?: string[];
};

export type QuestionSection = {
  id: string;
  title: string;
  helper: string;
  fields: Array<QuestionField>;
};

export type AnswerValue = string | number | Array<string> | null;
export type AnswersMap = Record<string, AnswerValue>;
