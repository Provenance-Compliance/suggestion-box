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
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/suggestion-box
   # or your MongoDB Atlas connection string
   AUTH_SECRET=your-secret-key-here
   AUTH_URL=http://localhost:3000
   NEXTAUTH_URL=http://localhost:3000
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