# Contact Page Guide

## Overview
The contact page (`/contact`) provides a professional way for customers to get in touch with your business. It includes a contact form and company information.

## Features

### Contact Form
- **Name field** - Required, minimum 2 characters
- **Email field** - Required, must be valid email format
- **Subject field** - Required, minimum 5 characters  
- **Message field** - Required, minimum 10 characters
- **Form validation** using Zod schema
- **Loading states** and success/error messages

### Contact Information
- **Email**: mohamedelyesmoalla970@gmail.com (clickable mailto link)
- **Phone**: +216 XX XXX XXX (placeholder - update with real number)
- **Address**: Tunisia (placeholder - update with real address)
- **Business Hours**: Monday-Friday 9AM-6PM, Saturday 10AM-4PM, Sunday Closed

## How It Works

### Email Functionality
The contact form uses a `mailto:` link approach:
1. User fills out the form
2. Form validates input using Zod
3. Creates a formatted email with all form data
4. Opens the user's default email client (Gmail, Outlook, etc.)
5. Pre-fills the email with:
   - To: mohamedelyesmoalla970@gmail.com
   - Subject: [User's subject]
   - Body: Formatted message with name, email, and message

### Form Validation
- Real-time validation using React Hook Form + Zod
- Error messages display below each field
- Form won't submit until all validation passes

## Customization

### Update Contact Information
Edit the `contactInfo` array in `src/app/contact/page.tsx`:

```tsx
const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "your-email@domain.com",
    link: "mailto:your-email@domain.com",
  },
  {
    icon: Phone,
    title: "Phone",
    value: "+216 XX XXX XXX",
    link: "tel:+216XXXXXXXXX",
  },
  {
    icon: MapPin,
    title: "Address",
    value: "Your Address Here",
    link: "#",
  },
];
```

### Update Business Hours
Modify the business hours section in the component:

```tsx
<div className="space-y-2 text-gray-600">
  <div className="flex justify-between">
    <span>Monday - Friday</span>
    <span>Your Hours Here</span>
  </div>
  {/* Add more days as needed */}
</div>
```

### Change Email Destination
Update the email address in the `onSubmit` function:

```tsx
const mailtoLink = `mailto:your-new-email@domain.com?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(
  `Name: ${data.name}\nEmail: ${data.email}\n\nMessage:\n${data.message}`
)}`;
```

## Navigation
The contact page is accessible from:
- **Navbar**: Mail icon in the top navigation
- **Footer**: Two "Contact" links in the footer sections
- **Direct URL**: `/contact`

## Styling
- Uses Tailwind CSS for responsive design
- Blue color scheme matching your brand
- Mobile-first responsive design
- Smooth animations and transitions
- Professional form styling with focus states

## Future Enhancements
Consider adding:
- **Email API integration** (SendGrid, Mailgun, etc.) for server-side email sending
- **File uploads** for attachments
- **Contact preferences** (phone, email, preferred contact method)
- **FAQ section** to reduce contact volume
- **Live chat integration**
- **Contact form analytics** to track inquiries

## Dependencies
- `react-hook-form` - Form handling
- `@hookform/resolvers/zod` - Form validation
- `zod` - Schema validation
- `lucide-react` - Icons
