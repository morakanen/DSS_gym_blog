# DSS Gym Blog - Secure Fitness Blogging Platform

A secure gym blogging platform implementing modern security practices and features including 2FA, rate limiting, XSS protection, and more.

## Features

- 🔒 Two-Factor Authentication (2FA)
- 🛡️ XSS Protection
- 🚫 SQL Injection Prevention
- 🔑 CSRF Protection
- ⚡ Rate Limiting
- 📝 Input Validation
- 🔐 Secure Session Management

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn
- A hCaptcha account for CAPTCHA protection

## Environment Setup

1. Create a `.env` file in the root directory with:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dss_gym_blog"

# Session
SESSION_SECRET="your-secure-session-secret"

# Email (for 2FA)
SMTP_HOST="your-smtp-host"
SMTP_PORT=587
SMTP_USER="your-email@example.com"
SMTP_PASS="your-email-password"

# hCaptcha
HCAPTCHA_SECRET="your-hcaptcha-secret"
HCAPTCHA_SITEKEY="your-hcaptcha-sitekey"

# Node Environment
NODE_ENV="development"
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/DSS_gym_blog.git
cd DSS_gym_blog
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma migrate dev
```

4. Start the development server:
```bash
npm run dev
```

## Security Features Configuration

### 1. Content Security Policy
The CSP is configured in `src/middleware/security.js`. Modify the directives if you need to allow additional resources:

```javascript
helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://hcaptcha.com'],
    // ...
  }
})
```

### 2. Rate Limiting
Rate limits are configured in `src/middleware/rateLimit.js`. Adjust the windows and attempts as needed:

```javascript
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 attempts
});
```

### 3. Two-Factor Authentication
The 2FA system uses email-based verification. Configure your email settings in the `.env` file.

## Database Schema

The application uses Prisma with PostgreSQL. Key models include:

- Users
- Posts
- Comments
- Sessions

View the complete schema in `prisma/schema.prisma`.

## Testing

1. Run security tests:
```bash
npm run test:security
```

2. Run the test suite:
```bash
npm test
```

## Security Recommendations

1. Regularly update dependencies:
```bash
npm audit
npm update
```

2. Monitor security logs
3. Keep environment variables secure
4. Regularly backup the database
5. Use HTTPS in production

## Production Deployment

1. Set NODE_ENV to 'production'
2. Use a secure reverse proxy (e.g., Nginx)
3. Enable HTTPS
4. Set secure cookie options
5. Configure proper logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Security Issues

For security issues, please email security@yourdomain.com instead of creating a public issue.

libraries to install command 
npm install express pg body-parser bcrypt prisma path hcaptcha

git add .
git commit -m "your message"

git push


