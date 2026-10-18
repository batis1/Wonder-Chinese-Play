export function normalizeSentence(value) {
  return String(value || "").normalize("NFKC").replace(/[\s\p{P}\p{S}]/gu, "");
}

export function assessAnswer(question, key, answer) {
  if (!key || !String(answer || "").trim()) return null;
  if (key.kind === "choice") return { status: answer === key.correct ? "correct" : "incorrect", correct: key.correct };
  if (key.kind === "sentence") return {
    status: key.acceptedAnswers.some(reference => normalizeSentence(reference) === normalizeSentence(answer)) ? "correct" : "review",
    references: key.acceptedAnswers
  };
  return { status: "self-review", characters: String(answer).replace(/\s/g, "").length,
    missingWords: (question.wordBank || []).filter(word => !normalizeSentence(answer).includes(normalizeSentence(word))) };
}

export function summarizeAssessment(activity, questions, answerKey, answers) {
  const results = activity.questions.map(number => ({ kind: answerKey[number].kind, result: assessAnswer(questions[number], answerKey[number], answers[number]) }));
  const choices = results.filter(item => item.kind === "choice");
  return {
    correct: choices.filter(item => item.result?.status === "correct").length,
    total: choices.length,
    matchingSentences: results.filter(item => item.kind === "sentence" && item.result?.status === "correct").length,
    sentencesToReview: results.filter(item => item.kind === "sentence" && item.result?.status !== "correct").length,
    selfReview: results.filter(item => item.kind === "open").length
  };
}
