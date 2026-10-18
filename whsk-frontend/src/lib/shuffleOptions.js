const shuffleOptions = (correctAnswer, incorrectAnswers) => {
  try {
    // Validate inputs
    if (!correctAnswer || !Array.isArray(incorrectAnswers) || incorrectAnswers.length === 0) {
      console.error("Invalid inputs to shuffleOptions:", { correctAnswer, incorrectAnswers });
      return [[], -1];
    }

    // Create array with all answers
    const allAnswers = [correctAnswer, ...incorrectAnswers];
    
    // Fisher-Yates shuffle
    for (let i = allAnswers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allAnswers[i], allAnswers[j]] = [allAnswers[j], allAnswers[i]];
    }

    // Find index of correct answer in shuffled array
    const correctIndex = allAnswers.indexOf(correctAnswer);

    if (correctIndex === -1) {
      console.error("Correct answer not found in shuffled array");
      return [[], -1];
    }

    return [allAnswers, correctIndex];
  } catch (error) {
    console.error("Error in shuffleOptions:", error);
    return [[], -1];
  }
};

export default shuffleOptions;
