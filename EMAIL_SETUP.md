# Email Setup Instructions for React App

## Gmail Configuration (Recommended)

### 1. Enable 2-Factor Authentication
- Go to your Google Account settings
- Navigate to "Security" tab
- Enable "2-Step Verification"

### 2. Generate App Password
- In Google Account settings, go to "Security"
- Under "Signing in to Google", click "App passwords"
- Select "Mail" as the app and "Other" as the device
- Enter "Node.js App" as the device name
- Copy the generated 16-character password

### 3. Update Environment Variables
Update your `.env` file with:
```env
EMAIL_USER=your-actual-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

## Alternative Email Providers

### Outlook/Hotmail
```javascript
service: 'outlook'
// or
host: 'smtp-mail.outlook.com'
port: 587
secure: false
```

### Yahoo
```javascript
service: 'yahoo'
// or
host: 'smtp.mail.yahoo.com'
port: 587
secure: false
```

### Custom SMTP
```javascript
host: 'your-smtp-server.com'
port: 587
secure: false
auth: {
  user: 'your-email@domain.com',
  pass: 'your-password'
}
```

## Security Best Practices

1. **Never commit real credentials** to version control
2. **Use App Passwords** instead of actual email passwords
3. **Enable 2FA** on your email account
4. **Use environment variables** for all sensitive data
5. **Consider using email services** like SendGrid, Mailgun for production

## Testing the Email Functionality

1. Update your `.env` file with real credentials
2. Start your server: `npm start`
3. Register a new user from the frontend
4. Check your email for the welcome message

## Production Considerations

For production, consider using dedicated email services:
- **SendGrid**: Easy integration, good deliverability
- **Mailgun**: Robust API, detailed analytics  
- **AWS SES**: Cost-effective, scalable
- **Postmark**: Fast delivery, excellent reputation

## Email Templates Included

The service includes templates for:
- ✅ Welcome Email (registration)
- ✅ Password Reset Email
- ✅ Order Confirmation Email

## Troubleshooting

### "Invalid login" error:
- Make sure you're using App Password, not regular password
- Check if 2FA is enabled
- Verify EMAIL_USER and EMAIL_PASS in .env

### Emails not sending:
- Check server console for error messages
- Verify internet connection
- Test with a different email provider

### Emails going to spam:
- Use a professional from address
- Include proper HTML structure
- Consider using a dedicated email service