# Anonymous Suggestion Box

A modern, full-featured suggestion management system built with Next.js 15, Auth.js, MongoDB, and dynamic category management. Users can submit anonymous suggestions, and admins can manage them with real-time updates.

## ✨ Features

### 🔐 Authentication
- **Email/Password Authentication** with Auth.js
- **Role-based Access Control** (Admin/User)
- **Secure Password Hashing** with bcrypt
- **Session Management** with JWT

### 📝 Suggestion Management
- **Anonymous Submission** - Users can submit suggestions anonymously
- **Rich Form Validation** with Zod and React Hook Form
- **Real-time Updates** - 10-second polling for live data
- **Status Tracking** - Pending, Approved, Rejected, In Progress, Completed
- **Admin Notes** - Admins can add notes to suggestions
- **Email Notifications** - Admins receive email alerts when new suggestions are submitted

### 🏷️ Dynamic Category System
- **Admin Category Management** - Create, edit, delete categories
- **Custom Colors** - Each category has its own color
- **Active/Inactive Status** - Control which categories are available
- **Visual Indicators** - Color-coded category badges

### 📊 Dashboard & Analytics
- **Universal Dashboard** - Same view for all users
- **Real-time Statistics** - Live counts of suggestions by status
- **Quick Actions** - Admin controls for status changes
- **Visual Indicators** - Clear status summaries

### 🔄 Real-time Features
- **Auto-refresh** - Data updates every 10 seconds
- **Visual Feedback** - Loading indicators and status updates
- **Non-intrusive** - Background updates don't interrupt users

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Authentication**: Auth.js (NextAuth.js)
- **Database**: MongoDB with Mongoose ODM
- **Email**: Brevo (Sendinblue) for notifications
- **Validation**: Zod
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Styling**: Tailwind CSS

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/anonymous-suggestion-box.git
   cd anonymous-suggestion-box
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory. You can use the `env.example` file as a template:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/innovation-hub
   
   # Authentication
   AUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   
   # Azure AD / Microsoft Entra ID
   AZURE_AD_CLIENT_ID=your-client-id
   AZURE_AD_CLIENT_SECRET=your-client-secret
   AZURE_AD_TENANT_ID=your-tenant-id
   
   # Email Notifications (Optional)
   BREVO_API_KEY=xkeysib-YOUR_API_KEY_HERE
   ADMIN_NOTIFICATION_EMAIL=admin@yourcompany.com
   SENDER_EMAIL=noreply@yourcompany.com
   ```

4. **Generate AUTH_SECRET**
   ```bash
   # Option 1: Using Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Option 2: Using OpenSSL
   openssl rand -base64 32
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### 📧 Email Notifications Setup (Optional)

To enable email notifications when new suggestions are submitted:

1. **Create a Brevo account**
   - Sign up at [https://www.brevo.com/](https://www.brevo.com/)
   - Free tier includes 300 emails/day

2. **Get your API key**
   - Go to [https://app.brevo.com/settings/keys/api](https://app.brevo.com/settings/keys/api)
   - Create a new API key
   - Copy the key (starts with `xkeysib-`)

3. **Verify your sender email**
   - Go to [https://app.brevo.com/settings/domain](https://app.brevo.com/settings/domain)
   - Add and verify your sender email domain or single email

4. **Update your `.env.local` file**
   ```env
   BREVO_API_KEY=xkeysib-YOUR_API_KEY_HERE
   ADMIN_NOTIFICATION_EMAIL=admin@yourcompany.com
   SENDER_EMAIL=noreply@yourcompany.com
   ```

**Note**: Email notifications are optional. If `BREVO_API_KEY` is not set, the system will work normally without sending emails.

### 🎯 First Time Setup

1. **Create an Admin Account**
   - Go to `/create-admin`
   - Fill in admin details
   - This creates the first admin user

2. **Seed Default Categories** (Optional)
   - As an admin, you can create categories manually
   - Or use the API endpoint: `POST /api/admin/seed-categories`

3. **Start Using the System**
   - Regular users can submit suggestions
   - Admins can manage categories and suggestions

## 📁 Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── categories/    # Category CRUD operations
│   │   ├── suggestions/   # Suggestion CRUD operations
│   │   └── admin/         # Admin-specific endpoints
│   ├── auth/              # Auth pages (signin/signup)
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── SuggestionForm.tsx
│   ├── SuggestionList.tsx
│   ├── SuggestionCard.tsx
│   ├── SuggestionDashboard.tsx
│   └── CategoryManagement.tsx
├── lib/                   # Utilities and configurations
│   ├── auth.ts           # Auth.js configuration
│   ├── mongodb.ts        # Database connection
│   ├── validations.ts    # Zod schemas
│   └── models/           # Mongoose models
└── types/                # TypeScript type definitions
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

### Suggestions
- `GET /api/suggestions` - Fetch suggestions
- `POST /api/suggestions` - Create suggestion
- `GET /api/suggestions/[id]` - Fetch single suggestion
- `PUT /api/suggestions/[id]` - Update suggestion (admin)
- `DELETE /api/suggestions/[id]` - Delete suggestion (admin)
- `GET /api/suggestions/stats` - Fetch statistics

### Categories
- `GET /api/categories` - Fetch categories
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/[id]` - Update category (admin)
- `DELETE /api/categories/[id]` - Delete category (admin)

### Admin
- `POST /api/admin/create-admin` - Create admin account
- `POST /api/admin/seed-categories` - Seed default categories

## 🎨 Features in Detail

### Real-time Updates
- **10-second polling** ensures users always see the latest data
- **Visual indicators** show when data is being refreshed
- **Non-intrusive** background updates

### Category Management
- **Dynamic categories** managed by admins
- **Custom colors** for visual distinction
- **Active/inactive status** control
- **Real-time updates** when categories change

### Suggestion Workflow
1. **Submit** - Users submit suggestions with category selection
2. **Review** - Admins see suggestions in dashboard
3. **Manage** - Admins can approve, reject, or add notes
4. **Track** - Status changes are visible to all users

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
- **Netlify** - Static export with API routes
- **Railway** - Full-stack deployment
- **DigitalOcean** - VPS deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Auth.js](https://authjs.dev/) - Authentication
- [MongoDB](https://www.mongodb.com/) - Database
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide React](https://lucide.dev/) - Icons

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Built with ❤️ using Next.js, Auth.js, and MongoDB**