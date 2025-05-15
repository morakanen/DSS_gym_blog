import helmet from 'helmet';

export const securityMiddleware = [
  helmet(),
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://hcaptcha.com', 'https://*.hcaptcha.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://hcaptcha.com', 'https://*.hcaptcha.com'],
      frameSrc: ["'self'", 'https://hcaptcha.com', 'https://*.hcaptcha.com'],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      upgradeInsecureRequests: []
    }
  }),
  helmet.referrerPolicy({ policy: 'same-origin' }),
  helmet.noSniff(),
  helmet.xssFilter(),
  (req, res, next) => {
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  }
];
