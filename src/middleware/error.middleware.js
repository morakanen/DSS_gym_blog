export default (err, req, res, next) => {
    console.error(err.stack);
    
    if (req.originalUrl.startsWith('/auth')) {
      return handleAuthError(err, req, res);
    }
    
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Internal Server Error' 
    });
  };
  
  const handleAuthError = (err, req, res) => {
    const { email } = req.body;
    
    if (req.originalUrl.includes('login')) {
      return res.render('login', {
        error: err.message,
        title: 'Login Page',
        email: email || '',
        hcaptchatoken: process.env.HCAPTCHA_TOKEN || 'YOUR_SITE_KEY'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Authentication error' 
    });
  };