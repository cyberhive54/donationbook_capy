# Donation Book - Digital Khatabook

A complete digital khatabook web application for tracking festive donations, collections, and expenses in communities or hostels.

## Features

- 📊 **Dashboard**: View recent transactions, collections, and expenses
- 💰 **Collection Management**: Track donations with filtering, sorting, and detailed analytics
- 🛒 **Expense Management**: Record expenses with automatic calculations
- 📈 **Transaction History**: Combined view of all financial activities
- 👨‍💼 **Admin Panel**: Full CRUD operations with settings management
- 🔐 **Password Protection**: Secure access with user and admin authentication
- 📱 **Mobile-First Design**: Responsive UI that works on all devices
- 📉 **Data Visualization**: Interactive charts and graphs using Recharts

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Date Formatting**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)

### 1. Clone and Install

```bash
cd donation-book
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Copy the contents of `supabase-schema.sql` and run it in the SQL Editor
4. Get your project URL and anon key from Settings > API

### 3. Configure Environment Variables

Create/update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Default Credentials

- **User Password**: `Festive@123`
- **Admin Password**: `admin` (access via URL: `/admin?p=admin`)

You can change these in the Admin panel after logging in.

## Application Structure

### Pages

1. **Home (/)**: Dashboard with recent activity and statistics
2. **Collection (/collection)**: View and analyze all collections
3. **Expense (/expense)**: Manage and track expenses
4. **Transaction (/transaction)**: Combined view of collections and expenses
5. **Admin (/admin)**: Full CRUD operations and settings management

### Authentication

- **User Pages**: Protected by user password (stored in localStorage)
- **Admin Page**: Protected by admin password (URL query parameter + daily localStorage)

### Key Features

#### Collections
- Add multiple collections at once (up to 5)
- Filter by group and mode
- Sort by date, amount, or name
- View statistics with charts:
  - Collection vs Expense timeline
  - Collections by group (pie chart)
  - Collections by mode (pie chart)
  - Daily collection trends
  - Top 5 donators

#### Expenses
- Add multiple expenses at once (up to 10)
- Auto-calculate total amount (with manual override)
- Filter by category and mode
- Sort by date, amount, or item name
- View statistics with charts:
  - Collection vs Expense timeline
  - Expenses by category (pie chart)
  - Expenses by mode (pie chart)
  - Daily expense trends
  - Top 8 most expensive items

#### Admin Panel
- Edit basic event information
- Full CRUD on collections and expenses
- Manage groups, categories, and payment modes
- Update user password
- Real-time statistics

## Database Schema

### Tables

- `basic_info`: Event details (name, organiser, mentor, guide, date)
- `collections`: Donation records
- `expenses`: Expense records
- `groups`: Collection group names
- `categories`: Expense category names
- `collection_modes`: Payment modes for collections
- `expense_modes`: Payment modes for expenses
- `passwords`: User and admin passwords

## Customization

### Adding New Groups/Categories

Use the Admin panel to add, edit, or delete:
- Collection groups
- Expense categories
- Collection modes
- Expense modes

### Changing Passwords

1. Access Admin panel (`/admin?p=admin`)
2. Scroll to "User Password" section
3. Click Edit and enter new password

### Modifying Charts

Charts are built with Recharts. Edit components in `/components/charts/` to customize:
- Colors
- Data ranges
- Chart types
- Labels and formatting

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Deploy to Other Platforms

The app works on any platform supporting Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

Make sure to add your environment variables to the platform.

## Mobile Access

The app is fully responsive and works on mobile devices. Users can:
- View data on phones/tablets
- Use bottom navigation for easy access
- Filter and sort data
- View charts optimized for small screens

## Security Considerations

**Current Setup**: This app uses client-side password protection suitable for small communities/hostels.

**For Production**:
- Implement proper Supabase authentication
- Use server-side API routes
- Add row-level security policies
- Enable rate limiting
- Use environment variables for secrets

## Troubleshooting

### Supabase Connection Issues
- Verify `.env.local` has correct credentials
- Check Supabase project is active
- Ensure SQL schema was run successfully

### Password Not Working
- Default passwords: user=`Festive@123`, admin=`admin`
- Clear browser localStorage if issues persist
- Check passwords table in Supabase

### Charts Not Displaying
- Ensure data exists in collections/expenses
- Check browser console for errors
- Verify Recharts is installed

## Contributing

This is a complete application template. Feel free to:
- Fork and modify for your needs
- Add new features
- Improve the UI/UX
- Submit pull requests

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Supabase documentation
3. Check Next.js documentation

## Acknowledgments

Built with:
- Next.js by Vercel
- Supabase for backend
- Tailwind CSS for styling
- Recharts for visualizations
