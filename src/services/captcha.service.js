import { verify } from "hcaptcha";

export const verifyCaptcha = async (response) => {
  const verifyResult = await verify(process.env.HCAPTCHA_SECRET, response);
  return verifyResult;
};