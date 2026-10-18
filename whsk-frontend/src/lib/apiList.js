// export const server = "http://localhost:5000";
// export const server = "https://selected-shirley-batis-9851f042.koyeb.app";
// export const server2 = "https://enchanted-stripe-swordtail.glitch.me";
// export const server = "https://perpetual-noon-curtain.glitch.me";
export const server = (typeof window !== "undefined" && window.__WHSK_API_BASE_URL__) || process.env.REACT_APP_API_BASE_URL || "/api";

const apiList = {
  signup: `${server}/user/signup`,
  login: `${server}/user/login`,
  user: `${server}/user`,
  score: `${server}/score`,
  questions: `${server}/questions`,
  words: `${server}/words`,
  lessons: `${server}/lessons`,
  workbook: `${server}/workbook/hsk5`,
  // upload: `${server}/upload`,
  upload: `${server}/user/uploadProfileImage`,
  tutor: `${server}/tutors`,
  hskWords: `${server}/hsk-words`,
  testHSKRoute: `${server}/hskgenerator/test`,
  // uploadHSKPDF: `${server}/hskgenerator/upload`,
  // ocr: {
  //   capture: `${server2}/ocr/capture`,
  //   upload: `${server2}/ocr/upload`
  // },
  googleLogin: `${server}/auth/google-login`,
};

export default apiList;
