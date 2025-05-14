export const validateRegistration = (body) => {
    const { name, email, password } = body;
    
    if (!name || !email || !password) {
      throw new Error('All fields are required');
    }
    
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
  };
  
  export const validateLogin = (body) => {
    const { email, password, 'h-captcha-response': hcaptchaResponse } = body;
    
    if (!email || !password || !hcaptchaResponse) {
      throw new Error('All fields including CAPTCHA are required');
    }
  };