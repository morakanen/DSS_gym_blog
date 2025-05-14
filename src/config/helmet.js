export default {
    contentSecurityPolicy: {
      directives: {
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://www.google.com",
          "https://www.gstatic.com",
          "https://cdn.gingersoftware.com",
          "https://js.hcaptcha.com",
        ],
        frameSrc: ["'self'", "https://hcaptcha.com", "https://*.hcaptcha.com"],
      },
    }
  };