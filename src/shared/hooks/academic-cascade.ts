export const FILTER_DOWNSTREAM: Record<string, string[]> = {
  schoolYearId: ["gradeId", "shiftId", "sectionId"],
  levelId: ["gradeId", "shiftId", "sectionId"],
  gradeId: ["shiftId", "sectionId"],
  shiftId: ["sectionId"],
};

export const FORM_DOWNSTREAM: Record<string, string[]> = {
  schoolYearId: ["levelId", "gradeId", "shiftId", "sectionId"],
  levelId: ["gradeId", "shiftId", "sectionId"],
  gradeId: ["shiftId", "sectionId"],
  shiftId: ["sectionId"],
};
